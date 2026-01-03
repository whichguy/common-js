<script>
// ⚠️ WARNING: This file is an HTML include - DO NOT add CommonJS wrapper!
// This file is included in Sidebar.gs via include('sheets-sidebar/SidebarScript')
// Always use raw_write with fileType: "HTML" when editing this file.
//
// Cache refresh: 2025-10-24 17:15 EDT - Enhanced debugging for expansion issue
console.log('[SidebarScript] Version: 2025-10-24 15:10 EDT');

// Critical: Verify jQuery is loaded
if (typeof $ === 'undefined' || typeof jQuery === 'undefined') {
  console.error('[CRITICAL] jQuery failed to load from CDN. Sidebar will not function.');
  // Attempt to show error to user
  document.addEventListener('DOMContentLoaded', () => {
    const body = document.body;
    if (body) {
      const errorDiv = document.createElement('div');
      errorDiv.style.cssText = 'background:#fee;border:2px solid #f00;padding:20px;margin:20px;border-radius:8px;font-family:sans-serif;';
      errorDiv.innerHTML = '<strong>Error:</strong> jQuery failed to load. Please check your internet connection and refresh the page.';
      body.insertBefore(errorDiv, body.firstChild);
    }
  });
}

// Auto-grow textarea functionality
const autoGrowTextarea = () => {
  const $textarea = $('#messageInput');
  if (!$textarea.length) return;
  
  // Reset height to auto to get accurate scrollHeight
  $textarea.css('height', 'auto');

  // Calculate new height (min 44px = 1 line, max 300px)
  const newHeight = Math.min(Math.max($textarea[0].scrollHeight, 44), 300);
  
  // Set the new height
  $textarea.css('height', `${newHeight}px`);
  
  // Show scrollbar only when at max height
  $textarea.css('overflow-y', newHeight >= 300 ? 'auto' : 'hidden');
};
</script>