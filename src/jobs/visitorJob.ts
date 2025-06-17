import { Worker, Job } from 'bullmq';
import { getRandomDelay, type Event } from '../utils/eventTemplates.ts';
import { redis } from '../redis.ts';

import { OpenPanel } from '@openpanel/sdk';
import { CONFIG } from '../../config.ts';

interface VisitorJobData {
  visitorId: string;
  events: Event[];
  referrer?: string;
  spawnedAt: number;
  userAgent: string;
  ipAddress: string;
}

interface VisitorJobResult {
  visitorId: string;
  eventsProcessed: number;
  completedAt: number;
  duration: number;
}

// Process a single visitor's journey
export const visitorJobProcessor = async (job: Job<VisitorJobData>): Promise<VisitorJobResult> => {
  const { visitorId, events, spawnedAt, userAgent, ipAddress, referrer } = job.data;
  const op = new OpenPanel(CONFIG.openpanel);

  job.log(`IP ADDRESS: ${ipAddress}`);
  job.log(`USER AGENT: ${userAgent}`);
  job.log(`REFERER: ${referrer}`);


  op.api.addHeader('x-client-ip', ipAddress);
  op.api.addHeader('user-agent', userAgent);
  op.api.addHeader('origin', 'https://nike.com');
  
  try {
    job.log(`👤 [Visitor] Starting journey for ${visitorId} with ${events.length} events`);
    
    // Add visitor-specific properties and realistic timestamps
    
    // Process each event with realistic delays
    for (let i = 0; i < events.length; i++) {
      const {event: name, path, page_title, ...properties} = events[i];


      if(path) {
        properties.__path = path;
        delete properties.path;
      }

      if(page_title) {
        properties.__title = page_title;
        delete properties.page_title;
      }

      // Send the event to OpenPanel
      await op.track(name, {
        ...properties,
        __referrer: referrer === 'direct' ? undefined : referrer,
      });
      
      // Wait before sending the next event (except for the last one)
      if (i < events.length - 1) {
        const delay = getRandomDelay(200, 6000); // 2-15 seconds between events
        job.log(`⏱️  [Visitor] ${visitorId} - Waiting ${Math.round(delay/1000)}s before next event...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    job.log(`✅ [Visitor] Journey completed for ${visitorId}`);
    
    return {
      visitorId,
      eventsProcessed: events.length,
      completedAt: Date.now(),
      duration: Date.now() - spawnedAt,
    };
    
  } catch (error) {
    job.log(`❌ [Visitor] Error processing journey for ${visitorId}: ${error}`);
    throw error;
  }
};

// Create and start the visitor job worker
export const startVisitorWorker = (): Worker => {
  const visitorWorker = new Worker('visitor-jobs', visitorJobProcessor, {
    connection: redis,
    concurrency: 10, // Process up to 10 visitors concurrently
  });

  visitorWorker.on('completed', (job, result) => {
    console.log(`✅ [Visitor Worker] ${result.visitorId} completed in ${Math.round(result.duration/1000)}s`);
  });

  visitorWorker.on('failed', (job, err) => {
    console.error(`❌ [Visitor Worker] Job ${job?.id} failed:`, err.message);
  });

  visitorWorker.on('progress', (job, progress) => {
    console.log(`🔄 [Visitor Worker] Job ${job.id} progress: ${progress}%`);
  });

  console.log('🚀 [Visitor Worker] Started and ready to process visitor journeys');
  return visitorWorker;
}; 