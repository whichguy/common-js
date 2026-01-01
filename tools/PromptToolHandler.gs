function _main(
  module = globalThis.__getCurrentModule(),
  exports = module.exports,
  log = globalThis.__getModuleLogFunction?.(module) || (() => {})
) {
  /**
   * PromptToolHandler - One-shot Claude prompts with recursion protection
   * Enables nested Claude API calls for meta-reasoning and specialized tasks
   * Extends ToolBase for consistent behavior
   */

  class PromptToolHandler extends require('tools/ToolBase') {
    constructor() {
      super('prompt');
    }
    
    /**
     * Get the Claude API tool definition
     * @returns {Object} Tool definition
     */
    getToolDefinition() {
      return {
        name: "prompt",
        description: `Spawn independent Claude contexts for specialized tasks: code generation, research, and isolated reasoning.

  PRIORITY USE CASES:
  1. CODE GENERATION - Generate executable JavaScript/GAS code
  2. WEB RESEARCH - Get current information via websearch
  3. INDEPENDENT SUGGESTIONS - Provide options/recommendations in isolated context

  WHEN TO USE (Recognize & Act):
  ✓ User needs code written → spawn code-writing context
  ✓ User asks about unfamiliar/current topics → spawn research context with websearch
  ✓ User wants suggestions/options → spawn recommendation context
  ✓ Large content analysis → spawn with storeAs + responseMetadataOnly
  ✓ Multiple independent tasks → spawn parallel contexts
  ✓ Fact-checking claims → spawn verification context

  ✗ DON'T USE: Direct answers, continuing conversation, needs parent context

  STORAGE PATTERN (storeAs + exec integration):
  When you use storeAs="keyName", the FULL response is stored in toolState.
  Access stored data in exec tool via the key name as a JavaScript variable:
  - keyName.response = full text response
  - keyName.thinking = thinking messages array
  - keyName.toolCalls = tool uses array
  - keyName.usage = token usage stats

  Example workflow:
  1. prompt with storeAs="research" → stores full response
  2. exec with jsCode: "return research.response" → access full text
  3. exec with jsCode: "return research.usage.total_tokens" → get token count
  4. exec with jsCode: "const data = JSON.parse(research.response); return data.insights" → process structured data

  CORE PATTERNS (Priority Order):

  1. CODE GENERATION (Primary Use Case)
     {
       "text": "Write [LANGUAGE] code for [REQUIREMENT]. Include: error handling, JSDoc/comments, input validation. Return ONLY code, no markdown or explanations.",
       "storeAs": "generatedCode",
       "maxTokens": 3072
     }
     Then: exec jsCode: "eval(generatedCode.response); return testFunction(args);" to execute/test
     
     Examples:
     - "Write function to sort sheet data by column B"
       → prompt("Write sortSheetByColumn(sheet, columnIndex) using SpreadsheetApp. JSDoc. Return ONLY code.", storeAs="code")
       → exec: "eval(code.response); sortSheetByColumn(SpreadsheetApp.getActiveSheet(), 2); return 'Sorted';"
     
     - "Create email automation for weekly reports"
       → prompt("Write sendWeeklyReport() that: reads A1:D, filters this week's data, emails HTML table to active user. GAS. Return ONLY code.", storeAs="emailer", maxTokens=3072)
       → exec: "eval(emailer.response); sendWeeklyReport(); return 'Sent';"
     
     - "Generate CSV parser with error handling"
       → prompt("Write parseCSV(csvString) returning 2D array. Handle quotes, escapes, empty fields. JSDoc. Return ONLY code.", storeAs="parser")
       → exec: "eval(parser.response); return parseCSV('a,b\\n1,2');"

  2. WEB RESEARCH (Current Information)
     {
       "text": "Research [TOPIC]. Use websearch for 3-5 authoritative sources. Synthesize: key findings, sources, confidence level. Be specific and cite sources.",
       "storeAs": "research",
       "responseMetadataOnly": true,
       "enableThinking": true
     }
     Then: exec jsCode: "return research.response" to get findings
     
     Examples:
     - "What's the latest in AI regulation?"
       → prompt("Research AI regulations 2024-2025. Websearch recent laws, court cases, policy changes. Synthesize by jurisdiction with sources.", storeAs="aiReg", responseMetadataOnly=true)
     
     - "Current best practices for API rate limiting"
       → prompt("Research API rate limiting best practices 2024-2025. Websearch industry standards, major APIs' approaches, tools. Summarize with examples.", storeAs="rateLimiting")
     
     - "Latest security vulnerabilities in Node.js"
       → prompt("Research Node.js security vulnerabilities 2024-2025. Websearch CVEs, advisories, patches. Priority: critical/high severity with mitigation steps.", storeAs="nodeSec")

  3. INDEPENDENT SUGGESTIONS (Isolated Context Recommendations)
     {
       "text": "Analyze [SITUATION]. Provide 3-5 options with: description, pros/cons, difficulty (1-10), recommendation. Consider: [CONSTRAINTS]. Use websearch if needed for current info.",
       "storeAs": "suggestions",
       "enableThinking": true,
       "maxTokens": 3072
     }
     Then: present options or exec to format for sheets
     
     Examples:
     - "Suggest database options for real-time analytics"
       → prompt("Analyze database options for real-time analytics. Websearch current leaders (2024-2025). Provide 4 options: description, pros/cons, cost, difficulty (1-10), recommendation. Consider: 1M records, sub-second queries, budget-conscious.", storeAs="dbOptions", enableThinking=true)
     
     - "What are good approaches to handle this error?"
       → prompt("Analyze error: [ERROR]. Suggest 3 solutions: description, implementation steps, trade-offs, difficulty (1-10). Rank by effectiveness.", storeAs="errorFixes")
     
     - "Recommend project structure for this app"
       → prompt("Design project structure for [APP_DESCRIPTION]. Suggest: folder layout, file organization, naming conventions. Provide 2-3 options: description, pros/cons, best_for. Consider: scalability, team size, complexity.", storeAs="projectStructure")

  DECISION LOGIC (Priority Order):
  IF user_needs_code_written → prompt("Write [specs]. Return ONLY code.") + storeAs, then exec with eval()
  IF user_asks_unfamiliar_OR_current_topic → prompt(websearch research) + storeAs + responseMetadataOnly
  IF user_wants_suggestions_OR_options → prompt(analyze + provide options) + enableThinking + storeAs
  IF multiple_independent_analyses → parallel prompts with unique storeAs keys
  IF large_content → prompt + storeAs + responseMetadataOnly
  IF continuing_conversation → DON'T use prompt

  PARAMETERS:
  - text (required): Directive for spawned context. Be specific: requirements, format, tools to use.
  - storeAs (optional): Store full response in toolState. Access in exec as: keyName.response
  - responseMetadataOnly (optional): Return only metadata to save tokens. Requires storeAs.
  - maxTokens (optional): Default 2048. Use 3072-4096 for complex code/research.
  - enableThinking (optional): Default false. Set true for complex reasoning/research.
  - system (optional): Custom system prompt (knowledge auto-included).

  AUTOMATIC FEATURES:
  - Knowledge sheet included in spawned context
  - Tools available: websearch, exec, knowledge
  - Recursion protection (max depth 3)
  - Stored responses persist for conversation

  THINKING PROTOCOL:
  1. User needs code? → prompt(detailed specs + "Return ONLY code") + storeAs, exec with eval()
  2. User asks unfamiliar/current topic? → prompt(websearch research) + storeAs + responseMetadataOnly
  3. User wants options/suggestions? → prompt(analyze + options) + enableThinking + storeAs
  4. Large response expected? → responseMetadataOnly=true, access via exec later
  5. Multiple independent tasks? → parallel prompts with unique storeAs keys
  6. Just conversing? → DON'T use

  Pattern: RECOGNIZE → SPAWN + STORE → EXECUTE/ACCESS → PRESENT`,
        input_schema: {
          type: "object",
          properties: {
            text: {
              type: "string",
              description: "The prompt text to send to Claude"
            },
            system: {
              type: "string",
              description: "Optional custom system prompt (knowledge is still auto-included)"
            },
            maxTokens: {
              type: "number",
              description: "Maximum response tokens (default: 2048)"
            },
            enableThinking: {
              type: "boolean",
              description: "Enable extended thinking (default: false for faster responses)"
            },
            storeAs: {
              type: "string",
              description: "Store full response in toolState under this key. Access in exec as: keyName.response, keyName.thinking, keyName.toolCalls, keyName.usage"
            },
            responseMetadataOnly: {
              type: "boolean",
              description: "Return only metadata to save tokens (requires storeAs). Full response available in toolState."
            }
          },
          required: ["text"]
        }
      };
    }
    
    /**
     * Execute a one-shot Claude prompt with recursion protection
     * @param {Object} input - Tool input
     * @param {Object} context - Execution context with depth tracking
     * @returns {Object} Success/error result
     */
    execute(input, context = {}) {
      try {
        // Validate responseMetadataOnly requires storeAs
        if (input.responseMetadataOnly && !input.storeAs) {
          return this._errorResult('responseMetadataOnly requires storeAs parameter');
        }
        
        // Check recursion depth - throws if exceeded
        const { depth, maxDepth } = this._checkRecursionDepth(context);
        
        Logger.log(`[PROMPT] Executing at depth ${depth}/${maxDepth}`);
        
        // Get available tools for next level
        const nestedDepth = depth + 1;
        const nestedContext = {
          ...context,
          depth: nestedDepth,
          maxDepth: maxDepth,
          clientState: {} // Fresh client state for nested call
        };
        
        const availableTools = this._getAvailableTools(nestedContext);
        Logger.log(`[PROMPT] Available tools at depth ${nestedDepth}: ${availableTools.join(', ')}`);
        
        // Build system prompt with knowledge
        const systemPrompt = this._buildSystemPrompt(input.system);
        
        // Create nested Claude conversation
        const ClaudeConversation = require('sheets-chat/ClaudeConversation');
        const claude = new ClaudeConversation();
        
        // Execute one-shot prompt with restricted tools
        const result = claude.sendMessage({
          messages: [],
          text: input.text,
          system: systemPrompt,
          context: {
            ...nestedContext,
            toolsEnabled: availableTools
          },
          maxTokens: input.maxTokens || 2048,
          enableThinking: input.enableThinking || false
        });
        
        // Store full response in toolState if storeAs provided
        if (input.storeAs) {
          // Initialize toolState if not present
          if (!context.toolState) {
            context.toolState = {};
          }
          
          // Store complete result for exec access
          context.toolState[input.storeAs] = {
            response: result.response,
            thinking: result.thinkingMessages || [],
            toolCalls: result.toolUses || [],
            usage: result.usage || {}
          };
          
          Logger.log(`[PROMPT] Stored result in toolState.${input.storeAs}`);
        }
        
        // If responseMetadataOnly, return minimal response
        if (input.responseMetadataOnly && input.storeAs) {
          return this._successResult({
            stored: input.storeAs,
            tokensUsed: result.usage?.total_tokens || 0,
            thinkingTokens: result.usage?.cache_read_input_tokens || 0,
            toolCallsCount: result.toolUses?.length || 0,
            depth: nestedDepth
          }, {
            stopReason: result.stopReason,
            tokensUsed: result.usage?.total_tokens || 0,
            message: `Full response stored in toolState.${input.storeAs}. Access via exec with: ${input.storeAs}.response`
          });
        }
        
        // Extract response and metadata
        return this._successResult({
          response: result.response,
          toolCalls: result.toolUses,
          usage: result.usage,
          depth: nestedDepth
        }, {
          stopReason: result.stopReason,
          tokensUsed: result.usage?.total_tokens || 0
        });
        
      } catch (error) {
        return this._errorResult(error.toString(), error);
      }
    }
    
    /**
     * Build system prompt with knowledge integration
     * @private
     * @param {string} customSystem - Optional custom system prompt
     * @returns {string} Complete system prompt
     */
    _buildSystemPrompt(customSystem) {
      const parts = [];
      
      // Add custom system prompt if provided
      if (customSystem) {
        parts.push(customSystem);
        parts.push('');
      }
      
      // Try to get knowledge
      try {
        const KnowledgeToolHandler = require('tools/KnowledgeToolHandler');
        const knowledgeHandler = new KnowledgeToolHandler();
        
        // Get knowledge as markdown
        const knowledgeResult = knowledgeHandler.run({ format: 'markdown' }, {});
        
        if (knowledgeResult.success && knowledgeResult.result) {
          parts.push('# Available Knowledge');
          parts.push('');
          parts.push(knowledgeResult.result);
          parts.push('');
          parts.push('Use this knowledge to inform your analysis and responses.');
        }
      } catch (error) {
        Logger.log(`[PROMPT] Could not load knowledge: ${error.message}`);
        // Continue without knowledge - not critical
      }
      
      if (parts.length === 0) {
        return null; // No system prompt
      }
      
      return parts.join('\n');
    }
  }

  module.exports = PromptToolHandler;
}

__defineModule__(_main, false);