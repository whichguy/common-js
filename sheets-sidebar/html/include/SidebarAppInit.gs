  // ⚠️ WARNING: This file is an HTML include - DO NOT add CommonJS wrapper!
  // This file is included in Sidebar.html via includeNested('sheets-sidebar/SidebarApp')
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
    
    // Tab switching handler
    $('.tab').on('click', function() {
      const tabName = $(this).data('tab');
      console.log('[SidebarApp] Tab clicked:', tabName);
      
      // Update tab buttons
      $('.tab').removeClass('active').attr('aria-selected', 'false');
      $(this).addClass('active').attr('aria-selected', 'true');
      
      // Update tab content panels
      $('.tab-content').removeClass('active');
      $('#' + tabName + 'Tab').addClass('active');
    });
    
    // Send button click
    $('#sendBtn').on('click', function() {
      console.log('[SidebarApp] Send button clicked');
      sendMessage();
    });
    
    // Cancel button click
    $('#cancelBtn').on('click', function() {
      console.log('[SidebarApp] Cancel button clicked');
      if (currentCancellableCall) {
        currentCancellableCall.cancel('User cancelled the request')
          .then(function(result) {
            console.log('[Cancel] Cancel result:', result);
            if (result.success) {
              showToast('Request cancelled', 'info');
            } else {
              showToast('Could not cancel: ' + result.reason, 'warning');
            }
          })
          .catch(function(error) {
            console.error('[Cancel] Error:', error);
            showToast('Cancel failed: ' + error.message, 'error');
          });
      } else {
        console.warn('[Cancel] No active request to cancel');
        showToast('No active request to cancel', 'info');
      }
    });
    
    // Combined keydown handler for Enter key and arrow key navigation
    $('#messageInput').on('keydown', function(e) {
      // Handle Enter key to send (Shift+Enter for new line)
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
        return;  // Exit early after handling
      }
      
      // Handle arrow keys for message history navigation
      // Only handle arrow keys if not holding Shift (allow Shift+Arrow for text selection)
      if (e.shiftKey) {
        return;
      }
      
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        
        // Start navigating from the end if not already navigating
        if (messageHistory.index === -1) {
          messageHistory.currentDraft = $(this).val();
          messageHistory.index = messageHistory.items.length;
        }
        
        // Move to previous message
        if (messageHistory.index > 0) {
          messageHistory.index--;
          const message = messageHistory.items[messageHistory.index];
          $(this).val(message);
          updateSendButtonState();
        }
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        
        // Only handle if we're currently navigating
        if (messageHistory.index !== -1) {
          // Move to next message
          if (messageHistory.index < messageHistory.items.length - 1) {
            messageHistory.index++;
            const message = messageHistory.items[messageHistory.index];
            $(this).val(message);
          } else {
            // Reached the end, restore current draft
            messageHistory.index = -1;
            $(this).val(messageHistory.currentDraft);
          }
          updateSendButtonState();
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
