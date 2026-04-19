import { ImageResponse } from "next/og"

export const runtime = "edge"
export const alt = "GlowSuite — El CRM para consultoras de belleza"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          background: "#FFFFFF",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          padding: "0 100px",
          position: "relative",
          overflow: "hidden",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        {/* Glow top-right */}
        <div
          style={{
            position: "absolute",
            top: -160,
            right: -160,
            width: 640,
            height: 640,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(231,84,128,0.12) 0%, transparent 68%)",
          }}
        />
        {/* Glow bottom-left */}
        <div
          style={{
            position: "absolute",
            bottom: -180,
            left: -80,
            width: 480,
            height: 480,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(231,84,128,0.06) 0%, transparent 70%)",
          }}
        />

        {/* Logo lockup */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
            marginBottom: 40,
          }}
        >
          {/* Icon */}
          <div
            style={{
              width: 80,
              height: 80,
              background: "#E75480",
              borderRadius: 22,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="80" height="80" viewBox="0 0 48 48" fill="none">
              <path
                d="M24 9.5 L26.2 19.8 L36 22 L26.2 24.2 L24 33.5 L21.8 24.2 L12 22 L21.8 19.8 Z"
                fill="white"
              />
              <circle cx="33.5" cy="13.5" r="2.4" fill="white" opacity="0.65" />
              <circle cx="13.5" cy="34" r="1.8" fill="white" opacity="0.4" />
            </svg>
          </div>
          {/* Wordmark */}
          <div style={{ display: "flex" }}>
            <span
              style={{
                fontSize: 56,
                fontWeight: 700,
                color: "#E75480",
                letterSpacing: -1.5,
                lineHeight: 1,
              }}
            >
              Glow
            </span>
            <span
              style={{
                fontSize: 56,
                fontWeight: 700,
                color: "#1A1A2E",
                letterSpacing: -1.5,
                lineHeight: 1,
              }}
            >
              Suite
            </span>
          </div>
        </div>

        {/* Tagline */}
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span
            style={{
              fontSize: 44,
              fontWeight: 400,
              color: "#6B6B80",
              lineHeight: 1.35,
              letterSpacing: -0.8,
            }}
          >
            Tu consultora de belleza,
          </span>
          <span
            style={{
              fontSize: 44,
              fontWeight: 700,
              color: "#1A1A2E",
              lineHeight: 1.35,
              letterSpacing: -0.8,
            }}
          >
            organizada y lista para crecer.
          </span>
        </div>

        {/* URL */}
        <div
          style={{
            position: "absolute",
            bottom: 48,
            left: 100,
            fontSize: 20,
            fontWeight: 500,
            color: "rgba(107,107,128,0.5)",
            letterSpacing: 0.2,
          }}
        >
          glowsuite-crm.vercel.app
        </div>
      </div>
    ),
    { ...size }
  )
}
