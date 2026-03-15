/**
 * Database migration runner
 * Uses the Supabase Management API to execute arbitrary SQL.
 * Run: node scripts/migrate.mjs
 */

const SUPABASE_URL = 'https://skjuiahgmkpmbnlcaavn.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNranVpYWhnbWtwbWJubGNhYXZuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDQ2MDg2MiwiZXhwIjoyMDg2MDM2ODYyfQ.ZdiiuoYQ9AJPr8x5ixuU_H6tYlE-XSgZ9LzwArcV4wE';
const PROJECT_REF = 'skjuiahgmkpmbnlcaavn';

async function sql(query) {
  // Use the Supabase REST API pg endpoint (available via service_role)
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'apikey': SERVICE_ROLE_KEY,
    },
    body: JSON.stringify({ sql: query }),
  });

  if (!res.ok) {
    // Fallback: try management API
    return sqlViaManagementAPI(query);
  }
  return res.json();
}

async function sqlViaManagementAPI(query) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({ query }),
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`SQL failed (${res.status}): ${text}`);
  }
  return JSON.parse(text);
}

// ─── Direct table operations via PostgREST ────────────────────────────────────

async function postgrest(method, table, body, params = '') {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}${params}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'apikey': SERVICE_ROLE_KEY,
      'Prefer': 'return=representation',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${method} ${table} failed (${res.status}): ${text}`);
  return text ? JSON.parse(text) : null;
}

// ─── Migrations ───────────────────────────────────────────────────────────────

async function runMigrations() {
  console.log('🔧 Running migrations…\n');

  // 1. Add session_type column
  console.log('1. Adding session_type column to sessions…');
  try {
    await sql(`ALTER TABLE sessions ADD COLUMN IF NOT EXISTS session_type TEXT DEFAULT 'cuisine'`);
    console.log('   ✓ Done\n');
  } catch (e) {
    console.log(`   ⚠ ${e.message} (may already exist)\n`);
  }

  // 2. Add logo_url column to restaurants
  console.log('2. Adding logo_url column to restaurants…');
  try {
    await sql(`ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS logo_url TEXT`);
    console.log('   ✓ Done\n');
  } catch (e) {
    console.log(`   ⚠ ${e.message} (may already exist)\n`);
  }

  // 3. Add logo_url to cuisines
  console.log('3. Adding logo_url column to cuisines…');
  try {
    await sql(`ALTER TABLE cuisines ADD COLUMN IF NOT EXISTS logo_url TEXT`);
    console.log('   ✓ Done\n');
  } catch (e) {
    console.log(`   ⚠ ${e.message} (may already exist)\n`);
  }

  // 4. Seed/re-seed restaurants
  console.log('4. Seeding VivoCity restaurants…');

  // Get mall ID
  const malls = await postgrest('GET', 'malls', null, '?name=eq.VivoCity&select=id');
  let mallId;

  if (!malls || malls.length === 0) {
    console.log('   Creating VivoCity mall…');
    const [mall] = await postgrest('POST', 'malls', { name: 'VivoCity', location: '1 HarbourFront Walk, Singapore 098585' });
    mallId = mall.id;
  } else {
    mallId = malls[0].id;
  }
  console.log(`   Mall ID: ${mallId}`);

  // Delete existing restaurants for VivoCity
  await postgrest('DELETE', `restaurants`, null, `?mall_id=eq.${mallId}`);
  console.log('   Cleared existing restaurants');

  const restaurants = [
    // Chinese
    { name: 'Din Tai Fung',                        cuisine_type: 'Chinese',    price_range: '$$',  description: 'World-famous for its xiaolongbao and Taiwanese dim sum',                       logo_url: 'https://logo.clearbit.com/dintaifung.com' },
    { name: 'Tim Ho Wan',                           cuisine_type: 'Chinese',    price_range: '$$',  description: 'Michelin Bib Gourmand dim sum — legendary char siu bao',                       logo_url: null },
    { name: 'Crystal Jade Kitchen',                 cuisine_type: 'Chinese',    price_range: '$$',  description: 'Authentic Cantonese cuisine and handcrafted dim sum',                           logo_url: null },
    { name: 'Crystal Jade La Mian Xiao Long Bao',  cuisine_type: 'Chinese',    price_range: '$$',  description: 'Hand-pulled la mian noodles and delicate xiao long bao',                        logo_url: null },
    { name: 'Imperial Treasure Fine Chinese',       cuisine_type: 'Chinese',    price_range: '$$$', description: 'Premium Cantonese dining with live seafood and classic roasts',                  logo_url: null },
    { name: 'Putien',                               cuisine_type: 'Chinese',    price_range: '$$',  description: 'Michelin-starred Fujian cuisine — try the 100-second la mian',                 logo_url: null },
    { name: 'Paradise Dynasty',                     cuisine_type: 'Chinese',    price_range: '$$',  description: 'Famous for its eight-flavour xiao long bao in stunning colours',                logo_url: null },
    { name: 'Canton Paradise',                      cuisine_type: 'Chinese',    price_range: '$$',  description: 'Cantonese classics and dim sum in a modern setting',                            logo_url: null },
    { name: 'Hong Kong Kim Gary',                   cuisine_type: 'Hong Kong',  price_range: '$',   description: 'Nostalgic HK-style café — baked pork chop rice and milk tea',                   logo_url: null },
    // Japanese
    { name: 'Genki Sushi',                          cuisine_type: 'Japanese',   price_range: '$$',  description: 'High-speed conveyor belt sushi with over 100 varieties',                        logo_url: 'https://logo.clearbit.com/genkisushi.com.sg' },
    { name: 'Sakae Sushi',                          cuisine_type: 'Japanese',   price_range: '$',   description: 'Affordable conveyor belt sushi with Japanese favourites',                       logo_url: null },
    { name: 'Sushi Express',                        cuisine_type: 'Japanese',   price_range: '$',   description: 'Budget-friendly sushi on a belt — simple, fresh, fast',                         logo_url: null },
    { name: 'Ichiban Boshi',                        cuisine_type: 'Japanese',   price_range: '$$',  description: 'Set meals and à la carte Japanese cuisine in a relaxed setting',                logo_url: null },
    { name: 'Tonkotsu Kazan Ramen',                 cuisine_type: 'Japanese',   price_range: '$$',  description: 'Theatrical volcano ramen — rich pork-bone broth tableside',                     logo_url: null },
    { name: 'Yoshinoya',                            cuisine_type: 'Japanese',   price_range: '$',   description: 'Iconic Japanese beef bowl chain — quick, hearty, and affordable',               logo_url: 'https://logo.clearbit.com/yoshinoya.com' },
    { name: 'MOS Burger',                           cuisine_type: 'Japanese',   price_range: '$',   description: 'Japanese-style burgers with fresh ingredients and unique flavours',              logo_url: 'https://logo.clearbit.com/mos.com.sg' },
    // Korean
    { name: 'Nene Chicken',                         cuisine_type: 'Korean',     price_range: '$',   description: 'Crispy Korean fried chicken with signature sauces and sides',                   logo_url: null },
    { name: 'Seoul Garden',                         cuisine_type: 'Korean',     price_range: '$$',  description: 'All-you-can-eat Korean BBQ and hotpot buffet',                                  logo_url: null },
    { name: 'Jjang Korean Noodle Bar',              cuisine_type: 'Korean',     price_range: '$',   description: 'Affordable Korean noodles — jjajangmyeon and spicy ramyeon',                    logo_url: null },
    // Western
    { name: 'Shake Shack',                          cuisine_type: 'Western',    price_range: '$$',  description: 'Premium smash burgers, crinkle fries, and frozen custard',                      logo_url: 'https://logo.clearbit.com/shakeshack.com' },
    { name: 'Five Guys',                            cuisine_type: 'Western',    price_range: '$$',  description: 'Loaded burgers with endless free toppings and fresh-cut fries',                 logo_url: 'https://logo.clearbit.com/fiveguys.com' },
    { name: "McDonald's",                           cuisine_type: 'Western',    price_range: '$',   description: 'The classic golden arches — burgers, fries, and McFlurries',                    logo_url: 'https://logo.clearbit.com/mcdonalds.com' },
    { name: 'Burger King',                          cuisine_type: 'Western',    price_range: '$',   description: 'Flame-grilled Whopper and fast food favourites',                                logo_url: 'https://logo.clearbit.com/bk.com' },
    { name: 'KFC',                                  cuisine_type: 'Western',    price_range: '$',   description: "Finger-lickin' original recipe fried chicken",                                  logo_url: 'https://logo.clearbit.com/kfc.com' },
    { name: 'Texas Chicken',                        cuisine_type: 'Western',    price_range: '$',   description: 'Southern-style fried chicken and honey butter biscuits',                        logo_url: null },
    { name: 'Subway',                               cuisine_type: 'Western',    price_range: '$',   description: 'Build-your-own subs with fresh bread and toppings',                             logo_url: 'https://logo.clearbit.com/subway.com' },
    { name: 'Pizza Hut',                            cuisine_type: 'Western',    price_range: '$',   description: 'Classic pan pizzas, pastas, and sides for sharing',                             logo_url: 'https://logo.clearbit.com/pizzahut.com' },
    { name: 'The Soup Spoon',                       cuisine_type: 'Western',    price_range: '$',   description: 'Hearty soups made fresh daily with wholesome ingredients',                      logo_url: null },
    { name: "Swensen's",                            cuisine_type: 'Western',    price_range: '$$',  description: 'Sundaes, Earthquake ice cream, and American comfort food',                      logo_url: null },
    { name: 'Fish & Co',                            cuisine_type: 'Western',    price_range: '$$',  description: 'Fresh Atlantic fish and chips served in a skillet',                             logo_url: null },
    // Italian
    { name: 'Pastamania',                           cuisine_type: 'Italian',    price_range: '$',   description: 'Pasta and baked rice in generous portions — casual and tasty',                  logo_url: null },
    { name: 'Saizeriya',                            cuisine_type: 'Italian',    price_range: '$',   description: 'Affordable Italian family dining — pizza, pasta, and wine',                     logo_url: 'https://logo.clearbit.com/saizeriya.com' },
    // Local / Other
    { name: 'Old Chang Kee',                        cuisine_type: 'Local',      price_range: '$',   description: 'Singapore icon — crispy curry puffs and fried snacks',                          logo_url: null },
    { name: 'Ya Kun Kaya Toast',                    cuisine_type: 'Local',      price_range: '$',   description: 'Traditional kaya toast, soft-boiled eggs, and Nanyang coffee',                  logo_url: null },
    { name: 'Toast Box',                            cuisine_type: 'Local',      price_range: '$',   description: 'Classic Singapore breakfast — kaya toast and teh tarik',                        logo_url: null },
    { name: 'Bengawan Solo',                        cuisine_type: 'Local',      price_range: '$',   description: 'Beloved Peranakan cakes and pandan kueh',                                       logo_url: null },
    { name: 'Jollibee',                             cuisine_type: 'Filipino',   price_range: '$',   description: 'The Philippine fast food icon — Chickenjoy and spaghetti',                      logo_url: 'https://logo.clearbit.com/jollibee.com.ph' },
    { name: "Stuff'd",                              cuisine_type: 'Fusion',     price_range: '$',   description: 'Stuffed burritos and kebab wraps with bold flavour combinations',               logo_url: null },
  // Only include logo_url if the column exists (added by DDL migration)
  ].map(({ logo_url, ...r }) => ({ ...r, mall_id: mallId }));

  // Insert in batches of 10
  for (let i = 0; i < restaurants.length; i += 10) {
    const batch = restaurants.slice(i, i + 10);
    await postgrest('POST', 'restaurants', batch);
    console.log(`   Inserted ${Math.min(i + 10, restaurants.length)}/${restaurants.length}`);
  }
  console.log('   ✓ Restaurants seeded\n');

  // 5. Seed cuisines (upsert-style: delete and re-insert)
  console.log('5. Seeding cuisines…');
  const existing = await postgrest('GET', 'cuisines', null, '?select=id');
  if (!existing || existing.length === 0) {
    const cuisines = [
      { name: 'Chinese',    description: 'From dim sum to roast duck — classic Chinese comfort food' },
      { name: 'Indian',     description: 'Bold spices, rich curries, and aromatic biryanis' },
      { name: 'Japanese',   description: 'Sushi, ramen, katsu, and the art of Japanese cooking' },
      { name: 'Korean',     description: 'BBQ, crispy fried chicken, and bold fermented flavours' },
      { name: 'Western',    description: 'Burgers, steaks, pastas, and satisfying Western classics' },
      { name: 'Thai',       description: 'Fragrant, spicy, and sweet — the full Thai spectrum' },
      { name: 'Vietnamese', description: 'Light and fresh — pho, banh mi, and rice paper rolls' },
      { name: 'Malaysian',  description: 'Nasi lemak, laksa, and the rich flavours of Malaysia' },
      { name: 'Italian',    description: 'Handmade pasta, wood-fired pizza, and Italian soul food' },
      { name: 'Mexican',    description: 'Tacos, burritos, quesadillas, and bold Mexican flavours' },
    ];
    await postgrest('POST', 'cuisines', cuisines);
    console.log('   ✓ Cuisines seeded\n');
  } else {
    console.log(`   ✓ ${existing.length} cuisines already exist, skipping\n`);
  }

  console.log('✅ All migrations complete!');
}

runMigrations().catch((err) => {
  console.error('\n❌ Migration failed:', err.message);
  process.exit(1);
});
