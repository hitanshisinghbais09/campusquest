# CampusQuest — Gamified College Life (MERN)

An original-fantasy-themed platform where campus events become quests, clubs become guilds,
and an AI "Oracle" recommends your next quest.

## Setup

### Backend
```
cd backend
npm install
cp .env.example .env   # fill in MONGO_URI, JWT_SECRET, GROQ_API_KEY
node seed.js            # seeds 4 guilds + sample quests
npm run dev
```
- MongoDB Atlas free tier: https://www.mongodb.com/cloud/atlas/register
- Groq free API key: https://console.groq.com

### Frontend
```
cd frontend
npm install
cp .env.example .env   # set VITE_API_URL to your backend URL
npm run dev
```

## Deploy
- Backend → Render or Railway (set env vars in their dashboard)
- Frontend → Vercel (set VITE_API_URL to your deployed backend URL)
- Database → MongoDB Atlas (already cloud-hosted)

## What's implemented
- JWT auth (signup/login/me) with bcrypt password hashing
- Protected routes on both frontend (React Router) and backend (middleware)
- 4-question sorting quiz on signup → assigns user to one of 4 original guilds (Emberclaw, Thistlewood, Tidehollow, Duskmere)
- Quests (seeded campus events) that award XP on completion, with a level-up curve
- The Oracle: AI (Groq) recommends your next quest in fantasy-styled text, read aloud via the browser's built-in SpeechSynthesis API
- Leaderboard sorted by XP
- Fantasy-themed UI (original branding, no copyrighted IP) with Framer Motion animations

## Next to add if time allows
- Badge icons for milestones (e.g. "5 quests completed")
- Guild-specific color theming across the dashboard
- A guild page showing members + guild-only quests
