import React, { useEffect, useState } from "react";
import {
  Container,
  Title,
  Tabs,
  Card,
  TextInput,
  Textarea,
  Select,
  Button,
  Group,
  Stack,
  Text,
  Badge,
  ActionIcon,
  Table,
  FileInput,
  Alert,
  MultiSelect,
  Modal,
  Checkbox,
  Paper,
  Loader,
  Accordion,
  List,
  ThemeIcon,
  Progress,
} from "@mantine/core";
import {
  IconTrash,
  IconPlus,
  IconUpload,
  IconWand,
  IconLoader,
  IconFolder,
  IconFile,
  IconBook,
  IconUsers,
  IconCheck,
  IconX,
  IconRefresh,
  IconEye,
  IconPlayerPlay,
} from "@tabler/icons-react";

type DocumentCategory = {
  id: string;
  name: string;
  type: "department" | "facility" | "custom";
  description?: string | null;
};

type Document = {
  id: string;
  title: string;
  fileName: string;
  extractedText?: string | null;
  status: string;
  createdAt: string;
  categories?: DocumentCategory[];
};

type TopicContent = {
  id: string;
  topicId: string;
  stepNumber: number;
  stepTitle: string;
  trainerScript?: string | null;
  traineeActivity?: string | null;
  keyPoints: string[];
  checklistItems: string[];
  estimatedMinutes?: number;
};

type TopicQuestion = {
  id: string;
  topicId: string;
  question: string;
  type: string;
  meta: { choices?: string[]; answer: string };
  active: boolean;
};

type TrainingTopic = {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  error?: string | null;
  generatedAt?: string | null;
  documents?: Document[];
  content?: TopicContent[];
  questionCount?: number;
  questions?: TopicQuestion[];
};

type Trainee = {
  id: string;
  name: string;
  roleId?: string | null;
};

type Assignment = {
  id: string;
  traineeId: string;
  topicId: string;
  targetLevel: string;
  status: string;
  trainee?: Trainee;
  topic?: TrainingTopic;
  trainingPlanId?: string | null;
};

