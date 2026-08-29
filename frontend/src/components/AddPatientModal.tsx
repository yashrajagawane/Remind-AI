import { useState } from 'react';
import { X } from 'lucide-react';
import { fetchApi } from '@/lib/api';
import { Button } from '@/components/ui/button';

export function AddPatientModal({ onClose, onSuccess }: { onClose: () => void, onSuccess: () => void }) {
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [medicalNotes, setMedicalNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetchApi('/patients/', {
        method: 'POST',
        body: JSON.stringify({ name, dob, medical_notes: medicalNotes }),
      });

      if (!res.ok) {
        throw new Error('Failed to create patient');
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand/20 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-brand/10">
          <h2 className="text-xl font-bold text-brand">Register New Patient</h2>
          <button onClick={onClose} className="p-2 -mr-2 rounded-xl text-brand/40 hover:text-brand hover:bg-brand/5">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          {error && <div className="text-sm text-emergency bg-emergency/10 p-3 rounded-lg">{error}</div>}
          
          <div>
            <label className="block text-sm font-medium text-brand/70 mb-1">Full Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-4 py-2 rounded-xl border border-brand/20 focus:outline-none focus:border-brand/50 focus:ring-1 focus:ring-brand/50"
              placeholder="e.g. John Doe"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-brand/70 mb-1">Date of Birth</label>
            <input
              type="date"
              required
              value={dob}
              onChange={e => setDob(e.target.value)}
              className="w-full px-4 py-2 rounded-xl border border-brand/20 focus:outline-none focus:border-brand/50 focus:ring-1 focus:ring-brand/50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-brand/70 mb-1">Medical Notes (Optional)</label>
            <textarea
              value={medicalNotes}
              onChange={e => setMedicalNotes(e.target.value)}
              className="w-full px-4 py-2 rounded-xl border border-brand/20 focus:outline-none focus:border-brand/50 focus:ring-1 focus:ring-brand/50 resize-none h-24"
              placeholder="e.g. Needs assistance with walking, takes medication at 8 AM"
            />
          </div>

          <div className="mt-4 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Register Patient'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
