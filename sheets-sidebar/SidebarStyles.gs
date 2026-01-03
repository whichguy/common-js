  <style>
    /* ⚠️ WARNING: This file is an HTML include - DO NOT add CommonJS wrapper!
     * This file is included in Sidebar.gs via include('sheets-sidebar/SidebarStyles')
     * Always use raw_write with fileType: "HTML" when editing this file.
     */
    /* Cache refresh: 2025-10-24 16:45 - Add height:auto to fix expansion */
    @import url('https://fonts.googleapis.com/css2?family=Google+Sans:wght@400;500;600&display=swap');

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Google Sans', 'Product Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
      background: #f8f9fa;
      color: #202124;
      letter-spacing: 0.01em;
      height: 100vh;
      display: flex;
      flex-direction: column;
    }

    /* Utility class for hiding elements */
    .hidden {
      display: none !important;
    }

    .header {
      background: #1a73e8;
      color: white;
      padding: 12px 16px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
    }

    .header h1 {
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 8px;
    }

    .tabs {
      display: flex;
      gap: 0;
      margin-bottom: 0;
      border-bottom: 2px solid rgba(255, 255, 255, 0.3);
      position: relative;
    }

    .tab {
      background: transparent;
      border: none;
      color: rgba(255, 255, 255, 0.8);
      padding: 8px 16px;
      border-radius: 0;
      cursor: pointer;
      font-size: 11px;
      font-weight: 500;
      transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      position: relative;
      border-bottom: none;
    }

    .tab:hover {
      background: rgba(255, 255, 255, 0.15);
      color: white;
      transform: translateY(-1px);
    }

    .tab.active {
      background: rgba(255, 255, 255, 0.2);
      color: white;
      font-weight: 600;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    .header-actions {
      display: flex;
      gap: 6px;
      margin-top: 4px;
      align-items: center;
    }

    .conversation-dropdown {
      background: rgba(255, 255, 255, 0.95);
      border: 1px solid rgba(255, 255, 255, 0.3);
      border-radius: 4px;
      padding: 4px 8px;
      font-size: 9px;
      color: #1f1f1f;
      cursor: pointer;
      max-width: 200px;
      flex: 1;
      font-family: inherit;
    }

    .conversation-dropdown:focus {
      outline: none;
      border-color: rgba(255, 255, 255, 0.6);
      box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.2);
    }

    .conversation-dropdown.loading {
      opacity: 0.6;
      cursor: wait;
    }

    .icon-btn {
      background: rgba(255, 255, 255, 0.2);
      border: 1px solid rgba(255, 255, 255, 0.3);
      border-radius: 4px;
      padding: 4px 6px;
      font-size: 10px;
      cursor: pointer;
      transition: all 0.2s;
      color: white;
      min-width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .icon-btn:hover {
      background: rgba(255, 255, 255, 0.3);
      transform: translateY(-1px);
    }

    .icon-btn:active {
      transform: translateY(0);
    }

    .icon-btn .material-icons {
      font-size: 16px;
      font-variation-settings:
        'FILL' 0,
        'wght' 400,
        'GRAD' 0,
        'opsz' 20;
    }

    button {
      background: white;
      border: 1px solid #dadce0;
      border-radius: 10px;
      padding: 10px 18px;
      font-size: 12px;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      font-weight: 500;
      box-shadow: 0 1px 2px rgba(0,0,0,0.05);
    }

    button:hover {
      background: #f1f3f4;
      box-shadow: 0 2px 4px rgba(0,0,0,0.08);
      transform: translateY(-1px) scale(1.02);
    }

    button:active {
      transform: translateY(0) scale(0.98);
    }

    button.primary {
      background: #1a73e8;
      color: white;
      border: none;
    }

    button.primary:hover {
      background: #1765cc;
      box-shadow: 0 4px 8px rgba(26, 115, 232, 0.25);
    }

    button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .tab-content {
      display: none;
      flex: 1;
      flex-direction: column;
      overflow: hidden;
    }

    .tab-content.active {
      display: flex;
    }

    .chat-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  flex: 1 1 auto;
  overflow-y: auto;
      flex: 1;
      overflow-y: auto;
  resize: vertical;
      padding: 10px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .config-container {
      flex: 1;
      overflow-y: auto;
      padding: 8px;
    }

    .config-section {
      background: white;
      border-radius: 16px;
      padding: 16px;
      margin-bottom: 16px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
      border: 1px solid #e8eaed;
    }

    .config-section h3 {
      font-size: 12px;
      font-weight: 600;
      color: #5f6368;
      margin-bottom: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .form-group {
      margin-bottom: 16px;
    }

    .form-group:last-child {
      margin-bottom: 0;
    }

    label {
      display: block;
      font-size: 12px;
      font-weight: 500;
      color: #1f1f1f;
      margin-bottom: 8px;
    }

    input[type="text"],
    input[type="password"],
    select {
      width: 100%;
      border: 1px solid #dadce0;
      border-radius: 8px;
      padding: 10px 12px;
      font-family: inherit;
      font-size: 12px;
      background: white;
    }

    input[type="text"]:focus,
    input[type="password"]:focus,
    select:focus {
      outline: none;
      border-color: #4285f4;
      box-shadow: 0 0 0 2px rgba(66, 133, 244, 0.1);
    }

    .help-text {
      font-size: 10px;
      color: #5f6368;
      margin-top: 4px;
    }

    .message-bubble {
      background: white;
      border-radius: 18px;
      padding: 10px 12px 10px 14px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
      border: 1px solid #e8eaed;
      position: relative;
      transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    .message-bubble.user {
      background: #d2e3fc;
      border: 1px solid #aecbfa;
      border-left: 4px solid #1a73e8;
    }

    .message-bubble.assistant {
      background: white;
      border: 1px solid #e8eaed;
      border-left: 4px solid #6442d6;
      box-shadow: 0 1px 2px rgba(0,0,0,0.06);
    }

    .message-bubble.error {
      background: #fce8e6;
      border: 1px solid #f5c6cb;
      border-left: 4px solid #d93025;
      box-shadow: 0 1px 2px rgba(217,48,37,0.06);
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



    /* Message text content */
    .message-text {
      font-size: 11px;
      line-height: 1.5;
      white-space: pre-wrap;
    }







    /* ========== AI THINKING BUBBLES ========== */
    /* Two-bubble system: "Last Thinking" (pulsing, disappears) + "All Thoughts" (collapsible history) */
    
    /* Last Thinking bubble - shows most recent thought with pulsing animation */
    .last-thinking-bubble {
      background: #fff9e6;
      border: 1px solid #ffd966;
      border-radius: 12px;
      padding: 10px 12px;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 10px;
      animation: thinkingPulse 1.5s ease-in-out infinite;
      box-shadow: 0 2px 6px rgba(255, 193, 7, 0.15);
      transition: all 0.3s ease;
    }
    
    .last-thinking-icon {
      color: #f9a825;
      font-size: 18px;
      flex-shrink: 0;
    }
    
    .last-thinking-text {
      flex: 1;
      font-size: 12px;
      color: #5f4d00;
      line-height: 1.5;
      white-space: pre-wrap;
      overflow-wrap: break-word;
    }
    
    @keyframes thinkingPulse {
      0%, 100% {
        opacity: 1;
        box-shadow: 0 2px 6px rgba(255, 193, 7, 0.15);
      }
      50% {
        opacity: 0.7;
        box-shadow: 0 2px 12px rgba(255, 193, 7, 0.3);
      }
    }
    
    /* All Thoughts bubble - Gemini lavender with Material Design 3 elevation */
    .all-thoughts-bubble {
      background: #eee8f5;  /* Darker lavender for better visibility */
      border: none;  /* Remove border, use elevation instead */
      border-left: 4px solid #6442d6;  /* Gemini primary accent */
      border-radius: 12px;
      margin-bottom: 10px;
      overflow: hidden;
      transition: all 0.3s ease;
      min-height: 40px;
      /* Material Design 3 Elevation Level 1 */
      box-shadow: 0px 1px 2px 0px rgba(0, 0, 0, 0.3), 
                  0px 1px 3px 1px rgba(0, 0, 0, 0.15);
      /* Subtle fade-in animation on creation */
      animation: bubbleFadeIn 0.2s ease-out;
    }
    
    @keyframes bubbleFadeIn {
      from {
        opacity: 0;
        transform: translateY(-4px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    /* Empty state - subtle appearance */
    .all-thoughts-bubble.empty-state {
      opacity: 0.6;
    }
    
    .all-thoughts-bubble.empty-state .all-thoughts-header {
      cursor: default;
      pointer-events: none;
    }
    
    /* Hide completely empty bubbles after response */
    .all-thoughts-bubble.hidden-empty {
      display: none;
    }
    
    /* Header - Gemini neutral colors */
    .all-thoughts-header {
      padding: 10px 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      cursor: pointer;
      user-select: none;
      font-weight: 500;  /* Lighter weight */
      color: #44464e;  /* Neutral dark gray */
      font-size: 12px;  /* Increased from 11px */
      transition: background 0.2s ease;
    }
    
    /* Material Design 3 hover overlay */
    .all-thoughts-header:hover {
      background: rgba(31, 25, 35, 0.08);
    }
    
    .all-thoughts-title {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    /* Icon styling - Gemini primary color */
    .all-thoughts-title .material-icons {
      color: #6442d6;
      font-size: 18px;
    }
    
    .all-thoughts-chevron {
      font-size: 14px;
      transition: transform 0.3s ease;
      display: inline-block;
      color: #44464e;
    }
    
    /* Content area - subtle background */
    .all-thoughts-content {
      display: block;  /* Always block, control visibility with max-height */
      max-height: 0;   /* Collapsed state */
      opacity: 0;
      overflow: hidden;
      padding: 0 16px;  /* Collapse padding in hidden state */
      font-size: 13px;  /* Increased from 11px */
      color: #44464e;  /* Neutral gray */
      line-height: 1.6;
      white-space: pre-wrap;
      word-wrap: break-word;
      overflow-wrap: break-word;
      background: rgba(248, 241, 246, 0.5);  /* Subtle content background */
      border-top: 1px solid rgba(120, 117, 121, 0.2);  /* Subtle separator */
      /* Smooth transitions for expand/collapse */
      transition: max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1),
                  opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1),
                  padding 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    /* Empty placeholder styling */
    .empty-placeholder {
      font-style: italic;
      color: rgba(68, 70, 78, 0.5);
      font-size: 12px;
    }
    
    /* Expanded state */
    .all-thoughts-bubble.expanded .all-thoughts-content {
      display: block;
      max-height: 600px;  /* Expanded height with scrolling */
      opacity: 1;         /* Fully visible */
      padding: 10px 16px; /* Restore padding when expanded */
      overflow-y: auto;
      word-wrap: break-word;
      overflow-wrap: break-word;
    }
    
    .all-thoughts-bubble.expanded .all-thoughts-chevron {
      transform: rotate(90deg);
    }
    
    /* Scrollbar - Gemini purple theme */
    .all-thoughts-content::-webkit-scrollbar {
      width: 8px;
    }
    
    .all-thoughts-content::-webkit-scrollbar-track {
      background: rgba(220, 218, 245, 0.3);
      border-radius: 4px;
    }
    
    .all-thoughts-content::-webkit-scrollbar-thumb {
      background: #9f86ff;  /* Gemini primary container */
      border-radius: 4px;
    }
    
    .all-thoughts-content::-webkit-scrollbar-thumb:hover {
      background: #6442d6;  /* Gemini primary */
    }
    
    //* ========== MARKDOWN CONTENT STYLING ==========
/* Applies to both message-text and all-thoughts-content */

/* Reset margins on first/last children to prevent extra leading/trailing space */
.message-text > *:first-child,
.all-thoughts-content > *:first-child,
.thinking-message > *:first-child {
  margin-top: 0;
}

.message-text > *:last-child,
.all-thoughts-content > *:last-child,
.thinking-message > *:last-child {
  margin-bottom: 0;
}

/* Thinking message blocks within thoughts */in thoughts */
    .thinking-message {
      margin-bottom: 8px;
      padding-bottom: 8px;
      border-bottom: 1px solid rgba(120, 117, 121, 0.15);
    }
    
    .thinking-message:last-child {
      border-bottom: none;
      margin-bottom: 0;
      padding-bottom: 0;
    }
    
    /* Code - inline */
    .message-text code,
    .all-thoughts-content code,
    .thinking-message code {
      background: rgba(0, 0, 0, 0.05);
      padding: 2px 6px;
      border-radius: 3px;
      font-family: 'Monaco', 'Menlo', 'Consolas', 'Courier New', monospace;
      font-size: 0.9em;
      color: #d63384;
      border: 1px solid rgba(0, 0, 0, 0.08);
    }
    
    /* Code - blocks */
    .message-text pre,
    .all-thoughts-content pre,
    .thinking-message pre {
      background: rgba(0, 0, 0, 0.05);
      padding: 12px;
      border-radius: 6px;
      overflow-x: auto;
      margin: 6px 0;
      border-left: 3px solid #6442d6;
    }
    
    .message-text pre code,
    .all-thoughts-content pre code,
    .thinking-message pre code {
      background: transparent;
      padding: 0;
      border: none;
      color: #202124;
      font-size: 0.85em;
      line-height: 1.5;
    }
    
    /* Lists */
    .message-text ul,
    .message-text ol,
    .all-thoughts-content ul,
    .all-thoughts-content ol,
    .thinking-message ul,
    .thinking-message ol {
      margin: 6px 0;
      padding-left: 24px;
    }
    
    .message-text li,
    .all-thoughts-content li,
    .thinking-message li {
      margin: 0;
      line-height: 1.6;
    }
    
    .message-text ul li,
    .all-thoughts-content ul li,
    .thinking-message ul li {
      list-style-type: disc;
    }
    
    .message-text ol li,
    .all-thoughts-content ol li,
    .thinking-message ol li {
      list-style-type: decimal;
    }
    
    /* Nested lists */
    .message-text ul ul,
    .message-text ol ul,
    .all-thoughts-content ul ul,
    .all-thoughts-content ol ul,
    .thinking-message ul ul,
    .thinking-message ol ul {
      list-style-type: circle;
    }
    
    /* Headers */
    .message-text h1,
    .message-text h2,
    .message-text h3,
    .message-text h4,
    .message-text h5,
    .message-text h6,
    .all-thoughts-content h1,
    .all-thoughts-content h2,
    .all-thoughts-content h3,
    .all-thoughts-content h4,
    .all-thoughts-content h5,
    .all-thoughts-content h6,
    .thinking-message h1,
    .thinking-message h2,
    .thinking-message h3,
    .thinking-message h4,
    .thinking-message h5,
    .thinking-message h6 {
      font-weight: 600;
      margin: 12px 0 8px 0;
      color: #202124;
    }
    
    /* Size h1 and h2 appropriately for chat context */
    .message-text h1,
    .all-thoughts-content h1,
    .thinking-message h1 {
      font-size: 1.5em;
      border-bottom: 2px solid rgba(0, 0, 0, 0.15);
      padding-bottom: 6px;
      margin: 12px 0;
    }
    
    .message-text h2,
    .all-thoughts-content h2,
    .thinking-message h2 {
      font-size: 1.3em;
      border-bottom: 1px solid rgba(0, 0, 0, 0.12);
      padding-bottom: 4px;
      margin: 10px 0;
    }
    
    .message-text h3,
    .all-thoughts-content h3,
    .thinking-message h3 {
      font-size: 1.1em;
      border-bottom: 1px solid rgba(0, 0, 0, 0.1);
      padding-bottom: 4px;
      margin: 8px 0;
    }
    
    .message-text h4,
    .all-thoughts-content h4,
    .thinking-message h4 {
      font-size: 1.05em;
    }
    
    .message-text h5,
    .message-text h6,
    .all-thoughts-content h5,
    .all-thoughts-content h6,
    .thinking-message h5,
    .thinking-message h6 {
      font-size: 1em;
    }
    
    /* Blockquotes */
    .message-text blockquote,
    .all-thoughts-content blockquote,
    .thinking-message blockquote {
      border-left: 3px solid #6442d6;
      padding-left: 12px;
      margin: 8px 0;
      color: #5f6368;
      font-style: italic;
      background: rgba(100, 66, 214, 0.05);
      padding: 8px 12px;
      border-radius: 0 4px 4px 0;
    }
    
    /* Links */
    .message-text a,
    .all-thoughts-content a,
    .thinking-message a {
      color: #1a73e8;
      text-decoration: none;
      border-bottom: 1px solid rgba(26, 115, 232, 0.3);
      transition: all 0.2s ease;
    }
    
    .message-text a:hover,
    .all-thoughts-content a:hover,
    .thinking-message a:hover {
      color: #1765cc;
      border-bottom-color: #1765cc;
    }
    
    /* External links - visual indicator for security */
    .message-text a.external-link::after,
    .all-thoughts-content a.external-link::after,
    .thinking-message a.external-link::after {
      content: '\2197';  /* Unicode: ↗ (up-right arrow) */
      margin-left: 3px;
      font-size: 0.85em;
      opacity: 0.6;
      vertical-align: super;
      font-weight: normal;
    }
    
    .message-text a.external-link:hover::after,
    .all-thoughts-content a.external-link:hover::after,
    .thinking-message a.external-link:hover::after {
      opacity: 1;
    }
    
    /* Bold and italic */
    .message-text strong,
    .message-text b,
    .all-thoughts-content strong,
    .all-thoughts-content b,
    .thinking-message strong,
    .thinking-message b {
      font-weight: 600;
      color: #202124;
    }
    
    .message-text em,
    .message-text i,
    .all-thoughts-content em,
    .all-thoughts-content i,
    .thinking-message em,
    .thinking-message i {
      font-style: italic;
    }
    
    /* Horizontal rules */
    .message-text hr,
    .all-thoughts-content hr,
    .thinking-message hr {
      border: none;
      border-top: 1px solid rgba(0, 0, 0, 0.1);
      margin: 16px 0;
    }
    
    /* Paragraphs */
    .message-text p,
    .all-thoughts-content p,
    .thinking-message p {
      margin: 6px 0;
      line-height: 1.6;
    }
    
    .message-text p:first-child,
    .all-thoughts-content p:first-child,
    .thinking-message p:first-child {
      margin-top: 0;
    }
    
    .message-text p:last-child,
    .all-thoughts-content p:last-child,
    .thinking-message p:last-child {
      margin-bottom: 0;
    }
    
    /* Images - responsive and chat-friendly */
    .message-text img,
    .all-thoughts-content img,
    .thinking-message img {
      max-width: 100%;
      height: auto;
      border-radius: 8px;
      margin: 12px 0;
      display: block;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      border: 1px solid rgba(0, 0, 0, 0.08);
    }
    
    /* Small images (thumbnails) don't need full width */
    .message-text img[width],
    .all-thoughts-content img[width],
    .thinking-message img[width] {
      max-width: min(100%, attr(width px));
    }
    
    /* Error bubble styles - Created dynamically by JS */
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
      padding: 3px 8px;
      font-size: 8px;
      transition: all 0.3s ease;
    }

    .error-title {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .error-chevron {
      font-size: 12px;
      transition: transform 0.3s ease;
      display: inline-block;
    }

    .error-bubble-content {
      background: #fee;
      border: 1px solid #fcc;
      border-top: none;
      border-radius: 0 0 8px 8px;
      padding: 3px 10px;
      margin-top: -1px;
      font-size: 11px;
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

    /* ============================================
       MESSAGE QUEUE - Google Gemini Style
       ============================================ */
    
    /* Queue container */
    .pending-queue-container {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 12px 0;
      margin-bottom: 8px;
      max-height: 200px;
      overflow-y: auto;
      overflow-x: hidden;
    }

    .pending-queue-container:empty {
      display: none;
      padding: 0;
      margin: 0;
    }

    /* Individual chip - Bubble style */
    .pending-message-chip {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 14px;
      background: linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%);
      border: 1px solid #e3e5e8;
      border-radius: 12px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.06), 
                  0 4px 8px rgba(0, 0, 0, 0.04),
                  inset 0 1px 0 rgba(255, 255, 255, 0.5);
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      cursor: default;
      opacity: 1;
      transform: translateX(0) scale(1);
    }

    /* Hover effect - bubble lift */
    .pending-message-chip:hover {
      background: linear-gradient(145deg, #ffffff 0%, #fafbfc 100%);
      border-color: #d0d3d8;
      box-shadow: 0 3px 6px rgba(0, 0, 0, 0.08), 
                  0 6px 12px rgba(0, 0, 0, 0.06),
                  inset 0 1px 0 rgba(255, 255, 255, 0.7);
      transform: translateX(-2px) translateY(-2px) scale(1.01);
    }

    /* Position badge - Bubble style */
    .pending-message-position {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 24px;
      height: 24px;
      padding: 0 6px;
      background: linear-gradient(145deg, #4a90e2 0%, #1a73e8 100%);
      color: white;
      border-radius: 8px;
      font-size: 9px;
      font-weight: 600;
      flex-shrink: 0;
      box-shadow: 0 2px 4px rgba(26, 115, 232, 0.25),
                  inset 0 1px 0 rgba(255, 255, 255, 0.3);
    }

    /* Message preview text */
    .pending-message-preview {
      flex: 1;
      font-size: 12px;
      line-height: 1.4;
      color: #3c4043;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-weight: 400;
      letter-spacing: 0.01em;
    }

    /* Remove button - Micro dot that becomes X on hover */
    .pending-message-remove {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 14px;
      height: 14px;
      padding: 0;
      background: transparent;
      border: none;
      border-radius: 50%;
      color: transparent; /* Hide X by default */
      font-size: 8px;
      font-weight: 400;
      line-height: 1;
      cursor: pointer;
      flex-shrink: 0;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      opacity: 1;
      position: relative;
    }

    /* Micro dot indicator (before X appears) */
    .pending-message-remove::before {
      content: '';
      position: absolute;
      width: 4px;
      height: 4px;
      background: #5f6368;
      border-radius: 50%;
      opacity: 0.3;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .pending-message-remove:hover {
      background: rgba(217, 48, 37, 0.08);
      color: #d93025; /* Show X on hover */
      transform: scale(1.2);
    }

    /* Hide dot on hover, show X */
    .pending-message-remove:hover::before {
      opacity: 0;
      transform: scale(0);
    }

    .pending-message-remove:active {
      background: rgba(217, 48, 37, 0.15);
      transform: scale(0.9);
    }

    /* Entry animation - slide in from right with fade */
    .pending-message-chip.entering {
      animation: queueChipEnter 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
    }

    @keyframes queueChipEnter {
      from {
        opacity: 0;
        transform: translateX(20px) scale(0.95);
      }
      to {
        opacity: 1;
        transform: translateX(0) scale(1);
      }
    }

    /* Exit animation - slide out to right with fade */
    .pending-message-chip.exiting {
      animation: queueChipExit 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
    }

    @keyframes queueChipExit {
      from {
        opacity: 1;
        transform: translateX(0) scale(1);
        max-height: 48px;
        margin-bottom: 8px;
      }
      to {
        opacity: 0;
        transform: translateX(20px) scale(0.95);
        max-height: 0;
        margin-bottom: 0;
        padding-top: 0;
        padding-bottom: 0;
      }
    }

    /* Scrollbar styling for queue container */
    .pending-queue-container::-webkit-scrollbar {
      width: 6px;
    }

    .pending-queue-container::-webkit-scrollbar-track {
      background: transparent;
    }

    .pending-queue-container::-webkit-scrollbar-thumb {
      background: #dadce0;
      border-radius: 3px;
    }

    .pending-queue-container::-webkit-scrollbar-thumb:hover {
      background: #bdc1c6;
    }

    /* Old .gemini-input-box removed - replaced by .v2-input-box */

    /* Attachment chips inside the box */
    .attachment-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      padding: 8px 0;
      min-height: 0;
    }

    .attachment-chips:empty {
      display: none;
      padding: 0;
    }

    /* Updated attachment chip styles with better layout */
    .attachment-chip {
      position: relative;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 8px;
      background: #f8f9fa;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      transition: all 0.2s ease;
    }
    
    .attachment-chip:hover {
      background: #f1f3f4;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }

    /* Image thumbnail */
    .attachment-chip .attachment-thumbnail {
      width: 40px;
      height: 40px;
      border-radius: 4px;
      object-fit: cover;
      flex-shrink: 0;
    }
    
    /* PDF icon */
    .attachment-chip .attachment-icon {
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #fce8e6;
      border-radius: 4px;
      color: #d93025;
      font-size: 24px;
      flex-shrink: 0;
    }
    
    /* File info container */
    .attachment-chip .attachment-info {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    
    .attachment-chip .attachment-name {
      font-size: 10px;
      font-weight: 500;
      color: #202124;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    
    .attachment-chip .attachment-size {
      font-size: 9px;
      color: #5f6368;
    }

    /* Remove button */
    .attachment-chip .attachment-remove {
      background: transparent;
      border: none;
      border-radius: 50%;
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: #5f6368;
      transition: all 0.2s ease;
      padding: 0;
      flex-shrink: 0;
    }

    .attachment-chip .attachment-remove:hover {
      background: rgba(217, 48, 37, 0.1);
      color: #d93025;
    }
    
    .attachment-chip .attachment-remove .material-icons {
      font-size: 16px;
    }

    /* Loading state for attachment chips */
    .attachment-chip.loading {
      opacity: 0.6;
      pointer-events: none;
    }
    
    .attachment-chip.loading .material-icons.spinning {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }







    /* Old attachment preview styles removed - using .attachment-chips instead */

    .resize-handle {
      height: 3px;
      background: rgba(0,0,0,0.1);
      cursor: ns-resize;
      transition: all 0.2s;
      flex-shrink: 0;
    }

    .resize-handle:hover {
      height: 4px;
      background: rgba(0,0,0,0.3);
    }

    .resize-handle.dragging {
      background: #1a73e8;
      height: 4px;
    }

    .input-container {
      padding: 12px 16px 16px 16px;
      background: #f8f9fa;
      border-top: 1px solid #e8eaed;
      display: flex;
      flex-direction: column;
      gap: 10px;
      flex-shrink: 0;
    }

    /* Old .gemini-input-box textarea removed - replaced by .v2-input-box textarea */

    /* Old button row/status classes removed - replaced by v2-* classes */





    .status {
      font-size: 12px;
      color: #5f6368;
      transition: opacity 0.3s ease;
    }

    .status.updating {
      opacity: 0.6;
    }

    .status.sending {
      color: #4285f4;
      font-weight: 500;
    }

    .status.error {
      color: #d93025;
    }

    .status.success {
      color: #1e8e3e;
    }

    .spinner {
      display: inline-block;
      width: 12px;
      height: 12px;
      border: 2px solid #e8eaed;
      border-top-color: #4285f4;
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
      margin-right: 6px;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* ========== V2 LAYOUT CLASSES ========== */
    /* Fresh redesign with improved horizontal layout */
    
    .v2-input-wrapper {
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    
    .v2-input-box {
      width: 100%;
      background: white;
      border: 1px solid #e0e0e0;
      border-radius: 28px;
      padding: 8px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
      transition: all 0.2s ease;
      display: flex;
      flex-direction: column;
      gap: 0;
    }

    .v2-input-box:focus-within {
      border-color: #4285f4;
      border-width: 2px;
      box-shadow: 0 0 0 3px rgba(66, 133, 244, 0.1), 0 3px 8px rgba(66,133,244,0.15), 0 2px 4px rgba(66,133,244,0.1);
      padding: 11px; /* Adjust padding to compensate for thicker border */
    }
    
    .v2-input-box textarea {
      width: 100%;
      border: none;
      background: transparent;
      padding: 8px; /* Clean padding, no left offset needed */
      font-family: inherit;
      font-size: 11px;
      line-height: 24px;
      resize: none;
      min-height: 44px;
      max-height: 300px;
      overflow-y: hidden;
      outline: none;
      transition: height 0.1s ease;
    }

    .v2-input-box textarea::placeholder {
      color: #9aa0a6;
    }
    
    .v2-button-row {
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      gap: 16px;
      min-height: 44px;
      padding: 0 4px;
    }
    
    .v2-status-group {
      display: flex;
      flex-direction: row;
      align-items: center;
      gap: 12px;
      font-size: 9px;
      color: #5f6368;
      line-height: 1;
      flex: 1;
    }
    
    .v2-status-group .status-time,
    .v2-status-group .status-tokens {
      color: #5f6368;
    }
    
    .v2-status-group .status-spinner {
      display: inline-block;
      width: 14px;
      height: 14px;
      border: 2px solid #e8eaed;
      border-top-color: #1a73e8;
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
      opacity: 0.4;  /* Gentle, subtle spinner */
    }
    
    .v2-status-group .status-spinner.hidden {
      display: none;
    }
    
    .v2-submit-btn {
      background: #1a73e8;
      color: white;
      border: none;
      border-radius: 18px;
      padding: 6px 12px;
      font-size: 10px;
      font-weight: 500;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: all 0.2s ease;
      box-shadow: 0 1px 3px rgba(26, 115, 232, 0.3);
      flex-shrink: 0;
    }

    .v2-submit-btn:hover:not(:disabled) {
      background: #1765cc;
      box-shadow: 0 2px 6px rgba(26, 115, 232, 0.4);
      transform: translateY(-1px);
    }

    .v2-submit-btn:active:not(:disabled) {
      transform: translateY(0);
    }

    .v2-submit-btn:disabled {
      background: #dadce0;
      color: #9aa0a6;
      cursor: not-allowed;
      box-shadow: none;
    }

    .v2-submit-btn .material-icons {
      font-size: 14px;
    }

    /* ============================================
       ATTACH BUTTON - Top-Right Corner Micro Icon
       ============================================ */
    /* Attach button inside input box (top-right corner) */
    .v2-input-box {
      position: relative; /* For absolute positioning */
    }

    .v2-input-box .attach-btn {
      position: absolute;
      top: 8px;
      right: 8px;
      background: transparent;
      border: none;
      border-radius: 50%;
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: #5f6368;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      padding: 0;
      flex-shrink: 0;
      opacity: 0.35;
      z-index: 2;
    }

    .v2-input-box .attach-btn:hover {
      background: rgba(95, 99, 104, 0.08);
      color: #202124;
      opacity: 1;
      transform: scale(1.2);
    }

    .v2-input-box .attach-btn:active {
      background: rgba(95, 99, 104, 0.15);
      transform: scale(0.95);
    }

    .v2-input-box .attach-btn .material-icons {
      font-size: 12px;
    }
    
    /* Attachment count badge on attach button */
    .attach-btn .attachment-badge {
      position: absolute;
      top: -4px;
      right: -4px;
      background: #d93025;
      color: white;
      border-radius: 8px;
      padding: 2px 4px;
      font-size: 8px;
      font-weight: 600;
      min-width: 14px;
      height: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 1px 2px rgba(0,0,0,0.2);
      pointer-events: none;
    }
    
    /* Clear attachments button - next to attach button */
    .clear-attachments-btn {
      position: absolute;
      top: 8px;
      right: 32px;
      background: transparent;
      border: none;
      border-radius: 50%;
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: #d93025;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      padding: 0;
      flex-shrink: 0;
      opacity: 0.6;
      z-index: 2;
    }
    
    .clear-attachments-btn:hover {
      background: rgba(217, 48, 37, 0.1);
      color: #b31412;
      opacity: 1;
      transform: scale(1.2);
    }
    
    .clear-attachments-btn:active {
      background: rgba(217, 48, 37, 0.2);
      transform: scale(0.95);
    }
    
    .clear-attachments-btn .material-icons {
      font-size: 14px;
    }

    /* Dark mode styles removed - not currently implemented */

    /* ========== GOOGLE GEMINI-STYLE TOAST NOTIFICATIONS ========== */
    .toast-container {
      position: fixed;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 10000;
      display: flex;
      flex-direction: column;
      gap: 8px;
      pointer-events: none;
    }

    .toast {
      background: #202124;
      color: #e8eaed;
      padding: 14px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.28), 0 8px 24px rgba(0, 0, 0, 0.16);
      display: flex;
      align-items: center;
      gap: 12px;
      min-width: 280px;
      max-width: 400px;
      font-size: 12px;
      line-height: 20px;
      pointer-events: auto;
      animation: toastSlideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .toast.toast-exiting {
      animation: toastSlideOut 0.2s cubic-bezier(0.4, 0, 1, 1) forwards;
    }

    @keyframes toastSlideIn {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes toastSlideOut {
      from {
        opacity: 1;
        transform: translateY(0);
      }
      to {
        opacity: 0;
        transform: translateY(20px);
      }
    }

    .toast-icon {
      flex-shrink: 0;
      font-size: 18px;
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .toast-message {
      flex: 1;
      font-weight: 400;
    }

    /* Success toast - green accent */
    .toast.toast-success .toast-icon {
      color: #81c995;
    }

    /* Error toast - red accent */
    .toast.toast-error .toast-icon {
      color: #f28b82;
    }

    /* Info toast - blue accent */
    .toast.toast-info .toast-icon {
      color: #8ab4f8;
    }

    /* Warning toast - yellow accent */
    .toast.toast-warning .toast-icon {
      color: #fdd663;
    }

    /* ========== ACCESSIBILITY IMPROVEMENTS ========== */
    /* Respect user's motion preferences */
    @media (prefers-reduced-motion: reduce) {
      *,
      *::before,
      *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
      }
    }

    /* Improved focus indicators for keyboard navigation */
    button:focus-visible,
    .tab:focus-visible,
    .icon-btn:focus-visible {
      outline: 2px solid #1a73e8;
      outline-offset: 2px;
    }

    @media (prefers-color-scheme: dark) {
      button:focus-visible,
      .tab:focus-visible,
      .icon-btn:focus-visible {
        outline-color: #8ab4f8;
      }
    }

    input:focus-visible {
      outline: 2px solid #1a73e8;
      outline-offset: 2px;
    }
    
    textarea:focus-visible {
      outline: none;
    }
    
    /* Textarea focus is handled by parent .v2-input-box:focus-within with rounded border */

    @media (prefers-color-scheme: dark) {
      input:focus-visible,
      textarea:focus-visible {
        outline-color: #8ab4f8;
      }
    }
  
</style>