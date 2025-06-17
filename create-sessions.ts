import { generateObject } from 'ai';
import { z } from 'zod';
import { openai } from '@ai-sdk/openai';
import { writeFile, readFile } from 'fs/promises';
import dotenv from 'dotenv';

dotenv.config();

const filepath = './src/sessions.json';
const schema = z.object({
  referrer: z.string().describe('The referrer of the user.'),
  events: z.array(z.union([
    z.object({
      event: z.literal('screen_view').describe('Should only be `screen_view`'),
      path: z.string().describe('The path the user takes to trigger the event.'),
      page_title: z.string().describe('The title of the page the user is on.'),
    }),
    z.object({
      event: z.string().describe('The event that the user triggers, should NOT be `screen_view`'),
    }).passthrough().describe('Other events with optional additional properties'),
  ]))
})

const patterns = [
  'Bounced visitor - lands on the site and leaves immediately without interaction.',
  'Bounced visitor - Should just visit: "/',
  'Bounced visitor - Should just visit: "/products/sneakers/nike-air-max-2021"',
  'Bounced visitor - Should just visit: "/products/sneakers"',
  'Bounced visitor - Should just visit: "/blog/how-to-choose-the-right-shoes"',
  'Bounced visitor - Should just visit: "/products/shoes/running-shoes"',
  'Bounced visitor - Should just visit: "/blog/shoe-care-tips"',
  'Bounced visitor - Should just visit: "/products/shoes"',
  'Bounced visitor - Should just visit: "/products/sandals/adidas-adilette"',
  'Bounced visitor - Should just visit: "/products/sneakers/nike-air-max-2021/details"',
  'Bounced visitor - Should just visit: "/support/return-policy"',
  'Bounced visitor - Should just visit: "/products/sneakers/adidas-ultraboost-21"',
  'Bounced visitor - Should just visit: "/support/faq"',
  'Bounced visitor - Should just visit: "/support/shipping-policy"',
  'Bounced visitor - Should just visit: "/products/sandals"',
  'Bounced visitor - Should just visit: "/products"',
  'Bounced visitor - Should just visit: "/products/shoes/casual-shoes"',
  'Bounced visitor - Should just visit: "/blog/how-to-choose-the-perfect-shoes"',
  'Bounced visitor - Should just visit: "/cart"',
  'Bounced visitor - Should just visit: "/products/footwear/sneakers"',
  'Bounced visitor - Should just visit: "/blog/how-to-choose-the-right-sneakers"',
  'Bounced visitor - Should just visit: "/products/shoes/running-shoes/details"',
  'Bounced visitor - Should just visit: "/blog/best-running-shoes-2023"',
  'Bounced visitor - Should just visit: "/products/shoes/running-shoes/nike-air-max-2021"',
  'Bounced visitor - Should just visit: "/products/boots/timberland-classic-6-inch"',
  'Bounced visitor - Should just visit: "/blog/top-5-sandals-for-summer"',
  'Bounced visitor - Should just visit: "/products/shoes/running-shoes/adidas-ultraboost-21"',
  'Bounced visitor - Should just visit: "/products/shoes/athletic-shoes"',
  'Bounced visitor - Should just visit: "/products/shoes/athletic-shoes/details"',
  'Bounced visitor - Should just visit: "/products/sale"',
  'Bounced visitor - Should just visit: "/products/running-shoes"',
  'Bounced visitor - Should just visit: "/blog/how-to-choose-the-right-shoe-size"',
  'Visitor just browsing - casually looking at product listings without any clear intention.',
  'Product enthusiast - spends time exploring multiple products in detail (images, reviews, specs) but doesn\'t convert.',
  'Product viewer turned buyer - views several products and completes a purchase.',
  'Cart abandoner - adds items to the cart but leaves before checkout.',
  'Blog/article reader - primarily visits blog content (e.g., “Best running shoes for flat feet”).',
  'Discount hunter - checks sale and promo pages, filters by price or discount.',
  'Size checker - visits several product pages, but only interacts with size charts or availability per size.',
  'Repeat visitor who converts - came back after an earlier session and completes a purchase.',
  'Loyal returning customer - logs in, reorders or buys new shoes based on purchase history.',
  'Newsletter subscriber - signs up for the newsletter but doesn\'t buy anything.',
  'Account creator without purchase - registers or signs up but does not complete a transaction.',
  'Coupon code failer - tries an invalid or expired discount code and abandons the purchase.',
  'Referral visitor - comes from a blog, influencer, or partner site and engages with a specific product.',
  'Search-focused user - uses the search bar extensively but doesn\'t convert.',
  'Filter-heavy user - uses multiple filters (size, brand, color, price) to narrow choices.',
  'Chat engager - interacts with live chat or support for sizing, delivery, or return questions.',
  'Return visitor with product regret - looks up return policy or tracks an earlier order.',
  'Mobile visitor struggling with UX - navigates a few pages but leaves due to friction.',
  'Wishlist user - adds multiple items to a wishlist or favorites list but makes no purchase.',
  'Quick buyer - lands on a product page and checks out within a few minutes.',
  'Influencer follower - lands from Instagram or TikTok and buys a recommended shoe.',
  'Store locator user - visits store locator page but doesn’t browse products.',
  'Gift shopper - visits gift guide or searches terms like “gift” or “present”, adds to cart.',
  'First-time buyer with discount - uses welcome discount and completes purchase.',
  'Buyer who uses alternative payment - checks out with Klarna, PayPal, etc.',
  'Exit-intent triggered - tries to leave, gets a popup, stays or engages.',
  'Product comparison user - opens multiple product tabs or toggles comparison features.',
  'FAQ visitor - spends time reading return or delivery FAQs but doesn’t browse products.',
  'High-bounce ad clicker - comes from a paid ad and bounces quickly.',
  'Product reviewer - leaves a review after purchase.',
  'Gift card redeemer - visits site to use a gift card or store credit.',
  'Out-of-stock seeker - searches for a product that is currently unavailable.',
  'Social sharer - uses share buttons or copies product URL to share.',
  'Price tracker - repeatedly visits a product page waiting for price drop.',
  'International visitor - visits from another country and checks shipping policy.',
  'Visitor adding to cart for later - adds items to cart as a reminder, not for immediate checkout.',
  'Early-morning shopper - visits before 6 a.m. and browses quietly.',
  'Last-minute shopper - searches for fast shipping or next-day delivery.',
  'Bundle buyer - adds socks, cleaner, or accessories along with shoes.',
  'Free shipping threshold optimizer - adds extra items just to qualify for free shipping.',
  'Shoes by activity - visits by category like hiking, gym, casual, work.',
  'Niche material lover - filters by suede, vegan leather, waterproof.',
  'Page refresher - reloads product page multiple times (could indicate interest or site issue).',
  'Product video viewer - watches embedded product videos but doesn’t scroll further.',
  'High engagement but no cart - scrolls and clicks around, but doesn’t add anything.',
  'Second-opinion seeker - clicks “share” then returns days later and buys.',
  'Return policy checker - visits return policy before viewing any products.',
  'Push notification subscriber - opts in to push messages, then leaves.',
  'Logged-in non-buyer - signs in but doesn’t buy anything new.',
  'Product page exit - consistently exits site from product pages.',
  'New collection explorer - visits homepage and clicks on “new arrivals” only.',
  'Review reader - scrolls to reviews and spends most time there.',
  'Back-in-stock waiter - signs up for restock notifications.',
  'Product customization viewer - opens customization tool but does not finish.',
  'Shoes by fit preference - filters by wide, narrow, arch support.',
  'Anniversary campaign visitor - visits from a special campaign email and engages.',
  'Wishlisted then bought - user returns to wishlist and completes purchase.',
  'Old device visitor - uses outdated browser or OS, limited interaction.',
  'Voice search user - arrives via voice assistant (e.g., “buy black running shoes”).',
  'Returns too often - customer who has a high return frequency.',
  'Bulk buyer - purchases multiple pairs in different sizes or colors.',
  'Geo-targeted offer user - converts after seeing a regional promo or local shipping deal.',
  'Holiday shopper - visits during Black Friday or holiday sales window.',
  'Account deleter - logs in and deletes their account or data.',
  'Long dwell time no action - stays for 10+ mins with no clicks.',
  'Multi-device user - starts on mobile, finishes on desktop.',
  'Customer support hunter - navigates straight to “contact us”.',
  'Shoe-care product only buyer - buys accessories only, not shoes.',
  'Preorder customer - buys a product that hasn’t shipped yet.',
  'Coming soon follower - signs up for product that is launching later.',
  'Cart editor - frequently adds/removes items from cart.',
  'Language switcher - changes site language before browsing.',
  'Loyalty program browser - checks loyalty status, doesn’t purchase.',
  'Low-inventory buyer - buys a shoe after being notified of “low stock”.',
  'Privacy-focused visitor - quickly checks privacy/cookie settings and bounces.',
  'Post-purchase tracker - comes back just to track their order.',
  'Early bird subscriber - subscribes to email list before viewing products.',
  'Form abandoner - starts checkout form but never finishes.',
  'Return window watcher - checks policy before deciding to keep product.',
  'Visual search user - uses photo search to find similar shoes.',
  'Mobile app downloader - clicks to install the store’s app.',
  'Shoes by brand loyalty - filters or visits brand-specific collections only.',
  'Checkout revisitor - returns to a checkout session from a previous day.',
  'Accessibility mode visitor - engages with site in high-contrast or screen reader mode.',
  'Event-based buyer - searches shoes for weddings, parties, sports.',
  'Product not found user - searches a product that doesn’t exist.',
  'Feedback giver - fills in on-site feedback or survey.',
  'Seasonal browser - visits site during seasonal collection drops.',
  'Curious competitor - user from another shoe company checking things out.',
  'Customer with loyalty rewards - applies points at checkout.',
  'Currency switcher - toggles between multiple currencies.',
  'First-time visitor who registers and buys - clean funnel flow.',
  'Negative review reader - seeks out lowest-rated products and reads comments.',
  'Frequent search modifier - changes search term 3+ times in one session.',
  'Customer that shares feedback post-purchase - rates product via email follow-up.',
  'Influenced by homepage banner - clicks main banner and buys that item.',
  'Sneaker drop follower - comes for limited edition sneaker release.',
  'Ethical buyer - visits “sustainability” or “ethically made” section.',
  'One-size shopper - filters and buys only from one specific shoe size.',
  'Click rage user - clicks rapidly in frustration, often due to bugs.',
];

