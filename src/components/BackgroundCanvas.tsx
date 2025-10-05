import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { StarBackground } from "./StarBackground";
import PlanetOrbitVisualization from "./PlanetOrbitVisualization";
import * as THREE from "three";
import { usePlanetStore } from "../store/usePlanetStore";

interface BackgroundCanvasProps {
  controlsEnabled: boolean;
  planetsVisible?: boolean;
}

export default function BackgroundCanvas({ controlsEnabled = false, planetsVisible = false }: BackgroundCanvasProps) {
  const { planets, visible } = usePlanetStore();

  // Filter planets based on visibility
  const visiblePlanets = planets.filter((_, i) => visible[i]);
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
        camera={{ position: [0, 0, 10] }}
        style={{ width: "100%", height: "100%" }}
        // DEBUG: log pointerdown on canvas element
        onPointerDown={() => console.log("Canvas pointerdown")}
      >
        <StarBackground textureUrl="/8k_stars.jpg" />

        {/* Orbit visualization — visible throughout */}
        {planets.length > 0 && planetsVisible &&
          <PlanetOrbitVisualization planets={visiblePlanets}/>
        }

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
