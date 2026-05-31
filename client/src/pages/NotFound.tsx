import { Button } from "@/components/ui/button";
import { AlertCircle, Home } from "lucide-react";
import { useLocation } from "wouter";

export default function NotFound() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#1a1a1a]">
      <div className="w-full max-w-lg mx-4 bg-[#242424] border border-[#3a3a3a] rounded-lg p-8">
        <div className="flex flex-col items-center text-center">
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-[#FF4444]/20 rounded-full animate-pulse" />
            <AlertCircle className="relative h-16 w-16 text-[#FF4444]" />
          </div>

          <h1 className="text-4xl font-bold text-white mb-2">404</h1>
          <h2 className="text-xl font-semibold text-[#ABABAB] mb-4">
            Page Not Found
          </h2>
          <p className="text-[#ABABAB] mb-8 leading-relaxed">
            Sorry, the page you are looking for doesn't exist.
            <br />
            It may have been moved or deleted.
          </p>

          <Button
            onClick={() => setLocation("/")}
            className="bg-[#E8643A] hover:bg-[#d55a32] text-white px-6 py-2.5 rounded-lg transition-all duration-200"
          >
            <Home className="w-4 h-4 mr-2" />
            Go Home
          </Button>
        </div>
      </div>
    </div>
  );
}
