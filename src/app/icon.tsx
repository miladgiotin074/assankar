import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0c4d86",
          borderRadius: 16,
        }}
      >
        <div
          style={{
            width: 14,
            height: 12,
            border: "2px solid #7ddec0",
            borderRadius: 2,
            display: "flex",
          }}
        />
      </div>
    ),
    { ...size },
  );
}
