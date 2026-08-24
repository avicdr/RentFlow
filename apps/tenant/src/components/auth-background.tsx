/**
 * AuthBackground — dark background with hand-drawn style SVG doodles
 * for all login / register pages across Landlord, Tenant, and Admin portals.
 */
export function AuthBackground({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="relative min-h-screen w-full flex items-center justify-center overflow-hidden p-4"
      style={{ background: 'linear-gradient(145deg,#08080f 0%,#0d0b1e 55%,#080812 100%)' }}
    >
      {/* ── Glow orbs ──────────────────────────────────────────────── */}
      <div
        className="absolute top-1/4 left-1/3 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle,rgba(79,70,229,0.18) 0%,transparent 70%)', filter: 'blur(60px)' }}
      />
      <div
        className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle,rgba(124,58,237,0.12) 0%,transparent 70%)', filter: 'blur(80px)' }}
      />

      {/* ── SVG Doodles ────────────────────────────────────────────── */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid slice"
      >
        {/* ── House top-left ── */}
        <g opacity="0.12" stroke="#818cf8" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="60,120 110,70 160,120" />
          <rect x="72" y="120" width="76" height="55" />
          <rect x="102" y="140" width="18" height="22" rx="2" />
          <rect x="80" y="128" width="16" height="14" rx="1" />
          <rect x="126" y="128" width="16" height="14" rx="1" />
          <line x1="110" y1="70" x2="110" y2="58" />
          <circle cx="110" cy="54" r="4" />
        </g>

        {/* ── Key top-right ── */}
        <g opacity="0.10" stroke="#c084fc" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"
          transform="translate(880,60) rotate(-30)">
          <circle cx="0" cy="0" r="18" />
          <line x1="18" y1="0" x2="55" y2="0" />
          <line x1="45" y1="0" x2="45" y2="10" />
          <line x1="55" y1="0" x2="55" y2="8" />
        </g>

        {/* ── Building center-left ── */}
        <g opacity="0.08" stroke="#6366f1" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"
          transform="translate(30,300)">
          <rect x="0" y="30" width="50" height="80" />
          <rect x="10" y="40" width="10" height="12" rx="1" />
          <rect x="30" y="40" width="10" height="12" rx="1" />
          <rect x="10" y="62" width="10" height="12" rx="1" />
          <rect x="30" y="62" width="10" height="12" rx="1" />
          <rect x="10" y="84" width="10" height="12" rx="1" />
          <rect x="30" y="84" width="10" height="12" rx="1" />
          <rect x="14" y="96" width="22" height="14" rx="1" />
          <polygon points="0,30 25,5 50,30" />
        </g>

        {/* ── Rupee coin bottom-left ── */}
        <g opacity="0.10" stroke="#34d399" strokeWidth="1.5" fill="none" strokeLinecap="round"
          transform="translate(80,580)">
          <circle cx="0" cy="0" r="28" />
          <text x="-9" y="9" fontSize="22" fontFamily="serif" fill="#34d399" stroke="none" opacity="0.8">₹</text>
        </g>

        {/* ── Document / contract right side ── */}
        <g opacity="0.09" stroke="#818cf8" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"
          transform="translate(920,280)">
          <rect x="0" y="0" width="60" height="78" rx="4" />
          <line x1="10" y1="18" x2="50" y2="18" />
          <line x1="10" y1="30" x2="50" y2="30" />
          <line x1="10" y1="42" x2="35" y2="42" />
          <line x1="10" y1="54" x2="40" y2="54" />
          <path d="M38 62 L52 62 L52 74 L38 74 Z" />
          <path d="M43 67 L46 70 L51 63" strokeWidth="1.5" />
        </g>

        {/* ── Stars scattered ── */}
        {[
          [200, 80, 6],   [750, 150, 4],  [850, 420, 5],
          [150, 450, 4],  [950, 550, 6],  [400, 600, 3],
          [680, 520, 4],  [300, 200, 3],
        ].map(([x, y, r], i) => (
          <circle key={i} cx={x} cy={y} r={r} fill="#6366f1" opacity="0.12" />
        ))}

        {/* ── Dashed connection lines ── */}
        <line x1="160" y1="110" x2="230" y2="200" stroke="#6366f1" strokeWidth="1" strokeDasharray="4 6" opacity="0.08" />
        <line x1="820" y1="100" x2="920" y2="280" stroke="#c084fc" strokeWidth="1" strokeDasharray="4 6" opacity="0.08" />

        {/* ── WiFi / connectivity icon bottom-right ── */}
        <g opacity="0.09" stroke="#818cf8" strokeWidth="1.5" fill="none" strokeLinecap="round"
          transform="translate(890,560)">
          <path d="M-30,-30 Q0,-55 30,-30" />
          <path d="M-18,-16 Q0,-32 18,-16" />
          <path d="M-6,-3 Q0,-10 6,-3" />
          <circle cx="0" cy="4" r="3" fill="#818cf8" stroke="none" opacity="0.7" />
        </g>

        {/* ── Small house outline bottom-center ── */}
        <g opacity="0.07" stroke="#fb7185" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"
          transform="translate(450,560)">
          <polygon points="0,35 30,5 60,35" />
          <rect x="10" y="35" width="40" height="30" />
          <rect x="22" y="42" width="16" height="20" rx="1" />
        </g>

        {/* ── Graph / chart icon top-center ── */}
        <g opacity="0.09" stroke="#34d399" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"
          transform="translate(440,40)">
          <polyline points="0,40 15,25 30,32 50,10 65,18" />
          <line x1="0" y1="45" x2="70" y2="45" />
          <line x1="0" y1="0" x2="0" y2="45" />
        </g>
      </svg>

      {/* ── Subtle grid ── */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.025]"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)',
          backgroundSize: '56px 56px',
        }}
      />

      {/* ── Content ── */}
      <div className="relative z-10 w-full">{children}</div>
    </div>
  );
}
