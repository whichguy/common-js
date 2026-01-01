# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Sheets Chat** - A Google Apps Script project that integrates Claude AI into Google Sheets via a sidebar interface. Uses a custom CommonJS module system for code organization.

- **Script ID**: `1Y72rigcMUAwRd7bwl3CR57O6ENo5sKTn0xAl2C4HoZys75N5utGfkCUG`
- **Runtime**: V8

## MCP Gas Commands

This project uses the `mcp_gas` MCP server. **Do not edit files in `~/gas-repos` directly** - use MCP tools instead:

```bash
# Read files
mcp__gas__cat({scriptId: "1Y72rigcMUAwRd7bwl3CR57O6ENo5sKTn0xAl2C4HoZys75N5utGfkCUG", path: "module/file"})

# Write files (auto-wraps with CommonJS)
mcp__gas__write({scriptId: "...", path: "module/file", content: "..."})

# Edit files (token-efficient)
mcp__gas__edit({scriptId: "...", path: "module/file", edits: [{oldText: "...", newText: "..."}]})

# Search
mcp__gas__ripgrep({scriptId: "...", pattern: "searchTerm"})

# Execute code
mcp__gas__exec({scriptId: "...", js_statement: "require('module').function()"})
```

## Running Tests

```javascript
// Run all tests
require('test-framework/test-runner').runAllTests()

// Run only unit tests
require('test-framework/test-runner').runUnitTests()

// Run only integration tests
require('test-framework/test-runner').runIntegrationTests()

// Run tests for specific module
require('test-framework/test-runner').runRepoTests('common-js')

// Run specific test file
require('test-framework/test-runner').runTestFile('common-js/test/require-loading.unit.test')
```

Test naming convention: `*.unit.test` for unit tests, `*.integration.test` for integration tests.

## Architecture

### CommonJS Module System (`common-js/require`)

Custom module system enabling `require()` and `module.exports` in GAS. **Must be at file position 0**.

**Writing a module:**
```javascript
const helper = require('path/to/Helper');

function myFunction() {
  return helper.doSomething();
}

module.exports = { myFunction };

// For GAS event handlers (doGet, doPost, onOpen, etc.)
module.exports.__events__ = {
  onOpen: 'handleOpen',
  doGet: 'handleGet'
};

// For global functions (custom sheet functions)
module.exports.__global__ = {
  MY_CUSTOM_FUNCTION: myCustomFunction
};
```

**Important**: When using `mcp__gas__write`, the CommonJS wrapper (`_main()` and `__defineModule__()`) is added automatically. Write only the user code.

### Critical File Ordering

Files execute in position order. These must remain fixed:
- Position 0: `common-js/require` (module system)
- Position 1: `common-js/ConfigManager` (configuration)
- Position 2: `common-js/__mcp_exec` (execution infrastructure)

### Module Organization

| Folder | Purpose |
|--------|---------|
| `common-js/` | Core module system, utilities, ConfigManager |
| `gas-properties/` | ConfigManager for hierarchical settings |
| `gas-queue/` | Queue management with multiple storage backends |
| `sheets-chat/` | Claude conversation, UI support, system prompts |
| `sheets-sidebar/` | Sidebar HTML/CSS/JS components |
| `test-framework/` | Mocha-style test framework (describe/it/expect) |
| `tools/` | Tool handlers (ToolBase, Registry, handlers) |

### Event Handler System

Multiple modules can register for the same GAS event. The dispatcher in `require.js` routes events to all registered handlers.

**Convention for doGet/doPost**: Return `null` if request doesn't match your handler, allowing others to process it.

### Test Framework

Uses Mocha-style syntax with Chai-like assertions:

```javascript
const { describe, it, beforeEach } = require('test-framework/mocha-adapter');
const { expect } = require('test-framework/chai-assertions');

describe('MyModule', function() {
  beforeEach(function() {
    // setup
  });

  it('should do something', function() {
    expect(result).to.equal(expected);
  });
});

module.exports.__events__ = { /* test discovery */ };
```

### HTML Includes

Sidebar uses scriptlet includes. In HTML templates:
```html
<?!= include('sheets-sidebar/css/SidebarCore') ?>
<?!= include('sheets-sidebar/html/include/SidebarAppInit') ?>
```

**Never place `<?!= include() ?>` inside HTML/JS comments** - it executes regardless.

### Client-Server Communication

Use promise-based pattern instead of callbacks:
```javascript
// Client-side (in HTML)
window.server.exec_api(null, 'ModuleName', 'functionName', params)
  .then(result => { /* handle */ })
  .catch(error => { /* handle */ });
```

## Key Modules

- **ClaudeConversation**: Manages AI conversation state and API calls
- **SystemPrompt**: Builds context-aware system prompts
- **UISupport**: Sidebar UI helpers and state management
- **QueueManager**: Async task queue with Cache/Properties/Drive backends
- **ConfigManager**: Hierarchical config (userDoc > document > user > script)
- **ToolRegistry**: Registers and dispatches tool handlers

## Development Notes

- GAS has no persistent state between function calls - each call starts fresh
- Use `Logger.log()` for debugging (captured automatically by exec)
- Module logging controlled via `setModuleLogging('module/*', true)`
- `loadNow: true` in `__defineModule__` options forces immediate loading (required for event handlers)
