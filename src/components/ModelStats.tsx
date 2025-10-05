import { useEffect, useState } from "react";
import {
  Card,
  Grid,
  Group,
  Loader,
  Table,
  Text,
  Title,
  Badge,
  Alert,
  Space,
  Stack,
} from "@mantine/core";

// === Data types ===
export interface ModelStatsPayload {
  model_id: string;
  model_name: string;
  version: string;
  trained_at: string;
  dataset: string;
  metrics: {
    accuracy?: number;
    macro_f1?: number;
    weighted_f1?: number;
    auc_macro?: number;
    cand_f1?: number;
    cand_prec?: number;
    cand_rec?: number;
  };
  per_class?: Array<{
    label: "FALSE POSITIVE" | "CANDIDATE" | "CONFIRMED";
    precision: number;
    recall: number;
    f1: number;
    support: number;
  }>;
  confusion_matrix?: number[][];
}

// === Single mocked model (XGBoost) ===
const XGB_STATS: ModelStatsPayload = {
  model_id: "models/xgb_koi_star.joblib",
  model_name: "xgb_koi_star",
  version: "2025.10.05-groupsplit",
  trained_at: "2025-10-05",
  dataset: "Kepler Objects of Interest (KOI)",
  metrics: {
    accuracy: 0.9,
    macro_f1: 0.869,
    weighted_f1: 0.9,
    cand_f1: 0.77,
    cand_prec: 0.78,
    cand_rec: 0.77,
  },
  per_class: [
    { label: "FALSE POSITIVE", precision: 0.99, recall: 0.98, f1: 0.99, support: 981 },
    { label: "CANDIDATE", precision: 0.78, recall: 0.77, f1: 0.77, support: 395 },
    { label: "CONFIRMED", precision: 0.83, recall: 0.86, f1: 0.84, support: 526 },
  ],
  confusion_matrix: [
    [965, 13, 3],
    [4, 303, 88],
    [2, 73, 451],
  ],
};

// === Mock fetch ===
async function fetchModelStats(): Promise<ModelStatsPayload> {
  return XGB_STATS;
}

const CLASS_LABELS = ["FALSE POSITIVE", "CANDIDATE", "CONFIRMED"];
const CLASS_COLORS = ["#868e96", "#868e96", "#868e96"];

