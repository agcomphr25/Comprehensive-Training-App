import React from "react";
import { Route, Switch, Link } from "wouter";
import TrainerToday from "./pages/TrainerToday";
import PrintSheet from "./pages/PrintSheet";
import TraineeQuiz from "./pages/TraineeQuiz";
import Library from "./pages/Library";

export default function App() {
  return (
    <div style={{ fontFamily: "sans-serif", padding: 20 }}>
      <Switch>
        <Route path="/">
          <div>
            <h1>Train-the-Trainer Builder (MVP)</h1>
            <nav style={{ display: "flex", gap: 16, marginTop: 16 }}>
              <Link href="/trainer">Trainer Dashboard</Link>
              <Link href="/library">Library Management</Link>
            </nav>
          </div>
        </Route>

        <Route path="/trainer">
          <TrainerToday />
        </Route>

        <Route path="/library">
          <Library />
        </Route>

        <Route path="/print/:sessionId">
          <PrintSheet />
        </Route>

        <Route path="/quiz/:sessionId">
          <TraineeQuiz />
        </Route>

        <Route>
          <div>
            <h1>404 - Page Not Found</h1>
            <Link href="/">Go Home</Link>
          </div>
        </Route>
      </Switch>
    </div>
  );
}
