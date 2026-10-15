# BuildYourDream.AI API

Node.js + Express API for the BuildYourDream.AI frontend.

## Requirements

- Node.js 20+
- npm
- An OpenAI API key for live generation (configured server-side only)

## Run locally

From the repository root:

```bash
cd server
npm install
```

Copy `.env.example` to `.env`, add your key as `OPENAI_API_KEY`, then start the server:

Windows Command Prompt:

```bat
copy .env.example .env
npm run dev
```

API runs at `http://localhost:8787`.

## Endpoints

- `GET /` — basic service status and whether generation is configured
- `GET /api/health` — health check and generation configuration status
- `POST /api/generate` — asks the configured OpenAI model to create a standalone HTML/CSS website draft

Example request:

```json
{ "prompt": "Create a portfolio website for a photographer" }
```

The response includes generated HTML. The frontend renders it inside a sandboxed iframe with scripts disabled and offers an HTML download. This is an initial static-site draft, not a deployment/publishing service. Interactive scripts, forms, external assets, saved projects, authentication, and credits are not included yet.

## Production deployment

Create a Node web service from the repository with build command `npm --prefix server install` and start command `npm --prefix server start`. Set these environment variables in the hosting dashboard:

- `CLIENT_ORIGIN=https://buildyourdream-ai.onrender.com`
- `OPENAI_API_KEY` — your private key; do not commit it
- `OPENAI_MODEL=gpt-4.1-mini` (optional; defaults to this value)
- `NODE_ENV=production`

## Security

- Keep real API keys in environment variables or the deployment provider's secret manager. Never commit `.env` or provider keys.
- Generated HTML is returned as data and must not be executed on the API server.
- The browser preview is sandboxed with scripts disabled. Review generated HTML before publishing it elsewhere.
- Authentication, project ownership, usage metering, credit reservations, and persistent storage are not implemented yet.
