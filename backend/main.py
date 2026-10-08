from __future__ import annotations

from datetime import date
from typing import Literal

import numpy as np
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

app = FastAPI(title="Learnova API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in __import__("os").getenv("FRONTEND_ORIGIN", "http://localhost:3000").split(",") if origin.strip()],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


class RoadmapModule(BaseModel):
    title: str
    base_hours: float = Field(gt=0)
    prior_knowledge: Literal[0.0, 0.5, 0.85] = 0.0


class RoadmapRequest(BaseModel):
    goal: str = Field(min_length=3, max_length=180)
    daily_hours: float = Field(gt=0, le=16)
    modules: list[RoadmapModule]


class CapacityRequest(BaseModel):
    baseline_hours: float = Field(ge=0)
    meeting_hours: list[float] = Field(default_factory=list)
    burnout_penalty: float = Field(default=0, ge=0)


class RealityRequest(BaseModel):
    planned_hours: float = Field(gt=0)
    actual_hours: float = Field(ge=0)
    tab_switches: int = Field(default=0, ge=0)
    previous_score: float = Field(default=75, ge=0, le=100)
    alpha: float = Field(default=0.35, gt=0, le=1)
    beta: float = Field(default=0.05, ge=0)


class TrendRequest(BaseModel):
    scores: list[float] = Field(min_length=3)


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "learnova-api"}


@app.post("/api/roadmap/estimate")
def estimate_roadmap(payload: RoadmapRequest) -> dict:
    estimated_hours = sum(module.base_hours * (1 - module.prior_knowledge) for module in payload.modules)
    return {
        "goal": payload.goal,
        "estimated_hours": round(estimated_hours, 2),
        "estimated_days": int(np.ceil(estimated_hours / payload.daily_hours)),
        "modules": [
            {
                "title": module.title,
                "estimated_hours": round(module.base_hours * (1 - module.prior_knowledge), 2),
                "knowledge_weight": module.prior_knowledge,
            }
            for module in payload.modules
        ],
    }


@app.post("/api/tracksy/capacity")
def capacity(payload: CapacityRequest) -> dict[str, float]:
    meetings = sum(max(0, hours) for hours in payload.meeting_hours)
    target = max(1.0, payload.baseline_hours - meetings - payload.burnout_penalty)
    return {"baseline_hours": payload.baseline_hours, "meeting_hours": round(meetings, 2), "study_target_hours": round(target, 2)}


@app.post("/api/tracksy/reality-score")
def reality_score(payload: RealityRequest) -> dict[str, float]:
    execution_ratio = payload.actual_hours / payload.planned_hours
    today_score = max(0.0, min(100.0, execution_ratio * 100 - payload.beta * payload.tab_switches * 100))
    score = payload.alpha * today_score + (1 - payload.alpha) * payload.previous_score
    return {"today_score": round(today_score, 2), "reality_score": round(score, 2)}


@app.post("/api/tracksy/trend")
def trend(payload: TrendRequest) -> dict:
    scores = np.asarray(payload.scores, dtype=float)
    slope, intercept = np.polyfit(np.arange(len(scores)), scores, 1)
    downward_streak = len(scores) >= 3 and bool(np.all(np.diff(scores[-3:]) < 0))
    return {
        "slope": round(float(slope), 3),
        "intercept": round(float(intercept), 3),
        "burnout_alert": bool(slope < -1.5 or downward_streak),
        "workload_reduction": 0.3 if slope < -1.5 else 0.0,
        "as_of": date.today().isoformat(),
    }
