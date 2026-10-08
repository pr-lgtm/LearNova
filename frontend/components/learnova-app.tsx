"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getSession, signOut } from "next-auth/react";
import LoginGateway from "@/components/login-gateway";
import { api } from "@/lib/api";

type Section = "roadmap" | "chamber" | "tracksy" | "exam" | "counselor";
type Module = { title: string; detail?: string; estimated_hours?: number; base_hours?: number; prior_knowledge?: number; state?: string; progress?: number };
type Activity = { date: string; focusHours: number; switches: number; score: number };
type Video = { id: string; title: string; channel: string; thumbnail: string };
type RoadmapResult = { goal: string; domain: string; estimated_hours: number; estimated_days: number; modules: Module[] };

const navItems: { id: Section; icon: string; label: string }[] = [
  { id: "roadmap", icon: "⌘", label: "AI Roadmap" },
  { id: "chamber", icon: "◉", label: "Study Chamber" },
  { id: "tracksy", icon: "▥", label: "Tracksy Engine" },
  { id: "exam", icon: "▤", label: "College Exam Study" },
  { id: "counselor", icon: "✳", label: "Counselor & Resume" },
];

const startingModules: Module[] = [
  { title: "Foundations of statistics", detail: "Probability · 4 lessons", state: "Complete", progress: 100 },
  { title: "Python for data analysis", detail: "Pandas · 6 lessons", state: "In progress", progress: 62 },
  { title: "SQL & data modeling", detail: "Queries · 5 lessons", state: "Up next", progress: 0 },
];

function Icon({ children }: { children: React.ReactNode }) {
  return <span className="icon" aria-hidden="true">{children}</span>;
}

function RoadmapContent({ modules, focusHours, onBuild, onStart }: { modules: Module[]; focusHours: number; onBuild: (domain?: string) => void; onStart: () => void }) {
  const activeCount = modules.filter((item) => (item.progress ?? 0) < 100).length;
  return <>
    <div className="welcome-row">
      <div><p className="eyebrow">YOUR DASHBOARD</p><h1>Your learning, <span>in motion.</span></h1><p className="muted">Small, focused steps add up. Let’s make today count.</p></div>
      <button className="button-primary" onClick={onBuild}>＋ Build my roadmap</button>
    </div>
    <div className="stats-grid">
      <article className="stat-card"><span className="stat-icon cyan">◷</span><p className="stat-label">Focus logged</p><strong>{focusHours.toFixed(1)} <small>hrs total</small></strong><span className="stat-foot">From your saved sessions</span></article>
      <article className="stat-card"><span className="stat-icon mint">✦</span><p className="stat-label">Roadmap steps</p><strong>{modules.length - activeCount}<small>/{modules.length}</small></strong><span className="stat-foot">Completed modules</span></article>
      <article className="stat-card"><span className="stat-icon violet">◎</span><p className="stat-label">Tab switches</p><strong>{Number(localStorageSafe("learnova-tab-switches"))}<small> this week</small></strong><span className="stat-foot">Counted only during a focus session</span></article>
    </div>
    <div className="content-grid">
      <section className="panel roadmap-panel">
        <div className="panel-heading"><div><p className="eyebrow">YOUR PATH</p><h2>Personalized learning plan</h2></div><button className="icon-button" onClick={onBuild} aria-label="Edit roadmap">···</button></div>
        <p className="muted small">Build a path from your goal, background, and available hours.</p>
        <div className="module-list">{modules.map((module, index) => {
          const progress = module.progress ?? 0;
          const detail = module.detail ?? `${module.estimated_hours ?? module.base_hours ?? 5} estimated hours`;
          const state = module.state ?? (progress > 0 ? "In progress" : "Up next");
          return <div className="module-row" key={`${module.title}-${index}`}><div className={`module-number ${progress === 100 ? "done" : ""}`}>{progress === 100 ? "✓" : `0${index + 1}`}</div><div className="module-copy"><div className="module-title-line"><strong>{module.title}</strong><span className={`pill ${state === "In progress" ? "active" : ""}`}>{state}</span></div><span className="muted small">{detail}</span><div className="progress-track"><span style={{ width: `${progress}%` }}/></div></div></div>;
        })}</div>
        <button className="button-quiet" onClick={onBuild}>Edit learning goal <span>→</span></button>
      </section>
      <section className="panel today-panel">
        <div className="panel-heading"><div><p className="eyebrow">YOUR NEXT STEP</p><h2>Start with 25 minutes</h2></div><span className="live-dot"/></div>
        <div className="today-card"><div className="today-icon">✧</div><div><strong>{modules.find((item) => (item.progress ?? 0) < 100)?.title ?? "Choose a learning goal"}</strong><p className="muted small">A short, focused session</p></div><span className="duration">25 min</span></div>
        <div className="today-note"><span>✦</span><p>Start the focus timer before switching to a lecture. Tab changes are only counted while it is running.</p></div>
        <button className="button-primary full" onClick={onStart}>Start a focus session <span>→</span></button>
      </section>
    </div>
    <section className="panel domains-panel"><div className="panel-heading"><div><p className="eyebrow">EXPLORE YOUR INTERESTS</p><h2>Choose a learning domain</h2></div></div><div className="domain-grid">{[["⌘", "Tech & Data", "Analytics, software, AI"], ["▧", "Humanities", "History, writing, philosophy"], ["文", "Languages", "Learn a language in context"]].map(([icon, name, detail]) => <button className="domain-card" key={name} onClick={() => onBuild(name)}><span>{icon}</span><strong>{name}</strong><small>{detail}</small><i>↗</i></button>)}</div></section>
  </>;
}

