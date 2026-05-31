import { useAuth } from "@/_core/hooks/useAuth";
import { signInWithGoogle } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowRight, Zap, Film, Globe, Sparkles, BarChart3, Settings, Layers } from "lucide-react";

export default function Home() {
  const { user, isAuthenticated } = useAuth();

  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (err) {
      console.error("Sign in failed:", err);
    }
  };

  const features = [
    {
      icon: Zap,
      title: "Automated Pipeline",
      description: "Process videos through silence removal, caption generation, B-roll insertion, and export in one seamless workflow.",
    },
    {
      icon: Film,
      title: "Bengali Language Support",
      description: "Accurate speech-to-text transcription specifically tuned for Bengali language patterns and accents.",
    },
    {
      icon: Layers,
      title: "Batch Processing",
      description: "Schedule multiple videos for overnight processing. Perfect for content creators with high upload volume.",
    },
    {
      icon: Globe,
      title: "YouTube Integration",
      description: "Automatically upload finished videos directly to your YouTube channel with optimized titles and descriptions.",
    },
    {
      icon: BarChart3,
      title: "Real-time Monitoring",
      description: "Track each pipeline stage with live progress updates. Know exactly where your video is in the process.",
    },
    {
      icon: Settings,
      title: "Customizable Settings",
      description: "Fine-tune silence thresholds, caption styles, B-roll density, and export quality for your specific needs.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#1a1a1a]/80 backdrop-blur-md border-b border-[#3a3a3a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-[#E8643A] rounded-lg flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-[#ABABAB] leading-none -mb-0.5">.NF</span>
              <span className="text-xl font-bold text-white leading-tight">BanglaClip</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <span className="text-sm text-[#ABABAB]">Welcome, {user?.name}</span>
                <Link href="/dashboard">
                  <Button>Dashboard</Button>
                </Link>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" className="text-[#ABABAB] hover:text-white">Sign In</Button>
                </Link>
                <Button onClick={handleSignIn} className="gap-2 bg-[#E8643A] hover:bg-[#d55a32]">
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84.81-.62z" />
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
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="flex flex-col items-center">
              <span className="text-xs text-[#ABABAB] tracking-widest uppercase">.NF</span>
            </div>
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight text-white mb-6">
            BanglaClip
            <span className="block text-[#E8643A]">
              Automated Video Processing
            </span>
            <span className="block text-[#4A9EFF] text-3xl sm:text-4xl mt-2">
              for Bengali Creators
            </span>
          </h1>
          <p className="text-xl text-[#ABABAB] mb-8 max-w-2xl mx-auto">
            Transform raw footage into polished, optimized videos in minutes. Silence removal, Bengali captions, B-roll overlay, and vertical export — all automated.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            {isAuthenticated ? (
              <Link href="/dashboard">
                <Button size="lg" className="gap-2 bg-[#E8643A] hover:bg-[#d55a32]">
                  Go to Dashboard
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <Button size="lg" onClick={handleSignIn} className="gap-2 bg-[#E8643A] hover:bg-[#d55a32]">
                Get Started Free
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Feature Preview */}
          <div className="relative rounded-xl overflow-hidden bg-[#242424] border border-[#3a3a3a] p-8">
            <div className="absolute inset-0 bg-gradient-to-r from-[#E8643A]/10 to-[#4A9EFF]/10" />
            <div className="relative">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { icon: Zap, label: "Silence Removal", desc: "Remove dead air automatically" },
                  { icon: Film, label: "Captions", desc: "Bengali speech-to-text" },
                  { icon: Globe, label: "B-Roll", desc: "Auto stock footage overlay" },
                  { icon: Sparkles, label: "Export", desc: "9:16 vertical format" },
                ].map((feature, i) => (
                  <div key={i} className="text-center">
                    <feature.icon className="h-8 w-8 text-[#E8643A] mx-auto mb-2" />
                    <p className="text-sm font-semibold text-white">{feature.label}</p>
                    <p className="text-xs text-[#ABABAB] mt-1">{feature.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 px-4 sm:px-6 lg:px-8 bg-[#242424]">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-white mb-12">
            Everything You Need
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <div
                key={i}
                className="bg-[#1a1a1a] border border-[#3a3a3a] rounded-lg p-6 hover:border-[#4a4a4a] transition-all duration-200 hover:shadow-lg"
              >
                <feature.icon className="h-8 w-8 text-[#E8643A] mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-[#ABABAB] text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 px-4 sm:px-6 lg:px-8 bg-[#1a1a1a] border-t border-[#3a3a3a]">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Transform Your Videos?
          </h2>
          <p className="text-[#ABABAB] mb-8">
            Join creators across South Asia using BanglaClip to save hours on video editing.
          </p>
          {isAuthenticated ? (
            <Link href="/dashboard">
              <Button size="lg" className="gap-2 bg-[#E8643A] hover:bg-[#d55a32]">
                Start Processing
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          ) : (
            <Button size="lg" onClick={handleSignIn} className="gap-2 bg-[#E8643A] hover:bg-[#d55a32]">
              Sign Up Free
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-[#1a1a1a] border-t border-[#3a3a3a] text-[#ABABAB] py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto text-center">
          <p className="mb-2">BanglaClip © 2026 — A .NF Product</p>
          <p className="text-sm">Automated Video Processing for Bengali Creators</p>
        </div>
      </footer>
    </div>
  );
}
