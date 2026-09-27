import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useSession } from "@/hooks/useSession";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — StreamBox" },
      {
        name: "description",
        content: "Sign in to keep a watchlist and pick up films where you left off.",
      },
      { property: "og:title", content: "Sign in — StreamBox" },
      {
        property: "og:description",
        content: "Keep a watchlist and resume films across devices.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const { user } = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate({ to: "/profile", replace: true });
  }, [user, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        if (!data.session) {
          setSent(true);
          return;
        }
        toast.success("Welcome to StreamBox");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Signed in");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("Google sign-in didn't complete");
      setBusy(false);
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/profile" });
  };

  return (
    <div className="flex min-h-screen flex-col justify-center bg-background px-6">
      <div className="mx-auto w-full max-w-sm">
        <Link to="/" className="font-display text-3xl tracking-[0.18em] text-primary">
          STREAMBOX
        </Link>
        <h1 className="mt-5 font-display text-3xl tracking-wide">
          {mode === "signin" ? "Welcome back" : "Create an account"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your watchlist and resume points follow you on any device.
        </p>

        {sent ? (
          <div className="mt-6 rounded-2xl border border-border bg-card p-5 text-sm">
            <p className="font-semibold">Check your email</p>
            <p className="mt-1 text-muted-foreground">
              We sent a confirmation link to {email}. Tap it to finish signing up.
            </p>
          </div>
        ) : (
          <>
            <form onSubmit={submit} className="mt-6 space-y-3">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                autoComplete="email"
                className="w-full rounded-xl border border-input bg-card px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                className="w-full rounded-xl border border-input bg-card px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-full bg-primary py-3.5 text-sm font-bold text-primary-foreground active:scale-[0.98] disabled:opacity-60"
              >
                {mode === "signin" ? "Sign in" : "Create account"}
              </button>
            </form>

            <button
              onClick={google}
              disabled={busy}
              className="mt-3 w-full rounded-full border border-border bg-card py-3.5 text-sm font-semibold active:scale-[0.98] disabled:opacity-60"
            >
              Continue with Google
            </button>

            <button
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
              className="mt-5 w-full text-center text-sm text-muted-foreground"
            >
              {mode === "signin" ? (
                <>
                  New here? <span className="font-semibold text-primary">Create an account</span>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <span className="font-semibold text-primary">Sign in</span>
                </>
              )}
            </button>
          </>
        )}

        <Link
          to="/"
          className="mt-8 block text-center text-xs uppercase tracking-[0.16em] text-muted-foreground"
        >
          Keep browsing without an account
        </Link>
      </div>
    </div>
  );
}
