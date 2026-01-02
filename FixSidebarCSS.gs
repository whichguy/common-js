function _main(
  module = globalThis.__getCurrentModule(),
  exports = module.exports,
  log = globalThis.__getModuleLogFunction?.(module) || (() => {})
) {
  /**
   * Run this function to automatically fix the Sidebar CSS issues:
   * 1. Change dark background to light theme
   * 2. Change pill-shaped tabs to square tabs  
   * 3. Increase input height from 70px to 110px
   */
  function fixSidebarCSS() {
    try {
      // Get all files in the project
      var files = DriveApp.getFilesByName('Sidebar');
      
      if (!files.hasNext()) {
        Logger.log('ERROR: Sidebar file not found');
        return;
      }
      
      var file = files.next();
      var content = file.getBlob().getDataAsString();
      
      // Fix 1: Change body background from dark to light
      content = content.replace(
        /(body\s*{[^}]*background:\s*)(#[0-9a-fA-F]{6}|#[0-9a-fA-F]{3})/g,
        function(match, prefix, color) {
          return prefix + 'var(--color-bg-light)';
        }
      );
      
      // Fix 2: Change tab border-radius to 0 (square)
      content = content.replace(
        /(\.tab\s*{[^}]*border-radius:\s*)(\d+px)/g,
        function(match, prefix, value) {
          return prefix + '0';
        }
      );
      
      // Fix 3: Increase input-container height to 110px
      content = content.replace(
        /(\.input-container\s*{[^}]*height:\s*)(\d+px)/g,
        function(match, prefix, value) {
          return prefix + '110px';
        }
      );
      
      // Save the updated content
      file.setContent(content);
      
      Logger.log('SUCCESS: Sidebar CSS fixed!');
      Logger.log('Changes made:');
      Logger.log('1. Body background changed to light theme (var(--color-bg-light))');
      Logger.log('2. Tabs changed to square (border-radius: 0)');
      Logger.log('3. Input height increased to 110px');
      Logger.log('');
      Logger.log('Please reload the sidebar in your Google Sheet to see the changes.');
      
      return 'CSS fixed successfully!';
      
    } catch (error) {
      Logger.log('ERROR: ' + error.toString());
      throw error;
    }
  }
}

__defineModule__(_main);