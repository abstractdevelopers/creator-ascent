# Creator Ascent

A modern creator platform built with React 19, TanStack Start, and Supabase.

## Tech Stack

- **Framework:** TanStack Start (React 19)
- **Styling:** Tailwind CSS 4, shadcn/ui
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth
- **Payments:** Stripe
- **Deployment:** LaunchVerse

## Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm

### Installation

```bash
# Clone the repo
git clone https://github.com/abstractdevelopers/creator-ascent.git
cd creator-ascent

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Start the dev server
npm run dev
```

### Environment Variables

Create a `.env.local` file with the following variables:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_webhook_secret
```

## Scripts

- `npm run dev` — Start the development server
- `npm run build` — Build for production
- `npm run start` — Start the production server
- `npm run typecheck` — Run TypeScript type checking

## Project Structure

```
src/
├── routes/         # File-based routing
├── components/     # Reusable UI components
├── lib/            # Utilities and helpers
├── server/         # Server-side logic
└── styles/         # Global styles
```

## Deployment

This project is deployed on LaunchVerse. Deployments are triggered automatically on pushes to `main`.

## License

MIT
