function _main(
  module = globalThis.__getCurrentModule(),
  exports = module.exports,
  log = globalThis.__getModuleLogFunction?.(module) || (() => {})
) {
  /**
   * KnowledgeToolHandler - Reads "knowledge" sheet for system-wide context
   * Provides cached access with 5-minute TTL
   * Extends ToolBase for consistent behavior
   */

  class KnowledgeToolHandler extends require('tools/ToolBase') {
    constructor() {
      super('knowledge');
      
      // Cache configuration
      this.cache = null;
      this.cacheTimestamp = null;
      this.cacheTTL = 5 * 60 * 1000; // 5 minutes in milliseconds
    }
    
    /**
     * Get the Claude API tool definition
     * @returns {Object} Tool definition
     */
    getToolDefinition() {
      return {
        name: "knowledge",
        description: `Read the "knowledge" sheet for system-wide context and configuration.

  The knowledge sheet stores:
  - URL patterns for intelligent URL analysis (type: url_pattern)
  - General context and domain knowledge (type: general)
  - Configuration and directives

  KNOWLEDGE SHEET FORMAT:
  The sheet uses a 3-column format:
  - Column A: Type (url_pattern, general, config, etc.)
  - Column B: Key/Pattern
  - Column C: Value/Description

  EXAMPLES:

  1. Get all knowledge (returns markdown by default):
  { "format": "markdown" }

  2. Get knowledge as structured JSON:
  { "format": "json" }

  3. Get knowledge as plain text:
  { "format": "text" }

  RETURN FORMATS:

  markdown: Formatted markdown with sections by type
  json: Structured object with arrays by type
  text: Plain text representation

  The knowledge is cached for 5 minutes to improve performance.`,
        input_schema: {
          type: "object",
          properties: {
            format: {
              type: "string",
              enum: ["markdown", "json", "text"],
              description: "Output format (default: markdown)"
            }
          }
        }
      };
    }
    
    /**
     * Execute the knowledge retrieval
     * @param {Object} input - Tool input {format: 'markdown|json|text'}
     * @param {Object} context - Execution context
     * @returns {Object} Success/error result
     */
    execute(input, context = {}) {
      const think = context.think || function(msg) { log(msg); };
      
      try {
        const format = input.format || 'markdown';
        
        // Get knowledge from cache or sheet
        const knowledge = this._getKnowledge(think);
        
        // Format output
        let output;
        switch (format) {
          case 'json':
            output = knowledge;
            break;
          case 'text':
            output = this._formatAsText(knowledge);
            break;
          case 'markdown':
          default:
            output = this._formatAsMarkdown(knowledge);
            break;
        }
        
        return this._successResult(output, {
          cached: this.cache !== null,
          rowCount: knowledge.totalRows || 0,
          types: Object.keys(knowledge).filter(k => k !== 'totalRows')
        });
        
      } catch (error) {
        return this._errorResult(error.toString(), error);
      }
    }
    
    /**
     * Get knowledge from cache or read from sheet
     * @private
     * @param {Function} think - Thinking/logging function
     * @returns {Object} Knowledge data organized by type
     */
    _getKnowledge(think) {
      const now = new Date().getTime();
      
      // Return cached data if still valid
      if (this.cache && this.cacheTimestamp && (now - this.cacheTimestamp) < this.cacheTTL) {
        return this.cache;
      }
      
      // Read from sheet
      const knowledge = this._readKnowledgeSheet(think);
      
      // Update cache
      this.cache = knowledge;
      this.cacheTimestamp = now;
      
      return knowledge;
    }
    
    /**
     * Read and parse the knowledge sheet
     * @private
     * @param {Function} think - Thinking/logging function
     * @returns {Object} Parsed knowledge organized by type
     */
    _readKnowledgeSheet(think) {
      try {
        const ss = SpreadsheetApp.getActiveSpreadsheet();
        const sheet = ss.getSheetByName('knowledge');
        
        if (!sheet) {
          // No knowledge sheet - return empty structure
          return {
            general: [],
            url_pattern: [],
            config: [],
            totalRows: 0
          };
        }
        
        const data = sheet.getDataRange().getValues();
        
        if (data.length === 0) {
          return {
            general: [],
            url_pattern: [],
            config: [],
            totalRows: 0
          };
        }
        
        // Parse rows into structured format
        const knowledge = {
          general: [],
          url_pattern: [],
          config: [],
          totalRows: data.length
        };
        
        data.forEach((row, index) => {
          // Skip empty rows
          if (!row[0] && !row[1] && !row[2]) {
            return;
          }
          
          const type = (row[0] || 'general').toString().toLowerCase().trim();
          const key = (row[1] || '').toString().trim();
          const value = (row[2] || '').toString().trim();
          
          // Create entry
          const entry = {
            type: type,
            key: key,
            value: value,
            row: index + 1
          };
          
          // Add to appropriate type array
          if (knowledge[type]) {
            knowledge[type].push(entry);
          } else {
            // Create new type array if not exists
            knowledge[type] = [entry];
          }
        });
        
        return knowledge;
        
      } catch (error) {
        // If sheet reading fails, return empty structure
        think(`[KNOWLEDGE] Error reading sheet: ${error.message}`);
        return {
          general: [],
          url_pattern: [],
          config: [],
          error: error.message,
          totalRows: 0
        };
      }
    }
    
    /**
     * Format knowledge as markdown
     * @private
     * @param {Object} knowledge - Knowledge data
     * @returns {string} Markdown formatted string
     */
    _formatAsMarkdown(knowledge) {
      const sections = [];
      
      // Add each type as a section
      Object.keys(knowledge).forEach(type => {
        if (type === 'totalRows' || type === 'error') {
          return;
        }
        
        const entries = knowledge[type];
        if (!entries || entries.length === 0) {
          return;
        }
        
        sections.push(`## ${this._capitalize(type)}`);
        sections.push('');
        
        entries.forEach(entry => {
          if (type === 'url_pattern') {
            sections.push(`- **Pattern:** \`${entry.key}\``);
            sections.push(`  **Action:** ${entry.value}`);
          } else {
            sections.push(`- **${entry.key}:** ${entry.value}`);
          }
        });
        
        sections.push('');
      });
      
      if (sections.length === 0) {
        return 'No knowledge entries found.';
      }
      
      return sections.join('\n');
    }
    
    /**
     * Format knowledge as plain text
     * @private
     * @param {Object} knowledge - Knowledge data
     * @returns {string} Plain text formatted string
     */
    _formatAsText(knowledge) {
      const lines = [];
      
      Object.keys(knowledge).forEach(type => {
        if (type === 'totalRows' || type === 'error') {
          return;
        }
        
        const entries = knowledge[type];
        if (!entries || entries.length === 0) {
          return;
        }
        
        lines.push(`[${type.toUpperCase()}]`);
        
        entries.forEach(entry => {
          lines.push(`${entry.key}: ${entry.value}`);
        });
        
        lines.push('');
      });
      
      if (lines.length === 0) {
        return 'No knowledge entries found.';
      }
      
      return lines.join('\n');
    }
    
    /**
     * Capitalize first letter
     * @private
     */
    _capitalize(str) {
      return str.charAt(0).toUpperCase() + str.slice(1);
    }
    
    /**
     * Clear the cache (for testing)
     */
    clearCache() {
      this.cache = null;
      this.cacheTimestamp = null;
    }
  }

  module.exports = KnowledgeToolHandler;
}

__defineModule__(_main, false);