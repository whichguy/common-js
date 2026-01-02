
<!DOCTYPE html>
<!--
  SIDEBAR CSS ARCHITECTURE
  ========================
  CSS is split into 3 logical files for improved navigation and maintainability:
  
  1. SidebarCore.html (15.6KB, 702 lines)
     - Foundation: Base styles, resets, header, buttons, containers
     - Markdown Content: Code blocks, lists, headers, links, images
     - Toast Notifications: Gemini-style success/error/info/warning toasts
     - Accessibility: Focus indicators, reduced motion support
  
  2. SidebarBubbles.html (8.6KB, 344 lines) - HOT EDIT ZONE
     - Message Bubbles: User, assistant, error message styling
     - AI Thinking Bubbles: "Last Thinking" (pulsing) + "All Thoughts" (collapsible)
     - Error Bubbles: Collapsible error display
     - This file is edited most frequently (~50% of CSS edits)
  
  3. SidebarInput.html (13.9KB, 635 lines)
     - Message Queue: Pending message chips (Gemini bubble style)
     - Attachments: Thumbnail/PDF chips with remove buttons
     - V2 Input Layout: Unified input box, button row, submit button
     - Attach Buttons: Top-right micro icons with badges
  
  EDITING GUIDELINES:
  - Use raw_write with fileType: "HTML" when editing CSS files
  - Do NOT add CommonJS wrappers - these are HTML includes
  - Maintain CSS cascade order: Core → Bubbles → Input
  - Each file has warning header explaining its contents
  
  BENEFITS:
  - 75% reduction in scroll distance for bubble edits
  - Logical grouping improves code navigation
  - Minimal overhead: +12ms server-side eval (negligible)
  - Preserved git history for all styles
-->
<!-- Cache refresh: 2025-11-09 19:30 - Fixed jQuery race condition with waitForJQuery wrapper -->
<html>
<head>
  <base target="_top">
  <link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons" />
  <script 
    src="https://code.jquery.com/jquery-3.7.1.min.js"
    integrity="sha256-/JqT3SQfawRcv/BIHPThkBvs0OEvtFFmqPF/lYI/Cxo="
    crossorigin="anonymous"></script>
  <!-- Google APIs: No SRI - bootstrap loader dynamically loads other scripts, SRI would break functionality -->
  <script src="https://apis.google.com/js/api.js"></script>
  
  <!-- Markdown and HTML sanitization libraries -->
  <script 
    src="https://cdn.jsdelivr.net/npm/marked@11.1.1/marked.min.js"
    integrity="sha256-8zoteDYr3gAWcOOimwH9DcFqf5GU0EKnda+JJwqzi3Q="
    crossorigin="anonymous"></script>
  <script 
    src="https://cdn.jsdelivr.net/npm/dompurify@3.0.8/dist/purify.min.js"
    integrity="sha256-0kaYYq3qitkkVZpP/6uKTJwfTpqFNM6OHDbsaYzw9Uw="
    crossorigin="anonymous"></script>
  
  <!-- Template Includes: CSS Split into Logical Files -->
  <!-- ⚠️ CSS INCLUDE ORDER - DO NOT CHANGE ⚠️ -->
  <!-- Variables must load first (design tokens), then Core, Bubbles, Input, Styles -->
  <!-- All  include()  scriptlets evaluate server-side and inject inline. -->
  <!-- Note: These are HTML files, NOT CommonJS modules. -->
  <!-- Cache refresh timestamp: 2026-01-02 - Added SidebarVariables -->
  <?!= include('sheets-sidebar/css/SidebarVariables') ?>
  <?!= include('sheets-sidebar/css/SidebarCore') ?>
  <?!= include('sheets-sidebar/css/SidebarBubbles') ?>
  <?!= include('sheets-sidebar/css/SidebarInput') ?>
  <?!= include('sheets-sidebar/SidebarStyles') ?>
