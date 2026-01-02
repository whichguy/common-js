  // ⚠️ WARNING: This file is an HTML include - DO NOT add CommonJS wrapper!
  // This file is included in Sidebar.gs via includeNested() from SidebarApp
  // Always use raw_write with fileType: "HTML" when editing this file.
  // NOTE: No script tags - parent SidebarApp provides the single wrapper

  console.log('[SidebarApp] Initializing main application - Version 2025-10-31-picker-security-fixes');

  // ============================================================================
  // CONFIGURATION CONSTANTS
  // ============================================================================
  var CONFIG = {
    polling: {
      MAX_WAIT_MS: 7000,           // Server waits up to 7s for messages per poll
      CHECK_INTERVAL_MS: 300,      // Server checks every 300ms
      MAX_DURATION_MS: 180000,     // Maximum polling duration: 3 minutes (180s)
    },
    retry: {
      MAX_ATTEMPTS: 3,             // Retry failed requests 3 times
      INITIAL_DELAY_MS: 1000,      // Start with 1s delay
    },
    api: {
      module: 'sheets-chat/UISupport',
      functions: {
        sendMessage: 'sendMessageToClaude',
        pollMessages: 'pollMessages',
        // saveConversation removed - auto-saves to Drive
        loadConversation: 'loadConversation',
        listConversations: 'listConversations',
        loadCommandHistory: 'loadCommandHistory'
      }
    }
  };

  // ============================================================================
  // MESSAGE HISTORY MANAGEMENT
  // ============================================================================
  var messageHistory = {
    items: [],           // Array of previous messages
    index: -1,          // Current position in history (-1 = not navigating)
    currentDraft: '',   // Save current draft when starting navigation
    MAX_ITEMS: 100      // HIGH-2: Maximum history size to prevent memory leak
  };

  /**
   * Save a message to history with maximum size enforcement
   * @param {string} message - The message to save
   */
  function saveToHistory(message) {
    if (!message || !message.trim()) {
      return;
    }
    
    var trimmedMessage = message.trim();
    
    // Don't save duplicate consecutive messages
    if (messageHistory.items.length > 0 && 
        messageHistory.items[messageHistory.items.length - 1] === trimmedMessage) {
      return;
    }
    
    messageHistory.items.push(trimmedMessage);
    
    // HIGH-2: Enforce maximum history size
    if (messageHistory.items.length > messageHistory.MAX_ITEMS) {
      messageHistory.items.shift(); // Remove oldest
    }
    
    messageHistory.index = -1;
    messageHistory.currentDraft = '';
  }

  // ============================================================================
  // SEND BUTTON STATE MANAGEMENT
  // ============================================================================

  // Cache DOM elements for performance
  var $cachedSendBtn = null;
  var $cachedMessageInput = null;

  /**
   * Update send button enabled/disabled state based on input content
   */
  function updateSendButtonState() {
    // Cache selectors for better performance
    if (!$cachedSendBtn || !$cachedMessageInput) {
      $cachedSendBtn = $('#sendBtn');
      $cachedMessageInput = $('#messageInput');
      
      if (!$cachedSendBtn.length || !$cachedMessageInput.length) {
        console.warn('[SendButton] Elements not found, cannot cache');
        return;
      }
    }
    
    var message = $cachedMessageInput.val().trim();
    var hasMessage = message.length > 0;
    
    $cachedSendBtn.prop('disabled', !hasMessage);
    
    // Visual feedback
    if (hasMessage) {
      $cachedSendBtn.removeClass('disabled');
    } else {
      $cachedSendBtn.addClass('disabled');
    }
  }

  // ============================================================================
  // GLOBAL STATE
  // ============================================================================
  var currentThreadId = null;  // Track conversation thread
  var isMessageProcessing = false;    // Track if message is being processed
  var currentRequestId = null; // Track current request for thinking polling
  // NOTE: messageStartTime is declared in SidebarScript - do not redeclare here
  var timerInterval = null;    // Live timer interval for counting up during message send
  var currentMessages = [];    // Track current conversation messages for saving
  var loadedConversationId = null; // Track which conversation is currently loaded
  var currentCancellableCall = null; // Track current CancellableCall for cancel functionality
  var currentPollingController = null; // Track current polling controller to prevent orphaned loops
  var promptQueue = []; // FIFO queue for pending prompts when processing

  // ============================================================================
  // ATTACHMENT CONFIGURATION AND STORAGE
  // ============================================================================
  var ATTACHMENT_CONFIG = {
    // Supported file types (based on Anthropic API specs)
    IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    DOCUMENT_TYPES: ['application/pdf'],
    
    // File extension validation (prevent MIME spoofing)
    VALID_EXTENSIONS: {
      'image/jpeg': ['.jpg', '.jpeg', '.jpe'],
      'image/png': ['.png'],
      'image/gif': ['.gif'],
      'image/webp': ['.webp'],
      'application/pdf': ['.pdf']
    },
    
    // Size limits
    MAX_FILE_SIZE: 25 * 1024 * 1024,        // 25MB per file (user specified)
    MAX_REQUEST_SIZE: 32 * 1024 * 1024,     // 32MB total (API limit)
    MAX_IMAGE_COUNT: 100,                    // API limit
    MAX_PDF_PAGES: 100,                      // API limit (verified server-side)
    
    // Display limits
    MAX_FILENAME_LENGTH: 30
  };

  // Attachment storage
  var currentAttachments = [];

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  /**
   * CRITICAL-5: Validate and limit thinking text length
   * NOTE: No HTML sanitization here - DOMPurify handles all sanitization in convertMarkdownToHtml()
   * This prevents the XSS window that could occur from partial HTML tag removal
   * @param {*} text - Text to validate
   * @returns {string} Validated text
   */
  function sanitizeThinkingText(text) {
    if (typeof text !== 'string') {
      console.warn('[Sanitize] Non-string input:', typeof text);
      return '';
    }
    
    // Limit length to prevent DoS
    var maxLength = 100000; // 100KB
    if (text.length > maxLength) {
      console.warn('[Sanitize] Text exceeds max length, truncating');
      return text.substring(0, maxLength) + '\n\n[... content truncated ...]';
    }
    
    // Return text as-is - DOMPurify will handle all sanitization
    return text;
  }

  /**
   * Convert markdown to safe HTML with DOMPurify sanitization
   * Handles both markdown and HTML inputs
   * @param {string} text - Markdown or HTML text to convert
   * @returns {string} Sanitized HTML
   */
  function convertMarkdownToHtml(text) {
    if (!text || typeof text !== 'string') {
      return '';
    }
    
    try {
      // Check if marked library is loaded
      if (typeof marked === 'undefined') {
        console.warn('[Markdown] marked.js not loaded, using plain text');
        return $('<div>').text(text).html(); // XSS-safe fallback
      }
      
      // Parse markdown to HTML
      var rawHtml = marked.parse(text, {
        breaks: true,              // Convert \n to <br>
        gfm: true,                 // GitHub Flavored Markdown
        headerIds: false,          // Don't add IDs to headers (security)
        mangle: false              // Don't mangle email addresses
      });
      
      // Check if DOMPurify is loaded
      if (typeof DOMPurify === 'undefined') {
        console.warn('[Markdown] DOMPurify not loaded, using plain text');
        return $('<div>').text(text).html(); // XSS-safe fallback
      }
      
      // Sanitize the HTML with enhanced link security configuration
      var sanitizedHtml = DOMPurify.sanitize(rawHtml, {
        ALLOWED_TAGS: [
          'p', 'br', 'strong', 'em', 'b', 'i', 'u', 's',
          'code', 'pre', 'ul', 'ol', 'li',
          'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
          'blockquote', 'hr', 'a', 'span', 'div',
          'table', 'thead', 'tbody', 'tr', 'th', 'td',
          'img'
        ],
        ALLOWED_ATTR: ['href', 'title', 'target', 'rel', 'class', 'src', 'alt', 'width', 'height'],
        ALLOWED_URI_REGEXP: /^(https?:\/\/|mailto:|tel:)/,  // Allow http(s), mailto, tel links
        FORBID_TAGS: [
          'script', 'style', 'iframe', 'object',
          'embed', 'form', 'input', 'textarea', 'button'
        ],
        FORBID_ATTR: [
          'style', 'onerror', 'onload', 'onclick',
          'onmouseover', 'onfocus', 'onblur'
        ],
        KEEP_CONTENT: true,        // Keep content of removed tags
        RETURN_DOM: false,         // Return HTML string
        RETURN_DOM_FRAGMENT: false,
        
        // Add hooks to enhance link security
        HOOKS: {
          afterSanitizeAttributes: function(node) {
            // Add target="_blank" and rel="noopener noreferrer" to all links
            if (node.tagName === 'A' && node.hasAttribute('href')) {
              node.setAttribute('target', '_blank');
              node.setAttribute('rel', 'noopener noreferrer');
              node.setAttribute('class', 'external-link');
            }
          }
        }
      });
      
      return sanitizedHtml;
      
    } catch (error) {
      console.error('[Markdown] Conversion failed:', error);
      // XSS-safe fallback on error
      return $('<div>').text(text).html();
    }
  }

  /**
   * CRITICAL-2: Sanitize folder URL to prevent XSS
   * @param {string} url - URL to sanitize
   * @returns {string} Sanitized URL or empty string if invalid
   */
  function sanitizeFolderUrl(url) {
    if (typeof url !== 'string') {
      console.warn('[Sanitize] URL is not a string:', typeof url);
      return '';
    }
    
    // Only allow Google Drive URLs
    var drivePattern = /^https:\/\/drive\.google\.com\/drive\/folders\/[a-zA-Z0-9_-]+/;
    if (!drivePattern.test(url)) {
      console.warn('[Sanitize] URL does not match Drive folder pattern');
      return '';
    }
    
    return url;
  }

  /**
   * CRITICAL-2: Sanitize folder name for display
   * @param {string} name - Folder name to sanitize
   * @returns {string} Sanitized name
   */
  function sanitizeFolderName(name) {
    if (typeof name !== 'string') {
      return '';
    }
    
    // Remove HTML tags and limit length
    var withoutHtml = name.replace(/<[^>]*>/g, '');
    return withoutHtml.substring(0, 100); // Max 100 chars
  }

  // ============================================================================
  // FILE ATTACHMENT VALIDATION
  // ============================================================================

  /**
   * Validate file for attachment with comprehensive checks
   * @param {File} file - File object to validate
   * @returns {object} Validation result with {valid: boolean, error?: string}
   */
  function validateFile(file) {
    if (!file || !(file instanceof File)) {
      return {
        valid: false,
        error: 'Invalid file object'
      };
    }
    
    // Check if file type is supported
    var allTypes = ATTACHMENT_CONFIG.IMAGE_TYPES.concat(ATTACHMENT_CONFIG.DOCUMENT_TYPES);
    if (allTypes.indexOf(file.type) === -1) {
      return {
        valid: false,
        error: 'Unsupported file type: ' + file.type + '. Supported types: images (JPEG, PNG, GIF, WebP) and PDF'
      };
    }
    
    // Check MIME type + extension match (prevent spoofing)
    var extMatch = file.name.toLowerCase().match(/\.[^.]+$/);
    var ext = extMatch ? extMatch[0] : '';
    var validExts = ATTACHMENT_CONFIG.VALID_EXTENSIONS[file.type];
    if (!validExts || validExts.indexOf(ext) === -1) {
      return {
        valid: false,
        error: 'File extension ' + ext + ' doesn\'t match type ' + file.type
      };
    }
    
    // Check file size
    if (file.size > ATTACHMENT_CONFIG.MAX_FILE_SIZE) {
      var fileSizeMB = (file.size / 1024 / 1024).toFixed(2);
      var limitMB = (ATTACHMENT_CONFIG.MAX_FILE_SIZE / 1024 / 1024).toFixed(0);
      return {
        valid: false,
        error: 'File too large: ' + file.name + ' (' + fileSizeMB + 'MB) exceeds ' + limitMB + 'MB limit'
      };
    }
    
    // Check if zero-byte file
    if (file.size === 0) {
      return {
        valid: false,
        error: 'Empty file: ' + file.name
      };
    }
    
    return { valid: true };
  }

  /**
   * Validate total attachment size limits
   * @param {number} newFileSize - Size of file being added
   * @returns {object} Validation result with {valid: boolean, error?: string}
   */
  function validateAttachmentLimits(newFileSize) {
    // Calculate current total size
    var currentSize = currentAttachments.reduce(function(sum, att) { return sum + (att.size || 0); }, 0);
    var totalSize = currentSize + newFileSize;
    
    // Check total request size (base64 increases size by ~33%)
    var estimatedBase64Size = totalSize * 1.33;
    if (estimatedBase64Size > ATTACHMENT_CONFIG.MAX_REQUEST_SIZE) {
      var currentMB = (currentSize / 1024 / 1024).toFixed(2);
      var newMB = (newFileSize / 1024 / 1024).toFixed(2);
      var totalMB = (totalSize / 1024 / 1024).toFixed(2);
      var limitMB = (ATTACHMENT_CONFIG.MAX_REQUEST_SIZE / 1024 / 1024).toFixed(0);
      return {
        valid: false,
        error: 'Total size would exceed ' + limitMB + 'MB limit. Current: ' + currentMB + 'MB, Adding: ' + newMB + 'MB, Total: ' + totalMB + 'MB'
      };
    }
    
    // Check image count limit
    var imageCount = currentAttachments.filter(function(att) {
      return ATTACHMENT_CONFIG.IMAGE_TYPES.indexOf(att.mediaType) !== -1;
    }).length;
    
    if (imageCount >= ATTACHMENT_CONFIG.MAX_IMAGE_COUNT) {
      return {
        valid: false,
        error: 'Maximum ' + ATTACHMENT_CONFIG.MAX_IMAGE_COUNT + ' images allowed per message'
      };
    }
    
    return { valid: true };
  }

  /**
   * Check if file is already attached
   * @param {File} file - File to check
   * @returns {boolean} True if file is already attached
   */
  function isDuplicateFile(file) {
    return currentAttachments.some(function(att) {
      return att.name === file.name && att.size === file.size;
    });
  }

  // ============================================================================
  // ATTACHMENT MANAGEMENT UI
  // ============================================================================

  // Track pending file operations to prevent race conditions
  var pendingFiles = {};

  /**
   * CRITICAL-4: Show loading state for file being processed
   * @param {string} fileName - Name of file being loaded
   */
  function showFileLoading(fileName) {
    // CRITICAL-4: Add to pending set to prevent duplicates during processing
    pendingFiles[fileName] = true;
    
    // Create a temporary loading chip
    var $attachmentArea = $('#attachmentPreview');
    if (!$attachmentArea.length) {
      console.warn('[Attachment] Preview area not found');
      return;
    }
    
    // Truncate long filenames
    var displayName = fileName.length > ATTACHMENT_CONFIG.MAX_FILENAME_LENGTH
      ? fileName.substring(0, ATTACHMENT_CONFIG.MAX_FILENAME_LENGTH - 3) + '...'
      : fileName;
    
    var $loadingChip = $('<div class="attachment-chip loading" data-filename="' + fileName + '">' +
      '<span class="material-icons spinning">refresh</span>' +
      '<span class="attachment-name">' + displayName + '</span>' +
      '</div>');
    
    $attachmentArea.append($loadingChip);
    console.log('[Attachment] Showing loading state for', fileName);
  }

  /**
   * CRITICAL-1: Add attachment to array and render with security fixes
   * @param {object} attachment - Attachment object with {name, size, mediaType, data, timestamp}
   */
  function addAttachment(attachment) {
    if (!attachment || typeof attachment !== 'object') {
      console.error('[Attachment] Invalid attachment object');
      return;
    }
    
    // CRITICAL-4: Remove from pending set
    delete pendingFiles[attachment.name];
    
    // Remove loading chip for this file
    $('.attachment-chip.loading[data-filename="' + attachment.name + '"]').remove();
    
    // Add to attachments array
    currentAttachments.push(attachment);
    
    // Render attachment chip
    renderAttachmentChip(attachment, currentAttachments.length - 1);
    
    // Update attach button badge
    updateAttachButtonBadge();
    
    console.log('[Attachment] Added attachment:', attachment.name, 'Total:', currentAttachments.length);
  }