function localStorageSafe(key: string) {
  if (typeof window === "undefined") return "0";
  return window.localStorage.getItem(key) ?? "0";
}

function StudyChamber({ onPenalty, totalSwitches }: { onPenalty: () => void; totalSwitches: number }) {
  const [active, setActive] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [sessionSwitches, setSessionSwitches] = useState(0);
  const [topic, setTopic] = useState("Statistics for data analysis");
  const [videos, setVideos] = useState<Video[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchMessage, setSearchMessage] = useState("");
  const [lesson, setLesson] = useState("");
  const [diagram, setDiagram] = useState("");
  const [speaking, setSpeaking] = useState(false);
  const [error, setError] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const hiddenRef = useRef(false);

  useEffect(() => {
    if (!active) return;
    const timer = window.setInterval(() => setSeconds((value) => value + 1), 1000);
    const handleVisibility = () => {
      if (document.hidden && !hiddenRef.current) {
        hiddenRef.current = true;
        setSessionSwitches((value) => value + 1);
        onPenalty();
      } else if (!document.hidden) hiddenRef.current = false;
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => { window.clearInterval(timer); document.removeEventListener("visibilitychange", handleVisibility); };
  }, [active, onPenalty]);

  useEffect(() => { if (videoRef.current && streamRef.current) videoRef.current.srcObject = streamRef.current; }, [cameraOn]);
  useEffect(() => () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    window.speechSynthesis?.cancel();
  }, []);

  const toggleCamera = async () => {
    if (cameraOn) {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      setCameraOn(false);
      return;
    }
    try {
      streamRef.current = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      setCameraOn(true);
    } catch { setError("Camera access was unavailable. The focus timer works without it."); }
  };

  const searchVideos = async (event: React.FormEvent) => {
    event.preventDefault();
    if (topic.trim().length < 2) return;
    setSearching(true); setError(""); setSearchMessage("");
    try {
      const result = await api<{ videos: Video[]; message: string }>(`api/youtube/search?q=${encodeURIComponent(topic)}`);
      setVideos(result.videos); setSearchMessage(result.message);
      if (result.videos[0]) setSelectedVideo(result.videos[0]);
    } catch (err) { setSearchMessage(err instanceof Error ? err.message : "YouTube search failed."); }
    finally { setSearching(false); }
  };

  const makeLesson = async () => {
    setError("");
    try {
      const result = await api<{ lesson: string; diagram: string }>("api/tutor/lesson", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ topic }) });
      setLesson(result.lesson); setDiagram(result.diagram);
    } catch (err) { setError(err instanceof Error ? err.message : "Could not make a lesson."); }
  };

  const speakLesson = () => {
    if (!lesson) return;
    if (speaking) { window.speechSynthesis.cancel(); setSpeaking(false); return; }
    const utterance = new SpeechSynthesisUtterance(lesson);
    utterance.onend = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
    setSpeaking(true);
  };

  const time = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
  return <>
    <div className="welcome-row"><div><p className="eyebrow">DISTRACTION-SHIELDED SPACE</p><h1>Welcome to your <span>study chamber.</span></h1><p className="muted">Start the timer to activate the tab-switch shield.</p></div><div className={`session-clock ${active ? "running" : ""}`}>◷ &nbsp;{time}</div></div>
    {active && <div className="focus-warning">{sessionSwitches > 0 ? `Focus Shield · ${sessionSwitches} tab switch${sessionSwitches === 1 ? "" : "es"} during this session` : "Focus Shield active · switching tabs will be logged"}</div>}
    {error && <p className="form-error">{error}</p>}
    <div className="chamber-grid">
      <section className="panel video-panel"><div className="panel-heading"><div><p className="eyebrow">LECTURE MODE</p><h2>Find a YouTube lecture</h2></div><span className="pill active">YouTube</span></div>
        {selectedVideo ? <div className="video-frame"><iframe src={`https://www.youtube-nocookie.com/embed/${selectedVideo.id}?rel=0`} title={selectedVideo.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen/><button className="camera-toggle" onClick={toggleCamera}>{cameraOn ? "Camera off" : "Camera preview"}</button>{cameraOn && <video className="camera-preview" ref={videoRef} autoPlay muted playsInline/>}</div> : <div className="video-placeholder"><div className="play-button">▶</div><div className="video-caption">Your selected lecture will appear here<br/><small>Search by topic below</small></div>{cameraOn && <video className="camera-preview" ref={videoRef} autoPlay muted playsInline/>}</div>}
        <form className="search-row" onSubmit={searchVideos}><input aria-label="Search lectures" value={topic} onChange={(event) => setTopic(event.target.value)} placeholder="Search a topic…"/><button className="button-quiet" disabled={searching}>{searching ? "Searching…" : "Search"}</button></form>
        {searchMessage && <div className="api-message">{searchMessage} {searchMessage.includes("YOUTUBE_API_KEY") && <a href={`https://www.youtube.com/results?search_query=${encodeURIComponent(topic)}`} target="_blank" rel="noreferrer">Open YouTube search →</a>}</div>}
        {videos.length > 0 && <div className="video-results">{videos.map((video) => <button key={video.id} className={`video-result ${selectedVideo?.id === video.id ? "chosen" : ""}`} onClick={() => setSelectedVideo(video)}><img src={video.thumbnail} alt=""/><span><strong>{video.title}</strong><small>{video.channel}</small></span></button>)}</div>}
        <div className="study-controls"><button className="button-primary" onClick={() => setActive((value) => !value)}>{active ? "Pause focus timer" : "Start focus session"}</button><button className="button-secondary" onClick={toggleCamera}>{cameraOn ? "Turn camera off" : "Enable camera preview"}</button></div>
        <p className="tiny-note">Tab switches are counted only while this timer is running. Camera preview does not perform gaze detection.</p>
      </section>
      <section className="panel tutor-panel"><div className="panel-heading"><div><p className="eyebrow">VOICE TUTOR</p><h2>Make a quick concept lesson</h2></div><button className="button-secondary" onClick={makeLesson}>Explain topic</button></div>
        <div className="graph-canvas"><div className="graph-orbit orbit-one"/><div className="graph-orbit orbit-two"/><div className="graph-node central">{topic.split(" ").slice(0,2).join(" ") || "Topic"}</div><div className="graph-node node-a">Question</div><div className="graph-node node-b">Example</div><div className="graph-node node-c">Explain</div><div className="graph-line line-a"/><div className="graph-line line-b"/><div className="graph-line line-c"/><span className="graph-label">{diagram || "Generate an explanation to map the idea"}</span></div>
        {lesson && <div className="lesson-text">{lesson}</div>}
        <div className="audio-player"><button className="audio-play" disabled={!lesson} onClick={speakLesson}>{speaking ? "■" : "▶"}</button><div className="audio-copy"><strong>{speaking ? "Speaking lesson…" : "Browser voice lesson"}</strong><small>{lesson ? "Generated for your topic" : "Select Explain topic to create"}</small></div><button className="button-quiet" disabled={!lesson} onClick={speakLesson}>{speaking ? "Stop" : "Listen"}</button></div>
        <p className="tiny-note">The lesson uses your browser’s built-in speech voice; it does not require an AI key.</p>
      </section>
    </div>
    <div className="session-total muted small">Total tab switches during active study sessions: <strong>{totalSwitches}</strong></div>
  </>;
}

