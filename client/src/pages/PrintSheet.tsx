import React, { useEffect, useState } from "react";

type SessionResp = { session: any; trainee: any; blocks: any[] };

export default function PrintSheet({ sessionId }: { sessionId: string }) {
  const [data, setData] = useState<SessionResp | null>(null);

  useEffect(() => {
    fetch(`/api/training/sessions/${sessionId}`)
      .then(r => r.json())
      .then(setData);
  }, [sessionId]);

  if (!data) return <p>Loading...</p>;

  const { session, trainee, blocks } = data;

  return (
    <div style={{ fontFamily: "Arial, sans-serif", padding: 20, maxWidth: 800, margin: "0 auto" }}>
      <style>{`
        @media print {
          button { display: none !important; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
        table { width: 100%; border-collapse: collapse; margin-top: 16px; }
        th, td { border: 1px solid #333; padding: 8px; text-align: left; }
        th { background: #f0f0f0; }
      `}</style>

      <button onClick={() => window.print()} style={{ marginBottom: 16 }}>Print This Page</button>

      <h1 style={{ textAlign: "center" }}>Daily Training Sheet</h1>

      <table>
        <tbody>
          <tr>
            <th>Trainee</th>
            <td>{trainee?.name || "—"}</td>
            <th>Date</th>
            <td>{new Date(session.sessionDate).toLocaleDateString()}</td>
          </tr>
          <tr>
            <th>Trainer</th>
            <td colSpan={3}>{session.trainerName}</td>
          </tr>
        </tbody>
      </table>

      <h2 style={{ marginTop: 24 }}>Tasks (4-Step Method)</h2>

      <table>
        <thead>
          <tr>
            <th>Task</th>
            <th>WI Code</th>
            <th>Step 1</th>
            <th>Step 2</th>
            <th>Step 3</th>
            <th>Step 4</th>
          </tr>
        </thead>
        <tbody>
          {blocks.map(b => (
            <tr key={b.id}>
              <td>{b.taskName}</td>
              <td>{b.wiCode || "—"}</td>
              <td style={{ textAlign: "center" }}>{b.step1 ? "✓" : "☐"}</td>
              <td style={{ textAlign: "center" }}>{b.step2 ? "✓" : "☐"}</td>
              <td style={{ textAlign: "center" }}>{b.step3 ? "✓" : "☐"}</td>
              <td style={{ textAlign: "center" }}>{b.step4 ? "✓" : "☐"}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 style={{ marginTop: 24 }}>SOA Coaching Notes</h2>

      {blocks.map(b => (
        <div key={b.id} style={{ marginBottom: 16, padding: 12, border: "1px solid #ccc" }}>
          <strong>{b.taskName}</strong>
          <table style={{ marginTop: 8 }}>
            <tbody>
              <tr>
                <th style={{ width: 120 }}>Strength</th>
                <td>{b.strength || "—"}</td>
              </tr>
              <tr>
                <th>Opportunity</th>
                <td>{b.opportunity || "—"}</td>
              </tr>
              <tr>
                <th>Action</th>
                <td>{b.action || "—"}</td>
              </tr>
            </tbody>
          </table>

          {b.criticalPoints?.length > 0 && (
            <div style={{ marginTop: 8, background: "#fff3cd", padding: 8 }}>
              <strong>Critical Points:</strong>
              <ul style={{ margin: "4px 0 0 16px" }}>
                {b.criticalPoints.map((cp: any) => (
                  <li key={cp.id}>{cp.label} ({cp.severity}): {cp.detail}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ))}

      <div style={{ marginTop: 40, borderTop: "1px solid #333", paddingTop: 16 }}>
        <table>
          <tbody>
            <tr>
              <th style={{ width: "50%" }}>Trainee Signature</th>
              <th style={{ width: "50%" }}>Trainer Signature</th>
            </tr>
            <tr>
              <td style={{ height: 60 }}></td>
              <td style={{ height: 60 }}></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
