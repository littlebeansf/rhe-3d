import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { projects, type Project, type InsertProject } from "@shared/schema";
import { eq, desc } from "drizzle-orm";

const sqlite = new Database("data.db");
const db = drizzle(sqlite);

// Create tables
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    image_data_url TEXT,
    conversion_mode TEXT NOT NULL DEFAULT 'heightmap',
    extrusion_depth REAL NOT NULL DEFAULT 5,
    invert_height INTEGER NOT NULL DEFAULT 0,
    smoothing_level INTEGER NOT NULL DEFAULT 1,
    base_thickness REAL NOT NULL DEFAULT 1,
    add_base INTEGER NOT NULL DEFAULT 1,
    scale_x REAL NOT NULL DEFAULT 1,
    scale_y REAL NOT NULL DEFAULT 1,
    scale_z REAL NOT NULL DEFAULT 1,
    resolution INTEGER NOT NULL DEFAULT 128,
    created_at INTEGER,
    updated_at INTEGER
  )
`);

export interface IStorage {
  listProjects(): Project[];
  getProject(id: number): Project | undefined;
  createProject(data: InsertProject): Project;
  updateProject(id: number, data: Partial<InsertProject>): Project | undefined;
  deleteProject(id: number): boolean;
}

export const storage: IStorage = {
  listProjects() {
    return db.select().from(projects).orderBy(desc(projects.updatedAt)).all();
  },
  getProject(id) {
    return db.select().from(projects).where(eq(projects.id, id)).get();
  },
  createProject(data) {
    const now = new Date();
    return db.insert(projects).values({ ...data, createdAt: now, updatedAt: now }).returning().get();
  },
  updateProject(id, data) {
    const now = new Date();
    return db.update(projects).set({ ...data, updatedAt: now }).where(eq(projects.id, id)).returning().get();
  },
  deleteProject(id) {
    const result = db.delete(projects).where(eq(projects.id, id)).run();
    return result.changes > 0;
  },
};
