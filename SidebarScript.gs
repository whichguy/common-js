<script>
// ⚠️ WARNING: This file is an HTML include - DO NOT add CommonJS wrapper!
// This file is included in Sidebar.gs via <?!= include('SidebarScript') ?>
// Always use raw_write with fileType: "HTML" when editing this file.
//
// Cache refresh: 2025-10-24 17:15 EDT - Enhanced debugging for expansion issue
console.log('[SidebarScript] Version: 2025-10-24 15:10 EDT');

// Auto-grow textarea functionality
const autoGrowTextarea = () => {
  const $textarea = $('#messageInput');
  if (!$textarea.length) return;
  
  // Reset height to auto to get accurate scrollHeight
  $textarea.css('height', 'auto');
  
  // Calculate new height (min 72px = 3 lines, max 300px)
  const newHeight = Math.min(Math.max($textarea[0].scrollHeight, 72), 300);
  
  // Set the new height
  $textarea.css('height', `${newHeight}px`);
  
  // Show scrollbar only when at max height
  $textarea.css('overflow-y', newHeight >= 300 ? 'auto' : 'hidden');
};

// Status management functions
let messageStartTime = null;
let statusTimerInterval = null;

const showSpinner = () => {
  $('#statusSpinner').removeClass('hidden');
};

const hideSpinner = () => {
  $('#statusSpinner').addClass('hidden');
};

const updateStatusTime = (elapsed) => {
  lastElapsedTime = elapsed;
  updateCombinedStatus();
};

// Track last known values for combined display
let lastElapsedTime = null;
let lastTokenCount = null;

const updateStatusTokens = (count) => {
  lastTokenCount = count;
  updateCombinedStatus();
};

// Update combined status display (time + tokens in #statusText)
const updateCombinedStatus = () => {
  const $statusEl = $('#statusText');
  if (!$statusEl.length) return;
  
  const parts = [];
  
  // Add elapsed time if available
  if (lastElapsedTime !== null) {
    parts.push(formatElapsedTime(lastElapsedTime));
  }
  
  // Add token count if available
  if (lastTokenCount && lastTokenCount > 0) {
    const formatted = formatTokenCount(lastTokenCount);
    if (formatted) parts.push(formatted);
  }
  
  $statusEl.text(parts.join(' • ') || 'Processing...');
};

const clearStatus = () => {
  lastElapsedTime = null;
  lastTokenCount = null;
  $('#statusText').text('');
  hideSpinner();
};

const startStatusTimer = () => {
  stopStatusTimer();
  messageStartTime = Date.now();
  updateStatusTime(0);
  statusTimerInterval = setInterval(() => {
    if (messageStartTime) {
      const elapsed = Math.floor((Date.now() - messageStartTime) / 1000);
      updateStatusTime(elapsed);
    }
  }, 1000);
};

const stopStatusTimer = () => {
  if (statusTimerInterval) {
    clearInterval(statusTimerInterval);
    statusTimerInterval = null;
  }
};

// Command history for up/down arrow navigation
let commandHistory = [];
let historyIndex = -1;
let currentDraft = '';

// Initialize all event handlers
const initEventHandlers = () => {
  // Tab switching - event delegation
  $('.tabs').on('click', '.tab', function() {
    const tabName = $(this).data('tab');
    if (tabName) switchTab(tabName);
  });
  
  // Header action buttons
  $('#conversationSelector').on('change', handleConversationSelect);
  $('#loadThreadBtn').on('click', loadThread);
  $('#saveThreadBtn').on('click', saveThread);
  // Clear chat handler defined in SidebarAppInit (includes server-side API call)
  
  // Message input textarea
  $('#messageInput').on('keydown', handleKeyDown);
  $('#messageInput').on('input', () => {
    autoGrowTextarea();
    toggleSendButton();
  });
  
  // Send button
  $('#sendBtn').on('click', sendMessage);
  
  // Attach button
  $('#attachBtn').on('click', () => {
    $('#fileInput').trigger('click');
  });
  
  // Config form
  $('#configForm').on('submit', (e) => {
    e.preventDefault();
    return false;
  });
  
  // Save config button
  $('#saveConfigBtn').on('click', saveConfig);
};

// Initialize after DOM is ready
$(() => {
  initEventHandlers();
  initFileUpload();
  initResize();
  autoGrowTextarea(); // Set initial height
  populateConversationDropdown(); // Load saved conversations
  loadConfig(); // Load configuration on startup
  
  // Load command history from server for persistence across sessions
  window.server.exec_api(null, 'sheets-chat/UISupport', 'loadCommandHistory', [])
    .then(function(result) {
      if (result && result.success && Array.isArray(result.history)) {
        commandHistory = result.history;
        historyIndex = commandHistory.length;
        console.log('[History] Loaded', commandHistory.length, 'command history items');
      }
    })
    .catch(function(error) {
      console.error('[History] Failed to load command history:', error);
    });
  
  // Focus the message input for immediate typing
  $('#messageInput').focus();
});

// Resize handle initialization
const initResize = () => {
  const $resizeHandle = $('#resizeHandle');
  const $chatContainer = $('#chatContainer');
  const $inputContainer = $('#inputContainer');
  
  if (!$resizeHandle.length || !$chatContainer.length || !$inputContainer.length) return;
  
  let isResizing = false;
  let startY = 0;
  let startHeight = 0;
  
  $resizeHandle.on('mousedown', (e) => {
    isResizing = true;
    startY = e.clientY;
    startHeight = $chatContainer.height();
    
    // Add visual feedback
    $resizeHandle.addClass('dragging');
    $('body').css({ cursor: 'ns-resize', userSelect: 'none' });
    
    e.preventDefault();
  });
  
  $(document).on('mousemove', (e) => {
    if (!isResizing) return;
    
    const deltaY = e.clientY - startY;
    const newHeight = startHeight + deltaY;
    
    // Constrain height between min and max
    const minHeight = 100;
    const maxHeight = $(window).height() - $inputContainer.height() - 100;
    const constrainedHeight = Math.max(minHeight, Math.min(newHeight, maxHeight));
    
    $chatContainer.css('height', `${constrainedHeight}px`);
  });
  
  $(document).on('mouseup', () => {
    if (isResizing) {
      isResizing = false;
      $resizeHandle.removeClass('dragging');
      $('body').css({ cursor: '', userSelect: '' });
    }
  });
};

// Toggle send button enabled/disabled based on textarea content
const toggleSendButton = () => {
  const $textarea = $('#messageInput');
  const $sendBtn = $('#sendBtn');
  
  if ($textarea.length && $sendBtn.length) {
    const hasText = $textarea.val().trim().length > 0;
    const hasAttachments = window.attachments && window.attachments.length > 0;
    $sendBtn.prop('disabled', !hasText && !hasAttachments);
  }
};

// File upload initialization
const initFileUpload = () => {
  const $fileInput = $('#fileInput');
  const $inputContainer = $('#inputContainer');
  
  if ($inputContainer.length) {
    // Prevent default drag behaviors
    const preventDefaults = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };
    
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      $inputContainer.on(eventName, preventDefaults);
      $('body').on(eventName, preventDefaults);
    });
    
    // Handle drop on body
    $('body').on('drop', (e) => {
      const files = e.originalEvent.dataTransfer.files;
      if (files && files.length > 0) {
        handleFiles(files);
      }
    });
  }
  
  if ($fileInput.length) {
    $fileInput.on('change', (e) => {
      handleFiles(e.target.files);
    });
  }
};

// Global attachments array
window.attachments = [];

/**
 * Handle selected files
 * @param {FileList} files - Files to process
 */
const handleFiles = (files) => {
  if (!files || files.length === 0) return;
  
  // Validate file types and sizes
  const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  const maxSize = 5 * 1024 * 1024; // 5MB
  
  Array.from(files).forEach(file => {
    if (!validTypes.includes(file.type)) {
      updateStatus(`Invalid file type: ${file.name}. Only images are supported.`, 'error');
      return;
    }
    
    if (file.size > maxSize) {
      updateStatus(`File too large: ${file.name}. Maximum size is 5MB.`, 'error');
      return;
    }
    
    // Read file as base64
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64Data = e.target.result.split(',')[1]; // Remove data URL prefix
      
      // Add to attachments
      const attachment = {
        name: file.name,
        type: file.type,
        size: file.size,
        data: base64Data,
        mediaType: file.type
      };
      
      window.attachments.push(attachment);
      
      // Show preview
      renderAttachmentPreview(attachment, window.attachments.length - 1);
    };
    
    reader.onerror = () => {
      updateStatus(`Error reading file: ${file.name}`, 'error');
    };
    
    reader.readAsDataURL(file);
  });
};

