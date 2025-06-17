import { Queue, Worker, Job } from 'bullmq';
import { shouldSpawnVisitor, incrementVisitorCount, generateVisitorId } from '../utils/visitorLogic.ts';
import { getRandomJourney } from '../utils/eventTemplates.ts';
import { redis } from '../redis.ts';
import { faker } from '@faker-js/faker';

interface CronJobResult {
  spawnedVisitor: boolean;
}

// Create queue for visitor jobs
export const visitorQueue = new Queue('visitor-jobs', {
  connection: redis
});

const getUserAgent = () => {
  let agent = faker.internet.userAgent();
  while(agent.match(/Bot/)) {
    agent = faker.internet.userAgent();
  }
  return agent;
}

// Cron job processor
export const cronJobProcessor = async (job: Job): Promise<CronJobResult> => {
  try {
    job.log('🕐 [Cron] Checking if we should spawn new visitors...');
    
    const shouldSpawn = await shouldSpawnVisitor();
    
    if (shouldSpawn) {
      // Increment our visitor count
      await incrementVisitorCount();
      
      const visitorId = generateVisitorId();
      const eventJourney = await getRandomJourney();
      
      job.log(`👤 [Cron] Spawning new visitor: ${visitorId} with ${eventJourney.events.length} events`);
      
      // Add visitor job to the queue
      await visitorQueue.add('process-visitor', {
        visitorId,
        spawnedAt: Date.now(),
        events: eventJourney.events,
        referrer: eventJourney.referrer,
        userAgent: getUserAgent(),
        ipAddress: faker.internet.ip(),
      }, {
        // Add some randomization to when the job starts (0-30 seconds delay)
        delay: Math.floor(Math.random() * 30000),
        // Remove job from queue after completion to keep it clean
        removeOnComplete: 10,
        removeOnFail: 5,
      });
      
      job.log(`✅ [Cron] Visitor job queued for ${visitorId}`);
    } else {
      job.log('⏭️  [Cron] No new visitors needed at this time');
    }
    
    return { spawnedVisitor: shouldSpawn };
  } catch (error) {
    job.log(`❌ [Cron] Error in cron job: ${error}`);
    throw error;
  }
};

// Create and start the cron job worker
export const startCronWorker = (): Worker => {
  const cronWorker = new Worker('cron-jobs', cronJobProcessor, {
    connection: redis,
    concurrency: 1, // Only one cron job at a time
  });

  cronWorker.on('completed', (job: Job) => {
    console.log(`✅ [Cron Worker] Job ${job.id} completed`);
  });

  cronWorker.on('failed', (job: Job | undefined, err: Error) => {
    console.error(`❌ [Cron Worker] Job ${job?.id} failed:`, err.message);
  });

  console.log('🚀 [Cron Worker] Started and ready to process jobs');
  return cronWorker;
}; 