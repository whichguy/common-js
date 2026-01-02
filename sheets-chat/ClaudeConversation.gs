/**
   * ClaudeConversation - Standalone class for Claude API conversations
   * Supports multimodal inputs (text, attachments), extended thinking, and tool calls
   * Stateless - all conversation state managed by caller
   * Auto-instantiates tools, handles thinking queue, and manages sequence IDs
   * 
   * SIMPLE USAGE:
   * const claude = new ClaudeConversation();
   * const result = claude.sendMessage({ messages: [], text: 'Hello Claude!' });
   */

  class ClaudeConversation {
    constructor(apiKey, model = null) {
      // Auto-require Code module for infrastructure
      const UISupport = require('sheets-chat/UISupport');
      this._UISupport = UISupport;
      
      // Use provided API key or get from Code
      this.apiKey = apiKey || UISupport.getApiKey();
      
      this.apiUrl = 'https://api.anthropic.com/v1/messages';
      
      // Read model from constructor param, ConfigManager, or use default
      if (model) {
        this.model = model;
      } else {
        const ConfigManager = require('gas-properties/ConfigManager');
        const config = new ConfigManager('CLAUDE_CHAT');
        this.model = config.get('MODEL_NAME') || 'claude-haiku-4-5-20251001';
      }
      
      this.thinkingBudget = 128000; // Maximum thinking token budget for extended thinking
      
      // Models that support extended thinking (dynamically checked)
      this.thinkingSupportedModels = [
        'claude-sonnet-4',
        'claude-opus-4',
        'claude-3-7-sonnet',
        'claude-3-5-sonnet'
        // Haiku models do NOT support thinking
      ];
      
      // Auto-instantiate ToolRegistry with all tools enabled
      const ToolRegistry = require('tools/ToolRegistry');
      this._toolRegistry = new ToolRegistry({
        enableExec: true,
        enableSearch: true,
        enableKnowledge: true,
        enablePrompt: true,
        enableAnalyzeUrl: true
      });
      
      // Pre-load SystemPrompt module to avoid timing issues
      const SystemPrompt = require('sheets-chat/SystemPrompt');
      this._SystemPrompt = SystemPrompt;
    }

    /**
     * Send a message to Claude API
     * SIMPLIFIED - No need to pass onThinking, sequenceId, or manage infrastructure
     * 
     * @param {Object} params - Message parameters
     * @param {Array} params.messages - Conversation history (pass empty [] for new conversation, or result.threadHistorySnippet from previous turn)
     * @param {string} params.text - Text prompt to send
     * @param {string} params.system - System prompt for Claude (optional)
     * @param {Object} params.context - Execution context (depth, maxDepth, toolsEnabled, toolState)
     * @param {Array} params.attachments - Array of attachments:
     *   - Image/PDF: {data: base64String, mediaType: 'image/png|jpeg|gif|webp|application/pdf'}
     *   - URL fetch: {type: 'fetchUrl', url: 'https://...'}
     * @param {number} params.maxTokens - Max response tokens (default 4096)
     * @param {boolean} params.enableThinking - Enable extended thinking (default true)
     * @returns {Object} Result object containing:
     *   - response: String - Text response from Claude
     *   - message: Object - Assistant message object {role, content}
     *   - messages: Array - Full conversation history (backward compatibility)
     *   - threadHistorySnippet: Array - Delta from this turn only (use for next turn)
     *   - usage: Object - Token usage statistics
     *   - thinkingMessages: Array - Extended thinking content
     *   - toolUses: Array - Tool calls made (if any)
     *   - sequenceId: String - Message sequence ID
     *   - context: Object - Updated execution context
     * 
     * @example
     * // Single-turn conversation
     * const result = conversation.sendMessage({
     *   messages: [],
     *   text: 'What is 2+2?'
     * });
     * 
     * @example
     * // Multi-turn conversation using threadHistorySnippet
     * const turn1 = conversation.sendMessage({
     *   messages: [],
     *   text: 'Remember the number 42'
     * });
     * 
     * const turn2 = conversation.sendMessage({
     *   messages: turn1.threadHistorySnippet,  // Pass snippet from previous turn
     *   text: 'What number did I ask you to remember?'
     * });
     * // Claude responds: "You asked me to remember 42"
     * 
     * @example
     * // With image attachment
     * const result = conversation.sendMessage({
     *   messages: [],
     *   text: 'What color is this?',
     *   attachments: [{
     *     data: imageBase64,
     *     mediaType: 'image/png'
     *   }]
     * });
     * 
     * @example
     * // With URL fetch (server-side)
     * const result = conversation.sendMessage({
     *   messages: [],
     *   text: 'Summarize this page',
     *   attachments: [{
     *     type: 'fetchUrl',
     *     url: 'https://example.com'
     *   }]
     * });
     */
    sendMessage(params) {
      const {
        messages = [],
        text,
        system = null,
        context = {},
        attachments = [],
        maxTokens,  // Unused - API uses defaults
        enableThinking = true,
        requestId,
        sequenceId,
        model = null  // Optional per-message model override
      } = params;
      
      // Use provided model or fall back to constructor's model
      const modelToUse = model || this.model;
      
      // Check if model supports thinking (Haiku models don't)
      const modelSupportsThinking = this._modelSupportsThinking(modelToUse);
      const useThinking = enableThinking && modelSupportsThinking;
      
      if (enableThinking && !modelSupportsThinking) {
        log(`[ClaudeConversation] Model ${modelToUse} does not support thinking - disabling`);
      }

      // Channel clearing is now handled per-request in sendMessageToClaude()
      // Each request has its own channel (thinking-${requestId})

      // Extract depth from context
      const depth = context.depth || 0;

      // Auto-inject system prompt with knowledge at depth 0 if not provided
      let systemPrompt = system;
      if (!systemPrompt && depth === 0) {
        const knowledge = this._loadKnowledge();
        systemPrompt = this._buildSystemPrompt(knowledge);
      }

      // Use passed sequence ID or auto-generate if not provided
      const messageSequenceId = sequenceId || this._UISupport.getNextSequenceId();
      
      // Auto-setup thinking callback to store messages with requestId
      const onThinking = (text, seqId) => {
        this._UISupport.storeThinkingMessage(text, seqId, requestId);
      };

      // Track what we add this turn (for snippet)
      const snippet = [];

      // Build content array for this message
      const content = [];

      // Add text if provided (and not empty)
      if (text && text.trim()) {
        content.push({
          type: 'text',
          text: text
        });
      }

      // Add attachments (unified handling for images, PDFs, etc.)
      attachments.forEach(att => {
        if (att.data && att.mediaType) {
          if (att.mediaType.startsWith('image/')) {
            // Image attachment
            content.push({
              type: 'image',
              source: {
                type: 'base64',
                media_type: att.mediaType,
                data: att.data
              }
            });
          } else if (att.mediaType === 'application/pdf') {
            // PDF attachment
            content.push({
              type: 'document',
              source: {
                type: 'base64',
                media_type: att.mediaType,
                data: att.data
              }
            });
          }
        }
      });

      // Add new user message to conversation history
      const userMsg = {
        role: 'user',
        content: content
      };
      const updatedMessages = [...messages, userMsg];
      snippet.push(userMsg);  // Track user message in snippet

      // Get tools based on context.toolsEnabled or all enabled tools
      const toolsToUse = context.toolsEnabled 
        ? this._getFilteredTools(context.toolsEnabled)
        : this._toolRegistry.getEnabledTools();

      // Build API request with tools
      // max_tokens must be > thinking.budget_tokens when thinking is enabled
      const requestBody = {
        model: modelToUse,
        messages: updatedMessages,
        max_tokens: useThinking ? 140000 : 4096,
        tools: toolsToUse
      };

      // Add system prompt if available
      if (systemPrompt) {
        requestBody.system = systemPrompt;
      }

      // Add extended thinking if enabled AND model supports it
      if (useThinking) {
        requestBody.thinking = {
          type: 'enabled',
          budget_tokens: this.thinkingBudget
        };
      }

      // Make API request
      const options = {
        method: 'post',
        contentType: 'application/json',
        headers: {
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01'
        },
        payload: JSON.stringify(requestBody),
        muteHttpExceptions: true
      };

      // Diagnostic logging for debugging 400 errors
      log('[API_REQUEST] Model: ' + requestBody.model);
      log('[API_REQUEST] Messages count: ' + requestBody.messages.length);
      // max_tokens not set - API uses defaults
      log('[API_REQUEST] Tools count: ' + (requestBody.tools ? requestBody.tools.length : 0));
      log('[API_REQUEST] System prompt length: ' + (requestBody.system ? requestBody.system.length : 0) + ' chars');
      log('[API_REQUEST] Has thinking: ' + (requestBody.thinking ? 'yes' : 'no'));
      if (requestBody.messages.length > 0) {
        const lastMsg = requestBody.messages[requestBody.messages.length - 1];
        log('[API_REQUEST] Last message role: ' + lastMsg.role);
        log('[API_REQUEST] Last message content blocks: ' + (Array.isArray(lastMsg.content) ? lastMsg.content.length : 'not array'));
        if (Array.isArray(lastMsg.content) && lastMsg.content.length > 0) {
          log('[API_REQUEST] First content block type: ' + lastMsg.content[0].type);
          if (lastMsg.content[0].type === 'text') {
            log('[API_REQUEST] Text length: ' + (lastMsg.content[0].text ? lastMsg.content[0].text.length : 0) + ' chars');
            log('[API_REQUEST] Text preview: ' + (lastMsg.content[0].text ? lastMsg.content[0].text.substring(0, 200) : ''));
          }
        }
      }

  // Check for control messages (cancel, pause, etc.)
  try {
    if (typeof checkControlMessages === 'function') {
      checkControlMessages();
    }
  } catch (error) {
    // Handle cancellation gracefully
    if (error.name === 'CancelledError') {
      log('[ClaudeConversation] Request cancelled: ' + error.message);
      return {
        success: false,
        cancelled: true,
        error: error.message,
        messages: messages,
        thinkingMessages: [],
        usage: {input_tokens: 0, output_tokens: 0}
      };
    }
    // Re-throw other errors
    throw error;
  }
  
      const response = UrlFetchApp.fetch(this.apiUrl, options);
      const statusCode = response.getResponseCode();
      const responseText = response.getContentText();

      if (statusCode !== 200) {
        // Log FULL error details for debugging
        log('[API_ERROR] Status: ' + statusCode);
        log('[API_ERROR] Full response: ' + responseText);
        throw new Error(`Claude API error (${statusCode}): ${responseText}`);
      }

      const result = JSON.parse(responseText);

      // Extract thinking messages
      const thinkingMessages = [];
      const contentBlocks = [];
      const toolUses = [];

      if (result.content && Array.isArray(result.content)) {
        result.content.forEach(block => {
          if (block.type === 'thinking') {
            thinkingMessages.push(block.thinking);
            // Auto-store thinking via callback
            log('[THINKING] ' + block.thinking);
            if (onThinking) {
              onThinking(block.thinking, messageSequenceId);
            }
          } else if (block.type === 'text') {
            contentBlocks.push(block.text);
          } else if (block.type === 'tool_use') {
            toolUses.push({
              id: block.id,
              name: block.name,
              input: block.input
            });
          }
        });
      }

      // Add assistant response to messages
      const assistMsg = {
        role: 'assistant',
        content: result.content
      };
      updatedMessages.push(assistMsg);
      
      // For snippet: Filter out thinking-only messages
      // Only include messages that have non-thinking content (text, tool_use, etc.)
      const hasNonThinkingContent = result.content.some(block => 
        block.type !== 'thinking'
      );
      
      if (hasNonThinkingContent) {
        // Create filtered version for snippet (no thinking blocks)
        const filteredContent = result.content.filter(block => 
          block.type !== 'thinking'
        );
        
        const snippetMsg = {
          role: 'assistant',
          content: filteredContent
        };
        snippet.push(snippetMsg);  // Track assistant message in snippet (filtered)
      }
      // If message is thinking-only, don't add to snippet at all

      // Auto-execute tools if present
      if (toolUses.length > 0 && this._toolRegistry) {
        // Emit [REGISTRY] log once at start of tool execution
        const enabledToolNames = this._toolRegistry.getEnabledToolNames().join(',');
        log(`[REGISTRY] Initialized: tools=${enabledToolNames}`);
        
        const toolResults = toolUses.map(toolUse => {
          // Emit [TOOL_START] log
          const startTime = new Date().getTime();
          log(`[TOOL_START] tool=${toolUse.name} timestamp=${startTime}`);
          
          // Log exec code if it's an exec tool
          if (toolUse.name === 'exec' && toolUse.input.jsCode) {
            log(`[EXEC_CODE] ${toolUse.input.jsCode}`);
          }
          
          // Execute tool with context
          let toolResult;
          let success = true;
          try {
            toolResult = this._toolRegistry.executeToolCall(toolUse.name, toolUse.input, {
              ...context,
              think: (msg) => {
                if (onThinking) {
                  onThinking(msg, messageSequenceId);
                }
              }
            });
            success = toolResult.success !== false;
          } catch (error) {
            toolResult = {
              success: false,
              error: error.toString(),
              message: error.message,
              stack: error.stack,
              name: error.name
            };
            success = false;
          }
          
          // Emit [TOOL_END] log with timing
          const endTime = new Date().getTime();
          const duration = endTime - startTime;
          log(`[TOOL_END] tool=${toolUse.name} duration=${duration}ms success=${success} timestamp=${endTime}`);
          
          // Log [SENSITIVE] for successful exec tool results - NO TRUNCATION
          if (success && toolUse.name === 'exec' && toolResult.result !== undefined) {
            const resultJson = JSON.stringify(toolResult.result);
            log(`[SENSITIVE] ${resultJson}`);
          }
          
          // Unwrap successful results - send just the result to Claude, not the wrapper
          let contentForClaude;
          if (toolResult.success === true && toolResult.result !== undefined) {
            // Success: send just the result as JSON string
            contentForClaude = JSON.stringify(toolResult.result);
          } else if (toolResult.success === false) {
            // Error: send error details as JSON
            contentForClaude = JSON.stringify({
              error: toolResult.error,
              message: toolResult.message,
              name: toolResult.name
            });
          } else {
            // Fallback: send entire result
            contentForClaude = JSON.stringify(toolResult);
          }
          
          return {
            tool_use_id: toolUse.id,
            content: contentForClaude
          };
        });
        
        // Automatically send tool results and get final response
        return this._sendToolResults(updatedMessages, toolResults, snippet, onThinking, messageSequenceId, systemPrompt, context, toolsToUse, modelToUse, useThinking);
      }

      return {
        response: contentBlocks.join('\n'),
        message: {
          role: 'assistant',
          content: result.content
        },
        messages: updatedMessages,  // Full conversation (backward compat)
        threadHistorySnippet: snippet,  // Delta from this turn
        usage: result.usage,
        thinkingMessages: thinkingMessages,
        toolUses: toolUses,
        stopReason: result.stop_reason,
        sequenceId: messageSequenceId,
        context: context
      };
    }

    /**
     * Get filtered tool definitions based on allowed tool names
     * @private
     * @param {Array<string>} allowedTools - Array of tool names to include
     * @returns {Array} Filtered tool definitions
     */
    _getFilteredTools(allowedTools) {
      const allTools = this._toolRegistry.getEnabledTools();
      return allTools.filter(tool => allowedTools.includes(tool.name));
    }

    /**
     * Internal method - Continue conversation with tool results
     * @private
     */
    _sendToolResults(messages, toolResults, snippet, onThinking, sequenceId, system, context, toolsToUse, modelToUse, useThinking = true) {
      // Add tool result message
      const toolResultContent = toolResults.map(result => ({
        type: 'tool_result',
        tool_use_id: result.tool_use_id,
        content: result.content
      }));

      const toolResultMsg = {
        role: 'user',
        content: toolResultContent
      };
      const updatedMessages = [...messages, toolResultMsg];
      snippet.push(toolResultMsg);  // Track tool result message in snippet

      // Make direct API call with tool results
      // max_tokens must be > thinking.budget_tokens (128000) when thinking enabled
      const requestBody = {
        model: modelToUse,
        messages: updatedMessages,
        max_tokens: useThinking ? 140000 : 4096,
        tools: toolsToUse
      };
      
      // Add thinking only if model supports it
      if (useThinking) {
        requestBody.thinking = {
          type: 'enabled',
          budget_tokens: this.thinkingBudget
        };
      }

      // Add system prompt if provided
      if (system) {
        requestBody.system = system;
      }

      const options = {
        method: 'post',
        contentType: 'application/json',
        headers: {
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01'
        },
        payload: JSON.stringify(requestBody),
        muteHttpExceptions: true
      };

      const response = UrlFetchApp.fetch(this.apiUrl, options);
      const statusCode = response.getResponseCode();
      const responseText = response.getContentText();

  // Check for control messages (cancel, pause, etc.)
  if (typeof checkControlMessages === 'function') {
    checkControlMessages();
  }
  
      if (statusCode !== 200) {
        throw new Error(`Claude API error (${statusCode}): ${responseText}`);
      }

      const result = JSON.parse(responseText);

      // Extract content
      const thinkingMessages = [];
      const contentBlocks = [];
      const toolUses = [];

      if (result.content && Array.isArray(result.content)) {
        result.content.forEach(block => {
          if (block.type === 'thinking') {
            thinkingMessages.push(block.thinking);
            log('[THINKING] ' + block.thinking);
            if (onThinking) {
              onThinking(block.thinking, sequenceId);
            }
          } else if (block.type === 'text') {
            contentBlocks.push(block.text);
          } else if (block.type === 'tool_use') {
            toolUses.push({
              id: block.id,
              name: block.name,
              input: block.input
            });
          }
        });
      }

      // Add assistant response to messages
      const assistMsg = {
        role: 'assistant',
        content: result.content
      };
      updatedMessages.push(assistMsg);
      
      // For snippet: Filter out thinking-only messages
      // Only include messages that have non-thinking content (text, tool_use, etc.)
      const hasNonThinkingContent = result.content.some(block => 
        block.type !== 'thinking'
      );
      
      if (hasNonThinkingContent) {
        // Create filtered version for snippet (no thinking blocks)
        const filteredContent = result.content.filter(block => 
          block.type !== 'thinking'
        );
        
        const snippetMsg = {
          role: 'assistant',
          content: filteredContent
        };
        snippet.push(snippetMsg);  // Track assistant message in snippet (filtered)
      }
      // If message is thinking-only, don't add to snippet at all

      // Check if there are more tool calls
      if (toolUses.length > 0) {
        // Don't emit [REGISTRY] again - already done in first call
        const toolResults2 = toolUses.map(toolUse => {
          const startTime = new Date().getTime();
          log(`[TOOL_START] tool=${toolUse.name} timestamp=${startTime}`);
          
          // Log exec code if it's an exec tool
          if (toolUse.name === 'exec' && toolUse.input.jsCode) {
            log(`[EXEC_CODE] ${toolUse.input.jsCode}`);
          }
          
          let toolResult;
          let success = true;
          try {
            toolResult = this._toolRegistry.executeToolCall(toolUse.name, toolUse.input, {
              ...context,
              think: (msg) => {
                if (onThinking) {
                  onThinking(msg, sequenceId);
                }
              }
            });
            success = toolResult.success !== false;
          } catch (error) {
            toolResult = {
              success: false,
              error: error.toString(),
              message: error.message,
              stack: error.stack,
              name: error.name
            };
            success = false;
          }
          
          const endTime = new Date().getTime();
          const duration = endTime - startTime;
          log(`[TOOL_END] tool=${toolUse.name} duration=${duration}ms success=${success} timestamp=${endTime}`);
          
          // Log [SENSITIVE] for successful exec tool results - NO TRUNCATION
          if (success && toolUse.name === 'exec' && toolResult.result !== undefined) {
            const resultJson = JSON.stringify(toolResult.result);
            log(`[SENSITIVE] ${resultJson}`);
          }
          
          // Unwrap successful results - send just the result to Claude, not the wrapper
          let contentForClaude;
          if (toolResult.success === true && toolResult.result !== undefined) {
            // Success: send just the result as JSON string
            contentForClaude = JSON.stringify(toolResult.result);
          } else if (toolResult.success === false) {
            // Error: send error details as JSON
            contentForClaude = JSON.stringify({
              error: toolResult.error,
              message: toolResult.message,
              name: toolResult.name
            });
          } else {
            // Fallback: send entire result
            contentForClaude = JSON.stringify(toolResult);
          }
          
          return {
            tool_use_id: toolUse.id,
            content: contentForClaude
          };
        });
        
        return this._sendToolResults(updatedMessages, toolResults2, snippet, onThinking, sequenceId, system, context, toolsToUse, modelToUse, useThinking);
      }

      return {
        response: contentBlocks.join('\n'),
        message: {
          role: 'assistant',
          content: result.content
        },
        messages: updatedMessages,  // Full conversation (backward compat)
        threadHistorySnippet: snippet,  // Delta from this turn
        usage: result.usage,
        thinkingMessages: thinkingMessages,
        toolUses: toolUses,
        stopReason: result.stop_reason,
        sequenceId: sequenceId,
        context: context
      };
    }

    /**
     * Check if a model supports extended thinking
     * @private
     * @param {string} model - Model name to check
     * @returns {boolean} True if model supports thinking
     */
    _modelSupportsThinking(model) {
      if (!model) return false;
      
      // Check if model name contains any of the supported model prefixes
      return this.thinkingSupportedModels.some(supported => 
        model.includes(supported)
      );
    }

    /**
     * Load knowledge from "Knowledge" sheet via exec tool
     * IMPORTANT: This method NEVER caches - always reads fresh data from sheet
     * @private
     * @returns {Array|null} Knowledge data as JSON array or null if not available
     */
    _loadKnowledge() {
      try {
        // Use exec tool to read Knowledge sheet as raw 2D array
        // NO CACHING: Reads fresh data every time this is called
        const execResult = this._toolRegistry.executeToolCall('exec', {
          jsCode: `
            // Flush any pending spreadsheet operations to ensure fresh read
            SpreadsheetApp.flush();
            
            const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Knowledge');
            if (!sheet) return null;
            
            // Always fetch fresh data - no caching
            const data = sheet.getDataRange().getValues();
            if (data.length === 0) return null;
            
            // Return raw 2D array
            return data;
          `
        }, { depth: 0 });
        
        return execResult.success ? execResult.result : null;
      } catch (error) {
        log('[KNOWLEDGE] Failed to load: ' + error);
        return null;
      }
    }

    /**
     * Load custom system prompt from _SheetsChat tab (if exists)
     * Checks column A for "SystemPrompt" key and reads value from column B
     * @private
     * @returns {string|null} Custom prompt or null if not found
     */
    _loadCustomSystemPrompt() {
      // Return cached value if already loaded
      if (this._customSystemPrompt !== undefined) {
        return this._customSystemPrompt;
      }
      
      try {
        const ss = SpreadsheetApp.getActiveSpreadsheet();
        const configSheet = ss.getSheetByName('_SheetsChat');
        
        if (!configSheet) {
          this._customSystemPrompt = null;
          return null;
        }
        
        // Read all data from columns A and B
        const data = configSheet.getDataRange().getValues();
        
        // Search for "SystemPrompt" key in column A
        for (let i = 0; i < data.length; i++) {
          if (data[i][0] === 'SystemPrompt') {
            const customPrompt = data[i][1];
            
            if (customPrompt && typeof customPrompt === 'string' && customPrompt.trim()) {
              // Cache the custom prompt
              this._customSystemPrompt = customPrompt;
              
              log(`[SystemPrompt] Loaded custom system prompt from _SheetsChat tab (${customPrompt.length} characters)`);
              return customPrompt;
            }
          }
        }
        
        // Not found
        this._customSystemPrompt = null;
        return null;
      } catch (error) {
        log('[SystemPrompt] Error loading custom prompt: ' + error);
        this._customSystemPrompt = null;
        return null;
      }
    }

    /**
     * Build system prompt with tool descriptions and knowledge
     * Checks for custom prompt in _SheetsChat tab first, falls back to default
     * @private
     * @param {Array|null} knowledge - Knowledge data to inject
     * @returns {string} Complete system prompt
     */
    _buildSystemPrompt(knowledge = null) {
      // Try to load custom system prompt first
      const customPrompt = this._loadCustomSystemPrompt();
      if (customPrompt) {
        log('[SystemPrompt] Using custom prompt from _SheetsChat tab');
        return customPrompt;
      }
      
      // Fall back to default
      log('[SystemPrompt] Using default prompt');
      return this._SystemPrompt.buildSystemPrompt(knowledge);
    }

    /**
     * Clear conversation (client-side operation)
     * Returns empty messages array
     */
    clearConversation() {
      // Reset tool registry toolState
      if (this._toolRegistry) {
        this._toolRegistry.resetToolState();
      }
      return [];
    }
  }

  // Export for CommonJS
  module.exports = ClaudeConversation;