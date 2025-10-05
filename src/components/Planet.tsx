import { useRef, useMemo, useEffect, useState } from "react";
import { useFrame, useThree, useLoader } from "@react-three/fiber";
import * as THREE from "three";
import { Html } from "@react-three/drei";


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
}: PlanetProps) {
  const planetRef = useRef<THREE.Mesh>(null);
  const orbitRef = useRef<THREE.Group>(new THREE.Group());
  const lineRef = useRef<THREE.Line>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const justOpenedRef = useRef<number | null>(null);
  const { gl } = useThree();

  const [showTooltip, setShowTooltip] = useState(false);
  // tooltipPos holds viewport/window coordinates (clientX, clientY)
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

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

  // Close tooltip when clicking outside (with race guard)
  useEffect(() => {
    const canvas = gl.domElement;

    const handleCanvasClick = (event: MouseEvent) => {
      if (tooltipRef.current && tooltipRef.current.contains(event.target as Node)) return;

      if (justOpenedRef.current && Date.now() - justOpenedRef.current < 300) {
        justOpenedRef.current = null;
        return;
      }

      const isCanvas = gl.domElement.contains(event.target as Node);
      if (isCanvas) setShowTooltip(false);
    };

    canvas.addEventListener("pointerdown", handleCanvasClick);
    return () => canvas.removeEventListener("pointerdown", handleCanvasClick);
  }, [gl]);

  // Robust extraction of native client coords from r3f events
  const getClientFromEvent = (e: any) => {
    // r3f's event sometimes has clientX directly, sometimes in nativeEvent or event
    const clientX =
      typeof e.clientX === "number"
        ? e.clientX
        : e.nativeEvent?.clientX ?? e.event?.clientX ?? (e as any).pointer?.clientX ?? 0;
    const clientY =
      typeof e.clientY === "number"
        ? e.clientY
        : e.nativeEvent?.clientY ?? e.event?.clientY ?? (e as any).pointer?.clientY ?? 0;
    return { clientX, clientY };
  };

  // clamp tooltip so it doesn't overflow viewport
  const computeClamped = (clientX: number, clientY: number) => {
    const offset = 12;
    const maxW = 180; // should match tooltip maxWidth
    const maxH = 140; // rough height
    const left = Math.min(Math.max(clientX + offset, 8), window.innerWidth - maxW - 8);
    const top = Math.min(Math.max(clientY + offset, 8), window.innerHeight - maxH - 8);
    return { left, top };
  };

  return (
    <group ref={orbitRef}>
      {/* Clickable orbit tube */}
      <mesh
        geometry={clickableOrbit}
        onClick={(e: any) => {
          e.stopPropagation();
          const { clientX, clientY } = getClientFromEvent(e);

          // IMPORTANT: store viewport coords (clientX/clientY) not canvas-relative coords
          setTooltipPos({ x: clientX, y: clientY });

          // open tooltip (use `true` to avoid immediate toggle-close race)
          setShowTooltip(true);
          justOpenedRef.current = Date.now();
        }}
        onPointerOver={() => (document.body.style.cursor = "pointer")}
        onPointerOut={() => (document.body.style.cursor = "default")}
      >
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      {/* Tooltip — positioned using viewport coords, will stay put */}
      {showTooltip &&
        (() => {
          const { left, top } = computeClamped(tooltipPos.x, tooltipPos.y);
          return (
            <Html
              fullscreen
              style={{
                position: "fixed",
                left: `${left - 400}px`,
                top: `${top - 350}px`,
                pointerEvents: "auto",
                zIndex: 30,
                transform: "none",
              }}
            >
              <div
                ref={tooltipRef}
                style={{
                  minWidth: "140px",
                  maxWidth: "180px",
                  background: "var(--mantine-color-dark-7)",
                  color: "white",
                  border: "1px solid var(--mantine-color-dark-4)",
                  borderRadius: "10px",
                  padding: "12px 16px",
                  fontSize: "0.85rem",
                  lineHeight: 1.4,
                  textAlign: "left",
                  pointerEvents: "auto",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
                  whiteSpace: "nowrap",
                }}
              >
                <div style={{ fontWeight: 700, marginBottom: 6, textAlign: "center" }}>
                  Orbit Info
                </div>
                <hr style={{ opacity: 0.2, margin: "6px 0" }} />
                <div>
                  <strong>a</strong> = {a.toFixed(2)} AU
                </div>
                <div>
                  <strong>e</strong> = {e.toFixed(3)}
                </div>
                <div>
                  <strong>i</strong> = {inclination}°
                </div>
              </div>
            </Html>
          );
        })()}

      {/* Planet sphere */}
      <mesh ref={planetRef}>
        <sphereGeometry args={[planetRadius, 32, 32]} />
        <meshStandardMaterial 
          color={color}
          map={colorMap}
          normalMap={normalMap}
          metalness={0.2}
          roughness={0.9}
        />
      </mesh>
    </group>
  );
}
