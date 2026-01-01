  <style>
    /* ⚠️ WARNING: This file is an HTML include - DO NOT add CommonJS wrapper!
     * This file is included in Sidebar.gs via <?!= include('SidebarStyles') ?>
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
      font-size: 16px;
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
      font-size: 13px;
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
      font-size: 11px;
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
      font-size: 12px;
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
      font-size: 18px;
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
      font-size: 14px;
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
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .config-container {
      flex: 1;
      overflow-y: auto;
      padding: 8px;
    }

    .config-section {
      background: white;
      border-radius: 16px;
      padding: 20px;
      margin-bottom: 20px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
      border: 1px solid #e8eaed;
    }

    .config-section h3 {
      font-size: 14px;
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
      font-size: 14px;
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
      font-size: 14px;
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
      font-size: 12px;
      color: #5f6368;
      margin-top: 4px;
    }

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
      border-radius: 18px;
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
      border-radius: 12px;
      font-size: 11px;
      font-weight: 600;
      flex-shrink: 0;
      box-shadow: 0 2px 4px rgba(26, 115, 232, 0.25),
                  inset 0 1px 0 rgba(255, 255, 255, 0.3);
    }

    /* Message preview text */
    .pending-message-preview {
      flex: 1;
      font-size: 14px;
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
      font-size: 10px;
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

    .attachment-chip {
      position: relative;
      width: 64px;
      height: 64px;
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid #e0e0e0;
      background: #f8f9fa;
    }

    .attachment-chip img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .attachment-chip-remove {
      position: absolute;
      top: 2px;
      right: 2px;
      background: rgba(0,0,0,0.7);
      color: white;
      border: none;
      border-radius: 50%;
      width: 18px;
      height: 18px;
      font-size: 12px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0;
    }

    .attachment-chip-remove:hover {
      background: rgba(0,0,0,0.9);
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
      padding: 16px 20px 20px 20px;
      background: #f8f9fa;
      border-top: 1px solid #e8eaed;
      display: flex;
      flex-direction: column;
      gap: 12px;
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
      padding: 12px;
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
      padding: 12px; /* Clean padding, no left offset needed */
      font-family: inherit;
      font-size: 15px;
      line-height: 24px;
      resize: none;
      min-height: 72px;
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
      font-size: 13px;
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
      border-radius: 24px;
      padding: 10px 20px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
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
      font-size: 18px;
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
      font-size: 14px;
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
      font-size: 20px;
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