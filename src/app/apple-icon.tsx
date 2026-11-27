import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0c4d86",
        }}
      >
        <div
          style={{
            width: 84,
            height: 72,
            border: "8px solid #7ddec0",
            borderRadius: 12,
            display: "flex",
          }}
        />
      </div>
    ),
    { ...size },
  );
}
