  // ⚠️ WARNING: This file is an HTML include - DO NOT add CommonJS wrapper!
    // This file is included in Sidebar.gs via includeNested() from SidebarApp
    // Always use raw_write with fileType: "HTML" when editing this file.
    // NOTE: No script tags - parent SidebarApp provides the single wrapper


    /**
     * Add user message bubble to the chat
     * @param {string|Array} content - Message text or content blocks array
     */
    function addUserMessage(content) {
      var $bubble = $('<div class="message user-message"></div>');
      
      // Extract text from content blocks if array
      var textToDisplay = '';
      var hasAttachments = false;
      
      if (Array.isArray(content)) {
        var textBlocks = content.filter(function(block) { return block && block.type === 'text'; });
        textToDisplay = textBlocks.map(function(block) { return block.text || ''; }).join('\n');
        hasAttachments = content.some(function(block) { return block && (block.type === 'image' || block.type === 'document'); });
      } else if (typeof content === 'string') {
        textToDisplay = content;
      }
      
      // Add text if present
      if (textToDisplay && textToDisplay.trim()) {
        var $text = $('<div class="message-text"></div>');
        // Use .text() for XSS safety (no HTML rendering needed for user messages)
        $text.text(textToDisplay);
        $bubble.append($text);
      }
      
      // Add attachment indicator if present
      if (hasAttachments) {
        var attachmentCount = content.filter(function(block) { return block && (block.type === 'image' || block.type === 'document'); }).length;
        var $attachmentLabel = $('<div class="attachment-label"></div>');
        $attachmentLabel.html('<span class="material-icons">attach_file</span> ' + attachmentCount + ' attachment' + (attachmentCount > 1 ? 's' : ''));
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
      var $bubble = $('<div class="message assistant-message"></div>');
      var $text = $('<div class="message-text"></div>');
      
      // Convert markdown to HTML with sanitization
      var htmlContent = convertMarkdownToHtml(text);
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
      var $indicator = $('<div class="message assistant-message thinking-indicator"></div>');
      $indicator.html('<div class="thinking-dots"><span></span><span></span><span></span></div>');
      $('#chatContainer').append($indicator);
      scrollToBottom();
      return $indicator;
    }

    /**
     * Add thinking bubble to the chat (collapsed by default)
     * Uses .message base class for consistent styling with assistant messages
     * @param {string} thinkingText - The thinking content
     */
    function addThinkingBubble(thinkingText) {
      // Use .message base class like assistant messages
      var $bubble = $('<div class="message thinking-message collapsed"></div>');
      
      // Clickable header with icon and toggle
      var $header = $('<div class="thinking-header"></div>');
      $header.html(
        '<span class="material-icons">psychology</span>' +
        '<span class="thinking-label">Claude\'s thinking</span>' +
        '<span class="material-icons toggle-icon">expand_more</span>'
      );
      
      // Content area (same as .message-text for consistent typography)
      var $content = $('<div class="message-text thinking-content"></div>');
      var htmlContent = convertMarkdownToHtml(thinkingText);
      $content.html(htmlContent);
      
      // Toggle expand/collapse on click
      $header.on('click', function() {
        $bubble.toggleClass('collapsed');
        var $icon = $bubble.find('.toggle-icon');
        $icon.text($bubble.hasClass('collapsed') ? 'expand_more' : 'expand_less');
      });
      
      var wasAtBottom = shouldAutoScroll();
      $bubble.append($header, $content);
      $('#chatContainer').append($bubble);
      if (wasAtBottom) scrollToBottom();
    }

    /**
     * Scroll chat container to bottom
     */
    function scrollToBottom() {
      var $container = $('#chatContainer');
      $container.scrollTop($container[0].scrollHeight);
    }

    // Auto-scroll threshold constant
    var SCROLL_THRESHOLD_PX = 100;

    /**
     * Check if user is near bottom of chat (for smart scroll)
     * Returns true if within SCROLL_THRESHOLD_PX of bottom
     * Uses direct DOM access for performance (P2-1 fix)
     */
    function shouldAutoScroll() {
      var container = document.getElementById('chatContainer');
      if (!container) {
        console.warn('[AutoScroll] chatContainer not found');
        return false;
      }
      var scrollTop = container.scrollTop;
      var scrollHeight = container.scrollHeight;
      var clientHeight = container.clientHeight;
      return (scrollHeight - scrollTop - clientHeight) < SCROLL_THRESHOLD_PX;
    }

    // ============================================================================
    // ERROR HANDLING UTILITIES
    // ============================================================================

    /**
     * Extract error info from server response or raw error
     * @param {Object|Error} error - Error from server or catch block
     * @returns {Object} Normalized error info with userMessage, isRetryable, etc.
     */
    function extractErrorInfo(error) {
      // Check if server returned classified error
      if (error && error.userMessage) {
        return {
          type: error.errorType || 'UNKNOWN',
          userMessage: error.userMessage,
          technicalMessage: error.error || error.message,
          isRetryable: error.isRetryable !== false,
          retryAfterSeconds: error.retryAfterSeconds || 5
        };
      }
      
      // Client-side error classification for raw errors
      var message = (error && error.message) ? error.message : String(error);
      var lowerMessage = message.toLowerCase();
      
      // Rate limit
      if (lowerMessage.indexOf('rate') !== -1 || lowerMessage.indexOf('429') !== -1) {
        return {
          type: 'RATE_LIMIT',
          userMessage: 'Claude is receiving too many requests. Please wait a moment and try again.',
          technicalMessage: message,
          isRetryable: true,
          retryAfterSeconds: 30
        };
      }
      
      // Overloaded
      if (lowerMessage.indexOf('overloaded') !== -1 || lowerMessage.indexOf('529') !== -1 || lowerMessage.indexOf('busy') !== -1) {
        return {
          type: 'OVERLOADED',
          userMessage: 'Claude is currently busy. Please try again in a few seconds.',
          technicalMessage: message,
          isRetryable: true,
          retryAfterSeconds: 10
        };
      }
      
      // Credit/billing
      if (lowerMessage.indexOf('credit') !== -1 || lowerMessage.indexOf('billing') !== -1 || lowerMessage.indexOf('quota') !== -1) {
        return {
          type: 'CREDIT_BALANCE',
          userMessage: 'Your API credit balance may be low. Please check your Anthropic account.',
          technicalMessage: message,
          isRetryable: false,
          retryAfterSeconds: null
        };
      }
      
      // Authentication
      if (lowerMessage.indexOf('401') !== -1 || lowerMessage.indexOf('unauthorized') !== -1 || lowerMessage.indexOf('api key') !== -1) {
        return {
          type: 'AUTHENTICATION',
          userMessage: 'API key is invalid or expired. Please update your API key in Settings.',
          technicalMessage: message,
          isRetryable: false,
          retryAfterSeconds: null
        };
      }
      
      // Network/timeout
      if (lowerMessage.indexOf('timeout') !== -1 || lowerMessage.indexOf('network') !== -1 || lowerMessage.indexOf('fetch') !== -1) {
        return {
          type: 'NETWORK',
          userMessage: 'Network connection issue. Please check your internet and try again.',
          technicalMessage: message,
          isRetryable: true,
          retryAfterSeconds: 5
        };
      }
      
      // Default fallback
      return {
        type: 'UNKNOWN',
        userMessage: message || 'An unexpected error occurred. Please try again.',
        technicalMessage: message,
        isRetryable: true,
        retryAfterSeconds: 5
      };
    }

    /**
     * Add error message bubble to the chat with optional retry button
     * @param {Object} errorInfo - Classified error info from extractErrorInfo
     */
    function addErrorMessage(errorInfo) {
      var $bubble = $('<div class="message error-message"></div>');
      
      // Error icon and message
      var $content = $('<div class="error-content"></div>');
      $content.html(
        '<span class="material-icons error-icon">error_outline</span>' +
        '<div class="error-text">' +
          '<strong>Error</strong>: ' + escapeHtml(errorInfo.userMessage) +
        '</div>'
      );
      $bubble.append($content);
      
      // Add retry button for retryable errors
      if (errorInfo.isRetryable) {
        var retrySeconds = errorInfo.retryAfterSeconds || 5;
        var $retryBtn = $('<button class="retry-btn"></button>');
        $retryBtn.html('<span class="material-icons">refresh</span> Retry');
        $retryBtn.data('retry-seconds', retrySeconds);
        
        // Countdown timer before enabling retry
        var $countdown = $('<span class="retry-countdown"> (' + retrySeconds + 's)</span>');
        $retryBtn.append($countdown);
        $retryBtn.prop('disabled', true);
        
        var secondsLeft = retrySeconds;
        var countdownInterval = setInterval(function() {
          secondsLeft--;
          if (secondsLeft <= 0) {
            clearInterval(countdownInterval);
            $countdown.remove();
            $retryBtn.prop('disabled', false);
          } else {
            $countdown.text(' (' + secondsLeft + 's)');
          }
        }, 1000);
        
        $retryBtn.on('click', function() {
          // Remove error bubble and retry
          $bubble.fadeOut(200, function() {
            $bubble.remove();
          });
          // Trigger resend of last user message
          retryLastMessage();
        });
        
        $bubble.append($retryBtn);
      } else {
        // For non-retryable errors, show hint based on error type
        var hintText = '';
        if (errorInfo.type === 'AUTHENTICATION') {
          hintText = 'Go to Settings (⚙️) to update your API key.';
        } else if (errorInfo.type === 'CREDIT_BALANCE') {
          hintText = 'Visit console.anthropic.com to check your account.';
        } else if (errorInfo.type === 'CONTEXT_LENGTH') {
          hintText = 'Try starting a new conversation with the 🗑️ button.';
        }
        
        if (hintText) {
          var $hint = $('<div class="error-hint"></div>').text(hintText);
          $bubble.append($hint);
        }
      }
      
      $('#chatContainer').append($bubble);
      scrollToBottom();
    }

    /**
     * Retry the last message that failed
     * Reconstructs message from chat history and resends
     */
    function retryLastMessage() {
      // Find the last user message in currentMessages
      if (!currentMessages || currentMessages.length === 0) {
        showToast('No message to retry', 'error');
        return;
      }
      
      // Find last user message
      var lastUserMsg = null;
      for (var i = currentMessages.length - 1; i >= 0; i--) {
        if (currentMessages[i].role === 'user') {
          lastUserMsg = currentMessages[i];
          break;
        }
      }
      
      if (!lastUserMsg) {
        showToast('No message to retry', 'error');
        return;
      }
      
      // Remove the failed message from history to avoid duplicates
      currentMessages.pop();
      
      // Put message content back in input and resend
      var content = lastUserMsg.content;
      var textToResend = '';
      
      if (typeof content === 'string') {
        textToResend = content;
      } else if (Array.isArray(content)) {
        // Extract text from content blocks
        var textBlocks = content.filter(function(block) { return block && block.type === 'text'; });
        textToResend = textBlocks.map(function(block) { return block.text || ''; }).join('\n');
      }
      
      if (textToResend) {
        $('#messageInput').val(textToResend);
      }
      
      // Small delay then resend
      setTimeout(function() {
        sendMessage();
      }, 100);
    }

    // NOTE: escapeHtml is defined in SidebarScript (primary declaration)
    // Removed duplicate definition to prevent 'Identifier already declared' error
    // GAS HTML includes share global scope - no isolation between files

    /**
     * Render thinking content with markdown, with error handling and logging
     * Extracted to avoid code duplication (P3-1 fix)
     * @param {Object} streamContext - The stream context
     */
    function renderThinkingContent(streamContext) {
      try {
        var htmlContent = convertMarkdownToHtml(streamContext.accumulatedThinking);
        streamContext.$content.html(htmlContent);
      } catch (e) {
        // P1-4: Log for debugging and monitoring
        console.error('[Thinking Render] Markdown parse failed:', e.message,
                      'Content length:', streamContext.accumulatedThinking.length);
        // Fallback to safe text rendering
        streamContext.$content.text(streamContext.accumulatedThinking);
      }
    }

    /**
     * Create a streaming thinking bubble that updates as content arrives
     * Returns the stream context object for managing updates
     */
    function createStreamingThinkingBubble() {
      var $bubble = $('<div class="message thinking-message"></div>');

      // Header (always visible) with spinner
      var $header = $('<div class="thinking-header"></div>');
      $header.html(
        '<span class="material-icons">psychology</span>' +
        '<span class="thinking-label">Claude is thinking...</span>' +
        '<span class="material-icons thinking-spinner">sync</span>'
      );

      // Content area (shows streaming content)
      var $content = $('<div class="message-text thinking-content"></div>');
      // Content starts empty - will be populated by streaming updates

      var wasAtBottom = shouldAutoScroll();
      $bubble.append($header, $content);
      $('#chatContainer').append($bubble);
      if (wasAtBottom) scrollToBottom();

      // Return stream context for managing updates
      // P1-2: Use updateTimer instead of updateThrottled for debounce pattern
      return {
        accumulatedThinking: '',
        isCompleted: false,
        $bubble: $bubble,
        $content: $content,
        updateTimer: null  // Timer for debounced updates
      };
    }

    /**
     * Queue a debounced update to the thinking bubble content
     * Uses debounce pattern to ensure latest content is always rendered (P1-2 fix)
     * Limits DOM updates to max once per 500ms for performance
     * @param {Object} streamContext - The stream context from createStreamingThinkingBubble
     */
    function queueThinkingUpdate(streamContext) {
      if (streamContext.isCompleted) return;

      // P1-2: Clear any pending update and schedule a new one (debounce pattern)
      if (streamContext.updateTimer) {
        clearTimeout(streamContext.updateTimer);
      }

      streamContext.updateTimer = setTimeout(function() {
        if (!streamContext.isCompleted && streamContext.accumulatedThinking) {
          var wasAtBottom = shouldAutoScroll();
          renderThinkingContent(streamContext);
          if (wasAtBottom) scrollToBottom();
        }
        streamContext.updateTimer = null;
      }, 500);
    }

    /**
     * Finalize the thinking bubble when response arrives
     * Stops spinner, makes collapsible, handles empty content
     * P1-1: Uses event delegation to prevent memory leaks
     * P1-5: Adds grace period for race condition protection
     * @param {Object} streamContext - The stream context from createStreamingThinkingBubble
     */
    function finalizeThinkingBubble(streamContext) {
      // Prevent new updates from queueing
      streamContext.isCompleted = true;

      // P1-2: Flush any pending debounced update
      if (streamContext.updateTimer) {
        clearTimeout(streamContext.updateTimer);
        streamContext.updateTimer = null;
      }

      // P1-5: Small delay to allow in-flight polling callbacks to complete
      setTimeout(function() {
        // If no thinking content, remove the bubble
        if (!streamContext.accumulatedThinking.trim()) {
          streamContext.$bubble.remove();
          return;
        }

        // Final render of accumulated content
        renderThinkingContent(streamContext);

        // Stop the spinner animation - change to toggle icon
        var $spinner = streamContext.$bubble.find('.thinking-spinner');
        $spinner.removeClass('thinking-spinner').addClass('toggle-icon').text('expand_more');
        
        // Update header text
        streamContext.$bubble.find('.thinking-label').text("Claude's thinking");

        // Mark bubble as finalized for event delegation
        streamContext.$bubble.addClass('finalized');

        // Make it collapsible - collapse after 1 second delay for smooth UX
        setTimeout(function() {
          streamContext.$bubble.addClass('collapsed');
        }, 1000);
      }, 50); // 50ms grace period for race condition
    }

    // P1-1: Event delegation for thinking bubble expand/collapse
    // Registered once on container, not per-bubble (prevents memory leaks)
    $(document).ready(function() {
      $('#chatContainer').on('click', '.thinking-message.finalized .thinking-header', function() {
        var $bubble = $(this).closest('.thinking-message');
        $bubble.toggleClass('collapsed');
        var $icon = $bubble.find('.toggle-icon');
        $icon.text($bubble.hasClass('collapsed') ? 'expand_more' : 'expand_less');
      });
    });

    // ============================================================================
    // MESSAGE SENDING AND POLLING
    // ============================================================================

    /**
     * Start live timer that counts up during message send
     */
    function startLiveTimer() {
      var $statusText = $('#statusText');
      var $spinner = $('#statusSpinner');
      messageStartTime = Date.now();
      
      // Show spinner
      $spinner.removeClass('hidden');
      
      // Update every 1 second for whole seconds
      timerInterval = setInterval(function() {
        var elapsed = Date.now() - messageStartTime;
        var totalSeconds = Math.floor(elapsed / 1000);
        
        var timeText;
        if (totalSeconds < 60) {
          timeText = totalSeconds + 's';
        } else {
          var minutes = Math.floor(totalSeconds / 60);
          var seconds = totalSeconds % 60;
          timeText = minutes + 'm ' + seconds + 's';
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
     * NOTE: Input box stays enabled to allow queuing additional prompts
     */
    function showLoadingState() {
      isMessageProcessing = true;
      // Don't disable send button - allow queuing more prompts
      // Don't disable input - allow typing next prompt
      $('#statusArea').show();
      $('#cancelBtn').show();
      
      // Start live timer (will set the text)
      startLiveTimer();
      
      // Update send button state based on input
      updateSendButtonState();
    }

    /**
     * Hide loading state with proper UI updates
     */
    function hideLoadingState() {
      isMessageProcessing = false;
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

    // ============================================================================
    // PROMPT QUEUE MANAGEMENT
    // ============================================================================

    /**
     * Render the pending prompt queue UI
     * Shows chips for each queued prompt in FIFO order
     */
    function renderQueueUI() {
      var $container = $('#pendingQueue');
      if (!$container.length) {
        console.warn('[Queue] pendingQueue container not found');
        return;
      }

      // Clear existing chips
      $container.empty();

      // Hide container if queue is empty
      if (promptQueue.length === 0) {
        $container.hide();
        return;
      }

      // Show container and render chips
      $container.show();

      promptQueue.forEach(function(item, index) {
        var displayText = item.text || '[Attachment]';
        // Truncate long text
        if (displayText.length > 50) {
          displayText = displayText.substring(0, 47) + '...';
        }

        var $chip = $('<div class="pending-message-chip entering"></div>');
        
        // Queue position indicator (uses CSS class .pending-message-position)
        var $position = $('<span class="pending-message-position">' + (index + 1) + '</span>');
        
        // Message preview (uses CSS class .pending-message-preview)
        var $text = $('<span class="pending-message-preview"></span>').text(displayText);
        
        // Attachment indicator if present
        var attachmentHtml = '';
        if (item.attachments && item.attachments.length > 0) {
          attachmentHtml = '<span class="material-icons" style="font-size: 14px; color: #5f6368;">attach_file</span>';
        }
        
        // Remove button (uses CSS class .pending-message-remove)
        var $removeBtn = $('<button class="pending-message-remove" data-index="' + index + '" title="Remove from queue"></button>');
        $removeBtn.html('×');
        
        $chip.append($position, $text);
        if (attachmentHtml) {
          $chip.append($(attachmentHtml));
        }
        $chip.append($removeBtn);
        
        $container.append($chip);

        // Remove 'entering' class after animation
        setTimeout(function() {
          $chip.removeClass('entering');
        }, 300);
      });
    }

    // NOTE: removeFromQueue is defined in SidebarScript (primary declaration)
    // Removed duplicate definition to prevent 'Identifier already declared' error
    // GAS HTML includes share global scope - no isolation between files

    /**
     * Add prompt to queue with current message and attachments
     * @param {string} message - Text message
     * @param {Array} attachments - Current attachments array
     */
    function addToQueue(message, attachments) {
      var queueItem = {
        text: message,
        attachments: attachments ? attachments.slice() : [], // Clone attachments
        timestamp: Date.now()
      };
      
      promptQueue.push(queueItem);
      console.log('[Queue] Added item. Queue length:', promptQueue.length);
      
      renderQueueUI();
      showToast('Added to queue (' + promptQueue.length + ' pending)', 'info');
    }

    /**
     * Process next item in queue after current message completes
     */
    function processNextQueueItem() {
      if (promptQueue.length === 0) {
        console.log('[Queue] No items to process');
        return;
      }

      var nextItem = promptQueue.shift();
      console.log('[Queue] Processing next item. Remaining:', promptQueue.length);
      
      // Update queue UI
      renderQueueUI();

      // Restore the queued content to input/attachments and send
      var $input = $('#messageInput');
      $input.val(nextItem.text || '');
      
      // Restore attachments if any
      if (nextItem.attachments && nextItem.attachments.length > 0) {
        currentAttachments = nextItem.attachments;
        // Re-render attachment chips
        nextItem.attachments.forEach(function(att, idx) {
          renderAttachmentChip(att, idx);
        });
        updateAttachButtonBadge();
      }
      
      // Small delay to ensure UI is updated, then send
      setTimeout(function() {
        sendMessage();
      }, 100);
    }

    // Event delegation for queue chip remove buttons
    $(document).ready(function() {
      $('#pendingQueue').on('click', '.pending-message-remove', function(e) {
        e.stopPropagation();
        var index = parseInt($(this).data('index'), 10);
        removeFromQueue(index);
      });
    });

    // NOTE: sendMessage is defined in SidebarScript (primary declaration)
    // Removed duplicate definition to prevent 'Identifier already declared' error
    // GAS HTML includes share global scope - no isolation between files
    // The primary sendMessage() uses the queue-based architecture (enqueueMessage -> processQueue)

    // ============================================================================
    // CONVERSATION MANAGEMENT
    // ============================================================================

    /**
     * Save current conversation to Google Drive
     * Creates new journal if no conversationId, otherwise appends messages
     * Called automatically after each successful message exchange
     */
    function saveConversationToDrive() {
      // Skip if no messages to save
      if (!currentMessages || currentMessages.length === 0) {
        console.log('[Conversation] No messages to save');
        return;
      }
      
      // Get the last 2 messages (user + assistant from this exchange)
      var messagesToSave = currentMessages.slice(-2);
      
      window.server.exec_api(
        null,
        CONFIG.api.module,
        'saveConversation',
        [loadedConversationId, messagesToSave]
      )
        .then(function(result) {
          if (result && result.success) {
            // Update loadedConversationId if this was a new conversation
            if (result.data.isNew && result.data.conversationId) {
              loadedConversationId = result.data.conversationId;
              console.log('[Conversation] New conversation created:', loadedConversationId);
            } else if (result.data.skipped) {
              console.log('[Conversation] Save skipped:', result.data.reason);
            } else {
              console.log('[Conversation] Saved', result.data.messageCount, 'messages to:', loadedConversationId);
            }
            
            // Refresh conversation dropdown to show new/updated conversation
            if (result.data.isNew || !result.data.skipped) {
              loadConversationDropdown();
            }
          } else {
            console.warn('[Conversation] Save failed:', result && result.error);
          }
        })
        .catch(function(error) {
          console.error('[Conversation] Error saving:', error);
          // Don't show error toast - save is background operation
        });
    }

    /**
     * Load conversation from Drive (used by conversation selector dropdown)
     * @param {string} conversationId - ID of conversation to load
     */
    function loadConversation(conversationId) {
      if (!conversationId) {
        console.warn('[Conversation] No conversation ID provided');
        return;
      }
      
      showToast('Loading conversation...', 'info');
      
      window.server.exec_api(
        null,
        CONFIG.api.module,
        CONFIG.api.functions.loadConversation,
        conversationId
      )
        .then(function(result) {
          if (result && result.success) {
            // Clear current chat
            $('#chatContainer').empty();
            currentThreadId = null;
            currentMessages = [];
            loadedConversationId = conversationId;
            
            // Render messages
            var messages = result.data.messages;
            messages.forEach(function(msg) {
              if (msg.role === 'user') {
                addUserMessage(msg.content);
              } else if (msg.role === 'assistant') {
                // Extract text from content blocks if array
                var text = '';
                if (Array.isArray(msg.content)) {
                  var textBlocks = msg.content.filter(function(block) { return block && block.type === 'text'; });
                  text = textBlocks.map(function(block) { return block.text || ''; }).join('\n\n');
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
            throw new Error(result && result.error ? result.error : 'Failed to load conversation');
          }
        })
        .catch(function(error) {
          console.error('[Conversation] Error loading:', error);
          showToast('Failed to load conversation: ' + error.message, 'error');
        });
    }

    // ============================================================================
    // SETTINGS DIALOG
    // ============================================================================

    /**
     * Show settings dialog for API key and model configuration
     */
    function showSettings() {
      // Fetch current config from server
      window.server.exec_api(null, CONFIG.api.module, 'getConfig')
        .then(function(configResult) {
          if (!configResult || !configResult.success) {
            throw new Error('Failed to load configuration');
          }
          
          var config = configResult.config;
          
          // Create dialog
          var $dialog = $('<div class="settings-dialog"></div>');
          var $overlay = $('<div class="dialog-overlay"></div>');
          
          // Header
          var $header = $('<div class="dialog-header"></div>');
          $header.html('<h3>Settings</h3>');
          
          var $closeBtn = $('<button class="close-btn" aria-label="Close dialog"></button>');
          $closeBtn.html('<span class="material-icons">close</span>');
          $closeBtn.on('click', function() {
            resetFontSizes();  // Reset on close without save
            $dialog.remove();
            $overlay.remove();
          });
          $header.append($closeBtn);
          
          // Content
          var $content = $('<div class="dialog-content"></div>');
          
          // API Key field
          var $apiKeyGroup = $('<div class="form-group"></div>');
          $apiKeyGroup.html(
            '<label for="apiKeyInput">' +
              'Anthropic API Key' +
              '<span class="field-help">Get your key from <a href="https://console.anthropic.com" target="_blank">console.anthropic.com</a></span>' +
            '</label>' +
            '<input type="password" id="apiKeyInput" placeholder="sk-ant-api03-..." value="' + (config.apiKey || '') + '" />'
          );
          
          // Model name field
          var $modelGroup = $('<div class="form-group"></div>');
          $modelGroup.html(
            '<label for="modelNameInput">' +
              'Model Name' +
              '<span class="field-help">Default: claude-haiku-4-5-20251001</span>' +
            '</label>' +
            '<select id="modelNameInput">' +
              '<option value="claude-sonnet-4-latest">Claude Sonnet 4 (Recommended)</option>' +
              '<option value="claude-3-5-haiku-20241022">Claude 3.5 Haiku (Fast)</option>' +
              '<option value="claude-opus-4-latest">Claude Opus 4 (Most Capable)</option>' +
            '</select>'
          );
          
          // Set current model selection
          $modelGroup.find('#modelNameInput').val(config.modelName || 'claude-haiku-4-5-20251001');
          
          // Journal settings section
          var $journalSection = $('<div class="settings-section"></div>');
          $journalSection.html('<h4>Conversation Journal</h4>');
          
          // Journal enabled checkbox
          var $journalEnabledGroup = $('<div class="form-group"></div>');
          var journalEnabled = config.journalEnabled !== 'false'; // Default to true
          $journalEnabledGroup.html(
            '<label class="checkbox-label">' +
              '<input type="checkbox" id="journalEnabledInput" ' + (journalEnabled ? 'checked' : '') + ' />' +
              'Save conversation history to Google Drive' +
            '</label>'
          );
          
          // Journal folder field with folder picker button
          var $journalFolderGroup = $('<div class="form-group"></div>');
          $journalFolderGroup.html(
            '<label for="journalFolderUrl">' +
              'Journal Folder' +
              '<span class="field-help">Google Drive folder for conversation journals (leave empty for default folder)</span>' +
            '</label>' +
            '<div class="input-with-button">' +
              '<input type="text" id="journalFolderUrl" placeholder="https://drive.google.com/drive/folders/..." value="' + (config.journalFolderUrl || '') + '" />' +
              '<button class="icon-btn" id="browseFolderBtn" title="Browse for folder">' +
                '<span class="material-icons">folder_open</span>' +
              '</button>' +
            '</div>'
          );
          
          $journalSection.append($journalEnabledGroup, $journalFolderGroup);
          
          // Display settings section
          var $displaySection = $('<div class="settings-section"></div>');
          $displaySection.html('<h4>Display Settings</h4>');
          
          // Store original font sizes for cancel/reset
          var originalInputFontSize = config.inputFontSize || 11;
          var originalMessageFontSize = config.messageFontSize || 14;
          
          // Input font size control
          var $inputFontGroup = $('<div class="form-group font-size-control"></div>');
          $inputFontGroup.html(
            '<label>Prompt Input Font Size</label>' +
            '<div class="font-size-adjuster">' +
              '<button type="button" class="font-btn" data-target="input" data-action="decrease">−</button>' +
              '<span class="font-size-value" id="inputFontValue">' + originalInputFontSize + 'px</span>' +
              '<button type="button" class="font-btn" data-target="input" data-action="increase">+</button>' +
            '</div>'
          );
          
          // Message font size control
          var $messageFontGroup = $('<div class="form-group font-size-control"></div>');
          $messageFontGroup.html(
            '<label>Chat Messages Font Size</label>' +
            '<div class="font-size-adjuster">' +
              '<button type="button" class="font-btn" data-target="messages" data-action="decrease">−</button>' +
              '<span class="font-size-value" id="messageFontValue">' + originalMessageFontSize + 'px</span>' +
              '<button type="button" class="font-btn" data-target="messages" data-action="increase">+</button>' +
            '</div>'
          );
          
          $displaySection.append($inputFontGroup, $messageFontGroup);
          
          // Save button
          var $saveBtn = $('<button class="primary-btn" id="saveSettingsBtn">Save Settings</button>');
          
          $content.append($apiKeyGroup, $modelGroup, $journalSection, $displaySection, $saveBtn);
          
          // Font size button handlers - immediate effect via CSS variables
          $dialog.on('click', '.font-btn', function(e) {
            e.preventDefault();
            var $btn = $(this);
            var target = $btn.data('target');
            var action = $btn.data('action');
            var $valueSpan = target === 'input' ? $('#inputFontValue') : $('#messageFontValue');
            var currentSize = parseInt($valueSpan.text(), 10);
            
            // Clamp between 8px and 24px
            var newSize = action === 'increase'
              ? Math.min(currentSize + 1, 24)
              : Math.max(currentSize - 1, 8);
            
            // Update display
            $valueSpan.text(newSize + 'px');
            
            // Apply immediately via CSS variable
            var varName = target === 'input' ? '--font-size-input' : '--font-size-messages';
            document.documentElement.style.setProperty(varName, newSize + 'px');
          });
          
          // Reset font sizes to original values (called on cancel/close)
          function resetFontSizes() {
            document.documentElement.style.setProperty('--font-size-input', originalInputFontSize + 'px');
            document.documentElement.style.setProperty('--font-size-messages', originalMessageFontSize + 'px');
          }
          
          // Assemble dialog
          $dialog.append($header, $content);
          $('body').append($overlay, $dialog);
          
          // Browse folder button handler
          $('#browseFolderBtn').on('click', function() {
            PickerManager.showPicker();
          });
          
          // Save button handler
          $saveBtn.on('click', function() {
            var apiKey = $('#apiKeyInput').val().trim();
            var modelName = $('#modelNameInput').val();
            var journalEnabled = $('#journalEnabledInput').is(':checked');
            var journalFolderUrl = $('#journalFolderUrl').val().trim();
            
            // Get font size values
            var inputFontSize = parseInt($('#inputFontValue').text(), 10);
            var messageFontSize = parseInt($('#messageFontValue').text(), 10);
            
            if (!apiKey) {
              showToast('Please enter an API key', 'error');
              return;
            }
            
            $saveBtn.prop('disabled', true).text('Saving...');
            
            window.server.exec_api(
              null,
              CONFIG.api.module,
              'saveConfig',
              {
                apiKey: apiKey,
                modelName: modelName,
                journalEnabled: journalEnabled,
                journalFolderUrl: journalFolderUrl || '', // Empty string for default
                inputFontSize: inputFontSize,
                messageFontSize: messageFontSize
              }
            )
              .then(function(saveResult) {
                if (saveResult && saveResult.success) {
                  // Build descriptive toast message
                  var savedItems = [];
                  if (apiKey) savedItems.push('API key');
                  if (modelName) savedItems.push('model');
                  if (inputFontSize !== originalInputFontSize || messageFontSize !== originalMessageFontSize) {
                    savedItems.push('font sizes');
                  }
                  var toastMsg = savedItems.length > 0 
                    ? 'Saved: ' + savedItems.join(', ')
                    : 'Settings saved successfully!';
                  showToast(toastMsg, 'success');
                  $dialog.remove();
                  $overlay.remove();
                } else {
                  // Check if it's a journal folder validation error
                  if (saveResult && saveResult.field === 'journalFolder') {
                    showToast('Invalid journal folder: ' + saveResult.error, 'error');
                    $('#journalFolderUrl').focus();
                  } else {
                    throw new Error(saveResult && saveResult.error ? saveResult.error : 'Failed to save settings');
                  }
                }
              })
              .catch(function(error) {
                console.error('[Settings] Error saving:', error);
                showToast('Failed to save settings: ' + error.message, 'error');
              })
              .finally(function() {
                $saveBtn.prop('disabled', false).text('Save Settings');
              });
          });
          
          // Close on overlay click
          $overlay.on('click', function() {
            resetFontSizes();  // Reset on cancel
            $dialog.remove();
            $overlay.remove();
          });
        })
        .catch(function(error) {
          console.error('[Settings] Error:', error);
          showToast('Failed to load settings: ' + error.message, 'error');
        });
    }