import React, { useEffect, useState } from 'react';

interface Assessment {
  id?: string;
  code: string;
  title: string;
  totalQuestions: number;
  publishedAt?: string;
  status?: string;
}

const emptyAssessment = { code: '', title: '', totalQuestions: 0 };

export default function AssessmentCRUD() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [form, setForm] = useState<Assessment>(emptyAssessment);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch all assessments
  const fetchAssessments = async () => {
    setLoading(true);
    const res = await fetch('/api/assessments/publish');
    const data = await res.json();
    if (data.success) setAssessments(data.assessments);
    setLoading(false);
  };

  useEffect(() => { fetchAssessments(); }, []);

  // Handle form input
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Create or update assessment
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (editingId) {
      // Update
      await fetch('/api/assessments/publish', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: form.code, updates: { assessment: { title: form.title, questions: Array(form.totalQuestions).fill({}) }, metadata: { status: form.status } } })
      });
    } else {
      // Create
      await fetch('/api/assessments/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assessment: { title: form.title, questions: Array(form.totalQuestions).fill({}) }, metadata: { status: 'active' }, code: form.code })
      });
    }
    setForm(emptyAssessment);
    setEditingId(null);
    await fetchAssessments();
    setLoading(false);
  };

  // Edit assessment
  const handleEdit = (a: Assessment) => {
    setForm(a);
    setEditingId(a.code);
  };

  // Delete assessment
  const handleDelete = async (code: string) => {
    if (!window.confirm('Delete this assessment?')) return;
    setLoading(true);
    await fetch('/api/assessments/monitor', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'endAssessment', assessmentCode: code })
    });
    await fetchAssessments();
    setLoading(false);
  };

  return (
    <div className="p-4 border rounded-lg bg-white max-w-2xl mx-auto my-8">
      <h2 className="text-xl font-bold mb-4">Assessment CRUD</h2>
      <form onSubmit={handleSubmit} className="mb-6 space-y-2">
        <input name="code" value={form.code} onChange={handleChange} placeholder="Code" className="border p-2 mr-2" required />
        <input name="title" value={form.title} onChange={handleChange} placeholder="Title" className="border p-2 mr-2" required />
        <input name="totalQuestions" type="number" value={form.totalQuestions} onChange={handleChange} placeholder="Questions" className="border p-2 mr-2" required />
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">{editingId ? 'Update' : 'Create'}</button>
        {editingId && <button type="button" onClick={() => { setForm(emptyAssessment); setEditingId(null); }} className="ml-2 px-4 py-2 border rounded">Cancel</button>}
      </form>
      {loading && <div>Loading...</div>}
      <table className="w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2">Code</th>
            <th className="border p-2">Title</th>
            <th className="border p-2">Questions</th>
            <th className="border p-2">Status</th>
            <th className="border p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {assessments.map(a => (
            <tr key={a.code}>
              <td className="border p-2">{a.code}</td>
              <td className="border p-2">{a.title}</td>
              <td className="border p-2">{a.totalQuestions}</td>
              <td className="border p-2">{a.status}</td>
              <td className="border p-2">
                <button onClick={() => handleEdit(a)} className="text-blue-600 mr-2">Edit</button>
                <button onClick={() => handleDelete(a.code)} className="text-red-600">Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
