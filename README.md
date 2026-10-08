# Learnova OS

Learnova is a study execution workspace built as a small monorepo. The `frontend/` folder contains a Next.js app; `backend/` contains the FastAPI service for roadmap estimates and Tracksy metrics.

## Open and run in VS Code

1. Open this repository folder in VS Code.
2. Install Node.js 20.9 or newer and Python 3.10 or newer.
3. In a terminal, start the API:

   ```bash
   cd backend
   python -m venv .venv
   source .venv/bin/activate  # Windows: .venv\\Scripts\\activate
   pip install -r requirements.txt
   uvicorn main:app --reload --port 8000
   ```

4. In a second terminal, start the web app:

   ```bash
   cd frontend
   npm install
   cp .env.example .env.local
   npm run dev
   ```

5. Visit [http://localhost:3000](http://localhost:3000). The dashboard opens in demo mode so you can explore without API credentials. The API docs are at [http://localhost:8000/docs](http://localhost:8000/docs).

## Repository map

```text
learnova-os/
├── backend/
│   ├── main.py                 # FastAPI routes and Tracksy formulas
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── app/                    # Next.js routes and global styling
│   ├── components/             # Interactive Learnova workspace
│   ├── auth.ts                 # Google, Microsoft, and Apple OAuth setup
│   ├── package.json
│   └── .env.example
├── render.yaml                 # FastAPI deployment blueprint
└── README.md
```

## What works in this starter

- Dashboard navigation for AI Roadmap, Study Chamber, Tracksy, College Exam Study, and Counselor & Resume.
- Study timer with a tab visibility penalty that only runs during an active session.
- Optional webcam preview (browser permission required).
- Roadmap and Tracksy math endpoints, with a demo workspace that still renders if the API is offline.
- OAuth provider configuration ready for credentials.

The demo counselor, roadmap content, video recommendations, and resume preview are sample UI data. Connect Gemini, YouTube Data API, persistent PostgreSQL storage, and a PDF parser before using these as production features. Camera preview is not gaze detection; head tracking needs a separate computer-vision model and explicit user consent.

The frontend uses the Next.js App Router and Tailwind CSS 4 for the styling pipeline; the dashboard's visual system is kept in `frontend/app/globals.css` so you can tune it in one place.

## Configure OAuth

Copy `frontend/.env.example` to `frontend/.env.local`, add provider credentials, and set `AUTH_SECRET`. For local OAuth callbacks, register `http://localhost:3000/api/auth/callback/google`, `/microsoft-entra-id`, and `/apple` with the providers you enable. The login screen only shows providers with complete credentials. Apple also needs its provider-specific key and team setup.

## Deployment

`render.yaml` describes the FastAPI service. Deploy the Next.js `frontend/` directory on Vercel and set `NEXT_PUBLIC_API_URL` to the deployed API URL. Set `FRONTEND_ORIGIN` on Render to the exact Vercel origin. Database credentials and AI/API keys should be added in hosting dashboards, never committed to source control.
