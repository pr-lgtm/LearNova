"use client";

import { getProviders, signIn } from "next-auth/react";
import { useEffect, useState } from "react";

const providers = [
  { id: "google", name: "Google", glyph: "G" },
  { id: "microsoft-entra-id", name: "Microsoft", glyph: "⊞" },
  { id: "apple", name: "Apple", glyph: "●" },
];

export default function AuthButtons({ onDemoLogin }: { onDemoLogin?: () => void }) {
  const [available, setAvailable] = useState<Awaited<ReturnType<typeof getProviders>>>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    getProviders().then(setAvailable).catch(() => setAvailable({}));
  }, []);

  return (
    <div className="auth-buttons">
      {providers.map((provider) => {
        const enabled = Boolean(available?.[provider.id]);
        return (
          <button key={provider.id} disabled={!enabled} onClick={() => {
            if (enabled) signIn(provider.id, { redirectTo: "/" }).catch(() => setMessage(`Could not start ${provider.name} sign-in. Check its OAuth settings.`));
          }}>
            <span className="provider-glyph">{provider.glyph}</span> Continue with {provider.name}
            {!enabled && <small className="provider-status">Set up credentials</small>}
          </button>
        );
      })}
      {available && Object.keys(available).length === 0 && <p className="tiny-note">Google, Microsoft, and Apple sign-in need provider credentials in <code>.env.local</code>.</p>}
      {message && <p className="form-error">{message}</p>}
      <button className="demo-login-button" onClick={() => {
        localStorage.setItem("learnova-demo-session", "1");
        if (onDemoLogin) onDemoLogin(); else window.location.assign("/");
      }}>Quick Login as Demo Student</button>
    </div>
  );
}
