function _main(
  module = globalThis.__getCurrentModule(),
  exports = module.exports,
  log = globalThis.__getModuleLogFunction?.(module) || (() => {})
) {
  /**
   * ToolBase - Abstract base class for all tool handlers
   * Provides common functionality to reduce boilerplate and ensure consistency
   */

  class ToolBase {
    /**
     * Constructor
     * @param {string} toolName - Name of the tool
     */
    constructor(toolName) {
      this.toolName = toolName;
      this.executionCount = 0;
      this.lastExecutionTime = null;
    }
    
    /**
     * ABSTRACT: Get the Claude API tool definition
     * Subclasses MUST override this method
     * @returns {Object} Tool definition with name, description, input_schema
     */
    getToolDefinition() {
      throw new Error(`${this.toolName}: getToolDefinition() must be overridden`);
    }
    
    /**
     * ABSTRACT: Execute the tool logic
     * Subclasses MUST override this method
     * @param {Object} input - Tool input from Claude API
     * @param {Object} context - Execution context with:
     *   - think: function(message) - Emit both log and thinking message (recommended)
     *   - onThinking: function(message, sequenceId) - Legacy direct access
     *   - sequenceId: string - Message sequence ID (legacy)
     *   - depth: number - Recursion depth
     *   - maxDepth: number - Maximum recursion depth
     *   - toolsEnabled: Array<string> - Available tools at this depth
     *   - toolState: Object - Tool-specific state passed between calls
     * @returns {Object} Result object with success, result/error fields
     */
    execute(input, context = {}) {
      throw new Error(`${this.toolName}: execute() must be overridden`);
    }
    
    /**
     * Main entry point - handles logging, validation, error wrapping
     * This is called by ToolRegistry.executeTool()
     * @param {Object} input - Tool input from Claude API
     * @param {Object} context - Execution context
     * @returns {Object} Standardized result object
     */
    run(input, context = {}) {
      this.executionCount++;
      const startTime = new Date().getTime();
      
      try {
        // Log tool start
        this._logStart(input, context);
        
        // Validate input against schema
        const validation = this._validateInput(input);
        if (!validation.valid) {
          return this._errorResult(validation.error);
        }
        
        // Execute the tool-specific logic
        const result = this.execute(input, context);
        
        // Log tool end with duration
        const duration = new Date().getTime() - startTime;
        this.lastExecutionTime = duration;
        this._logEnd(result, duration);
        
        // Ensure result has success field
        return this._ensureSuccessField(result);
        
      } catch (error) {
        // Log error with duration
        const duration = new Date().getTime() - startTime;
        this._logError(error, duration);
        return this._errorResult(error.toString(), error);
      }
    }
    
    /**
     * Validate input against tool's input schema
     * @param {Object} input - Tool input to validate
     * @returns {Object} {valid: boolean, error?: string}
     */
    _validateInput(input) {
      try {
        const definition = this.getToolDefinition();
        const schema = definition.input_schema;
        
        if (!schema || !schema.required) {
          return { valid: true };
        }
        
        // Check required fields
        for (const field of schema.required) {
          if (input[field] === undefined || input[field] === null) {
            return {
              valid: false,
              error: `Missing required field: ${field}`
            };
          }
        }
        
        return { valid: true };
        
      } catch (error) {
        // If we can't validate, assume valid (fail open for backwards compat)
        Logger.log(`[TOOL_VALIDATE] ${this.toolName}: Validation error: ${error.message}`);
        return { valid: true };
      }
    }
    
    /**
     * Create a standardized success result
     * @param {*} result - The result data to return
     * @param {Object} metadata - Optional additional metadata
     * @returns {Object} Success result object
     */
    _successResult(result, metadata = {}) {
      return {
        success: true,
        result: result,
        toolName: this.toolName,
        ...metadata
      };
    }
    
    /**
     * Create a standardized error result
     * @param {string} message - Error message
     * @param {Error} error - Optional Error object
     * @returns {Object} Error result object
     */
    _errorResult(message, error = null) {
      return {
        success: false,
        error: message,
        message: error?.message,
        stack: error?.stack,
        name: error?.name,
        toolName: this.toolName
      };
    }
    
    /**
     * Check recursion depth and throw if exceeded
     * @param {Object} context - Execution context with depth, maxDepth
     * @returns {Object} {depth, maxDepth}
     * @throws {Error} If max depth exceeded
     */
    _checkRecursionDepth(context) {
      const depth = context.depth || 0;
      const maxDepth = context.maxDepth || 3;
      
      if (depth >= maxDepth) {
        throw new Error(`Max recursion depth exceeded (${maxDepth}). Current depth: ${depth}`);
      }
      
      return { depth, maxDepth };
    }
    
    /**
     * Get available tools for the current recursion depth
     * @param {Object} context - Execution context
     * @returns {Array<string>} Array of tool names available at this depth
     */
    _getAvailableTools(context) {
      const depth = context.depth || 0;
      
      // Depth 0 (top level): All tools available
      if (depth === 0) {
        return ['exec', 'websearch', 'knowledge', 'prompt', 'analyzeUrl'];
      }
      
      // Depth 1 (first nesting): No prompt or analyzeUrl (prevent deep nesting)
      if (depth === 1) {
        return ['exec', 'websearch', 'knowledge'];
      }
      
      // Depth 2+ (deep nesting): Only basic tools
      return ['exec', 'websearch'];
    }
    
    /**
     * Ensure result object has success field
     * @param {Object} result - Result from execute()
     * @returns {Object} Result with success field
     */
    _ensureSuccessField(result) {
      if (result.success === undefined) {
        // If no success field, assume success if we got this far
        return {
          success: true,
          result: result,
          toolName: this.toolName
        };
      }
      return result;
    }
    
    /**
     * Log tool start with special formatting for exec tool JavaScript code
     * @param {Object} input - Tool input
     * @param {Object} context - Execution context
     */
    _logStart(input, context) {
      const depth = context.depth || 0;
      const depthStr = depth > 0 ? ` depth=${depth}` : '';
      
      // Special formatting for exec tool with jsCode
      if (this.toolName === 'exec' && input.jsCode) {
        // Type safety: ensure jsCode is a string
        if (typeof input.jsCode !== 'string') {
          Logger.log(`[TOOL_START] tool=${this.toolName}${depthStr ? ' ' + depthStr : ''} jsCode=(invalid type: ${typeof input.jsCode})`);
          return;
        }
        
        // Normalize line endings (Windows CRLF → Unix LF, old Mac CR → LF)
        const normalizedCode = input.jsCode.replace(/\r\n|\r/g, '\n');
        const codeLines = normalizedCode.split('\n');
        const lineCount = codeLines.length;
        const charCount = normalizedCode.length;
        
        // Always log summary header
        Logger.log(`[TOOL_START] tool=${this.toolName}${depthStr ? ' ' + depthStr : ''} jsCode=(${lineCount} lines, ${charCount} chars)`);
        
        // Handle edge case: empty or whitespace-only code
        if (charCount === 0 || (lineCount === 1 && !codeLines[0].trim())) {
          Logger.log('(empty or whitespace-only code)');
          return;
        }
        
        // Always show full code without line numbers (cleaner output)
        Logger.log(codeLines.join('\n'));
        
      } else {
        // Standard logging for non-exec tools (unchanged)
        const inputJson = JSON.stringify(input);
        Logger.log(`[TOOL_START] tool=${this.toolName}${depthStr ? ' ' + depthStr : ''} input=${inputJson}`);
      }
    }
    
    /**
     * Log tool end with result summary
     * @param {Object} result - Tool result
     * @param {number} duration - Execution duration in ms
     */
    _logEnd(result, duration) {
      const status = result.success ? 'SUCCESS' : 'ERROR';
      Logger.log(`[TOOL_END] ${this.toolName}: ${status} (${duration}ms)`);
    }
    
    /**
     * Log tool error
     * @param {Error} error - Error object
     * @param {number} duration - Execution duration in ms
     */
    _logError(error, duration) {
      Logger.log(`[TOOL_ERROR] ${this.toolName}: ${error.message} (${duration}ms)`);
      Logger.log(`[TOOL_ERROR] ${this.toolName}: ${error.stack}`);
    }
  }

  module.exports = ToolBase;
}

__defineModule__(_main, false);