</head>
<body>
  <div class="header">
    <div class="tabs" role="tablist" aria-label="Main navigation">
      <button class="tab active" data-tab="chat" role="tab" aria-selected="true" aria-controls="chatTab">Chat</button>
      <button class="tab" data-tab="config" role="tab" aria-selected="false" aria-controls="configTab">Config</button>
    </div>
    <div class="header-actions">
      <select id="conversationSelector" class="conversation-dropdown">
        <option value="">Select conversation...</option>
      </select>
      <button class="icon-btn" id="viewJournalBtn" title="View conversation in Google Drive" style="display: none;">
        <span class="material-icons">folder_open</span>
      </button>
      <button class="icon-btn" id="clearChatBtn" title="Clear conversation">
        <span class="material-icons">autorenew</span>
      </button>
    </div>
  </div>

  <!-- Chat Tab -->
  <div class="tab-content active" id="chatTab">
    <div class="chat-container" id="chatContainer"></div>

    <div class="input-container" id="inputContainer">
      <!-- Resize Handle -->
      <div class="resize-handle" id="resizeHandle"></div>

      <!-- Pending Queue (outside unified box) -->
      <div class="pending-queue-container" id="pendingQueue"></div>

      <!-- V2: Wrapper for input box and button row -->
      <div class="v2-input-wrapper">
        <!-- V2: Unified Gemini-style input box -->
        <div class="v2-input-box" id="geminiInputBox">
          <!-- Attachment chips INSIDE the box -->
          <div class="attachment-chips" id="attachmentPreview"></div>

          <!-- Micro attach icon (top-right corner) with badge -->
          <button class="attach-btn" id="attachBtn" title="Attach files" aria-label="Attach files">
            <span class="material-icons">attach_file</span>
            <span class="attachment-badge" id="attachmentBadge" style="display: none;">0</span>
          </button>
          
          <!-- Clear attachments button (shows when attachments exist) -->
          <button class="clear-attachments-btn" id="clearAttachmentsBtn" title="Clear all attachments" aria-label="Clear attachments" style="display: none;">
            <span class="material-icons">close</span>
          </button>

          <!-- Textarea -->
          <textarea
            id="messageInput"
            rows="1"
            placeholder="Enter a prompt here"
            aria-label="Enter your message"></textarea>
        </div>

        <!-- V2: Button row with status and submit button -->
        <div class="v2-button-row">
          <div class="v2-status-group" id="statusArea" role="status" aria-live="polite" style="display: none;">
            <span id="statusText">Processing...</span>
            <span class="status-spinner hidden" id="statusSpinner" aria-label="Processing"></span>
          </div>
          <button class="v2-cancel-btn" id="cancelBtn" style="display: none;" aria-label="Cancel request">
            <span class="material-icons">close</span> Cancel
          </button>
          <button class="v2-submit-btn" id="sendBtn" disabled aria-label="Send message">
            <span class="btn-text">Send</span> <span class="material-icons btn-icon">arrow_forward</span>
          </button>
        </div>
      </div>

      <!-- Hidden file input for attach button -->
      <input type="file" id="fileInput" accept="image/jpeg,image/png,image/gif,image/webp,application/pdf" multiple hidden>
    </div>
  </div>

  <!-- Config Tab -->
  <div class="tab-content" id="configTab">
    <div class="config-container">
      <div class="config-section">
        <h3>AI API Configuration</h3>
        <form id="configForm">
          <div class="form-group">
            <!-- Hidden username field for accessibility compliance -->
            <input type="text" id="username" autocomplete="username" style="display:none;" aria-hidden="true">
            
            <label for="apiKey">API Key</label>
            <input type="password" id="apiKey" placeholder="sk-ant-api03-..." autocomplete="new-password">
            <div class="help-text">Your Anthropic API key. Get one at console.anthropic.com</div>
          </div>
          <div class="form-group">
            <label for="modelName">Model</label>
            <select id="modelName">
              <option value="claude-sonnet-4-latest" selected>Claude Sonnet 4 (Recommended)</option>
              <option value="claude-3-5-haiku-20241022">Claude 3.5 Haiku (Fast)</option>
              <option value="claude-opus-4-latest">Claude Opus 4 (Most Capable)</option>
            </select>
            <div class="help-text">Select the Claude model to use for conversations</div>
          </div>
          
          <h3 style="margin-top: 24px;">Conversation Journal</h3>
          <div class="form-group">
            <label>
              <input type="checkbox" id="journalEnabled" style="width: auto; margin-right: 8px;">
              Enable conversation journaling
            </label>
            <div class="help-text">Store full conversations in Google Drive to reduce payload size</div>
          </div>
          <div class="form-group">
            <label for="journalFolderUrl">Journal Folder (Optional)</label>
            
            <div style="display: flex; gap: 8px; align-items: stretch;">
              <input type="text" 
                     id="journalFolderUrl" 
                     placeholder="Paste Drive URL or click Browse..."
                     style="flex: 1;">
              <button type="button" 
                      id="browseFolderBtn" 
                      class="secondary-btn"
                      style="white-space: nowrap;">
                📁 Browse
              </button>
            </div>
            
            <div class="help-text">
              Choose a Drive folder or leave empty to auto-create "Ask Sheets Conversations".
              <strong>Note:</strong> This folder is shared across all your spreadsheets.
            </div>
            
            <div id="folderStatus" style="margin-top: 8px;"></div>
          </div>
          
          <button type="button" class="primary" id="saveConfigBtn">Save Configuration</button>
        </form>
      </div>
      <div class="status" id="configStatus"></div>
    </div>
  </div>

  <!-- Toast notification container -->
  <div class="toast-container" id="toastContainer"></div>

  <!-- Template Include: SidebarScript.gs -->
  <!-- The <?!= include('SidebarScript') ?> scriptlet evaluates server-side and injects -->
  <!-- the entire contents of SidebarScript.gs inline at this location. -->
  <!-- Note: SidebarScript.gs is an HTML file, NOT a CommonJS module. -->
  <?!= include('SidebarScript') ?>

  <!-- Template Include: gas_client -->
  <!-- Promise-based wrapper for google.script.run API -->
  <?!= include('common-js/html/gas_client') ?>

  <!-- Template Include: SidebarApp.gs -->
  <!-- Main application logic: message history, send button, event handlers -->
  <?!= includeNested('sheets-sidebar/SidebarApp') ?>
</body>
</html>