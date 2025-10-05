import { useLoader } from "@react-three/fiber";
import * as THREE from "three";

interface StarProps {
  radius?: number;
  color?: string;
  intensity?: number;
  distance?: number;
}

export default function Star({
  radius = 0.3,
  color = "orange",
  intensity = 50,
  distance = 200,
}: StarProps) {
  const colorMap = useLoader(THREE.TextureLoader, "/2k_sun.jpg");

  return (
    <group>
      {/* The glowing star sphere */}
      <mesh>
        <sphereGeometry args={[radius, 64, 64]} />
        <meshStandardMaterial
          emissive={color}
          emissiveIntensity={5}
          emissiveMap={colorMap}
          map={colorMap}
          color={color}
          roughness={0.2}
          metalness={0.1}
        />
      </mesh>

      {/* The actual light emitted from the star */}
      <pointLight
        color={color}
        intensity={intensity}
        distance={distance}
        decay={2}
      />
    </group>
  );
}