/**
 * Render attachment preview using new chip design
 * @param {Object} attachment - Attachment object
 * @param {number} index - Index in attachments array
 */
const renderAttachmentPreview = (attachment, index) => {
  const $previewContainer = $('#attachmentPreview');
  if (!$previewContainer.length) return;
  
  // Create chip element
  const $chipDiv = $('<div>')
    .addClass('attachment-chip')
    .attr('data-index', index)
    .attr('title', `${attachment.name} (${formatFileSize(attachment.size)})`);
  
  // Create thumbnail image
  const $img = $('<img>')
    .attr('src', `data:${attachment.mediaType};base64,${attachment.data}`)
    .attr('alt', attachment.name);
  
  // Create remove button
  const $removeBtn = $('<button>')
    .addClass('attachment-chip-remove')
    .html('×')
    .attr('title', 'Remove')
    .on('click', (e) => {
      e.stopPropagation();
      removeAttachment(index);
    });
  
  $chipDiv.append($img, $removeBtn);
  $previewContainer.append($chipDiv);
  
  // Update send button state
  toggleSendButton();
};

/**
 * Remove attachment by index
 * @param {number} index - Index in attachments array
 */
const removeAttachment = (index) => {
  window.attachments.splice(index, 1);
  
  // Re-render all previews
  const $previewContainer = $('#attachmentPreview');
  if ($previewContainer.length) {
    $previewContainer.empty();
    
    window.attachments.forEach((att, idx) => {
      renderAttachmentPreview(att, idx);
    });
  }
  
  // Update send button state
  toggleSendButton();
};

/**
 * Format file size for display
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted size
 */
const formatFileSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/**
 * Format token count with magnitude suffixes
 * @param {number} count - Token count
 * @returns {string} Formatted count (e.g., "500", "1.5k tokens", "2.3m tokens")
 */
const formatTokenCount = (count) => {
  if (!count || count === 0) return '';
  
  // Less than 1,000: show raw number
  if (count < 1000) {
    return `${count}`;
  }
  
  // 1,000 - 999,999: show as k tokens
  if (count < 1000000) {
    const k = (count / 1000).toFixed(1);
    return `${k}k tokens`;
  }
  
  // 1,000,000+: show as m tokens
  const m = (count / 1000000).toFixed(1);
  return `${m}m tokens`;
};

/**
 * Format elapsed time with minutes/seconds
 * @param {number} seconds - Elapsed time in seconds
 * @returns {string} Formatted time (e.g., "5.2s", "1 min 15 s")
 */
const formatElapsedTime = (seconds) => {
  if (!seconds && seconds !== 0) return '';
  
  // Under 60 seconds: show as "Xs" (whole number) or "X.Xs" (decimal)
  if (seconds < 60) {
    // If whole number, show without decimal
    if (Number.isInteger(seconds)) {
      return `${seconds}s`;
    }
    // If decimal, show with one decimal place
    return `${seconds.toFixed(1)}s`;
  }
  
  // 60+ seconds: show as "X min Y s"
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes} min ${remainingSeconds} s`;
};

// Tab switching functionality
const switchTab = (tabName) => {
  // Hide all tab contents
  $('.tab-content').removeClass('active');
  
  // Remove active class from all tabs
  $('.tab').removeClass('active');
  
  // Show selected tab content
  $(`#${tabName}Tab`).addClass('active');
  
  // Activate selected tab button using data attribute
  $(`.tab[data-tab="${tabName}"]`).addClass('active');
};

// Message sending functionality (uses queue)
const sendMessage = () => {
  const $input = $('#messageInput');
  const message = $input.val()?.trim();
  
  if (!message && window.attachments.length === 0) return;
  
  // Save to command history and persist to server
  if (message && message !== commandHistory[commandHistory.length - 1]) {
    commandHistory.push(message);
    historyIndex = commandHistory.length;
    
    // Persist to server (fire-and-forget)
    window.server.exec_api(null, 'sheets-chat/UISupport', 'saveCommandToHistory', [message])
      .catch(function(error) {
        console.error('[History] Failed to save command history:', error);
      });
  }
  
  // Enqueue message with current attachments
  enqueueMessage(message, window.attachments);
  
  // Clear input and attachments
  $input.val('');
  window.attachments = [];
  
  // Reset history navigation
  historyIndex = commandHistory.length;
  
  // Clear attachment preview
  $('#attachmentPreview').empty();
  
  // Update send button state
  toggleSendButton();
  
  // Reset textarea height
  autoGrowTextarea();
};

// Populate conversation dropdown with saved conversations
const populateConversationDropdown = () => {
  const $dropdown = $('#conversationSelector');
  if (!$dropdown.length) return;
  
  $dropdown.addClass('loading');
  
  // Clear existing options and show loading placeholder
  $dropdown.empty();
  $dropdown.append($('<option>').val('').text('Loading conversations...').prop('disabled', true));
  
  google.script.run
    .withSuccessHandler((result) => {
      $dropdown.removeClass('loading');
      
      // Clear loading placeholder
      $dropdown.empty();
      
      // Add default placeholder option
      $dropdown.append($('<option>').val('').text('Select conversation...'));
      
      if (!result || !result.success) {
        console.error('Failed to load conversations:', result?.error);
        return;
      }
      
      const conversations = result.data?.conversations || [];
      
      // Add conversation options
      conversations.forEach(conv => {
        const $option = $('<option>')
          .val(conv.id)
          .text(conv.title)
          .data('conversation', conv);
        $dropdown.append($option);
      });
      
      console.log(`Loaded ${conversations.length} conversations`);
    })
    .withFailureHandler((error) => {
      $dropdown.removeClass('loading');
      
      // Clear loading placeholder and show error state
      $dropdown.empty();
      $dropdown.append($('<option>').val('').text('Failed to load conversations'));
      
      console.error('Error loading conversations:', error);
    })
    .exec_api(null, 'sheets-chat/UISupport', 'listConversations');
};

// Handle conversation selection from dropdown
const handleConversationSelect = () => {
  const $dropdown = $('#conversationSelector');
  const selectedId = $dropdown.val();
  
  // Could show preview in status area
  if (selectedId) {
    const selectedOption = $dropdown.find(':selected');
    const conversation = selectedOption.data('conversation');
    if (conversation && conversation.preview) {
      updateStatus(`Selected: ${conversation.preview.substring(0, 50)}...`, '');
    }
  } else {
    updateStatus('', '');
  }
};

// Thread management functions
const loadThread = () => {
  const $dropdown = $('#conversationSelector');
  const selectedId = $dropdown.val();
  
  if (!selectedId) {
    showToast('Please select a conversation to load', 'warning');
    return;
  }
  
  // Show confirmation dialog if current conversation exists
  const hasMessages = window.currentConversation && window.currentConversation.length > 0;
  if (hasMessages) {
    const confirmed = confirm(
      'Loading a saved conversation will clear your current chat.\n\n' +
      'Are you sure you want to continue?'
    );
    
    if (!confirmed) {
      showToast('Load cancelled', 'info', 2000);
      return;
    }
  }
  
  showToast('Loading conversation...', 'info', 2000);
  google.script.run
    .withSuccessHandler(handleThreadLoaded)
    .withFailureHandler((error) => {
      showToast(`Load failed: ${error.message || error}`, 'error');
    })
    .exec_api(null, 'sheets-chat/UISupport', 'loadConversation', selectedId);
};

const saveThread = () => {
  const messages = window.currentConversation || [];
  
  if (!messages || messages.length === 0) {
    showToast('No conversation to save', 'warning');
    return;
  }
  
  // Show loading toast
  showToast('Saving conversation...', 'info', 2000);
  
  google.script.run
    .withSuccessHandler((result) => {
      if (result.success) {
        showToast('Conversation saved to Conversations tab!', 'success');
        // Refresh dropdown to show the new conversation
        populateConversationDropdown();
      } else {
        showToast(`Save failed: ${result.error}`, 'error');
      }
    })
    .withFailureHandler((error) => {
      showToast(`Save failed: ${error.message || error}`, 'error');
    })
    // saveConversation removed - conversations auto-save to Drive via DriveJournal
};

