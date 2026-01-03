function _main(
  module = globalThis.__getCurrentModule(),
  exports = module.exports
) {
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
   */
  function getApiKey() {
    const config = new ConfigManager('CLAUDE_CHAT');
    const apiKey = config.get('API_KEY');
    
    // Fallback to default test key if not configured
    return apiKey || '***REMOVED***';
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
    try {
      // Extract parameters from params object
      const { messages, text, attachments, enableThinking, requestId } = params || {};
      
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
      
      // Show toast notification for error
      try {
        SpreadsheetApp.getActiveSpreadsheet().toast(
          error.message,
          '❌ Chat Error',
          10
        );
      } catch (toastError) {
        // Ignore toast errors (might not have permissions)
      }
      
      // Return serialized error response
      return makeSerializable({
        success: false,
        error: error.message,
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
    // Skip empty or whitespace-only thinking messages
    if (!thinking || !thinking.trim()) {
      return;
    }
    
    try {
      const queue = getThinkingQueue();
      const channelName = `thinking-${requestId}`;
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
   * Get or create the Conversations sheet with proper headers
   * FIX #1: Returns consistent {success, data/error} format
   * @returns {Object} {success, data: {sheet}, error}
   */
  function getOrCreateConversationsSheet() {
    try {
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      let sheet = ss.getSheetByName('Conversations');
      
      if (!sheet) {
        sheet = ss.insertSheet('Conversations');
        
        // Set up headers: ID | Title | User | Data | Saved At | Preview
        sheet.getRange('A1:F1').setValues([['ID', 'Title', 'User', 'Data', 'Saved At', 'Preview']]);
        sheet.getRange('A1:F1').setFontWeight('bold');
        sheet.getRange('A1:F1').setBackground('#4285f4');
        sheet.getRange('A1:F1').setFontColor('#ffffff');
        
        // Set column widths
        sheet.setColumnWidth(1, 150);  // ID
        sheet.setColumnWidth(2, 300);  // Title
        sheet.setColumnWidth(3, 200);  // User
        sheet.setColumnWidth(4, 100);  // Data (hidden)
        sheet.setColumnWidth(5, 150);  // Saved At
        sheet.setColumnWidth(6, 300);  // Preview
        
        // Hide Data column (contains JSON)
        sheet.hideColumns(4);
        
        Logger.log('Created new Conversations sheet');
      }
      
      return {
        success: true,
        data: { sheet: sheet }
      };
    } catch (error) {
      Logger.log('Error in getOrCreateConversationsSheet: ' + error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Save conversation to sheet with auto-generated ID and title
   * FIX #1: Returns consistent {success, data/error} format
   * FIX #2: Validates messages data before processing
   * FIX #5: Includes user email for isolation
   * @param {Array} messages - Conversation messages
   * @returns {Object} {success, data: {id, title, savedAt}, error}
   */
  function saveConversationToSheet(messages) {
    try {
      // FIX #2: Validate input
      if (!messages || !Array.isArray(messages)) {
        return {
          success: false,
          error: 'Invalid messages: must be an array'
        };
      }
      
      const sheetResult = getOrCreateConversationsSheet();
      if (!sheetResult.success) {
        return sheetResult;  // Return error from getOrCreateConversationsSheet
      }
      
      const sheet = sheetResult.data.sheet;
      const timestamp = new Date().toISOString();
      
      // Generate unique ID
      const id = Date.now() + '-' + Math.random().toString(36).substring(2, 8);
      
      // FIX #5: Get current user email
      const userEmail = getCurrentUserEmail();
      
      // Truncate if needed (max 20 messages to prevent sheet size issues)
      const truncatedMessages = messages.slice(-20);
      
      // Extract first user message for preview and title
      const firstUserMsg = truncatedMessages.find(msg => msg && msg.role === 'user');
      const preview = firstUserMsg ? (firstUserMsg.content || '').substring(0, 100) : '(empty conversation)';
      
      // Auto-generate title
      const date = new Date();
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
      const messagePreview = preview.length > 30 ? preview.substring(0, 30) + '...' : preview;
      const title = `Chat ${dateStr}, ${timeStr}: ${messagePreview}`;
      
      // Prepare JSON data
      const jsonData = JSON.stringify({
        messages: truncatedMessages,
        savedAt: timestamp,
        user: userEmail
      });
      
      // FIX #2: Validate JSON serialization
      try {
        JSON.parse(jsonData);  // Verify it's valid JSON
      } catch (parseError) {
        return {
          success: false,
          error: 'Failed to serialize conversation data: ' + parseError.message
        };
      }
      
      // Find next available row
      const lastRow = sheet.getLastRow();
      const nextRow = lastRow + 1;
      
      // Append new conversation: ID | Title | User | Data | Saved At | Preview
      sheet.getRange(`A${nextRow}:F${nextRow}`).setValues([[
        id,
        title,
        userEmail,
        jsonData,
        timestamp,
        preview
      ]]);
      
      Logger.log('Saved conversation to sheet: ' + truncatedMessages.length + ' messages, ID: ' + id + ', User: ' + userEmail);
      
      return {
        success: true,
        data: {
          id: id,
          title: title,
          savedAt: timestamp,
          user: userEmail
        }
      };
    } catch (error) {
      Logger.log('Error saving conversation to sheet: ' + error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Load conversation from sheet by ID
   * FIX #1: Returns consistent {success, data/error} format
   * FIX #2: Validates JSON data before parsing
   * FIX #5: Verifies user has access to conversation
   * @param {string} conversationId - Conversation ID to load
   * @returns {Object} {success, data: {messages, savedAt}, error}
   */
  function loadConversationFromSheet(conversationId) {
    try {
      // FIX #2: Validate input
      if (!conversationId || typeof conversationId !== 'string') {
        return {
          success: false,
          error: 'Invalid conversation ID'
        };
      }
      
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const sheet = ss.getSheetByName('Conversations');
      
      if (!sheet) {
        return {
          success: false,
          error: 'No Conversations sheet found'
        };
      }
      
      // Get all data (skip header row)
      const lastRow = sheet.getLastRow();
      if (lastRow < 2) {
        return {
          success: false,
          error: 'No conversations found'
        };
      }
      
      const data = sheet.getRange(`A2:F${lastRow}`).getValues();
      
      // FIX #5: Get current user for isolation check
      const currentUser = getCurrentUserEmail();
      
      // Find row matching the ID
      for (let i = 0; i < data.length; i++) {
        const rowId = data[i][0];        // Column A: ID
        const rowUser = data[i][2];      // Column C: User
        const jsonData = data[i][3];     // Column D: Data
        
        if (rowId === conversationId) {
          // FIX #5: Verify user has access
          if (rowUser !== currentUser) {
            Logger.log('Access denied: User ' + currentUser + ' attempted to access conversation owned by ' + rowUser);
            return {
              success: false,
              error: 'Access denied: You do not have permission to access this conversation'
            };
          }
          
          if (!jsonData) {
            return {
              success: false,
              error: 'Conversation data is empty'
            };
          }
          
          // FIX #2: Validate JSON before parsing
          let parsed;
          try {
            parsed = JSON.parse(jsonData);
          } catch (parseError) {
            Logger.log('JSON parse error for conversation ' + conversationId + ': ' + parseError.message);
            return {
              success: false,
              error: 'Conversation data is corrupted: ' + parseError.message
            };
          }
          
          // FIX #2: Validate parsed structure
          if (!parsed.messages || !Array.isArray(parsed.messages)) {
            return {
              success: false,
              error: 'Conversation data has invalid structure'
            };
          }
          
          Logger.log('Loaded conversation from sheet: ' + parsed.messages.length + ' messages, ID: ' + conversationId);
          
          return {
            success: true,
            data: {
              messages: parsed.messages,
              savedAt: parsed.savedAt
            }
          };
        }
      }
      
      return {
        success: false,
        error: 'Conversation not found'
      };
    } catch (error) {
      Logger.log('Error loading conversation from sheet: ' + error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * List all conversations for current user
   * FIX #1: Returns consistent {success, data/error} format
   * FIX #5: Filters conversations by current user
   * @returns {Object} {success, data: {conversations}, error}
   */
  function listConversations() {
    try {
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const sheet = ss.getSheetByName('Conversations');
      
      if (!sheet) {
        // FIX #1: Return empty array with success=true (not an error condition)
        return {
          success: true,
          data: {
            conversations: []
          }
        };
      }
      
      // Get all data (skip header row)
      const lastRow = sheet.getLastRow();
      if (lastRow < 2) {
        return {
          success: true,
          data: {
            conversations: []
          }
        };
      }
      
      const data = sheet.getRange(`A2:F${lastRow}`).getValues();
      
      // FIX #5: Get current user for filtering
      const currentUser = getCurrentUserEmail();
      
      // Transform to array of conversation objects, filtering by current user
      const conversations = data
        .filter(row => row[0] && row[2] === currentUser)  // Filter: has ID AND matches current user
        .map(row => ({
          id: row[0],           // Column A: ID
          title: row[1],        // Column B: Title
          user: row[2],         // Column C: User
          savedAt: row[4],      // Column E: Saved At
          preview: row[5]       // Column F: Preview
        }));
      
      // Sort by savedAt descending (newest first)
      conversations.sort((a, b) => {
        const dateA = new Date(a.savedAt);
        const dateB = new Date(b.savedAt);
        return dateB - dateA;
      });
      
      // Limit to 100 most recent conversations
      const limitedConversations = conversations.slice(0, 100);
      
      Logger.log('Listed ' + limitedConversations.length + ' of ' + conversations.length + ' conversations for user: ' + currentUser);
      
      return {
        success: true,
        data: {
          conversations: limitedConversations
        }
      };
    } catch (error) {
      Logger.log('Error listing conversations: ' + error.message);
      return {
        success: false,
        error: error.message
      };
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
   * Returns current API key (masked) and model name
   */
  function getConfig() {
    try {
      const config = new ConfigManager('CLAUDE_CHAT');
      const apiKey = config.get('API_KEY');
      const modelName = config.get('MODEL_NAME') || 'claude-haiku-4-5';
      
      return {
        success: true,
        data: {
          config: {
            apiKey: apiKey || '',
            modelName: modelName,
            hasOverride: config.isOverridden('API_KEY'),
            enforcementSource: config.getEnforcementSource('API_KEY')
          }
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
   * Stores API key and model name in PropertiesService
   */
  function saveConfig(params) {
    try {
      const { apiKey, modelName } = params || {};
      const config = new ConfigManager('CLAUDE_CHAT');

      if (apiKey) {
        // Store at user-global scope (works across all documents)
        config.setUser('API_KEY', apiKey);
      }

      if (modelName) {
        // Store model name at user-global scope
        config.setUser('MODEL_NAME', modelName);
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

  /**
   * Get font size setting
   * @param {number} defaultValue - Default value if not set
   * @returns {number} Font size in pixels
   */
  function getFontSize(defaultValue) {
    try {
      const config = new ConfigManager('CLAUDE_CHAT');
      const size = config.get('FONT_SIZE', defaultValue);
      return parseInt(size, 10) || defaultValue;
    } catch (error) {
      Logger.log('Error getting font size: ' + error.message);
      return defaultValue;
    }
  }

  /**
   * Set font size setting
   * @param {number} size - Font size in pixels (8-16)
   * @returns {Object} Result with success flag
   */
  function setFontSize(size) {
    try {
      const parsedSize = parseInt(size, 10);
      if (isNaN(parsedSize) || parsedSize < 8 || parsedSize > 16) {
        return { success: false, error: 'Font size must be between 8 and 16' };
      }

      const config = new ConfigManager('CLAUDE_CHAT');
      config.setUser('FONT_SIZE', parsedSize.toString());

      return { success: true };
    } catch (error) {
      Logger.log('Error setting font size: ' + error.message);
      return { success: false, error: error.message };
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
    pollMessages,  // NEW: Generic polling function
    clearChat,
    getConfig,
    saveConfig,
    getFontSize,
    setFontSize,
    getApiKey,
    getNextSequenceId,
    clearSequenceCounter,
    getOrCreateConversationsSheet,
    saveConversationToSheet,
    loadConversationFromSheet,
    listConversations,
    getCurrentUserEmail
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
    pollMessages,  // NEW: Generic polling function
    clearChat,
    getConfig,
    saveConfig,
    getNextSequenceId,
    clearSequenceCounter,
    saveConversationToSheet,
    loadConversationFromSheet,
    listConversations
  };
}

__defineModule__(_main);