const referrers = [
  'direct',
  'direct',
  'direct',
  'direct',
  'direct',
  'direct',
  'direct',
  'direct',
  'https://www.google.com',
  'https://www.facebook.com',
  'https://www.twitter.com',
  'https://www.instagram.com',
  'https://www.linkedin.com',
  'https://www.youtube.com',
  'https://www.reddit.com',
  'https://www.pinterest.com',
  'https://www.tumblr.com',
  'https://www.yahoo.com',
  'https://www.bing.com',
  'https://www.ask.com',
  'https://www.aol.com',
  'https://chatgpt.com',
  'https://www.amazon.com',
  'https://www.ebay.com',
  'https://perplexity.ai',
  'https://www.quora.com',
  'https://www.stackoverflow.com',
  'https://www.github.com',
  'https://www.gitlab.com',
  'https://www.bitbucket.com',
  'https://www.heroku.com',
]

const events = [
  'add_to_cart',
  'remove_from_cart',
  'checkout',
  'purchase',
  'search',
  'filter',
  'sort',
  'start_chat',
  'cancel_chat',
  'send_message',
  'receive_message',
  'end_chat',
  'start_chat',
  'cancel_chat',
  'send_message',
  'checkout_success',
  'checkout_failed',
]

const screenViews = [
  '/',
  '/products',
  '/blog',
  '/support',
  '/products/{category}',
  '/products/{category}/{product_slug}',
  '/blog/{blog_slug}',
  '/support/{support_slug}',
  '/products/{category}/{product_slug}/details',
]

