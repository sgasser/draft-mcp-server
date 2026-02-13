#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { openReview } from "./review-server.js";

const server = new McpServer({
  name: "draft-mcp-server",
  version: "0.1.0",
});

server.registerTool(
  "review_draft",
  {
    title: "Review Draft",
    description: `Let the user review and edit a draft before it goes anywhere.

When creating PR descriptions, Linear tickets, Slack messages, or emails: call this tool first, then use the approved content with the target tool.

Opens a browser window with an editor and live preview. Blocks until the user approves or rejects.

On approve: proceed with the next step (create PR, post ticket, etc.) or copy to clipboard.
On reject: ask the user what they'd like to change.

Examples:
  - review_draft(content="## Summary\\n...", title="PR: Add auth", app="github", mcp="github:create_pull_request")
  - review_draft(content="Bug description...", title="Login bug", app="linear", mcp="linear:create_issue")
  - review_draft(content="Hello team...", title="Release announcement", app="slack")`,
    inputSchema: {
      content: z
        .string()
        .min(1, "Content cannot be empty")
        .describe("The full draft text to review"),
      title: z
        .string()
        .min(1)
        .max(200)
        .describe("Short description of what this draft is"),
      format: z
        .enum(["md", "html", "plain"])
        .default("md")
        .describe("Content format: md, html, or plain"),
      app: z
        .enum(["github", "linear", "slack", "email", "generic"])
        .default("generic")
        .describe("Target app for UI context hints"),
      mcp: z
        .string()
        .optional()
        .describe(
          "MCP tool to call next if approved (e.g. 'github:create_pull_request')",
        ),
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  async (params) => {
    const { content, title, format, app, mcp } = params;

    console.error(`[draft-mcp] Opening review for: ${title}`);

    const result = await openReview({
      content,
      title,
      format,
      app,
      mcp: mcp ?? null,
    });

    const output = {
      action: result.action,
      content: result.content,
      edited: result.edited,
      next_mcp: mcp ?? null,
    };

    const statusEmoji = result.action === "approve" ? "✓" : "✗";
    const editNote = result.edited ? " (edited by user)" : "";

    const textSummary = [
      `${statusEmoji} Draft ${result.action}ed${editNote}`,
      "",
      result.action === "approve" && mcp
        ? `→ Proceed with: ${mcp}`
        : result.action === "approve"
          ? "→ Content copied to clipboard"
          : "→ User rejected the draft, ask what to change",
      "",
      "--- Final content ---",
      result.content,
    ].join("\n");

    return {
      content: [{ type: "text" as const, text: textSummary }],
      structuredContent: output,
    };
  },
);

async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("[draft-mcp] Server running on stdio");
}

main().catch((error: unknown) => {
  console.error("[draft-mcp] Fatal error:", error);
  process.exit(1);
});
