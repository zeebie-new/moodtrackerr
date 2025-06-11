import { moodEntries, type MoodEntry, type InsertMoodEntry } from "@shared/schema";

export interface IStorage {
  createMoodEntry(entry: InsertMoodEntry): Promise<MoodEntry>;
  getMoodEntries(): Promise<MoodEntry[]>;
}

export class MemStorage implements IStorage {
  private moodEntries: Map<number, MoodEntry>;
  currentId: number;

  constructor() {
    this.moodEntries = new Map();
    this.currentId = 1;
  }

  async createMoodEntry(insertEntry: InsertMoodEntry): Promise<MoodEntry> {
    const id = this.currentId++;
    const entry: MoodEntry = { 
      id,
      mood: insertEntry.mood,
      location: insertEntry.location,
      thoughts: insertEntry.thoughts || null,
      ageRange: insertEntry.ageRange || null,
      latitude: insertEntry.latitude || null,
      longitude: insertEntry.longitude || null,
      createdAt: new Date()
    };
    this.moodEntries.set(id, entry);
    return entry;
  }

  async getMoodEntries(): Promise<MoodEntry[]> {
    return Array.from(this.moodEntries.values()).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
  }
}

export const storage = new MemStorage();
