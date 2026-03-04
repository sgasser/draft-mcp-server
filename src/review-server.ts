import {
  createServer,
  type IncomingMessage,
  type ServerResponse,
} from "node:http";
import { z } from "zod";
import { buildReviewHTML } from "./ui.js";

const ResponseSchema = z.object({
  action: z.enum(["approve", "reject"]),
  content: z.string(),
  feedback: z.string().optional(),
});

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
  feedback?: string;
}

export async function openReview(params: ReviewParams): Promise<ReviewResult> {
  const port = await findOpenPort();
  const html = buildReviewHTML({ ...params, port });

  return new Promise<ReviewResult>((resolve) => {
    const server = createServer((req: IncomingMessage, res: ServerResponse) => {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type");

      if (req.method === "OPTIONS") {
        res.writeHead(204);
        res.end();
        return;
      }

      if (req.method === "GET" && req.url === "/") {
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        res.end(html);
        return;
      }

      if (req.method === "POST" && req.url === "/api/respond") {
        let body = "";
        req.on("data", (chunk: Buffer) => {
          body += chunk.toString();
        });
        req.on("end", () => {
          const parsed = ResponseSchema.safeParse(JSON.parse(body));
          if (!parsed.success) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Invalid request" }));
            return;
          }

          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ ok: true }));

          server.close();
          resolve({
            action: parsed.data.action,
            content: parsed.data.content,
            edited: parsed.data.content !== params.content,
            feedback: parsed.data.feedback,
          });
        });
        return;
      }

      res.writeHead(404);
      res.end("Not found");
    });

    server.listen(port, "127.0.0.1", async () => {
      const url = `http://localhost:${port}`;
      console.error(`[draft-mcp] Review UI at ${url}`);

      openBrowser(url);
    });

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
    const open = await import("open");
    await open.default(url);
  } catch {
    console.error(`[draft-mcp] Could not open browser. Visit: ${url}`);
  }
}
