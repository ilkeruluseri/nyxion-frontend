import { useRef, useMemo, useEffect, useState } from "react";
import { useFrame, useLoader } from "@react-three/fiber";
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
  rotationSpeed?: number;
  onTooltipChange?: (
    visible: boolean,
    data?: {
      semiMajorAxis: number;
      eccentricity: number;
      inclination: number;
      longitudeOfAscendingNode?: number;
      argumentOfPeriapsis?: number;
      orbitSpeed?: number;
      rotationSpeed?: number;
    }
  ) => void;  
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
  rotationSpeed = 0.5, // radians per second
  onTooltipChange,
}: PlanetProps) {
  const planetRef = useRef<THREE.Mesh>(null);
  const orbitRef = useRef<THREE.Group>(new THREE.Group());
  const lineRef = useRef<THREE.Line>(null);
  const justOpenedRef = useRef<number | null>(null);

  const [selected, setSelected] = useState(false);

  const [colorMap, normalMap] = useLoader(THREE.TextureLoader, [
    "/2k_ceres_fictional.jpg", // diffuse/color texture
    "/2k_earth_normal_map.jpg",  // normal map
  ]);
  

  const a = semiMajorAxis ?? orbitRadius;
  const e = eccentricity ?? 0;

  // === Orbit geometries ===
  const clickableOrbit = useMemo(() => {
    const curve = new THREE.EllipseCurve(0, 0, a, a * Math.sqrt(1 - e ** 2), 0, 2 * Math.PI);
    const points = curve.getPoints(256).map((p) => new THREE.Vector3(p.x - a * e, p.y, 0));
    const path = new THREE.CatmullRomCurve3(points, true);
    return new THREE.TubeGeometry(path, 256, 0.1, 8, true);
  }, [a, e]);

  const orbitGeometry = useMemo(() => {
    const curve = new THREE.EllipseCurve(0, 0, a, a * Math.sqrt(1 - e ** 2), 0, 2 * Math.PI);
    const points = curve.getPoints(256);
    return new THREE.BufferGeometry().setFromPoints(points);
  }, [a, e]);

  const orbitMaterial = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.6,
        depthTest: false,
        linewidth: 2,
      }),
    []
  );

  useEffect(() => {
    const line = new THREE.Line(orbitGeometry, orbitMaterial);
    line.position.x = -a * e;
    orbitRef.current.add(line);
    lineRef.current = line;

    orbitRef.current.rotation.set(0, 0, 0);
    orbitRef.current.rotateZ(THREE.MathUtils.degToRad(longitudeOfAscendingNode));
    orbitRef.current.rotateX(THREE.MathUtils.degToRad(inclination));
    orbitRef.current.rotateZ(THREE.MathUtils.degToRad(argumentOfPeriapsis));
  }, [a, e, inclination, longitudeOfAscendingNode, argumentOfPeriapsis, orbitGeometry, orbitMaterial]);

  // Planet motion (Kepler)
  useFrame(({ clock }) => {
    if (!planetRef.current) return;

    const time = clock.getElapsedTime() * orbitSpeed;
    const M = (time * 2 * Math.PI) % (2 * Math.PI);

    let E = M;
    for (let i = 0; i < 5; i++) {
      E = M + e * Math.sin(E);
    }

    const ν = 2 * Math.atan2(
      Math.sqrt(1 + e) * Math.sin(E / 2),
      Math.sqrt(1 - e) * Math.cos(E / 2)
    );

    const r = a * (1 - e * Math.cos(E));
    const x = r * Math.cos(ν);
    const y = r * Math.sin(ν);

    planetRef.current.position.set(x, y, 0);

    planetRef.current.rotation.y += rotationSpeed * 0.01;
  });


  return (
    <group ref={orbitRef}>
      {/* Clickable orbit tube */}
      <mesh
        geometry={clickableOrbit}
        onClick={(event: any) => {
          event.stopPropagation();
          setSelected(true);
          justOpenedRef.current = Date.now();
          if (onTooltipChange) {
            onTooltipChange(true, { 
              semiMajorAxis: a,
              eccentricity: e,
              inclination,
              longitudeOfAscendingNode,
              argumentOfPeriapsis,
              orbitSpeed,
              rotationSpeed });
          }

        }}
        onPointerOver={() => (document.body.style.cursor = "pointer")}
        onPointerOut={() => (document.body.style.cursor = "default")}
      >
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      {/* Planet sphere */}
      <mesh ref={planetRef}>
        <sphereGeometry args={[planetRadius, 32, 32]} />
        <meshStandardMaterial 
          color={color}
          map={colorMap}
          normalMap={normalMap}
          metalness={0.2}
          roughness={0.9}
          emissive={selected ? new THREE.Color(color) : new THREE.Color(0x000000)}
          emissiveIntensity={selected ? 0.6 : 0}
        />
      </mesh>
    </group>
  );
}
