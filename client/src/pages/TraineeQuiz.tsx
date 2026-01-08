import React, { useEffect, useState } from "react";
import { Link } from "wouter";

type Question = {
  id: string;
  question: string;
  type: "MCQ" | "TF" | "SHORT";
  meta: { choices?: string[]; answer?: string; rubric?: string };
};

type QuizResult = {
  quiz: { id: string; score: number; total: number; passed: boolean };
};

export default function TraineeQuiz({ sessionId }: { sessionId: string }) {
  const [quizId, setQuizId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<QuizResult | null>(null);
  const [loading, setLoading] = useState(false);

  const params = new URLSearchParams(window.location.search);
  const facilityTopicCode = params.get("topic") || "PPE";

  async function generateQuiz() {
    setLoading(true);
    const r = await fetch(`/api/training/sessions/${sessionId}/quiz/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ facilityTopicCode })
    });
    const data = await r.json();
    setQuizId(data.quizId);
    setQuestions(data.questions || []);
    setLoading(false);
  }

  async function submitQuiz() {
    if (!quizId) return;
    setLoading(true);
    const answerList = questions.map(q => ({
      questionId: q.id,
      answer: answers[q.id] || null
    }));
    const r = await fetch(`/api/training/quizzes/${quizId}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers: answerList })
    });
    const data = await r.json();
    setResult(data);
    setLoading(false);
  }

  useEffect(() => {
    generateQuiz();
  }, [sessionId]);

  if (result) {
    const { score, total, passed } = result.quiz;
    return (
      <div style={{ fontFamily: "sans-serif", padding: 20, maxWidth: 600, margin: "0 auto" }}>
        <h1>Quiz Complete</h1>
        <div style={{
          padding: 24,
          borderRadius: 8,
          background: passed ? "#d4edda" : "#f8d7da",
          textAlign: "center",
          marginTop: 20
        }}>
          <h2 style={{ margin: 0 }}>Score: {score} / {total}</h2>
          <p style={{ fontSize: 18, marginTop: 8 }}>
            {passed ? "PASSED" : "NOT PASSED"} (80% required)
          </p>
        </div>
        <p style={{ marginTop: 20 }}>
          <Link href="/trainer">Back to Trainer Dashboard</Link>
        </p>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "sans-serif", padding: 20, maxWidth: 700, margin: "0 auto" }}>
      <h1>Daily Quiz</h1>
      <p>Topic: <strong>{facilityTopicCode}</strong></p>

      {loading && <p>Loading...</p>}

      {!loading && questions.length === 0 && (
        <p>No questions available for this session.</p>
      )}

      {questions.map((q, idx) => (
        <div key={q.id} style={{ border: "1px solid #ddd", padding: 16, marginBottom: 16, borderRadius: 8 }}>
          <p><strong>Q{idx + 1}:</strong> {q.question}</p>

          {q.type === "MCQ" && q.meta.choices && (
            <div style={{ marginTop: 8 }}>
              {q.meta.choices.map((choice, i) => (
                <label key={i} style={{ display: "block", marginBottom: 6 }}>
                  <input
                    type="radio"
                    name={q.id}
                    value={choice}
                    checked={answers[q.id] === choice}
                    onChange={() => setAnswers(prev => ({ ...prev, [q.id]: choice }))}
                  />
                  {" "}{choice}
                </label>
              ))}
            </div>
          )}

          {q.type === "TF" && (
            <div style={{ marginTop: 8 }}>
              {["True", "False"].map(opt => (
                <label key={opt} style={{ display: "block", marginBottom: 6 }}>
                  <input
                    type="radio"
                    name={q.id}
                    value={opt}
                    checked={answers[q.id] === opt}
                    onChange={() => setAnswers(prev => ({ ...prev, [q.id]: opt }))}
                  />
                  {" "}{opt}
                </label>
              ))}
            </div>
          )}

          {q.type === "SHORT" && (
            <textarea
              placeholder="Your answer..."
              value={answers[q.id] || ""}
              onChange={e => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
              style={{ width: "100%", marginTop: 8 }}
              rows={3}
            />
          )}
        </div>
      ))}

      {questions.length > 0 && (
        <button onClick={submitQuiz} disabled={loading} style={{ padding: "12px 24px", fontSize: 16 }}>
          Submit Quiz
        </button>
      )}
    </div>
  );
}
