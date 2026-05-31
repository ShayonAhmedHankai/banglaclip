import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { signInWithGoogle, signInWithEmail, signUpWithEmail } from "@/lib/auth";
import { useAuth } from "@/_core/hooks/useAuth";
import { isFirebaseConfigured } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, AlertTriangle, Sparkles } from "lucide-react";

export default function Login() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, loading } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && isAuthenticated) {
      setLocation("/dashboard");
    }
  }, [isAuthenticated, loading, setLocation]);

  const handleGoogle = async () => {
    setError(null);
    setBusy(true);
    try {
      await signInWithGoogle();
      setLocation("/dashboard");
    } catch (err: any) {
      setError(err?.message ?? "Google sign-in failed");
    } finally {
      setBusy(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === "signin") {
        await signInWithEmail(email, password);
      } else {
        await signUpWithEmail(email, password, displayName);
      }
      setLocation("/dashboard");
    } catch (err: any) {
      const code = err?.code ?? "";
      if (code === "auth/user-not-found" || code === "auth/wrong-password" || code === "auth/invalid-credential") {
        setError("Invalid email or password.");
      } else if (code === "auth/email-already-in-use") {
        setError("An account with this email already exists.");
      } else if (code === "auth/weak-password") {
        setError("Password should be at least 6 characters.");
      } else {
        setError(err?.message ?? "Authentication failed");
      }
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1a1a1a]">
        <Loader2 className="h-8 w-8 animate-spin text-[#E8643A]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="h-10 w-10 bg-[#E8643A] rounded-xl flex items-center justify-center">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-[#ABABAB] leading-none -mb-0.5">.NF</span>
            <span className="text-2xl font-bold text-white">BanglaClip</span>
          </div>
        </div>

        <div className="text-center mb-8">
          <p className="text-[#ABABAB] text-sm">Sign in to access your video pipeline</p>
        </div>

        {!isFirebaseConfigured ? (
          <div className="bg-[#242424] border border-[#3a3a3a] rounded-lg p-6">
            <div className="flex flex-col items-center gap-4 text-center py-4">
              <AlertTriangle className="h-10 w-10 text-[#F59E0B]" />
              <div>
                <p className="font-semibold text-white mb-1">Firebase not configured</p>
                <p className="text-sm text-[#ABABAB]">
                  Add your Firebase credentials as environment secrets to enable authentication.
                  See the project README for the required variable names.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-[#242424] border border-[#3a3a3a] rounded-lg p-6">
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold text-white">
                {mode === "signin" ? "Welcome back" : "Create an account"}
              </h2>
              <p className="text-sm text-[#ABABAB] mt-1">
                {mode === "signin"
                  ? "Sign in to access your video pipeline"
                  : "Start processing videos in minutes"}
              </p>
            </div>

            <div className="space-y-4">
              {/* Google Sign In */}
              <Button
                variant="outline"
                className="w-full gap-3 bg-transparent border-[#3a3a3a] text-white hover:bg-[#2c2c2c] hover:text-white"
                onClick={handleGoogle}
                disabled={busy}
              >
                {busy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                )}
                Continue with Google
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-[#3a3a3a]" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-[#242424] px-2 text-[#ABABAB]">or</span>
                </div>
              </div>

              {/* Email Form */}
              <form onSubmit={handleEmailSubmit} className="space-y-3">
                {mode === "signup" && (
                  <div className="space-y-1">
                    <Label htmlFor="name" className="text-[#ABABAB]">Display name</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Your name"
                      value={displayName}
                      onChange={e => setDisplayName(e.target.value)}
                      disabled={busy}
                      className="bg-[#1a1a1a] border-[#3a3a3a] text-white placeholder:text-[#6a6a6a]"
                    />
                  </div>
                )}
                <div className="space-y-1">
                  <Label htmlFor="email" className="text-[#ABABAB]">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    disabled={busy}
                    className="bg-[#1a1a1a] border-[#3a3a3a] text-white placeholder:text-[#6a6a6a]"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="password" className="text-[#ABABAB]">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    disabled={busy}
                    minLength={6}
                    className="bg-[#1a1a1a] border-[#3a3a3a] text-white placeholder:text-[#6a6a6a]"
                  />
                </div>

                {error && (
                  <p className="text-sm text-[#FF4444] bg-[#FF4444]/10 rounded-md px-3 py-2">{error}</p>
                )}

                <Button type="submit" className="w-full bg-[#E8643A] hover:bg-[#d55a32]" disabled={busy}>
                  {busy ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : mode === "signin" ? (
                    "Sign in"
                  ) : (
                    "Create account"
                  )}
                </Button>
              </form>

              <p className="text-center text-sm text-[#ABABAB]">
                {mode === "signin" ? (
                  <>
                    Don't have an account?{" "}
                    <button
                      className="text-[#E8643A] hover:underline font-medium"
                      onClick={() => { setMode("signup"); setError(null); }}
                    >
                      Sign up
                    </button>
                  </>
                ) : (
                  <>
                    Already have an account?{" "}
                    <button
                      className="text-[#E8643A] hover:underline font-medium"
                      onClick={() => { setMode("signin"); setError(null); }}
                    >
                      Sign in
                    </button>
                  </>
                )}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
