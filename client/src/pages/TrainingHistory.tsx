import React, { useEffect, useState } from "react";
import { Link } from "wouter";

type Trainee = { id: string; name: string; roleId?: string | null };
type Role = { id: string; name: string };
type Session = {
  id: string;
  traineeId: string;
  trainerName: string;
  sessionDate: string;
  competencyAttested: boolean;
  signedAt?: string | null;
};

export default function TrainingHistory() {
  const [trainees, setTrainees] = useState<Trainee[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedTrainee, setSelectedTrainee] = useState<string>("");

  async function loadData() {
    const [traineeData, roleData, sessionData] = await Promise.all([
      fetch("/api/trainees").then(r => r.json()),
      fetch("/api/library/roles").then(r => r.json()),
      fetch("/api/training/sessions").then(r => r.ok ? r.json() : [])
    ]);
    setTrainees(traineeData);
    setRoles(roleData);
    setSessions(sessionData);
  }

  useEffect(() => { loadData(); }, []);

  const getRole = (id: string) => roles.find(r => r.id === id)?.name || "";

  const filteredSessions = selectedTrainee
    ? sessions.filter(s => s.traineeId === selectedTrainee)
    : sessions;

  const traineeStats = trainees.map(t => {
    const traineeSessions = sessions.filter(s => s.traineeId === t.id);
    const completedCount = traineeSessions.filter(s => s.competencyAttested).length;
    return {
      ...t,
      totalSessions: traineeSessions.length,
      completedSessions: completedCount,
      lastSession: traineeSessions.length > 0
        ? new Date(traineeSessions[traineeSessions.length - 1].sessionDate).toLocaleDateString()
        : "Never"
    };
  });

  return (
    <div style={{ fontFamily: "sans-serif", padding: 20, maxWidth: 1000, margin: "0 auto" }}>
      <h1>Training History Dashboard</h1>
      <p><Link href="/">Home</Link> | <Link href="/trainer">Trainer Dashboard</Link> | <Link href="/library">Library</Link></p>

      <h2>Trainee Progress Overview</h2>
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 32 }}>
        <thead>
          <tr style={{ background: "#f0f0f0" }}>
            <th style={{ border: "1px solid #ddd", padding: 12, textAlign: "left" }}>Trainee</th>
            <th style={{ border: "1px solid #ddd", padding: 12, textAlign: "left" }}>Role</th>
            <th style={{ border: "1px solid #ddd", padding: 12, textAlign: "center" }}>Total Sessions</th>
            <th style={{ border: "1px solid #ddd", padding: 12, textAlign: "center" }}>Attested</th>
            <th style={{ border: "1px solid #ddd", padding: 12, textAlign: "left" }}>Last Training</th>
          </tr>
        </thead>
        <tbody>
          {traineeStats.map(t => (
            <tr key={t.id} style={{ cursor: "pointer" }} onClick={() => setSelectedTrainee(t.id)}>
              <td style={{ border: "1px solid #ddd", padding: 12 }}><b>{t.name}</b></td>
              <td style={{ border: "1px solid #ddd", padding: 12 }}>{t.roleId ? getRole(t.roleId) : "—"}</td>
              <td style={{ border: "1px solid #ddd", padding: 12, textAlign: "center" }}>{t.totalSessions}</td>
              <td style={{ border: "1px solid #ddd", padding: 12, textAlign: "center" }}>
                <span style={{ 
                  background: t.completedSessions > 0 ? "#d4edda" : "#f8d7da", 
                  padding: "4px 8px", 
                  borderRadius: 4 
                }}>
                  {t.completedSessions}
                </span>
              </td>
              <td style={{ border: "1px solid #ddd", padding: 12 }}>{t.lastSession}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>Session History</h2>
        <select 
          value={selectedTrainee} 
          onChange={e => setSelectedTrainee(e.target.value)}
          style={{ padding: 8 }}
        >
          <option value="">All trainees</option>
          {trainees.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>

      {filteredSessions.length === 0 ? (
        <p style={{ opacity: 0.7 }}>No training sessions found.</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f0f0f0" }}>
              <th style={{ border: "1px solid #ddd", padding: 12, textAlign: "left" }}>Date</th>
              <th style={{ border: "1px solid #ddd", padding: 12, textAlign: "left" }}>Trainee</th>
              <th style={{ border: "1px solid #ddd", padding: 12, textAlign: "left" }}>Trainer</th>
              <th style={{ border: "1px solid #ddd", padding: 12, textAlign: "center" }}>Attested</th>
              <th style={{ border: "1px solid #ddd", padding: 12, textAlign: "center" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredSessions.map(s => {
              const trainee = trainees.find(t => t.id === s.traineeId);
              return (
                <tr key={s.id}>
                  <td style={{ border: "1px solid #ddd", padding: 12 }}>
                    {new Date(s.sessionDate).toLocaleDateString()}
                  </td>
                  <td style={{ border: "1px solid #ddd", padding: 12 }}>{trainee?.name || "—"}</td>
                  <td style={{ border: "1px solid #ddd", padding: 12 }}>{s.trainerName}</td>
                  <td style={{ border: "1px solid #ddd", padding: 12, textAlign: "center" }}>
                    {s.competencyAttested ? (
                      <span style={{ color: "green" }}>Yes</span>
                    ) : (
                      <span style={{ color: "red" }}>No</span>
                    )}
                  </td>
                  <td style={{ border: "1px solid #ddd", padding: 12, textAlign: "center" }}>
                    <Link href={`/print/${s.id}`}>View</Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
