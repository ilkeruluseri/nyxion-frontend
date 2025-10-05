import Star from "./Star";
import Planet from "./Planet";

export interface PlanetConfig {
  planetRadius: number;
  orbitSpeed: number;
  semiMajorAxis?: number;
  eccentricity?: number;
  inclination?: number;
  longitudeOfAscendingNode?: number;
  argumentOfPeriapsis?: number;
  orbitRadius?: number; // for circular orbits
  color?: string;
}

interface PlanetOrbitVisualizationProps {
  planets: PlanetConfig[];
}

export default function PlanetOrbitVisualization({
  planets,
}: PlanetOrbitVisualizationProps) {
  return (
    <>
      <color attach="background" args={["black"]} />
      <ambientLight intensity={0.3} />
      <pointLight position={[0, 0, 0]} intensity={2} color="orange" />

      {/* Central Star */}
      <Star radius={0.4} color="orange" />

      {/* Planets (from props) */}
      {planets.map((planet, index) => (
        <Planet key={index} {...planet} />
      ))}
    </>
  );
}
