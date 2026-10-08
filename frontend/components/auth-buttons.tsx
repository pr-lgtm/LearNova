"use client";

import { getProviders, signIn } from "next-auth/react";
import { useEffect, useState } from "react";

const providers = [
  { id: "google", name: "Google", glyph: "G" },
  { id: "microsoft-entra-id", name: "Microsoft", glyph: "⊞" },
  { id: "apple", name: "Apple", glyph: "●" },
];

export default function AuthButtons() {
  const [available, setAvailable] = useState<Awaited<ReturnType<typeof getProviders>>>(null);

  useEffect(() => {
    getProviders().then(setAvailable);
  }, []);

  return (
    <div className="auth-buttons">
      {available && providers.filter((provider) => available[provider.id]).map((provider) => (
        <button key={provider.id} onClick={() => signIn(provider.id, { redirectTo: "/" })}>
          <span className="provider-glyph">{provider.glyph}</span> Continue with {provider.name}
        </button>
      ))}
      {available && Object.keys(available).length === 0 && <p className="tiny-note">Add OAuth credentials in <code>.env.local</code> to enable sign-in. The demo workspace is ready to explore.</p>}
      {!available && <p className="tiny-note">Loading secure sign-in options…</p>}
    </div>
  );
}