function Tracksy({ tabSwitches, activities, onLog }: { tabSwitches: number; activities: Activity[]; onLog: (activity: Activity) => void }) {
  const [hours, setHours] = useState([1.5, 2, 1, 1.5, 2, 1]);
  const [meetings, setMeetings] = useState(1.5);
  const [actual, setActual] = useState(1);
  const [capacityHours, setCapacityHours] = useState<number | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const weeklyTotal = hours.reduce((sum, value) => sum + value, 0);
  const scoreValues = activities.slice(-7).map((item) => item.score);
  const latestScore = scoreValues.at(-1) ?? 75;
  const points = scoreValues.length > 1 ? scoreValues.map((value, index) => `${(index / (scoreValues.length - 1)) * 600},${140 - value * 1.25}`).join(" ") : "0,80 100,72 200,84 300,51 400,64 500,39 600,48";

  const adapt = async () => {
    setMessage("");
    try {
      const result = await api<{ study_target_hours: number }>("api/tracksy/capacity", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ baseline_hours: hours[3], meeting_hours: [meetings], burnout_penalty: 0 }) });
      setCapacityHours(result.study_target_hours);
    } catch (err) { setMessage(err instanceof Error ? err.message : "Could not adapt the plan."); }
  };

  const logSession = async () => {
    setMessage("");
    try {
      const result = await api<{ reality_score: number }>("api/tracksy/reality-score", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ planned_hours: Math.max(hours[3], 0.25), actual_hours: actual, tab_switches: tabSwitches, previous_score: latestScore }) });
      setScore(result.reality_score);
      onLog({ date: new Date().toISOString().slice(0, 10), focusHours: actual, switches: tabSwitches, score: result.reality_score });
      setMessage("Session saved. Your focus chart has been updated.");
    } catch (err) { setMessage(err instanceof Error ? err.message : "Could not save the session."); }
  };

  return <><div className="welcome-row"><div><p className="eyebrow">TRACKSY ENGINE</p><h1>Plan for <span>real life.</span></h1><p className="muted">Set your week, adapt around commitments, and log completed focus.</p></div><div className="period-select">This week · {weeklyTotal.toFixed(1)} hrs</div></div>
    <div className="tracksy-grid"><section className="panel routine-panel"><div className="panel-heading"><div><p className="eyebrow">ADAPTIVE ROUTINE</p><h2>Your study capacity</h2></div></div><p className="muted small">Set planned hours by day. Meeting time is subtracted from Thursday.</p><div className="hours-list">{days.map((day, i) => <label key={day}><span>{day}</span><input type="number" min="0" max="8" step="0.5" value={hours[i]} onChange={(event) => setHours((current) => current.map((value, index) => index === i ? Number(event.target.value) : value))}/><small>hours</small></label>)}</div><label className="number-field">Thursday meetings <input type="number" min="0" max="8" step="0.5" value={meetings} onChange={(event) => setMeetings(Number(event.target.value))}/><small>hours</small></label><div className="capacity-note"><span>✦</span><p>{capacityHours === null ? "Calculate a realistic target after meetings are counted." : `Adjusted Thursday target: ${capacityHours.toFixed(1)} focused hours.`}</p></div><button className="button-secondary full" onClick={adapt}>Calculate adjusted target</button><div className="log-session"><h3>End-of-task check-in</h3><label className="number-field">Actual focus <input type="number" min="0" max="12" step="0.25" value={actual} onChange={(event) => setActual(Number(event.target.value))}/><small>hours</small></label><button className="button-primary full" onClick={logSession}>Log session & update analytics</button>{score !== null && <p className="success-message">Reality score: {score.toFixed(0)}/100</p>}</div>{message && <p className="tiny-note">{message}</p>}</section>
      <div className="tracksy-right"><section className="panel heatmap-panel"><div className="panel-heading"><div><p className="eyebrow">CONSISTENCY AT A GLANCE</p><h2>Monthly focus</h2></div><span className="muted small">{activities.length} logged sessions</span></div><div className="heatmap-wrap"><div className="heatmap-days">M<br/>W<br/>F</div><div className="heatmap-grid">{Array.from({ length: 84 }, (_, index) => { const item = activities[index % Math.max(activities.length, 1)]; const heat = item ? Math.min(4, Math.ceil(item.focusHours)) : 0; return <i key={index} className={`heat-${index < 84 - activities.length ? 0 : heat}`} title={item ? `${item.focusHours} hours` : "No session logged"}/>; })}</div></div><div className="heatmap-legend"><span>Less</span>{[0,1,2,3,4].map((value)=><i key={value} className={`heat-${value}`}/>)}<span>More</span></div></section><section className="panel trend-panel"><div className="panel-heading"><div><p className="eyebrow">EMPIRICAL REALITY SCORE</p><h2>Execution over time</h2></div><span className="trend-value">{score?.toFixed(0) ?? latestScore.toFixed(0)} <small>{score === null ? "starting score" : "updated"}</small></span></div><div className="chart"><div className="chart-lines"><i/><i/><i/></div><svg viewBox="0 0 600 150" preserveAspectRatio="none" aria-label="Reality score trend"><polyline points={points} fill="none" stroke="#67d8e8" strokeWidth="3"/><polyline points="0,130 600,58" fill="none" stroke="#9c8cf2" strokeWidth="2" strokeDasharray="6 7"/></svg></div><div className="chart-axis"><span>Earlier</span><span>Today</span></div></section></div></div>{tabSwitches > 0 && <div className="workload-alert">Active-study tab switches logged: {tabSwitches}. These only count while the focus timer is running.</div>}</>;
}