export default function ContentLibrary() {
  const [categories, setCategories] = useState<DocumentCategory[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [topics, setTopics] = useState<TrainingTopic[]>([]);
  const [trainees, setTrainees] = useState<Trainee[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadAll() {
    setLoading(true);
    const [cats, docs, topicsData, traineeData] = await Promise.all([
      fetch("/api/documents/categories").then(r => r.json()),
      fetch("/api/documents").then(r => r.json()),
      fetch("/api/topics").then(r => r.json()),
      fetch("/api/trainees").then(r => r.json()),
    ]);
    setCategories(cats);
    setDocuments(docs);
    setTopics(topicsData);
    setTrainees(traineeData);
    setLoading(false);
  }

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    const hasGenerating = topics.some(t => t.status === "generating");
    if (hasGenerating) {
      const interval = setInterval(async () => {
        const topicsData = await fetch("/api/topics").then(r => r.json());
        setTopics(topicsData);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [topics]);

  if (loading) {
    return (
      <Container size="lg" py="xl">
        <Group justify="center">
          <Loader size="lg" />
          <Text>Loading content library...</Text>
        </Group>
      </Container>
    );
  }

  return (
    <Container size="lg">
      <Title order={2} mb="lg">Training Content Library</Title>
      <Text c="dimmed" mb="xl">
        Import documents, create training topics, and assign them to trainees for 4-day training plans.
      </Text>

      <Tabs defaultValue="documents" variant="pills">
        <Tabs.List mb="lg">
          <Tabs.Tab value="documents" leftSection={<IconFile size={16} />}>
            Documents ({documents.length})
          </Tabs.Tab>
          <Tabs.Tab value="categories" leftSection={<IconFolder size={16} />}>
            Categories ({categories.length})
          </Tabs.Tab>
          <Tabs.Tab value="topics" leftSection={<IconBook size={16} />}>
            Training Topics ({topics.length})
          </Tabs.Tab>
          <Tabs.Tab value="assign" leftSection={<IconUsers size={16} />}>
            Assign Training
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="documents">
          <DocumentsTab documents={documents} categories={categories} reload={loadAll} />
        </Tabs.Panel>
        <Tabs.Panel value="categories">
          <CategoriesTab categories={categories} reload={loadAll} />
        </Tabs.Panel>
        <Tabs.Panel value="topics">
          <TopicsTab topics={topics} documents={documents} reload={loadAll} />
        </Tabs.Panel>
        <Tabs.Panel value="assign">
          <AssignTab topics={topics} trainees={trainees} reload={loadAll} />
        </Tabs.Panel>
      </Tabs>
    </Container>
  );
}

function DocumentsTab({ documents, categories, reload }: { documents: Document[]; categories: DocumentCategory[]; reload: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryType, setNewCategoryType] = useState<string>("custom");
  const [uploading, setUploading] = useState(false);

  async function uploadDocument() {
    if (!file || !title.trim()) return;
    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", title);
    formData.append("categoryIds", JSON.stringify(selectedCategories));

    const newCategories = newCategoryName.trim()
      ? [{ name: newCategoryName, type: newCategoryType }]
      : [];
    formData.append("newCategories", JSON.stringify(newCategories));

    await fetch("/api/documents/import", {
      method: "POST",
      body: formData,
    });

    setFile(null);
    setTitle("");
    setSelectedCategories([]);
    setNewCategoryName("");
    setUploading(false);
    reload();
  }

  async function deleteDocument(id: string) {
    await fetch(`/api/documents/${id}`, { method: "DELETE" });
    reload();
  }

  const categoryOptions = categories.map(c => ({
    value: c.id,
    label: `${c.name} (${c.type})`,
  }));

  return (
    <Stack>
      <Card withBorder>
        <Title order={4} mb="md">Import Document</Title>
        <Stack>
          <FileInput
            label="PDF File"
            placeholder="Choose PDF file"
            accept=".pdf"
            value={file}
            onChange={setFile}
            leftSection={<IconUpload size={16} />}
          />
          <TextInput
            label="Document Title"
            placeholder="Enter title for this document"
            value={title}
            onChange={e => setTitle(e.target.value)}
          />
          <MultiSelect
            label="Assign Categories"
            placeholder="Select existing categories"
            data={categoryOptions}
            value={selectedCategories}
            onChange={setSelectedCategories}
          />
          <Group>
            <TextInput
              flex={1}
              label="Or Create New Category"
              placeholder="Category name"
              value={newCategoryName}
              onChange={e => setNewCategoryName(e.target.value)}
            />
            <Select
              label="Type"
              data={[
                { value: "department", label: "Department" },
                { value: "facility", label: "Facility" },
                { value: "custom", label: "Custom" },
              ]}
              value={newCategoryType}
              onChange={v => setNewCategoryType(v || "custom")}
              w={150}
            />
          </Group>
          <Button
            leftSection={uploading ? <Loader size={16} /> : <IconUpload size={16} />}
            onClick={uploadDocument}
            disabled={!file || !title.trim() || uploading}
          >
            {uploading ? "Uploading..." : "Import Document"}
          </Button>
        </Stack>
      </Card>

      <Card withBorder>
        <Title order={4} mb="md">Imported Documents</Title>
        {documents.length === 0 ? (
          <Text c="dimmed">No documents imported yet. Upload a PDF to get started.</Text>
        ) : (
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Title</Table.Th>
                <Table.Th>File</Table.Th>
                <Table.Th>Categories</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th w={80}>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {documents.map(doc => (
                <Table.Tr key={doc.id}>
                  <Table.Td>{doc.title}</Table.Td>
                  <Table.Td>
                    <Text size="sm" c="dimmed">{doc.fileName}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Group gap={4}>
                      {doc.categories?.map(cat => (
                        <Badge key={cat.id} size="sm" variant="light">
                          {cat.name}
                        </Badge>
                      ))}
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <Badge
                      color={doc.status === "ready" ? "green" : doc.status === "failed" ? "red" : "yellow"}
                    >
                      {doc.status}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <ActionIcon color="red" variant="light" onClick={() => deleteDocument(doc.id)}>
                      <IconTrash size={16} />
                    </ActionIcon>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}
      </Card>
    </Stack>
  );
}

function CategoriesTab({ categories, reload }: { categories: DocumentCategory[]; reload: () => void }) {
  const [name, setName] = useState("");
  const [type, setType] = useState<string>("custom");
  const [description, setDescription] = useState("");

  async function createCategory() {
    if (!name.trim()) return;
    await fetch("/api/documents/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, type, description: description || undefined }),
    });
    setName("");
    setDescription("");
    reload();
  }

  async function deleteCategory(id: string) {
    await fetch(`/api/documents/categories/${id}`, { method: "DELETE" });
    reload();
  }

  const grouped = {
    department: categories.filter(c => c.type === "department"),
    facility: categories.filter(c => c.type === "facility"),
    custom: categories.filter(c => c.type === "custom"),
  };

  return (
    <Stack>
      <Card withBorder>
        <Title order={4} mb="md">Create Category</Title>
        <Group align="end">
          <TextInput
            flex={1}
            label="Category Name"
            placeholder="e.g., Assembly, Safety, Quality"
            value={name}
            onChange={e => setName(e.target.value)}
          />
          <Select
            label="Type"
            data={[
              { value: "department", label: "Department" },
              { value: "facility", label: "Facility" },
              { value: "custom", label: "Custom" },
            ]}
            value={type}
            onChange={v => setType(v || "custom")}
            w={150}
          />
          <TextInput
            flex={1}
            label="Description (optional)"
            placeholder="Brief description"
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
          <Button leftSection={<IconPlus size={16} />} onClick={createCategory}>
            Add
          </Button>
        </Group>
      </Card>

      {Object.entries(grouped).map(([type, cats]) => (
        <Card key={type} withBorder>
          <Title order={5} mb="sm" tt="capitalize">
            {type} Categories ({cats.length})
          </Title>
          {cats.length === 0 ? (
            <Text c="dimmed" size="sm">No {type} categories yet.</Text>
          ) : (
            <Group>
              {cats.map(cat => (
                <Badge
                  key={cat.id}
                  size="lg"
                  variant="light"
                  rightSection={
                    <ActionIcon size="xs" color="red" variant="transparent" onClick={() => deleteCategory(cat.id)}>
                      <IconX size={12} />
                    </ActionIcon>
                  }
                >
                  {cat.name}
                </Badge>
              ))}
            </Group>
          )}
        </Card>
      ))}
    </Stack>
  );
}

function TopicsTab({ topics, documents, reload }: { topics: TrainingTopic[]; documents: Document[]; reload: () => void }) {
  const [createOpen, setCreateOpen] = useState(false);
  const [viewTopic, setViewTopic] = useState<TrainingTopic | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);

  async function createTopic() {
    if (!title.trim() || selectedDocs.length === 0) return;
    setCreating(true);
    await fetch("/api/topics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description: description || undefined, documentIds: selectedDocs }),
    });
    setTitle("");
    setDescription("");
    setSelectedDocs([]);
    setCreating(false);
    setCreateOpen(false);
    reload();
  }

  async function regenerateTopic(id: string) {
    await fetch(`/api/topics/${id}/regenerate`, { method: "POST" });
    reload();
  }

  async function deleteTopic(id: string) {
    await fetch(`/api/topics/${id}`, { method: "DELETE" });
    reload();
  }

  async function loadTopicDetails(id: string) {
    const data = await fetch(`/api/topics/${id}`).then(r => r.json());
    setViewTopic(data);
  }

  const readyDocs = documents.filter(d => d.status === "ready");
  const docOptions = readyDocs.map(d => ({ value: d.id, label: d.title }));

  return (
    <Stack>
      <Card withBorder>
        <Group justify="space-between">
          <div>
            <Title order={4}>Training Topics</Title>
            <Text c="dimmed" size="sm">
              Create topics from documents. AI will generate 4-step training content and quizzes.
            </Text>
          </div>
          <Group>
            <Button variant="light" leftSection={<IconRefresh size={16} />} onClick={reload}>
              Refresh
            </Button>
            <Button leftSection={<IconPlus size={16} />} onClick={() => setCreateOpen(true)}>
              Create Topic
            </Button>
          </Group>
        </Group>
      </Card>

      {topics.length === 0 ? (
        <Alert>No training topics created yet. Select documents to create a topic.</Alert>
      ) : (
        topics.map(topic => (
          <Card key={topic.id} withBorder>
            <Group justify="space-between" mb="sm">
              <div>
                <Group gap="sm">
                  <Title order={5}>{topic.title}</Title>
                  <Badge
                    color={
                      topic.status === "ready" ? "green" :
                      topic.status === "generating" ? "yellow" :
                      topic.status === "failed" ? "red" : "gray"
                    }
                  >
                    {topic.status}
                  </Badge>
                </Group>
                {topic.description && <Text size="sm" c="dimmed">{topic.description}</Text>}
              </div>
              <Group>
                {topic.status === "ready" && (
                  <Button
                    size="xs"
                    variant="light"
                    leftSection={<IconEye size={14} />}
                    onClick={() => loadTopicDetails(topic.id)}
                  >
                    View Content
                  </Button>
                )}
                <ActionIcon
                  variant="light"
                  onClick={() => regenerateTopic(topic.id)}
                  title="Regenerate"
                >
                  <IconRefresh size={16} />
                </ActionIcon>
                <ActionIcon color="red" variant="light" onClick={() => deleteTopic(topic.id)}>
                  <IconTrash size={16} />
                </ActionIcon>
              </Group>
            </Group>

            {topic.status === "generating" && (
              <Group gap="sm">
                <Loader size="sm" />
                <Text size="sm">AI is generating training content...</Text>
              </Group>
            )}

            {topic.status === "failed" && topic.error && (
              <Alert color="red" title="Generation Failed">
                {topic.error}
              </Alert>
            )}

            {topic.status === "ready" && (
              <Group gap="lg">
                <Text size="sm">
                  <strong>{topic.documents?.length || 0}</strong> source documents
                </Text>
                <Text size="sm">
                  <strong>{topic.content?.length || 0}</strong> training steps
                </Text>
                <Text size="sm">
                  <strong>{topic.questionCount || 0}</strong> quiz questions
                </Text>
              </Group>
            )}
          </Card>
        ))
      )}

      <Modal opened={createOpen} onClose={() => setCreateOpen(false)} title="Create Training Topic" size="lg">
        <Stack>
          <TextInput
            label="Topic Title"
            placeholder="e.g., Soldering Fundamentals"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
          />
          <Textarea
            label="Description (optional)"
            placeholder="Brief description of this training topic"
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
          <MultiSelect
            label="Select Source Documents"
            description="AI will analyze these documents to create training content"
            placeholder="Choose documents"
            data={docOptions}
            value={selectedDocs}
            onChange={setSelectedDocs}
            required
          />
          {selectedDocs.length > 0 && (
            <Alert color="blue" title="AI Generation">
              AI will create a 4-step training module with:
              <List size="sm" mt="xs">
                <List.Item>Step 1: Trainer Does / Trainer Explains</List.Item>
                <List.Item>Step 2: Trainer Does / Trainee Explains</List.Item>
                <List.Item>Step 3: Trainee Does / Trainer Coaches</List.Item>
                <List.Item>Step 4: Trainee Does / Trainer Observes</List.Item>
                <List.Item>10-15 Quiz Questions</List.Item>
              </List>
            </Alert>
          )}
          <Button
            leftSection={creating ? <Loader size={16} /> : <IconWand size={16} />}
            onClick={createTopic}
            disabled={!title.trim() || selectedDocs.length === 0 || creating}
          >
            {creating ? "Creating..." : "Create Topic with AI"}
          </Button>
        </Stack>
      </Modal>

      <Modal opened={!!viewTopic} onClose={() => setViewTopic(null)} title={viewTopic?.title} size="xl">
        {viewTopic && (
          <Stack>
            <Accordion variant="separated">
              {viewTopic.content?.map(step => (
                <Accordion.Item key={step.id} value={`step-${step.stepNumber}`}>
                  <Accordion.Control>
                    <Group>
                      <Badge circle>{step.stepNumber}</Badge>
                      <Text fw={500}>{step.stepTitle}</Text>
                      <Badge size="sm" variant="light">{step.estimatedMinutes} min</Badge>
                    </Group>
                  </Accordion.Control>
                  <Accordion.Panel>
                    <Stack>
                      <div>
                        <Text fw={600} size="sm" mb="xs">Trainer Script:</Text>
                        <Paper p="sm" bg="gray.0">
                          <Text size="sm" style={{ whiteSpace: "pre-wrap" }}>{step.trainerScript}</Text>
                        </Paper>
                      </div>
                      <div>
                        <Text fw={600} size="sm" mb="xs">Trainee Activity:</Text>
                        <Text size="sm">{step.traineeActivity}</Text>
                      </div>
                      <div>
                        <Text fw={600} size="sm" mb="xs">Key Points:</Text>
                        <List size="sm">
                          {step.keyPoints?.map((point, i) => (
                            <List.Item key={i}>{point}</List.Item>
                          ))}
                        </List>
                      </div>
                      <div>
                        <Text fw={600} size="sm" mb="xs">Trainer Checklist:</Text>
                        <List size="sm" icon={<ThemeIcon size={16} radius="xl" color="teal"><IconCheck size={10} /></ThemeIcon>}>
                          {step.checklistItems?.map((item, i) => (
                            <List.Item key={i}>{item}</List.Item>
                          ))}
                        </List>
                      </div>
                    </Stack>
                  </Accordion.Panel>
                </Accordion.Item>
              ))}
            </Accordion>

            <Title order={5} mt="md">Quiz Questions ({viewTopic.questions?.length || 0})</Title>
            <Stack gap="xs">
              {viewTopic.questions?.slice(0, 5).map((q, i) => (
                <Paper key={q.id} p="sm" withBorder>
                  <Group justify="space-between">
                    <Text size="sm">{i + 1}. {q.question}</Text>
                    <Badge size="sm">{q.type}</Badge>
                  </Group>
                </Paper>
              ))}
              {(viewTopic.questions?.length || 0) > 5 && (
                <Text size="sm" c="dimmed">...and {(viewTopic.questions?.length || 0) - 5} more questions</Text>
              )}
            </Stack>
          </Stack>
        )}
      </Modal>
    </Stack>
  );
}

function AssignTab({ topics, trainees, reload }: { topics: TrainingTopic[]; trainees: Trainee[]; reload: () => void }) {
  const [selectedTrainee, setSelectedTrainee] = useState<string | null>(null);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [trainerName, setTrainerName] = useState("");
  const [targetLevel, setTargetLevel] = useState<string>("basic");
  const [assigning, setAssigning] = useState(false);
  const [result, setResult] = useState<{ plan?: any; message?: string } | null>(null);

  async function assignTopics() {
    if (!selectedTrainee || selectedTopics.length === 0 || !trainerName.trim()) return;
    setAssigning(true);
    const response = await fetch("/api/topics/assign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        traineeId: selectedTrainee,
        topicIds: selectedTopics,
        trainerName,
        targetLevel,
      }),
    });
    const data = await response.json();
    setResult(data);
    setAssigning(false);
    setSelectedTrainee(null);
    setSelectedTopics([]);
    setTrainerName("");
    reload();
  }

  const readyTopics = topics.filter(t => t.status === "ready");
  const traineeOptions = trainees.map(t => ({ value: t.id, label: t.name }));
  const topicOptions = readyTopics.map(t => ({ value: t.id, label: t.title }));

  return (
    <Stack>
      <Card withBorder>
        <Title order={4} mb="md">Assign Training Topics</Title>
        <Text c="dimmed" size="sm" mb="lg">
          Select a trainee and topics to automatically create a 4-day training plan.
        </Text>

        <Stack>
          <Select
            label="Trainee"
            placeholder="Select trainee"
            data={traineeOptions}
            value={selectedTrainee}
            onChange={setSelectedTrainee}
            searchable
          />
          <MultiSelect
            label="Training Topics"
            placeholder="Select topics to include in training"
            data={topicOptions}
            value={selectedTopics}
            onChange={setSelectedTopics}
          />
          <TextInput
            label="Trainer Name"
            placeholder="Name of the trainer"
            value={trainerName}
            onChange={e => setTrainerName(e.target.value)}
          />
          <Select
            label="Target Knowledge Level"
            data={[
              { value: "basic", label: "Basic" },
              { value: "intermediate", label: "Intermediate" },
              { value: "advanced", label: "Advanced" },
            ]}
            value={targetLevel}
            onChange={v => setTargetLevel(v || "basic")}
          />

          {selectedTopics.length > 0 && (
            <Alert color="blue" title="4-Day Training Plan">
              A training plan will be created with the following structure:
              <List size="sm" mt="xs">
                <List.Item><strong>Day 1:</strong> Trainer Does / Trainer Explains</List.Item>
                <List.Item><strong>Day 2:</strong> Trainer Does / Trainee Explains</List.Item>
                <List.Item><strong>Day 3:</strong> Trainee Does / Trainer Coaches</List.Item>
                <List.Item><strong>Day 4:</strong> Trainee Does / Trainer Observes</List.Item>
              </List>
              <Text size="sm" mt="xs">
                Selected topics: <strong>{selectedTopics.length}</strong>
              </Text>
            </Alert>
          )}

          <Button
            leftSection={assigning ? <Loader size={16} /> : <IconPlayerPlay size={16} />}
            onClick={assignTopics}
            disabled={!selectedTrainee || selectedTopics.length === 0 || !trainerName.trim() || assigning}
          >
            {assigning ? "Creating Plan..." : "Create Training Plan"}
          </Button>
        </Stack>
      </Card>

      {result && (
        <Alert color="green" title="Training Plan Created" onClose={() => setResult(null)} withCloseButton>
          {result.message}
          {result.plan && (
            <Text size="sm" mt="xs">
              Plan ID: {result.plan.id}
            </Text>
          )}
        </Alert>
      )}

      {trainees.length === 0 && (
        <Alert color="yellow" title="No Trainees">
          Add trainees in the Content Library &gt; Trainees tab before assigning training.
        </Alert>
      )}

      {readyTopics.length === 0 && (
        <Alert color="yellow" title="No Ready Topics">
          Create training topics from documents first. Only topics with status "ready" can be assigned.
        </Alert>
      )}
    </Stack>
  );
}
