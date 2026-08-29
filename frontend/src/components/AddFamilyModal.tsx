'use client';

import { useState, useRef, FormEvent } from 'react';
import { X, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { fetchApi } from '@/lib/api';

interface Props {
  patientId: string;
  onClose: () => void;
  onSuccess: () => void;
}

const RELATIONSHIP_OPTIONS = [
  'Son', 'Daughter', 'Spouse', 'Wife', 'Husband',
  'Brother', 'Sister', 'Father', 'Mother',
  'Friend', 'Doctor', 'Nurse', 'Caregiver', 'Other',
];

export function AddFamilyModal({ patientId, onClose, onSuccess }: Props) {
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [phone, setPhone] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhoto(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const formData = new FormData();
    formData.append('patient_id', patientId);
    formData.append('name', name);
    formData.append('relationship', relationship);
    if (phone) formData.append('phone_number', phone);
    if (photo) formData.append('photo', photo);

    try {
      const res = await fetchApi('/family/', {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        onSuccess();
        onClose();
      } else {
        const data = await res.json();
        setError(data.error?.message || 'Failed to add family member');
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand/20 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-brand/40 hover:text-brand transition-colors"
        >
          <X size={20} />
        </button>

        <h2 className="text-xl font-semibold text-brand mb-1">Add Family Member</h2>
        <p className="text-sm text-brand/60 mb-6">Add someone the patient should recognise</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-emergency/10 text-emergency text-sm p-3 rounded-md">{error}</div>
          )}

          {/* Photo upload */}
          <div
            className="flex flex-col items-center justify-center border-2 border-dashed border-brand/20 rounded-xl p-4 cursor-pointer hover:border-brand/40 transition-colors"
            onClick={() => fileRef.current?.click()}
          >
            {preview ? (
              <img src={preview} alt="Preview" className="w-20 h-20 rounded-full object-cover" />
            ) : (
              <>
                <Upload size={24} className="text-brand/40 mb-2" />
                <p className="text-sm text-brand/60">Click to upload photo</p>
                <p className="text-xs text-brand/40">JPEG, PNG, WEBP · max 10MB</p>
              </>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="fm-name">Full Name</Label>
            <Input
              id="fm-name"
              placeholder="e.g. Priya Sharma"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="fm-rel">Relationship</Label>
            <select
              id="fm-rel"
              value={relationship}
              onChange={e => setRelationship(e.target.value)}
              required
              className="flex h-10 w-full rounded-md border border-brand/20 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              <option value="" disabled>Select relationship…</option>
              {RELATIONSHIP_OPTIONS.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fm-phone">Phone (optional)</Label>
            <Input
              id="fm-phone"
              placeholder="+91 98765 43210"
              value={phone}
              onChange={e => setPhone(e.target.value)}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={isLoading || !name || !relationship}>
              {isLoading ? 'Saving…' : 'Add Person'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
