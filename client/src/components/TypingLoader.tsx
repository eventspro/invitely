import { useEffect, useState } from "react";

export default function TypingLoader() {
  const text = "4ever.am";
  const [displayed, setDisplayed] = useState("");
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (index < text.length) {
      const timeout = setTimeout(() => {
        setDisplayed((prev) => prev + text[index]);
        setIndex(index + 1);
      }, 120);

      return () => clearTimeout(timeout);
    }
  }, [index, text]);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white">
      <h1 className="text-4xl font-semibold tracking-wide text-gray-800">
        {displayed}
        <span className="ml-1 animate-pulse">|</span>
      </h1>
    </div>
  );
}
