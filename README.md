# Health Tracker

A personal health tracking web app for logging food intake and weight over time, with a dashboard for visualizing trends.

Live at: **[health.mgriffioen.com](https://health.mgriffioen.com)**

## Features

### Food Tracker
- Search foods by name with autocomplete (local database + USDA FoodData Central API)
- Local database includes 634 HelloFresh recipes and common foods
- Auto-calculates calories based on serving size when selecting from the database
- Quick serving presets per food item
- Log entries by food group, date, and time
- Edit or delete existing entries (delete has a 4-second undo)
- Daily log filtered by date with total calorie count

### Weight Tracker
- Log daily weight in lbs
- One entry per day (upserts if the same date is logged twice)
- Weight history with trend indicators (up/down/flat vs. previous entry)

### Dashboard
- Current weight and total weight change stats
- Weight over time line chart
- Daily calorie intake bar chart
- Today's calories and average daily calories

### Auth
- Email + password login
- "Set Password" option in the header for accounts created via magic link

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite |
| Styling | Tailwind CSS v4 |
| Charts | Recharts |
| Icons | Lucide React |
| Backend / Auth / DB | Supabase |
| Deployment | GitHub Actions → GitHub Pages |
| DNS | Cloudflare (DNS only for the `health` subdomain) |

## Project Structure

```
src/
  components/
    Auth.jsx          # Login / sign-up screen
    Dashboard.jsx     # Charts and summary stats
    FoodTracker.jsx   # Food logging UI
    WeightTracker.jsx # Weight logging UI
  utils/
    db.js             # Supabase CRUD functions
    foodApi.js        # USDA FoodData Central API search + FOOD_GROUPS list
    foodDatabase.js   # Local common foods database + searchLocal()
    hellofreshDatabase.js # 634 HelloFresh recipes
    supabase.js       # Supabase client init
    storage.js        # Local storage helpers
public/
  CNAME                  # Custom domain for GitHub Pages
  apple-touch-icon.png   # iOS home screen icon (180x180)
  icon-192.png           # PWA icon (192x192)
  favicon-32.png         # Favicon (32x32)
```

## Database (Supabase)

Two tables, both with RLS enabled (users can only access their own rows):

**`food_entries`**
| Column | Type |
|---|---|
| id | uuid |
| user_id | uuid |
| date | date |
| time | time |
| name | text |
| calories | integer |
| serving_size | numeric |
| food_group | text |

**`weight_entries`**
| Column | Type |
|---|---|
| id | uuid |
| user_id | uuid |
| date | date |
| weight | numeric |
| unit | text |

## Environment Variables

| Variable | Where set | Purpose |
|---|---|---|
| `VITE_SUPABASE_URL` | `.env` (gitignored) | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | `.env` (gitignored) | Supabase publishable key |
| `VITE_USDA_API_KEY` | GitHub Actions secret | USDA FoodData Central API key |

## Local Development

```bash
npm install
npm run dev
```

Requires a `.env` file with:
```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_USDA_API_KEY=...
```

## Deployment

Pushes to `main` automatically trigger the GitHub Actions workflow which builds the app and deploys to GitHub Pages at `health.mgriffioen.com`.

## Mobile (PWA)

The app is optimized for use as a home screen web app on iPhone:
- Apple touch icon configured
- iOS zoom prevention (font-size 16px, touch-action manipulation)
- Numeric keyboard for weight and calorie inputs (`inputMode="decimal"`)
- Safe area padding for notched phones
- Use **Set Password** (key icon in header) to set a password so the home screen PWA can log in independently of Safari's session
