import { ImageResponse } from "next/og";

export const alt = "آسان‌کار؛ کار بسته‌بندی در منزل با آموزش و پشتیبانی";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#082c52",
          padding: 48,
        }}
      >
        <div
          style={{
            display: "flex",
            flex: 1,
            border: "2px solid rgba(251,247,241,0.2)",
            borderRadius: 36,
            padding: "56px 64px",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", color: "#7ddec0", fontSize: 28, letterSpacing: 8 }}>
              ASANKAR
            </div>
            <div
              style={{
                display: "flex",
                width: 280,
                height: 22,
                marginTop: 36,
                borderRadius: 99,
                background: "#ffffff",
              }}
            />
            <div
              style={{
                display: "flex",
                width: 420,
                height: 22,
                marginTop: 18,
                borderRadius: 99,
                background: "rgba(255,253,248,0.55)",
              }}
            />
            <div
              style={{
                display: "flex",
                width: 340,
                height: 22,
                marginTop: 18,
                borderRadius: 99,
                background: "rgba(255,253,248,0.28)",
              }}
            />
          </div>
          <div
            style={{
              display: "flex",
              width: 220,
              height: 220,
              borderRadius: 999,
              background: "#0c4d86",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                display: "flex",
                width: 92,
                height: 78,
                border: "8px solid #7ddec0",
                borderRadius: 14,
              }}
            />
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