// clearChat handler moved to SidebarAppInit (includes server-side API call)
// See sheets-sidebar/html/include/SidebarAppInit for the implementation

// Config management
const loadConfig = () => {
  google.script.run
    .withSuccessHandler((response) => {
      // FIX: getConfig() returns { success: true, config: {...} } without .data wrapper
      if (response && response.success && response.config) {
        const config = response.config;
        
        // Set API key (leave empty if none)
        if (config.apiKey) {
          $('#apiKey').val(config.apiKey);
        }
        
        // Set model name dropdown
        if (config.modelName) {
          $('#modelName').val(config.modelName);
        }
      }
    })
    .withFailureHandler((error) => {
      console.error('Error loading config:', error);
    })
    .exec_api(null, 'sheets-chat/UISupport', 'getConfig');
};

const saveConfig = () => {
  const apiKey = $('#apiKey').val();
  const modelName = $('#modelName').val();
  
  if (!apiKey) {
    showToast('API key is required', 'error');
    return;
  }
  
  showToast('Saving configuration...', 'info', 2000);
  google.script.run
    .withSuccessHandler(() => {
      showToast('Configuration saved!', 'success');
    })
    .withFailureHandler((error) => {
      showToast(`Error: ${error.message || error}`, 'error');
    })
    .exec_api(null, 'sheets-chat/UISupport', 'saveConfig', { apiKey: apiKey, modelName: modelName });
};

// Keyboard handler with command history navigation
const handleKeyDown = (event) => {
  const $input = $('#messageInput');
  
  // Send on Enter (without Shift)
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    
    // Save to history before sending and persist to server
    const message = $input.val().trim();
    if (message && message !== commandHistory[commandHistory.length - 1]) {
      commandHistory.push(message);
      historyIndex = commandHistory.length;
      
      // Persist to server (fire-and-forget)
      window.server.exec_api(null, 'sheets-chat/UISupport', 'saveCommandToHistory', [message])
        .catch(function(error) {
          console.error('[History] Failed to save command history:', error);
        });
    }
    
    sendMessage();
    return;
  }
  
  // Navigate command history with Up/Down arrows
  if (event.key === 'ArrowUp') {
    event.preventDefault();
    
    // Save current draft when starting to navigate
    if (historyIndex === commandHistory.length) {
      currentDraft = $input.val();
    }
    
    // Move back in history
    if (historyIndex > 0) {
      historyIndex--;
      $input.val(commandHistory[historyIndex]);
      autoGrowTextarea();
      toggleSendButton();
    }
  } else if (event.key === 'ArrowDown') {
    event.preventDefault();
    
    // Move forward in history
    if (historyIndex < commandHistory.length - 1) {
      historyIndex++;
      $input.val(commandHistory[historyIndex]);
      autoGrowTextarea();
      toggleSendButton();
    } else if (historyIndex === commandHistory.length - 1) {
      // Restore current draft
      historyIndex = commandHistory.length;
      $input.val(currentDraft);
      autoGrowTextarea();
      toggleSendButton();
    }
  }
};

// Helper functions
const updateStatus = (message, type = '', elementId = 'status') => {
  const $statusEl = $(`#${elementId}`);
  if (!$statusEl.length) return;
  
  $statusEl.text(message).attr('class', `status ${type}`);
  
  // Clear success messages after 3 seconds
  if (type === 'success') {
    setTimeout(() => {
      $statusEl.text('').attr('class', 'status');
    }, 3000);
  }
};

/**
 * Show Google Gemini-style toast notification
 * @param {string} message - Message to display
 * @param {string} type - Toast type: 'success', 'error', 'info', 'warning'
 * @param {number} duration - Duration in ms (default: 4000)
 */
const showToast = (message, type = 'info', duration = 4000) => {
  const $container = $('#toastContainer');
  if (!$container.length) {
    console.error('Toast container not found');
    return;
  }
  
  // Icon mapping
  const icons = {
    success: 'check_circle',
    error: 'error',
    info: 'info',
    warning: 'warning'
  };
  
  const icon = icons[type] || icons.info;
  
  // Create toast element
  const $toast = $('<div>')
    .addClass(`toast toast-${type}`);
  
  const $icon = $('<span>')
    .addClass('material-icons toast-icon')
    .text(icon);
  
  const $message = $('<span>')
    .addClass('toast-message')
    .text(message);
  
  $toast.append($icon, $message);
  
  // Add to container
  $container.append($toast);
  
  // Auto-dismiss after duration
  setTimeout(() => {
    $toast.addClass('toast-exiting');
    
    // Remove from DOM after animation
    setTimeout(() => {
      $toast.remove();
    }, 200);
  }, duration);
};

/**
 * Handle message sent response
 * Renders new messages from threadHistorySnippet
 */
