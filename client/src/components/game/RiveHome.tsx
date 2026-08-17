import { useRive } from "@rive-app/react-canvas";

export function RiveHome() {
  const { RiveComponent } = useRive({
    src: "/rive/ascend2.riv",
    autoplay: true,
  });

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        width: "100%",
        height: "100dvh",
        backgroundColor: "#000",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 390,
          height: "100%",
          maxHeight: 844,
          position: "relative",
        }}
      >
        <RiveComponent
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            display: "block",
          }}
        />
      </div>
    </div>
  );
}
