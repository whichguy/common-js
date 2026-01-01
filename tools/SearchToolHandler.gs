function _main(
  module = globalThis.__getCurrentModule(),
  exports = module.exports,
  log = globalThis.__getModuleLogFunction?.(module) || (() => {})
) {
  /**
   * SearchToolHandler - Makes HTTP requests via UrlFetchApp
   * Provides the 'websearch' tool for Claude AI to make external API calls
   * Supports JSON, text, AND BINARY files (images, PDFs, audio, video)
   * Extends ToolBase for consistent behavior
   */

  const UrlFetchUtils = require('common-js/UrlFetchUtils');

  class SearchToolHandler extends require('tools/ToolBase') {
    constructor() {
      super('websearch');
    }
    
    /**
     * Returns the Claude API tool definition for the 'websearch' tool
     * @returns {Object} Tool definition with comprehensive documentation
     */
    getToolDefinition() {
      return {
        name: "websearch",
        description: `Make HTTP requests using UrlFetchApp. Supports JSON, text, AND BINARY files (images, PDFs, audio, video).

  DOCUMENTATION:
  https://developers.google.com/apps-script/reference/url-fetch/url-fetch-app

  BINARY FILE SUPPORT:
  Images, PDFs, audio, video are automatically detected and base64 encoded.
  Response includes: { isBinary: true, base64: "...", mimeType: "image/png", encoding: "base64" }

  RECOMMENDED PATTERN (saves tokens):
    Use responseHeadersOnly=true (default) with storeAs to avoid overwhelming the LLM.
    Full response is stored in toolState for later access via exec tool.

    PREFERRED WORKFLOW - Call from exec tool:
    Instead of: websearch -> exec
    Use: exec (calls UrlFetchApp internally and writes to cells)
    This is MORE EFFICIENT and reduces round trips.

  TOKEN-EFFICIENT PATTERN (transform parameter):
    Use 'transform' to extract only what the LLM needs from large responses.
    The transformed result is both stored AND returned to LLM.

    Example - Extract only item count from large dataset:
    {
      "url": "https://api.com/huge-dataset",
      "storeAs": "data",
      "transform": "r => ({ count: r.body.items.length, sample: r.body.items.slice(0,3) })"
    }
    // Returns to LLM: { count: 5000, sample: [{...},{...},{...}] }  // ~100 tokens
    // Same object stored in toolState.data

  BASIC EXAMPLES:

  1. Simple GET request (headers only, body in toolState):
  {
    "url": "https://api.example.com/data",
    "storeAs": "apiData",
    "responseHeadersOnly": true
  }
  // Returns: { success, statusCode, headers }
  // Full response with body stored as apiData

  2. Binary file (image/PDF) - auto-detected:
  {
    "url": "https://example.com/image.png",
    "storeAs": "image"
  }
  // Returns: { success, isBinary: true, base64: "...", mimeType: "image/png" }

  3. POST request with transform for token efficiency:
  {
    "url": "https://api.example.com/search",
    "method": "POST",
    "payload": "{\\"query\\":\\"test\\"}",
    "storeAs": "searchResult",
    "transform": "r => r.body.results.map(x => x.title)"
  }
  // Returns: ["Title 1", "Title 2", ...] - just the titles, not full objects

  4. Transform examples (JSON):
  - Count only: "r => r.body.items.length"
  - Extract fields: "r => ({ id: r.body.id, name: r.body.name })"
  - Status check: "r => r.success"
  - First item: "r => r.body.items[0]"
  - Filter: "r => r.body.items.filter(x => x.active)"

  5. HTML PARSING EXAMPLE - Extract structured data from raw HTML:
  {
    "url": "https://iwf.sport/results/results-by-events/?event_year=2024",
    "responseHeadersOnly": false,
    "storeAs": "events",
    "transform": "r => [...r.body.matchAll(/<a href=\\"\\?event_id=(\\d+)\\"[\\s\\S]*?class=\\"text\\">(.*?)<\\/span>[\\s\\S]*?normal__text\\">(.*?)<\\/p>[\\s\\S]*?normal__text\\">([\\s\\S]*?)<\\/p>/g)].map(m => ({ event_id: +m[1], title: m[2].trim(), date: m[3].trim(), location: m[4].replace(/<[^>]+>/g, ' ').trim() }))"
  }
  // Converts 50KB+ raw HTML → ~2KB structured array:
  // [{ event_id: 123, title: "World Championships", date: "Jan 2024", location: "Paris, France" }, ...]

  HTML TRANSFORM PATTERN:
  - r.body contains raw HTML string for text/html responses
  - Use matchAll() with regex to extract DOM patterns
  - Map matches to structured objects
  - Return array of clean objects instead of raw HTML

  RESPONSE FORMAT (text/JSON):
  {
    "url": "...",
    "success": true/false,
    "statusCode": 200,
    "contentType": "application/json",
    "isBinary": false,
    "size": 1234,
    "body": { ... },
    "encoding": "utf8"
  }

  RESPONSE FORMAT (binary):
  {
    "url": "...",
    "success": true/false,
    "statusCode": 200,
    "contentType": "image/png",
    "isBinary": true,
    "size": 50000,
    "base64": "...",
    "mimeType": "image/png",
    "encoding": "base64"
  }

  With responseHeadersOnly=true:
  {
    "success": true/false,
    "statusCode": 200,
    "headers": { ... }
  }`,
        input_schema: {
          type: "object",
          properties: {
            url: { 
              type: "string", 
              description: "Target URL (include query parameters in URL string)" 
            },
            method: { 
              type: "string", 
              enum: ["GET", "POST", "PUT", "DELETE", "PATCH"], 
              description: "HTTP method (default: GET)"
            },
            headers: { 
              type: "object", 
              description: "HTTP headers as key-value pairs (e.g., {\"Authorization\": \"Bearer token\"})" 
            },
            payload: { 
              type: "string", 
              description: "Request body as string (use JSON.stringify for objects)" 
            },
            contentType: { 
              type: "string", 
              description: "Content-Type header (default: application/json)"
            },
            storeAs: {
              type: "string",
              description: `Store result in toolState with this key.

  STORED SHAPE (single result object):
  toolState.{key} = {
    url, success, statusCode, headers, contentType,
    isBinary, size, body/base64, mimeType, encoding
  }

  ACCESS PATTERNS IN exec:
  - Response body: toolState.key.body
  - Status check: toolState.key.success
  - Binary data: toolState.key.base64

  With transform, stores transformed value:
  toolState.{key} = transformedResult

  NOTE: websearch stores SINGLE object, fetchUrls stores ARRAY.`
            },
            responseHeadersOnly: {
              type: "boolean",
              description: "Return only headers and metadata, omitting body from response (default: true). Saves tokens. WARNING: If true without storeAs, response body is discarded."
            },
            transform: {
              type: "string",
              description: `JavaScript arrow function to transform the result before storing/returning.

  TOKEN EFFICIENCY: Use when response is large but you only need specific fields.

  EXAMPLES:
  - Count only: "r => r.body.items.length"
  - Extract fields: "r => ({ id: r.body.id, name: r.body.name })"
  - Status check: "r => r.success"
  - First item: "r => r.body.items[0]"
  - Filter active: "r => r.body.items.filter(x => x.active)"
  - Sample: "r => ({ count: r.body.length, sample: r.body.slice(0,3) })"

  NOTE: Transformed result is BOTH stored in toolState AND returned to LLM.
  Binary responses can be transformed too (e.g., "r => ({ mime: r.mimeType, size: r.size })").`
            }
          },
          required: ["url"]
        }
      };
    }
    
    /**
     * Execute HTTP request via UrlFetchApp
     * @param {Object} input - Tool input with url, method, headers, payload, contentType
     * @param {Object} context - Execution context
     * @returns {Object} Response object with success, statusCode, headers, body
     */
    execute(input, context = {}) {
      const { 
        url, 
        method = 'GET', 
        headers = {}, 
        payload, 
        contentType = 'application/json',
        storeAs,
        responseHeadersOnly = true,
        transform
      } = input;
      const toolState = context.toolState || {};
      
      // Log request initiation
      const urlPreview = url.length > 80 ? url.substring(0, 80) + '...' : url;
      log('[WEBSEARCH] → ' + method + ' ' + urlPreview);
      
      // Build UrlFetchApp options
      const options = {
        method: method.toLowerCase(),
        headers: headers,
        muteHttpExceptions: true  // Don't throw on non-2xx status codes
      };
      
      // Add payload if provided
      if (payload) {
        options.payload = payload;
        // Set Content-Type if not already in headers
        if (!headers['Content-Type'] && !headers['content-type']) {
          options.contentType = contentType;
        }
      }
      
      try {
        const response = UrlFetchApp.fetch(url, options);
        const parsedResponse = this._parseResponse(response, url);
        
        // Log response result
        if (parsedResponse.success) {
          const binaryInfo = parsedResponse.isBinary ? ' (binary)' : '';
          log('[WEBSEARCH] ✓ ' + parsedResponse.statusCode + binaryInfo);
        } else {
          log('[WEBSEARCH] ✗ ' + parsedResponse.statusCode);
        }
        
        // Apply transform if provided
        let resultToStore = parsedResponse;
        let transformWarning = null;
        
        if (transform) {
          try {
            // Safe eval with limited scope - only 'r' parameter available
            const transformFn = new Function('r', `return (${transform})(r)`);
            resultToStore = transformFn(parsedResponse);
            log('[WEBSEARCH] 🔄 transformed');
          } catch (e) {
            transformWarning = `Transform failed: ${e.toString()}. Storing full response.`;
            log('[WEBSEARCH] ⚠️ ' + transformWarning);
            resultToStore = parsedResponse;
          }
        }
        
        // Store in toolState if specified (transformed or full, depending on transform param)
        if (storeAs) {
          const sizeInfo = typeof resultToStore === 'object' ? JSON.stringify(resultToStore).length : String(resultToStore).length;
          log('[WEBSEARCH] 📦 stored as "' + storeAs + '" (' + sizeInfo + ' bytes)');
          toolState[storeAs] = resultToStore;
        }
        
        // Prepare result for LLM
        let resultForLLM = resultToStore;
        let warnings = [];
        
        if (transformWarning) {
          warnings.push(transformWarning);
        }
        
        // If responseHeadersOnly and no transform, return headers-only version
        if (responseHeadersOnly && !transform) {
          resultForLLM = {
            success: parsedResponse.success,
            statusCode: parsedResponse.statusCode,
            headers: parsedResponse.headers
            // body intentionally omitted
          };
          
          // Warn if body is being discarded without storage
          if (!storeAs) {
            warnings.push("WARNING: responseHeadersOnly=true without storeAs - response body was discarded. Set storeAs to preserve data or set responseHeadersOnly=false to return body.");
          }
        }
        
        // Add warnings to result if any
        if (warnings.length > 0) {
          if (typeof resultForLLM === 'object' && resultForLLM !== null) {
            resultForLLM.warnings = warnings;
          } else {
            // If transform returned a primitive, wrap it
            resultForLLM = { value: resultForLLM, warnings };
          }
        }
        
        return this._successResult(resultForLLM, { toolState: toolState });
      } catch (error) {
        return this._errorResult(error.toString(), error);
      }
    }
    
    /**
     * Parse HTTP response with binary detection
     * @private
     * @param {HTTPResponse} response - UrlFetchApp response object
     * @param {string} url - Original URL for echo in response
     * @returns {Object} Parsed response with binary detection and encoding metadata
     */
    _parseResponse(response, url) {
      const headers = response.getHeaders();
      const contentType = headers['Content-Type'] || headers['content-type'] || '';
      const statusCode = response.getResponseCode();
      const success = statusCode >= 200 && statusCode < 300;
      
      // Check if binary content using UrlFetchUtils helper
      const isBinary = UrlFetchUtils.isBinaryContentType(contentType);
      
      if (isBinary) {
        try {
          const blob = response.getBlob();
          const bytes = blob.getBytes();
          
          return {
            url,
            success,
            statusCode,
            headers,
            contentType,
            isBinary: true,
            size: bytes.length,
            base64: Utilities.base64Encode(bytes),
            mimeType: blob.getContentType(),
            encoding: 'base64'
          };
        } catch (e) {
          return {
            url,
            success: false,
            statusCode,
            headers,
            contentType,
            isBinary: true,
            error: `Failed to process binary: ${e.toString()}`,
            encoding: null
          };
        }
      }
      
      // Text/JSON response
      const text = response.getContentText();
      let body = text;
      
      if (contentType.includes('application/json') || contentType.includes('text/json')) {
        try {
          body = JSON.parse(text);
        } catch (e) {
          // Keep as text if JSON parse fails
        }
      }
      
      return {
        url,
        success,
        statusCode,
        headers,
        contentType,
        isBinary: false,
        size: text.length,
        body,
        encoding: 'utf8'
      };
    }
  }

  module.exports = SearchToolHandler;
}

__defineModule__(_main);