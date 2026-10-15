# BuildYourDream.AI

BuildYourDream.AI is an AI website-builder project with a React + TypeScript frontend and a separate Node.js API.

## Current status

- Responsive homepage and prompt-based builder
- OpenAI-backed generation endpoint for standalone HTML/CSS website drafts
- Sandboxed browser preview and downloadable HTML when the API key is configured
- API health endpoint, input validation, rate limiting, and security headers
- Authentication, database persistence, project history, interactive generated scripts, credit billing, and one-click publishing are not implemented yet

## Requirements

- Node.js 20 or newer
- npm
- An OpenAI API key to generate website drafts

## Run locally

Open two terminals in the repository folder.

### Terminal 1: API server

```bash
cd server
npm install
```

Copy `server/.env.example` to `server/.env` (Windows Command Prompt: `copy .env.example .env` after entering `server`) and add your own `OPENAI_API_KEY` in that file. Never commit the real key. Then run:

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

The frontend uses `VITE_API_BASE_URL` if set; otherwise it calls `http://localhost:8787`.

## Production hosting

- Frontend: `https://buildyourdream-ai.onrender.com`
- API: `https://buildyourdream-api.onrender.com`
- API key must be set as `OPENAI_API_KEY` in the API service's environment settings, not in frontend variables or GitHub.

## Roadmap

1. Configure the provider key and verify a real generated draft
2. Add authentication with separate user and admin roles
3. Add PostgreSQL persistence and project ownership
4. Add free quotas, usage metering, credit reservations, and billing
5. Add safer project editing and controlled publishing

## Security notes

- Never commit API keys, passwords, database credentials, or other secrets.
- Generated HTML is previewed in a sandbox with scripts disabled.
- Do not run generated code directly inside the API process.
