import * as THREE from "three";

interface StarProps {
  radius?: number;
  color?: string;
}

export default function Star({ radius = 0.3, color = "orange" }: StarProps) {
  return (
    <mesh>
      <sphereGeometry args={[radius, 32, 32]} />
      <meshStandardMaterial emissive={color} emissiveIntensity={1.5} color={color} />
    </mesh>
  );
}
