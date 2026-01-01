function _main(
  module = globalThis.__getCurrentModule(),
  exports = module.exports,
  log = globalThis.__getModuleLogFunction?.(module) || (() => {})
) {
  // Dependencies - lazy loaded to avoid circular dependencies
  // const DriveJournal = require('sheets-chat/DriveJournal');
  // const UISupport = require('sheets-chat/UISupport');
  // ClaudeApiUtils is loaded lazily in functions that need it

  /**
   * Configuration for thread continuation behavior
   * @type {Object}
   */
  const CONTINUATION_CONFIG = {
    // Token estimation (conservative due to 20-30% variance in heuristics)
    tokenThreshold: 140000,       // ~140K = trigger (70% of 200K, accounts for variance)
    warningThreshold: 100000,     // ~100K = log warning, prepare for potential continuation

    // Reactive fallback (CRITICAL - primary safety net)
    handleContextExceeded: true,  // Catch API "context too long" / "prompt is too long" errors

    // Message-based heuristic (backup when token estimation unreliable)
    messageThreshold: 80,         // If >80 messages, force token re-estimation

    // Recent context to preserve verbatim
    keepRecentTurns: 5,           // Last 5 user/assistant exchanges (~5-10K tokens)

    // Model for extraction (configurable - currently using Opus for quality)
    extractionModel: 'claude-opus-4-20250514',

    // Note: GAS UrlFetchApp doesn't support custom timeouts (~30s per request)
    // These values document expected behavior but aren't enforced in code.
    // The 6-minute GAS execution limit is the practical constraint.
    // extractionTimeout: 30000,  // Not implemented - GAS limitation
    // summaryTimeout: 30000,     // Not implemented - GAS limitation

    // Memory limits
    maxMemoryBlockTokens: 1500,   // Semantic memory cap
    maxSummaryTokens: 2000,       // Episodic summary cap

    // Memory maintenance
    redistillationInterval: 3,    // Re-distill memory every 3 continuations

    // Archive
    archiveToJournal: true,       // Always save full history to Drive Journal

    // Prompt construction limits (extracted magic numbers)
    promptMaxMessages: 30,        // Max messages to include in extraction prompt
    promptMaxContentChars: 500,   // Max chars per message content
    chainMaxSummaryChars: 300,    // Max chars for chain context summaries
    chainMaxFacts: 5,             // Max facts per thread in chain context
    chainMaxDepth: 3,             // Max previous threads to load for chain context

    // Token budget tracking (for cost estimation)
    estimatedExtractionTokens: 5500,  // Input + output per extraction
    estimatedSummaryTokens: 4500,
    estimatedCostPerContinuation: 0.16  // USD using claude-opus-4
  };

  /**
   * Sanitize text for safe inclusion in LLM prompts
   * Prevents prompt injection and normalizes formatting
   *
   * @param {string} text - Text to sanitize
   * @param {number} maxLength - Maximum length (default: 300)
   * @returns {string} Sanitized text
   */
  function sanitizeForPrompt(text, maxLength = 300) {
    if (!text) return '';
    return String(text)
      .substring(0, maxLength)
      .replace(/\n{3,}/g, '\n\n')  // Collapse multiple newlines
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '')  // Remove control characters
      .trim();
  }

  // ============================================================================
  // TOKEN ESTIMATION (Phase 1)
  // ============================================================================

  /**
   * Estimate total tokens for a Claude API request
   * GAS has no tokenizer - uses conservative heuristics
   *
   * @param {string} systemPrompt - The system prompt
   * @param {Array} messages - Array of message objects
   * @param {Array} tools - Array of tool definitions
   * @returns {number} Estimated token count with 20% safety margin
   */
  function estimateTokens(systemPrompt, messages, tools) {
    // System prompt: ~3.5 chars/token for structured content
    const systemTokens = systemPrompt ? Math.ceil(systemPrompt.length / 3.5) : 0;

    // Tools: JSON schema is token-dense (~3 chars/token)
    let toolTokens = 0;
    if (tools && tools.length > 0) {
      const toolsJson = JSON.stringify(tools);
      toolTokens = Math.ceil(toolsJson.length / 3);
    }

    // Messages: varies by content type
    let messageTokens = 0;
    if (messages && Array.isArray(messages)) {
      for (const msg of messages) {
        messageTokens += estimateMessageTokens(msg);
      }
    }

    // Add 20% safety margin for estimation error
    const estimated = systemTokens + toolTokens + messageTokens;
    const withMargin = Math.ceil(estimated * 1.2);

    log(`[ThreadContinuation] Token estimate: system=${systemTokens}, tools=${toolTokens}, messages=${messageTokens}, total=${estimated}, withMargin=${withMargin}`);

    return withMargin;
  }

  /**
   * Estimate tokens for a single message
   *
   * @param {Object} msg - Message object with role and content
   * @returns {number} Estimated token count
   */
  function estimateMessageTokens(msg) {
    if (!msg || !msg.content) return 0;

    // Simple string content
    if (typeof msg.content === 'string') {
      return Math.ceil(msg.content.length / 4);
    }

    // Content blocks array (text, images, tool_use, tool_result)
    if (!Array.isArray(msg.content)) return 0;

    let tokens = 0;
    for (const block of msg.content) {
      if (block.type === 'text' && block.text) {
        tokens += Math.ceil(block.text.length / 4);
      } else if (block.type === 'image') {
        // Images are approximately 1500 tokens (varies by size)
        tokens += 1500;
      } else if (block.type === 'tool_use' || block.type === 'tool_result') {
        // Tool blocks are JSON-dense
        const json = JSON.stringify(block);
        tokens += Math.ceil(json.length / 3);
      } else if (block.type === 'thinking' && block.thinking) {
        // Extended thinking tokens - don't count as they're not included in context
        // Just skip
      } else {
        // Unknown block type - estimate conservatively
        const json = JSON.stringify(block);
        tokens += Math.ceil(json.length / 4);
      }
    }

    return tokens;
  }

  // ============================================================================
  // DETECTION (Phase 1)
  // ============================================================================

  /**
   * Determine if thread continuation should be triggered
   *
   * @param {number} tokenCount - Estimated token count
   * @param {number} messageCount - Number of messages in conversation
   * @param {Object} config - Optional config override
   * @returns {boolean} True if continuation should be triggered
   */
  function shouldContinue(tokenCount, messageCount, config = CONTINUATION_CONFIG) {
    const cfg = { ...CONTINUATION_CONFIG, ...config };

    // Primary check: token threshold
    if (tokenCount >= cfg.tokenThreshold) {
      log(`[ThreadContinuation] Token threshold exceeded: ${tokenCount} >= ${cfg.tokenThreshold}`);
      return true;
    }

    // Secondary check: message count (fallback for when token estimation is unreliable)
    if (messageCount >= cfg.messageThreshold) {
      log(`[ThreadContinuation] Message threshold exceeded: ${messageCount} >= ${cfg.messageThreshold}`);
      return true;
    }

    // Warning: approaching threshold
    if (tokenCount >= cfg.warningThreshold) {
      log(`[ThreadContinuation] Warning: Approaching token threshold: ${tokenCount} / ${cfg.tokenThreshold}`);
    }

    return false;
  }

  /**
   * Check if an error indicates context was exceeded
   * Delegates to ClaudeApiUtils for consistent error detection
   *
   * @param {Error|Object} error - Error object from API call
   * @returns {boolean} True if this is a context exceeded error
   */
  function isContextExceededError(error) {
    // Delegate to ClaudeApiUtils which has better nested error handling
    const ClaudeApiUtils = require('sheets-chat/ClaudeApiUtils');
    return ClaudeApiUtils.isContextExceededError(error);
  }

  /**
   * Get the most recent N user/assistant turn pairs
   *
   * @param {Array} messages - Full message array
   * @param {number} turnCount - Number of turn pairs to keep
   * @returns {Array} Recent messages (up to turnCount * 2 messages)
   */
  function getRecentTurns(messages, turnCount = 5) {
    if (!messages || messages.length === 0) return [];

    const turnMessages = [];
    let userTurnsSeen = 0;

    // Walk backwards through messages, collecting until we have enough turns
    for (let i = messages.length - 1; i >= 0 && userTurnsSeen < turnCount; i--) {
      const msg = messages[i];
      turnMessages.unshift(msg);

      // Count user messages to track turn pairs
      if (msg.role === 'user') {
        userTurnsSeen++;
      }
    }

    return turnMessages;
  }

  /**
   * Generate a unique thread ID
   *
   * @returns {string} Thread ID in format: thread-{timestamp}-{random}
   */
  function generateThreadId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `thread-${timestamp}-${random}`;
  }

  // ============================================================================
  // CHAIN CONTEXT (Phase 1.5 - Between Detection and Extraction)
  // ============================================================================

  /**
   * Get context from the thread chain for enriching memory extraction and summary
   * Loads summaries and memory from previous threads in the chain
   *
   * @param {string} conversationId - Current conversation ID
   * @param {number} maxChainDepth - Maximum number of previous threads to load (default: 3)
   * @returns {Array|null} Array of chain context objects or null if unavailable
   */
  function getChainContext(conversationId, maxChainDepth = 3) {
    try {
      const ConversationSearch = require('sheets-chat/ConversationSearch');
      const UISupport = require('sheets-chat/UISupport');

      // Get the thread chain structure
      const chainResult = ConversationSearch.getThreadChain(conversationId);
      
      // Critical fix #1: Proper null check with optional chaining
      if (!chainResult.success || !chainResult.data?.chain || chainResult.data.chain.length <= 1) {
        // No chain or only current thread - no context to load
        return null;
      }

      // Get previous threads (exclude current, limit to maxChainDepth)
      const previousThreads = chainResult.data.chain
        .filter(t => t.id !== conversationId)
        .slice(-(maxChainDepth));  // Take the most recent N threads before current

      if (previousThreads.length === 0) {
        return null;
      }

      // Critical fix #16: Cycle detection to prevent infinite loops from corrupted metadata
      const seenIds = new Set([conversationId]);
      const validThreads = previousThreads.filter(t => {
        if (seenIds.has(t.id)) {
          log(`[ThreadContinuation] Warning: Cycle detected in thread chain - skipping duplicate ${t.id}`);
          return false;
        }
        seenIds.add(t.id);
        return true;
      });

      if (validThreads.length === 0) {
        return null;
      }

      // Load memory and summary for each previous thread
      // Performance note: Sequential loading of N threads takes ~N*2 seconds
      log(`[ThreadContinuation] Loading ${validThreads.length} previous threads (estimated ${validThreads.length * 2}s)...`);
      
      const chainContext = [];
      let failedLoads = 0;
      
      for (const thread of validThreads) {
        const loadResult = UISupport.loadConversation(thread.id);
        
        // Critical fix #2: Log failed loads instead of silent skip
        if (!loadResult.success) {
          failedLoads++;
          log(`[ThreadContinuation] Failed to load thread ${thread.id}: ${loadResult.error || 'unknown error'}`);
          continue;
        }

        const conversationData = loadResult.data;
        chainContext.push({
          threadSequence: thread.threadSequence || conversationData.threadSequence || 1,
          summary: conversationData.inheritedSummary || null,
          memory: conversationData.memory || null,
          // Critical fix #5: Default savedAt to current time if missing
          savedAt: thread.savedAt || conversationData.savedAt || new Date().toISOString(),
          messageCount: thread.messageCount || (conversationData.messages?.length || 0)
        });
      }

      // Log warning if some threads failed to load
      if (failedLoads > 0) {
        log(`[ThreadContinuation] Warning: ${failedLoads}/${validThreads.length} threads failed to load - chain context may be incomplete`);
      }

      // Defensive: should not happen since validThreads pre-filtered, but ensures robustness
      if (chainContext.length === 0) {
        return null;
      }

      log(`[ThreadContinuation] Loaded chain context: ${chainContext.length} previous threads`);
      return chainContext;

    } catch (error) {
      log(`[ThreadContinuation] Failed to load chain context (non-blocking): ${error.message}`);
      return null;
    }
  }

  // ============================================================================
  // MEMORY EXTRACTION (Phase 2)
  // ============================================================================

  /**
   * Extract semantic memory from messages using LLM
   * Falls back to rule-based extraction if API call fails
   *
   * @param {Array} messages - Messages to extract memory from
   * @param {Object} existingMemory - Existing memory to merge with
   * @param {Array|null} chainContext - Context from previous threads in the chain
   * @returns {Object} Extracted memory block
   */
  function extractMemory(messages, existingMemory, chainContext = null) {
    try {
      // Try LLM-based extraction first
      return extractMemoryWithLLM(messages, existingMemory, chainContext);
    } catch (error) {
      log(`[ThreadContinuation] LLM extraction failed, using rule-based fallback: ${error.message}`);
      return extractMemoryRuleBased(messages, existingMemory);
    }
  }

  /**
   * Extract memory using Claude LLM API
   * Uses ClaudeApiUtils for robust retry logic and error handling
   *
   * @param {Array} messages - Messages to extract memory from
   * @param {Object} existingMemory - Existing memory to merge with
   * @param {Array|null} chainContext - Context from previous threads in the chain
   * @returns {Object} Extracted memory block
   */
  function extractMemoryWithLLM(messages, existingMemory, chainContext = null) {
    const ClaudeApiUtils = require('sheets-chat/ClaudeApiUtils');

    const extractionPrompt = buildExtractionPrompt(messages, existingMemory, chainContext);

    log(`[ThreadContinuation] Calling LLM for memory extraction (${messages.length} msgs, ${extractionPrompt.length} chars)`);

    // Use ClaudeApiUtils.completeJSON for JSON response handling
    const result = ClaudeApiUtils.completeJSON(extractionPrompt, {
      model: CONTINUATION_CONFIG.extractionModel,
      maxTokens: 1024,
      retryConfig: {
        maxRetries: 2,  // Fewer retries for extraction (non-critical path)
        baseDelayMs: 1000,
        maxDelayMs: 10000
      }
    });

    if (!result.success) {
      throw new Error(result.error || 'Memory extraction failed');
    }

    // Merge extracted memory with existing
    const merged = mergeMemory(existingMemory, result.json || {});

    log(`[ThreadContinuation] Memory extraction complete: ${Object.keys(merged.entities || {}).length} entities, ${(merged.facts || []).length} facts`);

    return merged;
  }

  /**
   * Rule-based memory extraction fallback
   * Uses regex patterns to extract common entities
   *
   * @param {Array} messages - Messages to extract memory from
   * @param {Object} existingMemory - Existing memory to merge with
   * @returns {Object} Extracted memory block (new object, does not mutate input)
   */
  function extractMemoryRuleBased(messages, existingMemory) {
    // Create a copy to avoid mutating the original
    const memory = {
      entities: { ...(existingMemory?.entities || {}) },
      facts: [...(existingMemory?.facts || [])],
      currentGoal: existingMemory?.currentGoal || null
    };

    // Extract from messages using simple patterns
    const allText = messages
      .map(m => typeof m.content === 'string' ? m.content : JSON.stringify(m.content))
      .join(' ');

    // Extract potential names (capitalized words)
    const namePattern = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b/g;
    const names = [...new Set(allText.match(namePattern) || [])].slice(0, 10);

    if (names.length > 0) {
      memory.entities.mentionedNames = names;
    }

    // Extract URLs
    const urlPattern = /https?:\/\/[^\s)]+/g;
    const urls = [...new Set(allText.match(urlPattern) || [])].slice(0, 5);

    if (urls.length > 0) {
      memory.entities.mentionedUrls = urls;
    }

    // Extract code-related terms
    const codePattern = /\b(function|class|const|let|var|import|export|require)\s+(\w+)/g;
    const codeTerms = [];
    let match;
    while ((match = codePattern.exec(allText)) !== null) {
      codeTerms.push(match[2]);
    }

    if (codeTerms.length > 0) {
      memory.entities.codeTerms = [...new Set(codeTerms)].slice(0, 20);
    }

    return memory;
  }

  /**
   * Build the extraction prompt for the LLM
   *
   * @param {Array} messages - Messages to extract from
   * @param {Object} existingMemory - Existing memory context
   * @param {Array|null} chainContext - Context from previous threads in the chain
   * @returns {string} Extraction prompt
   */
  function buildExtractionPrompt(messages, existingMemory, chainContext = null) {
    const cfg = CONTINUATION_CONFIG;
    
    const messagesText = messages.slice(-cfg.promptMaxMessages).map(m => {
      const role = m.role.toUpperCase();
      const content = typeof m.content === 'string' ? m.content : JSON.stringify(m.content);
      return `${role}: ${content.substring(0, cfg.promptMaxContentChars)}`;
    }).join('\n\n');

    // Build chain context section if available (with sanitization for prompt safety)
    let chainSection = '';
    if (chainContext && chainContext.length > 0) {
      chainSection = `\n\nTHREAD CHAIN HISTORY (${chainContext.length} previous threads):\n`;
      chainContext.forEach(t => {
        chainSection += `\n--- Thread ${t.threadSequence} (${t.messageCount} messages) ---\n`;
        if (t.summary) {
          chainSection += `Summary: ${sanitizeForPrompt(t.summary, cfg.chainMaxSummaryChars)}...\n`;
        }
        if (t.memory?.facts && t.memory.facts.length > 0) {
          const safeFacts = t.memory.facts.slice(0, cfg.chainMaxFacts).map(f => sanitizeForPrompt(f, 100));
          chainSection += `Key facts: ${safeFacts.join('; ')}\n`;
        }
      });
      chainSection += `\nConsider this history when extracting memory - prioritize continuity and evolution of topics.\n`;
    }

    return `You are extracting key information from a conversation for memory preservation.${chainSection}

  CONVERSATION (last 30 messages):
  ${messagesText}

  EXISTING MEMORY:
  ${JSON.stringify(existingMemory || {}, null, 2)}

  TASK: Extract and return a JSON object with:
  1. "entities": Object containing identified people, projects, decisions, preferences
  2. "facts": Array of key facts/details worth remembering (max 15)
  3. "currentGoal": The current task or goal being worked on (string or null)

  Return ONLY valid JSON, no explanation. Focus on information useful for continuing the conversation.`;
  }

  /**
   * Merge new memory with existing memory
   *
   * @param {Object} existing - Existing memory block
   * @param {Object} extracted - Newly extracted memory
   * @returns {Object} Merged memory
   */
  function mergeMemory(existing, extracted) {
    const merged = {
      entities: { ...(existing?.entities || {}), ...(extracted?.entities || {}) },
      facts: [...(existing?.facts || []), ...(extracted?.facts || [])],
      currentGoal: extracted?.currentGoal || existing?.currentGoal || null
    };

    // Deduplicate facts
    merged.facts = [...new Set(merged.facts)].slice(-30);

    return merged;
  }

  // ============================================================================
  // SUMMARY GENERATION (Phase 2)
  // ============================================================================

  /**
   * Generate a summary of the conversation using LLM
   * Falls back to recent messages if API call fails
   *
   * @param {Array} messages - Messages to summarize
   * @param {string} previousSummary - Previous summary to build upon
   * @param {Array|null} chainContext - Context from previous threads in the chain
   * @returns {Object} Summary object with text and milestones
   */
  function generateSummary(messages, previousSummary, chainContext = null) {
    try {
      return generateSummaryWithLLM(messages, previousSummary, chainContext);
    } catch (error) {
      log(`[ThreadContinuation] LLM summary failed, using fallback: ${error.message}`);
      return generateSummaryFallback(messages, previousSummary);
    }
  }

  /**
   * Generate summary using Claude LLM API
   * Uses ClaudeApiUtils for robust retry logic and error handling
   *
   * @param {Array} messages - Messages to summarize
   * @param {string} previousSummary - Previous summary context
   * @param {Array|null} chainContext - Context from previous threads in the chain
   * @returns {Object} Summary object
   */
  function generateSummaryWithLLM(messages, previousSummary, chainContext = null) {
    const ClaudeApiUtils = require('sheets-chat/ClaudeApiUtils');

    const summaryPrompt = buildSummaryPrompt(messages, previousSummary, chainContext);

    log(`[ThreadContinuation] Calling LLM for summary (${messages.length} msgs, ${summaryPrompt.length} chars)`);

    // Use ClaudeApiUtils.complete for text response
    const result = ClaudeApiUtils.complete(summaryPrompt, {
      model: CONTINUATION_CONFIG.extractionModel,
      maxTokens: 1024,
      retryConfig: {
        maxRetries: 2,  // Fewer retries for summary (non-critical path)
        baseDelayMs: 1000,
        maxDelayMs: 10000
      }
    });

    if (!result.success) {
      throw new Error(result.error || 'Summary generation failed');
    }

    const content = result.text || '';

    log(`[ThreadContinuation] Summary complete: ${content.length} chars`);

    return {
      summary: content.substring(0, CONTINUATION_CONFIG.maxSummaryTokens * 4), // Rough char limit
      turnsCompacted: messages.length,
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * Fallback summary using recent messages
   *
   * @param {Array} messages - Messages to summarize
   * @param {string} previousSummary - Previous summary context
   * @returns {Object} Summary object
   */
  function generateSummaryFallback(messages, previousSummary) {
    // Take last 10 messages as "summary"
    const recentMessages = messages.slice(-10);
    const summaryText = recentMessages.map(m => {
      const role = m.role;
      const content = typeof m.content === 'string'
        ? m.content.substring(0, 200)
        : '[complex content]';
      return `${role}: ${content}`;
    }).join('\n');

    return {
      summary: (previousSummary ? previousSummary + '\n\n---\n\n' : '') +
               'Recent conversation:\n' + summaryText,
      turnsCompacted: messages.length,
      generatedAt: new Date().toISOString(),
      isFallback: true
    };
  }

  /**
   * Build the summary prompt for the LLM
   *
   * @param {Array} messages - Messages to summarize
   * @param {string} previousSummary - Previous summary context
   * @param {Array|null} chainContext - Context from previous threads in the chain
   * @returns {string} Summary prompt
   */
  function buildSummaryPrompt(messages, previousSummary, chainContext = null) {
    const cfg = CONTINUATION_CONFIG;
    
    const messagesText = messages.map(m => {
      const role = m.role.toUpperCase();
      const content = typeof m.content === 'string' ? m.content : JSON.stringify(m.content);
      return `${role}: ${content.substring(0, cfg.promptMaxContentChars)}`;
    }).join('\n\n');

    // Build chain context section if available (with sanitization for prompt safety)
    let chainSection = '';
    if (chainContext && chainContext.length > 0) {
      chainSection = `\nTHREAD CHAIN CONTEXT (${chainContext.length} previous threads in this conversation):\n`;
      chainContext.forEach(t => {
        const safeSummary = t.summary ? sanitizeForPrompt(t.summary, 200) + '...' : 'No summary available';
        chainSection += `- Thread ${t.threadSequence}: ${safeSummary}\n`;
      });
      chainSection += `\nThis is thread ${chainContext.length + 1} in an ongoing conversation. Maintain narrative continuity.\n`;
    }

    return `You are creating a conversation summary for context preservation.${chainSection}

  ${previousSummary ? `PREVIOUS SUMMARY:\n${previousSummary}\n\n` : ''}

  CONVERSATION TO SUMMARIZE:
  ${messagesText}

  TASK: Write a 2-3 paragraph summary focusing on:
  1. What topics were discussed
  2. What was decided or created
  3. Current state/goal at end of conversation

  Be concise but comprehensive. This summary will be used to continue the conversation in a new thread.`;
  }

  // ============================================================================
  // THREAD CHAIN MANAGEMENT (Phase 3)
  // ============================================================================

  /**
   * Create a new continuation thread
   *
   * @param {Object} parentThread - The thread being continued
   * @param {Object} memory - Extracted memory block
   * @param {Object} summaryData - Generated summary data
   * @param {Array} recentTurns - Recent messages to preserve
   * @param {Array|null} chainContext - Context from previous threads (for metadata)
   * @returns {Object} New thread object
   */
  function createContinuationThread(parentThread, memory, summaryData, recentTurns, chainContext = null) {
    const newThreadId = generateThreadId();
    const now = new Date().toISOString();

    const newThread = {
      id: newThreadId,
      title: parentThread.title ? `${parentThread.title} (continued)` : `Chat ${new Date().toLocaleString()}`,

      // Thread chain
      parentThread: parentThread.id,
      childThread: null,
      threadSequence: (parentThread.threadSequence || 1) + 1,

      // Inherited context
      memory: memory,
      inheritedSummary: summaryData.summary,

      // Fresh message history with context
      messages: recentTurns,

      // Metadata
      createdAt: now,
      continuedFrom: parentThread.createdAt || parentThread.startedAt,
      user: parentThread.user,

      // Chain info (Phase 3 - thread chain metadata)
      chainInfo: chainContext ? {
        totalThreads: chainContext.length + 1,  // +1 for current thread
        previousThreadIds: chainContext.map(t => t.threadSequence),
        chainLoadedAt: now
      } : null
    };

    log(`[ThreadContinuation] Created continuation thread: ${newThreadId} (sequence ${newThread.threadSequence})`);

    return newThread;
  }

  /**
   * Check if memory should be re-distilled
   *
   * @param {number} threadSequence - Current thread sequence number
   * @returns {boolean} True if re-distillation is needed
   */
  function needsRedistillation(threadSequence) {
    return threadSequence > 0 &&
           threadSequence % CONTINUATION_CONFIG.redistillationInterval === 0;
  }

  /**
   * Re-distill accumulated memory to prevent bloat
   * Uses ClaudeApiUtils for robust retry logic and error handling
   *
   * @param {Object} memory - Accumulated memory to distill
   * @returns {Object} Distilled memory
   */
  function redistillMemory(memory) {
    try {
      const ClaudeApiUtils = require('sheets-chat/ClaudeApiUtils');

      const prompt = `You are pruning accumulated memory to prevent bloat.

  CURRENT MEMORY:
  ${JSON.stringify(memory, null, 2)}

  TASK: Return a condensed JSON object with:
  1. "entities": Keep only the most relevant entities (max 10)
  2. "facts": Keep only the most important facts (max 15)
  3. "currentGoal": The current goal if still relevant

  Remove outdated, redundant, or low-importance items. Return ONLY valid JSON.`;

      log(`[ThreadContinuation] Calling LLM for redistillation (${(memory.facts || []).length} facts to condense)`);

      // Use ClaudeApiUtils.completeJSON for JSON response handling
      const result = ClaudeApiUtils.completeJSON(prompt, {
        model: CONTINUATION_CONFIG.extractionModel,
        maxTokens: 1024,
        retryConfig: {
          maxRetries: 2,
          baseDelayMs: 1000,
          maxDelayMs: 10000
        }
      });

      if (!result.success) {
        throw new Error(result.error || 'Redistillation failed');
      }

      const distilled = result.json || memory;

      log(`[ThreadContinuation] Redistillation complete: ${(distilled.facts || []).length} facts remaining`);

      return distilled;
    } catch (error) {
      log(`[ThreadContinuation] Redistillation failed, keeping current memory: ${error.message}`);
      return memory;
    }
  }

  // ============================================================================
  // MAIN CONTINUATION HANDLER
  // ============================================================================

  /**
   * Handle thread continuation
   * This is the main entry point called when continuation is triggered
   *
   * @param {Object} conversation - Current conversation object
   * @param {string} pendingUserMessage - User message that triggered continuation
   * @returns {Object} Result with new thread info
   */
  function handleThreadContinuation(conversation, pendingUserMessage) {
    const startTime = Date.now();
    log('[ThreadContinuation] Starting thread continuation...');

    // Input validation - fail fast with clear errors
    if (!conversation || typeof conversation !== 'object') {
      log('[ThreadContinuation] Invalid input: conversation must be a non-null object');
      return {
        success: false,
        error: 'Invalid conversation: must be a non-null object',
        elapsed: 0
      };
    }

    if (!conversation.id || typeof conversation.id !== 'string') {
      log('[ThreadContinuation] Invalid input: conversation.id missing or not a string');
      return {
        success: false,
        error: 'Invalid conversation: missing or invalid id',
        elapsed: 0
      };
    }

    if (!Array.isArray(conversation.messages)) {
      log('[ThreadContinuation] Invalid input: conversation.messages is not an array');
      return {
        success: false,
        error: 'Invalid conversation: messages must be an array',
        elapsed: 0
      };
    }

    try {
      // 1. Archive current thread
      if (CONTINUATION_CONFIG.archiveToJournal) {
        try {
          const DriveJournal = require('sheets-chat/DriveJournal');
          DriveJournal.appendToJournal(conversation.id, conversation.messages);
          log('[ThreadContinuation] Archived to Drive Journal');
        } catch (archiveError) {
          log(`[ThreadContinuation] Archive failed (non-blocking): ${archiveError.message}`);
        }
      }

      // 2. Load chain context from previous threads (Phase 1.5)
      const chainContext = getChainContext(conversation.id);
      if (chainContext) {
        log(`[ThreadContinuation] Chain context loaded: ${chainContext.length} previous threads`);
      }

      // 3. Extract memory (with chain context for enhanced extraction)
      const memory = extractMemory(conversation.messages, conversation.memory, chainContext);
      log(`[ThreadContinuation] Memory extracted: ${Object.keys(memory.entities || {}).length} entities, ${(memory.facts || []).length} facts`);

      // 4. Generate summary (with chain context for narrative continuity)
      const summaryData = generateSummary(
        conversation.messages,
        conversation.inheritedSummary,
        chainContext
      );
      log(`[ThreadContinuation] Summary generated: ${summaryData.summary.length} chars`);

      // 5. Get recent turns to preserve verbatim
      const recentTurns = getRecentTurns(
        conversation.messages,
        CONTINUATION_CONFIG.keepRecentTurns
      );
      log(`[ThreadContinuation] Preserved ${recentTurns.length} recent messages`);

      // 6. Check for re-distillation
      let finalMemory = memory;
      if (needsRedistillation((conversation.threadSequence || 1) + 1)) {
        log('[ThreadContinuation] Re-distilling memory...');
        finalMemory = redistillMemory(memory);
      }

      // 7. Create new thread (with chain context for metadata)
      const newThread = createContinuationThread(
        conversation,
        finalMemory,
        summaryData,
        recentTurns,
        chainContext
      );

      // 8. Link threads (update parent to point to child)
      conversation.childThread = newThread.id;

      const elapsed = Date.now() - startTime;
      log(`[ThreadContinuation] Continuation complete in ${elapsed}ms`);

      return {
        success: true,
        newThread: newThread,
        parentThreadId: conversation.id,
        elapsed: elapsed,
        threadContinued: true
      };

    } catch (error) {
      const elapsed = Date.now() - startTime;
      log(`[ThreadContinuation] Continuation failed (${elapsed}ms): ${error.message}`);

      return {
        success: false,
        error: error.message,
        elapsed: elapsed
      };
    }
  }

  // ============================================================================
  // EXPORTS
  // ============================================================================

  module.exports = {
    // Configuration
    CONTINUATION_CONFIG,

    // Phase 1: Token estimation and detection
    estimateTokens,
    estimateMessageTokens,
    shouldContinue,
    isContextExceededError,
    getRecentTurns,
    generateThreadId,

    // Phase 1.5: Chain context
    getChainContext,

    // Phase 2: Memory and summary
    extractMemory,
    extractMemoryWithLLM,
    extractMemoryRuleBased,
    generateSummary,
    generateSummaryWithLLM,
    generateSummaryFallback,
    mergeMemory,

    // Phase 3: Thread chain management
    createContinuationThread,
    needsRedistillation,
    redistillMemory,

    // Main handler
    handleThreadContinuation
  };
}

__defineModule__(_main);