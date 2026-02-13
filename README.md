# draft-mcp-server

Review AI-generated drafts before they go anywhere.

When your AI assistant writes a PR description, ticket, or message, this MCP server opens a review window first. You see a live preview, make edits if needed, and approve or reject.

![Review UI Demo](demo.gif)

## Setup

**Claude Code:**
```bash
claude mcp add draft-mcp-server -- npx draft-mcp-server
```

**Claude Desktop** (`claude_desktop_config.json`):
```json
{
  "mcpServers": {
    "draft-mcp-server": {
      "command": "npx",
      "args": ["draft-mcp-server"]
    }
  }
}
```

## Usage

Ask your assistant to draft something:

```
"Draft a PR description for the auth changes"
"Write a Linear ticket for the login bug"
"Draft a Slack message about the release"
```

The review window opens. Edit the text on the left, see the preview on the right. Click **Approve** or press `⌘ Enter`.

## Keyboard shortcuts

- `⌘ Enter` / `Ctrl Enter` — Approve
- `Esc` — Reject
- `⌘ C` / `Ctrl C` — Copy to clipboard

## License

MIT
