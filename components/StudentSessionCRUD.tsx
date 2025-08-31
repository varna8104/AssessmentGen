import React, { useEffect, useState } from 'react';

interface StudentSession {
  id?: string;
  assessment_code: string;
  student_name: string;
  completed?: boolean;
  score?: number;
}

const emptySession = { assessment_code: '', student_name: '' };

export default function StudentSessionCRUD() {
  const [sessions, setSessions] = useState<StudentSession[]>([]);
  const [form, setForm] = useState<StudentSession>(emptySession);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [assessmentCode, setAssessmentCode] = useState('');
  const [loading, setLoading] = useState(false);

  // Fetch sessions for an assessment
  const fetchSessions = async () => {
    if (!assessmentCode) return;
    setLoading(true);
    const res = await fetch(`/api/student-sessions?assessmentCode=${assessmentCode}`);
    const data = await res.json();
    if (data.success) setSessions(data.data);
    setLoading(false);
  };

  useEffect(() => { fetchSessions(); }, [assessmentCode]);

  // Handle form input
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Create or update session
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (editingId) {
      await fetch('/api/student-sessions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingId, updates: form })
      });
    } else {
      await fetch('/api/student-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assessmentCode, studentName: form.student_name })
      });
    }
    setForm(emptySession);
    setEditingId(null);
    await fetchSessions();
    setLoading(false);
  };

  // Edit session
  const handleEdit = (s: StudentSession) => {
    setForm(s);
    setEditingId(s.id!);
  };

  // Delete session
  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this session?')) return;
    setLoading(true);
    await fetch('/api/student-sessions', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
    await fetchSessions();
    setLoading(false);
  };

  return (
    <div className="p-4 border rounded-lg bg-white max-w-2xl mx-auto my-8">
      <h2 className="text-xl font-bold mb-4">Student Session CRUD</h2>
      <div className="mb-4">
        <input value={assessmentCode} onChange={e => setAssessmentCode(e.target.value)} placeholder="Assessment Code" className="border p-2 mr-2" />
        <button onClick={fetchSessions} className="bg-blue-500 text-white px-4 py-2 rounded">Load</button>
      </div>
      <form onSubmit={handleSubmit} className="mb-6 space-y-2">
        <input name="student_name" value={form.student_name} onChange={handleChange} placeholder="Student Name" className="border p-2 mr-2" required />
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">{editingId ? 'Update' : 'Create'}</button>
        {editingId && <button type="button" onClick={() => { setForm(emptySession); setEditingId(null); }} className="ml-2 px-4 py-2 border rounded">Cancel</button>}
      </form>
      {loading && <div>Loading...</div>}
      <table className="w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2">Student Name</th>
            <th className="border p-2">Completed</th>
            <th className="border p-2">Score</th>
            <th className="border p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {sessions.map(s => (
            <tr key={s.id}>
              <td className="border p-2">{s.student_name}</td>
              <td className="border p-2">{s.completed ? 'Yes' : 'No'}</td>
              <td className="border p-2">{s.score ?? '-'}</td>
              <td className="border p-2">
                <button onClick={() => handleEdit(s)} className="text-blue-600 mr-2">Edit</button>
                <button onClick={() => handleDelete(s.id!)} className="text-red-600">Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
