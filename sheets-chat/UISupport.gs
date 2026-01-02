/**
 * Server-side handlers for Claude Chat sidebar
 * Uses ConfigManager for hierarchical configuration management
 */

// Import ConfigManager from gas-properties module
const ConfigManager = require('gas-properties/ConfigManager');
// Import QueueManager from gas-queue module
const QueueManager = require('gas-queue/QueueManager');

// Singleton queue instance for thinking messages (Cache-backed for performance)
let thinkingQueue = null;

/**
 * Get or create thinking queue singleton
 */
function getThinkingQueue() {
  if (!thinkingQueue) {
    thinkingQueue = new QueueManager({
      store: 'cache',
      namespace: 'CLAUDE_CHAT',
      scope: 'user',
      ttl: 21600,  // 6 hours
      debug: true  // Enable debug logging
    });
  }
  return thinkingQueue;
}

/**
 * Get API key from ConfigManager hierarchy
 * Priority: User+Doc → Doc → User → Domain → Script
 * @returns {string} API key from PropertiesService
 * @throws {Error} If no API key is configured
 */
function getApiKey() {
  const config = new ConfigManager('CLAUDE_CHAT');
  const apiKey = config.get('API_KEY');
  
  if (!apiKey) {
    throw new Error('API key not configured. Please set your API key in Settings.');
  }
  
  return apiKey;
}

/**
 * Show sidebar when spreadsheet opens
 * Now includes environment detection with deployment selection menu
 */
function onOpen() {
  try {
    // Detect current deployment environment
    const __mcp_exec = require('common-js/__mcp_exec');
    const env = __mcp_exec.getCurrentDeploymentType();
    const urls = __mcp_exec.getDeploymentUrls();
    
    // Environment labels with visual indicators
    const envLabel = {
      'dev': '🔧 DEV',
      'staging': '🚀 STAGING',
      'prod': '✅ PROD',
      'unknown': '❓'
    }[env] || '❓';
    
    // Create menu with simple name at top level
    const menu = SpreadsheetApp.getUi().createMenu('Sheet Chat');
    
    // Add deployment options
    if (urls.dev) {
      menu.addItem('🔧 Open Chat (Dev)', 'showSidebarDev');
    }
    if (urls.staging) {
      menu.addItem('🚀 Open Chat (Staging)', 'showSidebarStaging');
    }
    if (urls.prod) {
      menu.addItem('✅ Open Chat (Prod)', 'showSidebarProd');
    }
    
    // Fallback if no deployments found
    if (!urls.dev && !urls.staging && !urls.prod) {
      menu.addItem('Open Chat', 'showSidebar');
    }
    
    menu.addToUi();
  } catch (error) {
    // Fallback to basic menu if environment detection fails
    log('Error detecting environment: ' + error.message);
    SpreadsheetApp.getUi()
      .createMenu('Sheet Chat')
      .addItem('Open Chat', 'showSidebar')
      .addToUi();
  }
}

/**
 * Show the chat sidebar (default/current deployment)
 */
function showSidebar() {
  // Load html_utils and explicitly register include functions globally
  const htmlUtils = require('common-js/html_utils');
  globalThis.include = htmlUtils.include;
  globalThis.includeNested = htmlUtils.includeNested;
  globalThis.includeWithVars = htmlUtils.includeWithVars;

  const html = HtmlService.createTemplateFromFile('sheets-sidebar/Sidebar')
    .evaluate()
    .setTitle('Sheet Chat')
    .setWidth(400);

  SpreadsheetApp.getUi().showSidebar(html);
}

/**
 * Show sidebar pointing to Dev deployment
 */