const handleMessageSent = (response) => {
  // Check if response exists
  if (!response) {
    // Check if thinking messages arrived successfully (indicates server completed work)
    // This can happen when google.script.run times out but server work succeeded
    const currentRequestMessages = activeRequestId ? 
      allThinkingMessagesByRequest.get(activeRequestId) || [] : [];
    const hasThinkingMessages = currentRequestMessages.length > 0;
    
    // Check if last thinking message indicates completion
    const lastThinking = hasThinkingMessages ? 
      currentRequestMessages[currentRequestMessages.length - 1] : '';
    const indicatesCompletion = lastThinking && (
      lastThinking.toLowerCase().includes('done') ||
      lastThinking.toLowerCase().includes('complete') ||
      lastThinking.toLowerCase().includes('finished') ||
      lastThinking.toLowerCase().includes('inserted') ||
      lastThinking.toLowerCase().includes('success')
    );
    
    console.warn('[handleMessageSent] No response received from server', {
      hasThinkingMessages: hasThinkingMessages,
      thinkingCount: currentRequestMessages.length,
      indicatesCompletion: indicatesCompletion,
      lastThinkingPreview: lastThinking?.substring(0, 100),
      timestamp: new Date().toISOString()
    });
    
    stopThinkingPoll(); // Make sure polling stops
    removeLastThinkingBubble();
    hideSpinner();
    
    // Stop live timer and show final elapsed time
    if (messageStartTime) {
      const elapsed = (Date.now() - messageStartTime) / 1000;
      stopStatusTimer();
      messageStartTime = null;
      updateStatusTime(elapsed);
    }
    
    // If thinking messages indicate completion, don't show error
    // The work was done successfully, just the response didn't arrive
    if (indicatesCompletion) {
      console.log('[handleMessageSent] Server work appears complete despite missing response');
      showToast('Request completed (response timeout)', 'info', 3000);
      
      // Clear processing flag for All Thoughts bubble
      if (activeRequestId) {
        const $allThoughts = $(`#allThoughtsBubble-${activeRequestId}`);
        if ($allThoughts.length) {
          $allThoughts.removeAttr('data-processing');
        }
      }
    } else {
      // No indication of completion - show error
      handleError(new Error('No response received from server'));
    }
    
    // Reset processing state and continue with next queued message
    isProcessing = false;
    processQueue();
    return;
  }
  
  // DIAGNOSTIC: Log response arrival and complete structure
  console.log('[RESPONSE DEBUG] Full response structure', {
    success: response.success,
    hasData: !!response.data,
    hasSnippet: !!response.data?.threadHistorySnippet,
    snippetLength: response.data?.threadHistorySnippet?.length || 0,
    snippet: response.data?.threadHistorySnippet || [],
    activeRequestId: activeRequestId,
    timestamp: new Date().toISOString()
  });
  
  // DIAGNOSTIC: Log each message in snippet
  if (response.data?.threadHistorySnippet) {
    response.data.threadHistorySnippet.forEach((msg, idx) => {
      console.log(`[RESPONSE DEBUG] Snippet message ${idx}`, {
        role: msg.role,
        contentType: Array.isArray(msg.content) ? 'array' : typeof msg.content,
        contentLength: Array.isArray(msg.content) ? msg.content.length : 'N/A',
        contentBlocks: Array.isArray(msg.content) 
          ? msg.content.map(b => ({ type: b.type, hasText: !!b.text, hasThinking: !!b.thinking }))
          : 'N/A'
      });
    });
  }
  
  // Mark request as completed BEFORE stopping poll (prevents race condition)
  // Extract requestId from response or use global activeRequestId
  const completedRequestId = activeRequestId;
  if (completedRequestId) {
    completedRequests.add(completedRequestId);
    
    // DIAGNOSTIC: Log completion
    console.log('[RESPONSE DEBUG] Marking request complete', {
      requestId: completedRequestId,
      timestamp: new Date().toISOString()
    });
    
    // Clean up after 30 seconds to prevent memory leak
    setTimeout(() => {
      completedRequests.delete(completedRequestId);
    }, 30000);
  }
  
  // Stop thinking poll and remove last thinking bubble
  stopThinkingPoll();
  removeLastThinkingBubble();
  
  // Collapse All Thoughts bubble and clear processing flag when response arrives
  if (completedRequestId) {
    const $allThoughts = $(`#allThoughtsBubble-${completedRequestId}`);
    if ($allThoughts.length) {
      $allThoughts.removeAttr('data-processing');
      
      // Collapse the bubble after a brief delay for smooth UX
      // (allows user to see final thinking state before collapsing)
      setTimeout(() => {
        if ($allThoughts.hasClass('expanded')) {
          $allThoughts.removeClass('expanded');
          console.log('[BUBBLE DEBUG] Auto-collapsed All Thoughts bubble on response', {
            requestId: completedRequestId,
            timestamp: new Date().toISOString()
          });
        }
      }, 1000); // 1 second delay before collapsing
    }
  }
  
  // Stop live timer and calculate final elapsed time
  if (messageStartTime) {
    const elapsed = (Date.now() - messageStartTime) / 1000;
    stopStatusTimer();
    messageStartTime = null;
    
    // Extract token usage from response
    let totalTokens = 0;
    if (response.data?.usage) {
      const usage = response.data.usage;
      totalTokens = (usage.input_tokens || 0) + (usage.output_tokens || 0);
    }
    
    // Update status display
    if (totalTokens > 0) {
      updateStatusTokens(totalTokens);
    }
    updateStatusTime(elapsed);
  }
  hideSpinner();
  
  if (!response?.success) {
    handleError(response?.error || 'Unknown error');
    return;
  }
  
  const data = response.data;
  
  // Update global conversation state from threadHistorySnippet
  // Server returns snippet with BOTH user and assistant messages from this turn
  if (data.threadHistorySnippet && Array.isArray(data.threadHistorySnippet)) {
    data.threadHistorySnippet.forEach(msg => {
      addMessageToConversation(msg);
    });
  }
  
  // Render AI response only (user message already displayed)
  if (data.threadHistorySnippet?.length > 0) {
    const $container = $('#chatContainer');
    if ($container.length) {
      // Filter to only assistant messages (user message already rendered above)
      let assistantMessages = data.threadHistorySnippet.filter(msg => msg.role === 'assistant');
      
      // CLIENT-SIDE SAFEGUARD: Filter out thinking blocks from message content
      assistantMessages = assistantMessages.map(msg => {
        if (!Array.isArray(msg.content)) return msg;
        
        // Check if message contains thinking blocks
        const hasThinking = msg.content.some(block => block.type === 'thinking');
        
        if (hasThinking) {
          console.warn('[CLIENT SAFEGUARD] Thinking blocks found in snippet - filtering out');
          console.warn('[CLIENT SAFEGUARD] Server-side filtering may have failed');
          console.warn('[CLIENT SAFEGUARD] Message:', msg);
          console.warn('[CLIENT SAFEGUARD] Thinking content:', 
            msg.content
              .filter(b => b.type === 'thinking')
              .map(b => b.thinking?.substring(0, 100))
          );
          
          // Filter out thinking blocks
          const filteredContent = msg.content.filter(block => block.type !== 'thinking');
          
          // Return filtered message (don't return if no content left)
          return filteredContent.length > 0 ? { ...msg, content: filteredContent } : null;
        }
        
        return msg;
      }).filter(msg => msg !== null); // Remove null entries
      
      // NARRATION DETECTION: Move text blocks that appear with tool_use to thinking bubble
      // These are narration messages like "Let me fetch the data..." that precede tool execution
      assistantMessages = assistantMessages.filter(msg => {
        if (!Array.isArray(msg.content)) return true; // Keep legacy string content
        
        // Check if message contains both text and tool_use blocks
        const textBlocks = msg.content.filter(b => b.type === 'text');
        const hasToolUse = msg.content.some(b => b.type === 'tool_use');
        
        if (textBlocks.length > 0 && hasToolUse) {
          // This is narration before a tool call - move text to thinking bubble
          console.log('[NARRATION DEBUG] Detected narration message with tool_use', {
            requestId: completedRequestId,
            textBlockCount: textBlocks.length,
            textPreviews: textBlocks.map(b => b.text?.substring(0, 100)),
            timestamp: new Date().toISOString()
          });
          
          // Add text blocks to thinking bubble for this request
          const requestMessages = allThinkingMessagesByRequest.get(completedRequestId) || [];
          textBlocks.forEach(block => {
            if (block.text && block.text.trim()) {
              requestMessages.push(block.text);
            }
          });
          allThinkingMessagesByRequest.set(completedRequestId, requestMessages);
          
          // Update the "All Thoughts" bubble display
          displayAllThoughts(completedRequestId);
          
          // Filter out this message - don't render as assistant bubble
          return false;
        }
        
        // Keep other messages
        return true;
      });
      
      // Filter out messages that have no displayable content
      // (messages with only tool_use, tool_result, or thinking blocks)
      assistantMessages = assistantMessages.filter(msg => {
        if (!Array.isArray(msg.content)) return true; // Keep legacy string content
        
        // Check if message has any displayable content blocks
        const hasDisplayableContent = msg.content.some(block => 
          block.type === 'text' || block.type === 'image'
        );
        
        return hasDisplayableContent;
      });
      
      // DIAGNOSTIC: Show DOM state BEFORE inserting messages
      console.log('[DOM SEQUENCE DEBUG] BEFORE inserting assistant messages', {
        completedRequestId: completedRequestId,
        allThoughtsBubbleExists: $(`#allThoughtsBubble-${completedRequestId}`).length > 0,
        allThoughtsBubblePosition: $(`#allThoughtsBubble-${completedRequestId}`).index(),
        totalContainerChildren: $container.children().length,
        containerChildrenSummary: Array.from($container.children()).map((child, i) => ({
          index: i,
          id: child.id || '',
          classes: child.className || '',
          type: child.className.includes('message-bubble') ? 'message' : 
                child.className.includes('all-thoughts-bubble') ? 'all-thoughts' :
                child.className.includes('last-thinking-bubble') ? 'last-thinking' : 'other'
        })),
        timestamp: new Date().toISOString()
      });
      
      // Insert AI response messages in correct sequential order
      // Uses helper function to avoid common insertion order bugs
      insertAssistantMessagesInSequence(assistantMessages, completedRequestId, $container);
      
      // DIAGNOSTIC: Show DOM state AFTER inserting messages
      console.log('[DOM SEQUENCE DEBUG] AFTER inserting assistant messages', {
        completedRequestId: completedRequestId,
        allThoughtsBubbleExists: $(`#allThoughtsBubble-${completedRequestId}`).length > 0,
        allThoughtsBubblePosition: $(`#allThoughtsBubble-${completedRequestId}`).index(),
        totalContainerChildren: $container.children().length,
        containerChildrenSummary: Array.from($container.children()).map((child, i) => ({
          index: i,
          id: child.id || '',
          classes: child.className || '',
          type: child.className.includes('message-bubble') ? 'message' : 
                child.className.includes('all-thoughts-bubble') ? 'all-thoughts' :
                child.className.includes('last-thinking-bubble') ? 'last-thinking' : 'other'
        })),
        timestamp: new Date().toISOString()
      });
    }
  }
  
  // Success: Reset processing state and continue with next queued message
  isProcessing = false;
  processQueue();
};

/**
 * Handle thread loaded response
 * Renders all messages in conversation
 */
