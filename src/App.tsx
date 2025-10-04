import { useRef, useState, useEffect, useMemo } from "react";
import { Button, Container, Title, Text, SegmentedControl, Select, Group, Space } from "@mantine/core";
import BackgroundCanvas from "./components/BackgroundCanvas";
import DataEntry from "./components/DataEntry";
import ResultsTable from "./components/ResultTable";
import ModelStats from "./components/ModelStats";

interface PredictionResult {
  period_days: number;
  duration_days: number;
  depth: number;
  prad_re: number;
  steff_K: number;
  srad_Rsun: number;
  smass_MSun: number;
  prediction: string;
  confidence: number;
}

type AppMode = "predict" | "stats";

function App() {
  // --- Predict mode state/refs ---
  const vizRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const [controlsEnabled, setControlsEnabled] = useState(false);
  const [predictionResults, setPredictionResults] = useState<PredictionResult[]>([]);

  // --- Global UI: mode & model selection ---
  const [mode, setMode] = useState<AppMode>("predict");
  const [selectedModel, setSelectedModel] = useState<string>("cascade-v1");

  // Optional: merkez satır görünürlüğünü baz al (only in predict mode)
  useEffect(() => {
    if (mode !== "predict") return;
    const onScroll = () => {
      if (!vizRef.current) return;
      const rect = vizRef.current.getBoundingClientRect();
      const inView = rect.top < window.innerHeight * 0.5 && rect.bottom > window.innerHeight * 0.5;
      setControlsEnabled(inView);
      // console.log("Controls enabled:", inView);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [mode]);

  const scrollToVisualization = () => {
    vizRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToResults = () => {
    resultsRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handlePredictionComplete = (results: PredictionResult[]) => {
    setPredictionResults(results);
    setTimeout(() => {
      scrollToResults();
    }, 600);
  };
// --- Model listesi (UI) ---
const modelOptions = useMemo(
  () => [
    {
      value: "xgb_koi_star",
      label: "XGBoost (koi + star)",
    },
  ],
  []
);

  return (
    <>
      {/* Canvas arkada: sadece predict modunda etkileşim */}
      { <BackgroundCanvas controlsEnabled={controlsEnabled} />}

      {/* Foreground UI */}
      <div style={{ position: "relative", zIndex: 10, pointerEvents: "none" }}>
        <Container
          style={{
            minHeight: "20vh",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            pointerEvents: "auto",
          }}
        >
          {/* Header / Global Controls */}
          <Group justify="space-between" align="center" wrap="wrap" mt="md" mb="xs">
            <Title order={1}>Nyxion</Title>

            <Group>
              <Select
                data={modelOptions}
                value={selectedModel}
                onChange={(v) => v && setSelectedModel(v)}
                placeholder="Select model"
                label="Model"
                checkIconPosition="right"
                w={260}
              />
              <SegmentedControl
                value={mode}
                onChange={(v) => setMode(v as AppMode)}
                data={[
                  { label: "Predict", value: "predict" },
                  { label: "Train", value: "train" },
                  { label: "Model Stats", value: "stats" },
                ]}
              />
            </Group>
          </Group>

          {/* Subheading */}
          <Title order={3} style={{ opacity: 0.75 }}>
            {mode === "predict" ? "General Prediction" : "Current Model Statistics"}
          </Title>
        </Container>

        {/* === MODE: PREDICT === */}
        {mode === "predict" && (
          <>
            <Container
              style={{
                minHeight: "60vh",
                width: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                pointerEvents: "auto",
              }}
            >
              {/* Data Entry formu: seçili modele istersen prop geçebilirsin */}
              <DataEntry onPredictionComplete={handlePredictionComplete} modelId={selectedModel} />
            </Container>

            {/* Results */}
            {predictionResults.length > 0 && (
              <div
                ref={resultsRef}
                style={{
                  minHeight: "100vh",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  paddingTop: "2rem",
                  paddingBottom: "2rem",
                  pointerEvents: "auto",
                }}
              >
                <ResultsTable
                  results={predictionResults}
                  onViewVisualization={scrollToVisualization}
                  modelId={selectedModel}
                />
              </div>
            )}

            {/* Viz Section */}
            <div
              ref={vizRef}
              style={{
                height: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                pointerEvents: "none",
              }}
            >
              <div
                style={{
                  pointerEvents: "auto",
                  background: "rgba(0,0,0,0.5)",
                  padding: 20,
                  borderRadius: 8,
                  maxWidth: "520px",
                  margin: "0 auto",
                }}
              >
                <Title order={2} style={{ color: "white" }}>
                  Now you're in the interactive visualization
                </Title>
                <Text style={{ color: "white" }}>Drag on empty areas to rotate the scene.</Text>
                <Space h="md" />
                <Group>
                  <Button variant="outline" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
                    Back to top
                  </Button>
                  <Button variant="default" onClick={() => resultsRef.current?.scrollIntoView({ behavior: "smooth" })}>
                    Go to results
                  </Button>
                </Group>
              </div>
            </div>

            {/* ekstra boşluk */}
            <div style={{ height: "40vh", background: "transparent" }} />
          </>
        )}

        {/* === MODE: MODEL STATS === */}
        {mode === "stats" && (
          <div style={{ pointerEvents: "auto" }}>
            <Container size="lg" py="lg">
              <ModelStats modelId={selectedModel} />
            </Container>
          </div>
        )}
      </div>
    </>
  );
}

export default App;