function ExamWorkspace() {
  const [fileName, setFileName] = useState("");
  const [topics, setTopics] = useState<string[]>([]);
  const [plan, setPlan] = useState<{ topic: string; suggested_minutes: number; status: string }[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const upload = async (file?: File) => {
    if (!file) return;
    setFileName(file.name); setTopics([]); setPlan([]); setError(""); setBusy(true);
    const formData = new FormData(); formData.append("file", file);
    try {
      const result = await api<{ topics: string[]; plan: { topic: string; suggested_minutes: number; status: string }[] }>("api/exam/parse", { method: "POST", body: formData });
      setTopics(result.topics); setPlan(result.plan);
      if (!result.topics.length) setError("Text was extracted, but no topic headings were found. You can still use the extracted list after re-uploading a clearer PDF.");
    } catch (err) { setError(err instanceof Error ? err.message : "Could not analyze this PDF."); }
    finally { setBusy(false); }
  };

  return <><div className="welcome-row"><div><p className="eyebrow">COLLEGE EXAM STUDY</p><h1>Study with your <span>syllabus in view.</span></h1><p className="muted">Upload a text-based PDF and Learnova will extract topics into study blocks.</p></div></div><section className="panel upload-panel"><div className="upload-icon">▤</div><h2>{busy ? "Reading your syllabus…" : fileName ? "Syllabus analyzed" : "Upload a syllabus or datesheet"}</h2><p className="muted">PDF text is sent to your Learnova API for extraction. Files are not stored by this starter.</p><label className="upload-button">{busy ? "Processing PDF…" : "Choose and analyze PDF"}<input type="file" accept="application/pdf" disabled={busy} onChange={(event) => upload(event.target.files?.[0])}/></label>{fileName && <p className="file-picked">{busy ? "Reading" : "Analyzed"}: {fileName}</p>}{error && <p className="form-error">{error}</p>}{plan.length > 0 && <div className="parsed-plan"><h3>Suggested study blocks</h3>{plan.map((item, index) => <div className="parsed-topic" key={`${item.topic}-${index}`}><span>{String(index + 1).padStart(2,"0")}</span><strong>{item.topic}</strong><small>{item.suggested_minutes} min · {item.status}</small></div>)}</div>}<p className="tiny-note">Scanned image-only PDFs need OCR and are not supported by this first parser.</p></section></>;
}

function CounselorResume({ tabSwitches, activities }: { tabSwitches: number; activities: Activity[] }) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{ role: "assistant" | "you"; text: string }[]>([{ role: "assistant", text: "Tell me what made learning easier or harder today. I’ll help you pick one practical next step." }]);
  const [sending, setSending] = useState(false);
  const [copied, setCopied] = useState(false);
  const totalHours = activities.reduce((sum, item) => sum + item.focusHours, 0);
  const resume = `PRIYANSHU MANISH\nDATA ANALYTICS LEARNER\n\nPROFILE\nCurious analyst building practical skills in statistics, Python, and data storytelling.\n\nSELECTED ACCOMPLISHMENTS\n• Applied Python and pandas concepts to clean and explore structured datasets.\n• Logged ${totalHours.toFixed(1)} focused study hours and reviewed execution patterns in Tracksy.\n• Recorded ${tabSwitches} tab switches during active study sessions and used the feedback to protect focus.`;

  const send = async (event: React.FormEvent) => {
    event.preventDefault(); if (!input.trim() || sending) return;
    const message = input.trim(); setInput(""); setMessages((current) => [...current, { role: "you", text: message }]); setSending(true);
    try {
      const result = await api<{ reply: string }>("api/counselor/respond", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ message, planned_hours: 2, actual_hours: totalHours, tab_switches: tabSwitches }) });
      setMessages((current) => [...current, { role: "assistant", text: result.reply }]);
    } catch (err) { setMessages((current) => [...current, { role: "assistant", text: err instanceof Error ? err.message : "The counselor service could not reply." }]); }
    finally { setSending(false); }
  };

  const download = () => {
    const blob = new Blob([resume], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob); const anchor = document.createElement("a");
    anchor.href = url; anchor.download = "priyanshu-manish-resume.md"; anchor.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return <><div className="welcome-row"><div><p className="eyebrow">COUNSELOR & RESUME</p><h1>Reflect, then <span>take the next step.</span></h1><p className="muted">A practical check-in and a resume you can download and edit.</p></div></div><div className="counselor-grid"><section className="panel counselor-panel"><div className="panel-heading"><div><p className="eyebrow">COUNSELOR</p><h2>Execution check-in</h2></div><span className="live-dot"/></div><div className="chat-thread">{messages.map((message,index)=><div className={`chat-message ${message.role === "you" ? "user-message" : "assistant-message"}`} key={`${message.role}-${index}`}>{message.text}<span>{message.role === "you" ? "You" : "Learnova"}</span></div>)}</div><form onSubmit={send}><textarea value={input} onChange={(event) => setInput(event.target.value)} placeholder="What got in your way today?"/><button className="button-primary full" disabled={sending || !input.trim()}>{sending ? "Thinking…" : "Send check-in →"}</button></form><p className="tiny-note">This study coach is a demo tool, not mental health care.</p></section><section className="panel resume-panel"><div className="panel-heading"><div><p className="eyebrow">DYNAMIC RESUME</p><h2>Priyanshu Manish</h2></div><button className="button-secondary" onClick={() => { navigator.clipboard?.writeText(resume); setCopied(true); }}> {copied ? "Copied ✓" : "Copy"}</button></div><p className="resume-role">DATA ANALYTICS LEARNER</p><hr/><h3>Profile</h3><p className="muted">Curious analyst building practical skills in statistics, Python, and data storytelling.</p><h3>Selected accomplishments</h3><ul><li>Applied Python and pandas concepts to clean and explore structured datasets.</li><li>Logged {totalHours.toFixed(1)} focused study hours and reviewed execution patterns.</li><li>Recorded {tabSwitches} tab switches during active focus sessions.</li></ul><button className="button-primary full" onClick={download}>Download resume (.md) ↓</button></section></div></>;
}

