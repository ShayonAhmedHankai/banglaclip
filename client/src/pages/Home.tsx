import { useAuth } from "@/_core/hooks/useAuth";
import { signInWithGoogle } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "wouter";
import { ArrowRight, Zap, Film, Globe, Sparkles } from "lucide-react";

export default function Home() {
  const { user, isAuthenticated } = useAuth();

  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (err) {
      console.error("Sign in failed:", err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900">BanglaClip</span>
          </div>
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <span className="text-sm text-slate-600">Welcome, {user?.name}</span>
                <Link href="/dashboard">
                  <Button>Dashboard</Button>
                </Link>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost">Sign In</Button>
                </Link>
                <Button onClick={handleSignIn} className="gap-2">
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Sign in with Google
                </Button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight text-slate-900 mb-6">
            Automated Video Processing
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-700">
              for Bengali Creators
            </span>
          </h1>
          <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
            Transform raw footage into polished, optimized videos in minutes. Silence removal, Bengali captions, B-roll overlay, and vertical export — all automated.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            {isAuthenticated ? (
              <Link href="/dashboard">
                <Button size="lg" className="gap-2">
                  Go to Dashboard
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <Button size="lg" onClick={handleSignIn} className="gap-2">
                Get Started Free
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Feature Preview */}
          <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-br from-slate-900 to-slate-800 p-8">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20" />
            <div className="relative">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                  { icon: Zap, label: "Silence Removal", desc: "Remove dead air automatically" },
                  { icon: Film, label: "Captions", desc: "Bengali speech-to-text" },
                  { icon: Globe, label: "B-Roll", desc: "Auto stock footage overlay" },
                  { icon: Sparkles, label: "Export", desc: "9:16 vertical format" },
                ].map((feature, i) => (
                  <div key={i} className="text-center">
                    <feature.icon className="h-8 w-8 text-blue-400 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-white">{feature.label}</p>
                    <p className="text-xs text-slate-300 mt-1">{feature.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">
            Everything You Need
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "Automated Pipeline",
                description: "Process videos through silence removal, caption generation, B-roll insertion, and export in one seamless workflow.",
              },
              {
                title: "Bengali Language Support",
                description: "Accurate speech-to-text transcription specifically tuned for Bengali language patterns and accents.",
              },
              {
                title: "Batch Processing",
                description: "Schedule multiple videos for overnight processing. Perfect for content creators with high upload volume.",
              },
              {
                title: "YouTube Integration",
                description: "Automatically upload finished videos directly to your YouTube channel with optimized titles and descriptions.",
              },
              {
                title: "Real-time Monitoring",
                description: "Track each pipeline stage with live progress updates. Know exactly where your video is in the process.",
              },
              {
                title: "Customizable Settings",
                description: "Fine-tune silence thresholds, caption styles, B-roll density, and export quality for your specific needs.",
              },
            ].map((feature, i) => (
              <Card key={i} className="p-6 hover:shadow-lg transition-shadow">
                <h3 className="text-lg font-semibold text-slate-900 mb-2">{feature.title}</h3>
                <p className="text-slate-600">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-blue-700">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Transform Your Videos?
          </h2>
          <p className="text-blue-100 mb-8">
            Join creators across South Asia using BanglaClip to save hours on video editing.
          </p>
          {isAuthenticated ? (
            <Link href="/dashboard">
              <Button size="lg" variant="secondary" className="gap-2">
                Start Processing
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          ) : (
            <Button size="lg" variant="secondary" onClick={handleSignIn} className="gap-2">
              Sign Up Free
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto text-center">
          <p className="mb-2">BanglaClip © 2026 — Automated Video Processing for Bengali Creators</p>
          <p className="text-sm">Built with precision for creators, by creators.</p>
        </div>
      </footer>
    </div>
  );
}
