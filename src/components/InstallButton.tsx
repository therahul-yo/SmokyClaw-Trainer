import { useEffect, useState } from "react";

// Captures the browser's `beforeinstallprompt` event and exposes a button to
// trigger the native install flow. Renders nothing when the app is already
// installed or the browser doesn't support installation (e.g. iOS Safari,
// which uses the manual Share → Add to Home Screen flow instead).
type BIPEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function InstallButton() {
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);

  useEffect(() => {
    function onPrompt(e: Event) {
      e.preventDefault();
      setDeferred(e as BIPEvent);
    }
    function onInstalled() {
      setDeferred(null);
    }
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (!deferred) return null;

  return (
    <button
      type="button"
      onClick={() => {
        void deferred.prompt();
        void deferred.userChoice.then(() => setDeferred(null));
      }}
      className="px-2 py-0.5 transition-colors hover:brightness-125"
      style={{
        border: "1px solid var(--color-accent)",
        color: "var(--color-accent)",
        fontSize: 10,
      }}
      title="install SmokyClaw as an app"
    >
      📲 install
    </button>
  );
}
