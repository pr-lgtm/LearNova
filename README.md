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

In GitHub Codespaces, keep the frontend and API terminals running. The frontend proxies API calls through `/api/backend`, so `API_INTERNAL_URL=http://127.0.0.1:8000` reaches the API from the Codespace server. Open forwarded port 3000 for the app; port 8000 is the API.

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
- Optional webcam preview (browser permission required), YouTube Data API search, and browser speech for tutor lessons.
- Syllabus PDF text extraction and topic study blocks.
- Roadmap generation, adaptive capacity, counselor check-ins, and Tracksy score endpoints.
- OAuth provider configuration and demo access.

Roadmaps, syllabus topic extraction, tutor lessons, and counselor replies use Gemini when `GEMINI_API_KEY` is configured, with a local fallback when it is not. YouTube search needs a `YOUTUBE_API_KEY` in `backend/.env`; without it, the app offers a direct YouTube search link. Study sessions and Tracksy entries are saved in this browser's local storage, not PostgreSQL. Camera preview is not gaze detection; head tracking needs a separate computer-vision model and explicit user consent.

The frontend uses the Next.js App Router and Tailwind CSS 4 for the styling pipeline; the dashboard's visual system is kept in `frontend/app/globals.css` so you can tune it in one place.

## Configure OAuth

Copy `frontend/.env.example` to `frontend/.env.local`, add provider credentials, and set `AUTH_SECRET`. For local OAuth callbacks, register `http://localhost:3000/api/auth/callback/google`, `/microsoft-entra-id`, and `/apple` with the providers you enable. The login gateway always shows all three providers; they are disabled until their credentials are set. Use Quick Login as Demo Student to explore without OAuth. Apple also needs its provider-specific key and team setup.

For YouTube search, copy `backend/.env.example` to `backend/.env`, add a YouTube Data API key, and restart FastAPI. The exam parser handles text-based PDFs; scanned pages need OCR.

## Deployment

`render.yaml` describes the FastAPI service. Deploy the Next.js `frontend/` directory on Vercel and set `NEXT_PUBLIC_API_URL` to the deployed API URL. Set `FRONTEND_ORIGIN` on Render to the exact Vercel origin. Database credentials and AI/API keys should be added in hosting dashboards, never committed to source control.
