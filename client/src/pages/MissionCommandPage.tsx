import { useRive } from "@rive-app/react-canvas";

export default function MissionCommandPage() {
  const { RiveComponent } = useRive({
    src: "/rive/mission_command.riv",
    autoplay: true,
  });

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        width: "100%",
        height: "100%",
        minHeight: "100dvh",
        background: "#000",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 390,
          height: "100%",
          maxHeight: 844,
          aspectRatio: "390 / 844",
        }}
      >
        <RiveComponent style={{ width: "100%", height: "100%" }} />
      </div>
    </div>
  );
}
