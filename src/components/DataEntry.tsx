import React, { useRef, useState } from "react";
import {
  Button,
  Group,
  Table,
  Title,
  Container,
  Text,
  TextInput,
  Tabs,
  ScrollArea,
  Flex
} from "@mantine/core";
import Papa from "papaparse";
import { useDataStore } from "../store/dataStore";
import axios from "axios";

interface DataEntryProps {
  onPredictionComplete?: (results: any[]) => void;
  modelId?: string; // ← EKLENDİ (opsiyonel)
}

export default function DataEntry({
  onPredictionComplete,
  modelId = "cascade-v1", // ← default
}: DataEntryProps) {
  const { rows, setCell, addRow, setRows } = useDataStore();
  
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const renameRows = (headers: string[], rows: string[][]) => {
    // mapping old → new
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
    
  
    // rename headers
    const newHeaders = headers.map((h) => renameMap[h] ?? h);
  
    // build new row objects with renamed keys
    const rowObjects = rows.map((row) =>
      Object.fromEntries(row.map((cell, i) => [newHeaders[i], cell]))
    );
    return { newHeaders, rowObjects };
  };

  const onPredict = async () => {
    try {
      if (importRows.length === 0 || importHeaders.length === 0) {
        alert("No data loaded for prediction.");
        return;
      }
  
      // rename headers + build row objects
      const { newHeaders, rowObjects } = renameRows(importHeaders, importRows);
  
      const response = await axios.post("http://127.0.0.1:8000/api/predict/from-table", {
        columns: newHeaders,
        rows: rowObjects,
      });
  
      console.log("Full Prediction response:", response.data);
      console.log("Response.data.rows:", response.data.rows);
      console.log("onPredictionComplete exists?", !!onPredictionComplete);
      
      // Pass results to parent component if callback exists
      if (response.data.ok && response.data.rows) {
        console.log("About to call onPredictionComplete with:", response.data.rows);
        if (onPredictionComplete) {
          onPredictionComplete(response.data.rows);
          console.log("onPredictionComplete called successfully");
        } else {
          console.error("onPredictionComplete is undefined!");
        }
      } else {
        console.error("Invalid response format:", response.data);
      }
    } catch (err) {
      console.error("Error sending data to backend:", err);
      alert("Error making prediction. Check console for details.");
    }
  };
  
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
  
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
  
    Papa.parse<string[]>(file, {
      skipEmptyLines: true,
      complete: (result) => {
        // Remove comment rows
        const filtered = result.data.filter(
          (row) => !(row[0] && String(row[0]).trim().startsWith("#"))
        );
  
        if (filtered.length === 0) {
          console.error("CSV has no valid data rows.");
          alert("Error: CSV has no valid data rows.");
          return;
        }
  
        // First row is the header
        const rawHeaders = filtered[0].map((h) => h.trim().toLowerCase());
        const missing = REQUIRED_COLS.filter((col) => !rawHeaders.includes(col));
  
        if (missing.length > 0) {
          console.error("Missing required columns:", missing);
          alert(`Error: Missing required columns: ${missing.join(", ")}`);
          return;
        }
  
        // Build index map for required columns
        const colIndexes = REQUIRED_COLS.map((col) => rawHeaders.indexOf(col));
  
        // Parse rows using required columns
        const data = filtered.slice(1).map((row) => {
          const extracted = colIndexes.map((i) => String(row[i] ?? ""));
          extracted.push("kepler"); // add mission column
          return extracted;
        });
  
        // Save headers + rows
        setImportHeaders([...REQUIRED_COLS, "mission"]);
        setImportRows(data);
        setRows(data);
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
        </Tabs.Panel>

        {/* Manual Entry Tab */}
        <Tabs.Panel value="manual" pt="md" style={{ flex: 1, minHeight: 400 }}>
          <Title order={3} mb="sm">
            Data Entries
          </Title>

          <Table striped highlightOnHover withColumnBorders>
            <thead>
              <tr>
              <th key={0}>koi_period</th>
              <th key={1}>koi_duration</th>
              <th key={2}>koi_depth</th>
              <th key={3}>koi_prad</th>
              <th key={4}>koi_steff</th>
              <th key={5}>koi_slogg</th>
              <th key={6}>koi_srad</th>
              <th key={7}>koi_smass</th>
              <th key={8}>koi_impact</th>
              <th key={9}>koi_kepmag</th>
              <th key={10}>koi_fpflag_nt</th>
              <th key={11}>koi_fpflag_ss</th>
              <th key={12}>koi_fpflag_co</th>
              <th key={13}>koi_fpflag_ec</th>

              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.map((cell, colIndex) => (
                    <td key={colIndex}>
                      <TextInput
                        value={cell}
                        onChange={(e) =>
                          setCell(rowIndex, colIndex, e.currentTarget.value)
                        }
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
            <Button color="dark" onClick={onPredict}>Predict</Button>
          </Group>
        </Tabs.Panel>
      </Tabs>
    </Flex>
  );
}