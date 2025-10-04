import { useRef, useState, useEffect } from "react";
import { Button, Container, Title, Text } from "@mantine/core";
import BackgroundCanvas from "./components/BackgroundCanvas";
import DataEntry from "./components/DataEntry";

function App() {
  const vizRef = useRef<HTMLDivElement>(null);
  const [controlsEnabled, setControlsEnabled] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      if (!vizRef.current) return;
      const rect = vizRef.current.getBoundingClientRect();
      const inView = rect.top < window.innerHeight && rect.bottom > 0; // TO DO: adjust threshold as needed
      setControlsEnabled(inView);
      // helpful debug: shows when controls should be on
      console.log("Controls enabled:", inView);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    // call once to set initial state
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToVisualization = () => {
    vizRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      {/* Canvas fixed behind UI — use zIndex 0 (not -1) so it can receive events 
      
      <BackgroundCanvas controlsEnabled={controlsEnabled} /> */}
      

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
          <Title order={1}>
            Welcome
          </Title>
          <DataEntry />
          <Button onClick={scrollToVisualization}>Go to Visualization</Button>
        </Container>

        {/* Viz section: we allow pointer events to pass through by default,
            but keep an inner box which is still clickable (pointerEvents:auto) */}
        <div
          ref={vizRef}
          style={{
            height: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            // IMPORTANT: allow pointer events to fall through to canvas
            pointerEvents: "none",
            // optional visual
            // background: "rgba(255, 0, 0, 0.05)",
          }}
        >
          <div
            style={{
              // this inner box will be clickable; everything else in this section is not
              pointerEvents: "auto",
              background: "rgba(0,0,0,0.5)",
              padding: 20,
              borderRadius: 8,
            }}
          >
            <Title order={2} style={{ color: "white" }}>
              Now you’re in the interactive visualization
            </Title>
            <Text style={{ color: "white" }}>Drag on empty areas to rotate the scene.</Text>
          </div>
        </div>

        {/* extra content so page can scroll */}
        <div style={{ height: "150vh", background: "transparent" }} />
      </div>
    </>
  );
}

export default App;
