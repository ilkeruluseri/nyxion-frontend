import {
    Table,
    Title,
    Text,
    Badge,
    ScrollArea,
    Container,
    Button,
  } from "@mantine/core";
  
  interface PredictionResult {
    koi_period: number | string;
    koi_duration: number | string;
    koi_depth: number | string;
    koi_prad: number | string;
    koi_steff: number | string;
    koi_slogg: number | string;
    koi_srad: number | string;
    koi_smass: number | string;
    koi_impact: number | string;
    koi_kepmag: number | string;
    koi_fpflag_nt: number | string;
    koi_fpflag_ss: number | string;
    koi_fpflag_co: number | string;
    koi_fpflag_ec: number | string;
    prediction: string;
    confidence: number | string;
  }
  
  
  interface ResultsTableProps {
    results: PredictionResult[];
    onViewVisualization: () => void;
    modelId?: string;
  }
  
  export default function ResultsTable({ results, onViewVisualization }: ResultsTableProps) {
    if (!results || results.length === 0) {
      return null;
    }
  
    const getConfidenceColor = (confidence: number | string) => {
      const conf = typeof confidence === 'string' ? parseFloat(confidence) : confidence;
      if (conf >= 0.7) return "green";
      if (conf >= 0.5) return "yellow";
      return "red";
    };
  
    const getPredictionLabel = (prediction: string) => {
      const labels: Record<string, string> = {
        "0": "False Positive",
        "1": "Planet Candidate",
        "2": "Confirmed Planet",
      };
      return labels[prediction] || prediction;
    };
  
    return (
      <Container
        style={{
          width: "100%",
          maxWidth: "100%",
          padding: "2rem",
        }}
      >
        <Title order={2} mb="md" style={{ color: "white" }}>
          Prediction Results
        </Title>
        <Text mb="lg" style={{ color: "white" }}>
          The model has analyzed {results.length} candidate{results.length > 1 ? "s" : ""}.
        </Text>
  
        <ScrollArea
          style={{
            maxHeight: 500,
            background: "rgba(0, 0, 0, 0.7)",
            borderRadius: 8,
            padding: "1rem",
          }}
          offsetScrollbars
        >
          <Table
            striped
            highlightOnHover
            withColumnBorders
            withRowBorders
            style={{ minWidth: 1000 }}
          >
            <Table.Thead>
              <Table.Tr>
              <Table.Th style={{ color: "white" }}>koi_period</Table.Th>
              <Table.Th style={{ color: "white" }}>koi_duration</Table.Th>
              <Table.Th style={{ color: "white" }}>koi_depth</Table.Th>
              <Table.Th style={{ color: "white" }}>koi_prad</Table.Th>
              <Table.Th style={{ color: "white" }}>koi_steff</Table.Th>
              <Table.Th style={{ color: "white" }}>koi_slogg</Table.Th>
              <Table.Th style={{ color: "white" }}>koi_srad</Table.Th>
              <Table.Th style={{ color: "white" }}>koi_smass</Table.Th>
              <Table.Th style={{ color: "white" }}>koi_impact</Table.Th>
              <Table.Th style={{ color: "white" }}>koi_kepmag</Table.Th>
              <Table.Th style={{ color: "white" }}>Prediction</Table.Th>
              <Table.Th style={{ color: "white" }}>Confidence</Table.Th>
              <Table.Th style={{ color: "white" }}>Action</Table.Th>

              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {results.map((row, idx) => {
                try {
                  // Güvenli sayı dönüştürücü
                  const toNum = (v: number | string) =>
                    typeof v === "string" ? parseFloat(v) : Number(v);
                
                  // --- Koi alanları (hepsi yeni şemaya göre) ---
                  const period  = toNum(row.koi_period);
                  const duration = toNum(row.koi_duration);
                  const depth   = toNum(row.koi_depth);
                  const prad    = toNum(row.koi_prad);
                  const teff    = toNum(row.koi_steff);
                  const slogg   = toNum(row.koi_slogg);
                  const srad    = toNum(row.koi_srad);
                  const smass   = toNum(row.koi_smass);
                  const impact  = toNum(row.koi_impact);
                  const kepmag  = toNum(row.koi_kepmag);
                  const fp_nt   = toNum(row.koi_fpflag_nt);
                  const fp_ss   = toNum(row.koi_fpflag_ss);
                  const fp_co   = toNum(row.koi_fpflag_co);
                  const fp_ec   = toNum(row.koi_fpflag_ec);
                
                  const conf    = toNum(row.confidence);
                  const predCode = String(row.prediction); // "0" | "1" | "2" vb.
                
                  return (
                    <Table.Tr key={idx}>
                      {/* Sıra: başlıklarla birebir aynı */}
                      <Table.Td style={{ color: "white" }}>
                        {Number.isNaN(period) ? row.koi_period : period.toFixed(3)}
                      </Table.Td>
                      <Table.Td style={{ color: "white" }}>
                        {Number.isNaN(duration) ? row.koi_duration : duration.toFixed(4)}
                      </Table.Td>
                      <Table.Td style={{ color: "white" }}>
                        {Number.isNaN(depth) ? row.koi_depth : depth.toFixed(2)}
                      </Table.Td>
                      <Table.Td style={{ color: "white" }}>
                        {Number.isNaN(prad) ? row.koi_prad : prad.toFixed(2)}
                      </Table.Td>
                      <Table.Td style={{ color: "white" }}>
                        {Number.isNaN(teff) ? row.koi_steff : teff.toFixed(0)}
                      </Table.Td>
                      <Table.Td style={{ color: "white" }}>
                        {Number.isNaN(slogg) ? row.koi_slogg : slogg.toFixed(3)}
                      </Table.Td>
                      <Table.Td style={{ color: "white" }}>
                        {Number.isNaN(srad) ? row.koi_srad : srad.toFixed(3)}
                      </Table.Td>
                      <Table.Td style={{ color: "white" }}>
                        {Number.isNaN(smass) ? row.koi_smass : smass.toFixed(2)}
                      </Table.Td>
                      <Table.Td style={{ color: "white" }}>
                        {Number.isNaN(impact) ? row.koi_impact : impact.toFixed(3)}
                      </Table.Td>
                      <Table.Td style={{ color: "white" }}>
                        {Number.isNaN(kepmag) ? row.koi_kepmag : kepmag.toFixed(3)}
                        </Table.Td>
                      {/* Prediction */}
                      <Table.Td>
                        <Badge color={predCode === "2" ? "green" : predCode === "1" ? "blue" : "red"}>
                          {getPredictionLabel(predCode)}
                        </Badge>
                      </Table.Td>
                
                      {/* Confidence */}
                      <Table.Td style={{ color: "white" }}>
                        {Number.isNaN(conf) ? row.confidence : conf.toFixed(3)}
                      </Table.Td>
                
                      {/* Action (mevcut buton/menünü burada koru) */}
                      <Table.Td>
                    {(row.prediction === "1" || row.prediction === "2") ? (
                        <Button 
                        size="xs" 
                        variant="light" 
                        color="cyan"
                        onClick={onViewVisualization}
                        >
                        View in 3D
                        </Button>
                    ) : (
                        <Text size="xs" style={{ color: "#999", fontStyle: "italic" }}>
                        Not an exoplanet
                        </Text>
                    )}
                    </Table.Td>
                    </Table.Tr>
                  );
                } catch (e) {
                  console.error("Row render error:", e, row);
                  return null;
                }
                
              })}
            </Table.Tbody>
          </Table>
        </ScrollArea>
      </Container>
    );
  }