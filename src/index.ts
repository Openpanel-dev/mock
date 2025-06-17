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

// Display status dashboard
const showStatus = async () => {
  const currentHour = new Date().getHours();
  const targetVisitors = getTargetVisitorsForHour(currentHour);
  const currentVisitors = await getCurrentHourVisitorCount();
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