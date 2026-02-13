# draft-mcp-server

Review AI-generated drafts before they go anywhere.

When Claude writes a PR description, Linear ticket, or any text, this MCP server opens a review window first. You see a live preview, make edits if needed, and approve or reject.

## How it works

```
You: "Draft a PR description for the auth feature"

→ Browser opens with editor + live preview
→ You review, tweak if needed, click Approve
→ Claude creates the PR with your approved text
```

If you have the GitHub MCP server installed, Claude sends the text there automatically. Otherwise, the text is copied to your clipboard.

## Setup

```bash
git clone https://github.com/stefangasser/draft-mcp-server.git
cd draft-mcp-server
npm install
npm run build
```

Add to Claude Code:

```bash
claude mcp add draft-mcp-server node /path/to/draft-mcp-server/dist/index.js
```

## Usage

Just ask Claude to draft something:

```
"Draft a PR description for the auth changes"
"Write a Linear ticket for the login bug"
"Draft a Slack message about the release"
```

The review window opens. Edit the text on the left, see the preview on the right. When ready, click **Approve** or press `⌘ Enter`.

## The review window

- **Editor** (left) — edit the raw text
- **Preview** (right) — see rendered Markdown in real-time
- **Approve** — accept and continue (creates PR, posts ticket, or copies to clipboard)
- **Reject** — go back and tell Claude what to change
- **Copy** — copy to clipboard without closing

Keyboard shortcuts: `⌘ Enter` to approve, `Esc` to reject.

## License

MIT
