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
} from "@mantine/core";

// === Veri tipi tanımı ===
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

// === Tek model mock (XGBoost) ===
const XGB_STATS: ModelStatsPayload = {
  model_id: "models/xgb_koi_star.joblib",
  model_name: "xgb_koi_star",
  version: "2025.10.05-groupsplit",
  trained_at: "2025-10-05",
  dataset: "cumulative_2025.10.03_03.20.15.csv (kepid group split)",
  metrics: {
    accuracy: 0.90,
    macro_f1: 0.869,
    weighted_f1: 0.90,
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

// === Mock fonksiyon (ileride API bağlanabilir) ===
async function fetchModelStats(): Promise<ModelStatsPayload> {
  return XGB_STATS;
}

// === Ana bileşen ===
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

  return (
    <>
      {/* Header */}
      <Group align="baseline" justify="space-between">
        <div>
          <Title order={2}>{model_name}</Title>
          <Text size="sm" c="dimmed">
            Version {version} • Trained at {new Date(trained_at).toLocaleString()} • Dataset:{" "}
            {dataset}
          </Text>
        </div>
        <Badge variant="light" size="lg">
          {data.model_id}
        </Badge>
      </Group>

      <Space h="md" />

      {/* Genel metrikler */}
      <Grid gutter="md">
        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <Card withBorder>
            <Text fw={600}>Accuracy</Text>
            <Title order={3}>{fmt(metrics.accuracy)}</Title>
          </Card>
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <Card withBorder>
            
            <Text fw={600}>Macro F1</Text>
            <Title order={3}>{fmt(metrics.macro_f1)}</Title>
          </Card>
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <Card withBorder>
            <Text fw={600}>Weighted F1</Text>
            <Title order={3}>{fmt(metrics.weighted_f1)}</Title>
          </Card>
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <Card withBorder>
            <Text fw={600}>AUC (macro)</Text>
            <Title order={3}>{fmt(metrics.auc_macro)}</Title>
          </Card>
        </Grid.Col>
      </Grid>

      <Space h="lg" />

      {/* Per-class metrics */}
      <Grid gutter="md">
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Card withBorder>
            <Title order={4}>Per-Class Metrics</Title>
            <Space h="sm" />
            <Table striped withTableBorder withColumnBorders highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Class</Table.Th>
                  <Table.Th>Precision</Table.Th>
                  <Table.Th>Recall</Table.Th>
                  <Table.Th>F1</Table.Th>
                  <Table.Th>Support</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {(per_class ?? []).map((r) => (
                  <Table.Tr key={r.label}>
                    <Table.Td>{r.label}</Table.Td>
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
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Card withBorder>
            <Title order={4}>Confusion Matrix</Title>
            <Text size="sm" c="dimmed">
              Rows = True, Columns = Predicted
            </Text>
            <Space h="sm" />
            <Table withTableBorder withColumnBorders>
              <Table.Tbody>
                {(confusion_matrix ?? []).map((row, i) => (
                  <Table.Tr key={i}>
                    {row.map((v, j) => (
                      <Table.Td
                        key={`${i}-${j}`}
                        style={{ textAlign: "center", fontWeight: 600 }}
                      >
                        {v}
                      </Table.Td>
                    ))}
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Card>
        </Grid.Col>
      </Grid>

      <Space h="lg" />

      {/* Candidate class focus */}
      <Card withBorder>
        <Title order={4}>Candidate Class Focus</Title>
        <Text size="sm" c="dimmed">
          Precision / Recall / F1 for CANDIDATE sınıfı (eşik tuning etkisini hızlı görmek için).
        </Text>
        <Space h="sm" />
        <Grid>
          <Grid.Col span={{ base: 12, sm: 4 }}>
            <MetricPill label="CAND Precision" value={fmt(metrics.cand_prec)} />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 4 }}>
            <MetricPill label="CAND Recall" value={fmt(metrics.cand_rec)} />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 4 }}>
            <MetricPill label="CAND F1" value={fmt(metrics.cand_f1)} />
          </Grid.Col>
        </Grid>
      </Card>
    </>
  );
}

// === Yardımcı küçük bileşenler ===
function fmt(n?: number) {
  return typeof n === "number" ? n.toFixed(2) : "—";
}

function MetricPill({ label, value }: { label: string; value: string }) {
  return (
    <Card withBorder>
      <Text fw={600}>{label}</Text>
      <Title order={3}>{value}</Title>
    </Card>
  );
}
