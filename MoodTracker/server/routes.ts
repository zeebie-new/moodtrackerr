import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertMoodEntrySchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Create a new mood entry
  app.post('/api/mood-entries', async (req, res) => {
    try {
      const validatedData = insertMoodEntrySchema.parse(req.body);
      const entry = await storage.createMoodEntry(validatedData);
      res.json(entry);
    } catch (error) {
      res.status(400).json({ 
        message: error instanceof Error ? error.message : "Invalid data" 
      });
    }
  });

  // Get all mood entries
  app.get('/api/mood-entries', async (req, res) => {
    try {
      const entries = await storage.getMoodEntries();
      res.json(entries);
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Internal server error" 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