async function createSessions(index: number) {
  const pattern = patterns[index];

  if(!pattern) {
    return null
  }
  const numOfScreenViews = pattern.startsWith('Bounced visitor') ? 1 : Math.floor(Math.random() * 10) + 1;
  const numOfOtherEvents = numOfScreenViews === 1 ? Math.random() > 0.8 ? 1 : 0 : Math.floor(Math.random() * 3);

  const { object } = await generateObject({
    model: openai('gpt-4.5-preview'),
    schema,
    prompt: `You are a visitor to a e-commerce website selling shoes. 
  You should create a realistic user journey. 
  The user should be able to visit blog, articles and products or any other realistic pattern.
  The session does not need to start on \`/\`. 
  Page views should always have event as \`screen_view\`.
  Make the URLs as realistic as possible. For instance: 
  - /products/{category}/{product_slug}
  - /blog/{blog_slug}
  - /support/{support_slug}
  - or any other realistic URL

  Referrer: ${referrers[Math.floor(Math.random() * referrers.length)]}
  How the user should behave: ${pattern}

  Available events: ${events.filter(() => Math.random() > 0.5).join(', ')}
  Available screen views: ${screenViews.join(', ')}

  If curly braces you should replace it with a random value that matches the pattern.

  Apart for screen views, you should be able to trigger other kind of events, be creative!

  If the event is a page view the event should be \`screen_view\` nothing else. For other events, you can use any event name you want.

  You should create ${numOfScreenViews} screen views and ${numOfOtherEvents} other events.

  Events should be mix with the \`screen_view\` events. Not just last. Be smart how you pick events, they should be realistic and match the current page.
  `,
  });

  return object
}

async function main() {
  const totalSessions = patterns.length;
  const existingSessions = JSON.parse(await readFile(filepath, 'utf-8')) as z.infer<typeof schema>[];
  let count = 0;
  while (count < totalSessions) {
    console.log(`Session ${count + 1} of ${totalSessions}`);
    const session = await createSessions(count);
    if(session) {
      existingSessions.push(session);
      await writeFile(filepath, JSON.stringify(existingSessions, null, 2));
    }
    count++;
    if (count > totalSessions) {
      break;
    }
  }

  console.log('done');
}

main();