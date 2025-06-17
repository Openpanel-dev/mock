# OpenPanel Mock Service

A sophisticated service that generates realistic mock traffic for OpenPanel analytics. Uses BullMQ to schedule and process visitor journeys with intelligent timing based on hourly traffic patterns.

## Features

- **Smart Visitor Spawning**: Intelligent logic that spawns visitors based on hourly traffic targets
- **Realistic User Journeys**: Multiple predefined visitor types with weighted selection
- **Random Event Timing**: Natural delays between user actions (2-15 seconds)
- **Hourly Traffic Profiles**: 24-hour visitor distribution patterns
- **BullMQ Integration**: Robust job queuing with Redis backend
- **Functional Programming**: Clean, modular architecture
- **Real-time Monitoring**: Status dashboard with traffic insights

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Cron Job      │    │  Visitor Logic   │    │ Event Templates │
│  (Every 1s)     │───▶│  (Smart Spawn)   │───▶│   (Journeys)    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  BullMQ Queue   │    │ Visitor Worker   │    │ OpenPanel API   │
│  (Redis)        │───▶│  (Process Jobs)  │───▶│   (Events)      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Visitor Journey Types

1. **Bouncer** (35% weight) - Quick exit after homepage
2. **Basic** (30% weight) - Homepage + About page
3. **Blog Reader** (25% weight) - Reads blog posts with engagement
4. **Product Explorer** (20% weight) - Explores products and demos
5. **Docs User** (15% weight) - Documentation focused journey
6. **Deep Explorer** (5% weight) - Comprehensive site exploration

## Hourly Traffic Profile

The service uses a realistic 24-hour traffic distribution:

```
Peak Hours (9-17): 12-20 visitors/hour
Evening (18-23):   6-12 visitors/hour  
Night (0-5):       1-3 visitors/hour
Morning (6-8):     3-8 visitors/hour
```

## Setup

### Prerequisites

- **Option 1 (Docker)**: Docker and Docker Compose
- **Option 2 (Local)**: Bun runtime, Redis server, OpenPanel account (optional)

### Installation

#### Option 1: Docker Setup (Recommended)

1. **Clone the repository and configure:**
   ```bash
   git clone <your-repo>
   cd openpanel-mock
   ```

2. **Create environment file (optional):**
   ```bash
   cp .env.example .env
   # Edit .env with your OpenPanel credentials
   ```

3. **Start with Docker Compose:**
   ```bash
   # Start the service with Redis
   docker-compose up -d
   
   # View logs
   docker-compose logs -f openpanel-mock
   
   # Optional: Start with Redis monitoring
   docker-compose --profile monitoring up -d
   ```

4. **Access services:**
   - OpenPanel Mock Service: Running in container
   - Redis Commander (monitoring): http://localhost:8081

#### Option 2: Local Development

1. **Install Bun runtime:**
   ```bash
   curl -fsSL https://bun.sh/install | bash
   ```

2. **Install dependencies:**
   ```bash
   bun install
   ```

3. **Start Redis server:**
   ```bash
   # macOS with Homebrew
   brew services start redis
   
   # Or with Docker
   docker run -d -p 6379:6379 redis:alpine
   ```

4. **Configure environment:**
   
   Edit `config.ts` to set your OpenPanel credentials:
   ```typescript
   openpanel: {
     clientId: 'your_client_id_here',
     clientSecret: 'your_client_secret_here',
     apiUrl: 'https://api.openpanel.dev',
     projectId: 'your_project_id_here',
   }
   ```

5. **Start the service:**
   ```bash
   bun start
   # or for development with auto-reload
   bun run dev
   ```

## Usage

### Running the Service

#### Docker
```bash
# Start everything
docker-compose up -d

# View logs in real-time
docker-compose logs -f openpanel-mock

# Stop the service
docker-compose down
```

#### Local Development
```bash
bun start
```

The service will:
- Start cron and visitor workers
- Schedule jobs to run every second
- Display a status dashboard every 30 seconds
- Show real-time visitor activity

### Sample Output

```
🚀 Starting OpenPanel Mock Service...
📊 Configuration: { redisUrl: 'redis://localhost:6379', ... }

🔧 Starting services...
🚀 [Cron Worker] Started and ready to process jobs
🚀 [Visitor Worker] Started and ready to process visitor journeys
⏰ [Scheduler] Setting up cron job to run every second...
✅ [Scheduler] Cron job scheduled successfully

✅ All services started successfully!
📈 OpenPanel Mock Service is now generating traffic...
🎯 Current hour (14:00): Target 14 visitors

🕐 [Cron] Checking if we should spawn new visitors...
👤 [Cron] Spawning new visitor: visitor_1703123456789_abc123def with 5 events
📤 [Visitor] visitor_1703123456789_abc123def - Event 1/5 sent: screen_view (/)
⏱️  [Visitor] visitor_1703123456789_abc123def - Waiting 8s before next event...
```

### Monitoring

#### Docker
- **Redis Commander**: Access web interface at http://localhost:8081 (with monitoring profile)
- **Service Logs**: `docker-compose logs -f openpanel-mock`
- **Redis Logs**: `docker-compose logs -f redis`

#### Local Development
- **Redis CLI**: Monitor job queues with `redis-cli monitor`
- **Status Dashboard**: Displayed every 30 seconds in console
- **Real-time Events**: Each visitor action is logged as it happens

## Configuration

### Hourly Traffic Patterns

Modify `CONFIG.hourlyVisitorProfile` in `config.js`:

```javascript
hourlyVisitorProfile: [
  2,   // 00:00 - Low traffic
  1,   // 01:00 - Very low
  // ... customize for your needs
  20,  // 12:00 - Lunch peak
  // ...
]
```

### Event Templates

Add new visitor journeys in `src/utils/eventTemplates.js`:

```javascript
newJourneyType: [
  { type: 'screen_view', path: '/custom-page' },
  { type: 'event', name: 'custom_action', properties: { value: 100 } },
],
```

### Timing Configuration

Adjust delays in `src/utils/eventTemplates.js`:

```javascript
export const getRandomDelay = (min = 1000, max = 8000) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};
```

## Real API Integration

To send events to actual OpenPanel API, uncomment and modify the real API method in `src/services/openpanelClient.js`:

```javascript
async sendEventToRealAPI(event) {
  const response = await fetch(`${this.apiUrl}/events`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.clientSecret}`,
    },
    body: JSON.stringify({
      project_id: this.projectId,
      ...event,
    }),
  });
  // ... handle response
}
```

## Stopping the Service

Press `Ctrl+C` for graceful shutdown. The service will:
- Stop all cron jobs
- Close worker connections
- Clean up Redis queues

## Project Structure

```
├── config.js                 # Main configuration
├── src/
│   ├── index.js              # Main entry point
│   ├── scheduler.js          # BullMQ cron job setup
│   │   ├── cronJob.js        # Cron job processor
│   │   └── visitorJob.js     # Visitor journey processor
│   ├── services/
│   │   └── openpanelClient.js # OpenPanel API client
│   └── utils/
│       ├── eventTemplates.js  # Visitor journey templates
│       └── visitorLogic.js    # Smart spawning logic
└── package.json
```

## License

MIT 