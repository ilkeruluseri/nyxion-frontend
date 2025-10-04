import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { StarBackground } from "./StarBackground";
import PlanetOrbitVisualization from "./PlanetOrbitVisualization";
import * as THREE from "three";

interface BackgroundCanvasProps {
  controlsEnabled: boolean;
}

export default function BackgroundCanvas({ controlsEnabled = false }: BackgroundCanvasProps) {
  return (
    // wrapper fixed to viewport; zIndex 0 so UI can sit above it (zIndex 10)
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "auto", // allow canvas to receive events where UI doesn't block
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 5] }}
        style={{ width: "100%", height: "100%" }}
        // DEBUG: log pointerdown on canvas element
        onPointerDown={() => console.log("Canvas pointerdown")}
      >
        <StarBackground textureUrl="/8k_stars.jpg" />

        {/* Orbit visualization — visible throughout */}
        <PlanetOrbitVisualization />

        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />

        <OrbitControls
          enabled={controlsEnabled}
          enablePan
          enableZoom
          enableRotate
          makeDefault
          // make sure left mouse rotates etc:
          mouseButtons={{
            LEFT: THREE.MOUSE.ROTATE,
            MIDDLE: THREE.MOUSE.DOLLY,
            RIGHT: THREE.MOUSE.PAN,
          }}
        />
      </Canvas>
    </div>
  );
}
