import React from "react";

interface TooltipProps {
  visible: boolean;
  data?: {
    semiMajorAxis: number;
    eccentricity: number;
    inclination: number;
    longitudeOfAscendingNode?: number;
    argumentOfPeriapsis?: number;
    orbitSpeed?: number;
    rotationSpeed?: number;
  };
}

export default function Tooltip({ visible, data }: TooltipProps) {
  if (!visible || !data) return null;

  const {
    semiMajorAxis,
    eccentricity,
    inclination,
    longitudeOfAscendingNode,
    argumentOfPeriapsis,
    orbitSpeed,
    rotationSpeed,
  } = data;

  return (
    <div
      style={{
        position: "fixed",
        right: "24px",
        bottom: "24px",
        minWidth: "200px",
        background: "var(--mantine-color-dark-7)",
        color: "white",
        border: "1px solid var(--mantine-color-dark-4)",
        borderRadius: "10px",
        padding: "12px 16px",
        fontSize: "0.85rem",
        lineHeight: 1.4,
        textAlign: "left",
        boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
        zIndex: 9999,
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: 6, textAlign: "center" }}>
        Orbit Information
      </div>
      <hr style={{ opacity: 0.2, margin: "6px 0" }} />
      <div><strong>Semi-Major Axis:</strong> {semiMajorAxis.toFixed(2)} AU</div>
      <div><strong>Eccentricity:</strong> {eccentricity.toFixed(3)}</div>
      <div><strong>Inclination:</strong> {inclination.toFixed(2)}°</div>
      {longitudeOfAscendingNode !== undefined && (
        <div><strong>Longitude of Ascending Node:</strong> {longitudeOfAscendingNode.toFixed(2)}°</div>
      )}
      {argumentOfPeriapsis !== undefined && (
        <div><strong>Argument of Periapsis:</strong> {argumentOfPeriapsis.toFixed(2)}°</div>
      )}
      {orbitSpeed !== undefined && (
        <div><strong>Orbital Speed:</strong> {orbitSpeed.toFixed(3)} rad/s</div>
      )}
      {rotationSpeed !== undefined && (
        <div><strong>Rotation Speed:</strong> {rotationSpeed.toFixed(3)} rad/s</div>
      )}
    </div>
  );
}
