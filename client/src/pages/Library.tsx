import React, { useEffect, useState } from "react";
import { Link } from "wouter";

type Role = { id: string; name: string; description?: string | null };
type Trainee = { id: string; name: string; roleId?: string | null };

export default function Library() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [trainees, setTrainees] = useState<Trainee[]>([]);
  const [roleName, setRoleName] = useState("");
  const [traineeName, setTraineeName] = useState("");
  const [traineeRole, setTraineeRole] = useState("");

  async function loadRoles() {
    const r = await fetch("/api/library/roles");
    setRoles(await r.json());
  }

  async function loadTrainees() {
    const r = await fetch("/api/trainees");
    if (r.ok) setTrainees(await r.json());
  }

  async function createRole() {
    await fetch("/api/library/roles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: roleName })
    });
    setRoleName("");
    loadRoles();
  }

  async function createTrainee() {
    await fetch("/api/trainees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: traineeName, roleId: traineeRole || null })
    });
    setTraineeName("");
    setTraineeRole("");
    loadTrainees();
  }

  async function deleteRole(id: string) {
    await fetch(`/api/library/roles/${id}`, { method: "DELETE" });
    loadRoles();
  }

  useEffect(() => {
    loadRoles();
    loadTrainees();
  }, []);

  return (
    <div style={{ fontFamily: "sans-serif", padding: 20 }}>
      <h1>Library Management</h1>
      <p><Link href="/trainer">Back to Trainer Dashboard</Link></p>

      <div style={{ display: "flex", gap: 40, marginTop: 20 }}>
        <div style={{ flex: 1 }}>
          <h2>Roles</h2>
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <input
              value={roleName}
              onChange={e => setRoleName(e.target.value)}
              placeholder="New role name"
            />
            <button onClick={createRole}>Add Role</button>
          </div>
          <ul>
            {roles.map(r => (
              <li key={r.id}>
                {r.name}
                <button onClick={() => deleteRole(r.id)} style={{ marginLeft: 8 }}>Delete</button>
              </li>
            ))}
          </ul>
        </div>

        <div style={{ flex: 1 }}>
          <h2>Trainees</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
            <input
              value={traineeName}
              onChange={e => setTraineeName(e.target.value)}
              placeholder="Trainee name"
            />
            <select value={traineeRole} onChange={e => setTraineeRole(e.target.value)}>
              <option value="">No role assigned</option>
              {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
            <button onClick={createTrainee}>Add Trainee</button>
          </div>
          <ul>
            {trainees.map(t => (
              <li key={t.id}>
                {t.name} {t.roleId && roles.find(r => r.id === t.roleId) && `(${roles.find(r => r.id === t.roleId)!.name})`}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
