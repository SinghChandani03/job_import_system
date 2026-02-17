# Job Import System

Fetches jobs from RSS/XML feeds, queues with BullMQ + Redis, upserts into MongoDB. Admin UI for import history and job sources.

**Stack:** Next.js, Express, MongoDB, Redis, BullMQ

## Prerequisites

Node 18+, MongoDB, Redis

**MongoDB and Redis must be running** before `npm run seed` or `npm run dev`. If you see `ECONNREFUSED` when seeding, start MongoDB (e.g. run `mongod` or start the MongoDB service). For a cloud database, set `MONGO_URI` in `server/.env` (e.g. a [MongoDB Atlas](https://www.mongodb.com/atlas) connection string).

## Setup

1. **Server** – `server/.env`:
   ```
   PORT=4000
   MONGO_URI=mongodb://localhost:27017/job-import
   REDIS_HOST=localhost
   REDIS_PORT=6379
   REDIS_PASSWORD=          # leave empty for local Redis; set if using Redis Cloud
   ```

2. **Client** – `client/.env.local`:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:4000
   ```

3. **Run:**
   ```bash
   cd server
   npm install
   npm run seed    # seed job source URLs
   npm run dev
   # separate terminal:
   cd server && npm run worker
   # separate terminal:
   cd client && npm install && npm run dev
   ```
   API: http://localhost:4000 | UI: http://localhost:3000

**Tests:** `npm test` from `server/` and `client/` when test scripts are added.

**Assumptions:** Node 18+, MongoDB and Redis local or cloud (e.g. Atlas, Redis Cloud). Job sources are stored in DB; cron runs hourly; worker runs as a separate process.

## API

- `GET /api/health` – health
- `GET /api/job-sources` – list sources
- `POST /api/job-sources` – create `{ url, name? }`
- `POST /api/job-sources/:id/trigger` – fetch & queue import
- `GET /api/import-logs` – list logs (`?page=&limit=&sourceUrl=`)
