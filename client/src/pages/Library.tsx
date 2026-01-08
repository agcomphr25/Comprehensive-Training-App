import React, { useEffect, useState } from "react";
import { Link } from "wouter";

type Department = { id: string; name: string };
type Role = { id: string; name: string; description?: string | null };
type WorkInstruction = { id: string; wiCode: string; title: string; body?: string | null; revision: string };
type Task = { id: string; name: string; departmentId?: string | null; workInstructionId?: string | null };
type CriticalPoint = { id: string; workInstructionId: string; label: string; detail?: string | null; severity: string };
type RoleTask = { id: string; roleId: string; taskId: string; sortOrder: number; required: boolean };
type FacilityTopic = { id: string; code: string; title: string; overview?: string | null };
type QuizQuestion = { id: string; topicId?: string | null; taskId?: string | null; question: string; type: string; meta: any };
type Trainee = { id: string; name: string; roleId?: string | null };

const tabs = ["Departments", "Roles", "Work Instructions", "Tasks", "Critical Points", "Role-Tasks", "Facility Topics", "Quiz Questions", "Trainees"] as const;
type Tab = typeof tabs[number];

export default function Library() {
  const [activeTab, setActiveTab] = useState<Tab>("Departments");

  const [departments, setDepartments] = useState<Department[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [workInstructions, setWorkInstructions] = useState<WorkInstruction[]>([]);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [criticalPoints, setCriticalPoints] = useState<CriticalPoint[]>([]);
  const [roleTasks, setRoleTasks] = useState<RoleTask[]>([]);
  const [facilityTopics, setFacilityTopics] = useState<FacilityTopic[]>([]);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [trainees, setTrainees] = useState<Trainee[]>([]);

  async function loadAll() {
    const [depts, rolesData, wis, tasksData, cps, rts, topics, questions, traineeData] = await Promise.all([
      fetch("/api/library/departments").then(r => r.json()),
      fetch("/api/library/roles").then(r => r.json()),
      fetch("/api/library/work-instructions").then(r => r.json()),
      fetch("/api/library/tasks").then(r => r.json()),
      fetch("/api/library/critical-points").then(r => r.json()),
      fetch("/api/library/role-tasks").then(r => r.json()),
      fetch("/api/library/facility-topics").then(r => r.json()),
      fetch("/api/library/quiz-questions").then(r => r.json()),
      fetch("/api/trainees").then(r => r.json())
    ]);
    setDepartments(depts);
    setRoles(rolesData);
    setWorkInstructions(wis);
    setAllTasks(tasksData);
    setCriticalPoints(cps);
    setRoleTasks(rts);
    setFacilityTopics(topics);
    setQuizQuestions(questions);
    setTrainees(traineeData);
  }

  useEffect(() => { loadAll(); }, []);

  const cardStyle: React.CSSProperties = { border: "1px solid #ddd", padding: 16, borderRadius: 8, marginBottom: 12 };
  const inputStyle: React.CSSProperties = { padding: 8, width: "100%", marginBottom: 8 };
  const btnStyle: React.CSSProperties = { padding: "8px 16px", cursor: "pointer" };

  return (
    <div style={{ fontFamily: "sans-serif", padding: 20, maxWidth: 1100, margin: "0 auto" }}>
      <h1>Training Content Library</h1>
      <p><Link href="/">Home</Link> | <Link href="/trainer">Trainer Dashboard</Link></p>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20, borderBottom: "2px solid #333", paddingBottom: 12 }}>
        {tabs.map(t => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            style={{ ...btnStyle, background: activeTab === t ? "#333" : "#eee", color: activeTab === t ? "#fff" : "#333" }}
          >
            {t}
          </button>
        ))}
      </div>

      {activeTab === "Departments" && (
        <DepartmentsTab departments={departments} reload={loadAll} cardStyle={cardStyle} inputStyle={inputStyle} btnStyle={btnStyle} />
      )}
      {activeTab === "Roles" && (
        <RolesTab roles={roles} reload={loadAll} cardStyle={cardStyle} inputStyle={inputStyle} btnStyle={btnStyle} />
      )}
      {activeTab === "Work Instructions" && (
        <WorkInstructionsTab workInstructions={workInstructions} reload={loadAll} cardStyle={cardStyle} inputStyle={inputStyle} btnStyle={btnStyle} />
      )}
      {activeTab === "Tasks" && (
        <TasksTab tasks={allTasks} departments={departments} workInstructions={workInstructions} reload={loadAll} cardStyle={cardStyle} inputStyle={inputStyle} btnStyle={btnStyle} />
      )}
      {activeTab === "Critical Points" && (
        <CriticalPointsTab criticalPoints={criticalPoints} workInstructions={workInstructions} reload={loadAll} cardStyle={cardStyle} inputStyle={inputStyle} btnStyle={btnStyle} />
      )}
      {activeTab === "Role-Tasks" && (
        <RoleTasksTab roleTasks={roleTasks} roles={roles} tasks={allTasks} reload={loadAll} cardStyle={cardStyle} inputStyle={inputStyle} btnStyle={btnStyle} />
      )}
      {activeTab === "Facility Topics" && (
        <FacilityTopicsTab topics={facilityTopics} reload={loadAll} cardStyle={cardStyle} inputStyle={inputStyle} btnStyle={btnStyle} />
      )}
      {activeTab === "Quiz Questions" && (
        <QuizQuestionsTab questions={quizQuestions} topics={facilityTopics} tasks={allTasks} reload={loadAll} cardStyle={cardStyle} inputStyle={inputStyle} btnStyle={btnStyle} />
      )}
      {activeTab === "Trainees" && (
        <TraineesTab trainees={trainees} roles={roles} reload={loadAll} cardStyle={cardStyle} inputStyle={inputStyle} btnStyle={btnStyle} />
      )}
    </div>
  );
}

