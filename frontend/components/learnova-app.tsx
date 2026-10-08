"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Section = "roadmap" | "chamber" | "tracksy" | "exam" | "counselor";

const navItems: { id: Section; icon: string; label: string }[] = [
  { id: "roadmap", icon: "⌘", label: "AI Roadmap" },
  { id: "chamber", icon: "◉", label: "Study Chamber" },
  { id: "tracksy", icon: "▥", label: "Tracksy Engine" },
  { id: "exam", icon: "▤", label: "College Exam Study" },
  { id: "counselor", icon: "✳", label: "Counselor & Resume" },
];

const modules = [
  { title: "Foundations of statistics", detail: "Probability · 4 lessons", state: "Complete", progress: 100 },
  { title: "Python for data analysis", detail: "Pandas · 6 lessons", state: "In progress", progress: 62 },
  { title: "SQL & data modeling", detail: "Queries · 5 lessons", state: "Up next", progress: 0 },
];

function Icon({ children }: { children: React.ReactNode }) {
  return <span className="icon" aria-hidden="true">{children}</span>;
}

function RoadmapContent() {
  return (
    <>
      <div className="welcome-row">
        <div><p className="eyebrow">THURSDAY, OCTOBER 8, 2026</p><h1>Your learning, <span>in motion.</span></h1><p className="muted">Small, focused steps add up. Let’s make today count.</p></div>
        <button className="button-primary">＋ Build my roadmap</button>
      </div>
      <div className="stats-grid">
        <article className="stat-card"><span className="stat-icon cyan">◷</span><p className="stat-label">Focus this week</p><strong>8.5 <small>hrs</small></strong><span className="stat-foot positive">↗ 12% from last week</span></article>
        <article className="stat-card"><span className="stat-icon mint">✦</span><p className="stat-label">Current streak</p><strong>6 <small>days</small></strong><span className="stat-foot">You’re building a rhythm</span></article>
        <article className="stat-card"><span className="stat-icon violet">◎</span><p className="stat-label">Reality score</p><strong>84<small>/100</small></strong><span className="stat-foot positive">↗ steady and sustainable</span></article>
      </div>
      <div className="content-grid">
        <section className="panel roadmap-panel">
          <div className="panel-heading"><div><p className="eyebrow">YOUR PATH</p><h2>Data analyst foundations</h2></div><button className="icon-button" aria-label="More options">···</button></div>
          <p className="muted small">A roadmap shaped around your goal and the time you have.</p>
          <div className="module-list">{modules.map((module, index) => <div className="module-row" key={module.title}><div className={`module-number ${module.progress === 100 ? "done" : ""}`}>{module.progress === 100 ? "✓" : `0${index + 1}`}</div><div className="module-copy"><div className="module-title-line"><strong>{module.title}</strong><span className={`pill ${module.state === "In progress" ? "active" : ""}`}>{module.state}</span></div><span className="muted small">{module.detail}</span><div className="progress-track"><span style={{ width: `${module.progress}%` }} /></div></div></div>)}</div>
          <button className="button-quiet">View full roadmap <span>→</span></button>
        </section>
        <section className="panel today-panel">
          <div className="panel-heading"><div><p className="eyebrow">YOUR NEXT STEP</p><h2>A little progress today</h2></div><span className="live-dot" /></div>
          <div className="today-card"><div className="today-icon">✧</div><div><strong>Clean and explore a dataset</strong><p className="muted small">Python for data analysis · Lesson 4</p></div><span className="duration">25 min</span></div>
          <div className="today-note"><span>✦</span><p>Your schedule looks lighter today. A focused 25-minute session is a good place to begin.</p></div>
          <button className="button-primary full" onClick={() => window.dispatchEvent(new CustomEvent("learnova:navigate", { detail: "chamber" }))}>Start a focus session <span>→</span></button>
        </section>
      </div>
      <section className="panel domains-panel"><div className="panel-heading"><div><p className="eyebrow">EXPLORE YOUR INTERESTS</p><h2>What are you curious about?</h2></div></div><div className="domain-grid"><button className="domain-card selected"><span>⌘</span><strong>Tech & Data</strong><small>Analytics, software, AI</small><i>↗</i></button><button className="domain-card"><span>▧</span><strong>Humanities</strong><small>History, writing, philosophy</small><i>↗</i></button><button className="domain-card"><span>文</span><strong>Languages</strong><small>Learn a language in context</small><i>↗</i></button></div></section>
    </>
  );
}

