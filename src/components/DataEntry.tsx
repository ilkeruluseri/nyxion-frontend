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

export default function DataEntry() {
  const { rows, setCell, addRow } = useDataStore();

  
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // inside DataEntry.tsx

  const [importHeaders, setImportHeaders] = useState<string[]>([]);
  const [importRows, setImportRows] = useState<string[][]>([]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse<string[]>(file, {
      skipEmptyLines: true,
      complete: (result) => {
        // remove comment rows (# at start)
        const filtered = result.data.filter(
          (row) => !(row[0] && String(row[0]).trim().startsWith("#"))
        );

        if (filtered.length === 0) {
          setImportHeaders([]);
          setImportRows([]);
          return;
        }

        // first row is header
        const headers = filtered[0].map((c) => (c == null ? "" : String(c)));
        const data = filtered.slice(1).map((r) => r.map((c) => (c == null ? "" : String(c))));

        setImportHeaders(headers);
        setImportRows(data);
      },
      error: (err) => {
        console.error("CSV parse error:", err);
        setImportHeaders([]);
        setImportRows([]);
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
            <Button color="dark" variant="filled">
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
                {Array.from({ length: 7 }).map((_, i) => (
                  <th key={i}>Column {i + 1}</th>
                ))}
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
            <Button color="dark">Predict</Button>
          </Group>
        </Tabs.Panel>
      </Tabs>
    </Flex>
  );
}
