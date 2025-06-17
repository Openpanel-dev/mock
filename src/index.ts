import { setupCronJob, getCronStatus, stopCronJob } from './scheduler.ts';
import { startCronWorker } from './jobs/cronJob.ts';
import { startVisitorWorker } from './jobs/visitorJob.ts';
import { CONFIG } from '../config.ts';
import { getTargetVisitorsForHour, getCurrentHourVisitorCount } from './utils/visitorLogic.ts';
import { startDashboard } from './dashboard.ts';
import type { Worker } from 'bullmq';

console.log('🚀 Starting OpenPanel Mock Service...');
console.log('📊 Configuration:', CONFIG);

// Track service state
let cronWorker: Worker | null = null;
let visitorWorker: Worker | null = null;
let isRunning = false;

// Start all services
const startServices = async () => {
  try {
    console.log('\n🔧 Starting services...');
    
    // Start workers
    cronWorker = startCronWorker();
    visitorWorker = startVisitorWorker();
    
    // Setup cron job
    await setupCronJob();
    
    // Start dashboard
    await startDashboard();
    
    isRunning = true;
    console.log('\n✅ All services started successfully!');
    console.log('📈 OpenPanel Mock Service is now generating traffic...');
    
    // Show current hour info
    const currentHour = new Date().getHours();
    const targetVisitors = getTargetVisitorsForHour(currentHour);
    console.log(`🎯 Current hour (${currentHour}:00): Target ${targetVisitors} visitors`);
    
  } catch (error) {
    console.error('❌ Failed to start services:', error);
    process.exit(1);
  }
};

// Stop all services
const stopServices = async () => {
  try {
    console.log('\n🛑 Stopping services...');
    
    isRunning = false;
    
    // Stop cron jobs
    await stopCronJob();
    
    // Close workers
    if (cronWorker) {
      await cronWorker.close();
      cronWorker = null;
    }
    
    if (visitorWorker) {
      await visitorWorker.close();
      visitorWorker = null;
    }
    
    console.log('✅ All services stopped');
  } catch (error) {
    console.error('❌ Error stopping services:', error);
  }
};

// Display status dashboard
const showStatus = async () => {
  const currentHour = new Date().getHours();
  const targetVisitors = getTargetVisitorsForHour(currentHour);
  const currentVisitors = getCurrentHourVisitorCount();
  const cronStatus = await getCronStatus();
  
  console.log('\n📊 === STATUS DASHBOARD ===');
  console.log(`⏰ Current time: ${new Date().toLocaleTimeString()}`);
  console.log(`🎯 Hour ${currentHour}: ${currentVisitors}/${targetVisitors} visitors spawned`);
  console.log(`🔄 Service status: ${isRunning ? '🟢 Running' : '🔴 Stopped'}`);
  
  if (cronStatus) {
    console.log(`📋 Cron jobs: ${cronStatus.repeatableJobs} scheduled, ${cronStatus.active} active`);
    console.log(`📈 Completed: ${cronStatus.completed}, Failed: ${cronStatus.failed}`);
  }
  
  console.log('========================\n');
};

// Handle graceful shutdown
const gracefulShutdown = async (signal: string): Promise<void> => {
  console.log(`\n📡 Received ${signal}, shutting down gracefully...`);
  await stopServices();
  process.exit(0);
};

// Setup signal handlers
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// Status display interval
let statusInterval = null;

// Main execution
const main = async () => {
  try {
    await startServices();
    
    // Show status every 30 seconds
    statusInterval = setInterval(showStatus, 30000);
    
    // Show initial status
    setTimeout(showStatus, 3000);
    
    console.log('\n💡 Tips:');
    console.log('   - Press Ctrl+C to stop the service');
    console.log('   - Check Redis for job queues: redis-cli monitor');
    console.log('   - Adjust hourly profiles in config.js');
    console.log('   - Events are currently logged to console (replace with real API calls)');
    
  } catch (error) {
    console.error('❌ Failed to start application:', error);
    process.exit(1);
  }
};

// Start the application
main(); 