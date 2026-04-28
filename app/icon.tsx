import { ImageResponse } from "next/og";

export const size = {
  width: 64,
  height: 64,
};

export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background: "#08111F",
          borderRadius: 18,
          display: "flex",
          height: "100%",
          justifyContent: "center",
          position: "relative",
          width: "100%",
        }}
      >
        <div
          style={{
            color: "white",
            fontFamily: "ui-sans-serif, system-ui, sans-serif",
            fontSize: 30,
            fontWeight: 700,
            letterSpacing: -1.2,
          }}
        >
          RT
        </div>
        <div
          style={{
            background: "#6FE8FF",
            borderRadius: 999,
            height: 12,
            position: "absolute",
            right: 9,
            top: 9,
            width: 12,
          }}
        />
      </div>
    ),
    size,
  );
}
