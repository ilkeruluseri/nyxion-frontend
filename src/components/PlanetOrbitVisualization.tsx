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

interface PlanetOrbitVisualizationProps {
  planets: PlanetConfig[];
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

export default function PlanetOrbitVisualization({
  planets,
  onTooltipChange
}: PlanetOrbitVisualizationProps) {
  return (
    <>
      <color attach="background" args={["black"]} />

      {/* Central Star */}
      <Star radius={0.4} color="orange"/>

      {/* Planets (from props) */}

      <group onPointerMissed={() => {if(onTooltipChange) onTooltipChange(false)}}>
      {planets.map((planet, index) => (
        <Planet key={index} onTooltipChange={onTooltipChange} {...planet} />
      ))}
      </group>
    </>
  );
}
