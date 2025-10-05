import { useEffect, useMemo, useState } from "react";
import { Group, Select, Button } from "@mantine/core";

type ModelMeta = { model_id: string; model_name: string; version: string; trained_at: string };

async function listModels() {
  const r = await fetch("/api/models");
  if (!r.ok) throw new Error(await r.text());
  return (await r.json()).models as ModelMeta[];
}
async function selectModel(modelId: string) {
  const r = await fetch("/api/models/select", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model_id: modelId }),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export default function ModelSelect({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (v: string) => void;
}) {
  const [models, setModels] = useState<ModelMeta[]>([]);
  const [loading, setLoading] = useState(false);

  const reload = async (autoPick = false) => {
    setLoading(true);
    try {
      const m = await listModels();
      setModels(m);
      if (autoPick && m[0]) {
        onChange(m[0].model_id);
        try { await selectModel(m[0].model_id); } catch {}
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { reload(true); }, []);

  const options = useMemo(
    () => models.map(m => ({ value: m.model_id, label: `${m.model_name} • ${m.version}` })),
    [models]
  );

  const handleChange = async (v: string | null) => {
    if (!v) return;
    onChange(v);
    try { await selectModel(v); } catch (e) { console.error(e); }
  };

  return (
    <Group>
      <Select
        data={options}
        value={value}
        onChange={handleChange}
        placeholder={loading ? "Loading models..." : "Select model"}
        label="Model"
        searchable
        disabled={loading || options.length === 0}
        w={340}
      />
      <Button variant="light" onClick={() => reload(false)}>Refresh</Button>
    </Group>
  );
}
