export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-cream via-white to-warmBeige/20 flex items-center justify-center z-50">
      {/* Beating Heart */}
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
  );
}
