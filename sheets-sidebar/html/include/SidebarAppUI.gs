  // ⚠️ WARNING: This file is an HTML include - DO NOT add CommonJS wrapper!
  // This file is included in Sidebar.gs via include('sheets-sidebar/SidebarApp')
  // Always use raw_write with fileType: "HTML" when editing this file.

  /**
   * CRITICAL-2: Render attachment chip with XSS protection and base64 validation
   * @param {object} attachment - Attachment object
   * @param {number} index - Index in currentAttachments array
   */
  function renderAttachmentChip(attachment, index) {
    const $attachmentArea = $('#attachmentPreview');
    if (!$attachmentArea.length) {
      console.warn('[Attachment] Preview area not found');
      return;
    }
    
    // Truncate long filenames
    const displayName = attachment.name.length > ATTACHMENT_CONFIG.MAX_FILENAME_LENGTH
      ? attachment.name.substring(0, ATTACHMENT_CONFIG.MAX_FILENAME_LENGTH - 3) + '...'
      : attachment.name;
    
    // Format file size
    const sizeKB = (attachment.size / 1024).toFixed(1);
    const sizeMB = (attachment.size / 1024 / 1024).toFixed(2);
    const sizeDisplay = attachment.size < 1024 * 1024 ? `${sizeKB}KB` : `${sizeMB}MB`;
    
    // Create chip element
    const $chip = $('<div class="attachment-chip"></div>');
    $chip.attr('data-index', index);
    
    // Add thumbnail or icon
    if (ATTACHMENT_CONFIG.IMAGE_TYPES.includes(attachment.mediaType)) {
      // CRITICAL-2: Validate base64 format before rendering
      const base64Pattern = /^[A-Za-z0-9+/=]+$/;
      if (!base64Pattern.test(attachment.data)) {
        console.error('[Attachment] Invalid base64 data for image');
        showToast(`Invalid image data: ${attachment.name}`, 'error');
        return;
      }
      
      // Create safe data URL with validated base64
      const dataUrl = `data:${attachment.mediaType};base64,${attachment.data}`;
      
      const $thumbnail = $('<img class="attachment-thumbnail">');
      $thumbnail.attr('src', dataUrl);
      $thumbnail.attr('alt', ''); // Empty alt for decorative image
      $chip.append($thumbnail);
    } else if (ATTACHMENT_CONFIG.DOCUMENT_TYPES.includes(attachment.mediaType)) {
      // PDF icon
      const $icon = $('<span class="material-icons attachment-icon">picture_as_pdf</span>');
      $chip.append($icon);
    }
    
    // Add file info (use .text() for XSS safety)
    const $info = $('<div class="attachment-info"></div>');
    const $name = $('<div class="attachment-name"></div>').text(displayName);
    const $size = $('<div class="attachment-size"></div>').text(sizeDisplay);
    $info.append($name, $size);
    $chip.append($info);
    
    // Add remove button
    const $removeBtn = $('<button class="attachment-remove" aria-label="Remove attachment"></button>');
    $removeBtn.html('<span class="material-icons">close</span>');
    $removeBtn.on('click', function(e) {
      e.stopPropagation();
      removeAttachment(index);
    });
    $chip.append($removeBtn);
    
    // Append to preview area
    $attachmentArea.append($chip);
    
    console.log('[Attachment] Rendered chip for', attachment.name);
  }

  /**
   * Remove attachment by index
   * @param {number} index - Index in currentAttachments array
   */
  function removeAttachment(index) {
    if (index < 0 || index >= currentAttachments.length) {
      console.error('[Attachment] Invalid index:', index);
      return;
    }
    
    const attachment = currentAttachments[index];
    console.log('[Attachment] Removing attachment:', attachment.name);
    
    // Remove from array
    currentAttachments.splice(index, 1);
    
    // Re-render all chips (indices changed after splice)
    const $attachmentArea = $('#attachmentPreview');
    $attachmentArea.empty();
    
    currentAttachments.forEach((att, idx) => {
      renderAttachmentChip(att, idx);
    });
    
    // Update attach button badge
    updateAttachButtonBadge();
    
    console.log('[Attachment] Removed. Total:', currentAttachments.length);
  }

  /**
   * CRITICAL-5: Clear all attachments with memory cleanup
   */
  function clearAllAttachments() {
    console.log('[Attachment] Clearing all attachments. Count:', currentAttachments.length);
    
    // CRITICAL-5: Clear FileReader references (already done in file input handler)
    // No additional cleanup needed as FileReader is not stored
    
    // Clear array
    currentAttachments = [];
    
    // Clear pending files
    pendingFiles.clear();
    
    // Clear UI
    const $attachmentArea = $('#attachmentPreview');
    if ($attachmentArea.length) {
      $attachmentArea.empty();
    }
    
    // Update attach button badge
    updateAttachButtonBadge();
    
    console.log('[Attachment] All attachments cleared');
  }

  /**
   * Update attach button badge and clear button visibility
   */
  function updateAttachButtonBadge() {
    const $badge = $('#attachmentBadge');
    const $clearBtn = $('#clearAttachmentsBtn');
    
    if (currentAttachments.length > 0) {
      // Show badge with count
      if ($badge.length) {
        $badge.text(currentAttachments.length).show();
      }
      
      // Show clear button
      if ($clearBtn.length) {
        $clearBtn.show();
      }
    } else {
      // Hide badge
      if ($badge.length) {
        $badge.hide();
      }
      
      // Hide clear button
      if ($clearBtn.length) {
        $clearBtn.hide();
      }
    }
  }

  /**
   * CRITICAL-4: Update isDuplicateFile to check pending files
   * @param {File} file - File to check
   * @returns {boolean} True if file is already attached or being processed
   */
  function isDuplicateFileEnhanced(file) {
    // Check if file is currently being processed
    if (pendingFiles.has(file.name)) {
      return true;
    }
    
    // Check if file is already attached
    return currentAttachments.some(att => 
      att.name === file.name && att.size === file.size
    );
  }

  // ============================================================================
  // GOOGLE PICKER API FOR FOLDER BROWSING (SECURE IMPLEMENTATION)
  // ============================================================================

  /**
   * CRITICAL-1, HIGH-3, HIGH-6: Secure Picker API Manager with closure pattern
   * Encapsulates OAuth token and provides validation
   */
  const PickerManager = (function() {
    // CRITICAL-1: Private variables (not accessible globally)
    let oauthToken = null;
    let pickerApiLoaded = false;
    let currentPicker = null;  // HIGH-5: Track picker instance for cleanup
    let scriptProjectId = null; // CRITICAL-4: Store project ID from server
    
    /**
     * HIGH-3: Validate OAuth token format
     * @param {string} token - Token to validate
     * @returns {boolean} True if valid format
     */
    function validateToken(token) {
      if (!token || typeof token !== 'string') {
        return false;
      }
      // OAuth 2.0 tokens are typically alphanumeric with dots/dashes
      // Should not contain suspicious characters
      const tokenPattern = /^[a-zA-Z0-9._-]+$/;
      return tokenPattern.test(token) && token.length > 20;
    }
    
    /**
     * Set OAuth token with validation
     * @param {string} token - OAuth token
     * @returns {boolean} True if token was set successfully
     */
    function setToken(token) {
      if (!validateToken(token)) {
        console.error('[Picker] Invalid OAuth token format');
        return false;
      }
      oauthToken = token;
      console.log('[Picker] OAuth token validated and stored securely');
      return true;
    }
    
    /**
     * Set script project ID
     * @param {string} projectId - Google Apps Script project ID
     */
    function setProjectId(projectId) {
      scriptProjectId = projectId;
      console.log('[Picker] Project ID stored:', projectId);
    }
    
    /**
     * HIGH-1: Load Picker API with error handling
     * @returns {Promise} Resolves when API is loaded
     */
    function loadApi() {
      return new Promise((resolve, reject) => {
        if (pickerApiLoaded) {
          resolve();
          return;
        }
        
        if (typeof gapi === 'undefined') {
          reject(new Error('Google API library (gapi) not available'));
          return;
        }
        
        console.log('[Picker] Loading Google Picker API...');
        
        gapi.load('picker', {
          'callback': function() {
            pickerApiLoaded = true;
            console.log('[Picker] API loaded successfully');
            resolve();
          },
          'onerror': function(error) {
            console.error('[Picker] Failed to load Picker API:', error);
            reject(new Error('Failed to load Picker API'));
          },
          'timeout': 5000,  // 5 second timeout
          'ontimeout': function() {
            console.error('[Picker] API load timeout after 5 seconds');
            reject(new Error('Picker API load timeout'));
          }
        });
      });
    }
    
    /**
     * HIGH-2, HIGH-5: Show folder picker with race condition protection
     */
    function showPicker() {
      // HIGH-5: Clean up previous picker instance
      if (currentPicker) {
        try {
          currentPicker.setVisible(false);
          currentPicker = null;
        } catch (e) {
          console.warn('[Picker] Error disposing previous picker:', e);
        }
      }
      
      // Check API loaded
      if (!pickerApiLoaded) {
        showError('Picker API not ready. Please wait a moment and try again.');
        return;
      }
      
      // Check token available
      if (!oauthToken) {
        showError('Authentication required. Please refresh the page.');
        return;
      }
      
      // Check project ID available
      if (!scriptProjectId) {
        showError('Configuration error. Please refresh the page.');
        return;
      }
      
      try {
        // Create folder-only view
        const folderView = new google.picker.DocsView(google.picker.ViewId.FOLDERS)
          .setSelectFolderEnabled(true)
          .setMimeTypes('application/vnd.google-apps.folder');
        
        // Create the picker with dynamic project ID
        currentPicker = new google.picker.PickerBuilder()
          .setAppId(scriptProjectId)  // CRITICAL-4: Use dynamic ID
          .setOAuthToken(oauthToken)
          .addView(folderView)
          .setCallback(handlePickerResponse)
          .setTitle('Select Journal Folder')
          .build();
        
        currentPicker.setVisible(true);
        console.log('[Picker] Dialog opened');
      } catch (error) {
        console.error('[Picker] Error showing picker:', error);
        showError('Failed to open folder picker: ' + error.message);
      }
    }
    
    /**
     * CRITICAL-3: Handle picker response with comprehensive validation
     * @param {object} data - Picker response data
     */
    function handlePickerResponse(data) {
      try {
        // Validate response structure
        if (!data || typeof data !== 'object') {
          console.error('[Picker] Invalid response data');
          return;
        }
        
        if (data.action === google.picker.Action.PICKED) {
          // CRITICAL-3: Validate docs array exists
          if (!data.docs || !Array.isArray(data.docs) || data.docs.length === 0) {
            console.error('[Picker] No folders in response');
            showError('No folder selected');
            return;
          }
          
          const folder = data.docs[0];
          
          // CRITICAL-3: Validate folder properties
          if (!folder || typeof folder !== 'object') {
            console.error('[Picker] Invalid folder object');
            showError('Invalid folder selected');
            return;
          }
          
          // CRITICAL-3: Validate folder has required fields
          if (!folder.id || !folder.name || !folder.url) {
            console.error('[Picker] Folder missing required fields');
            showError('Selected folder is invalid');
            return;
          }
          
          // CRITICAL-2: Sanitize folder data
          const folderId = String(folder.id).substring(0, 100);
          const folderName = sanitizeFolderName(folder.name);
          const folderUrl = sanitizeFolderUrl(folder.url);
          
          if (!folderUrl) {
            console.error('[Picker] Invalid folder URL:', folder.url);
            showError('Selected folder has invalid URL');
            return;
          }
          
          console.log('[Picker] Folder selected:', folderName, 'ID:', folderId);
          
          // Update the input field with sanitized folder URL
          $('#journalFolderUrl').val(folderUrl);
          
          // Show success feedback with sanitized name
          const $statusText = $('<span class="picker-success"></span>');
          $statusText.text('✓ Selected: ' + folderName); // .text() is XSS-safe
          $statusText.css({
            'color': '#155724',
            'margin-left': '10px',
            'font-size': '14px'
          });
          
          // Remove any previous status
          $('.picker-success').remove();
          
          // Add status next to input
          $('#journalFolderUrl').after($statusText);
          
          // Auto-remove after 5 seconds (increased from 3)
          setTimeout(() => {
            $statusText.fadeOut(500, function() {
              $(this).remove();
            });
          }, 5000);
          
        } else if (data.action === google.picker.Action.CANCEL) {
          console.log('[Picker] User cancelled folder selection');
        }
      } catch (error) {
        console.error('[Picker] Error handling picker response:', error);
        showError('Error processing folder selection: ' + error.message);
      }
    }
    
    /**
     * Show error message in UI
     * @param {string} message - Error message to display
     */
    function showError(message) {
      showToast(message, 'error');
    }
    
    // HIGH-6: Initialize picker on page load
    (function init() {
      console.log('[Picker] Initializing Picker Manager');
      
      // Wait for server to be ready before making API calls
      window.waitForServer(10000)
        .then(function(server) {
          // HIGH-1: Request OAuth token from server
          return server.exec_api(null, 'sheets-chat/UISupport', 'getOAuthToken')
            .then(function(token) {
              // HIGH-3: Validate and store token securely
              if (!PickerManager.setToken(token)) {
                throw new Error('Failed to validate OAuth token');
              }
              console.log('[SidebarApp] OAuth token validated');
              
              // CRITICAL-4: Get project ID from server
              return server.exec_api(null, 'sheets-chat/UISupport', 'getScriptId');
            })
            .then(function(projectId) {
              if (!projectId) {
                throw new Error('No project ID returned from server');
              }
              PickerManager.setProjectId(projectId);
              
              // HIGH-1: Load Picker API with error handling
              return PickerManager.loadApi();
            })
            .then(function() {
              console.log('[SidebarApp] Picker fully initialized');
            });
        })
        .catch(function(error) {
          console.error('[SidebarApp] Failed to initialize Picker:', error);
        });
    })();
    
    // Public API
    return {
      setToken: setToken,
      setProjectId: setProjectId,
      loadApi: loadApi,
      showPicker: showPicker
    };
  })();

  // ============================================================================
  // MESSAGE DISPLAY FUNCTIONS
  // ============================================================================

  /**
   * Show toast notification
   * @param {string} message - The message to display
   * @param {string} type - The type of toast ('success', 'error', 'info')
   * @param {number} duration - How long to show the toast (ms), default 3000
   */
  function showToast(message, type = 'info', duration = 3000) {
    const $toast = $('<div class="toast"></div>');
    $toast.addClass('toast-' + type);
    $toast.text(message);
    
    $('body').append($toast);
    
    // Trigger reflow to enable animation
    $toast[0].offsetHeight;
    
    $toast.addClass('show');
    
    setTimeout(() => {
      $toast.removeClass('show');
      setTimeout(() => {
        $toast.remove();
      }, 300);
    }, duration);
  }

  /**
   * Update thinking bubble with new messages progressively
   * Avoids duplicate display between polling and final response
   * @param {Array} newMessages - Array of new thinking messages
   * @param {jQuery} $bubble - The thinking bubble element to update
   */
  function updateThinkingBubble(newMessages, $bubble) {
    console.log('[ThinkingBubble] Update called with', newMessages ? newMessages.length : 0, 'messages');
    
    if (!newMessages || newMessages.length === 0) {
      console.log('[ThinkingBubble] No messages to display');
      return;
    }
    
    // Get content area (should already exist from sendMessage)
    let $content = $bubble.find('.all-thoughts-content');
    
    // Append new messages
    let addedCount = 0;
    newMessages.forEach(msg => {
      const thinkingText = sanitizeThinkingText(msg.text);
      if (thinkingText.trim()) {
        const htmlContent = convertMarkdownToHtml(thinkingText);
        const $thinkingMsg = $('<div class="thinking-message"></div>');
        $thinkingMsg.html(htmlContent);
        $content.append($thinkingMsg);
        addedCount++;
      }
    });
    
    console.log('[ThinkingBubble] Added', addedCount, 'thinking messages to content');
    
    // Update title with message count
    const totalCount = $content.children('.thinking-message').length;
    console.log('[ThinkingBubble] Total thinking messages:', totalCount);
    
    const $titleText = $bubble.find('.thinking-title-text');
    if (totalCount > 0) {
      $titleText.text(`Claude's thinking process (${totalCount})`);
    }
    
    // Auto-expand on first message
    if (!$bubble.hasClass('expanded') && totalCount === 1) {
      console.log('[ThinkingBubble] Auto-expanding bubble on first message');
      $bubble.addClass('expanded');
      $bubble.find('.all-thoughts-chevron').text('expand_more');
    }
    
    // Scroll to bottom of thinking content
    if ($content[0]) {
      $content.scrollTop($content[0].scrollHeight);
    }
  }

  /**
   * Display usage statistics in status line
   * @param {object} usage - Usage object from API response
   * @param {number} elapsedMs - Time taken for the request
   */
  function displayUsageStats(usage, elapsedMs) {
    if (!usage) return;
    
    const stats = [];
    
    if (usage.input_tokens) {
      stats.push(`In: ${usage.input_tokens.toLocaleString()}`);
    }
    
    if (usage.output_tokens) {
      stats.push(`Out: ${usage.output_tokens.toLocaleString()}`);
    }
    
    if (elapsedMs) {
      const totalSeconds = Math.floor(elapsedMs / 1000);
      if (totalSeconds < 60) {
        stats.push(`${totalSeconds}s`);
      } else {
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        stats.push(`${minutes}m ${seconds}s`);
      }
    }
    
    if (stats.length > 0) {
      const statsText = stats.join(' • ');
      
      // Update status line (not chat container)
      $('#statusText').text(statsText);
      $('#statusSpinner').addClass('hidden');
      $('#statusArea').show();
      
      // Auto-fade after 5 seconds
      setTimeout(() => {
        $('#statusArea').fadeOut(300);
      }, 5000);
    }
  }
