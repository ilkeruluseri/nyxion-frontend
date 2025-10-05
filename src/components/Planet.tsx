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

  

    // Animate planet motion with Keplerian speed (faster near periapsis)
    useFrame(({ clock }) => {
        if (!planetRef.current) return;
    
        const time = clock.getElapsedTime() * orbitSpeed;
        const M = (time * 2 * Math.PI) % (2 * Math.PI); // mean anomaly
    
        // Solve Kepler’s equation: M = E - e * sin(E)
        let E = M;
        for (let i = 0; i < 5; i++) {
          E = M + e * Math.sin(E); // Newton–Raphson iteration
        }
    
        // Convert eccentric anomaly to true anomaly
        const ν = 2 * Math.atan2(
          Math.sqrt(1 + e) * Math.sin(E / 2),
          Math.sqrt(1 - e) * Math.cos(E / 2)
        );
    
        // Radius at current position (distance from focus)
        const r = a * (1 - e * Math.cos(E));
    
        // Convert to Cartesian coordinates
        const x = r * Math.cos(ν);
        const y = r * Math.sin(ν);
    
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
