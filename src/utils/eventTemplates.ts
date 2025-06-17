import { readFile } from "fs/promises";

export type Event = {
  event: string;
} & Record<string, any>;

// Utility functions
export const getRandomJourney = async (): Promise<{
  events: Event[];
  referrer?: string
}> => {
  const sessions = JSON.parse(await readFile('./src/sessions.json', 'utf8'));
  return sessions[Math.floor(Math.random() * sessions.length)];
};

export const getRandomDelay = (min: number = 200, max: number = 8000): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}; 