// === Component ===
export default function ModelStats({ modelId }: { modelId: string }) {
  const [data, setData] = useState<ModelStatsPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    setData(null);

    fetchModelStats()
      .then((d) => {
        if (alive) setData(d);
      })
      .catch((e) => {
        if (alive) setError(e?.message ?? "Unknown error");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [modelId]);

  if (loading) {
    return (
      <Group justify="center" my="xl">
        <Loader />
      </Group>
    );
  }

  if (error || !data) {
    return <Alert color="red">Failed to load model stats: {error ?? "No data"}</Alert>;
  }

  const { model_name, version, trained_at, dataset, metrics, per_class, confusion_matrix } = data;

  // Calculate confusion matrix percentages for better visualization
  const confusionWithPercent = (confusion_matrix ?? []).map((row, i) => {
    const total = row.reduce((sum, val) => sum + val, 0);
    return row.map((val, j) => ({
      value: val,
      percent: total > 0 ? (val / total) * 100 : 0,
      isCorrect: i === j,
    }));
  });

  return (
    <Stack gap="lg">
      {/* Header */}
      <Group align="baseline" justify="space-between">
        <div>
          <Title order={2}>{model_name}</Title>
          <Text size="sm" c="dimmed">
            Version {version} • Trained at {new Date(trained_at).toLocaleString()} • Dataset: {dataset}
          </Text>
        </div>
        <Badge variant="light" size="lg">
          {data.model_id}
        </Badge>
      </Group>

      {/* Overall metrics */}
      <Grid gutter="md">
        <Grid.Col span={{ base: 12, sm: 4 }}>
          <Card withBorder>
            <Text fw={600} size="sm" c="dimmed">Accuracy</Text>
            <Title order={2}>{fmt(metrics.accuracy)}</Title>
          </Card>
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 4 }}>
          <Card withBorder>
            <Text fw={600} size="sm" c="dimmed">Macro F1</Text>
            <Title order={2}>{fmt(metrics.macro_f1)}</Title>
          </Card>
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 4 }}>
          <Card withBorder>
            <Text fw={600} size="sm" c="dimmed">Weighted F1</Text>
            <Title order={2}>{fmt(metrics.weighted_f1)}</Title>
          </Card>
        </Grid.Col>
      </Grid>

      {/* Per-Class Metrics Chart */}
      <Card withBorder>
        <Title order={4}>Per-Class Performance</Title>
        <Space h="md" />
        
        <Stack gap="md">
          {(per_class ?? []).map((classData, _idx) => (
            <div key={classData.label}>
              <Text size="sm" fw={500} mb="xs">{classData.label}</Text>
              
              <Stack gap="xs">
                <div>
                  <Group justify="space-between" mb={4}>
                    <Text size="xs" c="dimmed">Precision</Text>
                    <Text size="xs" fw={500}>{fmt(classData.precision)}</Text>
                  </Group>
                  <div style={{ 
                    width: '100%', 
                    height: 8, 
                    backgroundColor: '#f1f3f5', 
                    borderRadius: 4,
                    overflow: 'hidden'
                  }}>
                    <div style={{ 
                      width: `${classData.precision * 100}%`, 
                      height: '100%', 
                      backgroundColor: '#495057',
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                </div>

                <div>
                  <Group justify="space-between" mb={4}>
                    <Text size="xs" c="dimmed">Recall</Text>
                    <Text size="xs" fw={500}>{fmt(classData.recall)}</Text>
                  </Group>
                  <div style={{ 
                    width: '100%', 
                    height: 8, 
                    backgroundColor: '#f1f3f5', 
                    borderRadius: 4,
                    overflow: 'hidden'
                  }}>
                    <div style={{ 
                      width: `${classData.recall * 100}%`, 
                      height: '100%', 
                      backgroundColor: '#495057',
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                </div>

                <div>
                  <Group justify="space-between" mb={4}>
                    <Text size="xs" c="dimmed">F1-Score</Text>
                    <Text size="xs" fw={500}>{fmt(classData.f1)}</Text>
                  </Group>
                  <div style={{ 
                    width: '100%', 
                    height: 8, 
                    backgroundColor: '#f1f3f5', 
                    borderRadius: 4,
                    overflow: 'hidden'
                  }}>
                    <div style={{ 
                      width: `${classData.f1 * 100}%`, 
                      height: '100%', 
                      backgroundColor: '#495057',
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                </div>
              </Stack>
            </div>
          ))}
        </Stack>
      </Card>

      {/* Detailed table and confusion matrix */}
      <Grid gutter="md">
        {/* Per-class metrics table */}
        <Grid.Col span={{ base: 12, lg: 6 }}>
          <Card withBorder>
            <Title order={4}>Detailed Metrics</Title>
            <Space h="sm" />
            <Table striped withTableBorder withColumnBorders highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Class</Table.Th>
                  <Table.Th>Precision</Table.Th>
                  <Table.Th>Recall</Table.Th>
                  <Table.Th>F1-Score</Table.Th>
                  <Table.Th>Support</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {(per_class ?? []).map((r, idx) => (
                  <Table.Tr key={r.label}>
                    <Table.Td>
                      <Group gap="xs">
                        <div style={{ width: 12, height: 12, borderRadius: 2, backgroundColor: CLASS_COLORS[idx] }} />
                        <Text size="sm" fw={500}>{r.label}</Text>
                      </Group>
                    </Table.Td>
                    <Table.Td>{fmt(r.precision)}</Table.Td>
                    <Table.Td>{fmt(r.recall)}</Table.Td>
                    <Table.Td>{fmt(r.f1)}</Table.Td>
                    <Table.Td>{r.support}</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Card>
        </Grid.Col>

        {/* Confusion matrix */}
        <Grid.Col span={{ base: 12, lg: 6 }}>
          <Card withBorder>
            <Title order={4}>Confusion Matrix</Title>
            <Text size="sm" c="dimmed" mb="sm">
              Rows: True Label • Columns: Predicted Label
            </Text>
            
            <div style={{ overflowX: "auto" }}>
              <Table withTableBorder withColumnBorders style={{ minWidth: 400 }}>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th style={{ textAlign: "center", fontWeight: 700 }}>True \ Pred</Table.Th>
                    {CLASS_LABELS.map((label) => (
                      <Table.Th key={label} style={{ textAlign: "center", fontWeight: 700, fontSize: 11 }}>
                        {label.split(" ")[0]}
                      </Table.Th>
                    ))}
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {confusionWithPercent.map((row, i) => (
                    <Table.Tr key={i}>
                      <Table.Td style={{ textAlign: "center", fontWeight: 700, fontSize: 11 }}>
                        {CLASS_LABELS[i].split(" ")[0]}
                      </Table.Td>
                      {row.map((cell, j) => (
                        <Table.Td
                          key={`${i}-${j}`}
                          style={{
                            textAlign: "center",
                            fontWeight: cell.isCorrect ? 600 : 400,
                            backgroundColor: cell.isCorrect 
                              ? `rgba(73, 80, 87, ${0.05 + cell.percent / 400})` 
                              : cell.value > 0 
                              ? `rgba(222, 226, 230, ${cell.percent / 300})` 
                              : undefined,
                          }}
                        >
                          <div>
                            <Text size="sm" fw={cell.isCorrect ? 700 : 500}>{cell.value}</Text>
                            <Text size="xs" c="dimmed">({cell.percent.toFixed(1)}%)</Text>
                          </div>
                        </Table.Td>
                      ))}
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </div>
            
            <Space h="xs" />
            <Group justify="center" gap="md">
              <Group gap="xs">
                <div style={{ width: 12, height: 12, backgroundColor: "rgba(73, 80, 87, 0.2)" }} />
                <Text size="xs" c="dimmed">Correct</Text>
              </Group>
              <Group gap="xs">
                <div style={{ width: 12, height: 12, backgroundColor: "rgba(222, 226, 230, 0.5)" }} />
                <Text size="xs" c="dimmed">Errors</Text>
              </Group>
            </Group>
          </Card>
        </Grid.Col>
      </Grid>
    </Stack>
  );
}

// === Helper ===
function fmt(n?: number) {
  return typeof n === "number" ? n.toFixed(3) : "—";
}