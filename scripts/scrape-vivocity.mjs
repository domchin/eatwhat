/**
 * VivoCity F&B Scraper
 *
 * Usage:
 *   node scripts/scrape-vivocity.mjs
 *
 * Fetches the VivoCity tenant directory, extracts F&B listings,
 * and outputs a SQL INSERT statement or JSON you can paste into Supabase.
 *
 * NOTE: VivoCity's website loads tenants dynamically via JavaScript (XHR/fetch).
 * If the HTML-only fetch below returns no results, use the Puppeteer variant
 * at the bottom of this file, or use the pre-compiled data in supabase-schema.sql.
 */

const VIVOCITY_DINE_URL = 'https://www.vivocity.com.sg/eat-drink/';

async function scrapeVivoCity() {
  console.log('Fetching VivoCity F&B page…');

  const res = await fetch(VIVOCITY_DINE_URL, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0 Safari/537.36',
      Accept: 'text/html,application/xhtml+xml',
    },
  });

  if (!res.ok) {
    console.error(`Failed to fetch: HTTP ${res.status}`);
    process.exit(1);
  }

  const html = await res.text();

  // ── Try to extract tenant data from JSON embedded in the page ──
  // Many mall sites embed their directory as a JSON blob in a <script> tag.
  const jsonMatches = [
    ...html.matchAll(/"name"\s*:\s*"([^"]{2,60})"/g),
  ];

  if (jsonMatches.length === 0) {
    console.warn(
      '\nNo restaurant names found in static HTML.\n' +
      'The site likely uses client-side rendering.\n\n' +
      'Options:\n' +
      '  1. Use the manually curated data in supabase-schema.sql (recommended).\n' +
      '  2. Install puppeteer and use the Puppeteer scraper below.\n' +
      '     npm install puppeteer\n' +
      '     node scripts/scrape-vivocity.mjs --puppeteer\n'
    );
    return;
  }

  const names = [...new Set(jsonMatches.map((m) => m[1]))];
  console.log(`\nFound ${names.length} potential entries:\n`);
  names.forEach((n) => console.log(' •', n));

  // Output as SQL for quick copy-paste
  console.log('\n-- SQL (paste into Supabase SQL editor):');
  names.forEach((name) => {
    console.log(
      `INSERT INTO restaurants (name, mall_id) SELECT '${name.replace(/'/g, "''")}', id FROM malls WHERE name = 'VivoCity';`
    );
  });
}

// ── Puppeteer variant (uncomment and run with: node scripts/scrape-vivocity.mjs --puppeteer) ──
async function scrapeWithPuppeteer() {
  let puppeteer;
  try {
    puppeteer = await import('puppeteer');
  } catch {
    console.error('Puppeteer not installed. Run: npm install puppeteer');
    process.exit(1);
  }

  console.log('Launching headless browser…');
  const browser = await puppeteer.default.launch({ headless: 'new' });
  const page = await browser.newPage();

  await page.goto(VIVOCITY_DINE_URL, { waitUntil: 'networkidle2', timeout: 30000 });

  // Wait for tenant cards to appear (inspect element to get the real selector)
  await page.waitForSelector('.tenant-card, .directory-item, [data-tenant]', { timeout: 15000 }).catch(() => {});

  const restaurants = await page.evaluate(() => {
    // Adjust selector to match the actual DOM structure
    const cards = document.querySelectorAll('.tenant-card, .directory-item, article');
    return Array.from(cards).map((card) => ({
      name: card.querySelector('h2, h3, .name')?.textContent?.trim() ?? '',
      category: card.querySelector('.category, .tag')?.textContent?.trim() ?? '',
      description: card.querySelector('p, .description')?.textContent?.trim() ?? '',
    })).filter((r) => r.name.length > 1);
  });

  await browser.close();

  if (restaurants.length === 0) {
    console.warn('No restaurants found. The selector may need updating — inspect the live page DOM.');
    return;
  }

  console.log(`\nFound ${restaurants.length} restaurants:\n`);
  console.log(JSON.stringify(restaurants, null, 2));
}

if (process.argv.includes('--puppeteer')) {
  scrapeWithPuppeteer().catch(console.error);
} else {
  scrapeVivoCity().catch(console.error);
}
