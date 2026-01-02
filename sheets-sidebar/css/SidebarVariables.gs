<style>
  /* ⚠️ WARNING: This file is an HTML include - DO NOT add CommonJS wrapper!
   * This file is included in Sidebar.gs via include('SidebarVariables')
   * Always use raw_write with fileType: "HTML" when editing this file.
   *
   * CONTENTS: Shared CSS variables for design tokens (colors, spacing, shadows, z-index)
   * PURPOSE: Maintain brand consistency and enable theming across all sidebar CSS files
   */
  
  :root {
    /* ============================================
       COLOR PALETTE - Google Material Design
       ============================================ */
    
    /* Primary Colors */
    --color-primary: #1a73e8;           /* Main blue - buttons, links, focus states */
    --color-primary-hover: #1765cc;     /* Darker blue for hover states */
    --color-primary-light: #4285f4;     /* Light blue for accents */
    --color-primary-bg: #d2e3fc;        /* Light blue background */
    --color-primary-border: #aecbfa;    /* Light blue border */
    
    /* Secondary/Accent Colors */
    --color-purple-start: #667eea;      /* User message gradient start */
    --color-purple-end: #764ba2;        /* User message gradient end */
    --color-gemini-blue: #8ab4f8;       /* Gemini-style light blue */
    
    /* Status Colors */
    --color-success: #1e8e3e;           /* Success green */
    --color-success-light: #81c995;     /* Light green for toasts */
    --color-error: #d93025;             /* Error red */
    --color-error-dark: #b31412;        /* Darker red for hover */
    --color-error-bg: #fee;             /* Error background */
    --color-error-border: #fcc;         /* Error border */
    --color-error-text: #c00;           /* Error text */
    --color-error-toast: #f28b82;       /* Error toast accent */
    --color-warning: #fdd663;           /* Warning yellow */
    --color-info: #8ab4f8;              /* Info blue */
    
    /* Neutral Grays */
    --color-text-primary: #202124;      /* Primary text color */
    --color-text-secondary: #5f6368;    /* Secondary text, labels */
    --color-text-tertiary: #9aa0a6;     /* Placeholders, disabled text */
    
    /* Background Colors */
    --color-bg-white: #ffffff;          /* Pure white backgrounds */
    --color-bg-light: #f8f9fa;          /* Light gray background */
    --color-bg-lighter: #fafbfc;        /* Even lighter gray */
    --color-bg-subtle: #f1f3f4;         /* Subtle background */
    --color-bg-hover: #f1f3f4;          /* Hover background */
    
    /* Border Colors */
    --color-border-light: #e8eaed;      /* Light borders */
    --color-border-medium: #dadce0;     /* Medium borders */
    --color-border-dark: #bdc1c6;       /* Darker borders */
    --color-border-input: #e0e0e0;      /* Input borders */
    --color-border-focus: #4285f4;      /* Focus border */
    
    /* Code & Inline Styles */
    --color-code-bg: rgba(0, 0, 0, 0.05);
    --color-code-text: #d63384;
    --color-code-border: rgba(0, 0, 0, 0.08);
    --color-code-accent: #6442d6;       /* Purple accent for code blocks */
    
    /* ============================================
       SPACING SCALE - 4px base unit
       ============================================ */
    
    --spacing-xs: 4px;
    --spacing-sm: 8px;
    --spacing-md: 12px;
    --spacing-lg: 16px;
    --spacing-xl: 24px;
    --spacing-2xl: 32px;
    
    /* Gap Sizes */
    --gap-xs: 6px;
    --gap-sm: 8px;
    --gap-md: 10px;
    --gap-lg: 16px;
    
    /* ============================================
       BORDER RADIUS - Rounded corners
       ============================================ */
    
    --radius-sm: 4px;
    --radius-md: 8px;
    --radius-lg: 12px;
    --radius-xl: 18px;
    --radius-pill: 22px;
    --radius-round: 50%;
    
    /* ============================================
       SHADOWS - Material Design elevations
       ============================================ */
    
    --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.06);
    --shadow-md: 0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04);
    --shadow-lg: 0 2px 6px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04);
    --shadow-xl: 0 4px 12px rgba(0, 0, 0, 0.15);
    
    /* Focus Shadows */
    --shadow-focus: 0 0 0 2px rgba(66, 133, 244, 0.1);
    --shadow-focus-ring: 0 0 0 3px rgba(66, 133, 244, 0.1), 0 3px 8px rgba(66, 133, 244, 0.15), 0 2px 4px rgba(66, 133, 244, 0.1);
    
    /* Button Shadows */
    --shadow-btn-primary: 0 1px 3px rgba(26, 115, 232, 0.3);
    --shadow-btn-primary-hover: 0 2px 6px rgba(26, 115, 232, 0.4);
    --shadow-btn-error: 0 1px 3px rgba(234, 67, 53, 0.3);
    --shadow-btn-error-hover: 0 2px 6px rgba(234, 67, 53, 0.4);
    
    /* User Message Gradient Shadow */
    --shadow-user-message: 0 4px 12px rgba(102, 126, 234, 0.3);
    
    /* Toast Shadows */
    --shadow-toast: 0 4px 16px rgba(0, 0, 0, 0.28), 0 8px 24px rgba(0, 0, 0, 0.16);
    
    /* Chip Shadows */
    --shadow-chip: 0 2px 4px rgba(0, 0, 0, 0.06), 0 4px 8px rgba(0, 0, 0, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.5);
    --shadow-chip-hover: 0 3px 6px rgba(0, 0, 0, 0.08), 0 6px 12px rgba(0, 0, 0, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.7);
    
    /* ============================================
       Z-INDEX SCALE - Layering hierarchy
       ============================================ */
    
    --z-content: 1;                     /* Normal content */
    --z-sticky: 10;                     /* Sticky elements */
    --z-overlay: 100;                   /* Overlays, dropdowns */
    --z-modal: 200;                     /* Modal dialogs */
    --z-popover: 300;                   /* Popovers, tooltips */
    --z-toast: 9000;                    /* Toast notifications (top layer) */
    
    /* ============================================
       TYPOGRAPHY - Font sizes and weights
       ============================================ */
    
    --font-size-xs: 8px;
    --font-size-sm: 9px;
    --font-size-base: 10px;
    --font-size-md: 11px;
    --font-size-lg: 12px;
    --font-size-xl: 13px;
    --font-size-2xl: 14px;
    
    --font-weight-normal: 400;
    --font-weight-medium: 500;
    --font-weight-semibold: 600;
    
    /* Line Heights */
    --line-height-tight: 1.4;
    --line-height-base: 1.5;
    --line-height-relaxed: 1.6;
    
    /* ============================================
       TRANSITIONS - Animation timing
       ============================================ */
    
    --transition-fast: 0.2s;
    --transition-base: 0.3s;
    --transition-slow: 0.6s;
    
    /* Timing Functions - Material Design */
    --timing-standard: cubic-bezier(0.4, 0, 0.2, 1);    /* Standard easing */
    --timing-enter: cubic-bezier(0, 0, 0.2, 1);         /* Enter from screen */
    --timing-exit: cubic-bezier(0.4, 0, 1, 1);          /* Exit to screen */
    --timing-bounce: cubic-bezier(0.34, 1.56, 0.64, 1); /* Bounce effect */
    
    /* ============================================
       USER-CONFIGURABLE FONT SIZES
       ============================================ */
    
    --font-size-input: 11px;      /* Prompt input textarea */
    --font-size-messages: 14px;   /* Chat message bubbles (all types) */
    
    /* ============================================
       COMPONENT-SPECIFIC VARIABLES
       ============================================ */
    
    /* Input Box */
    --input-padding: 8px;
    --input-height-min: 44px;
    --input-height-max: 300px;
    
    /* Message Bubbles */
    --bubble-padding: 16px;
    --bubble-radius: 18px;
    
    /* Thinking Bubbles */
    --thinking-max-height: 600px;
    
    /* Queue Container */
    --queue-max-height: 200px;
    
    /* Scrollbar */
    --scrollbar-width: 6px;
    --scrollbar-width-md: 8px;
  }
  
  /* ============================================
     DARK MODE - Automatic (prefers-color-scheme)
     ============================================ */
  
  @media (prefers-color-scheme: dark) {
    :root:not([data-theme="light"]) {
      /* Primary Colors - adjusted for dark mode */
      --color-primary: #8ab4f8;           /* Lighter blue for dark backgrounds */
      --color-primary-hover: #aecbfa;     /* Even lighter for hover */
      --color-primary-light: #669df6;     /* Medium blue accent */
      --color-primary-bg: #1e3a5f;        /* Dark blue background */
      --color-primary-border: #3d5a80;    /* Dark blue border */
      
      /* Secondary/Accent Colors */
      --color-purple-start: #9bb1ff;      /* Lighter purple for dark mode */
      --color-purple-end: #a47bc9;        /* Lighter purple end */
      --color-gemini-blue: #669df6;       /* Adjusted Gemini blue */
      
      /* Status Colors */
      --color-success: #81c995;           /* Lighter green */
      --color-success-light: #1e8e3e;     /* Swapped - darker for accents */
      --color-error: #f28b82;             /* Coral red for dark mode */
      --color-error-dark: #ee675c;        /* Slightly darker */
      --color-error-bg: #3c2020;          /* Dark red background */
      --color-error-border: #5c3030;      /* Dark red border */
      --color-error-text: #f28b82;        /* Coral red text */
      --color-error-toast: #ee675c;       /* Error toast accent */
      --color-warning: #fdd663;           /* Keep warning yellow visible */
      --color-info: #8ab4f8;              /* Light blue info */
      
      /* Neutral Grays - inverted */
      --color-text-primary: #e8eaed;      /* Light text on dark */
      --color-text-secondary: #9aa0a6;    /* Medium gray text */
      --color-text-tertiary: #5f6368;     /* Darker muted text */
      --color-text-muted: #9aa0a6;        /* Muted text for dark mode */
      
      /* Background Colors - dark palette */
      --color-bg-white: #1e1e1e;          /* Dark background (not pure black) */
      --color-bg-light: #2d2d2d;          /* Slightly lighter dark */
      --color-bg-lighter: #333333;        /* Even lighter dark */
      --color-bg-subtle: #3c4043;         /* Subtle dark background */
      --color-bg-hover: #3c4043;          /* Hover dark background */
      
      /* Border Colors - dark mode */
      --color-border-light: #3c4043;      /* Light borders on dark */
      --color-border-medium: #5f6368;     /* Medium borders on dark */
      --color-border-dark: #9aa0a6;       /* Darker borders on dark */
      --color-border-input: #5f6368;      /* Input borders */
      --color-border-focus: #8ab4f8;      /* Focus border - blue */
      
      /* Code & Inline Styles - dark mode */
      --color-code-bg: rgba(255, 255, 255, 0.1);
      --color-code-text: #f48fb1;         /* Pink for code in dark mode */
      --color-code-border: rgba(255, 255, 255, 0.15);
      --color-code-accent: #b39ddb;       /* Light purple accent */
      
      /* Shadows - adjusted for dark mode */
      --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.3);
      --shadow-md: 0 1px 3px rgba(0, 0, 0, 0.4), 0 1px 2px rgba(0, 0, 0, 0.3);
      --shadow-lg: 0 2px 6px rgba(0, 0, 0, 0.4), 0 1px 2px rgba(0, 0, 0, 0.3);
      --shadow-xl: 0 4px 12px rgba(0, 0, 0, 0.5);
      --shadow-focus: 0 0 0 2px rgba(138, 180, 248, 0.2);
      --shadow-focus-ring: 0 0 0 3px rgba(138, 180, 248, 0.2), 0 3px 8px rgba(138, 180, 248, 0.25), 0 2px 4px rgba(138, 180, 248, 0.15);
      --shadow-toast: 0 4px 16px rgba(0, 0, 0, 0.5), 0 8px 24px rgba(0, 0, 0, 0.4);
      
      /* Scrollbar - dark mode */
      scrollbar-color: var(--color-border-medium) var(--color-bg-subtle);
    }
  }
  
  /* ============================================
     DARK MODE - Manual Override [data-theme="dark"]
     ============================================ */
  
  [data-theme="dark"] {
    /* Primary Colors - adjusted for dark mode */
    --color-primary: #8ab4f8;
    --color-primary-hover: #aecbfa;
    --color-primary-light: #669df6;
    --color-primary-bg: #1e3a5f;
    --color-primary-border: #3d5a80;
    
    /* Secondary/Accent Colors */
    --color-purple-start: #9bb1ff;
    --color-purple-end: #a47bc9;
    --color-gemini-blue: #669df6;
    
    /* Status Colors */
    --color-success: #81c995;
    --color-success-light: #1e8e3e;
    --color-error: #f28b82;
    --color-error-dark: #ee675c;
    --color-error-bg: #3c2020;
    --color-error-border: #5c3030;
    --color-error-text: #f28b82;
    --color-error-toast: #ee675c;
    --color-warning: #fdd663;
    --color-info: #8ab4f8;
    
    /* Neutral Grays - inverted */
    --color-text-primary: #e8eaed;
    --color-text-secondary: #9aa0a6;
    --color-text-tertiary: #5f6368;
    --color-text-muted: #9aa0a6;
    
    /* Background Colors - dark palette */
    --color-bg-white: #1e1e1e;
    --color-bg-light: #2d2d2d;
    --color-bg-lighter: #333333;
    --color-bg-subtle: #3c4043;
    --color-bg-hover: #3c4043;
    
    /* Border Colors - dark mode */
    --color-border-light: #3c4043;
    --color-border-medium: #5f6368;
    --color-border-dark: #9aa0a6;
    --color-border-input: #5f6368;
    --color-border-focus: #8ab4f8;
    
    /* Code & Inline Styles - dark mode */
    --color-code-bg: rgba(255, 255, 255, 0.1);
    --color-code-text: #f48fb1;
    --color-code-border: rgba(255, 255, 255, 0.15);
    --color-code-accent: #b39ddb;
    
    /* Shadows - adjusted for dark mode */
    --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.3);
    --shadow-md: 0 1px 3px rgba(0, 0, 0, 0.4), 0 1px 2px rgba(0, 0, 0, 0.3);
    --shadow-lg: 0 2px 6px rgba(0, 0, 0, 0.4), 0 1px 2px rgba(0, 0, 0, 0.3);
    --shadow-xl: 0 4px 12px rgba(0, 0, 0, 0.5);
    --shadow-focus: 0 0 0 2px rgba(138, 180, 248, 0.2);
    --shadow-focus-ring: 0 0 0 3px rgba(138, 180, 248, 0.2), 0 3px 8px rgba(138, 180, 248, 0.25), 0 2px 4px rgba(138, 180, 248, 0.15);
    --shadow-toast: 0 4px 16px rgba(0, 0, 0, 0.5), 0 8px 24px rgba(0, 0, 0, 0.4);
  }
  
  /* ============================================
     FIREFOX SCROLLBAR SUPPORT
     ============================================ */
  
  /* Default thin scrollbar for Firefox */
  * {
    scrollbar-width: thin;
    scrollbar-color: var(--color-border-medium) var(--color-bg-subtle);
  }
  
  /* ============================================
     SHARED ANIMATIONS - @keyframes
     Consolidated from multiple CSS files to avoid duplication
     ============================================ */
  
  /* Spin animation - loading spinners */
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  
  /* Toast notifications - slide in from bottom */
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
  
  /* Toast notifications - slide out to bottom */
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
  
  /* Queue chip - enter from right */
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
  
  /* Queue chip - exit to right with collapse */
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
</style>