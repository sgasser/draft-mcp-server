import {
  createServer,
  type IncomingMessage,
  type ServerResponse,
} from "node:http";
import { buildReviewHTML } from "./ui.js";

export interface ReviewParams {
  content: string;
  title: string;
  format: string;
  app: string;
  mcp: string | null;
}

export interface ReviewResult {
  action: "approve" | "reject";
  content: string;
  edited: boolean;
}

/**
 * Opens a local review UI in the browser and waits for the user to
 * approve or reject the draft. Returns the (possibly edited) content.
 */
export async function openReview(params: ReviewParams): Promise<ReviewResult> {
  const port = await findOpenPort();
  const html = buildReviewHTML({ ...params, port });

  return new Promise<ReviewResult>((resolve) => {
    const server = createServer((req: IncomingMessage, res: ServerResponse) => {
      // CORS headers for local fetch
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type");

      if (req.method === "OPTIONS") {
        res.writeHead(204);
        res.end();
        return;
      }

      // Serve the review UI
      if (req.method === "GET" && req.url === "/") {
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        res.end(html);
        return;
      }

      // Handle user response
      if (req.method === "POST" && req.url === "/api/respond") {
        let body = "";
        req.on("data", (chunk: Buffer) => {
          body += chunk.toString();
        });
        req.on("end", () => {
          try {
            const data = JSON.parse(body) as {
              action: string;
              content: string;
            };

            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ ok: true }));

            const edited = data.content !== params.content;

            // Close server and resolve
            server.close();
            resolve({
              action: data.action as "approve" | "reject",
              content: data.content,
              edited,
            });
          } catch {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Invalid request" }));
          }
        });
        return;
      }

      res.writeHead(404);
      res.end("Not found");
    });

    server.listen(port, "127.0.0.1", async () => {
      const url = `http://localhost:${port}`;
      console.error(`[draft-mcp] Review UI at ${url}`);

      // Open browser
      openBrowser(url);
    });

    // Timeout after 10 minutes
    const timeout = setTimeout(
      () => {
        server.close();
        resolve({
          action: "reject",
          content: params.content,
          edited: false,
        });
      },
      10 * 60 * 1000,
    );

    server.on("close", () => clearTimeout(timeout));
  });
}

async function findOpenPort(): Promise<number> {
  return new Promise((resolve) => {
    const srv = createServer();
    srv.listen(0, "127.0.0.1", () => {
      const addr = srv.address();
      const port = typeof addr === "object" && addr ? addr.port : 3456;
      srv.close(() => resolve(port));
    });
  });
}

async function openBrowser(url: string): Promise<void> {
  try {
    // Dynamic import to handle ESM
    const open = await import("open");
    await open.default(url);
  } catch {
    console.error(`[draft-mcp] Could not open browser. Visit: ${url}`);
  }
}