function StudyChamber({ onPenalty }: { onPenalty: () => void }) {
  const [active, setActive] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [warning, setWarning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!active) return;
    const timer = window.setInterval(() => setSeconds((value) => value + 1), 1000);
    const handleVisibility = () => {
      if (document.hidden) {
        setWarning(true);
        onPenalty();
      } else setWarning(false);
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => { window.clearInterval(timer); document.removeEventListener("visibilitychange", handleVisibility); };
  }, [active, onPenalty]);

  useEffect(() => {
    if (videoRef.current && streamRef.current) videoRef.current.srcObject = streamRef.current;
  }, [cameraOn]);

  useEffect(() => () => streamRef.current?.getTracks().forEach((track) => track.stop()), []);

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
    } catch {
      alert("Camera access was unavailable. You can allow it in your browser settings and try again.");
    }
  };

  const time = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
  return <>
    {warning && <div className="focus-warning">⚠ Focus Shield · You switched away during an active session</div>}
    <div className="welcome-row"><div><p className="eyebrow">DISTRACTION-SHIELDED SPACE</p><h1>Welcome to your <span>study chamber.</span></h1><p className="muted">One topic, one focused session. You’re in control.</p></div><div className={`session-clock ${active ? "running" : ""}`}>◷ &nbsp;{time}</div></div>
    <div className="chamber-grid">
      <section className="panel video-panel"><div className="panel-heading"><div><p className="eyebrow">LECTURE MODE</p><h2>Learn with a lecture</h2></div><span className="pill active">YouTube</span></div><div className="video-placeholder"><div className="play-button">▶</div><div className="video-caption">Search a topic to find a lecture<br/><small>Your video will appear here</small></div>{cameraOn && <video className="camera-preview" ref={videoRef} autoPlay muted playsInline />}</div><div className="search-row"><input aria-label="Search lectures" placeholder="Search a topic or paste a YouTube link…"/><button className="button-quiet">Search</button></div><div className="study-controls"><button className="button-primary" onClick={() => setActive((value) => !value)}>{active ? "Pause session" : "Start focus session"}</button><button className="button-secondary" onClick={toggleCamera}>{cameraOn ? "Turn camera off" : "Enable camera preview"}</button></div><p className="tiny-note">Camera preview is optional. It does not detect gaze or record video.</p></section>
      <section className="panel tutor-panel"><div className="panel-heading"><div><p className="eyebrow">AI VOICE TUTOR</p><h2>Map the concept</h2></div><span className="pill">Coming next</span></div><div className="graph-canvas"><div className="graph-orbit orbit-one"/><div className="graph-orbit orbit-two"/><div className="graph-node central">Data<br/>analysis</div><div className="graph-node node-a">Clean</div><div className="graph-node node-b">Explore</div><div className="graph-node node-c">Explain</div><div className="graph-line line-a"/><div className="graph-line line-b"/><div className="graph-line line-c"/><span className="graph-label">A simple way to think about it</span></div><div className="audio-player"><button className="audio-play">▶</button><div className="audio-copy"><strong>Understanding a dataset</strong><small>AI lesson · 08:24</small></div><div className="audio-wave">▂▅▃▆▄▇▃▅▂▆▅▃</div></div><p className="tiny-note">Tutor audio and generated diagrams connect when the AI service is configured.</p></section>
    </div>
  </>;
}

