import { useRef, useState, useEffect } from "react";
import { Button, Container, Title, Text } from "@mantine/core";
import BackgroundCanvas from "./components/BackgroundCanvas";
import DataEntry from "./components/DataEntry";
import ResultsTable from "./components/ResultTable";

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

function App() {
  const vizRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const [controlsEnabled, setControlsEnabled] = useState(false);
  const [predictionResults, setPredictionResults] = useState<PredictionResult[]>([]);

  useEffect(() => {
    const onScroll = () => {
      if (!vizRef.current) return;
      const rect = vizRef.current.getBoundingClientRect();
      const inView = rect.top < window.innerHeight && rect.bottom > 0;
      setControlsEnabled(inView);
      console.log("Controls enabled:", inView);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToVisualization = () => {
    vizRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToResults = () => {
    resultsRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handlePredictionComplete = (results: PredictionResult[]) => {
    console.log("Received results in App:", results);
    console.log("Results length:", results.length);
    setPredictionResults(results);
    // Auto-scroll to results after a short delay
    setTimeout(() => {
      scrollToResults();
    }, 600);
  };

  return (
    <>
      {/* Canvas fixed behind UI — use zIndex 0 (not -1) so it can receive events */}
      <BackgroundCanvas controlsEnabled={controlsEnabled} />

      {/* Foreground UI above canvas */}
      <div style={{ position: "relative", zIndex: 10 }}>
        <Container
          style={{
            height: "100vh",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <Title order={1}>Welcome</Title>
          <DataEntry onPredictionComplete={handlePredictionComplete} />
          <Button onClick={scrollToVisualization}>Go to Visualization</Button>
        </Container>
        {/* Results section */}
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
                    }}
                  >
                    <ResultsTable results={predictionResults} />
                  </div>
                )}
        {/* Viz section */}
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
            }}
          >
            <Title order={2} style={{ color: "white" }}>
              Now you're in the interactive visualization
            </Title>
            <Text style={{ color: "white" }}>
              Drag on empty areas to rotate the scene.
            </Text>
          </div>
        </div>

       

        {/* extra content so page can scroll */}
        <div style={{ height: "50vh", background: "transparent" }} />
      </div>
    </>
  );
}

export default App;