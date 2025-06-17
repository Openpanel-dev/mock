import { CONFIG } from '../../config.ts';
import { redis } from '../redis.ts';

// Redis keys for tracking visitor data
const VISITOR_COUNT_KEY = 'current_hour_visitors:count';
const LAST_RESET_HOUR_KEY = 'current_hour_visitors:last_reset_hour';

// Reset visitor count every hour
const resetVisitorCount = async (): Promise<void> => {
  const currentHour = new Date().getHours();
  const lastResetHour = await redis.get(LAST_RESET_HOUR_KEY);
  
  if (parseInt(lastResetHour || '0') !== currentHour) {
    await redis.del(VISITOR_COUNT_KEY);
    await redis.set(LAST_RESET_HOUR_KEY, currentHour);
    await redis.set(VISITOR_COUNT_KEY, 0);
  }
};

// Get target visitors for current hour
export const getTargetVisitorsForHour = (hour: number = new Date().getHours()): number => {
  return CONFIG.hourlyVisitorProfile[hour];
};

// Get current visitor count for this hour
export const getCurrentHourVisitorCount = async (): Promise<number> => {
  await resetVisitorCount();
  const count = await redis.get(VISITOR_COUNT_KEY);
  return parseInt(count || '0');
};

// Increment visitor count
export const incrementVisitorCount = async (): Promise<void> => {
  await resetVisitorCount();
  await redis.incr(VISITOR_COUNT_KEY);
};

// Smart logic to determine if we should spawn a new visitor
export const shouldSpawnVisitor = async (): Promise<boolean> => {
  const currentHour = new Date().getHours();
  const targetVisitors = getTargetVisitorsForHour(currentHour);
  const currentVisitors = await getCurrentHourVisitorCount();
  
  // If we've already hit our target for this hour, don't spawn
  if (currentVisitors >= targetVisitors) {
    return false;
  }
  
  // Calculate how many visitors we need
  const visitorsNeeded = targetVisitors - currentVisitors;
  
  // Get remaining seconds in current hour
  const now = new Date();
  const nextHour = new Date(now);
  nextHour.setHours(now.getHours() + 1, 0, 0, 0);
  const remainingSeconds = Math.floor((nextHour.getTime() - now.getTime()) / 1000);
  
  // Calculate probability based on remaining time and needed visitors
  // If we need 10 visitors and have 3600 seconds left, probability = 10/3600 ≈ 0.28%
  const baseSpawnRate = visitorsNeeded / remainingSeconds;
  
  // Add some randomness and smoothing
  const jitterFactor = 0.5 + (Math.random() * 1.0); // 0.5 to 1.5x multiplier
  const adjustedSpawnRate = Math.min(baseSpawnRate * jitterFactor, 0.1); // Cap at 10%
  
  const shouldSpawn = Math.random() < adjustedSpawnRate;
  
  console.log({
    currentHour,
    targetVisitors,
    currentVisitors,
    visitorsNeeded,
    remainingSeconds,
    baseSpawnRate: baseSpawnRate.toFixed(6),
    adjustedSpawnRate: adjustedSpawnRate.toFixed(6),
    shouldSpawn,
  });
  
  return shouldSpawn;
};

// Generate a unique visitor ID
export const generateVisitorId = (): string => {
  return `visitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Calculate realistic session duration (in seconds)
export const getSessionDuration = (): number => {
  // Most sessions are short, but some are longer
  // Using exponential distribution with some variance
  const rand = Math.random();
  
  if (rand < 0.4) {
    // 40% quick sessions (10-60 seconds)
    return 10 + Math.random() * 50;
  } else if (rand < 0.8) {
    // 40% medium sessions (1-10 minutes)
    return 60 + Math.random() * 540;
  } else {
    // 20% long sessions (10-30 minutes)
    return 600 + Math.random() * 1200;
  }
}; 