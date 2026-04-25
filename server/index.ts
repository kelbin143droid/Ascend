import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";

const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use((req, res, next) => {
  const origin = req.headers.origin as string | undefined;
  const allowedOrigins = new Set([
    "https://localhost",
    "http://localhost",
    "capacitor://localhost",
    "ionic://localhost",
    "https://solo-quest-rpg.replit.app",
  ]);
  const isReplitDev = origin?.endsWith(".replit.dev") || origin?.endsWith(".repl.co");
  const isLocalDev = origin?.startsWith("http://localhost:") || origin?.startsWith("http://127.0.0.1:");

  if (origin && (allowedOrigins.has(origin) || isReplitDev || isLocalDev)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Credentials", "true");
  }
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    req.headers["access-control-request-headers"] || "Content-Type, Authorization",
  );
  res.setHeader("Access-Control-Max-Age", "86400");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }
  next();
});

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  await registerRoutes(httpServer, app);

  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error("Internal Server Error:", err);

    if (res.headersSent) {
      return next(err);
    }

    return res.status(status).json({ message });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || "5000", 10);
  // `reusePort` is a Linux-only socket option — Windows throws ENOTSUP.
  const listenOpts: { port: number; host: string; reusePort?: boolean } = {
    port,
    host: "0.0.0.0",
  };
  if (process.platform !== "win32") {
    listenOpts.reusePort = true;
  }
  httpServer.listen(
    listenOpts,
    () => {
      log(`serving on port ${port}`);
      
      // Print Replit URL for preview
      const replitSlug = process.env.REPL_SLUG;
      const replitOwner = process.env.REPL_OWNER;
      if (replitSlug && replitOwner) {
        console.log(`\n========================================`);
        console.log(`  SERVER RUNNING`);
        console.log(`========================================`);
        console.log(`  Local:    http://localhost:${port}`);
        console.log(`  Preview:  Open the Webview tab in Replit`);
        console.log(`========================================`);
        console.log(`\n  API Endpoints:`);
        console.log(`  - GET /api/weekly-analytics/:userId?week_start_date=YYYY-MM-DD`);
        console.log(`  - GET /api/roles/:userId`);
        console.log(`  - GET /api/weekly-goals/:userId`);
        console.log(`  - GET /api/tasks/:userId`);
        console.log(`========================================\n`);
      }
    },
  );
})();
