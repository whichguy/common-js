/**
 * ControlChannelManager - Manages control channel polling and message processing
 * 
 * Polls for control messages (cancel, pause, priority, custom) and executes handlers.
 * Uses QueueManager with Cache storage for fast, auto-expiring channels.
 * 
 * @example
 * const manager = new ControlChannelManager({
 *   channelName: 'control-req-123',
 *   pollInterval: 1000
 * });
 * 
 * // In long-running operation
 * manager.check(); // Throws CancelledError if cancel message found
 */

const QueueManager = require('gas-queue/QueueManager');

class ControlChannelManager {
  /**
   * @param {Object} config - Configuration options
   * @param {string} config.channelName - Control channel name (e.g., "control-req-123")
   * @param {number} [config.pollInterval=1000] - Polling interval in ms
   * @param {function} [config.customHandler] - Custom message type handler
   */
  constructor({channelName, pollInterval = 1000, customHandler = null}) {
    // Validate channelName
    if (!channelName || typeof channelName !== 'string') {
      throw new Error('[ControlChannelManager] channelName is required and must be a string');
    }
    if (channelName.length > 250) {
      throw new Error('[ControlChannelManager] channelName too long (max 250 chars)');
    }
    
    // Validate pollInterval
    if (typeof pollInterval !== 'number' || pollInterval < 100 || pollInterval > 60000) {
      throw new Error('[ControlChannelManager] pollInterval must be between 100ms and 60000ms');
    }
    
    this.channelName = channelName;
    this.pollInterval = pollInterval;
    this.customHandler = customHandler;
    
    // State
    this.paused = false;
    this.priority = 5; // Default priority (1-10)
    
    // Polling optimization
    this.lastPollTime = 0;
    
    // Queue manager for cache-based messaging
    this.queue = new QueueManager({
      store: 'cache',
      namespace: 'CONTROL',
      ttl: 21600, // 6 hours
      debug: false
    });
  }
  
  /**
   * Check for control messages
   * Call this periodically from long-running operations
   * Throws CancelledError if cancel message found
   */
  check() {
    const now = Date.now();
    const timeSinceLastPoll = now - this.lastPollTime;
    
    if (timeSinceLastPoll < this.pollInterval) {
      return; // Too soon to poll again
    }
    
    this.lastPollTime = now;
    
    // Peek to see if any messages exist
    const messages = this.queue.peek(this.channelName, 10);
    
    if (messages.length === 0) {
      return; // No messages
    }
    
    // Pickup server-bound messages using criteria filter
    // Only pickup messages addressed to 'server', leaving client-bound messages
    const serverMessages = this.queue.pickup(
      this.channelName,
      messages.length,
      0,
      false,
      {metadata: {to: 'server'}}  // Criteria: only pickup messages for server
    );
    
    // Process each server-bound message
    for (let i = 0; i < serverMessages.length; i++) {
      this._processMessage(serverMessages[i]);
    }
  }
  

  
  /**
   * Process individual control message
   * @private
   * @param {Object} message - Message from queue
   */
  _processMessage(message) {
    const type = message.metadata && message.metadata.type ? message.metadata.type : 'unknown';
    const data = message.data || {};
    const metadata = message.metadata || {};
    
    log('[ControlChannel] Processing: ' + type + ' on ' + this.channelName);
    
    switch (type) {
      case 'cancel':
        this._handleCancel(data, metadata);
        break;
      case 'pause':
        this._handlePause(data, metadata);
        break;
      case 'resume':
        this._handleResume(data, metadata);
        break;
      case 'priority':
        this._handlePriority(data, metadata);
        break;
      case 'custom':
        this._handleCustom(data, metadata);
        break;
      default:
        log('[ControlChannel] Unknown message type: ' + type);
    }
  }
  
  /**
   * Handle cancel message - post acknowledgment and throw CancelledError
   * @private
   * @param {Object} data - Message data
   * @param {Object} metadata - Message metadata
   * @throws {Error} CancelledError
   */
  _handleCancel(data, metadata) {
    const reason = data.reason || 'Operation cancelled by user';
    
    log('[ControlChannel] CANCEL: ' + reason);
    
    // Post acknowledgment back to client
    try {
      this.queue.post(
        this.channelName,
        { 
          acknowledged: true,
          originalReason: reason,
          cancelledAt: new Date().toISOString()
        },
        { 
          type: 'cancel_ack',
          to: 'client',        // Recipient
          from: 'server',      // Sender
          timestamp: Date.now() 
        }
      );
      log('[ControlChannel] Posted cancel acknowledgment to client');
    } catch (ackError) {
      // Log but don't block cancellation
      log('[ControlChannel] Failed to post acknowledgment: ' + ackError.message);
    }
    
    // Throw error that will propagate to caller
    const error = new Error(reason);
    error.name = 'CancelledError';
    error.channelName = this.channelName;
    error.metadata = metadata;
    
    throw error;
  }
  
  /**
   * Handle pause message - sleep for duration
   * @private
   * @param {Object} data - Message data with duration
   * @param {Object} metadata - Message metadata
   */
  _handlePause(data, metadata) {
    const duration = data.duration || 5000;
    
    log('[ControlChannel] PAUSE: ' + duration + 'ms');
    
    this.paused = true;
    Utilities.sleep(duration);
  }
  
  /**
   * Handle resume message - clear pause state
   * @private
   * @param {Object} data - Message data
   * @param {Object} metadata - Message metadata
   */
  _handleResume(data, metadata) {
    log('[ControlChannel] RESUME');
    this.paused = false;
  }
  
  /**
   * Handle priority change message
   * @private
   * @param {Object} data - Message data with level
   * @param {Object} metadata - Message metadata
   */
  _handlePriority(data, metadata) {
    const level = data.level || 5;
    
    log('[ControlChannel] PRIORITY: ' + level);
    
    this.priority = Math.max(1, Math.min(10, level)); // Clamp 1-10
  }
  
  /**
   * Handle custom message type via user handler
   * @private
   * @param {Object} data - Message data
   * @param {Object} metadata - Message metadata
   */
  _handleCustom(data, metadata) {
    if (!this.customHandler) {
      log('[ControlChannel] Custom message but no handler configured');
      return;
    }
    
    log('[ControlChannel] CUSTOM: ' + JSON.stringify(data));
    
    try {
      this.customHandler(data, metadata, this);
    } catch (error) {
      log('[ControlChannel] Error in custom handler: ' + error.message);
    }
  }
  
  /**
   * Cleanup control channel (flush messages)
   */
  cleanup() {
    try {
      this.queue.flush(this.channelName);
      log('[ControlChannel] Cleanup: flushed ' + this.channelName);
    } catch (error) {
      log('[ControlChannel] Cleanup error: ' + error.message);
    }
  }
}

module.exports = ControlChannelManager;