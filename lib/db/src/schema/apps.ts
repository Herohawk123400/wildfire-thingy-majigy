import { pgTable, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const appsTable = pgTable("deployed_apps", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull(),
  port: integer("port").notNull(),
  status: text("status").notNull().default("starting"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAppSchema = createInsertSchema(appsTable).omit({ createdAt: true });
export type InsertApp = z.infer<typeof insertAppSchema>;
export type DeployedApp = typeof appsTable.$inferSelect;
