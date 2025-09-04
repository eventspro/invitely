export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-cream via-white to-warmBeige/20 flex items-center justify-center z-50">
      <div className="text-center space-y-6">
        {/* Beating Heart */}
        <div className="flex justify-center">
          <svg
            viewBox="0 0 32 29.6"
            className="w-20 h-20 fill-current animate-heartbeat text-softGold"
            style={{
              filter: "drop-shadow(0 6px 12px rgba(218, 165, 32, 0.4))",
            }}
          >
            <path
              d="M23.6,0c-2.9,0-5.6,1.4-7.6,3.6C14,1.4,11.3,0,8.4,0
               C3.8,0,0,3.8,0,8.4c0,9.2,16,21.2,16,21.2s16-12,16-21.2
               C32,3.8,28.2,0,23.6,0z"
            />
          </svg>
        </div>

        {/* Loading Text */}
        <div className="space-y-2">
          <h2 
            className="text-2xl text-charcoal font-light"
            style={{ fontFamily: "Playfair Display, serif" }}
          >
            Հարություն ∞ Տաթև
          </h2>
          <div className="flex justify-center space-x-1">
            <div className="w-2 h-2 bg-softGold rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-softGold rounded-full animate-pulse" style={{ animationDelay: "0.2s" }}></div>
            <div className="w-2 h-2 bg-softGold rounded-full animate-pulse" style={{ animationDelay: "0.4s" }}></div>
          </div>
        </div>
      </div>
    </div>
  );
}