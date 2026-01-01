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
        ttl: 21600  // 6 hours
      });
    }
    return thinkingQueue;
  }

  // Singleton queue instance for tool log messages (Cache-backed for performance)
  let toolLogQueue = null;

  /**
   * Get or create tool log queue singleton
   */
  function getToolLogQueue() {
    if (!toolLogQueue) {
      toolLogQueue = new QueueManager({
        store: 'cache',
        namespace: 'CLAUDE_CHAT',
        scope: 'user',
        ttl: 21600  // 6 hours
      });
    }
    return toolLogQueue;
  }

  /**
   * Get API key from ConfigManager hierarchy
   * Priority: User+Doc → Doc → User → Domain → Script
   */
  function getApiKey() {
    const config = new ConfigManager('CLAUDE_CHAT');
    const apiKey = config.get('API_KEY');
    
    // Fallback to default test key if not configured
    return apiKey || 'REDACTED_API_KEY';
  }

  /**
   * Show sidebar when spreadsheet opens
   */
  function onOpen() {
    SpreadsheetApp.getUi()
      .createMenu('Claude Chat')
      .addItem('Open Chat', 'showSidebar')
      .addToUi();
  }

  /**
   * Show the chat sidebar
   */
  function showSidebar() {
    const html = HtmlService.createHtmlOutputFromFile('Sidebar')
      .setTitle('Claude Chat')
      .setWidth(400);

    SpreadsheetApp.getUi().showSidebar(html);
  }

  /**
   * Get next persistent sequence ID
   * Uses PropertiesService with LockService for atomic operations
   * @returns {number} Next sequence ID
   */
  function getNextSequenceId() {
    const lock = LockService.getUserLock();
    
    try {
      if (!lock.tryLock(500)) {
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
   * Clear the thinking message queue
   * Called when new message is sent to prevent stale thinking from previous messages
   */
  function clearThinkingQueue() {
    try {
      const queue = getThinkingQueue();
      queue.flush('thinking');
    } catch (error) {
      Logger.log('Error clearing thinking queue: ' + error.message);
    }
  }

  /**
   * Send message to Claude API
   * Called from client-side
   */
  function sendMessageToClaude(params) {
    try {
      // Purge any queued messages from previous requests
      clearThinkingQueue();
      clearToolLogQueue();
      
      // Get persistent sequence ID before creating conversation
      const sequenceId = getNextSequenceId();
      
      // Create ClaudeConversation (auto-loads API key and tools)
      const ClaudeConversation = require('ClaudeConversation');
      const claude = new ClaudeConversation();
      
      // Callback to store thinking messages as they arrive with sequenceId
      const onThinking = (thinkingText, msgSequenceId) => {
        storeThinkingMessage(thinkingText, msgSequenceId);
      };
      
      // Call Claude API - tools auto-instantiate and auto-execute
      const result = claude.sendMessage({
        messages: params.messages || [],
        text: params.text,
        images: params.images || [],
        enableThinking: params.enableThinking !== false,
        onThinking: onThinking,
        sequenceId: sequenceId
      });
      
      return {
        success: true,
        data: {
          response: result.response,
          messages: result.messages,
          thinking: result.thinkingMessages,
          usage: result.usage || {
            input_tokens: 0,
            output_tokens: 0
          },
          sequenceId: result.sequenceId
        }
      };
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
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Store thinking message using QueueManager
   * Messages are automatically managed by QueueManager with Cache backing
   */
  function storeThinkingMessage(thinking, sequenceId) {
    // Skip empty or whitespace-only thinking messages
    if (!thinking || !thinking.trim()) {
      return;
    }
    
    try {
      const queue = getThinkingQueue();
      queue.post('thinking', thinking, {
        sequenceId: sequenceId,
        type: 'thinking'
      });
    } catch (error) {
      Logger.log('Error storing thinking message: ' + error.message);
      // Don't throw - thinking is nice-to-have, not critical
    }
  }

  /**
   * Store tool log message using QueueManager
   * Messages are automatically managed by QueueManager with Cache backing
   */
  function storeToolLogMessage(logText, sequenceId) {
    // Skip empty or whitespace-only log messages
    if (!logText || !logText.trim()) {
      return;
    }
    
    try {
      const queue = getToolLogQueue();
      queue.post('tool_log', logText, {
        sequenceId: sequenceId,
        type: 'tool_log'
      });
    } catch (error) {
      Logger.log('Error storing tool log message: ' + error.message);
      // Don't throw - logging is nice-to-have, not critical
    }
  }

  /**
   * Clear the tool log message queue
   * Called when new message is sent to prevent stale logs from previous messages
   */
  function clearToolLogQueue() {
    try {
      const queue = getToolLogQueue();
      queue.flush('tool_log');
    } catch (error) {
      Logger.log('Error clearing tool log queue: ' + error.message);
    }
  }

  /**
   * Poll for tool log messages using QueueManager
   * Called from client-side every 300ms
   * @returns {Object} {success, messages}
   */
  function pollToolLogMessages() {
    try {
      const queue = getToolLogQueue();
      
      // Pickup all available messages (destructive read)
      const queueMessages = queue.pickup('tool_log', 100);
      
      // Transform to expected format
      const messages = queueMessages.map(msg => ({
        text: msg.data,
        sequenceId: msg.metadata.sequenceId,
        timestamp: msg.timestamp
      }));
      
      return {
        success: true,
        messages: messages
      };
    } catch (error) {
      Logger.log('Error polling tool log messages: ' + error.message);
      return {
        success: false,
        messages: []
      };
    }
  }

  /**
   * Poll for thinking messages using QueueManager
   * Called from client-side every 300ms
   * @returns {Object} {success, messages}
   */
  function pollThinkingMessages() {
    try {
      const queue = getThinkingQueue();
      
      // Pickup all available messages (destructive read)
      const queueMessages = queue.pickup('thinking', 100);
      
      // Transform to expected format
      const messages = queueMessages.map(msg => ({
        text: msg.data,
        sequenceId: msg.metadata.sequenceId,
        timestamp: msg.timestamp
      }));
      
      return {
        success: true,
        messages: messages
      };
    } catch (error) {
      Logger.log('Error polling thinking messages: ' + error.message);
      return {
        success: false,
        messages: []
      };
    }
  }

  /**
   * Clear conversation history
   * Client-side manages state, this clears queues and sequence counter
   */
  function clearChat() {
    clearThinkingQueue();
    clearToolLogQueue();
    clearSequenceCounter();

    return {
      success: true
    };
  }

  /**
   * Get configuration
   * Returns current API key (masked)
   */
  function getConfig() {
    const config = new ConfigManager('CLAUDE_CHAT');
    const apiKey = config.get('API_KEY');
    
    return {
      success: true,
      config: {
        apiKey: apiKey || '',
        hasOverride: config.isOverridden('API_KEY'),
        enforcementSource: config.getEnforcementSource('API_KEY')
      }
    };
  }

  /**
   * Save configuration
   * Stores API key in PropertiesService
   */
  function saveConfig(params) {
    try {
      const config = new ConfigManager('CLAUDE_CHAT');
      
      if (params.apiKey) {
        // Store at user-global scope (works across all documents)
        config.setUser('API_KEY', params.apiKey);
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
   * Save thread to persistence (optional feature)
   * Stores at User+Doc scope (per user, per document)
   * 
   * @param {Object} params - {messages, nextSequenceId}
   */
  function saveThread(params) {
    try {
      const config = new ConfigManager('CLAUDE_CHAT');
      const { messages, nextSequenceId } = params;
      
      // Truncate if needed (max 20 messages to stay under 9KB limit)
      const truncatedMessages = messages.slice(-20);
      
      config.setUserDoc('THREAD', JSON.stringify({
        messages: truncatedMessages,
        nextSequenceId: nextSequenceId,
        savedAt: new Date().toISOString()
      }));
      
      return { success: true };
    } catch (error) {
      Logger.log('Error saving thread: ' + error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Load thread from persistence
   * Retrieves from User+Doc scope
   * 
   * @returns {Object} {success, thread: {messages, nextSequenceId, savedAt}}
   */
  function loadThread() {
    try {
      const config = new ConfigManager('CLAUDE_CHAT');
      const threadJson = config.get('THREAD');
      
      return {
        success: true,
        thread: threadJson ? JSON.parse(threadJson) : null
      };
    } catch (error) {
      Logger.log('Error loading thread: ' + error.message);
      return {
        success: false,
        thread: null,
        error: error.message
      };
    }
  }

  // Export functions for CommonJS module system
  module.exports = {
    onOpen,
    showSidebar,
    sendMessageToClaude,
    storeThinkingMessage,
    pollThinkingMessages,
    clearChat,
    getConfig,
    saveConfig,
    getApiKey,
    getNextSequenceId,
    clearSequenceCounter,
    clearThinkingQueue,
    saveThread,
    loadThread
  };

  // Register event handlers
  module.exports.__events__ = {
    onOpen: 'onOpen'
  };

  // Make functions globally accessible
  module.exports.__global__ = {
    showSidebar,
    sendMessageToClaude,
    pollThinkingMessages,
    clearChat,
    getConfig,
    saveConfig,
    getNextSequenceId,
    clearSequenceCounter,
    clearThinkingQueue,
    saveThread,
    loadThread
  };
}

__defineModule__(_main);