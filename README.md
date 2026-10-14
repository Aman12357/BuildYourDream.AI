# BuildYourDream.AI

BuildYourDream.AI is an AI website-builder project. This repository currently contains the first frontend foundation.

## Current status

- Responsive React + TypeScript + Vite homepage
- Prompt input and example prompts
- Starter visual concepts for portfolio, store, and startup websites
- Clear notice that real AI generation is not connected yet

## Run locally

Requirements: Node.js 20 or newer and npm.

    npm install
    npm run dev

Open the local URL printed by Vite.

## Build for production

    npm run build
    npm run preview

## Planned roadmap

1. Frontend and accessible responsive UI
2. Authentication and separate user/admin roles
3. Backend API and project persistence
4. AI provider adapter and isolated preview sandbox
5. Database/storage quotas, metering, and credit billing
6. Deployment and production security

## Security notes

- Never commit API keys, passwords, database URLs, or other secrets.
- AI generation and user authentication are not implemented in this starter.
- Do not run generated user code directly on the application server. A restricted sandbox is required before enabling code execution.
