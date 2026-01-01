# Sheets Chat

A Google Apps Script integration that brings Claude AI chat capabilities directly into Google Sheets with an intuitive sidebar interface.

## Features

- **AI-Powered Chat Interface**: Interactive sidebar for conversing with Claude AI
- **Multiple Tool Handlers**: Extensible tool system for various operations
  - Prompt processing and management
  - Spreadsheet data manipulation
  - URL analysis
  - Knowledge base integration
  - Search functionality
- **Queue Management System**: Efficient message and task queuing with cache backing
- **Configuration Management**: Hierarchical configuration with the gas-properties module
- **CommonJS Module System**: Organized code structure with module support

## Project Structure

```
├── Code.gs                          # Main server-side handlers
├── Sidebar.gs                       # Chat UI sidebar interface
├── ClaudeConversation.gs            # Conversation management
├── Startup.gs                       # Initialization scripts
├── appsscript.json                  # Apps Script manifest
├── tools/                           # Tool handler modules
│   ├── ToolBase.gs                  # Base class for tools
│   ├── ToolRegistry.gs              # Tool registration system
│   ├── PromptToolHandler.gs         # Prompt processing
│   ├── SpreadsheetToolHandler.gs    # Spreadsheet operations
│   ├── SearchToolHandler.gs         # Search functionality
│   ├── KnowledgeToolHandler.gs      # Knowledge base access
│   └── AnalyzeUrlToolHandler.gs     # URL analysis
├── gas-queue/                       # Queue management system
│   ├── QueueManager.gs              # Queue orchestration
│   ├── CacheStoreAdapter.gs         # Cache storage
│   ├── PropertiesStoreAdapter.gs    # Properties service storage
│   ├── DriveStoreAdapter.gs         # Drive-based storage
│   └── QueueStoreAdapter.gs         # Storage adapter interface
└── sheets-chat/                     # Chat-specific modules
    └── SystemPrompt.gs              # System prompt configuration

```

## Prerequisites

- Google account with access to Google Sheets
- Google Apps Script project
- Claude AI API access

## Installation

1. **Create a new Google Sheets document**
2. **Open Apps Script Editor**
   - From your sheet: Extensions → Apps Script
3. **Copy the project files**
   - Clone this repository
   - Copy all `.gs` files to your Apps Script project
4. **Configure OAuth Scopes**
   - The `appsscript.json` includes required scopes:
     - Spreadsheets access
     - Drive access
     - Script container UI
     - Script projects

## Configuration

The project uses the `gas-properties/ConfigManager` for hierarchical configuration management. Configure your settings through:

1. **Script Properties**: Project-level settings
2. **User Properties**: User-specific settings
3. **Document Properties**: Sheet-specific settings

## Usage

### Opening the Sidebar

The chat sidebar can be accessed through a custom menu in your Google Sheet. The interface provides:

- **Chat Tab**: Interact with Claude AI
- **Settings Tab**: Configure chat preferences
- **Clear/Reset Options**: Manage conversation history

### Tool System

The tool handlers enable Claude to perform various operations:

```javascript
// Example: Using the Spreadsheet Tool Handler
// Allows Claude to read/write spreadsheet data during conversations

// Example: Using the Prompt Tool Handler
// Processes and manages AI prompts with custom parameters
```

### Queue System

The queue manager handles asynchronous operations efficiently:

- **Thinking Queue**: Manages streaming AI responses
- **Tool Log Queue**: Tracks tool execution logs
- **Configurable Storage**: Cache, Properties Service, or Drive

## Development

### Module System

The project uses a CommonJS-style module system:

```javascript
const ConfigManager = require('gas-properties/ConfigManager');
const QueueManager = require('gas-queue/QueueManager');
```

### Adding New Tools

1. Extend `ToolBase.gs`
2. Implement required methods
3. Register in `ToolRegistry.gs`

## Key Components

### Code.gs
Server-side handlers for:
- Configuration management
- Queue initialization
- Tool execution
- Message processing

### Sidebar.gs
HTML/CSS/JavaScript UI providing:
- Modern chat interface
- Tab navigation
- Message rendering
- User interactions

### Tool Handlers
Modular tools for specific operations:
- **PromptToolHandler**: AI prompt processing
- **SpreadsheetToolHandler**: Sheet data operations
- **SearchToolHandler**: Search capabilities
- **KnowledgeToolHandler**: Knowledge base queries
- **AnalyzeUrlToolHandler**: URL content analysis

### Queue System
Asynchronous task management:
- Multiple storage backends
- TTL-based expiration
- Namespace isolation
- User/document scoping

## OAuth Scopes

The application requires the following Google OAuth scopes:

- `https://www.googleapis.com/auth/spreadsheets` - Read and modify spreadsheets
- `https://www.googleapis.com/auth/script.projects` - Manage Apps Script projects
- `https://www.googleapis.com/auth/drive` - Access Google Drive files
- `https://www.googleapis.com/auth/script.container.ui` - Display UI in container

## Runtime

- **Runtime Version**: V8
- **Timezone**: America/New_York (configurable in `appsscript.json`)
- **Exception Logging**: Stackdriver

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is private and proprietary.

## Support

For issues or questions, please open an issue in the GitHub repository.

---

**Built with Google Apps Script and Claude AI**
