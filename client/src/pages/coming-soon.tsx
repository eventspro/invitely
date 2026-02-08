import { useState } from "react";
import { Heart } from "lucide-react";

export default function ComingSoon() {
  const [clickCount, setClickCount] = useState(0);
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  const handleSoonClick = () => {
    const newCount = clickCount + 1;
    setClickCount(newCount);
    
    if (newCount >= 5) {
      setShowPasswordInput(true);
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password === "bestharsaniq") {
      // Store in localStorage that password was entered
      localStorage.setItem("site-unlocked", "true");
      // Reload page to show main site
      window.location.reload();
    } else {
      setError(true);
      setPassword("");
      setTimeout(() => setError(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-pink-50 flex items-center justify-center relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-rose-200/20 rounded-full blur-3xl animate-float"></div>
      <div className="absolute bottom-20 right-10 w-40 h-40 bg-pink-200/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }}></div>
      <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-rose-100/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>

      <div className="text-center z-10 px-4">
        {/* Logo/Icon */}
        <div className="mb-8 flex justify-center animate-fade-in">
          <div className="bg-gradient-to-br from-rose-500 to-pink-600 p-6 rounded-full shadow-2xl">
            <Heart className="w-16 h-16 text-white" fill="white" />
          </div>
        </div>

        {/* Coming Soon Text */}
        <div className="animate-slide-up">
          <h1 className="text-5xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-rose-600 to-pink-600 mb-4">
            Coming{" "}
            <span 
              onClick={handleSoonClick}
              className="cursor-default select-none"
              style={{ userSelect: 'none' }}
            >
              Soon
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Something beautiful is on its way
          </p>
          <p className="text-lg text-gray-500">
            We're crafting an unforgettable experience for your special day
          </p>
        </div>

        {/* Hidden Password Input */}
        {showPasswordInput && (
          <div className="mt-12 animate-fade-in">
            <form onSubmit={handlePasswordSubmit} className="max-w-md mx-auto">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-rose-100">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter access code"
                  autoFocus
                  className={`w-full px-6 py-4 text-lg border-2 rounded-xl focus:outline-none focus:border-rose-500 transition-colors ${
                    error ? 'border-red-500 shake' : 'border-gray-300'
                  }`}
                />
                <button
                  type="submit"
                  className="w-full mt-4 bg-gradient-to-r from-rose-500 to-pink-600 text-white py-4 rounded-xl font-semibold text-lg hover:from-rose-600 hover:to-pink-700 transition-all transform hover:scale-105 shadow-lg"
                >
                  Enter
                </button>
                {error && (
                  <p className="text-red-500 text-sm mt-3 animate-fade-in">
                    Invalid access code
                  </p>
                )}
              </div>
            </form>
          </div>
        )}

        {/* Footer */}
        <div className="mt-16 text-gray-400 text-sm animate-fade-in" style={{ animationDelay: '0.5s' }}>
          <p>© 2026 WeddingSites. All rights reserved.</p>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slide-up {
          from { 
            opacity: 0;
            transform: translateY(30px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        
        .animate-fade-in {
          animation: fade-in 1s ease-out;
        }
        
        .animate-slide-up {
          animation: slide-up 0.8s ease-out;
        }
        
        .shake {
          animation: shake 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
}
