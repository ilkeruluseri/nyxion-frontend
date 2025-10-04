import {
    Table,
    Title,
    Text,
    Badge,
    ScrollArea,
    Container,
  } from "@mantine/core";
  
  interface PredictionResult {
    period_days: number | string;
    duration_days: number | string;
    depth: number | string;
    prad_re: number | string;
    steff_K: number | string;
    srad_Rsun: number | string;
    smass_MSun: number | string;
    mission?: string;
    prediction: string;
    confidence: number | string;
  }
  
  interface ResultsTableProps {
    results: PredictionResult[];
  }
  
  export default function ResultsTable({ results }: ResultsTableProps) {
    if (!results || results.length === 0) {
      return null;
    }
  
    const getConfidenceColor = (confidence: number | string) => {
      const conf = typeof confidence === 'string' ? parseFloat(confidence) : confidence;
      if (conf >= 0.5) return "green";
      if (conf >= 0.3) return "yellow";
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
            style={{ minWidth: 900 }}
          >
            <Table.Thead>
              <Table.Tr>
                <Table.Th style={{ color: "white" }}>Period (days)</Table.Th>
                <Table.Th style={{ color: "white" }}>Duration (days)</Table.Th>
                <Table.Th style={{ color: "white" }}>Depth</Table.Th>
                <Table.Th style={{ color: "white" }}>Prad (Re)</Table.Th>
                <Table.Th style={{ color: "white" }}>Teff (K)</Table.Th>
                <Table.Th style={{ color: "white" }}>Srad (Rsun)</Table.Th>
                <Table.Th style={{ color: "white" }}>Smass (MSun)</Table.Th>
                <Table.Th style={{ color: "white" }}>Prediction</Table.Th>
                <Table.Th style={{ color: "white" }}>Confidence</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {results.map((row, idx) => {
                try {
                  const period = typeof row.period_days === 'string' ? parseFloat(row.period_days) : Number(row.period_days);
                  const duration = typeof row.duration_days === 'string' ? parseFloat(row.duration_days) : Number(row.duration_days);
                  const depth = typeof row.depth === 'string' ? parseFloat(row.depth) : Number(row.depth);
                  const prad = typeof row.prad_re === 'string' ? parseFloat(row.prad_re) : Number(row.prad_re);
                  const teff = typeof row.steff_K === 'string' ? parseFloat(row.steff_K) : Number(row.steff_K);
                  const srad = typeof row.srad_Rsun === 'string' ? parseFloat(row.srad_Rsun) : Number(row.srad_Rsun);
                  const smass = typeof row.smass_MSun === 'string' ? parseFloat(row.smass_MSun) : Number(row.smass_MSun);
                  const conf = typeof row.confidence === 'string' ? parseFloat(row.confidence) : Number(row.confidence);
  
                  return (
                    <Table.Tr key={idx}>
                      <Table.Td style={{ color: "white" }}>
                        {isNaN(period) ? row.period_days : period.toFixed(3)}
                      </Table.Td>
                      <Table.Td style={{ color: "white" }}>
                        {isNaN(duration) ? row.duration_days : duration.toFixed(4)}
                      </Table.Td>
                      <Table.Td style={{ color: "white" }}>
                        {isNaN(depth) ? row.depth : depth.toFixed(2)}
                      </Table.Td>
                      <Table.Td style={{ color: "white" }}>
                        {isNaN(prad) ? row.prad_re : prad.toFixed(2)}
                      </Table.Td>
                      <Table.Td style={{ color: "white" }}>
                        {isNaN(teff) ? row.steff_K : teff.toFixed(0)}
                      </Table.Td>
                      <Table.Td style={{ color: "white" }}>
                        {isNaN(srad) ? row.srad_Rsun : srad.toFixed(3)}
                      </Table.Td>
                      <Table.Td style={{ color: "white" }}>
                        {isNaN(smass) ? row.smass_MSun : smass.toFixed(2)}
                      </Table.Td>
                      <Table.Td>
                        <Badge color={row.prediction === "2" ? "green" : row.prediction === "1" ? "blue" : "red"}>
                          {getPredictionLabel(row.prediction)}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Badge color={getConfidenceColor(conf)}>
                          {isNaN(conf) ? row.confidence : (conf * 100).toFixed(1) + '%'}
                        </Badge>
                      </Table.Td>
                    </Table.Tr>
                  );
                } catch (error) {
                  console.error("Error rendering row:", row, error);
                  return null;
                }
              })}
            </Table.Tbody>
          </Table>
        </ScrollArea>
      </Container>
    );
  }