import React, { useEffect, useState } from "react";

type Role = { id: string; name: string; description?: string | null };

export default function App() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [name, setName] = useState("");

  async function load() {
    const r = await fetch("/api/library/roles");
    setRoles(await r.json());
  }

  async function createRole() {
    await fetch("/api/library/roles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name })
    });
    setName("");
    await load();
  }

  useEffect(() => { load(); }, []);

  return (
    <div style={{ fontFamily: "sans-serif", padding: 20 }}>
      <h1>Train-the-Trainer Builder (MVP)</h1>

      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="New role name" />
        <button onClick={createRole}>Add Role</button>
        <button onClick={load}>Refresh</button>
      </div>

      <ul style={{ marginTop: 16 }}>
        {roles.map((r) => (
          <li key={r.id}>
            <b>{r.name}</b> {r.description ? `- ${r.description}` : ""}
          </li>
        ))}
      </ul>
    </div>
  );
}