function showSidebarDev() {
  // Load html_utils and explicitly register include functions globally
  const htmlUtils = require('common-js/html_utils');
  globalThis.include = htmlUtils.include;
  globalThis.includeNested = htmlUtils.includeNested;
  globalThis.includeWithVars = htmlUtils.includeWithVars;

  const __mcp_exec = require('common-js/__mcp_exec');
  const urls = __mcp_exec.getDeploymentUrls();
  
  const html = HtmlService.createTemplateFromFile('sheets-sidebar/Sidebar')
    .evaluate()
    .setTitle('Sheet Chat (Dev)')
    .setWidth(400);

  SpreadsheetApp.getUi().showSidebar(html);
  
  // Log for debugging
  Logger.log('Opening Dev deployment: ' + urls.dev);
}

/**
 * Show sidebar pointing to Staging deployment
 */
function showSidebarStaging() {
  // Load html_utils and explicitly register include functions globally
  const htmlUtils = require('common-js/html_utils');
  globalThis.include = htmlUtils.include;
  globalThis.includeNested = htmlUtils.includeNested;
  globalThis.includeWithVars = htmlUtils.includeWithVars;

  const __mcp_exec = require('common-js/__mcp_exec');
  const urls = __mcp_exec.getDeploymentUrls();
  
  const html = HtmlService.createTemplateFromFile('sheets-sidebar/Sidebar')
    .evaluate()
    .setTitle('Sheet Chat (Staging)')
    .setWidth(400);

  SpreadsheetApp.getUi().showSidebar(html);
  
  // Log for debugging
  Logger.log('Opening Staging deployment: ' + urls.staging);
}

/**
 * Show sidebar pointing to Prod deployment
 */
function showSidebarProd() {
  // Load html_utils and explicitly register include functions globally
  const htmlUtils = require('common-js/html_utils');
  globalThis.include = htmlUtils.include;
  globalThis.includeNested = htmlUtils.includeNested;
  globalThis.includeWithVars = htmlUtils.includeWithVars;

  const __mcp_exec = require('common-js/__mcp_exec');
  const urls = __mcp_exec.getDeploymentUrls();
  
  const html = HtmlService.createTemplateFromFile('sheets-sidebar/Sidebar')
    .evaluate()
    .setTitle('Sheet Chat (Prod)')
    .setWidth(400);

  SpreadsheetApp.getUi().showSidebar(html);
  
  // Log for debugging
  Logger.log('Opening Prod deployment: ' + urls.prod);
}

/**
 * Get next persistent sequence ID
 * Uses PropertiesService with LockService for atomic operations
 * @returns {number} Next sequence ID
 */
function getNextSequenceId() {
  const lock = LockService.getUserLock();
  
  try {
    if (!lock.tryLock(5000)) {  // Increased from 500ms to 5000ms
      Logger.log('Could not acquire lock for sequence ID');
      return 1;
    }
    
    try {
      const config = new ConfigManager('CLAUDE_CHAT');
      const currentId = parseInt(config.get('SEQUENCE_COUNTER') || '0', 10);
      const nextId = currentId + 1;
      config.setUser('SEQUENCE_COUNTER', nextId.toString());
      return nextId;
    } finally {
      lock.releaseLock();
    }
  } catch (error) {
    Logger.log('Error getting sequence ID: ' + error.message);
    return 1;
  }
}

/**
 * Clear the persistent sequence counter
 * Called when chat is cleared
 */
function clearSequenceCounter() {
  const config = new ConfigManager('CLAUDE_CHAT');
  config.delete('SEQUENCE_COUNTER', 'user');
}

/**
 * Make object JSON-serializable for google.script.run
 * Ensures complex objects can be transmitted to client
 * @param {*} obj - Object to serialize
 * @returns {*} JSON-serializable version
 */
function makeSerializable(obj) {
  try {
    // Deep clone via JSON round-trip to ensure serializability
    const serialized = JSON.parse(JSON.stringify(obj));
    Logger.log('[UISupport] Serialization successful: ' + JSON.stringify({
      type: typeof serialized,
      hasSuccess: serialized?.success !== undefined,
      dataKeys: serialized?.data ? Object.keys(serialized.data) : []
    }));
    return serialized;
  } catch (error) {
    Logger.log('[UISupport] Serialization error: ' + error.message);
    // Return error object instead of undefined
    return {
      success: false,
      error: 'Serialization failed: ' + error.message,
      errorType: 'SERIALIZATION_ERROR'
    };
  }
}

