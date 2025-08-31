import React, { useEffect, useState } from 'react';

interface Question {
  id?: string;
  assessment_code: string;
  question: string;
  type?: string;
  options?: string[];
  correctAnswer?: string;
}

const emptyQuestion = { assessment_code: '', question: '' };

export default function QuestionCRUD() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [form, setForm] = useState<Question>(emptyQuestion);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [assessmentCode, setAssessmentCode] = useState('');
  const [loading, setLoading] = useState(false);

  // Fetch questions for an assessment
  const fetchQuestions = async () => {
    if (!assessmentCode) return;
    setLoading(true);
    const res = await fetch(`/api/questions?assessmentCode=${assessmentCode}`);
    const data = await res.json();
    if (data.success) setQuestions(data.data);
    setLoading(false);
  };

  useEffect(() => { fetchQuestions(); }, [assessmentCode]);

  // Handle form input
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Create or update question
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (editingId) {
      await fetch('/api/questions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingId, updates: form })
      });
    } else {
      await fetch('/api/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assessmentCode, question: form })
      });
    }
    setForm(emptyQuestion);
    setEditingId(null);
    await fetchQuestions();
    setLoading(false);
  };

  // Edit question
  const handleEdit = (q: Question) => {
    setForm(q);
    setEditingId(q.id!);
  };

  // Delete question
  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this question?')) return;
    setLoading(true);
    await fetch('/api/questions', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
    await fetchQuestions();
    setLoading(false);
  };

  return (
    <div className="p-4 border rounded-lg bg-white max-w-2xl mx-auto my-8">
      <h2 className="text-xl font-bold mb-4">Question CRUD</h2>
      <div className="mb-4">
        <input value={assessmentCode} onChange={e => setAssessmentCode(e.target.value)} placeholder="Assessment Code" className="border p-2 mr-2" />
        <button onClick={fetchQuestions} className="bg-blue-500 text-white px-4 py-2 rounded">Load</button>
      </div>
      <form onSubmit={handleSubmit} className="mb-6 space-y-2">
        <input name="question" value={form.question} onChange={handleChange} placeholder="Question" className="border p-2 mr-2" required />
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">{editingId ? 'Update' : 'Create'}</button>
        {editingId && <button type="button" onClick={() => { setForm(emptyQuestion); setEditingId(null); }} className="ml-2 px-4 py-2 border rounded">Cancel</button>}
      </form>
      {loading && <div>Loading...</div>}
      <table className="w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2">Question</th>
            <th className="border p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {questions.map(q => (
            <tr key={q.id}>
              <td className="border p-2">{q.question}</td>
              <td className="border p-2">
                <button onClick={() => handleEdit(q)} className="text-blue-600 mr-2">Edit</button>
                <button onClick={() => handleDelete(q.id!)} className="text-red-600">Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
