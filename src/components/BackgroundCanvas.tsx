import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { StarBackground } from "./StarBackground";
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

        {/* test clickable mesh — will log when clicked */}
        <mesh position={[2, 0, 0]} onPointerDown={() => console.log("mesh clicked")}>
          <sphereGeometry args={[0.3, 32, 32]} />
          <meshStandardMaterial color="orange" />
        </mesh>

        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />

        <OrbitControls
          enabled={controlsEnabled}
          enablePan
          enableZoom
          enableRotate
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