/**
 * Send message to Claude API
 * Called from client-side
 */
function sendMessageToClaude(params) {
  // DIAGNOSTIC: Log raw params at entry point
  Logger.log('[DEBUG sendMessageToClaude] params type: ' + typeof params);
  Logger.log('[DEBUG sendMessageToClaude] params: ' + JSON.stringify(params));
  Logger.log('[DEBUG sendMessageToClaude] params?.requestId: ' + (params?.requestId));
  
  try {
    // Extract parameters from params object
    const { messages, text, attachments, enableThinking, requestId } = params || {};
    
    // DIAGNOSTIC: Log after destructuring
    Logger.log('[DEBUG sendMessageToClaude] After destructuring - requestId: ' + requestId);
    
    // Clear only THIS request's channel (not all channels)
    const queue = getThinkingQueue();
    const channelName = `thinking-${requestId}`;
    queue.flush(channelName);
    
    // Get persistent sequence ID before creating conversation
    const sequenceId = getNextSequenceId();
    
    // Create ClaudeConversation (auto-loads API key and tools)
    const ClaudeConversation = require('sheets-chat/ClaudeConversation');
    const claude = new ClaudeConversation();
    
    // Callback to store thinking messages as they arrive with sequenceId and requestId
    const onThinking = (thinkingText, msgSequenceId) => {
      storeThinkingMessage(thinkingText, msgSequenceId, requestId);
    };
    
    // Call Claude API - tools auto-instantiate and auto-execute
    const result = claude.sendMessage({
      messages: messages || [],
      text: text,
      attachments: attachments || [],
      enableThinking: enableThinking !== false,
      onThinking: onThinking,
      sequenceId: sequenceId,
      requestId: requestId
    });
    
    // Build return value
    // Note: Do NOT return full messages array - client maintains this in window.currentConversation
    const returnValue = {
      success: true,
      data: {
        response: result.response,
        threadHistorySnippet: result.threadHistorySnippet,  // Only return NEW messages to append
        usage: result.usage || {
          input_tokens: 0,
          output_tokens: 0
        },
        sequenceId: result.sequenceId
      }
    };
    
    // Ensure JSON-serializable for google.script.run
    const serializedValue = makeSerializable(returnValue);
    
    // Defensive check - NEVER return null
    if (serializedValue === null || serializedValue === undefined) {
      return {
        success: false,
        error: 'Serialization returned null/undefined',
        errorType: 'NULL_SERIALIZATION_ERROR'
      };
    }
    
    return serializedValue;
  } catch (error) {
    Logger.log('Error in sendMessageToClaude: ' + error.message);
    
    // Classify error for user-friendly display
    const errorInfo = classifyClaudeError(error.message);
    
    // Show toast notification for error
    try {
      SpreadsheetApp.getActiveSpreadsheet().toast(
        errorInfo.userMessage,
        '❌ Chat Error',
        10
      );
    } catch (toastError) {
      // Ignore toast errors (might not have permissions)
    }
    
    // Return serialized error response with classification
    return makeSerializable({
      success: false,
      error: error.message,
      errorType: errorInfo.type,
      userMessage: errorInfo.userMessage,
      isRetryable: errorInfo.isRetryable,
      retryAfterSeconds: errorInfo.retryAfterSeconds,
      errorName: error.name,
      errorStack: error.stack,
      errorString: error.toString()
    });
  }
}

/**
 * Store thinking message using QueueManager with requestId-specific channel
 * Messages are automatically managed by QueueManager with Cache backing
 */
