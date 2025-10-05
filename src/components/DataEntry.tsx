import React, { useRef, useState } from "react";
import {
  Button,
  Group,
  Table,
  Title,
  Text,
  TextInput,
  Tabs,
  ScrollArea,
  Flex,
} from "@mantine/core";
import Papa from "papaparse";
import { useDataStore } from "../store/dataStore";
import { usePlanetStore } from "../store/usePlanetStore";
import axios from "axios";

interface DataEntryProps {
  onPredictionComplete?: (results: any[]) => void;
  modelId?: string; // optional (server already knows active model)
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

/* === Single ground-truth schema: backend-required 14 columns === */
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

/* Defaults for missing columns/values */
const DEFAULTS: Record<string, string> = {
  koi_impact: "0",
  koi_kepmag: "",
  koi_fpflag_nt: "0",
  koi_fpflag_ss: "0",
  koi_fpflag_co: "0",
  koi_fpflag_ec: "0",
};

/* Optional columns used for visualization (if present in CSV) */
const VISUAL_REQUIRED_COLS = [
  "koi_period",
  "koi_prad",
  "koi_sma",
  "koi_eccen",
  "koi_incl",
  "koi_longp",
  "koi_steff",
  "koi_srad",
  "koi_smass",
];

/* Header normalization + alias map */
const ALIAS_MAP: Record<string, string> = {
  "koi period": "koi_period",
  koiperiod: "koi_period",
  period_days: "koi_period",

  "koi duration": "koi_duration",
  koiduration: "koi_duration",
  duration_days: "koi_duration",

  "koi depth": "koi_depth",
  koi_depth_ppm: "koi_depth",

  "koi prad": "koi_prad",
  "koi_prad (re)": "koi_prad",
  prad_re: "koi_prad",

  "koi steff": "koi_steff",
  steff_k: "koi_steff",

  "koi slog g": "koi_slogg",
  "koi_slog g": "koi_slogg",
  "koi slog": "koi_slogg",

  "koi srad": "koi_srad",
  srad_rsun: "koi_srad",

  "koi smass": "koi_smass",
  smass_msun: "koi_smass",

  "koi impact": "koi_impact",
  "koi kepmag": "koi_kepmag",

  "koi fpflag nt": "koi_fpflag_nt",
  "koi fpflag ss": "koi_fpflag_ss",
  "koi fpflag co": "koi_fpflag_co",
  "koi fpflag ec": "koi_fpflag_ec",

  // Visualization aliases
  "koi sma": "koi_sma",
  koisma: "koi_sma",
  "koi eccen": "koi_eccen",
  koieccen: "koi_eccen",
  "koi incl": "koi_incl",
  koiinc: "koi_incl",
  "koi longp": "koi_longp",
  koilongp: "koi_longp",
};

function normalizeHeader(h: string): string {
  return String(h || "")
    .replace(/\uFEFF/g, "") // BOM
    .trim()
    .toLowerCase()
    .replace(/[()]/g, " ") // parentheses -> space
    .replace(/[^\w\s]/g, " ") // special chars -> space
    .replace(/\s+/g, " ") // multiple spaces -> single
    .trim();
}
function mapAlias(h: string): string {
  const raw = normalizeHeader(h);
  return ALIAS_MAP[raw] ?? raw.replace(/\s/g, "_");
}

/* Helpers */
const toObjects = (headers: string[], data: string[][]) =>
  data.map((row) => Object.fromEntries(headers.map((h, i) => [h, row[i] ?? ""])));

function extractVisibilityFromResponse(response: any): boolean[] {
  const list = response?.rows;
  if (!Array.isArray(list)) return [];
  return list.map((row: any) => String(row?.prediction ?? "") !== "0");
}

/* Build planet configs from raw headers/rows (if present) */
function convertToPlanetConfigsFromRaw(headers: string[], data: string[][]): PlanetConfig[] {
  if (headers.length === 0 || data.length === 0) return [];
  const lower = headers.map((h) => h.toLowerCase());
  const idx = (name: string) => lower.indexOf(name);

  const pos = {
    period: idx("koi_period"),
    sma: idx("koi_sma"),
    ecc: idx("koi_eccen"),
    incl: idx("koi_incl"),
    longp: idx("koi_longp"),
    prad: idx("koi_prad"),
  };

  const parsed = data.map((row) => ({
    period: parseFloat(row[pos.period] ?? "0") || 0,
    sma: parseFloat(row[pos.sma] ?? "0") || 0,
    ecc: parseFloat(row[pos.ecc] ?? "0") || 0,
    incl: parseFloat(row[pos.incl] ?? "0") || 0,
    longp: parseFloat(row[pos.longp] ?? "0") || 0,
    prad: parseFloat(row[pos.prad] ?? "1") || 1,
  }));

  const maxSMA = Math.max(...parsed.map((p) => p.sma || 0), 1);
  const palette = ["lightblue", "lightgreen", "orange", "violet", "red", "cyan", "yellow", "pink"];

  return parsed.map((p, i) => ({
    planetRadius: Math.max(0.03, p.prad / 20),
    orbitSpeed: 0.5 / Math.max(p.period, 1),
    semiMajorAxis: (p.sma / maxSMA) * 2 + 3,
    eccentricity: Math.min(p.ecc, 0.8),
    inclination: p.incl,
    longitudeOfAscendingNode: Math.random() * 360,
    argumentOfPeriapsis: p.longp,
    color: palette[i % palette.length],
  }));
}

/* Pad a row to 14 columns (REQUIRED_COLS order) with defaults */
const padToRequired = (row: string[]): string[] =>
  REQUIRED_COLS.map((col, i) => {
    const v = row[i];
    return v !== undefined && v !== null && String(v) !== "" ? String(v) : (DEFAULTS[col] ?? "");
  });

export default function DataEntry({
  onPredictionComplete,
  modelId = "cascade-v1",
}: DataEntryProps) {
  const { rows, setCell, addRow, setRows } = useDataStore();
  const { setPlanets, setVisibility } = usePlanetStore();

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  /* CSV (compact 14-col) */
  const [importHeaders, setImportHeaders] = useState<string[]>([]);
  const [importRows, setImportRows] = useState<string[][]>([]);

  /* Raw headers/rows for visualization */
  const [rawHeaders, setRawHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<string[][]>([]);

  /* Active rows source for UI and prediction */
  const currentRows: string[][] = (importRows.length ? importRows : rows).map(padToRequired);

  /* Predict using currentRows */
  const onPredict = async () => {
    try {
      if (currentRows.length === 0) {
        alert("No data loaded for prediction. Please import CSV or use Manual Entry.");
        return;
      }
      const headersToSend = [...REQUIRED_COLS];
      const rowsToSend = currentRows.map(padToRequired);
      const rowObjects = toObjects(headersToSend, rowsToSend);

      const response = await axios.post("http://127.0.0.1:8000/api/predict/from-table", {
        columns: headersToSend,
        rows: rowObjects,
        // model_id: modelId, // uncomment to override active model server-side
      });

      if (response.data?.ok && Array.isArray(response.data?.rows)) {
        onPredictionComplete?.(response.data.rows);
        const visibility = extractVisibilityFromResponse(response.data);
        setVisibility(visibility);
      } else {
        console.error("Invalid prediction response:", response.data);
        alert("Prediction failed. See console for details.");
      }
    } catch (err) {
      console.error("Error sending data to backend:", err);
      alert("Error making prediction. Check console for details.");
    }
  };

  /* CSV upload with header normalization/aliases */
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse<Record<string, string | number>>(file, {
      header: true,
      dynamicTyping: false,
      skipEmptyLines: true,
      transformHeader: mapAlias,
      complete: (result) => {
        const records = (result.data || []).filter((r) => r && Object.keys(r).length > 0);
        if (records.length === 0) {
          alert("CSV has no valid data rows.");
          return;
        }

        // Which columns are present?
        const present = new Set<string>();
        for (const rec of records) Object.keys(rec).forEach((k) => present.add(k));
        console.log("[CSV] present headers:", Array.from(present));

        // Build compact 14-col rows in REQUIRED_COLS order
        const compactRows: string[][] = records.map((rec) =>
          REQUIRED_COLS.map((col) => {
            const val = (rec as any)[col];
            return val !== undefined && val !== null && String(val) !== ""
              ? String(val)
              : (DEFAULTS[col] ?? "");
          })
        );

        // Update CSV state + store (manual editor sees the same data)
        setImportHeaders([...REQUIRED_COLS]);
        setImportRows(compactRows);
        setRows(compactRows);

        // Visualization from raw records (stable order)
        const rh = Array.from(present).sort();
        const rawRowsLocal = records.map((rec) => rh.map((h) => String((rec as any)[h] ?? "")));
        setRawHeaders(rh);
        setRawRows(rawRowsLocal);

        const planetConfigs = convertToPlanetConfigsFromRaw(rh, rawRowsLocal);
        setPlanets(planetConfigs);
      },
      error: (err) => {
        console.error("CSV parse error:", err);
        alert("CSV parse error. See console for details.");
        setImportHeaders([]);
        setImportRows([]);
        setRows([]);
        setRawHeaders([]);
        setRawRows([]);
        setPlanets([]);
        setVisibility([]);
      },
    });

    e.currentTarget.value = "";
  };

  const clearImport = () => {
    setImportRows([]);
    setImportHeaders([]);
    setRows([]);
    setRawHeaders([]);
    setRawRows([]);
    setPlanets([]);
    setVisibility([]);
  };

  return (
    <Flex>
      <Tabs defaultValue="import" variant="outline" style={{ alignSelf: "flex-start", width: "100%" }}>
        <Tabs.List>
          <Tabs.Tab value="import">Import</Tabs.Tab>
          <Tabs.Tab value="manual">Manual Entry</Tabs.Tab>
        </Tabs.List>

        {/* Import Tab */}
        <Tabs.Panel value="import" pt="md" style={{ flex: 1, minHeight: 400 }}>
          <Title order={3} mb="sm">
            Controls
          </Title>

          <Group mb="lg">
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
            <ScrollArea style={{ maxHeight: 400, maxWidth: 800, border: "1px solid #ddd" }} offsetScrollbars>
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
        </Tabs.Panel>

        {/* Manual Entry Tab */}
        <Tabs.Panel value="manual" pt="md" style={{ flex: 1, minHeight: 400 }}>
          <Title order={3} mb="sm">
            Data Entries
          </Title>

          <Table striped highlightOnHover withColumnBorders>
            <thead>
              <tr>
                {REQUIRED_COLS.map((c, i) => (
                  <th key={i}>{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {currentRows.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.map((cell, colIndex) => (
                    <td key={colIndex}>
                      <TextInput
                        value={cell}
                        onChange={(e) => {
                          const v = e.currentTarget.value;

                          // Update store.rows (manual)
                          const nextStore = [...(rows.length ? rows : currentRows)];
                          const storePadded = padToRequired(nextStore[rowIndex] ?? []);
                          storePadded[colIndex] = v;
                          nextStore[rowIndex] = storePadded;
                          setRows(nextStore);

                          // Update CSV buffer if CSV loaded
                          if (importRows.length) {
                            const nextImport = [...importRows];
                            const impPadded = padToRequired(nextImport[rowIndex] ?? []);
                            impPadded[colIndex] = v;
                            nextImport[rowIndex] = impPadded;
                            setImportRows(nextImport);
                          }
                        }}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </Table>

          <Group mt="md">
            <Button onClick={addRow} color="dark">
              Add Row
            </Button>
            <Button color="dark" onClick={onPredict}>
              Predict
            </Button>
          </Group>
        </Tabs.Panel>
      </Tabs>
    </Flex>
  );
}
