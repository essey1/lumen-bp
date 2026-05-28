import type { CSSProperties } from "react"

const fireflies = [
  { left: "9%", top: "18%", dx: "24px", dy: "-34px", dx2: "-12px", dy2: "-64px", dur: "8s", delay: "0s" },
  { left: "18%", top: "72%", dx: "-22px", dy: "-28px", dx2: "18px", dy2: "-58px", dur: "9s", delay: "1.1s" },
  { left: "31%", top: "31%", dx: "16px", dy: "-42px", dx2: "-20px", dy2: "-72px", dur: "7.5s", delay: "0.5s" },
  { left: "46%", top: "66%", dx: "-18px", dy: "-32px", dx2: "24px", dy2: "-66px", dur: "8.6s", delay: "1.8s" },
  { left: "58%", top: "22%", dx: "22px", dy: "-28px", dx2: "-18px", dy2: "-54px", dur: "7.8s", delay: "0.9s" },
  { left: "72%", top: "76%", dx: "-26px", dy: "-36px", dx2: "12px", dy2: "-70px", dur: "9.4s", delay: "2.1s" },
  { left: "83%", top: "35%", dx: "18px", dy: "-30px", dx2: "-22px", dy2: "-62px", dur: "8.2s", delay: "1.4s" },
  { left: "91%", top: "61%", dx: "-16px", dy: "-44px", dx2: "20px", dy2: "-76px", dur: "8.8s", delay: "0.3s" },
]

interface LumenFirefliesProps {
  className?: string
}

interface LumenGuideBearProps {
  className?: string
  fixed?: boolean
}

export function LumenFireflies({ className = "" }: LumenFirefliesProps) {
  return (
    <div className={`pointer-events-none inset-0 ${className}`}>
      {fireflies.map((fly, index) => (
        <span
          key={index}
          className="lumen-float-fly absolute h-2.5 w-2.5 rounded-full bg-[#f5a623] shadow-[0_0_14px_5px_rgba(245,166,35,0.65)]"
          style={
            {
              left: fly.left,
              top: fly.top,
              "--dx": fly.dx,
              "--dy": fly.dy,
              "--dx2": fly.dx2,
              "--dy2": fly.dy2,
              "--dur": fly.dur,
              "--delay": fly.delay,
            } as CSSProperties
          }
        />
      ))}
    </div>
  )
}

export function LumenGuideBear({
  className = "",
  fixed = false,
}: LumenGuideBearProps) {
  const positionClass = fixed
    ? "fixed bottom-0 left-[4%]"
    : "absolute bottom-0 left-[8%]"

  return (
    <>
      <div
        className={`pointer-events-none ${positionClass} z-20 hidden sm:block ${className}`}
      >
        <svg
          width="130"
          height="200"
          viewBox="0 0 130 200"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="lumen-bear-bob"
        >
          <ellipse cx="65" cy="145" rx="40" ry="48" fill="#5ba8c7" />
          <ellipse cx="65" cy="90" rx="34" ry="32" fill="#5ba8c7" />
          <circle cx="38" cy="65" r="13" fill="#5ba8c7" />
          <circle cx="92" cy="65" r="13" fill="#5ba8c7" />
          <circle cx="38" cy="65" r="7" fill="#7dc1dd" />
          <circle cx="92" cy="65" r="7" fill="#7dc1dd" />
          <ellipse
            cx="65"
            cy="100"
            rx="18"
            ry="14"
            fill="#f0f8ff"
            opacity="0.7"
          />
          <circle cx="55" cy="86" r="4" fill="#2a4a5a" />
          <circle cx="75" cy="86" r="4" fill="#2a4a5a" />
          <ellipse cx="65" cy="104" rx="6" ry="4" fill="#2a4a5a" />
          <ellipse
            cx="28"
            cy="148"
            rx="13"
            ry="30"
            fill="#5ba8c7"
            transform="rotate(-15 28 148)"
          />
          <ellipse
            cx="102"
            cy="148"
            rx="13"
            ry="30"
            fill="#5ba8c7"
            transform="rotate(15 102 148)"
          />
          <ellipse cx="48" cy="187" rx="14" ry="12" fill="#4a95b5" />
          <ellipse cx="82" cy="187" rx="14" ry="12" fill="#4a95b5" />
          <g className="lumen-lantern-glow">
            <rect x="24" y="158" width="20" height="24" rx="4" fill="#c97d1a" />
            <rect x="26" y="160" width="16" height="20" rx="3" fill="#f5a623" />
            <circle cx="34" cy="170" r="7" fill="#fff3c4" opacity="0.9" />
            <line
              x1="34"
              y1="154"
              x2="34"
              y2="158"
              stroke="#c97d1a"
              strokeWidth="2"
            />
            <circle cx="34" cy="170" r="4" fill="#f5a623" opacity="0.6" />
          </g>
        </svg>
      </div>
    </>
  )
}