function RoadmapBuilder({ onClose, onResult, initialDomain }: { onClose: () => void; onResult: (result: RoadmapResult) => void; initialDomain: string }) {
  const [goal, setGoal] = useState("Become a data analyst");
  const [domain, setDomain] = useState(initialDomain);
  const [background, setBackground] = useState("Beginner");
  const [hours, setHours] = useState(1.5);
  const [result, setResult] = useState<RoadmapResult | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const value = await api<RoadmapResult>("api/roadmap/generate", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ goal, domain, background, daily_hours: hours }) });
      setResult(value); onResult(value);
    } catch (err) { setError(err instanceof Error ? err.message : "Could not create a roadmap."); }
    finally { setBusy(false); }
  };

  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="roadmap-title"><button className="modal-close" onClick={onClose} aria-label="Close">×</button><p className="eyebrow">BASELINE SURVEY</p><h2 id="roadmap-title">Build your learning roadmap</h2><p className="muted small">Your answers shape the time estimate and module sequence.</p><form onSubmit={submit}><label>Career or learning goal<input required minLength={3} maxLength={180} value={goal} onChange={(event) => setGoal(event.target.value)}/></label><label>Domain<select value={domain} onChange={(event) => setDomain(event.target.value)}><option>Tech & Data</option><option>Humanities</option><option>Languages</option></select></label><label>Current background<select value={background} onChange={(event) => setBackground(event.target.value)}><option>Beginner</option><option>Some experience</option><option>Intermediate</option></select></label><label>Hours available each day<input type="number" min="0.5" max="16" step="0.5" value={hours} onChange={(event) => setHours(Number(event.target.value))}/></label><button className="button-primary full" disabled={busy}>{busy ? "Building…" : "Create my roadmap"}</button></form>{error && <p className="form-error">{error}</p>}{result && <div className="result-note"><strong>{result.estimated_hours} estimated hours · about {result.estimated_days} days</strong><p>{result.modules.map((item) => item.title).join(" → ")}</p></div>}</section></div>;
}

