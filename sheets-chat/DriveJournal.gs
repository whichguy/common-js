function _main(
  module = globalThis.__getCurrentModule(),
  exports = module.exports,
  log = globalThis.__getModuleLogFunction?.(module) || (() => {})
) {
  const ConfigManager = require('common-js/ConfigManager');

  /**
   * Get journal folder from configuration
   * Creates folder if it doesn't exist
   * @returns {GoogleAppsScript.Drive.Folder|null} Journal folder or null if disabled
   */
  function getJournalFolder() {
    try {
      const config = new ConfigManager('CLAUDE_CHAT');
      
      // Check if journaling is enabled (default: true)
      const journalEnabled = config.get('JOURNAL_ENABLED');
      if (journalEnabled === 'false' || journalEnabled === false) {
        return null;
      }
      
      return getJournalFolderForReading();
    } catch (error) {
      log('[DriveJournal] Error getting journal folder: ' + error.message);
      return null;
    }
  }

  /**
   * Get journal folder for reading (bypasses enabled check)
   * Used by listJournals and readJournal to access existing data
   * even when journaling is disabled for new conversations
   * @returns {GoogleAppsScript.Drive.Folder|null} Journal folder or null if not found
   */
  function getJournalFolderForReading() {
    try {
      const config = new ConfigManager('CLAUDE_CHAT');
      const folderId = config.get('JOURNAL_FOLDER_ID');
      
      if (folderId) {
        // Use configured folder
        try {
          return DriveApp.getFolderById(folderId);
        } catch (e) {
          log('[DriveJournal] Configured folder not accessible: ' + folderId);
          return null;
        }
      } else {
        // Look for "Sheets Chat Conversations" folder (don't create if missing)
        const folderName = 'Sheets Chat Conversations';
        const existingFolders = DriveApp.getFoldersByName(folderName);
        
        if (existingFolders.hasNext()) {
          return existingFolders.next();
        } else {
          // No folder found - return null (don't create for read operations)
          return null;
        }
      }
    } catch (error) {
      log('[DriveJournal] Error getting journal folder for reading: ' + error.message);
      return null;
    }
  }

  /**
   * Extract and validate folder ID from URL or raw ID
   * @param {string} urlOrId - Drive URL or folder ID
   * @returns {Object} {success, folderId, folderName, error}
   */
  function extractAndValidateFolderId(urlOrId) {
    if (!urlOrId || typeof urlOrId !== 'string') {
      return { success: false, error: 'No folder URL or ID provided' };
    }
    
    const trimmed = urlOrId.trim();
    
    // Empty string = use default folder
    if (trimmed === '') {
      return { success: true, folderId: '', useDefault: true };
    }
    
    let folderId = null;
    
    // Just an ID (no slashes or query params)
    if (!trimmed.includes('/') && !trimmed.includes('?')) {
      folderId = trimmed;
    } else {
      // Remove query parameters first
      const withoutQuery = trimmed.split('?')[0];
      
      // Modern format: /folders/{ID}
      let match = withoutQuery.match(/\/folders\/([a-zA-Z0-9_-]+)/);
      if (match) {
        folderId = match[1];
      } else {
        // Legacy format: ?id={ID}
        match = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
        if (match) {
          folderId = match[1];
        }
      }
    }
    
    if (!folderId) {
      return {
        success: false,
        error: 'Invalid Drive folder URL. Please paste the full URL from your browser address bar.'
      };
    }
    
    // Validate folder exists and is accessible
    try {
      const folder = DriveApp.getFolderById(folderId);
      const name = folder.getName();
      
      return {
        success: true,
        folderId: folderId,
        folderName: name,
        validated: true
      };
    } catch (error) {
      return {
        success: false,
        error: 'Cannot access this folder. It may have been deleted or you may not have permission.',
        folderId: folderId
      };
    }
  }

  /**
   * Get Drive URL for folder ID
   * @param {string} folderId - Folder ID
   * @returns {string} Drive URL
   */
  function getFolderUrl(folderId) {
    if (!folderId) return '';
    return `https://drive.google.com/drive/folders/${folderId}`;
  }

  /**
   * Get journal file name for conversation
   * Format: journal-{conversationId}.json
   * @param {string} conversationId - Conversation ID
   * @returns {string} File name
   */
  function getJournalFileName(conversationId) {
    return `journal-${conversationId}.json`;
  }

  /**
   * Create new journal file in Drive
   * @param {string} conversationId - Unique conversation ID
   * @param {string} userEmail - User email for metadata
   * @returns {Object} {success, data: {fileId, url}, error}
   */
  function createJournal(conversationId, userEmail) {
    const startTime = Date.now();
    
    try {
      const folder = getJournalFolder();
      
      if (!folder) {
        return {
          success: false,
          error: 'Journaling is disabled or folder not accessible',
          disabled: true
        };
      }
      
      const fileName = getJournalFileName(conversationId);
      
      // Check if file already exists
      const existingFiles = folder.getFilesByName(fileName);
      if (existingFiles.hasNext()) {
        const existingFile = existingFiles.next();
        log('[DriveJournal] Journal already exists: ' + conversationId);
        return {
          success: true,
          data: {
            fileId: existingFile.getId(),
            url: existingFile.getUrl(),
            existed: true
          }
        };
      }
      
      // Create initial journal structure
      const journalData = {
        conversationId: conversationId,
        createdAt: new Date().toISOString(),
        userEmail: userEmail,
        messages: []
      };
      
      // Create file
      const blob = Utilities.newBlob(
        JSON.stringify(journalData, null, 2),
        'application/json',
        fileName
      );
      
      const file = folder.createFile(blob);
      
      const elapsed = Date.now() - startTime;
      log(`[DriveJournal] Created journal in ${elapsed}ms: ${conversationId}`);
      
      return {
        success: true,
        data: {
          fileId: file.getId(),
          url: file.getUrl(),
          created: true
        }
      };
    } catch (error) {
      const elapsed = Date.now() - startTime;
      log(`[DriveJournal] Error creating journal (${elapsed}ms): ` + error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Append messages to journal
   * Reads existing file, appends messages, writes back
   * @param {string} conversationId - Conversation ID
   * @param {Array} messages - Messages to append
   * @returns {Object} {success, data: {messageCount}, error}
   */
  function appendToJournal(conversationId, messages) {
    const startTime = Date.now();
    
    // Validate messages parameter
    if (!messages || !Array.isArray(messages)) {
      return {
        success: false,
        error: 'Invalid messages parameter: must be a non-empty array'
      };
    }
    
    if (messages.length === 0) {
      return {
        success: true,
        data: { messageCount: 0 },
        skipped: 'empty array'
      };
    }
    
    try {
      const folder = getJournalFolder();
      
      if (!folder) {
        return {
          success: false,
          error: 'Journaling is disabled or folder not accessible',
          disabled: true
        };
      }
      
      const fileName = getJournalFileName(conversationId);
      
      // Find file
      const files = folder.getFilesByName(fileName);
      if (!files.hasNext()) {
        return {
          success: false,
          error: 'Journal file not found: ' + conversationId
        };
      }
      
      const file = files.next();
      
      // Read current content
      const content = file.getBlob().getDataAsString();
      const journalData = JSON.parse(content);
      
      // Append new messages
      journalData.messages = journalData.messages.concat(messages);
      
      // Write back
      file.setContent(JSON.stringify(journalData, null, 2));
      
      const elapsed = Date.now() - startTime;
      log(`[DriveJournal] Appended ${messages.length} messages in ${elapsed}ms: ${conversationId}`);
      
      return {
        success: true,
        data: {
          messageCount: journalData.messages.length
        }
      };
    } catch (error) {
      const elapsed = Date.now() - startTime;
      log(`[DriveJournal] Error appending to journal (${elapsed}ms): ` + error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Read full journal from Drive
   * NOTE: Uses getJournalFolderForReading to access existing journals
   * even when journaling is disabled for new conversations
   * @param {string} conversationId - Conversation ID
   * @returns {Object} {success, data: {messages, createdAt, userEmail}, error}
   */
  function readJournal(conversationId) {
    const startTime = Date.now();
    
    try {
      // Use reading-specific folder getter (bypasses enabled check)
      const folder = getJournalFolderForReading();
      
      if (!folder) {
        return {
          success: false,
          error: 'Journal folder not found'
        };
      }
      
      const fileName = getJournalFileName(conversationId);
      
      // Find file
      const files = folder.getFilesByName(fileName);
      if (!files.hasNext()) {
        return {
          success: false,
          error: 'Journal file not found: ' + conversationId
        };
      }
      
      const file = files.next();
      
      // Read content
      const content = file.getBlob().getDataAsString();
      const journalData = JSON.parse(content);
      
      const elapsed = Date.now() - startTime;
      log(`[DriveJournal] Read journal in ${elapsed}ms: ${conversationId} (${journalData.messages.length} messages)`);
      
      return {
        success: true,
        data: {
          messages: journalData.messages,
          createdAt: journalData.createdAt,
          userEmail: journalData.userEmail
        }
      };
    } catch (error) {
      const elapsed = Date.now() - startTime;
      log(`[DriveJournal] Error reading journal (${elapsed}ms): ` + error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get Drive URL for journal file
   * @param {string} conversationId - Conversation ID
   * @returns {Object} {success, data: {url}, error}
   */
  function getJournalUrl(conversationId) {
    try {
      const folder = getJournalFolder();
      
      if (!folder) {
        return {
          success: false,
          error: 'Journaling is disabled or folder not accessible',
          disabled: true
        };
      }
      
      const fileName = getJournalFileName(conversationId);
      
      // Find file
      const files = folder.getFilesByName(fileName);
      if (!files.hasNext()) {
        return {
          success: false,
          error: 'Journal file not found: ' + conversationId
        };
      }
      
      const file = files.next();
      
      return {
        success: true,
        data: {
          url: file.getUrl(),
          fileId: file.getId()
        }
      };
    } catch (error) {
      log('[DriveJournal] Error getting journal URL: ' + error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Delete journal file from Drive
   * Used for cleanup in error scenarios
   * @param {string} conversationId - Conversation ID
   * @returns {Object} {success, error}
   */
  function deleteJournal(conversationId) {
    try {
      const folder = getJournalFolder();
      
      if (!folder) {
        return {
          success: false,
          error: 'Journaling is disabled or folder not accessible',
          disabled: true
        };
      }
      
      const fileName = getJournalFileName(conversationId);
      
      // Find file
      const files = folder.getFilesByName(fileName);
      if (!files.hasNext()) {
        return {
          success: true,
          notFound: true
        };
      }
      
      const file = files.next();
      file.setTrashed(true);
      
      log('[DriveJournal] Deleted journal: ' + conversationId);
      
      return {
        success: true
      };
    } catch (error) {
      log('[DriveJournal] Error deleting journal: ' + error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * List all journal files in the Drive folder
   * Returns metadata for each conversation (id, title, dates, preview)
   * NOTE: This always reads existing journals even if journaling is disabled
   * (journaling disabled only prevents NEW journals from being created)
   * @param {string} userEmail - Filter by user email (optional, for isolation)
   * @returns {Object} {success, data: {conversations[]}, error}
   */
  function listJournals(userEmail) {
    const startTime = Date.now();
    
    try {
      // Get folder directly (bypass enabled check - we always want to list existing journals)
      const folder = getJournalFolderForReading();
      
      if (!folder) {
        return {
          success: true,
          data: {
            conversations: []
          }
        };
      }
      
      const conversations = [];
      const files = folder.getFiles();
      
      while (files.hasNext()) {
        const file = files.next();
        const fileName = file.getName();
        
        // Only process journal-*.json files
        if (!fileName.startsWith('journal-') || !fileName.endsWith('.json')) {
          continue;
        }
        
        try {
          // Extract conversation ID from filename
          const conversationId = fileName.replace('journal-', '').replace('.json', '');
          
          // Read file content to get metadata
          const content = file.getBlob().getDataAsString();
          const journalData = JSON.parse(content);
          
          // Filter by user email if provided
          if (userEmail && journalData.userEmail && journalData.userEmail !== userEmail) {
            continue;  // Skip conversations not owned by this user
          }
          
          // Extract first user message for preview/title
          let preview = '(empty conversation)';
          let title = 'Conversation';
          
          if (journalData.messages && journalData.messages.length > 0) {
            const firstUserMsg = journalData.messages.find(msg => msg && msg.role === 'user');
            if (firstUserMsg && firstUserMsg.content) {
              // Handle content that might be array (Claude format) or string
              let contentText = '';
              if (typeof firstUserMsg.content === 'string') {
                contentText = firstUserMsg.content;
              } else if (Array.isArray(firstUserMsg.content)) {
                const textBlock = firstUserMsg.content.find(block => block.type === 'text');
                contentText = textBlock ? textBlock.text : '';
              }
              preview = contentText.substring(0, 100);
              
              // Auto-generate title from date + preview
              const createdDate = new Date(journalData.createdAt);
              const dateStr = createdDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
              const timeStr = createdDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
              const messagePreview = preview.length > 30 ? preview.substring(0, 30) + '...' : preview;
              title = `Chat ${dateStr}, ${timeStr}: ${messagePreview}`;
            }
          }
          
          conversations.push({
            id: conversationId,
            title: title,
            user: journalData.userEmail || 'unknown',
            savedAt: journalData.createdAt,
            preview: preview,
            messageCount: journalData.messages ? journalData.messages.length : 0,
            fileId: file.getId(),
            url: file.getUrl()
          });
        } catch (parseError) {
          // Skip files that can't be parsed
          log('[DriveJournal] Error parsing journal file ' + fileName + ': ' + parseError.message);
          continue;
        }
      }
      
      // Sort by savedAt descending (newest first)
      conversations.sort((a, b) => {
        const dateA = new Date(a.savedAt);
        const dateB = new Date(b.savedAt);
        return dateB - dateA;
      });
      
      // Limit to 100 most recent
      const limitedConversations = conversations.slice(0, 100);
      
      const elapsed = Date.now() - startTime;
      log(`[DriveJournal] Listed ${limitedConversations.length} journals in ${elapsed}ms`);
      
      return {
        success: true,
        data: {
          conversations: limitedConversations
        }
      };
    } catch (error) {
      const elapsed = Date.now() - startTime;
      log(`[DriveJournal] Error listing journals (${elapsed}ms): ` + error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Export functions as CommonJS module
  module.exports = {
    createJournal,
    appendToJournal,
    readJournal,
    getJournalUrl,
    deleteJournal,
    listJournals,
    getJournalFolder,
    getJournalFolderForReading,
    getJournalFileName,
    extractAndValidateFolderId,
    getFolderUrl
  };
}

__defineModule__(_main);