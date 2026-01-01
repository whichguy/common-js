function _main(
  module = globalThis.__getCurrentModule(),
  exports = module.exports,
  log = globalThis.__getModuleLogFunction?.(module) || (() => {})
) {
  /**
   * common-js/__html_utils
   * HTML Utilities - CommonJS Infrastructure
   * 
   * Server-side HTML templating for Google Apps Script
   * Bootstrap file - auto-loads via __global__ detection
   * 
   * ============================================================================
   * GOOGLE APPS SCRIPT HTTP HEADER LIMITATIONS
   * ============================================================================
   * 
   * ⚠️ IMPORTANT: You CANNOT set custom HTTP headers in Google Apps Script web apps
   * 
   * What you CANNOT do:
   * ❌ Access-Control-Allow-Origin (CORS headers)
   * ❌ Content-Type for HtmlOutput (auto-set to text/html)
   * ❌ Cache-Control
   * ❌ Content-Security-Policy (as HTTP header)
   * ❌ Custom HTTP status codes (always 200 on success)
   * ❌ Any custom headers
   * 
   * What you CAN control:
   * ✅ X-Frame-Options (ONLY HTTP header available via setXFrameOptionsMode)
   * ✅ HTML meta tags (via addMetaTag)
   * ✅ Page title, favicon (via setTitle, setFaviconUrl)
   * ✅ MIME type for non-HTML responses (via ContentService)
   * 
   * Security Reason: Scripts run on google.com domain - allowing header 
   * manipulation could enable cookie-based attacks.
   * 
   * ============================================================================
   * DEPLOYMENT ENVIRONMENT DIFFERENCES
   * ============================================================================
   * 
   * **DEV Environment** (/dev URL):
   *   - Used during development/testing
   *   - X-Frame-Options settings are NOT applied
   *   - Iframe embedding may not work as expected
   *   - URL format: https://script.google.com/macros/s/YOUR_ID/dev
   * 
   * **STAGE/PROD Environments** (/exec URL):
   *   - Used for production deployments
   *   - X-Frame-Options settings ARE applied correctly
   *   - Required for iframe embedding to work
   *   - URL format: https://script.google.com/macros/s/YOUR_ID/exec
   * 
   * ⚠️ CRITICAL: Always test iframe embedding with /exec URLs, not /dev
   * 
   * ============================================================================
   * METHOD CHAIN ORDER
   * ============================================================================
   * 
   * Correct order for HtmlTemplate → HtmlOutput:
   * 
   * HtmlService.createTemplateFromFile('filename')  // Returns HtmlTemplate
   *   .evaluate()                                    // Returns HtmlOutput ✅
   *   .setXFrameOptionsMode(...)                    // Configure HtmlOutput ✅
   *   .addMetaTag(...)                              // Chain more configs ✅
   * 
   * ❌ Common Mistake - Wrapping evaluate() result:
   * HtmlService.createHtmlOutput(
   *   template.evaluate().setXFrameOptionsMode(...) // Settings lost!
   * )
   * 
   * ============================================================================
   * REFERENCES
   * ============================================================================
   * 
   * - Official HtmlService: https://developers.google.com/apps-script/reference/html/html-service
   * - Official HtmlOutput: https://developers.google.com/apps-script/reference/html/html-output
   * - Official HtmlTemplate: https://developers.google.com/apps-script/reference/html/html-template
   * - StackOverflow - Set HTTP Headers: https://stackoverflow.com/questions/59686777/set-http-headers-in-google-apps-script
   * - StackOverflow - X-Frame-Options: https://stackoverflow.com/questions/79538928/properly-setting-the-xframeoptionsmode-for-google-apps-script-iframes
   * - StackOverflow - Read/Modify Headers: https://stackoverflow.com/questions/13848086/read-http-request-headers-and-modify-response-headers-of-an-apps-script-web-app
   */

  /**
   * Default configuration for HTML output
   * @const {Object}
   */
  const HTML_DEFAULTS = {
    /**
     * Default X-Frame-Options mode
     * ALLOWALL enables iframe embedding across all domains
     * Note: Only takes effect on /exec URLs (stage/prod), not /dev URLs
     */
    xFrameOptions: HtmlService.XFrameOptionsMode.ALLOWALL,
    
    /**
     * Default meta tags applied to all HTML output
     */
    metaTags: {
      viewport: 'width=device-width, initial-scale=1'
    }
  };

  /**
   * Create and configure HtmlOutput from template file
   */
  function createHtmlFromTemplate(filename, properties, options) {
    properties = properties || {};
    options = options || {};
    
    // Create template and set properties
    const template = HtmlService.createTemplateFromFile(filename);
    Object.keys(properties).forEach(key => {
      template[key] = properties[key];
    });
    
    // Evaluate template to get HtmlOutput
    let output = template.evaluate();
    
    // Configure with options
    output = configureHtmlOutput(output, options);
    
    return output;
  }

  /**
   * Configure an existing HtmlOutput object with common settings
   */
  function configureHtmlOutput(output, options) {
    options = options || {};
    
    // Set X-Frame-Options (default to ALLOWALL for iframe embedding)
    const allowIframe = options.allowIframe !== undefined ? options.allowIframe : true;
    output.setXFrameOptionsMode(
      allowIframe 
        ? HTML_DEFAULTS.xFrameOptions 
        : HtmlService.XFrameOptionsMode.DEFAULT
    );
    
    // Merge default meta tags with provided ones
    const metaTags = Object.assign({}, HTML_DEFAULTS.metaTags, options.metaTags || {});
    Object.keys(metaTags).forEach(name => {
      output.addMetaTag(name, metaTags[name]);
    });
    
    // Set optional properties
    if (options.title) {
      output.setTitle(options.title);
    }
    
    if (options.faviconUrl) {
      output.setFaviconUrl(options.faviconUrl);
    }
    
    if (options.width) {
      output.setWidth(options.width);
    }
    
    if (options.height) {
      output.setHeight(options.height);
    }
    
    return output;
  }

  /**
   * Include HTML content from another file (server-side include)
   * 
   * Usage in HTML files:
   * <?!= include('filename') ?>
   */
  function include(filename) {
    return HtmlService.createHtmlOutputFromFile(filename).getContent();
  }

  /**
   * Include HTML with variable substitution
   * Supports {{varName}} syntax
   */
  function includeWithVars(filename, vars) {
    let content = HtmlService.createHtmlOutputFromFile(filename).getContent();
    
    Object.keys(vars || {}).forEach(key => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      content = content.replace(regex, String(vars[key]));
    });
    
    return content;
  }

  /**
   * Include with nested include support (recursive)
   * Maximum depth of 10 levels to prevent infinite loops.
   * 
   * Note: HtmlService.createHtmlOutputFromFile() HTML-encodes content,
   * so we must decode entities before matching scriptlet patterns.
   */
  function includeNested(filename, depth) {
    depth = depth || 0;
    
    if (depth > 10) {
      throw new Error(`Maximum include depth (10) exceeded at "${filename}". Check for circular includes.`);
    }
    
    // Use createTemplateFromFile().getRawContent() instead of createHtmlOutputFromFile().getContent()
    // This avoids HTML validation errors for files containing raw JavaScript
    let content = HtmlService.createTemplateFromFile(filename).getRawContent();
    
    // No need to decode HTML entities - getRawContent() returns unencoded content
    
    const includePattern = /<\?!=\s*include\(['"]([^'"]+)['"]\)\s*\?>/g;
    content = content.replace(includePattern, function(match, nestedFilename) {
      return includeNested(nestedFilename, depth + 1);
    });
    
    return content;
  }

  module.exports = {
    include,
    includeWithVars,
    includeNested,
    createHtmlFromTemplate,
    configureHtmlOutput,
    HTML_DEFAULTS,
    __global__: {
      include,
      includeWithVars,
      includeNested,
      createHtmlFromTemplate,
      configureHtmlOutput
    }
  };
}

__defineModule__(_main, true);