function Tracksy({ tabSwitches }: { tabSwitches: number }) {
  const [hours, setHours] = useState([1.5, 2, 1, 1.5, 2, 1]);
  const [logged, setLogged] = useState(false);
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const bars = [46, 72, 54, 82, 68, 90, 58, 70, 42, 76, 60, 88];
  return <><div className="welcome-row"><div><p className="eyebrow">TRACKSY ENGINE</p><h1>Plan for <span>real life.</span></h1><p className="muted">A kinder, clearer picture of how your week is actually going.</p></div><div className="period-select">This week⌄</div></div><div className="tracksy-grid"><section className="panel routine-panel"><div className="panel-heading"><div><p className="eyebrow">ADAPTIVE ROUTINE</p><h2>Your study capacity</h2></div></div><p className="muted small">Set a realistic focus target. Tracksy can make room for busy days.</p><div className="hours-list">{days.map((day, i) => <label key={day}><span>{day}</span><input type="number" min="0" max="8" step="0.5" value={hours[i]} onChange={(e) => setHours((current) => current.map((value, index) => index === i ? Number(e.target.value) : value))}/><small>hours</small></label>)}</div><div className="capacity-note"><span>✦</span><p>Thursday looks full. Your target is softened to <strong>1 focused hour</strong> to leave room to breathe.</p></div><button className="button-primary full" onClick={() => setLogged(true)}>{logged ? "Session logged ✓" : "Log session & adapt timetable"}</button></section><div className="tracksy-right"><section className="panel heatmap-panel"><div className="panel-heading"><div><p className="eyebrow">CONSISTENCY AT A GLANCE</p><h2>Monthly focus</h2></div><span className="muted small">12 sessions</span></div><div className="heatmap-wrap"><div className="heatmap-days">M<br/>W<br/>F</div><div className="heatmap-grid">{Array.from({ length: 84 }, (_, i) => <i key={i} className={`heat-${(i * 7 + Math.floor(i / 4)) % 5}`} />)}</div></div><div className="heatmap-legend"><span>Less</span>{[0,1,2,3,4].map((n)=><i key={n} className={`heat-${n}`}/>)}<span>More</span></div></section><section className="panel trend-panel"><div className="panel-heading"><div><p className="eyebrow">EMPIRICAL REALITY SCORE</p><h2>Execution over time</h2></div><span className="trend-value">84 <small>↗ 6%</small></span></div><div className="chart"><div className="chart-lines"><i/><i/><i/></div><svg viewBox="0 0 600 150" preserveAspectRatio="none" aria-label="Weekly reality score trend"><polyline points="0,118 55,95 110,107 165,71 220,84 275,56 330,78 385,42 440,61 495,28 550,46 600,20" fill="none" stroke="#67d8e8" strokeWidth="3"/><polyline points="0,130 600,58" fill="none" stroke="#9c8cf2" strokeWidth="2" strokeDasharray="6 7"/>{[[0,118],[55,95],[110,107],[165,71],[220,84],[275,56],[330,78],[385,42],[440,61],[495,28],[550,46],[600,20]].map(([x,y],i)=><circle key={i} cx={x} cy={y} r="4" fill="#67d8e8"/>)}</svg></div><div className="chart-axis"><span>Sep 29</span><span>Oct 2</span><span>Oct 5</span><span>Today</span></div></section></div></div>{tabSwitches > 0 && <div className="workload-alert">Focus log: {tabSwitches} tab {tabSwitches === 1 ? "switch" : "switches"} recorded during active sessions.</div>}</>;
}

