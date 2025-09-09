import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { initializeDatabase } from "./database";
import { runSeeder } from "./seeder";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

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

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Inicializa o banco de dados antes de registrar as rotas
  let dbInitialized = await initializeDatabase();
  if (!dbInitialized) {
    log("⚠️  Falha na conexão inicial com o banco. Iniciando servidor com funcionalidades limitadas.");
    log("🔄 Tentando reconectar automaticamente a cada 30 segundos...");
    
    // Tentar reconectar a cada 30 segundos
    const reconnectInterval = setInterval(async () => {
      log("🔄 Tentando reconectar ao banco...");
      dbInitialized = await initializeDatabase();
      if (dbInitialized) {
        log("✅ Reconexão com banco bem-sucedida!");
        clearInterval(reconnectInterval);
        
        // Executar seeder após reconexão bem-sucedida
        try {
          await runSeeder();
        } catch (error) {
          log(`❌ Erro ao executar seeder: ${error}`);
        }
      }
    }, 30000);
  } else {
    // Executar seeder se banco já estiver conectado
    try {
      await runSeeder();
    } catch (error) {
      log(`❌ Erro ao executar seeder: ${error}`);
    }
  }
  
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
