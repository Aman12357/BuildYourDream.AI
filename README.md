# BuildYourDream.AI

BuildYourDream.AI is an AI website-builder project. This repository contains the first frontend foundation and a separate API starter.

## Current status

- Responsive React + TypeScript + Vite homepage
- Prompt input and example website concepts
- Frontend prompt form calls the backend API
- Express API health endpoint and prompt validation
- The API explicitly reports that real generation is not configured yet
- Authentication, database persistence, credit billing, AI generation, and isolated preview execution are still planned

## Requirements

- Node.js 20 or newer
- npm

## Run locally

Open two terminals in the repository folder.

### Terminal 1: API server

```bash
cd server
npm install
```

Copy `server/.env.example` to `server/.env` (Windows Command Prompt: `copy .env.example .env` after entering `server`), then run:

```bash
npm run dev
```

The API runs at `http://localhost:8787`.

### Terminal 2: Frontend

From the repository root:

```bash
npm install
npm run dev
```

Open the local URL printed by Vite, usually `http://localhost:5173`.

The frontend uses `VITE_API_BASE_URL` if set; otherwise it calls `http://localhost:8787`. The root `.env.example` documents this optional setting.

## Production build

From the repository root:

```bash
npm run build
npm run preview
```

## Roadmap

1. Verify frontend and API locally
2. Add authentication with separate user and admin roles
3. Add PostgreSQL persistence and project ownership
4. Connect an AI provider through a server-side adapter
5. Build a restricted preview sandbox for generated websites
6. Add free quotas, usage metering, credit reservations, and billing
7. Deploy frontend and backend with environment secrets configured

## Security notes

- Never commit API keys, passwords, database URLs, or local `.env` files.
- Real website generation is not enabled in this starter.
- Never execute generated user code directly inside the API server process.
- Before charging users, implement server-side authentication, project-level authorization, usage limits, atomic credit reservations, and payment webhook verification.
