# Fullstack Monorepo

## Overview
A full-stack TypeScript application with React frontend, Express backend, and PostgreSQL database using Drizzle ORM.

## Project Structure
```
/client          - Vite React app (port 5000)
  /src           - React source files
/server          - Express API (port 3001)
  /src           - Server source files
    /db          - Database configuration and schema
    /routes      - API routes
    app.ts       - Main Express app
/shared          - Shared Zod schemas and types
/drizzle         - Database migrations
vite.config.ts   - Vite configuration (root)
drizzle.config.ts - Drizzle configuration
tsconfig.json    - TypeScript configuration
```

## Key Technologies
- **Frontend**: React 18, Vite, TypeScript
- **Backend**: Express, TypeScript, tsx
- **Database**: PostgreSQL with Drizzle ORM, Neon serverless
- **Validation**: Zod schemas shared between frontend and backend

## Scripts
- `npm run dev` - Start both client and server in development mode
- `npm run dev:client` - Start only the Vite dev server
- `npm run dev:server` - Start only the Express server
- `npm run build` - Build the client for production
- `npm run db:generate` - Generate Drizzle migrations
- `npm run db:migrate` - Run migrations
- `npm run db:push` - Push schema changes directly

## Environment Variables
- `DATABASE_URL` - PostgreSQL connection string (auto-configured)
- `NODE_ENV` - Environment mode (development/production)
- `SESSION_SECRET` - Secret for session management

## Architecture
- Vite proxies `/api` requests to the Express server on port 3001
- Shared types ensure type safety between frontend and backend
- Zod schemas provide runtime validation on both ends
