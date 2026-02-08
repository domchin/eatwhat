# Deployment Guide

## Quick Deployment to Vercel & Supabase

### 1. Supabase Setup

1. Go to https://supabase.com
2. Create new project: `eatwhat` (Southeast Asia region)
3. In SQL Editor, run the entire `supabase-schema.sql` file
4. Get credentials from Settings > API:
   - Project URL
   - anon public key

### 2. Deploy to Vercel

**Option A: Vercel Dashboard**

1. Push code to GitHub:
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/eatwhat.git
git push -u origin main
```

2. Go to https://vercel.com
3. Import your GitHub repository
4. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Deploy!

**Option B: Vercel CLI**

```bash
npm install -g vercel
vercel login
vercel
# Add environment variables when prompted
vercel --prod
```

### 3. Verify

1. Open your Vercel URL
2. Test the full flow:
   - Choose cuisine/mall
   - Swipe as Person 1 (5 times)
   - Share link
   - Swipe as Person 2 until match
   - See celebration!

## Troubleshooting

**Session not found**: Check Supabase credentials
**Swipes not saving**: Verify RLS policies in Supabase
**Build fails**: Run `npm run build` locally to check

## Costs

Both Vercel and Supabase have generous free tiers perfect for this app!

---

For quick setup, see QUICKSTART.md
