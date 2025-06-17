import { config } from 'dotenv';
config();

interface OpenpanelConfig {
  clientId: string;
  clientSecret: string;
  apiUrl: string;
}

interface RedisConfig {
  url: string;
}

interface Config {
  redis: RedisConfig;
  openpanel: OpenpanelConfig;
  hourlyVisitorProfile: number[];
}

const multiplier = 10

export const CONFIG: Config = {
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
  openpanel: {
    clientId: process.env.OPENPANEL_CLIENT_ID || 'dumb',
    clientSecret: process.env.OPENPANEL_CLIENT_SECRET || 'dumb',
    apiUrl: process.env.OPENPANEL_API_URL || 'https://api.openpanel.dev',
  },
  // Hourly visitor distribution (24 hours, 0-23)
  // Numbers represent target unique visitors per hour
  hourlyVisitorProfile: [
    multiplier * 20,   // 00:00 - Low traffic
    multiplier * 10,   // 01:00 - Very low
    multiplier * 10,   // 02:00 - Very low
    multiplier * 10,   // 03:00 - Very low
    multiplier * 10,   // 04:00 - Very low
    multiplier * 20,   // 05:00 - Low
    multiplier * 30,   // 06:00 - Early morning
    multiplier * 50,   // 07:00 - Morning
    multiplier * 80,   // 08:00 - Work starts
    multiplier * 120,  // 09:00 - Peak morning
    multiplier * 150,  // 10:00 - Peak
    multiplier * 180,  // 11:00 - Peak
    multiplier * 200,  // 12:00 - Lunch peak
    multiplier * 160,  // 13:00 - Post lunch
    multiplier * 140,  // 14:00 - Afternoon
    multiplier * 160,  // 15:00 - Mid afternoon
    multiplier * 180,  // 16:00 - Late afternoon
    multiplier * 150,  // 17:00 - End of work
    multiplier * 120,  // 18:00 - Evening
    multiplier * 100,  // 19:00 - Evening
    multiplier * 80,   // 20:00 - Evening
    multiplier * 60,   // 21:00 - Late evening
    multiplier * 40,   // 22:00 - Night
    multiplier * 30,   // 23:00 - Late night
  ],
}; 