import { useLoader } from "@react-three/fiber";
import * as THREE from "three";

interface StarBackgroundProps {
  textureUrl: string;
}

export function StarBackground({ textureUrl }: StarBackgroundProps) {
  const texture = useLoader(THREE.TextureLoader, textureUrl);

  return (
    <mesh>
      <sphereGeometry args={[50, 60, 40]} /> {/* Large sphere */}
      <meshBasicMaterial map={texture} side={THREE.BackSide} />
    </mesh>
  );
}