function DepartmentsTab({ departments, reload, cardStyle, inputStyle, btnStyle }: any) {
  const [name, setName] = useState("");
  async function create() {
    await fetch("/api/library/departments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) });
    setName(""); reload();
  }
  async function remove(id: string) {
    await fetch(`/api/library/departments/${id}`, { method: "DELETE" }); reload();
  }
  return (
    <div>
      <h2>Departments</h2>
      <div style={cardStyle}>
        <input style={inputStyle} value={name} onChange={e => setName(e.target.value)} placeholder="Department name" />
        <button style={btnStyle} onClick={create}>Add Department</button>
      </div>
      {departments.map((d: any) => (
        <div key={d.id} style={{ ...cardStyle, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>{d.name}</span>
          <button onClick={() => remove(d.id)}>Delete</button>
        </div>
      ))}
    </div>
  );
}

function RolesTab({ roles, reload, cardStyle, inputStyle, btnStyle }: any) {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  async function create() {
    await fetch("/api/library/roles", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, description: desc }) });
    setName(""); setDesc(""); reload();
  }
  async function remove(id: string) {
    await fetch(`/api/library/roles/${id}`, { method: "DELETE" }); reload();
  }
  return (
    <div>
      <h2>Roles / Positions</h2>
      <div style={cardStyle}>
        <input style={inputStyle} value={name} onChange={e => setName(e.target.value)} placeholder="Role name" />
        <input style={inputStyle} value={desc} onChange={e => setDesc(e.target.value)} placeholder="Description (optional)" />
        <button style={btnStyle} onClick={create}>Add Role</button>
      </div>
      {roles.map((r: any) => (
        <div key={r.id} style={{ ...cardStyle, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div><b>{r.name}</b>{r.description && <span style={{ opacity: 0.7, marginLeft: 8 }}>{r.description}</span>}</div>
          <button onClick={() => remove(r.id)}>Delete</button>
        </div>
      ))}
    </div>
  );
}

function WorkInstructionsTab({ workInstructions, reload, cardStyle, inputStyle, btnStyle }: any) {
  const [wiCode, setWiCode] = useState("");
  const [title, setTitle] = useState("");
  const [revision, setRevision] = useState("A");
  async function create() {
    await fetch("/api/library/work-instructions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ wiCode, title, revision }) });
    setWiCode(""); setTitle(""); setRevision("A"); reload();
  }
  async function remove(id: string) {
    await fetch(`/api/library/work-instructions/${id}`, { method: "DELETE" }); reload();
  }
  return (
    <div>
      <h2>Work Instructions</h2>
      <div style={cardStyle}>
        <input style={inputStyle} value={wiCode} onChange={e => setWiCode(e.target.value)} placeholder="WI Code (e.g. WI-CT-001)" />
        <input style={inputStyle} value={title} onChange={e => setTitle(e.target.value)} placeholder="Title" />
        <input style={{ ...inputStyle, width: 100 }} value={revision} onChange={e => setRevision(e.target.value)} placeholder="Rev" />
        <button style={btnStyle} onClick={create}>Add Work Instruction</button>
      </div>
      {workInstructions.map((wi: any) => (
        <div key={wi.id} style={{ ...cardStyle, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div><b>{wi.wiCode}</b> - {wi.title} <span style={{ opacity: 0.6 }}>(Rev {wi.revision})</span></div>
          <button onClick={() => remove(wi.id)}>Delete</button>
        </div>
      ))}
    </div>
  );
}

function TasksTab({ tasks, departments, workInstructions, reload, cardStyle, inputStyle, btnStyle }: any) {
  const [name, setName] = useState("");
  const [deptId, setDeptId] = useState("");
  const [wiId, setWiId] = useState("");
  async function create() {
    await fetch("/api/library/tasks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, departmentId: deptId || null, workInstructionId: wiId || null }) });
    setName(""); setDeptId(""); setWiId(""); reload();
  }
  async function remove(id: string) {
    await fetch(`/api/library/tasks/${id}`, { method: "DELETE" }); reload();
  }
  const getDept = (id: string) => departments.find((d: any) => d.id === id)?.name || "";
  const getWI = (id: string) => workInstructions.find((w: any) => w.id === id)?.wiCode || "";
  return (
    <div>
      <h2>Tasks</h2>
      <div style={cardStyle}>
        <input style={inputStyle} value={name} onChange={e => setName(e.target.value)} placeholder="Task name" />
        <select style={inputStyle} value={deptId} onChange={e => setDeptId(e.target.value)}>
          <option value="">No department</option>
          {departments.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <select style={inputStyle} value={wiId} onChange={e => setWiId(e.target.value)}>
          <option value="">No work instruction</option>
          {workInstructions.map((wi: any) => <option key={wi.id} value={wi.id}>{wi.wiCode} - {wi.title}</option>)}
        </select>
        <button style={btnStyle} onClick={create}>Add Task</button>
      </div>
      {tasks.map((t: any) => (
        <div key={t.id} style={{ ...cardStyle, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <b>{t.name}</b>
            {t.departmentId && <span style={{ marginLeft: 8, background: "#e0e0e0", padding: "2px 6px", borderRadius: 4, fontSize: 12 }}>{getDept(t.departmentId)}</span>}
            {t.workInstructionId && <span style={{ marginLeft: 8, background: "#d0e8ff", padding: "2px 6px", borderRadius: 4, fontSize: 12 }}>{getWI(t.workInstructionId)}</span>}
          </div>
          <button onClick={() => remove(t.id)}>Delete</button>
        </div>
      ))}
    </div>
  );
}

function CriticalPointsTab({ criticalPoints, workInstructions, reload, cardStyle, inputStyle, btnStyle }: any) {
  const [wiId, setWiId] = useState("");
  const [label, setLabel] = useState("");
  const [detail, setDetail] = useState("");
  const [severity, setSeverity] = useState("major");
  async function create() {
    if (!wiId) return alert("Select a work instruction");
    await fetch("/api/library/critical-points", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ workInstructionId: wiId, label, detail, severity }) });
    setLabel(""); setDetail(""); reload();
  }
  async function remove(id: string) {
    await fetch(`/api/library/critical-points/${id}`, { method: "DELETE" }); reload();
  }
  const getWI = (id: string) => workInstructions.find((w: any) => w.id === id)?.wiCode || "";
  return (
    <div>
      <h2>Critical Points</h2>
      <div style={cardStyle}>
        <select style={inputStyle} value={wiId} onChange={e => setWiId(e.target.value)}>
          <option value="">Select work instruction</option>
          {workInstructions.map((wi: any) => <option key={wi.id} value={wi.id}>{wi.wiCode} - {wi.title}</option>)}
        </select>
        <input style={inputStyle} value={label} onChange={e => setLabel(e.target.value)} placeholder="Label (short name)" />
        <input style={inputStyle} value={detail} onChange={e => setDetail(e.target.value)} placeholder="Detail (what/why)" />
        <select style={{ ...inputStyle, width: 120 }} value={severity} onChange={e => setSeverity(e.target.value)}>
          <option value="minor">Minor</option>
          <option value="major">Major</option>
          <option value="critical">Critical</option>
        </select>
        <button style={btnStyle} onClick={create}>Add Critical Point</button>
      </div>
      {criticalPoints.map((cp: any) => (
        <div key={cp.id} style={{ ...cardStyle, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <span style={{ background: "#f0f0f0", padding: "2px 6px", borderRadius: 4, fontSize: 11 }}>{getWI(cp.workInstructionId)}</span>
            <b style={{ marginLeft: 8 }}>{cp.label}</b>
            <span style={{ marginLeft: 8, opacity: 0.7 }}>{cp.detail}</span>
            <span style={{ marginLeft: 8, background: cp.severity === "critical" ? "#f8d7da" : cp.severity === "major" ? "#fff3cd" : "#d4edda", padding: "2px 6px", borderRadius: 4, fontSize: 11 }}>{cp.severity}</span>
          </div>
          <button onClick={() => remove(cp.id)}>Delete</button>
        </div>
      ))}
    </div>
  );
}

function RoleTasksTab({ roleTasks, roles, tasks, reload, cardStyle, inputStyle, btnStyle }: any) {
  const [roleId, setRoleId] = useState("");
  const [taskId, setTaskId] = useState("");
  async function create() {
    if (!roleId || !taskId) return alert("Select both role and task");
    await fetch("/api/library/role-tasks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ roleId, taskId }) });
    reload();
  }
  async function remove(id: string) {
    await fetch(`/api/library/role-tasks/${id}`, { method: "DELETE" }); reload();
  }
  const getRole = (id: string) => roles.find((r: any) => r.id === id)?.name || "";
  const getTask = (id: string) => tasks.find((t: any) => t.id === id)?.name || "";
  return (
    <div>
      <h2>Role-Task Assignments</h2>
      <p style={{ opacity: 0.7 }}>Assign which tasks belong to each role/position.</p>
      <div style={cardStyle}>
        <select style={inputStyle} value={roleId} onChange={e => setRoleId(e.target.value)}>
          <option value="">Select role</option>
          {roles.map((r: any) => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
        <select style={inputStyle} value={taskId} onChange={e => setTaskId(e.target.value)}>
          <option value="">Select task</option>
          {tasks.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <button style={btnStyle} onClick={create}>Assign Task to Role</button>
      </div>
      {roleTasks.map((rt: any) => (
        <div key={rt.id} style={{ ...cardStyle, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div><b>{getRole(rt.roleId)}</b> → {getTask(rt.taskId)}</div>
          <button onClick={() => remove(rt.id)}>Remove</button>
        </div>
      ))}
    </div>
  );
}

function FacilityTopicsTab({ topics, reload, cardStyle, inputStyle, btnStyle }: any) {
  const [code, setCode] = useState("");
  const [title, setTitle] = useState("");
  const [overview, setOverview] = useState("");
  async function create() {
    await fetch("/api/library/facility-topics", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code, title, overview }) });
    setCode(""); setTitle(""); setOverview(""); reload();
  }
  async function remove(id: string) {
    await fetch(`/api/library/facility-topics/${id}`, { method: "DELETE" }); reload();
  }
  return (
    <div>
      <h2>Facility Topics</h2>
      <p style={{ opacity: 0.7 }}>Safety and compliance topics (PPE, FOD, ITAR, etc.)</p>
      <div style={cardStyle}>
        <input style={inputStyle} value={code} onChange={e => setCode(e.target.value)} placeholder="Code (e.g. PPE)" />
        <input style={inputStyle} value={title} onChange={e => setTitle(e.target.value)} placeholder="Title" />
        <input style={inputStyle} value={overview} onChange={e => setOverview(e.target.value)} placeholder="Overview (optional)" />
        <button style={btnStyle} onClick={create}>Add Topic</button>
      </div>
      {topics.map((t: any) => (
        <div key={t.id} style={{ ...cardStyle, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div><b>{t.code}</b> - {t.title}</div>
          <button onClick={() => remove(t.id)}>Delete</button>
        </div>
      ))}
    </div>
  );
}

function QuizQuestionsTab({ questions, topics, tasks, reload, cardStyle, inputStyle, btnStyle }: any) {
  const [topicId, setTopicId] = useState("");
  const [taskId, setTaskId] = useState("");
  const [question, setQuestion] = useState("");
  const [type, setType] = useState<"MCQ" | "TF" | "SHORT">("MCQ");
  const [choices, setChoices] = useState("A,B,C,D");
  const [answer, setAnswer] = useState("");

  async function create() {
    const meta: any = {};
    if (type === "MCQ") {
      meta.choices = choices.split(",").map(c => c.trim());
      meta.answer = answer;
    } else if (type === "TF") {
      meta.answer = answer;
    }
    await fetch("/api/library/quiz-questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topicId: topicId || null, taskId: taskId || null, question, type, meta })
    });
    setQuestion(""); setAnswer(""); reload();
  }
  async function remove(id: string) {
    await fetch(`/api/library/quiz-questions/${id}`, { method: "DELETE" }); reload();
  }
  const getTopic = (id: string) => topics.find((t: any) => t.id === id)?.code || "";
  const getTask = (id: string) => tasks.find((t: any) => t.id === id)?.name || "";

  return (
    <div>
      <h2>Quiz Questions</h2>
      <div style={cardStyle}>
        <select style={inputStyle} value={topicId} onChange={e => { setTopicId(e.target.value); setTaskId(""); }}>
          <option value="">No facility topic</option>
          {topics.map((t: any) => <option key={t.id} value={t.id}>{t.code} - {t.title}</option>)}
        </select>
        <select style={inputStyle} value={taskId} onChange={e => { setTaskId(e.target.value); setTopicId(""); }}>
          <option value="">No task</option>
          {tasks.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <textarea style={{ ...inputStyle, minHeight: 60 }} value={question} onChange={e => setQuestion(e.target.value)} placeholder="Question text" />
        <select style={{ ...inputStyle, width: 120 }} value={type} onChange={e => setType(e.target.value as any)}>
          <option value="MCQ">Multiple Choice</option>
          <option value="TF">True/False</option>
          <option value="SHORT">Short Answer</option>
        </select>
        {type === "MCQ" && (
          <>
            <input style={inputStyle} value={choices} onChange={e => setChoices(e.target.value)} placeholder="Choices (comma-separated)" />
            <input style={inputStyle} value={answer} onChange={e => setAnswer(e.target.value)} placeholder="Correct answer" />
          </>
        )}
        {type === "TF" && (
          <select style={inputStyle} value={answer} onChange={e => setAnswer(e.target.value)}>
            <option value="">Select answer</option>
            <option value="True">True</option>
            <option value="False">False</option>
          </select>
        )}
        <button style={btnStyle} onClick={create}>Add Question</button>
      </div>
      {questions.map((q: any) => (
        <div key={q.id} style={{ ...cardStyle, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            {q.topicId && <span style={{ background: "#e8d0ff", padding: "2px 6px", borderRadius: 4, fontSize: 11, marginRight: 8 }}>{getTopic(q.topicId)}</span>}
            {q.taskId && <span style={{ background: "#d0ffe8", padding: "2px 6px", borderRadius: 4, fontSize: 11, marginRight: 8 }}>{getTask(q.taskId)}</span>}
            <span style={{ background: "#f0f0f0", padding: "2px 6px", borderRadius: 4, fontSize: 11, marginRight: 8 }}>{q.type}</span>
            {q.question}
          </div>
          <button onClick={() => remove(q.id)}>Delete</button>
        </div>
      ))}
    </div>
  );
}

function TraineesTab({ trainees, roles, reload, cardStyle, inputStyle, btnStyle }: any) {
  const [name, setName] = useState("");
  const [roleId, setRoleId] = useState("");
  async function create() {
    await fetch("/api/trainees", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, roleId: roleId || null }) });
    setName(""); setRoleId(""); reload();
  }
  async function remove(id: string) {
    await fetch(`/api/trainees/${id}`, { method: "DELETE" }); reload();
  }
  const getRole = (id: string) => roles.find((r: any) => r.id === id)?.name || "";
  return (
    <div>
      <h2>Trainees</h2>
      <div style={cardStyle}>
        <input style={inputStyle} value={name} onChange={e => setName(e.target.value)} placeholder="Trainee name" />
        <select style={inputStyle} value={roleId} onChange={e => setRoleId(e.target.value)}>
          <option value="">No role assigned</option>
          {roles.map((r: any) => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
        <button style={btnStyle} onClick={create}>Add Trainee</button>
      </div>
      {trainees.map((t: any) => (
        <div key={t.id} style={{ ...cardStyle, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div><b>{t.name}</b>{t.roleId && <span style={{ marginLeft: 8, opacity: 0.7 }}>({getRole(t.roleId)})</span>}</div>
          <button onClick={() => remove(t.id)}>Delete</button>
        </div>
      ))}
    </div>
  );
}
