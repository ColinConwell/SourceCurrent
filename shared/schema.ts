import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User accounts
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email"),
  displayName: text("display_name"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  displayName: true,
});

// Connections to external services
export const connections = pgTable("connections", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  service: text("service").notNull(), // "slack", "linear", "notion", "gdrive"
  name: text("name").notNull(),
  active: boolean("active").notNull().default(true),
  credentials: jsonb("credentials").notNull(), // Store OAuth tokens securely
  createdAt: timestamp("created_at").notNull().defaultNow(),
  lastSyncedAt: timestamp("last_synced_at"),
});

export const insertConnectionSchema = createInsertSchema(connections).pick({
  userId: true,
  service: true,
  name: true,
  active: true,
  credentials: true,
});

// Data sources
export const dataSources = pgTable("data_sources", {
  id: serial("id").primaryKey(),
  connectionId: integer("connection_id").notNull(),
  name: text("name").notNull(),
  sourceType: text("source_type").notNull(), // e.g., "slack-channel", "notion-database", etc.
  sourceId: text("source_id").notNull(), // External ID of the source
  config: jsonb("config"), // Optional configuration
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertDataSourceSchema = createInsertSchema(dataSources).pick({
  connectionId: true,
  name: true,
  sourceType: true,
  sourceId: true,
  config: true,
});

// AI Pipelines
export const pipelines = pgTable("pipelines", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  active: boolean("active").notNull().default(true),
  config: jsonb("config"), // Pipeline configuration
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertPipelineSchema = createInsertSchema(pipelines).pick({
  userId: true,
  name: true,
  description: true,
  active: true,
  config: true,
});

// Link table for pipelines and data sources
export const pipelineDataSources = pgTable("pipeline_data_sources", {
  id: serial("id").primaryKey(),
  pipelineId: integer("pipeline_id").notNull(),
  dataSourceId: integer("data_source_id").notNull(),
});

export const insertPipelineDataSourceSchema = createInsertSchema(pipelineDataSources).pick({
  pipelineId: true,
  dataSourceId: true,
});

// Activity log
export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  type: text("type").notNull(), // e.g., "data_sync", "connection_created", etc.
  description: text("description").notNull(),
  metadata: jsonb("metadata"), // Additional details
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertActivitySchema = createInsertSchema(activities).pick({
  userId: true,
  type: true,
  description: true,
  metadata: true,
});

// Export types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Connection = typeof connections.$inferSelect;
export type InsertConnection = z.infer<typeof insertConnectionSchema>;

export type DataSource = typeof dataSources.$inferSelect;
export type InsertDataSource = z.infer<typeof insertDataSourceSchema>;

export type Pipeline = typeof pipelines.$inferSelect;
export type InsertPipeline = z.infer<typeof insertPipelineSchema>;

export type PipelineDataSource = typeof pipelineDataSources.$inferSelect;
export type InsertPipelineDataSource = z.infer<typeof insertPipelineDataSourceSchema>;

export type Activity = typeof activities.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;

// Service types (for frontends)
export const serviceTypes = [
  { id: "slack", name: "Slack", icon: "slack-line", color: "#4A154B" },
  { id: "linear", name: "Linear", icon: "terminal-box-line", color: "#5E6AD2" },
  { id: "notion", name: "Notion", icon: "file-text-line", color: "#000000" },
  { id: "gdrive", name: "Google Drive", icon: "google-drive-line", color: "#0F9D58" }
] as const;

export const activityTypes = {
  DATA_SYNC: "data_sync",
  CONNECTION_CREATED: "connection_created",
  CONNECTION_UPDATED: "connection_updated",
  PIPELINE_CREATED: "pipeline_created",
  PIPELINE_UPDATED: "pipeline_updated",
  PIPELINE_DELETED: "pipeline_deleted",
  ERROR: "error"
} as const;
