"use client";

import AuthButtons from "@/components/auth-buttons";

export default function LoginGateway({ onDemoLogin }: { onDemoLogin?: () => void }) {
  return (
    <main className="login-screen">
      <section className="login-card">
        <img src="/learnova_icon.svg" alt="Learnova" style={{ width: 54, height: 54, margin: "0 auto 18px", display: "block", borderRadius: 16 }}/>
        <p className="eyebrow">LEARNOVA COGNITIVE EXECUTION OS</p>
        <h1>Make room for<br/><span>deep work.</span></h1>
        <p className="muted">A thoughtful system for learning, focus, and momentum.</p>
        <AuthButtons onDemoLogin={onDemoLogin}/>
        <p className="tiny-note" style={{ marginTop: 16 }}>Your progress stays in this demo browser until you connect an account.</p>
      </section>
    </main>
  );
}
