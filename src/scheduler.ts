import { Queue } from 'bullmq';
import { redis } from './redis';

interface QueueStatus {
  repeatableJobs: number;
  waiting: number;
  active: number;
  completed: number;
  failed: number;
}

// Create the cron queue
export const cronQueue = new Queue('cron-jobs', {
  connection: redis
});

// Setup the cron job to run every second
export const setupCronJob = async (): Promise<boolean> => {
  try {
    console.log('⏰ [Scheduler] Setting up cron job to run every second...');
    
    // Remove existing cron jobs to avoid duplicates
    await cronQueue.obliterate({ force: true });
    
    // Add repeatable job that runs every second
    await cronQueue.add(
      'check-visitor-spawn',
      {}, // No specific data needed
      {
        repeat: {
          pattern: '* * * * * *', // Every second (seconds, minutes, hours, day, month, day of week)
        },
        removeOnComplete: 5, // Keep only last 5 completed jobs
        removeOnFail: 3,     // Keep only last 3 failed jobs
      }
    );
    
    console.log('✅ [Scheduler] Cron job scheduled successfully');
    console.log('📊 [Scheduler] Will check for new visitors every second');
    
    return true;
  } catch (error) {
    console.error('❌ [Scheduler] Failed to setup cron job:', error);
    throw error;
  }
};

// Get cron job status
export const getCronStatus = async (): Promise<QueueStatus | null> => {
  try {
    const repeatableJobs = await cronQueue.getRepeatableJobs();
    const waitingJobs = await cronQueue.getWaiting();
    const activeJobs = await cronQueue.getActive();
    const completedJobs = await cronQueue.getCompleted();
    const failedJobs = await cronQueue.getFailed();
    
    return {
      repeatableJobs: repeatableJobs.length,
      waiting: waitingJobs.length,
      active: activeJobs.length,
      completed: completedJobs.length,
      failed: failedJobs.length,
    };
  } catch (error) {
    console.error('❌ [Scheduler] Failed to get cron status:', error);
    return null;
  }
};

// Stop all cron jobs
export const stopCronJob = async (): Promise<boolean> => {
  try {
    console.log('🛑 [Scheduler] Stopping cron jobs...');
    await cronQueue.obliterate({ force: true });
    console.log('✅ [Scheduler] All cron jobs stopped');
    return true;
  } catch (error) {
    console.error('❌ [Scheduler] Failed to stop cron jobs:', error);
    return false;
  }
}; 