const handleThreadLoaded = (response) => {
  if (!response?.success) {
    showToast(`Load failed: ${response?.error || 'Unknown error'}`, 'error');
    return;
  }
  
  const data = response.data;
  const messages = data.messages || [];
  
  // Update global conversation state
  window.currentConversation = messages;
  
  // Clear and render all messages
  const $container = $('#chatContainer');
  if ($container.length) {
    $container.empty();
    
    messages.forEach(msg => {
      renderMessage(msg, $container);
    });
    
    // Scroll to bottom
    $container.scrollTop($container[0].scrollHeight);
  }
  
  showToast(`Loaded ${messages.length} messages`, 'success');
};

/**
 * Insert assistant messages in correct sequential order after the All Thoughts bubble
 * 
 * ⚠️ CRITICAL: Messages MUST be inserted sequentially to maintain correct order!
 * 
 * WHY THIS MATTERS:
 * Using .after() on the SAME element repeatedly causes REVERSE order because each
 * new element pushes previous elements down:
 * 
 *   ❌ WRONG APPROACH (causes reverse order):
 *   bubble.after(msg1);  // [bubble, msg1]
 *   bubble.after(msg2);  // [bubble, msg2, msg1]  ← msg2 pushes msg1 down!
 *   bubble.after(msg3);  // [bubble, msg3, msg2, msg1]  ← REVERSED!
 * 
 *   ✅ CORRECT APPROACH (maintains order):
 *   bubble.after(msg1);  // [bubble, msg1]
 *   msg1.after(msg2);    // [bubble, msg1, msg2]
 *   msg2.after(msg3);    // [bubble, msg1, msg2, msg3]  ← CORRECT!
 * 
 * @param {Array} messages - Array of assistant message objects to insert
 * @param {string} requestId - Request ID for finding the All Thoughts bubble
 * @param {jQuery} $container - Chat container element
 */
