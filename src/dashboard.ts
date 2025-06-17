import express, { Request, Response } from 'express';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { cronQueue } from './scheduler';
import { visitorQueue } from './jobs/cronJob';

const PORT = process.env.DASHBOARD_PORT || 3000;

// Create Express app
const app = express();

// Create BullBoard server adapter
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

// Create BullBoard with queue adapters
createBullBoard({
  queues: [
    new BullMQAdapter(cronQueue),
    new BullMQAdapter(visitorQueue),
  ],
  serverAdapter: serverAdapter,
});

// Mount BullBoard
app.use('/admin/queues', serverAdapter.getRouter());

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    queues: {
      cron: 'active',
      visitor: 'active'
    }
  });
});

// Root redirect
app.get('/', (req: Request, res: Response) => {
  res.redirect('/admin/queues');
});

// Root redirect
app.get('/client', (req: Request, res: Response) => {
  res.json({
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
  });
});

// Start dashboard server
export const startDashboard = (): Promise<void> => {
  return new Promise((resolve) => {
    app.listen(PORT, () => {
      console.log(`📊 [Dashboard] BullBoard running at http://localhost:${PORT}/admin/queues`);
      console.log(`🏥 [Dashboard] Health check at http://localhost:${PORT}/health`);
      resolve();
    });
  });
}; 