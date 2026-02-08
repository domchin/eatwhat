# 🍽️ EatWhat

A Tinder-style food decision app for couples and friends in Singapore. Swipe to match on restaurants or cuisines!

## Features

- 🏢 **Mall Mode**: Browse restaurants in VivoCity (expandable to other malls)
- 🌍 **Cuisine Mode**: Choose from various cuisine types  
- 👥 **Two-Player Matching**: Async swiping - Person 1 selects 5 options, Person 2 swipes until a match
- 🎉 **Match Celebration**: Both users see the matched result
- 🔗 **Easy Sharing**: Unique session links for each session
- 📱 **Mobile-Optimized**: Smooth swipe gestures designed for mobile

## Tech Stack

- **Frontend**: Next.js 15 + React 18 + TypeScript
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion (for swipe gestures)
- **Database**: Supabase (PostgreSQL)
- **Hosting**: Vercel (frontend) + Supabase (backend)

## Quick Start

See `QUICKSTART.md` for 10-minute setup guide!

## Documentation

- **QUICKSTART.md** - Get running in 10 minutes
- **DEPLOYMENT.md** - Complete deployment guide  
- **CHECKLIST.md** - Pre-deployment checklist

## Project Structure

```
eatwhat/
├── app/
│   ├── page.tsx              # Home page - choice selection
│   ├── swipe/[code]/page.tsx # Swipe interface
│   ├── waiting/[code]/page.tsx # Waiting room for Person 1
│   ├── layout.tsx            # Root layout
│   └── globals.css           # Global styles
├── components/
│   └── SwipeCard.tsx         # Tinder-style swipe card component
├── lib/
│   ├── supabase.ts           # Supabase client & types
│   └── helpers.ts            # Database helper functions
└── supabase-schema.sql       # Database schema
```

## Database Schema

### Tables:
- **sessions**: Stores session info and match results
- **cuisines**: List of cuisine types
- **malls**: Singapore shopping malls
- **restaurants**: Restaurants in malls
- **swipes**: User swipe history

## Customization

### Adding More Restaurants
Edit `supabase-schema.sql` and add more INSERT statements, or add them directly in Supabase.

### Adding More Malls
1. Insert mall into `malls` table
2. Add restaurants for that mall
3. Update the UI to allow mall selection

### Adding More Cuisines
```sql
INSERT INTO cuisines (name, description)
VALUES ('Cuisine Name', 'Description');
```

## License

MIT

---

Made with ❤️ for couples and friends who can't decide what to eat in Singapore 🇸🇬
