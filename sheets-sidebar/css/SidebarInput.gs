<style>
    /* ⚠️ WARNING: This file is an HTML include - DO NOT add CommonJS wrapper!
     * This file is included in Sidebar.gs via <?!= include('SidebarInput') ?>
     * Always use raw_write with fileType: "HTML" when editing this file.
     *
     * CONTENTS: Message queue, attachments, V2 input layout, attach buttons
     */

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

    /* @keyframes queueChipEnter - moved to SidebarVariables */

    /* Exit animation - slide out to right with fade */
    .pending-message-chip.exiting {
      animation: queueChipExit 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
    }

    /* @keyframes queueChipExit - moved to SidebarVariables */

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

    /* @keyframes spin - moved to SidebarVariables */




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
      border-top: 1px solid var(--color-border-light);
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
      border: 2px solid var(--color-border-light);
      border-top-color: #4285f4;
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
      margin-right: 6px;
    }

    /* @keyframes spin - moved to SidebarVariables */

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
      background: transparent;
      border: 1px solid #dadce0;
      border-radius: 28px;
      padding: 8px;
      box-shadow: none;
      transition: all 0.2s ease;
      display: flex;
      flex-direction: column;
      gap: 0;
    }

    .v2-input-box:focus-within {
      border-color: #4285f4;
      border-width: 2px;
      box-shadow: none;
      padding: 7px; /* Adjust padding to compensate for thicker border */
    }

    .v2-input-box textarea {
      width: 100%;
      border: none;
      background: transparent;
      padding: 8px; /* Clean padding, no left offset needed */
      font-family: inherit;
      font-size: var(--font-size-input, 11px);
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
      justify-content: flex-start;  /* Status left, buttons pushed right via status margin-right: auto */
      width: 100%;
      gap: 16px;
      min-height: 44px;
      padding: 0 4px;
    }

    .v2-status-group {
      display: flex;
      flex-direction: row;
      align-items: center;
      gap: 8px;
      font-size: 11px;
      color: #5f6368;
      line-height: 1;
      margin-right: auto;  /* Push status to left, buttons to right */
    }

    .v2-status-group .status-time,
    .v2-status-group .status-tokens {
      color: #5f6368;
    }

    .v2-status-group .status-spinner {
      display: inline-block;
      width: 14px;
      height: 14px;
      border: 2px solid var(--color-border-light);
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
      background: var(--color-primary-hover);
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

    /* Stop mode - when request is processing */
    .v2-submit-btn.stop-mode {
      background: #ea4335;
      color: white;
      transition: all 0.2s ease;
      box-shadow: 0 1px 3px rgba(234, 67, 53, 0.3);
    }

    .v2-submit-btn.stop-mode:hover:not(:disabled) {
      background: #d33426;
      box-shadow: 0 2px 6px rgba(234, 67, 53, 0.4);
      transform: translateY(-1px);
    }

    .v2-submit-btn.stop-mode:active:not(:disabled) {
      transform: translateY(0);
    }

    .v2-cancel-btn {
      background: #f1f3f4;
      color: #5f6368;
      border: 1px solid #dadce0;
      border-radius: 18px;
      padding: 6px 12px;
      font-size: 10px;
      font-weight: 500;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: all 0.2s ease;
      flex-shrink: 0;
    }

    .v2-cancel-btn:hover {
      background: #fce8e6;
      color: #d93025;
      border-color: #f28b82;
      transform: translateY(-1px);
      box-shadow: 0 2px 4px rgba(217, 48, 37, 0.2);
    }

    .v2-cancel-btn:active {
      transform: translateY(0);
      background: #fdd8d4;
    }

    .v2-cancel-btn .material-icons {
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

  </style>