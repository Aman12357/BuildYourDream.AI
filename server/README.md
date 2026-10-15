# BuildYourDream.AI API

Node.js + Express API starter for the BuildYourDream.AI frontend.

## Requirements

- Node.js 20+
- npm

## Run locally

From the repository root:

```bash
cd server
npm install
```

Copy `.env.example` to `.env`, then start the server:

Windows Command Prompt:

```bat
copy .env.example .env
npm run dev
```

API runs at `http://localhost:8787`.

## Endpoints

- `GET /` — basic service status
- `GET /api/health` — health check
- `POST /api/generate` — validates a prompt and returns an explicit not-configured response until an AI provider and safe preview sandbox are implemented

Example request:

```json
{ "prompt": "Create a portfolio website for a photographer" }
```

## Security

- Keep real API keys in local environment variables or the deployment provider's secret manager.
- Never commit `.env` or provider keys.
- Real website generation must be isolated from the API process. Do not execute generated code on the API server.
- Authentication, project ownership, usage metering, credit reservations, and persistent storage are not implemented yet.
