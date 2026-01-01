function _main(
  module = globalThis.__getCurrentModule(),
  exports = module.exports,
  log = globalThis.__getModuleLogFunction?.(module) || (() => {})
) {
  /**
   * ToolRegistry - Manages multiple tools with enable/disable capabilities
   * Central dispatcher for tool definitions and execution
   * Manages in-memory toolState across tool calls in a conversation
   * Automatically stores tool results in toolState.previousResult for chaining
   */

  class ToolRegistry {
    /**
     * @param {Object} config - Configuration object with tool enable flags
     * @param {boolean} config.enableExec - Enable exec tool (default: true)
     * @param {boolean} config.enableSearch - Enable websearch tool (default: true)
     * @param {boolean} config.enableKnowledge - Enable knowledge tool (default: true)
     * @param {boolean} config.enablePrompt - Enable prompt tool (default: true)
     * @param {boolean} config.enableAnalyzeUrl - Enable analyzeUrl tool (default: true)
     * @param {boolean} config.enableFetchUrls - Enable fetchUrls tool (default: true)
     */
    constructor(config = {}) {
      this.config = {
        enableExec: config.enableExec !== false,  // Default true
        enableSearch: config.enableSearch !== false,  // Default true
        enableKnowledge: config.enableKnowledge !== false,  // Default true
        enablePrompt: config.enablePrompt !== false,  // Default true
        enableAnalyzeUrl: config.enableAnalyzeUrl !== false,  // Default true
        enableFetchUrls: config.enableFetchUrls !== false  // Default true
      };
      
      this.handlers = {};
      this.toolState = {};  // In-memory state scoped to this conversation, shared between tools
      
      // Initialize enabled tool handlers
      if (this.config.enableExec) {
        const SpreadsheetToolHandler = require('tools/SpreadsheetToolHandler');
        this.handlers.exec = new SpreadsheetToolHandler();
      }
      
      if (this.config.enableSearch) {
        const SearchToolHandler = require('tools/SearchToolHandler');
        this.handlers.websearch = new SearchToolHandler();
      }
      
      if (this.config.enableKnowledge) {
        const KnowledgeToolHandler = require('tools/KnowledgeToolHandler');
        this.handlers.knowledge = new KnowledgeToolHandler();
      }
      
      if (this.config.enablePrompt) {
        const PromptToolHandler = require('tools/PromptToolHandler');
        this.handlers.prompt = new PromptToolHandler();
      }
      
      if (this.config.enableAnalyzeUrl) {
        const AnalyzeUrlToolHandler = require('tools/AnalyzeUrlToolHandler');
        this.handlers.analyzeUrl = new AnalyzeUrlToolHandler();
      }
      
      if (this.config.enableFetchUrls) {
        const FetchUrlsToolHandler = require('tools/FetchUrlsToolHandler');
        this.handlers.fetchUrls = new FetchUrlsToolHandler();
      }
    }
    
    /**
     * Get tool definitions for all enabled tools
     * @returns {Array<Object>} Array of Claude API tool definitions
     */
    getEnabledTools() {
      return Object.values(this.handlers).map(handler => handler.getToolDefinition());
    }
    
    /**
     * Execute a tool call by dispatching to the appropriate handler
     * Uses the unified .run() method from ToolBase
     * 
     * @param {string} toolName - Name of the tool to execute
     * @param {Object} input - Tool input parameters
     * @param {Object} context - Execution context (depth, maxDepth, clientState, etc.)
     * @returns {Object} Tool execution result
     */
    executeToolCall(toolName, input, context = {}) {
      const handler = this.handlers[toolName];
      
      if (!handler) {
        return {
          success: false,
          error: `Tool not enabled: ${toolName}. Available tools: ${Object.keys(this.handlers).join(', ')}`
        };
      }
      
      try {
        // Merge toolState into context
        const executionContext = {
          ...context,
          toolState: context.toolState || this.toolState,
          toolRegistry: this,  // Pass registry reference for tool invocation
          depth: context.depth || 0,
          maxDepth: context.maxDepth || 3
        };
        
        // All tools now use the unified .run() method from ToolBase
        const result = handler.run(input, executionContext);
        
        // AUTOMATIC CHAINING: Store successful results in toolState.previousResult
        // This enables natural tool chaining (websearch → exec, etc.)
        if (result.success && result.result !== undefined) {
          executionContext.toolState.previousResult = result.result;
          this.toolState.previousResult = result.result;
        }
        
        // Update toolState if returned in metadata
        if (result.toolState) {
          this.toolState = result.toolState;
        }
        
        return result;
      } catch (error) {
        return {
          success: false,
          error: error.toString(),
          message: error.message,
          stack: error.stack,
          toolName: toolName
        };
      }
    }
    
    /**
     * Check if a specific tool is enabled
     * @param {string} toolName - Name of the tool to check
     * @returns {boolean} True if tool is enabled
     */
    isToolEnabled(toolName) {
      return this.handlers.hasOwnProperty(toolName);
    }
    
    /**
     * Get list of enabled tool names
     * @returns {Array<string>} Array of enabled tool names
     */
    getEnabledToolNames() {
      return Object.keys(this.handlers);
    }
    
    /**
     * Get current toolState (for debugging)
     * @returns {Object} Current in-memory toolState
     */
    getToolState() {
      return this.toolState;
    }
    
    /**
     * Reset toolState (for testing or starting new context)
     */
    resetToolState() {
      this.toolState = {};
    }
  }

  module.exports = ToolRegistry;
}

__defineModule__(_main);