# BuildYourDream.AI

BuildYourDream.AI is a plan-first full-stack website starter generator. The frontend is React + TypeScript + Vite; the backend is Node.js + Express. Users receive a short plan before requesting a multi-file project ZIP.

## Current functionality

- Responsive prompt-based builder and sample ideas
- `POST /api/plan`: short plan before generation
- `POST /api/generate-project`: generates a multi-file project with a configured Gemini or Groq model and returns a ZIP
- Gemini is primary when `GEMINI_API_KEY` exists; Groq is used if Gemini is absent or errors
- Generated starter projects are instructed to include a frontend, backend API, PostgreSQL schema, environment example, and README
- API health endpoint, input validation, rate limiting, CORS, and security headers

## Important limitations

- The generated source is an AI-created starter project, not a guarantee of production-ready software. Review and test it before deployment.
- The generated project's database schema is included as source; it does not automatically create a hosted database or configure credentials.
- User login, admin roles, saved project history, credit billing, and one-click publishing for BuildYourDream.AI itself are not implemented yet.
- AI provider free tiers have rate and usage limits. This repository does not promise unlimited free generation.

## Run locally

Requires Node.js 20+ and npm. Open two terminals in the repository root.

### 1. Start the backend

```bash
cd server
npm install
```

Copy `.env.example` to `.env` and add at least one provider key:
- `GEMINI_API_KEY` for Gemini (primary)
- `GROQ_API_KEY` for Groq fallback

Keep keys in `server/.env` locally or the backend host's secret/environment settings. Never put them in Vite variables, frontend source, or GitHub.

Then run:

```bash
npm run dev
```

The API runs at `http://localhost:8787`.

### 2. Start the frontend

From the repository root in a second terminal:

```bash
npm install
npm run dev
```

Open the local URL printed by Vite, usually `http://localhost:5173`. The frontend uses `VITE_API_BASE_URL` if set; otherwise it calls `http://localhost:8787`.

## Production services

- Frontend: https://buildyourdream-ai.onrender.com
- Backend: https://buildyourdream-api.onrender.com
- Health: https://buildyourdream-api.onrender.com/api/health

Set `GEMINI_API_KEY` and optionally `GROQ_API_KEY` in the Render backend environment settings. Do not set these as `VITE_*` variables.

## Generated project output

The downloaded ZIP includes generated source files and a `GENERATION-NOTES.md`. Unzip it, inspect the generated `README.md`, configure the example environment variables, install dependencies, apply the database schema to a database you control, and test all flows before publishing.

## Security

- Never commit provider keys, passwords, or database connection strings.
- Treat generated code as untrusted until reviewed and tested.
- Do not run generated code directly inside the API process.

## DreamOps project workflow prototype

The homepage now includes a **Team workspace** entry for a front-end workflow prototype with five role views:

- **Client:** submit a project brief and requirements.
- **Manager:** review a brief, propose an INR estimate, then assign tasks after CEO approval.
- **CEO:** set and approve the final price; the prototype blocks task assignment until approval.
- **HR:** review an example team roster and workflow checklist.
- **Team:** update task status; progress is reflected in the project tracker.

The workspace demonstrates the intended hand-off: client request → manager estimate → CEO final price approval → task assignment → team progress updates → delivery.

**Important:** This is currently a front-end demo. Sample data and edits are held in React state and reset on refresh. Role switching is not authentication or authorization, and the HR roster is sample data. Before using this with real clients, implement secure login and server-enforced role permissions, persistent PostgreSQL tables for users/projects/quotes/tasks/audit events, API validation, and notification/follow-up handling. Do not use the demo for real pricing commitments or confidential client data.