export default function LearnovaApp() {
  const [entered, setEntered] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [section, setSection] = useState<Section>("roadmap");
  const [tabSwitches, setTabSwitches] = useState(0);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [modules, setModules] = useState<Module[]>(startingModules);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [builderDomain, setBuilderDomain] = useState("Tech & Data");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [apiStatus, setApiStatus] = useState("Checking API");
  const current = useMemo(() => navItems.find((item) => item.id === section), [section]);

  useEffect(() => {
    setEntered(localStorage.getItem("learnova-demo-session") === "1");
    setTabSwitches(Number(localStorage.getItem("learnova-tab-switches") ?? "0"));
    try { const stored = JSON.parse(localStorage.getItem("learnova-activities") ?? "[]"); if (Array.isArray(stored)) setActivities(stored); } catch { setActivities([]); }
    getSession().then((session) => { if (session) setEntered(true); }).catch(() => undefined).finally(() => setCheckingSession(false));
    api<{ status: string }>("api/health").then(() => setApiStatus("API connected")).catch(() => setApiStatus("API offline"));
  }, []);

  const countPenalty = useCallback(() => {
    setTabSwitches((value) => {
      const next = value + 1; localStorage.setItem("learnova-tab-switches", String(next)); return next;
    });
  }, []);

  const saveActivity = useCallback((activity: Activity) => {
    setActivities((current) => { const next = [...current, activity].slice(-84); localStorage.setItem("learnova-activities", JSON.stringify(next)); return next; });
  }, []);

  const leave = async () => {
    localStorage.removeItem("learnova-demo-session");
    await signOut({ redirect: false }).catch(() => undefined);
    setEntered(false);
  };

  if (checkingSession && !entered) return <main className="login-screen"><section className="login-card"><p className="eyebrow">LEARNOVA</p><h1>Preparing your <span>workspace.</span></h1></section></main>;
  if (!entered) return <LoginGateway onDemoLogin={() => setEntered(true)}/>;

  return <div className="app-shell">
    <aside className={`sidebar ${mobileMenu ? "sidebar-open" : ""}`}><a href="/" className="brand"><img src="/learnova_icon.svg" alt="" style={{ width: 34, height: 34, flex: "0 0 34px" }}/><span>learnova<small>COGNITIVE EXECUTION OS</small></span></a><div className="workspace-label">WORKSPACE</div><nav>{navItems.map((item) => <button key={item.id} className={`nav-item ${section === item.id ? "selected" : ""}`} onClick={() => { setSection(item.id); setMobileMenu(false); }}><Icon>{item.icon}</Icon>{item.label}{section === item.id && <i/>}</button>)}</nav><div className="sidebar-bottom"><div className="streak-card"><span className="streak-spark">✦</span><div><strong>{activities.length} logged sessions</strong><small>{tabSwitches} focus tab switches</small></div><span>↗</span></div><div className="sidebar-user"><div className="avatar">PM</div><div><strong>Priyanshu Manish</strong><small>Demo student</small></div><button aria-label="Sign out" title="Sign out" onClick={leave}>↪</button></div></div></aside>
    <main className="main-area"><header className="topbar"><button className="mobile-menu" onClick={() => setMobileMenu((value) => !value)} aria-label="Toggle navigation">☰</button><div className="breadcrumb">Workspace <span>/</span> {current?.label}</div><div className="topbar-right"><span className={`api-status ${apiStatus === "API connected" ? "api-connected" : ""}`}><i/> {apiStatus}</span><button className="top-icon" aria-label="Sign out" title="Sign out" onClick={leave}>↪</button><div className="avatar small-avatar">PM</div></div></header>
      <div className="page-content">{section === "roadmap" && <RoadmapContent modules={modules} focusHours={activities.reduce((sum, item) => sum + item.focusHours, 0)} onBuild={(domain) => { setBuilderDomain(domain ?? "Tech & Data"); setBuilderOpen(true); }} onStart={() => setSection("chamber")}/ >}{section === "chamber" && <StudyChamber onPenalty={countPenalty} totalSwitches={tabSwitches}/ >}{section === "tracksy" && <Tracksy tabSwitches={tabSwitches} activities={activities} onLog={saveActivity}/ >}{section === "exam" && <ExamWorkspace/>}{section === "counselor" && <CounselorResume tabSwitches={tabSwitches} activities={activities}/>}</div>
      <footer className="app-footer"><span>© 2026 Learnova OS</span><span>Made for steady progress <b>✦</b></span><button onClick={leave}>Sign out</button></footer>
    </main>
    {builderOpen && <RoadmapBuilder initialDomain={builderDomain} onClose={() => setBuilderOpen(false)} onResult={(result) => setModules(result.modules.map((item, index) => ({ ...item, detail: `${item.estimated_hours} estimated hours`, state: index === 0 ? "In progress" : "Up next", progress: 0 })))}/>}
  </div>;
}
