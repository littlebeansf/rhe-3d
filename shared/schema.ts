import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const projects = sqliteTable("projects", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  imageDataUrl: text("image_data_url"),
  conversionMode: text("conversion_mode").notNull().default("heightmap"),
  extrusionDepth: real("extrusion_depth").notNull().default(5),
  invertHeight: integer("invert_height").notNull().default(0),
  smoothingLevel: integer("smoothing_level").notNull().default(1),
  baseThickness: real("base_thickness").notNull().default(1),
  addBase: integer("add_base").notNull().default(1),
  scaleX: real("scale_x").notNull().default(1),
  scaleY: real("scale_y").notNull().default(1),
  scaleZ: real("scale_z").notNull().default(1),
  resolution: integer("resolution").notNull().default(128),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;
