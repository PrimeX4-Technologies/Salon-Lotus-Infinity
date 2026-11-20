import { useEffect, useRef, useState } from "react";

interface GoogleCredentialResponse {
  credential?: string;
}

interface GoogleAccounts {
  id: {
    initialize: (options: { client_id: string; callback: (response: GoogleCredentialResponse) => void }) => void;
    renderButton: (element: HTMLElement, options: Record<string, unknown>) => void;
  };
}

declare global {
  interface Window {
    google?: { accounts: GoogleAccounts };
  }
}

let googleScriptPromise: Promise<void> | null = null;

const loadGoogleScript = (): Promise<void> => {
  if (window.google) return Promise.resolve();
  if (!googleScriptPromise) {
    googleScriptPromise = new Promise((resolve, reject) => {
      const existing = document.querySelector<HTMLScriptElement>("script[data-google-identity]");
      if (existing) {
        existing.addEventListener("load", () => resolve(), { once: true });
        existing.addEventListener("error", () => reject(new Error("Google Sign-In could not load.")), { once: true });
        return;
      }
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.dataset.googleIdentity = "true";
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Google Sign-In could not load."));
      document.head.appendChild(script);
    });
  }
  return googleScriptPromise;
};

export function GoogleSignIn({ onCredential }: { onCredential: (credential: string) => void }) {
  const container = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (!clientId || !container.current) return;
    let active = true;
    loadGoogleScript()
      .then(() => {
        if (!active || !container.current || !window.google) return;
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => {
            if (response.credential) onCredential(response.credential);
          },
        });
        container.current.replaceChildren();
        window.google.accounts.id.renderButton(container.current, {
          theme: "filled_black",
          size: "large",
          shape: "pill",
          width: container.current.clientWidth,
          text: "continue_with",
        });
      })
      .catch(() => setFailed(true));
    return () => {
      active = false;
    };
  }, [clientId, onCredential]);

  if (!clientId || failed) return null;
  return <div ref={container} className="min-h-10 w-full overflow-hidden rounded-xl" />;
}
