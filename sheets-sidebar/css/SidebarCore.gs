function _main(
  module = globalThis.__getCurrentModule(),
  exports = module.exports,
  log = globalThis.__getModuleLogFunction?.(module) || (() => {})
) {
  <style>
      /* ⚠️ WARNING: This file is an HTML include - DO NOT add CommonJS wrapper!
       * This file is included in Sidebar.gs via <?!= include('SidebarCore') ?>
       * Always use raw_write with fileType: "HTML" when editing this file.
       *
       * CONTENTS: Base styles, markdown content styling, toast notifications, accessibility
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
        color: var(--color-text-primary);
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
        background: var(--color-primary);
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
        border: 1px solid var(--color-border-medium);
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
        background: var(--color-primary);
        color: white;
        border: none;
      }

      button.primary:hover {
        background: var(--color-primary-hover);
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
        border: 1px solid var(--color-border-light);
      }

      .config-section h3 {
        font-size: 12px;
        font-weight: 600;
        color: var(--color-text-secondary);
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
        border: 1px solid var(--color-border-medium);
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
        color: var(--color-text-secondary);
        margin-top: 4px;
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

    /* Thinking message blocks within thoughts */
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
          color: var(--color-text-primary);
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
          color: var(--color-text-primary);
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
          color: var(--color-text-secondary);
          font-style: italic;
          background: rgba(100, 66, 214, 0.05);
          padding: 8px 12px;
          border-radius: 0 4px 4px 0;
        }

        /* Links */
        .message-text a,
        .all-thoughts-content a,
        .thinking-message a {
          color: var(--color-primary);
          text-decoration: none;
          border-bottom: 1px solid rgba(26, 115, 232, 0.3);
          transition: all 0.2s ease;
        }

        .message-text a:hover,
        .all-thoughts-content a:hover,
        .thinking-message a:hover {
          color: var(--color-primary-hover);
          border-bottom-color: var(--color-primary-hover);
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
          color: var(--color-text-primary);
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

        /* ========== ERROR MESSAGE STYLING ========== */
        .error-message {
          background: linear-gradient(135deg, #fef7f7 0%, #fff5f5 100%);
          border: 1px solid rgba(220, 53, 69, 0.3);
          border-left: 4px solid #dc3545;
          border-radius: 12px;
          padding: 12px 14px;
          margin: 8px 0;
        }

        .error-content {
          display: flex;
          align-items: flex-start;
          gap: 10px;
        }

        .error-icon {
          color: #dc3545;
          font-size: 20px;
          flex-shrink: 0;
          margin-top: 2px;
        }

        .error-text {
          flex: 1;
          font-size: 13px;
          line-height: 1.5;
          color: #495057;
        }

        .error-text strong {
          color: #dc3545;
          font-weight: 600;
        }

        .error-hint {
          margin-top: 10px;
          padding-top: 10px;
          border-top: 1px solid rgba(220, 53, 69, 0.15);
          font-size: 11px;
          color: #6c757d;
          font-style: italic;
        }

        .retry-btn {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          margin-top: 10px;
          padding: 6px 12px;
          background: #dc3545;
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .retry-btn:hover:not(:disabled) {
          background: #c82333;
          transform: translateY(-1px);
          box-shadow: 0 2px 6px rgba(220, 53, 69, 0.3);
        }

        .retry-btn:disabled {
          background: #6c757d;
          cursor: not-allowed;
          opacity: 0.7;
        }

        .retry-btn .material-icons {
          font-size: 14px;
        }

        .retry-countdown {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.85);
          margin-left: 2px;
        }

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
          background: var(--color-text-primary);
          color: var(--color-border-light);
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

        /* @keyframes toastSlideIn, toastSlideOut - moved to SidebarVariables */

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
          outline: 2px solid var(--color-primary);
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
          outline: 2px solid var(--color-primary);
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

        /* ============================================
           FONT SIZE ADJUSTER CONTROLS
           For Settings dialog Display Settings section
           ============================================ */

        .font-size-control {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 0;
        }

        .font-size-adjuster {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .font-btn {
          width: 28px;
          height: 28px;
          border: 1px solid var(--color-border-medium, var(--color-border-medium));
          border-radius: 4px;
          background: var(--color-bg-white, #ffffff);
          font-size: 16px;
          font-weight: bold;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          color: var(--color-text-primary, #202124);
          padding: 0;
        }

        .font-btn:hover {
          background: var(--color-bg-hover, #f1f3f4);
          border-color: var(--color-primary, var(--color-primary));
        }

        .font-btn:active {
          transform: scale(0.95);
        }

        .font-size-value {
          min-width: 44px;
          text-align: center;
          font-weight: 500;
          font-size: 13px;
          color: var(--color-text-primary, #202124);
        }

    </style>
}

__defineModule__(_main);