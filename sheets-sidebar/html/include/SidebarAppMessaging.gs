  // ⚠️ WARNING: This file is an HTML include - DO NOT add CommonJS wrapper!
  // This file is included in Sidebar.gs via include('sheets-sidebar/SidebarApp')
  // Always use raw_write with fileType: "HTML" when editing this file.


  /**
   * Add user message bubble to the chat
   * @param {string|Array} content - Message text or content blocks array
   */
  function addUserMessage(content) {
    const $bubble = $('<div class="message user-message"></div>');
    
    // Extract text from content blocks if array
    let textToDisplay = '';
    let hasAttachments = false;
    
    if (Array.isArray(content)) {
      const textBlocks = content.filter(block => block && block.type === 'text');
      textToDisplay = textBlocks.map(block => block.text || '').join('\n');
      hasAttachments = content.some(block => block && (block.type === 'image' || block.type === 'document'));
    } else if (typeof content === 'string') {
      textToDisplay = content;
    }
    
    // Add text if present
    if (textToDisplay && textToDisplay.trim()) {
      const $text = $('<div class="message-text"></div>');
      // Use .text() for XSS safety (no HTML rendering needed for user messages)
      $text.text(textToDisplay);
      $bubble.append($text);
    }
    
    // Add attachment indicator if present
    if (hasAttachments) {
      const attachmentCount = content.filter(block => block && (block.type === 'image' || block.type === 'document')).length;
      const $attachmentLabel = $('<div class="attachment-label"></div>');
      $attachmentLabel.html(`<span class="material-icons">attach_file</span> ${attachmentCount} attachment${attachmentCount > 1 ? 's' : ''}`);
      $bubble.append($attachmentLabel);
    }
    
    $('#chatContainer').append($bubble);
    scrollToBottom();
  }

  /**
   * Add assistant message bubble to the chat with markdown rendering
   * @param {string} text - Message text (plain text or markdown)
   */
  function addAssistantMessage(text) {
    const $bubble = $('<div class="message assistant-message"></div>');
    const $text = $('<div class="message-text"></div>');
    
    // Convert markdown to HTML with sanitization
    const htmlContent = convertMarkdownToHtml(text);
    $text.html(htmlContent);
    
    $bubble.append($text);
    $('#chatContainer').append($bubble);
    scrollToBottom();
  }

  /**
   * Add thinking indicator (animated ellipsis)
   * Returns the jQuery element so it can be removed later
   */
  function addThinkingIndicator() {
    const $indicator = $('<div class="message assistant-message thinking-indicator"></div>');
    $indicator.html('<div class="thinking-dots"><span></span><span></span><span></span></div>');
    $('#chatContainer').append($indicator);
    scrollToBottom();
    return $indicator;
  }

  /**
   * Add thinking bubble to the chat (collapsed by default)
   * @param {string} thinkingText - The thinking content
   */
  function addThinkingBubble(thinkingText) {
    const $bubble = $('<div class="thinking-bubble collapsed"></div>');
    
    // Header with toggle button
    const $header = $('<div class="thinking-header"></div>');
    $header.html(`
      <span class="material-icons">psychology</span>
      <span>Claude's thinking process</span>
      <span class="material-icons toggle-icon">expand_more</span>
    `);
    
    // Content area (initially hidden)
    const $content = $('<div class="thinking-content"></div>');
    const htmlContent = convertMarkdownToHtml(thinkingText);
    $content.html(htmlContent);
    
    // Toggle expand/collapse on click
    $header.on('click', function() {
      $bubble.toggleClass('collapsed');
      const $icon = $bubble.find('.toggle-icon');
      if ($bubble.hasClass('collapsed')) {
        $icon.text('expand_more');
      } else {
        $icon.text('expand_less');
      }
    });
    
    $bubble.append($header, $content);
    $('#chatContainer').append($bubble);
    scrollToBottom();
  }

  /**
   * Scroll chat container to bottom
   */
  function scrollToBottom() {
    const $container = $('#chatContainer');
    $container.scrollTop($container[0].scrollHeight);
  }

  // ============================================================================
  // MESSAGE SENDING AND POLLING
  // ============================================================================

  /**
   * Start live timer that counts up during message send
   */
  function startLiveTimer() {
    const $statusText = $('#statusText');
    const $spinner = $('#statusSpinner');
    messageStartTime = Date.now();
    
    // Show spinner
    $spinner.removeClass('hidden');
    
    // Update every 1 second for whole seconds
    timerInterval = setInterval(() => {
      const elapsed = Date.now() - messageStartTime;
      const totalSeconds = Math.floor(elapsed / 1000);
      
      let timeText;
      if (totalSeconds < 60) {
        timeText = `${totalSeconds}s`;
      } else {
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        timeText = `${minutes}m ${seconds}s`;
      }
      
      $statusText.text(timeText);
    }, 1000);
  }

  /**
   * Stop live timer
   */
  function stopLiveTimer() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
    
    // Hide spinner
    $('#statusSpinner').addClass('hidden');
  }

  /**
   * Show loading state with proper UI updates
   */
  function showLoadingState() {
    isProcessing = true;
    $('#sendBtn').prop('disabled', true).addClass('disabled');
    $('#messageInput').prop('disabled', true);
    $('#statusArea').show();
    $('#cancelBtn').show();
    
    // Start live timer (will set the text)
    startLiveTimer();
  }

  /**
   * Hide loading state with proper UI updates
   */
  function hideLoadingState() {
    isProcessing = false;
    $('#sendBtn').prop('disabled', false).removeClass('disabled');
    $('#messageInput').prop('disabled', false).focus();
    $('#statusArea').hide();
    $('#cancelBtn').hide();
    
    // Stop live timer
    stopLiveTimer();
    
    // Clear cancellable call reference
    currentCancellableCall = null;
    
    // Update send button state based on current input
    updateSendButtonState();
  }

  /**
   * Send message to Claude with comprehensive error handling
   */
  async function sendMessage() {
    // CRITICAL FIX: Check and set flag BEFORE any other operations (atomic pattern)
    if (isProcessing) {
      console.warn('[SendMessage] Already processing a message');
      showToast('Please wait for current request to complete', 'warning');
      return;
    }
    
    // Set flag IMMEDIATELY after check - no operations between check and set
    isProcessing = true;
    
    // Now safe to read input and validate (flag is already set)
    const $input = $('#messageInput');
    const message = $input.val().trim();
    
    // Validate message or attachments present
    const hasMessage = message.length > 0;
    const hasAttachments = currentAttachments.length > 0;
    
    if (!hasMessage && !hasAttachments) {
      showToast('Please enter a message or attach files', 'error');
      isProcessing = false; // Reset flag on early return
      return;
    }
    
    // Show loading state
    showLoadingState();
    
    // Add thinking bubble for progressive display (starts collapsed)
    const $thinkingBubble = $('<div class="message assistant-message all-thoughts-bubble"></div>');
    $thinkingBubble.html(`
      <div class="all-thoughts-header">
        <div class="all-thoughts-title">
          <span class="material-icons">psychology</span>
          <span class="thinking-title-text">Claude is thinking...</span>
        </div>
        <span class="material-icons all-thoughts-chevron">chevron_right</span>
      </div>
      <div class="all-thoughts-content"></div>
    `);
    
    // Add click handler for expand/collapse
    // Note: CSS handles chevron rotation via transform when .expanded class is toggled
    $thinkingBubble.find('.all-thoughts-header').on('click', function() {
      $thinkingBubble.toggleClass('expanded');
    });
    
    $('#chatContainer').append($thinkingBubble);
    scrollToBottom();
    
    // Generate unique request ID for this message
    currentRequestId = 'req-' + Date.now() + '-' + Math.random().toString(36).substring(2, 8);
    console.log('[SendMessage] Generated request ID:', currentRequestId);
    
    // Note: polling functionality removed - gas_client doesn't support .poll()
    
    try {
      // Build message content (text + attachments)
      let messageContent;
      
      if (!hasAttachments) {
        // Simple string message
        messageContent = message;
      } else {
        // Content blocks array
        messageContent = [];
        
        // Add text block if present
        if (hasMessage) {
          messageContent.push({
            type: 'text',
            text: message
          });
        }
        
        // Add attachment blocks
        currentAttachments.forEach(att => {
          if (ATTACHMENT_CONFIG.IMAGE_TYPES.includes(att.mediaType)) {
            messageContent.push({
              type: 'image',
              source: {
                type: 'base64',
                media_type: att.mediaType,
                data: att.data
              }
            });
          } else if (ATTACHMENT_CONFIG.DOCUMENT_TYPES.includes(att.mediaType)) {
            messageContent.push({
              type: 'document',
              source: {
                type: 'base64',
                media_type: att.mediaType,
                data: att.data
              }
            });
          }
        });
      }
      
      // Display user message in chat (pass content blocks or string)
      addUserMessage(messageContent);
      
      // Track message in current conversation for saving
      currentMessages.push({
        role: 'user',
        content: messageContent
      });
      
      // Clear input and attachments
      $input.val('');
      clearAllAttachments();
      
      // Save to command history
      if (hasMessage) {
        saveToHistory(message);
      }
      
      // Call server-side sendMessageToClaude via exec_api with continuous polling
      // Store the CancellableCall reference for cancel functionality
      currentCancellableCall = server.exec_api(
        null,
        CONFIG.api.module,
        CONFIG.api.functions.sendMessage,
        {
          threadId: currentThreadId,
          text: messageContent,
          enableThinking: true,
          requestId: currentRequestId
        }
      );
      
      // Note: Real-time thinking updates will come from the server response
      // gas_client doesn't have .poll() - thinking messages are returned in final response
      
      const result = await currentCancellableCall;
      
      console.log('[SendMessage] Server response received:', result);
      
      // Note: gas_client auto-drains thinking channel and stops polling
      // Controller cleanup happens in finally block
      
      // Check for errors
      if (!result || !result.success) {
        throw new Error(result?.error || 'Unknown error from server');
      }
      
      // Update thread ID if this was the first message
      if (!currentThreadId && result.data.threadId) {
        currentThreadId = result.data.threadId;
        console.log('[SendMessage] Thread ID set:', currentThreadId);
        
        // Show View Journal button if journal URL available
        if (result.data.journalUrl) {
          const $viewBtn = $('#viewJournalBtn');
          $viewBtn.data('journal-url', result.data.journalUrl);
          $viewBtn.show();
          console.log('[Journal] URL available:', result.data.journalUrl);
        }
      }
      
      // Update thinking bubble title to final state
      const finalCount = $thinkingBubble.find('.thinking-message').length;
      $thinkingBubble.find('.thinking-title-text').text(
        finalCount > 0 ? `Claude's thinking process (${finalCount})` : "Claude's thinking process"
      );
      
      // Update thinking bubble with any final messages from response
      // (These may include messages we didn't get via polling yet)
      if (result.data.thinkingMessages && result.data.thinkingMessages.length > 0) {
        // Get count of messages already displayed
        const displayedCount = $thinkingBubble.find('.thinking-message').length;
        
        // Only show messages we haven't displayed yet
        const newMessages = result.data.thinkingMessages.slice(displayedCount);
        
        if (newMessages.length > 0) {
          console.log(`[SendMessage] Adding ${newMessages.length} final thinking messages`);
          updateThinkingBubble(newMessages, $thinkingBubble);
        }
      }
      
      // Display assistant response
      if (result.data.responseText && result.data.responseText.trim()) {
        addAssistantMessage(result.data.responseText);
        
        // Track assistant message for saving
        currentMessages.push({
          role: 'assistant',
          content: result.data.responseText
        });
      } else if (result.data.thinkingOnly) {
        // Show message if only thinking, no response
        showToast('Claude provided thinking process but no response', 'info');
      }
      
      // Display usage stats
      if (result.data.usage) {
        const elapsed = messageStartTime ? Date.now() - messageStartTime : 0;
        displayUsageStats(result.data.usage, elapsed);
      }
      
      console.log('[SendMessage] Message sent successfully');
      
    } catch (error) {
      console.error('[SendMessage] Error:', error);
      
      // Note: Controller cleanup happens in finally block
      
      // CRITICAL-3: Remove thinking bubble (correct variable name)
      $thinkingBubble.remove();
      
      // Show error message in chat
      const errorMessage = error.message || 'Unknown error occurred';
      addAssistantMessage(`**Error**: ${errorMessage}`);
      showToast('Failed to send message: ' + errorMessage, 'error');
      
    } finally {
      // Hide loading state
      hideLoadingState();
      
      // Clear current request ID
      currentRequestId = null;
      
      // Polling controller cleanup removed - gas_client doesn't support polling
    }
  }

  // ============================================================================
  // CONVERSATION MANAGEMENT
  // ============================================================================

  /**
   * Save current conversation to sheet
   */
  async function saveConversation() {
    if (!currentMessages || currentMessages.length === 0) {
      showToast('No messages to save', 'info');
      return;
    }
    
    try {
      showToast('Saving conversation...', 'info');
      
      const result = await server.exec_api(
        null,
        CONFIG.api.module,
        CONFIG.api.functions.saveConversation,
        currentMessages
      );
      
      if (result && result.success) {
        showToast('Conversation saved!', 'success');
        loadedConversationId = result.data.id;
        console.log('[Conversation] Saved with ID:', result.data.id);
      } else {
        throw new Error(result?.error || 'Failed to save conversation');
      }
    } catch (error) {
      console.error('[Conversation] Error saving:', error);
      showToast('Failed to save conversation: ' + error.message, 'error');
    }
  }

  /**
   * Load conversation from sheet
   * @param {string} conversationId - ID of conversation to load
   */
  async function loadConversation(conversationId) {
    if (!conversationId) {
      console.warn('[Conversation] No conversation ID provided');
      return;
    }
    
    try {
      showToast('Loading conversation...', 'info');
      
      const result = await server.exec_api(
        null,
        CONFIG.api.module,
        CONFIG.api.functions.loadConversation,
        conversationId
      );
      
      if (result && result.success) {
        // Clear current chat
        $('#chatContainer').empty();
        currentThreadId = null;
        currentMessages = [];
        loadedConversationId = conversationId;
        
        // Render messages
        const messages = result.data.messages;
        messages.forEach(msg => {
          if (msg.role === 'user') {
            addUserMessage(msg.content);
          } else if (msg.role === 'assistant') {
            // Extract text from content blocks if array
            let text = '';
            if (Array.isArray(msg.content)) {
              const textBlocks = msg.content.filter(block => block && block.type === 'text');
              text = textBlocks.map(block => block.text || '').join('\n\n');
            } else if (typeof msg.content === 'string') {
              text = msg.content;
            }
            
            if (text) {
              addAssistantMessage(text);
            }
          }
        });
        
        // Update current messages
        currentMessages = messages;
        
        showToast('Conversation loaded!', 'success');
        console.log('[Conversation] Loaded', messages.length, 'messages');
        
      } else {
        throw new Error(result?.error || 'Failed to load conversation');
      }
    } catch (error) {
      console.error('[Conversation] Error loading:', error);
      showToast('Failed to load conversation: ' + error.message, 'error');
    }
  }

  /**
   * Load saved conversations into the dropdown selector
   * Called on sidebar initialization
   */
  async function loadConversationDropdown() {
    var $dropdown = $('#conversationSelector');
    if (!$dropdown.length) {
      console.warn('[Conversation] Dropdown selector not found');
      return;
    }
    
    try {
      // Show loading state
      $dropdown.addClass('loading');
      $dropdown.html('<option value="">Loading conversations...</option>');
      
      var result = await server.exec_api(
        null,
        CONFIG.api.module,
        CONFIG.api.functions.listConversations
      );
      
      // Reset dropdown
      $dropdown.removeClass('loading');
      $dropdown.empty();
      $dropdown.append('<option value="">Select a conversation...</option>');
      
      if (!result || !result.success) {
        console.warn('[Conversation] Failed to load conversations:', result && result.error);
        return;
      }
      
      var conversations = result.data.conversations || [];
      
      if (conversations.length === 0) {
        console.log('[Conversation] No saved conversations found');
        return;
      }
      
      // Add conversations to dropdown
      conversations.forEach(function(conv) {
        var $option = $('<option></option>');
        $option.val(conv.id);
        // Use .text() for XSS safety
        $option.text(conv.title || 'Untitled (' + new Date(conv.savedAt).toLocaleDateString() + ')');
        $dropdown.append($option);
      });
      
      // Add change handler to load selected conversation
      $dropdown.off('change').on('change', function() {
        var conversationId = $(this).val();
        if (conversationId) {
          loadConversation(conversationId);
        }
      });
      
      console.log('[Conversation] Loaded', conversations.length, 'conversations into dropdown');
      
    } catch (error) {
      console.error('[Conversation] Error loading dropdown:', error);
      $dropdown.removeClass('loading');
      $dropdown.html('<option value="">Error loading conversations</option>');
    }
  }

  /**
   * Show conversation list dialog
   */
  async function showConversationList() {
    try {
      const result = await server.exec_api(
        null,
        CONFIG.api.module,
        CONFIG.api.functions.listConversations
      );
      
      if (!result || !result.success) {
        throw new Error(result?.error || 'Failed to load conversations');
      }
      
      const conversations = result.data.conversations;
      
      if (conversations.length === 0) {
        showToast('No saved conversations found', 'info');
        return;
      }
      
      // Create dialog
      const $dialog = $('<div class="conversation-dialog"></div>');
      const $overlay = $('<div class="dialog-overlay"></div>');
      
      // Header
      const $header = $('<div class="dialog-header"></div>');
      $header.html('<h3>Saved Conversations</h3>');
      
      const $closeBtn = $('<button class="close-btn" aria-label="Close dialog"></button>');
      $closeBtn.html('<span class="material-icons">close</span>');
      $closeBtn.on('click', () => {
        $dialog.remove();
        $overlay.remove();
      });
      $header.append($closeBtn);
      
      // Content
      const $content = $('<div class="dialog-content"></div>');
      const $list = $('<div class="conversation-list"></div>');
      
      conversations.forEach(conv => {
        const $item = $('<div class="conversation-item"></div>');
        
        // Use .text() for XSS safety
        const $title = $('<div class="conversation-title"></div>').text(conv.title);
        const $date = $('<div class="conversation-date"></div>').text(
          new Date(conv.savedAt).toLocaleString()
        );
        const $preview = $('<div class="conversation-preview"></div>').text(conv.preview);
        
        $item.append($title, $date, $preview);
        
        $item.on('click', () => {
          loadConversation(conv.id);
          $dialog.remove();
          $overlay.remove();
        });
        
        $list.append($item);
      });
      
      $content.append($list);
      
      // Assemble dialog
      $dialog.append($header, $content);
      $('body').append($overlay, $dialog);
      
      // Close on overlay click
      $overlay.on('click', () => {
        $dialog.remove();
        $overlay.remove();
      });
      
    } catch (error) {
      console.error('[Conversation] Error listing:', error);
      showToast('Failed to load conversation list: ' + error.message, 'error');
    }
  }

  // ============================================================================
  // SETTINGS DIALOG
  // ============================================================================

  /**
   * Show settings dialog for API key and model configuration
   */
  async function showSettings() {
    try {
      // Fetch current config from server
      const configResult = await server.exec_api(null, CONFIG.api.module, 'getConfig');
      
      if (!configResult || !configResult.success) {
        throw new Error('Failed to load configuration');
      }
      
      const config = configResult.data.config;
      
      // Create dialog
      const $dialog = $('<div class="settings-dialog"></div>');
      const $overlay = $('<div class="dialog-overlay"></div>');
      
      // Header
      const $header = $('<div class="dialog-header"></div>');
      $header.html('<h3>Settings</h3>');
      
      const $closeBtn = $('<button class="close-btn" aria-label="Close dialog"></button>');
      $closeBtn.html('<span class="material-icons">close</span>');
      $closeBtn.on('click', () => {
        $dialog.remove();
        $overlay.remove();
      });
      $header.append($closeBtn);
      
      // Content
      const $content = $('<div class="dialog-content"></div>');
      
      // API Key field
      const $apiKeyGroup = $('<div class="form-group"></div>');
      $apiKeyGroup.html(`
        <label for="apiKeyInput">
          Anthropic API Key
          <span class="field-help">Get your key from <a href="https://console.anthropic.com" target="_blank">console.anthropic.com</a></span>
        </label>
        <input type="password" id="apiKeyInput" placeholder="sk-ant-api03-..." value="${config.apiKey || ''}" />
      `);
      
      // Model name field
      const $modelGroup = $('<div class="form-group"></div>');
      $modelGroup.html(`
        <label for="modelNameInput">
          Model Name
          <span class="field-help">Default: claude-haiku-4-5</span>
        </label>
        <select id="modelNameInput">
          <option value="claude-haiku-4-5">claude-haiku-4-5 (Fast & Efficient)</option>
          <option value="claude-sonnet-4-5">claude-sonnet-4-5 (Balanced)</option>
          <option value="claude-opus-4-5">claude-opus-4-5 (Most Capable)</option>
        </select>
      `);
      
      // Set current model selection
      $('#modelNameInput', $modelGroup).val(config.modelName || 'claude-haiku-4-5');
      
      // Journal settings section
      const $journalSection = $('<div class="settings-section"></div>');
      $journalSection.html('<h4>Conversation Journal</h4>');
      
      // Journal enabled checkbox
      const $journalEnabledGroup = $('<div class="form-group"></div>');
      const journalEnabled = config.journalEnabled !== 'false'; // Default to true
      $journalEnabledGroup.html(`
        <label class="checkbox-label">
          <input type="checkbox" id="journalEnabledInput" ${journalEnabled ? 'checked' : ''} />
          Save conversation history to Google Drive
        </label>
      `);
      
      // Journal folder field with folder picker button
      const $journalFolderGroup = $('<div class="form-group"></div>');
      $journalFolderGroup.html(`
        <label for="journalFolderUrl">
          Journal Folder
          <span class="field-help">Google Drive folder for conversation journals (leave empty for default folder)</span>
        </label>
        <div class="input-with-button">
          <input type="text" id="journalFolderUrl" placeholder="https://drive.google.com/drive/folders/..." value="${config.journalFolderUrl || ''}" />
          <button class="icon-btn" id="browseFolderBtn" title="Browse for folder">
            <span class="material-icons">folder_open</span>
          </button>
        </div>
      `);
      
      $journalSection.append($journalEnabledGroup, $journalFolderGroup);
      
      // Save button
      const $saveBtn = $('<button class="primary-btn" id="saveSettingsBtn">Save Settings</button>');
      
      $content.append($apiKeyGroup, $modelGroup, $journalSection, $saveBtn);
      
      // Assemble dialog
      $dialog.append($header, $content);
      $('body').append($overlay, $dialog);
      
      // Browse folder button handler
      $('#browseFolderBtn').on('click', function() {
        PickerManager.showPicker();
      });
      
      // Save button handler
      $saveBtn.on('click', async () => {
        const apiKey = $('#apiKeyInput').val().trim();
        const modelName = $('#modelNameInput').val();
        const journalEnabled = $('#journalEnabledInput').is(':checked');
        const journalFolderUrl = $('#journalFolderUrl').val().trim();
        
        if (!apiKey) {
          showToast('Please enter an API key', 'error');
          return;
        }
        
        try {
          $saveBtn.prop('disabled', true).text('Saving...');
          
          const saveResult = await server.exec_api(
            null,
            CONFIG.api.module,
            'saveConfig',
            {
              apiKey: apiKey,
              modelName: modelName,
              journalEnabled: journalEnabled,
              journalFolderUrl: journalFolderUrl || '' // Empty string for default
            }
          );
          
          if (saveResult && saveResult.success) {
            showToast('Settings saved successfully!', 'success');
            $dialog.remove();
            $overlay.remove();
          } else {
            // Check if it's a journal folder validation error
            if (saveResult && saveResult.field === 'journalFolder') {
              showToast('Invalid journal folder: ' + saveResult.error, 'error');
              $('#journalFolderUrl').focus();
            } else {
              throw new Error(saveResult?.error || 'Failed to save settings');
            }
          }
        } catch (error) {
          console.error('[Settings] Error saving:', error);
          showToast('Failed to save settings: ' + error.message, 'error');
        } finally {
          $saveBtn.prop('disabled', false).text('Save Settings');
        }
      });
      
      // Close on overlay click
      $overlay.on('click', () => {
        $dialog.remove();
        $overlay.remove();
      });
      
    } catch (error) {
      console.error('[Settings] Error:', error);
      showToast('Failed to load settings: ' + error.message, 'error');
    }
  }

