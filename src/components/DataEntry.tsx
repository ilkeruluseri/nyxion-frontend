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

export default function DataEntry() {
  const { rows, setCell, addRow, setRows } = useDataStore();
  
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const renameRows = (headers: string[], rows: string[][]) => {
    // mapping old → new
    const renameMap: Record<string, string> = {
      koi_period: "period_days",
      koi_duration: "duration_days",
      koi_depth: "depth",
      koi_prad: "prad_re",
      koi_steff: "steff_K",
      koi_srad: "srad_Rsun",
      koi_smass: "smass_MSun",
      mission: "mission", // keep mission as-is
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
  
      const response = await axios.post("http://127.0.0.1:8000/api/from-table", {
        columns: newHeaders,
        rows: rowObjects,
      });
  
      console.log("Prediction response:", response.data);
    } catch (err) {
      console.error("Error sending data to backend:", err);
    }
  };
  
    

  // inside DataEntry.tsx

  const [importHeaders, setImportHeaders] = useState<string[]>([]);
  const [importRows, setImportRows] = useState<string[][]>([]);

  const REQUIRED_COLS = [
    "koi_period",
    "koi_duration",
    "koi_depth",
    "koi_prad",
    "koi_steff",
    "koi_srad",
    "koi_smass",
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
                <th key={0}>Period Days</th>
                <th key={1}>Duration Days</th>
                <th key={2}>Depth</th>
                <th key={3}>Prad Re</th>
                <th key={4}>Steff K</th>
                <th key={5}>Srad Rsun</th>
                <th key={6}>Smass MSun</th>
                <th key={7}>Mission</th>
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
