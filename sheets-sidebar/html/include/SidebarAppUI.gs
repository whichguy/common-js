  // ⚠️ WARNING: This file is an HTML include - DO NOT add CommonJS wrapper!
    // This file is included in Sidebar.gs via includeNested() from SidebarApp
    // Always use raw_write with fileType: "HTML" when editing this file.
    // NOTE: No script tags - parent SidebarApp provides the single wrapper

    /**
     * CRITICAL-2: Render attachment chip with XSS protection and base64 validation
     * @param {object} attachment - Attachment object
     * @param {number} index - Index in currentAttachments array
     */
    function renderAttachmentChip(attachment, index) {
      var $attachmentArea = $('#attachmentPreview');
      if (!$attachmentArea.length) {
        console.warn('[Attachment] Preview area not found');
        return;
      }
      
      // Truncate long filenames
      var displayName = attachment.name.length > ATTACHMENT_CONFIG.MAX_FILENAME_LENGTH
        ? attachment.name.substring(0, ATTACHMENT_CONFIG.MAX_FILENAME_LENGTH - 3) + '...'
        : attachment.name;
      
      // Format file size
      var sizeKB = (attachment.size / 1024).toFixed(1);
      var sizeMB = (attachment.size / 1024 / 1024).toFixed(2);
      var sizeDisplay = attachment.size < 1024 * 1024 ? sizeKB + 'KB' : sizeMB + 'MB';
      
      // Create chip element
      var $chip = $('<div class="attachment-chip"></div>');
      $chip.attr('data-index', index);
      
      // Add thumbnail or icon
      if (ATTACHMENT_CONFIG.IMAGE_TYPES.indexOf(attachment.mediaType) !== -1) {
        // CRITICAL-2: Validate base64 format before rendering
        var base64Pattern = /^[A-Za-z0-9+/=]+$/;
        if (!base64Pattern.test(attachment.data)) {
          console.error('[Attachment] Invalid base64 data for image');
          showToast('Invalid image data: ' + attachment.name, 'error');
          return;
        }
        
        // Create safe data URL with validated base64
        var dataUrl = 'data:' + attachment.mediaType + ';base64,' + attachment.data;
        
        var $thumbnail = $('<img class="attachment-thumbnail">');
        $thumbnail.attr('src', dataUrl);
        $thumbnail.attr('alt', ''); // Empty alt for decorative image
        $chip.append($thumbnail);
      } else if (ATTACHMENT_CONFIG.DOCUMENT_TYPES.indexOf(attachment.mediaType) !== -1) {
        // PDF icon
        var $icon = $('<span class="material-icons attachment-icon">picture_as_pdf</span>');
        $chip.append($icon);
      }
      
      // Add file info (use .text() for XSS safety)
      var $info = $('<div class="attachment-info"></div>');
      var $name = $('<div class="attachment-name"></div>').text(displayName);
      var $size = $('<div class="attachment-size"></div>').text(sizeDisplay);
      $info.append($name, $size);
      $chip.append($info);
      
      // Add remove button
      var $removeBtn = $('<button class="attachment-remove" aria-label="Remove attachment"></button>');
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

    // NOTE: removeAttachment is declared in SidebarScript - do not redeclare here

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
      pendingFiles = {};
      
      // Clear UI
      var $attachmentArea = $('#attachmentPreview');
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
      var $badge = $('#attachmentBadge');
      var $clearBtn = $('#clearAttachmentsBtn');
      
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
      if (pendingFiles[file.name]) {
        return true;
      }
      
      // Check if file is already attached
      return currentAttachments.some(function(att) {
        return att.name === file.name && att.size === file.size;
      });
    }

    // ============================================================================
    // GOOGLE PICKER API FOR FOLDER BROWSING (SECURE IMPLEMENTATION)
    // ============================================================================

    /**
     * CRITICAL-1, HIGH-3, HIGH-6: Secure Picker API Manager with closure pattern
     * Encapsulates OAuth token and provides validation
     */
    var PickerManager = (function() {
      // CRITICAL-1: Private variables (not accessible globally)
      var oauthToken = null;
      var pickerApiLoaded = false;
      var currentPicker = null;  // HIGH-5: Track picker instance for cleanup
      var scriptProjectId = null; // CRITICAL-4: Store project ID from server
      
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
        var tokenPattern = /^[a-zA-Z0-9._-]+$/;
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
        return new Promise(function(resolve, reject) {
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
          var folderView = new google.picker.DocsView(google.picker.ViewId.FOLDERS)
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
            
            var folder = data.docs[0];
            
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
            var folderId = String(folder.id).substring(0, 100);
            var folderName = sanitizeFolderName(folder.name);
            var folderUrl = sanitizeFolderUrl(folder.url);
            
            if (!folderUrl) {
              console.error('[Picker] Invalid folder URL:', folder.url);
              showError('Selected folder has invalid URL');
              return;
            }
            
            console.log('[Picker] Folder selected:', folderName, 'ID:', folderId);
            
            // Update the input field with sanitized folder URL
            $('#journalFolderUrl').val(folderUrl);
            
            // Show success feedback with sanitized name
            var $statusText = $('<span class="picker-success"></span>');
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
            setTimeout(function() {
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
      
      /**
       * Initialize picker - waits for server object to be available
       */
      function initPicker() {
        console.log('[Picker] Initializing Picker Manager');
        
        // Wait for server object to be available
        function waitForServer() {
          // Check if google.script.run is available first (gas_client needs it)
          if (typeof google !== 'undefined' && google.script && google.script.run && window.server) {
            console.log('[Picker] server object available, requesting OAuth token');
            initPickerWithServer();
          } else {
            setTimeout(waitForServer, 100);
          }
        }
        
        function initPickerWithServer() {
          // HIGH-1: Request OAuth token from server
          // FIX: Properly chain nested promises to prevent memory leak warning
          window.server.exec_api(null, 'sheets-chat/UISupport', 'getOAuthToken')
            .then(function(token) {
              // HIGH-3: Validate and store token securely
              if (!setToken(token)) {
                console.error('[SidebarApp] Failed to validate OAuth token');
                return Promise.reject(new Error('Invalid OAuth token'));
              }
              
              console.log('[SidebarApp] OAuth token validated');
              
              // CRITICAL-4: Get project ID from server - return the promise chain
              return window.server.exec_api(null, 'sheets-chat/UISupport', 'getScriptId');
            })
            .then(function(projectId) {
              if (!projectId) {
                console.error('[SidebarApp] No project ID returned from server');
                return Promise.reject(new Error('No project ID'));
              }
              
              setProjectId(projectId);
              
              // HIGH-1: Load Picker API with error handling - return the promise
              return loadApi();
            })
            .then(function() {
              console.log('[SidebarApp] Picker fully initialized');
            })
            .catch(function(error) {
              console.error('[SidebarApp] Failed to initialize Picker:', error);
            });
        }
        
        waitForServer();
      }
      
      // HIGH-6: Initialize picker on document ready (must wait for gas_client to set up window.server)
      $(document).ready(function() {
        initPicker();
      });
      
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
    function showToast(message, type, duration) {
      type = type || 'info';
      duration = duration || 3000;
      
      var $toast = $('<div class="toast"></div>');
      $toast.addClass('toast-' + type);
      $toast.text(message);
      
      $('body').append($toast);
      
      // Trigger reflow to enable animation
      $toast[0].offsetHeight;
      
      $toast.addClass('show');
      
      setTimeout(function() {
        $toast.removeClass('show');
        setTimeout(function() {
          $toast.remove();
        }, 300);
      }, duration);
    }

    // NOTE: updateThinkingBubble() removed - replaced with simple inline indicator
    // The thinking content is no longer displayed, only a simple dots animation

    /**
     * Load saved conversations into dropdown
     * Fetches from Drive via UISupport.listConversations()
     */
    function loadConversationDropdown() {
      console.log('[Conversation] Loading conversation dropdown');

      var $dropdown = $('#conversationSelector');
      if (!$dropdown.length) {
        console.warn('[Conversation] Dropdown element not found');
        return;
      }

      // Clear existing options except placeholder
      $dropdown.find('option:not(:first)').remove();

      // Call backend to get conversations
      window.server.exec_api(null, 'sheets-chat/UISupport', 'listConversations')
        .then(function(result) {
          if (!result || !result.success) {
            console.error('[Conversation] Failed to load conversations:', result && result.error);
            return;
          }

          var conversations = (result.data && result.data.conversations) || [];
          console.log('[Conversation] Loaded ' + conversations.length + ' conversations');

          // Add options for each conversation
          conversations.forEach(function(conv) {
            var $option = $('<option></option>');
            $option.val(conv.id);

            // Format display text: title or date
            var displayText = conv.title || conv.name || 'Conversation';
            if (conv.createdAt) {
              var date = new Date(conv.createdAt);
              displayText += ' (' + date.toLocaleDateString() + ')';
            }

            $option.text(displayText);
            $dropdown.append($option);
          });
        })
        .catch(function(error) {
          console.error('[Conversation] Error loading conversations:', error);
        });
    }

    /**
     * Display usage statistics in status line
     * @param {object} usage - Usage object from API response
     * @param {number} elapsedMs - Time taken for the request
     */
    function displayUsageStats(usage, elapsedMs) {
      if (!usage) return;
      
      var stats = [];
      
      if (usage.input_tokens) {
        stats.push('In: ' + usage.input_tokens.toLocaleString());
      }
      
      if (usage.output_tokens) {
        stats.push('Out: ' + usage.output_tokens.toLocaleString());
      }
      
      if (elapsedMs) {
        var totalSeconds = Math.floor(elapsedMs / 1000);
        if (totalSeconds < 60) {
          stats.push(totalSeconds + 's');
        } else {
          var minutes = Math.floor(totalSeconds / 60);
          var seconds = totalSeconds % 60;
          stats.push(minutes + 'm ' + seconds + 's');
        }
      }
      
      if (stats.length > 0) {
        var statsText = stats.join(' • ');
        
        // Update status line (not chat container)
        $('#statusText').text(statsText);
        $('#statusSpinner').addClass('hidden');
        $('#statusArea').show();
        
        // Auto-fade after 5 seconds
        setTimeout(function() {
          $('#statusArea').fadeOut(300);
        }, 5000);
      }
    }

