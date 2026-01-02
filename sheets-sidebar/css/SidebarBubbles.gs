<style>
  /* ⚠️ WARNING: This file is an HTML include - DO NOT add CommonJS wrapper!
   * This file is included in Sidebar.gs via <?!= include('SidebarBubbles') ?>
   * Always use raw_write with fileType: "HTML" when editing this file.
   */
  
  /* ==================================================
     MESSAGE BUBBLES - User, Assistant, Error
     ================================================== */
  
  /* Base message styles (used by JavaScript) */
  .message {
    background: white;
    border-radius: 18px;
    padding: 16px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
    border: 1px solid #e8eaed;
    margin-bottom: 12px;
    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .message.user-message {
    /* Softer pastel teal gradient */
    background: linear-gradient(135deg, #7eb8c9 0%, #8ec5d4 50%, #9ed2df 100%);
    color: white;
    border: none;
    box-shadow: 0 2px 8px rgba(126, 184, 201, 0.2);
  }

  /* Base message text - configurable font size */
  .message-text {
    font-size: var(--font-size-messages, 14px);
    line-height: 1.5;
  }

  .message.user-message .message-text {
    color: white;
    /* font-size inherited from .message-text */
  }

  .message.assistant-message {
    background: white;
    border: 1px solid #e8eaed;
  }

  /* ==================================================
     THINKING MESSAGE - Collapsible thinking bubble
     Uses .message base for consistent styling
     ================================================== */

  .message.thinking-message {
    background: #f8f9fa;  /* Subtle gray to distinguish from response */
    border: 1px solid #dadce0;
    cursor: default;
  }

  .message.thinking-message .thinking-header {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    padding-bottom: 0;
    color: #5f6368;
    font-size: 13px;
    font-weight: 500;
  }

  .message.thinking-message .thinking-header .material-icons {
    font-size: 18px;
    color: #667eea;
  }

  .message.thinking-message .thinking-header .toggle-icon {
    margin-left: auto;
    transition: transform 0.2s ease;
  }

  .message.thinking-message .thinking-label {
    flex: 1;
  }

  /* Content hidden when collapsed */
  .message.thinking-message.collapsed .message-text {
    display: none;
  }

  /* When expanded, add spacing between header and content */
  .message.thinking-message:not(.collapsed) .thinking-header {
    padding-bottom: 12px;
    border-bottom: 1px solid #e8eaed;
    margin-bottom: 12px;
  }

  .message.thinking-indicator {
    background: #f8f9fa;
    border: 1px solid #e8eaed;
    padding: 12px;
  }

  /* ==================================================
     THINKING INDICATOR - Simple inline dots animation
     ================================================== */

  .thinking-dots {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 0;
  }

  .thinking-dots span {
    width: 8px;
    height: 8px;
    background: #667eea;
    border-radius: 50%;
    display: inline-block;
    animation: thinkingDot 1.4s infinite ease-in-out both;
  }

  .thinking-dots span:nth-child(1) {
    animation-delay: -0.32s;
  }

  .thinking-dots span:nth-child(2) {
    animation-delay: -0.16s;
  }

  .thinking-dots span:nth-child(3) {
    animation-delay: 0s;
  }

  @keyframes thinkingDot {
    0%, 80%, 100% {
      transform: scale(0.6);
      opacity: 0.4;
    }
    40% {
      transform: scale(1);
      opacity: 1;
    }
  }

  /* ==================================================
     STREAMING THINKING BUBBLE - Real-time content
     ================================================== */

  /* Spinning sync icon for active thinking */
  .message.thinking-message .thinking-spinner {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  /* Smooth collapse transition */
  .message.thinking-message .thinking-content {
    overflow: hidden;
    transition: max-height 0.3s ease, opacity 0.3s ease;
    white-space: pre-wrap;  /* Preserve newlines in thinking content */
  }

  .message.thinking-message.collapsed .thinking-content {
    max-height: 0;
    opacity: 0;
    padding: 0;
    margin: 0;
  }

  .message.thinking-message:not(.collapsed) .thinking-content {
    max-height: none;  /* No limit - show full content */
    opacity: 1;
  }

  /* ==================================================
     THINKING BLOCK SEPARATOR - Gemini-style divider
     Between consecutive thinking messages
     ================================================== */

  /* The separator "• • •" is inserted as plain text between thinking blocks.
     Since markdown renders paragraphs, this naturally creates visual separation.
     The bullets appear centered due to the short content and normal text flow. */
  .message.thinking-message .thinking-content {
    line-height: 1.6;
  }

  .message.thinking-message .thinking-content p {
    margin: 0 0 12px 0;
  }

  .message.thinking-message .thinking-content p:last-child {
    margin-bottom: 0;
  }
</style>