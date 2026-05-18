import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { insertProjectSchema } from "@shared/schema";
import { z } from "zod";

export function registerRoutes(httpServer: Server, app: Express) {
  // List all projects
  app.get("/api/projects", (_req, res) => {
    const list = storage.listProjects();
    res.json(list);
  });

  // Get single project
  app.get("/api/projects/:id", (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });
    const p = storage.getProject(id);
    if (!p) return res.status(404).json({ error: "Not found" });
    res.json(p);
  });

  // Create project
  app.post("/api/projects", (req, res) => {
    const parsed = insertProjectSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    const p = storage.createProject(parsed.data);
    res.status(201).json(p);
  });

  // Update project
  app.patch("/api/projects/:id", (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });
    const partial = insertProjectSchema.partial().safeParse(req.body);
    if (!partial.success) return res.status(400).json({ error: partial.error.flatten() });
    const p = storage.updateProject(id, partial.data);
    if (!p) return res.status(404).json({ error: "Not found" });
    res.json(p);
  });

  // Delete project
  app.delete("/api/projects/:id", (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });
    const ok = storage.deleteProject(id);
    if (!ok) return res.status(404).json({ error: "Not found" });
    res.json({ success: true });
  });
}