const insertAssistantMessagesInSequence = (messages, requestId, $container) => {
  if (!messages || messages.length === 0) {
    console.warn('[INSERT WARNING] No messages to insert');
    return;
  }
  
  // Find the All Thoughts bubble for this request
  const $allThoughts = $(`#allThoughtsBubble-${requestId}`);
  
  // Track the last inserted element to maintain sequential order
  let $lastInserted = $allThoughts.length ? $allThoughts : null;
  
  // DIAGNOSTIC: Log state before insertion
  console.log('[INSERT DEBUG] Starting sequential insertion', {
    requestId: requestId,
    messageCount: messages.length,
    hasAllThoughtsBubble: $allThoughts.length > 0,
    allThoughtsBubblePosition: $allThoughts.length ? $allThoughts.index() : 'N/A',
    startingPosition: $lastInserted ? $lastInserted.index() : 'append',
    timestamp: new Date().toISOString()
  });
  
  // Insert each message sequentially
  messages.forEach((msg, idx) => {
    const $messageDiv = createMessageElement(msg);
    
    if (!$messageDiv || !$messageDiv.length) {
      console.error(`[INSERT ERROR] Failed to create message element for message ${idx}`);
      return;
    }
    
    // DIAGNOSTIC: Log each insertion
    console.log(`[INSERT DEBUG] Inserting message ${idx}`, {
      messageRole: msg.role,
      insertAfterPosition: $lastInserted ? $lastInserted.index() : 'N/A',
      contentBlocks: Array.isArray(msg.content) ? msg.content.map(b => b.type) : 'string'
    });
    
    if ($lastInserted && $lastInserted.length) {
      // Insert after the last inserted element (maintains sequential order)
      $lastInserted.after($messageDiv);
      $lastInserted = $messageDiv;  // Update tracking for next iteration
    } else {
      // No anchor element, append to container
      $container.append($messageDiv);
      $lastInserted = $messageDiv;  // Start tracking from this element
    }
    
    // Scroll to show the latest message
    if (idx === messages.length - 1 && $messageDiv.length && $messageDiv[0]) {
      $messageDiv[0].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  });
  
  // DIAGNOSTIC: Verify insertion was successful
  const finalPosition = $lastInserted ? $lastInserted.index() : -1;
  console.log('[INSERT DEBUG] Sequential insertion complete', {
    requestId: requestId,
    messagesInserted: messages.length,
    finalPosition: finalPosition,
    expectedPosition: ($allThoughts.length ? $allThoughts.index() : 0) + messages.length,
    timestamp: new Date().toISOString()
  });
};

/**
 * Create a message element without appending it to DOM
 * @param {Object} message - Message object with role and content
 * @returns {jQuery} Message element
 */
const createMessageElement = (message) => {
  if (!message?.role) return null;
  
  const $messageDiv = $('<div>')
    .addClass(`message-bubble ${message.role}`);
  
  // Add role label
  const $labelDiv = $('<div>')
    .addClass('message-label')
    .text(message.role === 'user' ? 'You' : 'AI');
  $messageDiv.append($labelDiv);
  
  // Process content blocks
  if (Array.isArray(message.content)) {
    message.content.forEach(block => {
      renderContentBlock(block, $messageDiv);
    });
  } else if (typeof message.content === 'string') {
    // Handle legacy string content
    const $textDiv = $('<div>')
      .addClass('message-text')
      .text(message.content);
    $messageDiv.append($textDiv);
  }
  
  return $messageDiv;
};

/**
 * Render a single message (user or assistant)
 * @param {Object} message - Message object with role and content
 * @param {jQuery} $container - Container to append to
 */
const renderMessage = (message, $container) => {
  if (!message?.role) return;
  
  const $messageDiv = $('<div>')
    .addClass(`message-bubble ${message.role}`);
  
  // Add role label
  const $labelDiv = $('<div>')
    .addClass('message-label')
    .text(message.role === 'user' ? 'You' : 'AI');
  $messageDiv.append($labelDiv);
  
  // Process content blocks
  if (Array.isArray(message.content)) {
    message.content.forEach(block => {
      renderContentBlock(block, $messageDiv);
    });
  } else if (typeof message.content === 'string') {
    // Handle legacy string content
    const $textDiv = $('<div>')
      .addClass('message-text')
      .text(message.content);
    $messageDiv.append($textDiv);
  }
  
  $container.append($messageDiv);
};

/**
 * Render a content block (text, thinking, tool_use, image, etc.)
 * @param {Object} block - Content block object
 * @param {jQuery} $parent - Parent element to append to
 */
const renderContentBlock = (block, $parent) => {
  if (!block?.type) return;
  
  // DIAGNOSTIC: Log FULL content block before rendering
  console.log('[CONTENT BLOCK DEBUG] Rendering block', {
    type: block.type,
    parentClass: $parent.attr('class'),
    parentId: $parent.attr('id'),
    blockData: block.type === 'text' ? {
      textLength: block.text?.length || 0,
      textPreview: block.text?.substring(0, 200) || '',
      fullText: block.text // Log FULL text to see thinking-like content
    } : block.type === 'thinking' ? {
      thinkingLength: block.thinking?.length || 0,
      thinkingPreview: block.thinking?.substring(0, 200) || ''
    } : block.type === 'tool_use' ? {
      toolName: block.name,
      toolId: block.id
    } : block.type === 'tool_result' ? {
      toolUseId: block.tool_use_id,
      isError: block.is_error
    } : block.type === 'image' ? {
      hasSource: !!block.source,
      hasUrl: !!block.url
    } : {
      unknownType: JSON.stringify(block).substring(0, 200)
    },
    timestamp: new Date().toISOString()
  });
  
  switch (block.type) {
    case 'text':
      renderTextBlock(block.text, $parent);
      break;
      
    case 'thinking':
      // Don't render - thinking is handled by separate polling bubbles
      // ⚠️ SAFEGUARD: This should NEVER happen if server filtering works correctly
      console.error('[SAFEGUARD] Thinking block found in assistant message! Server filtering may have failed.');
      console.error('[SAFEGUARD] Thinking content:', block.thinking?.substring(0, 100));
      break;
      
    case 'tool_use':
      // Don't render - thoughts will include tool info naturally
      break;
      
    case 'tool_result':
      // Don't render - thoughts will include result info naturally
      break;
      
    case 'image':
      renderImageBlock(block, $parent);
      break;
  }
};

/**
 * Render text content block
 */
const renderTextBlock = (text, $parent) => {
  // Convert markdown-style formatting
  const html = text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')  // Bold
    .replace(/\*(.*?)\*/g, '<em>$1</em>')  // Italic
    .replace(/`(.*?)`/g, '<code>$1</code>')  // Inline code
    .replace(/\n/g, '<br>');  // Line breaks
  
  const $textDiv = $('<div>')
    .addClass('message-text')
    .html(html);
  
  $parent.append($textDiv);
};

/**
 * Render thinking block (collapsible)
 */
const renderThinkingBlock = (thinking, $parent) => {
  const $thinkingDiv = $('<div>')
    .addClass('thinking-bubble collapsed');
  
  // Create header with toggle
  const $headerDiv = $('<div>')
    .addClass('thinking-header')
    .html('<span class="material-icons">lightbulb</span> Thinking...')
    .on('click', () => {
      $thinkingDiv.toggleClass('collapsed preview');
    });
  
  // Create content
  const $contentDiv = $('<div>')
    .addClass('thinking-content')
    .text(thinking);
  
  $thinkingDiv.append($headerDiv, $contentDiv);
  $parent.append($thinkingDiv);
};

/**
 * Render tool use block
 */
const renderToolUseBlock = (block, $parent) => {
  const $toolDiv = $('<div>')
    .addClass('tool-use-block')
    .html(`
      <div class="tool-header">
        <span class="material-icons">build</span>
        Tool: ${escapeHtml(block.name)}
      </div>
      <div class="tool-input">
        <pre>${escapeHtml(JSON.stringify(block.input, null, 2))}</pre>
      </div>
    `);
  
  $parent.append($toolDiv);
};

/**
 * Render tool result block
 */
const renderToolResultBlock = (block, $parent) => {
  let content = block.content;
  if (typeof content === 'string') {
    try {
      // Try to parse and pretty-print JSON
      const parsed = JSON.parse(content);
      content = JSON.stringify(parsed, null, 2);
    } catch (e) {
      // Not JSON, use as-is
    }
  }
  
  const $resultDiv = $('<div>')
    .addClass('tool-result-block')
    .html(`
      <div class="tool-result-header">Result</div>
      <div class="tool-result-content">
        <pre>${escapeHtml(content)}</pre>
      </div>
    `);
  
  $parent.append($resultDiv);
};

/**
 * Render image block
 */
const renderImageBlock = (block, $parent) => {
  const $imgDiv = $('<div>')
    .addClass('message-image');
  
  const $img = $('<img>')
    .attr('alt', 'Attached image')
    .css({
      maxWidth: '100%',
      borderRadius: '8px'
    });
  
  if (block.source?.data) {
    // Base64 image
    const mediaType = block.source.media_type || 'image/png';
    $img.attr('src', `data:${mediaType};base64,${block.source.data}`);
  } else if (block.url) {
    // URL image
    $img.attr('src', block.url);
  }
  
  $imgDiv.append($img);
  $parent.append($imgDiv);
};

/**
 * Escape HTML to prevent XSS
 */
const escapeHtml = (text) => {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};

/**
 * Render an error bubble in the chat container
 * @param {string} errorMessage - Error message to display
 */
const renderError = (errorMessage) => {
  const $container = $('#chatContainer');
  if (!$container.length) return;
  
  const $errorDiv = $('<div>')
    .addClass('error-bubble collapsed');
  
  // Create header with toggle
  const $headerDiv = $('<div>')
    .addClass('error-bubble-header')
    .html('<div class="error-title"><span class="material-icons">error</span> Error</div><span class="error-chevron">►</span>')
    .on('click', () => {
      $errorDiv.toggleClass('collapsed expanded');
    });
  
  // Create content
  const $contentDiv = $('<div>')
    .addClass('error-bubble-content')
    .text(errorMessage);
  
  $errorDiv.append($headerDiv, $contentDiv);
  $container.append($errorDiv);
  
  // Scroll to show error
  $container.scrollTop($container[0].scrollHeight);
};

const handleError = (error) => {
  console.error('Error:', error);
  stopStatusTimer();
  hideSpinner();
  
  const errorMessage = error.message || error.toString() || 'Unknown error';
  
  // Render error bubble in chat
  renderError(errorMessage);
  
  // Also update status text
  updateStatus(`Error: ${errorMessage}`, 'error');
};

// Initialize global state
window.currentConversation = [];
window.attachments = [];

// Two-bubble thinking state
let lastThinkingBubble = null;  // "Last Thinking Message" bubble (live, disappears)
const allThoughtsBubbles = new Map();  // Map of requestId -> "All Thoughts" bubble (one per request, persists)
const allThinkingMessagesByRequest = new Map();  // Map of requestId -> array of messages (one per request)
window.allThinkingMessagesByRequest = allThinkingMessagesByRequest;  // For debugging
let thinkingPollInterval = null;
let activeRequestId = null;

// Request completion tracking (for late message handling)
const completedRequests = new Set();  // requestIds that have finished
const activePolls = new Map();        // requestId → intervalId

// Message queue state (FIFO)
let messageQueue = [];
let isProcessing = false;

/**
 * Toggle "All Thoughts" bubble between collapsed and expanded
 * Works on the clicked bubble element
 */
const toggleAllThoughts = function() {
  const $bubble = $(this).closest('.all-thoughts-bubble');
  
  if (!$bubble.length) {
    console.error('[TOGGLE ERROR] Bubble not found');
    return;
  }
  
  // Simple toggle: just add/remove .expanded class
  // CSS relies on presence of .expanded (not a .collapsed class)
  // Base state (no .expanded) = collapsed (max-height: 0, opacity: 0)
  // Expanded state (.expanded) = visible (max-height: none, opacity: 1)
  $bubble.toggleClass('expanded');
};

/**
 * Create or get "Last Thinking Message" bubble (shows most recent, pulsing, disappears)
 */
const getOrCreateLastThinkingBubble = () => {
  if (lastThinkingBubble && lastThinkingBubble.length) {
    return lastThinkingBubble;
  }
  
  const $container = $('#chatContainer');
  if (!$container.length) return null;
  
  // Create last thinking bubble
  const $bubble = $('<div>')
    .addClass('last-thinking-bubble')
    .attr('id', 'lastThinkingBubble');
  
  // Icon
  const $icon = $('<span>')
    .addClass('material-icons last-thinking-icon')
    .text('psychology');
  
  // Text content
  const $text = $('<div>')
    .addClass('last-thinking-text')
    .text('Thinking...');
  
  $bubble.append($icon, $text);
  
  // Insert after last user message (not at end of container)
  const $lastUserMsg = $container.find('.message-bubble.user').last();
  if ($lastUserMsg.length) {
    $lastUserMsg.after($bubble);
  } else {
    $container.append($bubble);
  }
  
  lastThinkingBubble = $bubble;
  return $bubble;
};

/**
 * Create or get "All Thoughts" bubble for a specific request (collapsed history that stays visible)
 * @param {string} requestId - Unique request identifier
 */
const getOrCreateAllThoughtsBubble = (requestId) => {
  // DIAGNOSTIC: Log bubble lookup/creation
  console.log('[BUBBLE POSITION DEBUG] getOrCreateAllThoughtsBubble called', {
    requestId: requestId,
    alreadyExists: allThoughtsBubbles.has(requestId),
    timestamp: new Date().toISOString()
  });
  
  // Check if bubble exists for this requestId
  if (allThoughtsBubbles.has(requestId)) {
    const existing = allThoughtsBubbles.get(requestId);
    console.log('[BUBBLE POSITION DEBUG] Returning existing bubble', {
      requestId: requestId,
      bubbleId: existing.attr('id'),
      currentPosition: existing.index(),
      timestamp: new Date().toISOString()
    });
    return existing;
  }
  
  const $container = $('#chatContainer');
  if (!$container.length) return null;
  
  // Create all thoughts bubble with unique ID (start expanded - show thinking in real-time)
  const $bubble = $('<div>')
    .addClass('all-thoughts-bubble expanded')
    .attr('id', `allThoughtsBubble-${requestId}`)
    .data('requestId', requestId);
  
  // Header
  const $header = $('<div>')
    .addClass('all-thoughts-header')
    .html('<div class="all-thoughts-title"><span class="material-icons">lightbulb</span> <span class="thinking-title-text">Thinking...</span></div><span class="all-thoughts-chevron">►</span>')
    .on('click', toggleAllThoughts);
  
  // Content area
  const $content = $('<div>')
    .addClass('all-thoughts-content')
    .text('Waiting for AI thoughts...');
  
  $bubble.append($header, $content);
  
  // Insert BEFORE last thinking bubble (above it) or after last user message
  const $lastThinking = $('#lastThinkingBubble');
  let insertionMethod = '';
  
  if ($lastThinking.length) {
    insertionMethod = 'before-last-thinking';
    $lastThinking.before($bubble);
  } else {
    const $lastUserMsg = $container.find('.message-bubble.user').last();
    if ($lastUserMsg.length) {
      insertionMethod = 'after-last-user';
      $lastUserMsg.after($bubble);
    } else {
      insertionMethod = 'append-to-container';
      $container.append($bubble);
    }
  }
  
  // DIAGNOSTIC: Log where bubble was inserted
  console.log('[BUBBLE POSITION DEBUG] Inserted All Thoughts bubble into DOM', {
    requestId: requestId,
    bubbleId: `allThoughtsBubble-${requestId}`,
    insertionMethod: insertionMethod,
    positionInContainer: $bubble.index(),
    totalContainerChildren: $container.children().length,
    timestamp: new Date().toISOString()
  });
  
  // Store in Map
  allThoughtsBubbles.set(requestId, $bubble);
  
  // Mark bubble as actively processing to prevent premature collapse
  $bubble.attr('data-processing', 'true');
  
  // Initialize content with current state
  displayAllThoughts(requestId);
  
  return $bubble;
};

/**
 * Update "Last Thinking Message" bubble with most recent message
 * NOTE: Does NOT add to allThinkingMessages array - caller must do that
 */
const updateLastThinking = (thinkingText) => {
  const $bubble = getOrCreateLastThinkingBubble();
  if (!$bubble || !$bubble.length) return;
  
  // Update text content with most recent message
  const $text = $bubble.find('.last-thinking-text');
  if ($text.length) {
    $text.text(thinkingText);
  }
  
  // Scroll to show thinking bubble (not bottom of container)
  if ($bubble.length && $bubble[0]) {
    $bubble[0].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
};

/**
 * Display all thinking messages in "All Thoughts" bubble for a specific request
 * Shows content from allThinkingMessages array
 * @param {string} requestId - Unique request identifier
 */
const displayAllThoughts = (requestId) => {
  const $bubble = getOrCreateAllThoughtsBubble(requestId);
  if (!$bubble || !$bubble.length) return;
  
  // Update content with all messages from request-specific array
  const $content = $bubble.find('.all-thoughts-content');
  if ($content.length) {
    const messages = allThinkingMessagesByRequest.get(requestId) || [];
    
    // DIAGNOSTIC: Log bubble update
    console.log('[BUBBLE DEBUG] Updating All Thoughts bubble', {
      requestId: requestId,
      messageCount: messages.length,
      bubbleId: `allThoughtsBubble-${requestId}`
    });
    
    // Render messages with Gemini-inspired styling using .thinking-message CSS
    if (messages.length > 0) {
      const html = messages.map(msg => {
        // Convert markdown to HTML for proper formatting in thinking bubbles
        const htmlContent = convertMarkdownToHtml(msg);
        return `<div class="thinking-message">${htmlContent}</div>`;
      }).join('');
      $content.html(html);
    } else {
      $content.text('Waiting for AI thoughts...');
    }
    
    // Always update title to show current count (converts "Thinking..." to "Claude's thinking process (N)")
    const $titleText = $bubble.find('.thinking-title-text');
    if ($titleText.length) {
      $titleText.text(`Claude's thinking process (${messages.length})`);
    }
  }
};

/**
 * Remove "Last Thinking Message" bubble (when AI response arrives)
 */
const removeLastThinkingBubble = () => {
  if (lastThinkingBubble && lastThinkingBubble.length) {
    lastThinkingBubble.remove();
    lastThinkingBubble = null;
  }
};

/**
 * Clear all thinking bubbles and reset state (called when user clears chat)
 */
const clearAllThinkingBubbles = () => {
  // Remove last thinking bubble
  if (lastThinkingBubble && lastThinkingBubble.length) {
    lastThinkingBubble.remove();
  }
  lastThinkingBubble = null;
  
  // Remove all "All Thoughts" bubbles from DOM
  allThoughtsBubbles.forEach(($bubble) => {
    if ($bubble && $bubble.length) {
      $bubble.remove();
    }
  });
  
  // Clear the Map
  allThoughtsBubbles.clear();
  
  // Clear all message arrays
  allThinkingMessagesByRequest.clear();
};

/**
 * Build a user message object from text and attachments
 * @param {string} text - Message text (can be empty)
 * @param {Array} attachments - Array of attachment objects
 * @returns {Object} User message object with role and content
 */
const buildUserMessage = (text, attachments) => {
  // Validate attachments parameter
  if (!Array.isArray(attachments)) {
    console.error('[buildUserMessage] Invalid attachments parameter:', attachments);
    throw new Error('attachments must be an array');
  }
  
  const content = [];
  
  // Add text content if present
  if (text && text.trim()) {
    content.push({
      type: 'text',
      text: text
    });
  }
  
  // Add image attachments with validation
  attachments.forEach((att, index) => {
    // Validate attachment object
    if (!att || typeof att !== 'object') {
      console.error(`[buildUserMessage] Invalid attachment at index ${index}:`, att);
      throw new Error(`Attachment at index ${index} must be an object`);
    }
    
    if (!att.mediaType || !att.data) {
      console.error(`[buildUserMessage] Missing required fields in attachment at index ${index}:`, att);
      throw new Error(`Attachment at index ${index} missing mediaType or data`);
    }
    
    content.push({
      type: 'image',
      source: {
        type: 'base64',
        media_type: att.mediaType,
        data: att.data
      }
    });
  });
  
  return {
    role: 'user',
    content: content
  };
};

/**
 * Atomically add message to conversation and return updated conversation
 * Prevents stale state bugs by returning the fresh state immediately
 * @param {Object} message - Message to add
 * @returns {Array} Updated conversation array (fresh state)
 */
const addMessageToConversation = (message) => {
  // Validate message parameter
  if (!message || typeof message !== 'object') {
    console.error('[addMessageToConversation] Invalid message parameter:', message);
    throw new Error('message must be a valid object');
  }
  
  if (!message.role || !message.content) {
    console.error('[addMessageToConversation] Message missing required fields:', message);
    throw new Error('message must have role and content properties');
  }
  
  // Validate and initialize currentConversation
  let currentConversation = window.currentConversation;
  
  if (!Array.isArray(currentConversation)) {
    console.warn('[addMessageToConversation] window.currentConversation is not an array, initializing to []');
    currentConversation = [];
    window.currentConversation = currentConversation;
  }
  
  const updatedConversation = [...currentConversation, message];
  window.currentConversation = updatedConversation;
  return updatedConversation;  // Return fresh state immediately
};

/**
 * Process message queue (FIFO)
 */
const processQueue = () => {
  // Don't process if already processing or queue is empty
  if (isProcessing || messageQueue.length === 0) {
    return;
  }
  
  isProcessing = true;
  const nextMessage = messageQueue.shift(); // FIFO - remove from front
  
  // Update queue display
  updateQueueStatus();
  
  // Start tracking time and show spinner
  $('#statusArea').show();  // Make sure status area is visible
  startStatusTimer();
  showSpinner();
  
  // Render user message immediately (but DON'T add to conversation yet)
  const $container = $('#chatContainer');
  if ($container.length) {
    // Build user message using helper function (for rendering only)
    const userMessage = buildUserMessage(nextMessage.text, nextMessage.attachments);
    
    // Render immediately
    renderMessage(userMessage, $container);
    
    // DON'T add to conversation yet - server will add it and return in threadHistorySnippet
    // This prevents duplicate user messages in the conversation
    
    // Scroll to show user message
    $container.scrollTop($container[0].scrollHeight);
  }
  
  // Generate request ID for thinking poll
  const requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  // Only remove "Last Thinking" bubble (keep "All Thoughts" for conversation history)
  removeLastThinkingBubble();
  startThinkingPoll(requestId);
  
  // Prepare attachments for API
  const attachments = nextMessage.attachments.map(att => ({
    data: att.data,
    mediaType: att.mediaType
  }));
  
  // Call server-side function
  // Send PREVIOUS conversation (without new user message) - server will add it
  
  google.script.run
    .withSuccessHandler((response) => {
      // Parse response if it's a string
      let parsedResponse = response;
      if (typeof response === 'string') {
        try {
          parsedResponse = JSON.parse(response);
        } catch (parseError) {
          console.error('Failed to parse response string:', parseError);
        }
      }
      
      handleMessageSent(parsedResponse);
      
      // CLEANUP: Clear attachment data from this message to free memory
      nextMessage.attachments = [];
    })
    .withFailureHandler((error) => {
      // CLEANUP: Clear attachment data even on failure
      nextMessage.attachments = [];
      
      // Check if thinking poll is still active (indicates server still processing)
      if (thinkingPollInterval && activeRequestId) {
        // Don't show error or reset state yet
        // Thinking poll will deliver final response when server completes
        return;
      }
      
      // Real error or poll already stopped
      handleError(error);
      isProcessing = false;
      processQueue(); // Continue processing despite error
    })
    .exec_api(
      null,
      'sheets-chat/UISupport',
      'sendMessageToClaude',
      {
        text: nextMessage.text || '',
        messages: window.currentConversation,  // FIX: Use updated conversation, not stale messages variable
        attachments: attachments,
        enableThinking: true,
        requestId: requestId
      }
    );
};

/**
 * Add message to queue and start processing
 */
const enqueueMessage = (text, attachments) => {
  messageQueue.push({
    text: text,
    attachments: [...attachments]
  });
  
  // Update queue status indicator
  updateQueueStatus();
  
  // Start processing if not already
  processQueue();
};

/**
 * Update queue status indicator with visual chips
 */
const updateQueueStatus = () => {
  // Use existing queue container above input box (defined in HTML)
  const $queueContainer = $('#pendingQueue');
  if (!$queueContainer.length) {
    console.error('Queue container #pendingQueue not found in DOM');
    return;
  }
  
  // Clear and rebuild chips
  $queueContainer.empty();
  
  if (messageQueue.length === 0) {
    return;
  }
  
  // Create chip for each queued message
  messageQueue.forEach((msg, index) => {
    const preview = msg.text ? msg.text.substring(0, 50) : '(images)';
    const displayPreview = preview.length === msg.text?.length ? preview : preview + '...';
    
    const $chip = $('<div>')
      .addClass('pending-message-chip entering')
      .attr('data-queue-index', index);
    
    const $position = $('<span>')
      .addClass('pending-message-position')
      .text(`#${index + 1}`);
    
    const $preview = $('<span>')
      .addClass('pending-message-preview')
      .text(displayPreview);
    
    const $remove = $('<button>')
      .addClass('pending-message-remove')
      .html('×')
      .attr('title', 'Remove from queue')
      .on('click', (e) => {
        e.stopPropagation();
        removeFromQueue(index);
      });
    
    $chip.append($position, $preview, $remove);
    $queueContainer.append($chip);
    
    // Remove entering class after animation
    setTimeout(() => {
      $chip.removeClass('entering');
    }, 300);
  });
};

/**
 * Remove message from queue by index
 */
const removeFromQueue = (index) => {
  if (index < 0 || index >= messageQueue.length) return;
  
  // Animate removal
  const $chip = $(`.pending-message-chip[data-queue-index="${index}"]`);
  if ($chip.length) {
    $chip.addClass('exiting');
    setTimeout(() => {
      messageQueue.splice(index, 1);
      updateQueueStatus();
    }, 300);
  } else {
    messageQueue.splice(index, 1);
    updateQueueStatus();
  }
};

/**
 * Start polling for thinking messages
 */
const startThinkingPoll = (requestId) => {
  // Stop any existing poll
  stopThinkingPoll();
  
  activeRequestId = requestId;
  
  // Initialize empty message array for this new request
  allThinkingMessagesByRequest.set(requestId, []);
  
  // Create last thinking bubble (All Thoughts created on first message)
  getOrCreateLastThinkingBubble();
  
  // Poll with server-side retry loop (continuous until sendMessage finishes)
  const channelName = `thinking-${requestId}`;
  
  // Recursive polling function - calls itself after each response
  const pollLoop = () => {
    // Check if polling was stopped
    if (!thinkingPollInterval) {
      return;
    }
    
    google.script.run
      .withSuccessHandler((response) => {
        handleThinkingPollResponse(response);
        // Immediately start next poll if still active
        pollLoop();
      })
      .withFailureHandler((error) => {
        console.error('Thinking poll error:', error);
        stopThinkingPoll(); // Stop polling on error
      })
      .exec_api(null, 'sheets-chat/UISupport', 'pollMessages', channelName, {
        maxWaitMs: 3000,
        checkIntervalMs: 300
      });
  };
  
  // Set flag to indicate polling is active (use requestId as flag value)
  thinkingPollInterval = requestId;
  
  // Track active poll
  activePolls.set(requestId, thinkingPollInterval);
  
  // Start polling immediately (no delay)
  pollLoop();
};

/**
 * Handle thinking poll response - update BOTH bubbles
 * Handles late messages that arrive after sendMessage() completes
 */
const handleThinkingPollResponse = (response) => {
  if (!response || !response.success) return;
  
  // DIAGNOSTIC: Log poll response timing
  console.log('[POLL DEBUG]', {
    hasMessages: response.messages?.length > 0,
    messageCount: response.messages?.length || 0,
    pollingActive: !!thinkingPollInterval,
    activeRequestId: activeRequestId,
    requestCompleted: activeRequestId ? completedRequests.has(activeRequestId) : 'N/A',
    timestamp: new Date().toISOString()
  });
  
  // Don't process if polling has been stopped (prevents race condition)
  if (!thinkingPollInterval || !activeRequestId) {
    console.log('[POLL DEBUG] Skipping - polling stopped or no active request');
    return;
  }
  
  const messages = response.messages || [];
  if (messages.length === 0) {
    // Even with no new messages, ensure title shows consistent format
    // This converts "Thinking..." to "Claude's thinking process (N)" on first poll
    if (activeRequestId) {
      const currentMessages = allThinkingMessagesByRequest.get(activeRequestId) || [];
      const $bubble = allThoughtsBubbles.get(activeRequestId);
      if ($bubble && $bubble.length) {
        const $titleText = $bubble.find('.thinking-title-text');
        if ($titleText.length) {
          $titleText.text(`Claude's thinking process (${currentMessages.length})`);
        }
      }
    }
    return;
  }
  
  const requestCompleted = completedRequests.has(activeRequestId);
  
  // DIAGNOSTIC: Log if processing late messages
  if (requestCompleted && messages.length > 0) {
    console.warn('[LATE MESSAGE DETECTED] Skipping to prevent bubble update after response', {
      requestId: activeRequestId,
      lateMessageCount: messages.length,
      messages: messages.map(m => m.text?.substring(0, 50)),
      timestamp: new Date().toISOString()
    });
    // FIX: Stop processing late messages entirely
    return;
  }
  
  // Update both bubbles with each new message
  messages.forEach(msg => {
    if (msg.text && msg.text.trim()) {
      // DIAGNOSTIC: Log each message being added
      console.log('[POLL DEBUG] Adding thinking message', {
        isLate: requestCompleted,
        messagePreview: msg.text.substring(0, 50),
        requestId: activeRequestId
      });
      
      // Add to request-specific messages array (for both regular and late messages)
      const requestMessages = allThinkingMessagesByRequest.get(activeRequestId) || [];
      requestMessages.push(msg.text);
      allThinkingMessagesByRequest.set(activeRequestId, requestMessages);
      
      // Update "All Thoughts" bubble display for this specific request
      displayAllThoughts(activeRequestId);
      
      // Only update "Last Thinking Message" if request NOT yet completed
      if (!requestCompleted) {
        updateLastThinking(msg.text);
      }
    }
  });
};

/**
 * Stop polling for thinking messages
 */
const stopThinkingPoll = () => {
  // DIAGNOSTIC: Log poll stop
  console.log('[POLL DEBUG] Stopping poll', {
    wasActive: !!thinkingPollInterval,
    activeRequestId: activeRequestId,
    timestamp: new Date().toISOString()
  });
  
  // Set to null - recursive polling will stop on next check
  // (No interval to clear since we use recursive calls, not setInterval)
  thinkingPollInterval = null;
  
  // Remove from active polls tracking
  if (activeRequestId) {
    activePolls.delete(activeRequestId);
  }
  
  activeRequestId = null;
};
</script>