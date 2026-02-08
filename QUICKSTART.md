# 🚀 Quick Start Guide

Get EatWhat running in 10 minutes!

## Step 1: Database Setup (3 min)

1. Go to https://supabase.com and create account
2. Click "New Project"
   - Name: `eatwhat`
   - Region: Southeast Asia
3. Wait for project creation
4. Go to SQL Editor
5. Copy/paste everything from `supabase-schema.sql`
6. Click "Run"
7. Go to Settings > API and copy:
   - Project URL
   - anon public key

## Step 2: Local Setup (2 min)

```bash
cd eatwhat
npm install
cp .env.local.example .env.local
# Edit .env.local with your Supabase credentials
npm run dev
```

Open http://localhost:3000

## Step 3: Test (2 min)

1. Choose "Cuisine Type" > "Start Swiping"
2. Swipe right 5 times
3. Copy session link
4. Open in incognito/another browser
5. Swipe until match! 🎉

## Step 4: Deploy (3 min)

```bash
npm install -g vercel
vercel login
vercel
# Add environment variables when prompted
vercel --prod
```

Done! Your app is live! 🚀

For detailed instructions, see DEPLOYMENT.md