function storeThinkingMessage(thinking, sequenceId, requestId) {
  // DIAGNOSTIC: Log the requestId being used for channel name
  Logger.log('[DEBUG storeThinkingMessage] requestId received: ' + requestId);
  Logger.log('[DEBUG storeThinkingMessage] thinking length: ' + (thinking ? thinking.length : 0));
  
  // Skip empty or whitespace-only thinking messages
  if (!thinking || !thinking.trim()) {
    Logger.log('[DEBUG storeThinkingMessage] Skipping empty thinking message');
    return;
  }
  
  try {
    const queue = getThinkingQueue();
    const channelName = `thinking-${requestId}`;
    Logger.log('[DEBUG storeThinkingMessage] Storing to channel: ' + channelName);
    queue.post(channelName, thinking, {
      sequenceId: sequenceId,
      requestId: requestId,
      type: 'thinking'
    });
  } catch (error) {
    log('Error storing thinking message: ' + error.message);
    // Don't throw - thinking is nice-to-have, not critical
  }
}

/**
 * Generic channel polling with server-side retry loop
 * 
 * Channel lifecycle: exists only during one sendMessage() call
 * Late messages: may arrive after sendMessage() returns due to async polling
 * 
 * @param {string} channelName - Channel to poll (e.g., "thinking-abc123")
 * @param {Object} options - FROM CLIENT
 * @param {number} options.maxWaitMs - Max wait time (default: 5000ms)
 * @param {number} options.checkIntervalMs - Check interval (default: 300ms)
 * @returns {Object} {success, messages[], waitedMs?, timedOut?}
 */
function pollMessages(channelName, options) {
  const { maxWaitMs = 5000, checkIntervalMs = 300 } = options || {};
  
  try {
    const startTime = Date.now();
    const queue = getThinkingQueue();
    
    // Retry loop
    while (Date.now() - startTime < maxWaitMs) {
      // NO LOGGING while holding lock
      const queueMessages = queue.pickup(channelName, 100, 0, false);
      
      if (queueMessages.length > 0) {
        const messages = queueMessages.map(msg => ({
          text: msg.data,
          sequenceId: msg.metadata.sequenceId,
          requestId: msg.metadata.requestId,
          timestamp: msg.timestamp
        }));
        
        // Log AFTER releasing lock
        const waitedMs = Date.now() - startTime;
        Logger.log(`[pollMessages] ${channelName}: ${messages.length} msgs in ${waitedMs}ms`);
        
        return { success: true, messages: messages, waitedMs: waitedMs };
      }
      
      // Sleep before retry
      const elapsed = Date.now() - startTime;
      const remaining = maxWaitMs - elapsed;
      
      if (remaining > checkIntervalMs) {
        Utilities.sleep(checkIntervalMs);
      } else if (remaining > 0) {
        Utilities.sleep(remaining);
        break;
      } else {
        break;
      }
    }
    
    // Timeout
    return { success: true, messages: [], timedOut: true, waitedMs: Date.now() - startTime };
  } catch (error) {
    Logger.log(`[pollMessages] ${channelName} ERROR: ${error.message}`);
    return { success: false, messages: [], error: error.message };
  }
}

/**
 * Get OAuth token for Google Picker API
 * Required for accessing Drive files through the Picker
 * @returns {string} OAuth access token
 */
function getOAuthToken() {
  try {
    return ScriptApp.getOAuthToken();
  } catch (error) {
    Logger.log('Error getting OAuth token: ' + error.message);
    throw error;
  }
}

/**
 * Get the Script ID for Google Picker API
 * Required for the Picker to identify the app
 * @returns {string} Script ID
 */
function getScriptId() {
  try {
    return ScriptApp.getScriptId();
  } catch (error) {
    Logger.log('Error getting Script ID: ' + error.message);
    throw error;
  }
}

/**
 * Get current user's email for conversation isolation
 * @returns {string} User email
 */
function getCurrentUserEmail() {
  try {
    return Session.getActiveUser().getEmail() || 'unknown@user.com';
  } catch (error) {
    Logger.log('Error getting user email: ' + error.message);
    return 'unknown@user.com';
  }
}

