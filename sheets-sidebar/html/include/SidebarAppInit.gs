  // ⚠️ WARNING: This file is an HTML include - DO NOT add CommonJS wrapper!
  // This file is included in Sidebar.gs via include('sheets-sidebar/SidebarApp')
  // Always use raw_write with fileType: "HTML" when editing this file.

  // ============================================================================

  // Wait for jQuery to load before initializing
  (function waitForJQuery() {
    if (typeof $ !== 'undefined' && typeof jQuery !== 'undefined') {
      // jQuery is loaded, initialize app
      initApp();
    } else {
      // jQuery not loaded yet, wait and try again
      setTimeout(waitForJQuery, 50);
    }
  })();

  function initApp() {
    console.log('[SidebarApp] jQuery loaded, initializing app');
  
  $(document).ready(function() {
    console.log('[SidebarApp] Document ready, initializing event handlers');
    
    // Send button click
    $('#sendBtn').on('click', function() {
      console.log('[SidebarApp] Send button clicked');
      sendMessage();
    });
    
    // Cancel button click
    // Note: gas_client doesn't support .cancel() - GAS server functions cannot be interrupted
    // This just resets the UI state; the server continues processing but we ignore the result
    $('#cancelBtn').on('click', function() {
      console.log('[SidebarApp] Cancel button clicked');
      if (currentCancellableCall) {
        // Store reference before clearing so we can attach handlers to prevent memory leak
        var pendingCall = currentCancellableCall;
        
        // Clear the reference so sendMessage's await ignores the result
        currentCancellableCall = null;
        
        // CRITICAL: Attach .catch() to prevent "potential memory leak" warning
        // The promise will still resolve/reject, we just ignore the result
        pendingCall.catch(function(err) {
          console.log('[Cancel] Ignored error from cancelled request:', err.message || err);
        });
        
        hideLoadingState();
        showToast('Request cancelled (server may still be processing)', 'info');
        console.log('[Cancel] UI reset - ignoring any pending server response');
      } else {
        console.warn('[Cancel] No active request to cancel');
        showToast('No active request to cancel', 'info');
      }
    });
    
    // Combined keydown handler for Enter key and arrow key navigation
    $('#messageInput').on('keydown', function(e) {
      
      // Handle Enter key to send (Shift+Enter for new line)
      if (e.key === 'Enter' && !e.shiftKey) {
        console.log('[MessageInput] Enter pressed, sending message');
        e.preventDefault();
        sendMessage();
        return;  // Exit early after handling
      }
      
      // Handle arrow keys for message history navigation
      // Only handle arrow keys if not holding Shift (allow Shift+Arrow for text selection)
      if (e.shiftKey) {
        console.log('[MessageHistory] Shift key held, allowing default arrow behavior');
        return;
      }
      
      if (e.key === 'ArrowUp') {
        console.log('[MessageHistory] ArrowUp pressed. Current index:', messageHistory.index, 'History length:', messageHistory.items.length);
        e.preventDefault();
        
        // Start navigating from the end if not already navigating
        if (messageHistory.index === -1) {
          messageHistory.currentDraft = $(this).val();
          messageHistory.index = messageHistory.items.length;
          console.log('[MessageHistory] Starting navigation. Saved draft:', messageHistory.currentDraft.substring(0, 30));
        }
        
        // Move to previous message
        if (messageHistory.index > 0) {
          messageHistory.index--;
          const message = messageHistory.items[messageHistory.index];
          console.log('[MessageHistory] Moving to index', messageHistory.index, 'Message:', message.substring(0, 50));
          $(this).val(message);
          updateSendButtonState();
        } else {
          console.log('[MessageHistory] Already at beginning of history');
        }
      } else if (e.key === 'ArrowDown') {
        console.log('[MessageHistory] ArrowDown pressed. Current index:', messageHistory.index, 'History length:', messageHistory.items.length);
        e.preventDefault();
        
        // Only handle if we're currently navigating
        if (messageHistory.index !== -1) {
          // Move to next message
          if (messageHistory.index < messageHistory.items.length - 1) {
            messageHistory.index++;
            const message = messageHistory.items[messageHistory.index];
            console.log('[MessageHistory] Moving to index', messageHistory.index, 'Message:', message.substring(0, 50));
            $(this).val(message);
          } else {
            // Reached the end, restore current draft
            console.log('[MessageHistory] Reached end, restoring draft:', messageHistory.currentDraft.substring(0, 30));
            messageHistory.index = -1;
            $(this).val(messageHistory.currentDraft);
          }
          updateSendButtonState();
        } else {
          console.log('[MessageHistory] Not currently navigating history');
        }
      }
    });
    
    // Input event for send button state and auto-grow
    $('#messageInput').on('input', function() {
      updateSendButtonState();
      autoGrowTextarea();
    });
    
    // Settings button
    $('#settingsBtn').on('click', function() {
      console.log('[SidebarApp] Settings button clicked');
      showSettings();
    });
    
    // Save conversation button
    $('#saveConversationBtn').on('click', function() {
      console.log('[SidebarApp] Save conversation button clicked');
      saveConversation();
    });
    
    // Load conversation button
    $('#loadConversationBtn').on('click', function() {
      console.log('[SidebarApp] Load conversation button clicked');
      showConversationList();
    });
    
    // View Journal button
    $('#viewJournalBtn').on('click', function() {
      const journalUrl = $(this).data('journal-url');
      if (journalUrl) {
        window.open(journalUrl, '_blank');
      } else {
        showToast('No journal URL available', 'error');
      }
    });
    
    // Clear Chat button handler
    const $clearChatBtn = $('#clearChatBtn');
    if ($clearChatBtn.length) {
      console.log('Clear Chat button found, attaching handler');
      $clearChatBtn.on('click', function() {
        console.log('Clear Chat button clicked');
        
        // Confirm with user
        if (!confirm('Clear the current conversation? This will start a new chat.')) {
          return;
        }
        
        // Clear client-side state
        currentMessages = [];
        currentThreadId = null;
        
        // Clear UI
        $('#chatContainer').empty();
        $('#conversationSelector').val('');
        $('#viewJournalBtn').hide();
        
        // Call server-side clearChat
        server.exec_api(null, 'sheets-chat/UISupport', 'clearChat')
          .then(function(result) {
            if (result && result.success) {
              console.log('[Clear Chat] Server-side state cleared');
              showToast('Chat cleared. Starting new conversation.', 'success');
            } else {
              console.warn('[Clear Chat] Server response:', result);
              showToast('Chat UI cleared locally.', 'info');
            }
          })
          .catch(function(error) {
            console.error('[Clear Chat] Error:', error);
            showToast('Chat UI cleared, but server error: ' + error.message, 'warning');
          });
      });
    }
    
    // Attach button
    $('#attachBtn').on('click', function() {
      $('#fileInput').click();
    });
    
    // Clear attachments button
    $('#clearAttachmentsBtn').on('click', function() {
      clearAllAttachments();
    });
    
    // File input change handler with CRITICAL security fixes
    $('#fileInput').on('change', function(e) {
      const files = e.target.files;
      if (!files || files.length === 0) {
        return;
      }
      
      console.log('[FileInput] Files selected:', files.length);
      
      // Process each file
      Array.from(files).forEach(file => {
        // CRITICAL-4: Check for duplicate files (including pending files)
        if (isDuplicateFileEnhanced(file)) {
          showToast(`File already attached or being processed: ${file.name}`, 'info');
          return;
        }
        
        // Validate file
        const validation = validateFile(file);
        if (!validation.valid) {
          showToast(validation.error, 'error');
          return;
        }
        
        // Validate attachment limits
        const limitsValidation = validateAttachmentLimits(file.size);
        if (!limitsValidation.valid) {
          showToast(limitsValidation.error, 'error');
          return;
        }
        
        // CRITICAL-4: Show loading state BEFORE starting FileReader
        showFileLoading(file.name);
        
        // Read file as base64
        const reader = new FileReader();
        
        reader.onload = function(e) {
          try {
            // CRITICAL-5: No need to store FileReader - garbage collector handles cleanup
            
            // Extract base64 data (remove data URL prefix)
            const base64Data = e.target.result.split(',')[1];
            
            // Create attachment object
            const attachment = {
              name: file.name,
              size: file.size,
              mediaType: file.type,
              data: base64Data,
              timestamp: Date.now()
            };
            
            // Add to attachments
            addAttachment(attachment);
            
            console.log('[FileInput] File processed successfully:', file.name);
          } catch (error) {
            console.error('[FileInput] Error processing file:', error);
            showToast(`Failed to process ${file.name}: ${error.message}`, 'error');
            
            // CRITICAL-4: Remove from pending set on error
            pendingFiles.delete(file.name);
            
            // Remove loading chip
            $(`.attachment-chip.loading[data-filename="${file.name}"]`).remove();
          }
        };
        
        reader.onerror = function(error) {
          console.error('[FileInput] FileReader error:', error);
          showToast(`Failed to read ${file.name}`, 'error');
          
          // CRITICAL-4: Remove from pending set on error
          pendingFiles.delete(file.name);
          
          // Remove loading chip
          $(`.attachment-chip.loading[data-filename="${file.name}"]`).remove();
        };
        
        // Start reading
        reader.readAsDataURL(file);
      });
      
      // Clear file input so same file can be selected again
      $(this).val('');
    });

    // Font size slider handler with live preview (input event fires while dragging)
    $('#fontSizeSlider').on('input', function() {
      var size = $(this).val();
      $('#fontSizeValue').text(size + 'px');
      applyFontSize(size);
      console.log('[FontSize] Live preview:', size + 'px');
    });

    // Save font size when slider is released (change event fires on release)
    $('#fontSizeSlider').on('change', function() {
      var size = $(this).val();
      saveFontSize(size);
      console.log('[FontSize] Saved:', size + 'px');
    });

    // Load saved font size on init
    loadSavedFontSize();
    
    // Save Config button click handler
    $('#saveConfigBtn').on('click', function() {
      console.log('[Config] Save button clicked');
      var $btn = $(this);
      var $status = $('#configStatus');
      
      // Get form values
      var apiKey = $('#apiKey').val().trim();
      var modelName = $('#modelName').val();
      var journalEnabled = $('#journalEnabled').is(':checked');
      var journalFolderUrl = $('#journalFolderUrl').val().trim();
      
      // Disable button during save
      $btn.prop('disabled', true).text('Saving...');
      $status.text('').removeClass('error success');
      
      // Build config object
      var configData = {
        modelName: modelName
      };
      
      // Only include API key if it was changed (not empty)
      if (apiKey) {
        configData.apiKey = apiKey;
      }
      
      // Save config to server
      server.exec_api(null, CONFIG.api.module, 'saveConfig', configData)
        .then(function(result) {
          if (result && result.success) {
            console.log('[Config] Saved successfully');
            $status.text('Configuration saved!').addClass('success');
            showToast('Configuration saved successfully', 'success');
          } else {
            console.error('[Config] Save failed:', result);
            $status.text('Failed to save: ' + (result.error || 'Unknown error')).addClass('error');
            showToast('Failed to save configuration', 'error');
          }
        })
        .catch(function(error) {
          console.error('[Config] Save error:', error);
          $status.text('Error: ' + error.message).addClass('error');
          showToast('Error saving configuration: ' + error.message, 'error');
        })
        .finally(function() {
          $btn.prop('disabled', false).text('Save Configuration');
        });
    });
    
    // Load config when Config tab is clicked
    $('[data-tab="config"]').on('click', function() {
      console.log('[Config] Tab clicked, loading config...');
      loadConfig();
    });
    
    /**
     * Load configuration from server and populate form
     */
    function loadConfig() {
      // Store reference to promise chain to prevent memory leak warnings
      // gas_client warns if .then() is created but promise is abandoned
      var configPromise = server.exec_api(null, CONFIG.api.module, 'getConfig');
      
      configPromise
        .then(function(result) {
          if (result && result.success && result.data && result.data.config) {
            var config = result.data.config;
            console.log('[Config] Loaded:', config);
            
            // Populate form fields
            // Don't populate API key for security - leave blank unless user wants to change
            $('#modelName').val(config.modelName || 'claude-haiku-4-5-20250929');
            
            // Journal settings if they exist
            if (config.journalEnabled !== undefined) {
              $('#journalEnabled').prop('checked', config.journalEnabled !== 'false');
            }
            if (config.journalFolderUrl) {
              $('#journalFolderUrl').val(config.journalFolderUrl);
            }
          } else {
            console.warn('[Config] Failed to load config:', result);
          }
        })
        .catch(function(error) {
          console.error('[Config] Error loading config:', error);
        })
        .finally(function() {
          // Ensures promise chain completes, preventing memory leak warning
          console.log('[Config] Load operation completed');
        });
    }

    // Load saved conversations into dropdown
    loadConversationDropdown();

    // Initialize send button state
    updateSendButtonState();
    
    // Log initialization complete
    console.log('[SidebarApp] Initialization complete');
    console.log('[SidebarApp] Message history enabled - Use ArrowUp/ArrowDown to navigate (max 100)');
    console.log('[SidebarApp] Send button state management enabled');
    console.log('[SidebarApp] Enter to send (Shift+Enter for new line)');
    console.log('[SidebarApp] Conversation persistence enabled');
    console.log('[SidebarApp] All CRITICAL and HIGH fixes applied - v2025-10-31-picker-security-fixes');
  });
  } // End of initApp()
