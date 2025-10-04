import { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface PlanetProps {
  planetRadius?: number;
  orbitRadius?: number;
  orbitSpeed?: number;
  semiMajorAxis?: number; // a
  eccentricity?: number;  // e
  inclination?: number;   // i (deg)
  longitudeOfAscendingNode?: number; // Ω (deg)
  argumentOfPeriapsis?: number;      // ω (deg)
  color?: string;
}

export default function Planet({
  planetRadius = 0.1,
  orbitRadius = 2,
  orbitSpeed = 0.5,
  semiMajorAxis,
  eccentricity,
  inclination = 0,
  longitudeOfAscendingNode = 0,
  argumentOfPeriapsis = 0,
  color = "lightblue",
}: PlanetProps) {
  const planetRef = useRef<THREE.Mesh>(null);
  const orbitRef = useRef<THREE.Group>(new THREE.Group());
  const lineRef = useRef<THREE.Line>(null);

  const a = semiMajorAxis ?? orbitRadius;
  const e = eccentricity ?? 0;

  // Ellipse path — centered at (0,0)
  const orbitGeometry = useMemo(() => {
    const curve = new THREE.EllipseCurve(
      0,
      0,
      a,
      a * Math.sqrt(1 - e ** 2),
      0,
      2 * Math.PI,
      false,
      0
    );
    const points = curve.getPoints(256);
    return new THREE.BufferGeometry().setFromPoints(points);
  }, [a, e]);

  const orbitMaterial = useMemo(
    () => new THREE.LineBasicMaterial({ color: 0xffffff, opacity: 0.4, transparent: true }),
    []
  );

  // Build orbit line once
  useEffect(() => {
    const line = new THREE.Line(orbitGeometry, orbitMaterial);
    // Shift ellipse so the star is at the focus
    line.position.x = -a * e;
    orbitRef.current.add(line);
    lineRef.current = line;

    // Proper 3D orientation (Rz(Ω) * Rx(i) * Rz(ω))
    orbitRef.current.rotation.set(0, 0, 0);
    orbitRef.current.rotateZ(THREE.MathUtils.degToRad(longitudeOfAscendingNode));
    orbitRef.current.rotateX(THREE.MathUtils.degToRad(inclination));
    orbitRef.current.rotateZ(THREE.MathUtils.degToRad(argumentOfPeriapsis));
  }, [
    a,
    e,
    orbitGeometry,
    orbitMaterial,
    inclination,
    longitudeOfAscendingNode,
    argumentOfPeriapsis,
  ]);

  // Animate planet motion in 2D plane (focus-corrected)
  useFrame(({ clock }) => {
    if (!planetRef.current) return;
    const t = (clock.getElapsedTime() * orbitSpeed) % 1;
    const angle = t * 2 * Math.PI;

    let x = a * Math.cos(angle);
    let y = a * Math.sqrt(1 - e ** 2) * Math.sin(angle);
    x -= a * e;

    planetRef.current.position.set(x, y, 0);
  });

  return (
    <group ref={orbitRef}>
      <mesh ref={planetRef}>
        <sphereGeometry args={[planetRadius, 32, 32]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </group>
  );
}