/**
 * Load conversation from Google Drive by ID
 * Uses DriveJournal.readJournal() for Drive-based storage
 * @param {string} conversationId - Conversation ID to load
 * @returns {Object} {success, data: {messages, savedAt}, error}
 */
function loadConversation(conversationId) {
  try {
    // Validate input
    if (!conversationId || typeof conversationId !== 'string') {
      return {
        success: false,
        error: 'Invalid conversation ID'
      };
    }
    
    const DriveJournal = require('sheets-chat/DriveJournal');
    const currentUser = getCurrentUserEmail();
    
    // Read journal from Drive
    const result = DriveJournal.readJournal(conversationId);
    
    if (!result.success) {
      Logger.log('Error loading conversation from Drive: ' + result.error);
      return result;
    }
    
    // Verify user has access (user isolation)
    if (result.data.userEmail && result.data.userEmail !== currentUser) {
      Logger.log('Access denied: User ' + currentUser + ' attempted to access conversation owned by ' + result.data.userEmail);
      return {
        success: false,
        error: 'Access denied: You do not have permission to access this conversation'
      };
    }
    
    Logger.log('Loaded conversation from Drive: ' + result.data.messages.length + ' messages, ID: ' + conversationId);
    
    return {
      success: true,
      data: {
        messages: result.data.messages,
        savedAt: result.data.createdAt
      }
    };
  } catch (error) {
    Logger.log('Error loading conversation: ' + error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * List all conversations for current user from Google Drive
 * Now uses DriveJournal.listJournals() instead of Sheet-based storage
 * @returns {Object} {success, data: {conversations}, error}
 */
function listConversations() {
  try {
    const DriveJournal = require('sheets-chat/DriveJournal');
    const currentUser = getCurrentUserEmail();
    
    // Get conversations from Drive, filtered by current user
    const result = DriveJournal.listJournals(currentUser);
    
    if (!result.success) {
      Logger.log('Error listing conversations from Drive: ' + result.error);
      return result;
    }
    
    Logger.log('Listed ' + result.data.conversations.length + ' conversations from Drive for user: ' + currentUser);
    
    return result;
  } catch (error) {
    Logger.log('Error listing conversations: ' + error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Save conversation to Google Drive
 * Creates new journal if conversationId is null, otherwise appends messages
 * @param {string|null} conversationId - Existing conversation ID or null for new
 * @param {Array} messages - Messages to save
 * @returns {Object} {success, data: {conversationId, isNew, messageCount}, error?}
 */
function saveConversation(conversationId, messages) {
  try {
    // Validate messages
    if (!Array.isArray(messages) || messages.length === 0) {
      return {
        success: false,
        error: 'No messages to save'
      };
    }
    
    const DriveJournal = require('sheets-chat/DriveJournal');
    const currentUser = getCurrentUserEmail();
    let isNew = false;
    let finalConversationId = conversationId;
    
    // Check if journaling is enabled
    const config = new ConfigManager('CLAUDE_CHAT');
    const journalEnabled = config.get('JOURNAL_ENABLED') === 'true';
    
    if (!journalEnabled) {
      Logger.log('Journaling disabled - skipping save');
      return {
        success: true,
        data: {
          conversationId: null,
          isNew: false,
          messageCount: 0,
          skipped: true,
          reason: 'journaling_disabled'
        }
      };
    }
    
    if (!conversationId) {
      // Create new conversation - generate UUID
      finalConversationId = Utilities.getUuid();
      isNew = true;
      
      // Create new journal
      const createResult = DriveJournal.createJournal(finalConversationId, currentUser);
      if (!createResult.success) {
        Logger.log('Error creating journal: ' + createResult.error);
        return createResult;
      }
      
      Logger.log('Created new journal: ' + finalConversationId + ' for user: ' + currentUser);
    } else {
      // Verify ownership of existing conversation
      const readResult = DriveJournal.readJournal(conversationId);
      
      if (!readResult.success) {
        Logger.log('Error reading journal for verification: ' + readResult.error);
        return readResult;
      }
      
      if (readResult.data.userEmail && readResult.data.userEmail !== currentUser) {
        Logger.log('Save denied: User ' + currentUser + ' attempted to save to conversation owned by ' + readResult.data.userEmail);
        return {
          success: false,
          error: 'Access denied: You do not have permission to save to this conversation'
        };
      }
    }
    
    // Append messages to journal
    const appendResult = DriveJournal.appendToJournal(finalConversationId, messages);
    
    if (!appendResult.success) {
      Logger.log('Error appending to journal: ' + appendResult.error);
      return appendResult;
    }
    
    Logger.log('Saved ' + messages.length + ' messages to conversation: ' + finalConversationId + 
               ' (isNew: ' + isNew + ') for user: ' + currentUser);
    
    return {
      success: true,
      data: {
        conversationId: finalConversationId,
        isNew: isNew,
        messageCount: messages.length
      }
    };
  } catch (error) {
    Logger.log('Error saving conversation: ' + error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Delete a conversation from Google Drive by ID
 * Uses DriveJournal.deleteJournal() for Drive-based storage
 * @param {string} conversationId - Conversation ID to delete
 * @returns {Object} {success, error?}
 */
function deleteConversation(conversationId) {
  try {
    // Validate input
    if (!conversationId || typeof conversationId !== 'string') {
      return {
        success: false,
        error: 'Invalid conversation ID: must be a non-empty string'
      };
    }
    
    const DriveJournal = require('sheets-chat/DriveJournal');
    const currentUser = getCurrentUserEmail();
    
    // First verify ownership by reading the journal
    const readResult = DriveJournal.readJournal(conversationId);
    
    if (!readResult.success) {
      return {
        success: false,
        error: 'Conversation not found'
      };
    }
    
    // Verify user has access (user isolation)
    if (readResult.data.userEmail && readResult.data.userEmail !== currentUser) {
      Logger.log('Delete denied: User ' + currentUser + ' attempted to delete conversation owned by ' + readResult.data.userEmail);
      return {
        success: false,
        error: 'Access denied: You do not have permission to delete this conversation'
      };
    }
    
    // Delete from Drive
    const result = DriveJournal.deleteJournal(conversationId);
    
    if (result.success) {
      Logger.log('Deleted conversation from Drive: ' + conversationId + ' by user: ' + currentUser);
    }
    
    return result;
  } catch (error) {
    Logger.log('Error deleting conversation: ' + error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Classify Claude API error for user-friendly display
 * Maps technical errors to human-readable messages with retry guidance
 * @param {string} errorMessage - Raw error message from API
 * @returns {Object} {type, userMessage, isRetryable, retryAfterSeconds}
 */
function classifyClaudeError(errorMessage) {
  const lowerMessage = (errorMessage || '').toLowerCase();
  
  // Rate limit errors (429)
  if (lowerMessage.includes('rate') || lowerMessage.includes('429')) {
    return {
      type: 'RATE_LIMIT',
      userMessage: 'Claude is receiving too many requests. Please wait a moment and try again.',
      isRetryable: true,
      retryAfterSeconds: 30
    };
  }
  
  // Overloaded errors (529)
  if (lowerMessage.includes('overloaded') || lowerMessage.includes('529') || lowerMessage.includes('busy')) {
    return {
      type: 'OVERLOADED',
      userMessage: 'Claude is currently busy. Please try again in a few seconds.',
      isRetryable: true,
      retryAfterSeconds: 10
    };
  }
  
  // Credit/billing errors
  if (lowerMessage.includes('credit') || lowerMessage.includes('billing') || 
      lowerMessage.includes('insufficient') || lowerMessage.includes('quota')) {
    return {
      type: 'CREDIT_BALANCE',
      userMessage: 'Your API credit balance may be low. Please check your Anthropic account.',
      isRetryable: false,
      retryAfterSeconds: null
    };
  }
  
  // Authentication errors (401)
  if (lowerMessage.includes('401') || lowerMessage.includes('authentication') ||
      lowerMessage.includes('unauthorized') || lowerMessage.includes('invalid api key')) {
    return {
      type: 'AUTHENTICATION',
      userMessage: 'API key is invalid or expired. Please update your API key in Settings.',
      isRetryable: false,
      retryAfterSeconds: null
    };
  }
  
  // Permission errors (403)
  if (lowerMessage.includes('403') || lowerMessage.includes('forbidden') ||
      lowerMessage.includes('permission')) {
    return {
      type: 'PERMISSION',
      userMessage: 'Access denied. Please check your API key permissions.',
      isRetryable: false,
      retryAfterSeconds: null
    };
  }
  
  // Context length errors
  if (lowerMessage.includes('context') || lowerMessage.includes('too long') ||
      lowerMessage.includes('max_tokens') || lowerMessage.includes('token limit')) {
    return {
      type: 'CONTEXT_LENGTH',
      userMessage: 'Message is too long. Please try a shorter message or start a new conversation.',
      isRetryable: false,
      retryAfterSeconds: null
    };
  }
  
  // Server errors (500, 502, 503, 504)
  if (lowerMessage.includes('500') || lowerMessage.includes('502') ||
      lowerMessage.includes('503') || lowerMessage.includes('504') ||
      lowerMessage.includes('server error') || lowerMessage.includes('internal error')) {
    return {
      type: 'SERVER_ERROR',
      userMessage: 'Claude is experiencing temporary issues. Please try again in a moment.',
      isRetryable: true,
      retryAfterSeconds: 15
    };
  }
  
  // Network/timeout errors
  if (lowerMessage.includes('timeout') || lowerMessage.includes('network') ||
      lowerMessage.includes('connection') || lowerMessage.includes('fetch')) {
    return {
      type: 'NETWORK',
      userMessage: 'Network connection issue. Please check your internet and try again.',
      isRetryable: true,
      retryAfterSeconds: 5
    };
  }
  
  // Default: unknown error
  return {
    type: 'UNKNOWN',
    userMessage: 'An unexpected error occurred. Please try again.',
    isRetryable: true,
    retryAfterSeconds: 5
  };
}

/**
 * Load command history for current user
 * Uses ConfigManager for hierarchical property management
 * @returns {Object} {success, history[]}
 */
function loadCommandHistory() {
  try {
    const config = new ConfigManager('CLAUDE_CHAT');
    const historyJson = config.get('COMMAND_HISTORY');

    if (!historyJson) {
      return { success: true, history: [] };
    }

    const history = JSON.parse(historyJson);
    return {
      success: true,
      history: Array.isArray(history) ? history : []
    };
  } catch (e) {
    Logger.log('[UISupport] Failed to load command history: ' + e.message);
    return { success: false, history: [], error: e.message };
  }
}

/**
 * Save command to history for current user
 * @param {string} command - The command to save
 * @returns {Object} {success, skipped?}
 */
function saveCommandToHistory(command) {
  try {
    if (!command || typeof command !== 'string') {
      return { success: false, error: 'Invalid command' };
    }

    const config = new ConfigManager('CLAUDE_CHAT');
    const historyJson = config.get('COMMAND_HISTORY');
    let history = historyJson ? JSON.parse(historyJson) : [];

    // Skip duplicates
    if (history.length > 0 && history[history.length - 1] === command.trim()) {
      return { success: true, skipped: true };
    }

    // Add and limit to 100 items
    history.push(command.trim());
    if (history.length > 100) {
      history = history.slice(-100);
    }

    config.setUser('COMMAND_HISTORY', JSON.stringify(history));
    return { success: true };
  } catch (e) {
    Logger.log('[UISupport] Failed to save command: ' + e.message);
    return { success: false, error: e.message };
  }
}

/**
 * Clear conversation history
 * Client-side manages state, this clears sequence counter
 * FIX #4: Ensure proper state cleanup (client handles currentConversationId)
 */
function clearChat() {
  try {
    clearSequenceCounter();

    return {
      success: true
    };
  } catch (error) {
    Logger.log('Error clearing chat: ' + error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get configuration
 * Returns current API key, model name, and journal settings
 */
function getConfig() {
  try {
    const config = new ConfigManager('CLAUDE_CHAT');
    const apiKey = config.get('API_KEY');
    const modelName = config.get('MODEL_NAME') || 'claude-sonnet-4-latest';
    const journalEnabled = config.get('JOURNAL_ENABLED') === 'true';
    const journalFolderUrl = config.get('JOURNAL_FOLDER_URL') || '';
    
    // Font size settings (defaults: input=11px, messages=14px)
    const inputFontSize = parseInt(config.get('INPUT_FONT_SIZE') || '11', 10);
    const messageFontSize = parseInt(config.get('MESSAGE_FONT_SIZE') || '14', 10);
    
    return {
      success: true,
      config: {
        apiKey: apiKey || '',
        modelName: modelName,
        journalEnabled: journalEnabled,
        journalFolderUrl: journalFolderUrl,
        inputFontSize: inputFontSize,
        messageFontSize: messageFontSize,
        hasOverride: config.isOverridden('API_KEY'),
        enforcementSource: config.getEnforcementSource('API_KEY')
      }
    };
  } catch (error) {
    Logger.log('Error getting config: ' + error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Save configuration
 * Stores API key, model name, and journal settings in PropertiesService
 */
function saveConfig(params) {
  try {
    let { apiKey, modelName, journalEnabled, journalFolderUrl, inputFontSize, messageFontSize } = params || {};
    const config = new ConfigManager('CLAUDE_CHAT');
    
    // If apiKey is empty, preserve the existing key
    if (!apiKey || !apiKey.trim()) {
      apiKey = config.get('API_KEY');
    }
    
    if (apiKey) {
      // Store at user-global scope (works across all documents)
      config.setUser('API_KEY', apiKey);
    }
    
    if (modelName) {
      // Store model name at user-global scope
      config.setUser('MODEL_NAME', modelName);
    }
    
    // Store journal settings (explicitly handle boolean)
    config.setUser('JOURNAL_ENABLED', journalEnabled ? 'true' : 'false');
    
    if (journalFolderUrl !== undefined) {
      config.setUser('JOURNAL_FOLDER_URL', journalFolderUrl || '');
    }
    
    // Store font size settings
    if (inputFontSize !== undefined) {
      config.setUser('INPUT_FONT_SIZE', String(inputFontSize));
    }
    if (messageFontSize !== undefined) {
      config.setUser('MESSAGE_FONT_SIZE', String(messageFontSize));
    }
    
    return {
      success: true
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// Export functions for CommonJS module system
module.exports = {
  onOpen,
  showSidebar,
  showSidebarDev,
  showSidebarStaging,
  showSidebarProd,
  sendMessageToClaude,
  storeThinkingMessage,
  pollMessages,
  clearChat,
  getConfig,
  saveConfig,
  getApiKey,
  getNextSequenceId,
  clearSequenceCounter,
  loadConversation,
  saveConversation,
  deleteConversation,
  listConversations,
  getCurrentUserEmail,
  getOAuthToken,
  getScriptId,
  loadCommandHistory,
  saveCommandToHistory
};

// Register event handlers
module.exports.__events__ = {
  onOpen: 'onOpen'
};

// Make functions globally accessible
module.exports.__global__ = {
  showSidebar,
  showSidebarDev,
  showSidebarStaging,
  showSidebarProd,
  sendMessageToClaude,
  pollMessages,
  clearChat,
  getConfig,
  saveConfig,
  getNextSequenceId,
  clearSequenceCounter,
  loadConversation,
  saveConversation,
  deleteConversation,
  listConversations,
  loadCommandHistory,
  saveCommandToHistory
};