function OtherContent({ section }: { section: "exam" | "counselor" }) {
  const [fileName, setFileName] = useState("");
  if (section === "exam") return <><div className="welcome-row"><div><p className="eyebrow">COLLEGE EXAM STUDY</p><h1>Study with your <span>syllabus in view.</span></h1><p className="muted">Bring your course material into a clear, manageable plan.</p></div></div><section className="panel upload-panel"><div className="upload-icon">▤</div><h2>Upload a syllabus or datesheet</h2><p className="muted">Add a PDF to organize topics, dates, and study blocks.</p><label className="upload-button">Choose a PDF<input type="file" accept="application/pdf" onChange={(e) => setFileName(e.target.files?.[0]?.name ?? "")}/></label>{fileName && <p className="file-picked">✓ {fileName}</p>}<p className="tiny-note">Files stay in this browser demo. PDF extraction will connect to the API in the next build step.</p></section></>;
  return <><div className="welcome-row"><div><p className="eyebrow">COUNSELOR & RESUME</p><h1>Notice the pattern. <span>Choose the next step.</span></h1><p className="muted">Honest reflection, practical support, and a resume that grows with you.</p></div></div><div className="counselor-grid"><section className="panel counselor-panel"><div className="panel-heading"><div><p className="eyebrow">COUNSELOR</p><h2>A clear next step</h2></div><span className="live-dot"/></div><div className="chat-message assistant-message">You’ve been building a steady rhythm. What’s one thing that made it easier to focus this week?<span>Learnova · just now</span></div><textarea placeholder="Write what’s on your mind…"/><button className="button-primary full">Continue the conversation →</button><p className="tiny-note">This demo is for study reflection, not mental health care.</p></section><section className="panel resume-panel"><div className="panel-heading"><div><p className="eyebrow">DYNAMIC RESUME</p><h2>Priyanshu Manish</h2></div><button className="button-secondary" onClick={() => navigator.clipboard?.writeText("Priyanshu Manish\nData Analytics Learner\n\n• Applied Python and pandas to clean and explore learning datasets.")}>Copy</button></div><p className="resume-role">DATA ANALYTICS LEARNER</p><hr/><h3>Profile</h3><p className="muted">Curious analyst building practical skills in statistics, Python, and data storytelling.</p><h3>Selected accomplishments</h3><ul><li>Applied Python and pandas concepts to clean and explore structured datasets.</li><li>Built a consistent, measurable study routine through weekly reflection.</li></ul><button className="button-quiet">Download resume ↓</button></section></div></>;
}

export default function LearnovaApp() {
  const [section, setSection] = useState<Section>("roadmap");
  const [tabSwitches, setTabSwitches] = useState(0);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [apiStatus, setApiStatus] = useState("Demo workspace");
  const current = useMemo(() => navItems.find((item) => item.id === section), [section]);

  useEffect(() => {
    const navigate = (event: Event) => setSection((event as CustomEvent<Section>).detail);
    window.addEventListener("learnova:navigate", navigate);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (apiUrl) fetch(`${apiUrl}/api/health`).then((res) => { if (res.ok) setApiStatus("API connected"); }).catch(() => undefined);
    return () => window.removeEventListener("learnova:navigate", navigate);
  }, []);

  return <div className="app-shell">
    <aside className={`sidebar ${mobileMenu ? "sidebar-open" : ""}`}>
      <a href="/" className="brand"><img src="/learnova_icon.svg" alt="" style={{ width: 34, height: 34, flex: "0 0 34px" }}/><span>learnova<small>COGNITIVE EXECUTION OS</small></span></a>
      <div className="workspace-label">WORKSPACE</div>
      <nav>{navItems.map((item) => <button key={item.id} className={`nav-item ${section === item.id ? "selected" : ""}`} onClick={() => { setSection(item.id); setMobileMenu(false); }}><Icon>{item.icon}</Icon>{item.label}{section === item.id && <i/>}</button>)}</nav>
      <div className="sidebar-bottom"><div className="streak-card"><span className="streak-spark">✦</span><div><strong>6 day streak</strong><small>Keep your rhythm going</small></div><span>↗</span></div><div className="sidebar-user"><div className="avatar">PM</div><div><strong>Priyanshu Manish</strong><small>Demo student</small></div><button aria-label="Open profile">···</button></div></div>
    </aside>
    <main className="main-area"><header className="topbar"><button className="mobile-menu" onClick={() => setMobileMenu(!mobileMenu)} aria-label="Toggle navigation">☰</button><div className="breadcrumb">Workspace <span>/</span> {current?.label}</div><div className="topbar-right"><span className="api-status"><i/> {apiStatus}</span><button className="top-icon" aria-label="Notifications">♧</button><div className="avatar small-avatar">PM</div></div></header>
      <div className="page-content">{section === "roadmap" && <RoadmapContent/>}{section === "chamber" && <StudyChamber onPenalty={() => setTabSwitches((value) => value + 1)}/ >}{section === "tracksy" && <Tracksy tabSwitches={tabSwitches}/ >}{(section === "exam" || section === "counselor") && <OtherContent section={section}/>}</div>
      <footer className="app-footer"><span>© 2026 Learnova OS</span><span>Made for steady progress <b>✦</b></span><a href="/login">Sign in with your account</a></footer>
    </main>
  </div>;
}
