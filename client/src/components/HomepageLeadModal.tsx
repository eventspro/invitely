import { useState } from "react";
import { X, CheckCircle } from "lucide-react";

interface HomepageLeadModalProps {
  onClose: () => void;
}

export function HomepageLeadModal({ onClose }: HomepageLeadModalProps) {
  const [name, setName]       = useState("");
  const [email, setEmail]     = useState("");
  const [phone, setPhone]     = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !phone.trim()) {
      setError("Անունը և հեռախոս համարը պարտադիր են։");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/homepage-leads/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), phone: phone.trim() }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Սխալ տեղի ունեցավ։ Խնդրում ենք նորից փորձել։");
      }

      setSuccess(true);
      setTimeout(() => onClose(), 2500);
    } catch (err: any) {
      setError(err.message || "Սխալ տեղի ունեցավ։ Խնդրում ենք նորից փորձել։");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(8, 20, 14, 0.75)", backdropFilter: "blur(6px)" }}
    >
      <div
        className="relative w-full max-w-md rounded-2xl p-6 shadow-2xl"
        style={{ background: "#fff" }}
        role="dialog"
        aria-modal="true"
        aria-label="Դիմել հիմա"
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
          aria-label="Փակել"
        >
          <X className="h-4 w-4" />
        </button>

        {success ? (
          <div className="flex flex-col items-center py-6 text-center">
            <CheckCircle className="mb-3 h-12 w-12 text-emerald-500" />
            <h2 className="mb-1 text-xl font-bold text-gray-900">Շնորհակալություն!</h2>
            <p className="text-sm text-gray-500">
              Ձեր դիմումն ընդունվել է։ Մենք կապ կհաստատենք Ձեզ հետ շուտ։
            </p>
          </div>
        ) : (
          <>
            <div className="mb-5">
              <h2 className="text-xl font-bold text-gray-900">Դիմել հիմա</h2>
              <p className="mt-1 text-sm text-gray-500">
                Թողեք ձեր կոնտակտային տվյալները՝ մենք կդիմենք Ձեզ:
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Անուն <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Ձեր անունը"
                  required
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none transition focus:border-[#d8b66a] focus:ring-2 focus:ring-[#d8b66a]/20"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Հեռախոս <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+374 XX XXX XXX"
                  required
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none transition focus:border-[#d8b66a] focus:ring-2 focus:ring-[#d8b66a]/20"
                />
              </div>

              {/* Email (optional) */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Էլ. փոստ <span className="text-gray-400 font-normal">(կամընտիր)</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="example@mail.com"
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none transition focus:border-[#d8b66a] focus:ring-2 focus:ring-[#d8b66a]/20"
                />
              </div>

              {error && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-full bg-[#f0cf82] py-3 text-sm font-semibold text-[#10241b] shadow-[0_8px_20px_rgba(216,182,106,0.3)] transition hover:bg-[#f7dda4] disabled:opacity-60"
              >
                {loading ? "Ուղարկվում է..." : "Ուղարկել դիմումը"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
