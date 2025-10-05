import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Card,
  Code,
  Collapse,
  FileInput,
  Grid,
  Group,
  NumberInput,
  Progress,
  SimpleGrid,
  Space,
  Stack,
  Text,
  Textarea,
  Title,
  Tooltip,
} from "@mantine/core";

type TrainStage = "idle" | "uploading" | "queued" | "running" | "completed" | "failed";

interface TrainStartResponse {
  job_id: string;
}

interface TrainStatus {
  job_id: string;
  status: TrainStage;
  progress: number; // 0..100
  logs?: string[];
  metrics?: {
    accuracy?: number;
    macro_f1?: number;
    weighted_f1?: number;
    cand_f1?: number;
    cand_prec?: number;
    cand_rec?: number;
  };
  model_id?: string; // e.g., "models/xgb_finetuned.json"
  error?: string;
}

export default function Train({
  selectedModel,
  onSwitchToStats,
  onModelSelected,
}: {
  selectedModel: string;                  // base model to warm-start from (required)
  onSwitchToStats: () => void;
  onModelSelected: (modelId: string) => void;
}) {
  // === Dataset (upload-only) ===
  const [datasetFile, setDatasetFile] = useState<File | null>(null);

  // === Hyperparameters (safe tweakables for warm-start) ===
  // Algorithm fixed to XGBoost; warm_start always ON.
  const [learningRate, setLearningRate] = useState<number | string>(0.1);
  const [nEstimators, setNEstimators]   = useState<number | string>(200);  // extra trees to add
  const [thr1, setThr1]                 = useState<number | string>(0.3);  // pipeline threshold for candidate stage

  // Advanced (optional)
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [subsample, setSubsample]       = useState<number | string>(0.8);
  const [colsample, setColsample]       = useState<number | string>(0.8);

  // === Job state ===
  const [jobId, setJobId] = useState<string | null>(null);
  const [stage, setStage] = useState<TrainStage>("idle");
  const [progress, setProgress] = useState<number>(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<TrainStatus["metrics"] | null>(null);
  const [producedModelId, setProducedModelId] = useState<string | null>(null);

  const pollRef = useRef<number | null>(null);

  // Warm-start is effective only if a base model is selected (algo fixed to XGBoost).
  const isWarmXgb = Boolean(selectedModel);

  const hparams = useMemo(
    () => ({
      // safe tweaks for warm-start
      learning_rate:     learningRate === "" ? undefined : Number(learningRate),
      n_estimators:      nEstimators  === "" ? undefined : Number(nEstimators), // extra rounds
      // advanced (optional)
      subsample:         subsample    === "" ? undefined : Number(subsample),
      colsample_bytree:  colsample    === "" ? undefined : Number(colsample),
      // pipeline-specific threshold (applied outside model training)
      thr1:              thr1         === "" ? undefined : Number(thr1),
    }),
    [learningRate, nEstimators, subsample, colsample, thr1]
  );

  function payloadPreview() {
    return JSON.stringify(
      {
        algo: "xgboost",           // fixed
        model_id: selectedModel,
        warm_start: true,
        base_model_id: selectedModel,
        hparams,
      },
      null,
      2
    );
  }

  async function startTraining() {
    if (!selectedModel) {
      setError("Select a base model first on the Stats screen to warm-start from.");
      return;
    }
    if (!datasetFile) {
      setError("Please upload a CSV file first.");
      return;
    }

    setError(null);
    setStage("uploading");
    setProgress(0);
    setLogs([]);
    setMetrics(null);
    setProducedModelId(null);

    const form = new FormData();
    form.append("algo", "xgboost");               // fixed
    form.append("model_id", selectedModel);       // current selection
    form.append("warm_start", "true");            // always on
    form.append("base_model_id", selectedModel);  // base booster
    form.append("dataset_file", datasetFile);     // CSV contents
    form.append("hparams", JSON.stringify(hparams));

    try {
      const resp = await fetch("/api/train", { method: "POST", body: form });
      if (!resp.ok) {
        const t = await safeText(resp);
        setStage("failed");
        setError(`Start failed: ${resp.status} ${t}`);
        return;
      }
      const j: TrainStartResponse = await resp.json();
      setJobId(j.job_id);
      setStage("queued");
      beginPolling(j.job_id);
    } catch (e: any) {
      setStage("failed");
      setError(e?.message ?? "Network error");
    }
  }

  function beginPolling(id: string) {
    stopPolling();
    pollRef.current = window.setInterval(async () => {
      try {
        const r = await fetch(`/api/train/${id}`);
        const j: TrainStatus = await r.json();

        setStage(j.status);
        setProgress(j.progress ?? 0);
        setLogs((prev) => mergeLogs(prev, j.logs ?? []));
        if (j.metrics) setMetrics(j.metrics);
        if (j.model_id) setProducedModelId(j.model_id);

        if (j.status === "completed" || j.status === "failed") {
          stopPolling();
        }
      } catch (e: any) {
        stopPolling();
        setStage("failed");
        setError(e?.message ?? "Polling error");
      }
    }, 1500);
  }

  function stopPolling() {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }

  useEffect(() => stopPolling, []);

  return (
    <Stack gap="md">
      <Title order={3}>Train a Model</Title>
      <Text c="dimmed" size="sm">
        Upload a new dataset (CSV), tweak safe hyperparameters, and continue training from the currently selected pre-trained XGBoost model.
      </Text>

      {/* Dataset upload */}
      <Card withBorder>
        <Title order={4}>Upload Dataset</Title>
        <Space h="xs" />
        <FileInput
          label="CSV file"
          placeholder="Select a CSV file"
          accept=".csv,text/csv"
          value={datasetFile}
          onChange={setDatasetFile}
          clearable
        />
        {!selectedModel && (
          <Alert mt="sm" color="yellow" title="No base model selected">
            Go to <strong>Current Model Statistics</strong>, pick a pre-trained model, then return here to warm-start.
          </Alert>
        )}
      </Card>

      {/* Algorithm & Hyperparameters */}
      <Card withBorder>
        <Title order={4}>Algorithm & Hyperparameters</Title>
        <Space h="xs" />
        <Alert color="blue" title="Warm start (XGBoost)">
          Training will continue from the currently selected base model.{" "}
          <strong>Locked internally:</strong> objective/booster/max_depth.{" "}
          <strong>Safe to tweak:</strong> n_estimators (add trees), learning_rate (small changes), thr1.{" "}
          <em>Advanced (optional):</em> subsample, colsample_bytree.
        </Alert>
        <Space h="md" />

        {/* Clean row: no description text, aligned with SimpleGrid */}
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
          <Tooltip label="Recommended small changes (±0.05)" withArrow>
            <NumberInput
              size="sm"
              label="learning_rate"
              value={learningRate}
              onChange={setLearningRate}
              step={0.01}
              min={0.01}
              max={1}
              maw={400}
            />
          </Tooltip>

          <NumberInput
            size="sm"
            label="n_estimators"
            value={nEstimators}
            onChange={setNEstimators}
            step={50}
            min={50}
            max={5000}
            maw={400}
          />

          <NumberInput
            size="sm"
            label="thr1 (candidate threshold)"
            value={thr1}
            onChange={setThr1}
            step={0.05}
            min={0.05}
            max={0.95}
            maw={400}
          />
        </SimpleGrid>

        <Space h="sm" />
        <Group gap="sm">
          <Button size="xs" variant={showAdvanced ? "filled" : "light"} onClick={() => setShowAdvanced((s) => !s)}>
            {showAdvanced ? "Hide advanced" : "Show advanced"}
          </Button>
          <Text size="xs" c="dimmed">Optional controls for fine-grained tuning.</Text>
        </Group>

        <Collapse in={showAdvanced}>
          <Space h="sm" />
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
            <NumberInput
              size="sm"
              label="subsample (advanced)"
              value={subsample}
              onChange={setSubsample}
              step={0.05}
              min={0.1}
              max={1}
              maw={400}
            />
            <NumberInput
              size="sm"
              label="colsample_bytree (advanced)"
              value={colsample}
              onChange={setColsample}
              step={0.05}
              min={0.1}
              max={1}
              maw={400}
            />
          </SimpleGrid>
        </Collapse>

        <Space h="md" />
        <Text size="sm" fw={600}>Request preview</Text>
        <Code block>{payloadPreview()}</Code>
      </Card>

      {/* Actions */}
      <Group>
        <Button
          onClick={startTraining}
          disabled={!datasetFile || !selectedModel}
          loading={stage === "uploading"}
        >
          Start training
        </Button>

        {producedModelId && (
          <Group gap="xs">
            <Badge variant="light" size="lg">New model: {producedModelId}</Badge>
            <Button
              variant="default"
              onClick={() => {
                onModelSelected(producedModelId);
                onSwitchToStats();
              }}
            >
              View stats
            </Button>
          </Group>
        )}
      </Group>

      {/* Status / Logs */}
      <Card withBorder>
        <Group justify="space-between" align="center">
          <Title order={4}>Job status</Title>
          <Badge>{stage.toUpperCase()}</Badge>
        </Group>
        <Space h="xs" />
        <Progress value={progress} striped animated />
        <Space h="sm" />

        {metrics && (
          <Grid>
            <Grid.Col span={{ base: 12, sm: 4 }}>
              <Kpi label="Accuracy" value={metrics.accuracy} />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 4 }}>
              <Kpi label="Macro F1" value={metrics.macro_f1} />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 4 }}>
              <Kpi label="CAND F1" value={metrics.cand_f1} />
            </Grid.Col>
          </Grid>
        )}

        <Space h="sm" />
        <Textarea
          label="Logs"
          value={(logs ?? []).join("\n")}
          autosize
          minRows={8}
          readOnly
        />
      </Card>

      {error && (
        <Alert color="red" title="Training failed">
          {error}
        </Alert>
      )}
    </Stack>
  );
}

function Kpi({ label, value }: { label: string; value?: number }) {
  return (
    <Card withBorder>
      <Text fw={600}>{label}</Text>
      <Title order={3}>{typeof value === "number" ? value.toFixed(3) : "—"}</Title>
    </Card>
  );
}

async function safeText(r: Response) {
  try {
    return await r.text();
  } catch {
    return "";
  }
}

function mergeLogs(prev: string[], next: string[]) {
  if (!next?.length) return prev;
  const merged = [...prev, ...next];
  return Array.from(new Set(merged));
}
