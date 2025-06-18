import { generateObject } from 'ai';
import { z } from 'zod';
import { openai } from '@ai-sdk/openai';
import { writeFile, readFile } from 'fs/promises';
import dotenv from 'dotenv';

dotenv.config();

const filepath = './src/sessions.json';

const prices = [
  9.99,
  19.99,
  29.99,
  39.99,
  49.99,
  59.99,
  69.99,
  79.99,
  89.99,
  99.99,
  109.99,
  119.99,
  129.99,
  139.99,
  149.99,
]

async function main() {
  const existingSessions = JSON.parse(await readFile('./src/sessions-old.json', 'utf-8')) as any[];
  
  const fixedSessions = existingSessions.map((session) => {
    return {
      ...session,
      events: session.events.flatMap((event) => {
        if(event.event !== 'screen_view') {
          delete event.path;
          delete event.page_title;
        }

        if(event.event === 'add_to_cart') {
          event.price = prices[Math.floor(Math.random() * prices.length)];
        }

        if(['purchase', 'remove_from_cart', 'checkout_success', 'checkout_failed'].includes(event.event)) {
          return []
        }

        if(event.event === 'checkout') {
          event.items = session.events.filter((e) => e.event === 'add_to_cart').length
          event.total_price = session.events.filter((e) => e.event === 'add_to_cart').reduce((acc, curr) => acc + curr.price, 0)
          
          const checkoutStatus = {
            event: Math.random() > 0.15 ? 'checkout_success' : 'checkout_failed',
            items: event.items,
            total_price: event.total_price,
          }

          return [event, checkoutStatus]  
        }
        
        return [event]
      }).filter(Boolean)
    }
  });

  await writeFile(filepath, JSON.stringify(fixedSessions, null, 2));
  
}

main();