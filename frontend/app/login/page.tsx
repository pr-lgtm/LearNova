import AuthButtons from "@/components/auth-buttons";

export default function LoginPage() {
  return (
    <main className="login-screen">
      <section className="login-card">
        <img src="/learnova_icon.svg" alt="Learnova" style={{ width: 54, height: 54, margin: "0 auto 18px", display: "block", borderRadius: 16 }}/>
        <p className="eyebrow">LEARNOVA COGNITIVE EXECUTION OS</p>
        <h1>Make room for<br /><span>deep work.</span></h1>
        <p className="muted">A thoughtful system for learning, focus, and momentum.</p>
        <AuthButtons />
        <a className="demo-link" href="/">Explore the demo workspace →</a>
        <p className="tiny-note">Your progress is private and belongs to you.</p>
      </section>
    </main>
  );
}
