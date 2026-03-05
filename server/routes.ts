
import type { Express } from "express";
import { createServer, type Server } from "http";
import { authRouter } from "./routes/auth";
import { connectionsRouter } from "./routes/connections";
import { dataSourcesRouter } from "./routes/data-sources";
import { pipelinesRouter } from "./routes/pipelines";
import { activitiesRouter } from "./routes/activities";
import { dataRouter } from "./routes/data";
import { environmentRouter } from "./routes/environment";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Note: integration routes are registered in index.ts to avoid double-registration
  // Register modular routers
  app.use(authRouter);
  app.use(connectionsRouter);
  app.use(dataSourcesRouter);
  app.use(pipelinesRouter);
  app.use(activitiesRouter);
  app.use(dataRouter);
  app.use(environmentRouter);

  return httpServer;
}
