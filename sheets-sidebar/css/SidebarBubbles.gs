<style>
  /* ⚠️ WARNING: This file is an HTML include - DO NOT add CommonJS wrapper!
   * This file is included in Sidebar.gs via include('sheets-sidebar/css/SidebarBubbles')
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
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
  }

  .message.user-message .message-text {
    color: white;
  }

  .message.assistant-message {
    background: white;
    border: 1px solid #e8eaed;
  }

  .message.thinking-indicator {
    background: #f8f9fa;
    border: 1px solid #e8eaed;
    padding: 12px;
  }

  /* Legacy message-bubble styles (kept for compatibility) */
  .message-bubble {
    background: white;
    border-radius: 18px;
    padding: 16px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
    border: 1px solid #e8eaed;
    position: relative;
    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .message-bubble.user {
    background: #d2e3fc;
    border-color: #aecbfa;
  }

  .message-bubble.assistant {
    background: white;
    box-shadow: 0 1px 2px rgba(0,0,0,0.06);
  }

  /* Animated border for actively responding Claude message */
  .message-bubble.assistant.responding {
    border: 2px solid #1a73e8;
    animation: borderPulse 2s ease-in-out infinite;
    will-change: border-color, box-shadow;
  }

  @keyframes borderPulse {
    0%, 100% { 
      border-color: #1a73e8; 
      box-shadow: 0 0 0 2px rgba(26, 115, 232, 0.2), 0 0 12px rgba(26, 115, 232, 0.3);
    }
    50% { 
      border-color: #1765cc; 
      box-shadow: 0 0 0 2px rgba(26, 115, 232, 0.3), 0 0 16px rgba(26, 115, 232, 0.4);
    }
  }

  /* Accessibility: Disable animation for users who prefer reduced motion */
  @media (prefers-reduced-motion: reduce) {
    .message-bubble.assistant.responding {
      animation: none;
      border: 2px solid #4285f4;
      box-shadow: 0 0 4px 1px rgba(66, 133, 244, 0.5);
    }
  }

  /* Message role labels - Micro badge style */
  .message-label {
    font-size: 8px;
    font-weight: 600;
    padding: 3px 8px;
    border-radius: 8px;
    text-transform: uppercase;
    letter-spacing: 0.3px;
    display: inline-block;
    margin-bottom: 8px;
    transition: all 0.2s ease;
  }

  /* User message label - Blue badge */
  .message-bubble.user .message-label {
    background: #d2e3fc;
    color: #1967d2;
    border: 1px solid #aecbfa;
  }

  /* AI message label - Gray badge */
  .message-bubble.assistant .message-label {
    background: #f1f3f4;
    color: #5f6368;
    border: 1px solid #e8eaed;
  }

  .message-bubble-content {
    color: #1f1f1f;
    line-height: 1.5;
    white-space: pre-wrap;
  }

  /* Run Again Button */
  .message-bubble-run-again-btn {
    position: absolute;
    top: 4px;
    right: 4px;
    background: rgba(66, 133, 244, 0.1);
    border: none;
    border-radius: 4px;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    font-size: 11px;
    color: #4285f4;
    transition: all 0.2s;
    opacity: 0.6;
  }

  .message-run-again-btn:hover {
    opacity: 1;
    background: rgba(66, 133, 244, 0.2);
    transform: scale(1.1);
  }

  .message-bubble-run-again-btn:active {
    transform: scale(0.95);
  }

  /* Click animation */
  .message-run-again-btn.clicked {
    animation: btnClick 0.3s ease;
  }

  @keyframes btnClick {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.2) rotate(180deg); }
  }

  .message-bubble-images {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 8px;
  }

  .message-bubble-image-thumb {
    width: 80px;
    height: 80px;
    object-fit: cover;
    border-radius: 6px;
    border: 1px solid #e8eaed;
    cursor: pointer;
  }

  /* ==================================================
     ERROR BUBBLES - Collapsible Error Display
     ================================================== */
  
  .error-bubble {
    margin-bottom: 8px;
    transition: all 0.3s ease;
  }

  .error-bubble-header {
    background: #fee;
    border: 1px solid #fcc;
    border-radius: 8px;
    font-weight: 600;
    color: #c00;
    display: flex;
    align-items: center;
    justify-content: space-between;
    cursor: pointer;
    user-select: none;
    min-height: 20px;
    padding: 4px 10px;
    font-size: 10px;
    transition: all 0.3s ease;
  }

  .error-title {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .error-chevron {
    font-size: 14px;
    transition: transform 0.3s ease;
    display: inline-block;
  }

  .error-bubble-content {
    background: #fee;
    border: 1px solid #fcc;
    border-top: none;
    border-radius: 0 0 8px 8px;
    padding: 4px 12px;
    margin-top: -1px;
    font-size: 13px;
    color: #800;
    line-height: 1.6;
    max-height: 300px;
    overflow-y: auto;
    white-space: pre-wrap;
    display: none;
  }

  .error-bubble.collapsed .error-bubble-content {
    display: none;
  }

  .error-bubble.collapsed .error-chevron {
    transform: rotate(0deg);
  }

  .error-bubble.collapsed .error-bubble-header {
    border-radius: 8px;
  }

  .error-bubble.expanded .error-bubble-content {
    display: block;
  }

  .error-bubble.expanded .error-chevron {
    transform: rotate(90deg);
  }

  .error-bubble.expanded .error-bubble-header {
    border-radius: 8px 8px 0 0;
  }

  /* ==================================================
     THINKING BUBBLES - Google Gemini Style
     Expand/collapse Claude thinking with white/light backgrounds
     ================================================== */

  /* Main bubble container - Gemini pill style */
  .all-thoughts-bubble {
    background: #f8f9fa;  /* Very light gray (Gemini) */
    border: 1px solid #dadce0;  /* Light border */
    border-radius: 18px;  /* More rounded for pill shape */
    margin-bottom: 12px;
    overflow: hidden;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 1px 3px rgba(60, 64, 67, 0.15);
    min-height: 48px;  /* Ensure bubble is always visible */
  }
  
  /* Collapsed state - compact pill */
  .all-thoughts-bubble:not(.expanded) {
    border-radius: 22px;  /* Extra rounded in collapsed state */
    box-shadow: 0 1px 2px rgba(60, 64, 67, 0.12);
  }
  
  /* Hover effect on collapsed pill */
  .all-thoughts-bubble:not(.expanded):hover {
    box-shadow: 0 2px 4px rgba(60, 64, 67, 0.2);
    transform: translateY(-1px);
  }

  /* Header section - clickable collapse/expand */
  .all-thoughts-header {
    background: transparent;  /* Transparent for clean pill look */
    padding: 10px 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    cursor: pointer;
    user-select: none;
    transition: all 0.2s ease;
    min-height: 44px;
  }

  .all-thoughts-header:hover {
    background: rgba(138, 180, 248, 0.08);  /* Subtle blue tint on hover */
  }

  .all-thoughts-header:active {
    background: rgba(138, 180, 248, 0.12);
  }
  
  /* Expanded state header */
  .all-thoughts-bubble.expanded .all-thoughts-header {
    border-bottom: 1px solid #e8eaed;
    background: #ffffff;
  }

  /* Title with icon */
  .all-thoughts-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 500;
    font-size: 13px;
    color: #5f6368;
    line-height: 1.4;
    flex: 1;
  }

  .all-thoughts-title .material-icons {
    font-size: 18px;
    color: #8ab4f8;  /* Light blue (Gemini) */
    flex-shrink: 0;
  }
  
  /* Pulsing animation only while thinking (stop after expanded) */
  .all-thoughts-bubble:not(.expanded) .all-thoughts-title .material-icons {
    animation: thinkingPulse 2s ease-in-out infinite;
  }
  
  /* Stop animation when expanded (thinking complete) */
  .all-thoughts-bubble.expanded .all-thoughts-title .material-icons {
    animation: none;
    opacity: 1;
  }

  /* Pulsing animation for thinking icon */
  @keyframes thinkingPulse {
    0%, 100% {
      opacity: 1;
      transform: scale(1);
    }
    50% {
      opacity: 0.6;
      transform: scale(1.1);
    }
  }

  /* Disable animation for users who prefer reduced motion */
  @media (prefers-reduced-motion: reduce) {
    .all-thoughts-title .material-icons {
      animation: none;
    }
  }

  /* Chevron icon (expand indicator) */
  .all-thoughts-chevron {
    font-size: 20px;
    color: #5f6368;
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    transform: rotate(0deg);
    flex-shrink: 0;
  }

  /* Content area - collapsible */
  .all-thoughts-content {
    background: #ffffff;  /* White background for content */
    padding: 0 16px;  /* Always maintain horizontal padding */
    max-height: 0;
    overflow: hidden;
    transition: max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1), padding 0.3s ease;
    font-size: 13px;
    line-height: 1.6;
    color: #202124;
    width: 100%;  /* Ensure full width */
    box-sizing: border-box;  /* Include padding in width calculation */
  }

  /* Individual thinking messages */
  .thinking-message {
    padding: 12px 0;  /* Increased vertical padding for better spacing */
    color: #5f6368;
    line-height: 1.6;
    border-bottom: 1px solid #f1f3f4;
    width: 100%;  /* Fill parent width */
    box-sizing: border-box;
  }

  .thinking-message:last-child {
    border-bottom: none;
  }

  /* Markdown content in thinking messages */
  .thinking-message p {
    margin: 8px 0;
  }

  .thinking-message p:first-child {
    margin-top: 0;
  }

  .thinking-message p:last-child {
    margin-bottom: 0;
  }

  .thinking-message code {
    background: #f1f3f4;
    padding: 2px 6px;
    border-radius: 4px;
    font-family: 'Roboto Mono', monospace;
    font-size: 12px;
  }

  .thinking-message pre {
    background: #f8f9fa;
    padding: 12px;
    border-radius: 6px;
    overflow-x: auto;
    margin: 8px 0;
  }

  .thinking-message pre code {
    background: none;
    padding: 0;
  }

  /* Expanded state */
  .all-thoughts-bubble.expanded .all-thoughts-content {
    max-height: 600px;  /* Increased from 500px for more breathing room */
    padding: 16px;  /* Consistent padding all around */
    overflow-y: auto;
  }

  .all-thoughts-bubble.expanded .all-thoughts-chevron {
    transform: rotate(180deg);  /* Flip chevron */
  }

  /* Scrollbar styling for thinking content */
  .all-thoughts-content::-webkit-scrollbar {
    width: 8px;
  }

  .all-thoughts-content::-webkit-scrollbar-track {
    background: #f1f3f4;
    border-radius: 4px;
  }

  .all-thoughts-content::-webkit-scrollbar-thumb {
    background: #dadce0;
    border-radius: 4px;
    transition: background 0.2s;
  }

  .all-thoughts-content::-webkit-scrollbar-thumb:hover {
    background: #bdc1c6;
  }

  /* Keyboard focus indicator */
  .all-thoughts-header:focus {
    outline: 2px solid #1a73e8;
    outline-offset: 2px;
  }

  @media (prefers-color-scheme: dark) {
    .all-thoughts-header:focus {
      outline-color: #8ab4f8;
    }
  }

  /* Force light mode for Gemini consistency - dark mode disabled */
  /* Users can enable dark mode in future via settings toggle */
</style>