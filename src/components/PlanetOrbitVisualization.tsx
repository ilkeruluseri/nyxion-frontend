// PlanetOrbitVisualization.tsx
import Star from "./Star";
import Planet from "./Planet";

export default function PlanetOrbitVisualization() {
  return (
    <>
      <color attach="background" args={["black"]} />
      <ambientLight intensity={0.3} />
      <pointLight position={[0, 0, 0]} intensity={2} color="orange" />

      {/* Central Star */}
      <Star radius={0.4} color="orange" />

      {/* Planet #1 (simple circular orbit) */}
      <Planet
        planetRadius={0.1}
        orbitRadius={2}
        orbitSpeed={0.5}
        color="lightblue"
      />

      {/* Planet #2 (elliptical + tilted orbit) */}
      <Planet
        planetRadius={0.15}
        orbitSpeed={0.3}
        semiMajorAxis={3.5}
        eccentricity={0.4}
        inclination={10}
        longitudeOfAscendingNode={40}
        argumentOfPeriapsis={20}
        color="lightgreen"
      />

      <Planet
        planetRadius={0.25}
        orbitSpeed={0.4}
        semiMajorAxis={4.5}
        eccentricity={0.4}
        inclination={-10}
        longitudeOfAscendingNode={40}
        argumentOfPeriapsis={30}
        color="red"
      />
    </>
  );
}
