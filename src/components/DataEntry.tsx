import React, { useRef, useState } from "react";
import {
  Button,
  Group,
  Table,
  Title,
  Text,
  ScrollArea,
  Flex
} from "@mantine/core";
import Papa from "papaparse";
import { useDataStore } from "../store/dataStore";
import { usePlanetStore } from "../store/usePlanetStore";
import axios from "axios";

interface DataEntryProps {
  onPredictionComplete?: (results: any[]) => void;
  modelId?: string;
}

interface PlanetConfig {
  planetRadius: number;
  orbitSpeed: number;
  semiMajorAxis: number;
  eccentricity: number;
  inclination: number;
  longitudeOfAscendingNode: number;
  argumentOfPeriapsis: number;
  color: string;
}

export default function DataEntry({ onPredictionComplete }: DataEntryProps) {
  const { setRows } = useDataStore();
  const { setPlanets, setVisibility } = usePlanetStore();

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [importHeaders, setImportHeaders] = useState<string[]>([]);
  const [importRows, setImportRows] = useState<string[][]>([]);

  const REQUIRED_COLS = [
    "koi_period",
    "koi_duration",
    "koi_depth",
    "koi_prad",
    "koi_steff",
    "koi_slogg",
    "koi_srad",
    "koi_smass",
    "koi_impact",
    "koi_kepmag",
    "koi_fpflag_nt",
    "koi_fpflag_ss",
    "koi_fpflag_co",
    "koi_fpflag_ec",
  ];

  const VISUAL_REQUIRED_COLS = [
    "koi_period",
    "koi_prad",
    "koi_sma",
    "koi_eccen",
    "koi_incl",
    "koi_longp",
    "koi_steff",
    "koi_srad",
    "koi_smass"
  ];

  const renameRows = (headers: string[], rows: string[][]) => {
    const renameMap: Record<string, string> = {
      koi_period: "koi_period",
      koi_duration: "koi_duration",
      koi_depth: "koi_depth",
      koi_prad: "koi_prad",
      koi_steff: "koi_steff",
      koi_slogg: "koi_slogg",
      koi_srad: "koi_srad",
      koi_smass: "koi_smass",
      koi_impact: "koi_impact",
      koi_kepmag: "koi_kepmag",
      koi_fpflag_nt: "koi_fpflag_nt",
      koi_fpflag_ss: "koi_fpflag_ss",
      koi_fpflag_co: "koi_fpflag_co",
      koi_fpflag_ec: "koi_fpflag_ec",
    };

    const newHeaders = headers.map((h) => renameMap[h] ?? h);

    const rowObjects = rows.map((row) =>
      Object.fromEntries(row.map((cell, i) => [newHeaders[i], cell]))
    );

    return { newHeaders, rowObjects };
  };

  function extractVisibilityFromResponse(response: any): boolean[] {
    if (!response?.rows || !Array.isArray(response.rows)) {
      console.error("Invalid response format:", response);
      return [];
    }

    return response.rows.map((row: any) => {
      const prediction = String(row.prediction ?? "");
      return prediction !== "0";
    });
  }

  const onPredict = async () => {
    try {
      if (importRows.length === 0 || importHeaders.length === 0) {
        alert("No data loaded for prediction.");
        return;
      }

      const { newHeaders, rowObjects } = renameRows(importHeaders, importRows);

      const response = await axios.post("https://nyxion-backend.onrender.com/api/predict/from-table", {
        columns: newHeaders,
        rows: rowObjects,
      });

      console.log("Full Prediction response:", response.data);

      if (response.data.ok && response.data.rows) {
        if (onPredictionComplete) {
          onPredictionComplete(response.data.rows);
        }
        const visibility = extractVisibilityFromResponse(response.data);
        setVisibility(visibility);
      } else {
        console.error("Invalid response format:", response.data);
      }
    } catch (err) {
      console.error("Error sending data to backend:", err);
      alert("Error making prediction. Check console for details.");
    }
  };

  function convertToPlanetConfigs(rows: Record<string, string>[]): PlanetConfig[] {
    const parsed = rows.map((row) => ({
      period: parseFloat(row.koi_period),
      sma: parseFloat(row.koi_sma),
      ecc: parseFloat(row.koi_eccen) || 0,
      incl: parseFloat(row.koi_incl) || 0,
      longp: parseFloat(row.koi_longp) || 0,
      prad: parseFloat(row.koi_prad) || 1,
    }));

    const maxSMA = Math.max(...parsed.map((p) => p.sma || 0), 1);

    return parsed.map((p, i) => {
      const semiMajorAxis = (p.sma / maxSMA) * 2 + 3;
      const planetRadius = Math.max(0.03, p.prad / 20);
      const orbitSpeed = 0.5 / Math.max(p.period, 1);

      const colorPalette = [
        "lightblue",
        "lightgreen",
        "orange",
        "violet",
        "red",
        "cyan",
        "yellow",
        "pink",
      ];

      return {
        planetRadius,
        orbitSpeed,
        semiMajorAxis,
        eccentricity: Math.min(p.ecc, 0.8),
        inclination: p.incl,
        longitudeOfAscendingNode: Math.random() * 360,
        argumentOfPeriapsis: p.longp,
        color: colorPalette[i % colorPalette.length],
      };
    });
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse<string[]>(file, {
      skipEmptyLines: true,
      complete: (result) => {
        const filtered = result.data.filter(
          (row) => !(row[0] && String(row[0]).trim().startsWith("#"))
        );

        if (filtered.length === 0) {
          alert("Error: CSV has no valid data rows.");
          return;
        }

        const rawHeaders = filtered[0].map((h) => h.trim().toLowerCase());
        const missing = REQUIRED_COLS.filter((col) => !rawHeaders.includes(col));

        if (missing.length > 0) {
          alert(`Error: Missing required columns: ${missing.join(", ")}`);
          return;
        }

        const colIndexes = REQUIRED_COLS.map((col) => rawHeaders.indexOf(col));

        const data = filtered.slice(1).map((row) =>
          colIndexes.map((i) => String(row[i] ?? ""))
        );

        setImportHeaders([...REQUIRED_COLS]);
        setImportRows(data);
        setRows(data);

        const rowObjects = data.map((row) =>
          Object.fromEntries([...VISUAL_REQUIRED_COLS].map((h, i) => [h, row[i]]))
        );

        const planetConfigs = convertToPlanetConfigs(rowObjects);
        setPlanets(planetConfigs);
      },
      error: (err) => {
        console.error("CSV parse error:", err);
        alert("CSV parse error. See console for details.");
        setImportHeaders([]);
        setImportRows([]);
        setRows([]);
      },
    });

    e.currentTarget.value = "";
  };

  const clearImport = () => setImportRows([]);

  return (
    <Flex direction="column" style={{ width: "100%" }}>
      <Title order={3} mb="sm">
        Data Entry
      </Title>

      <Group mb="lg">
        <Text size="lg">This project works with data from Kepler objects of Interest (KOI). 
          You can find the dataset here:
          <Text
            component="a"
            href="https://exoplanetarchive.ipac.caltech.edu/cgi-bin/TblView/nph-tblView?app=ExoTbls&config=cumulative"
            target="_blank"
            rel="noopener noreferrer"
            c="blue.4"
            fw={500}
            td="underline"
          >
            Kepler Objects of Interest (KOI) - NASA Exoplanet Archive
          </Text>
        
        </Text>
        <Text size="lg">Import CSV file</Text>
        <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
          Upload
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          style={{ display: "none" }}
          onChange={handleFileUpload}
        />
        <Button variant="default" onClick={clearImport}>
          Clear
        </Button>
      </Group>

      {importRows.length > 0 ? (
        <ScrollArea
          style={{ maxHeight: 400, maxWidth: 800, border: "1px solid #ddd" }}
          offsetScrollbars
        >
          <Table striped highlightOnHover withColumnBorders withRowBorders>
            <Table.Thead>
              <Table.Tr>
                {importHeaders.map((h, i) => (
                  <Table.Th key={i}>{h}</Table.Th>
                ))}
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {importRows.map((row, rowIndex) => (
                <Table.Tr key={rowIndex}>
                  {row.map((cell, colIndex) => (
                    <Table.Td key={colIndex}>{cell}</Table.Td>
                  ))}
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </ScrollArea>
      ) : (
        <Text color="dimmed">No CSV loaded yet.</Text>
      )}

      <Group mt="md">
        <Button color="dark" variant="filled" onClick={onPredict}>
          Predict
        </Button>
      </Group>
    </Flex>
  );
}
