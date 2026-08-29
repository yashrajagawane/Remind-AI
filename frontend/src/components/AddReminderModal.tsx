'use client';

import { useState, FormEvent } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { fetchApi } from '@/lib/api';

interface Props {
  patientId: string;
  onClose: () => void;
  onSuccess: () => void;
}

const CATEGORIES = [
  { value: 'medication', label: 'Medication' },
  { value: 'meal', label: 'Meal' },
  { value: 'hydration', label: 'Hydration' },
  { value: 'appointment', label: 'Appointment' },
  { value: 'activity', label: 'Activity' },
  { value: 'other', label: 'Other' },
];

const PRIORITIES = [
  { value: 'critical', label: 'Critical' },
  { value: 'high', label: 'High' },
  { value: 'normal', label: 'Normal' },
  { value: 'low', label: 'Low' },
];

const RECURRENCES = [
  { value: '', label: 'One-time' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
];

export function AddReminderModal({ patientId, onClose, onSuccess }: Props) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('medication');
  const [priority, setPriority] = useState('normal');
  const [scheduledAt, setScheduledAt] = useState('');
  const [recurrence, setRecurrence] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await fetchApi('/reminders/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: patientId,
          category,
          title,
          description: description || null,
          scheduled_at: new Date(scheduledAt).toISOString(),
          recurrence: recurrence || null,
          priority,
        }),
      });

      if (res.ok) {
        onSuccess();
        onClose();
      } else {
        const data = await res.json();
        setError(data.error?.message || 'Failed to create reminder');
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand/20 backdrop-blur-sm">
      <div className="bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-6 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-brand/70 hover:text-brand transition-colors"
        >
          <X size={20} />
        </button>

        <h2 className="text-xl font-semibold text-brand mb-1">Add Reminder</h2>
        <p className="text-sm text-brand/80 mb-6">Schedule a medication, meal, or appointment</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-emergency/10 text-emergency text-sm p-3 rounded-md">{error}</div>
          )}

          <div className="space-y-2">
            <Label htmlFor="rem-title">Title</Label>
            <Input
              id="rem-title"
              placeholder="e.g. Take Blood Pressure Pill"
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="rem-desc">Description (optional)</Label>
            <Input
              id="rem-desc"
              placeholder="e.g. 1 tablet with water"
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="rem-category">Category</Label>
              <select
                id="rem-category"
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="flex h-10 w-full rounded-md border border-brand/20 bg-slate-800 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              >
                {CATEGORIES.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rem-priority">Priority</Label>
              <select
                id="rem-priority"
                value={priority}
                onChange={e => setPriority(e.target.value)}
                className="flex h-10 w-full rounded-md border border-brand/20 bg-slate-800 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              >
                {PRIORITIES.map(p => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="rem-time">Date &amp; Time</Label>
              <Input
                id="rem-time"
                type="datetime-local"
                value={scheduledAt}
                onChange={e => setScheduledAt(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rem-recur">Recurrence</Label>
              <select
                id="rem-recur"
                value={recurrence}
                onChange={e => setRecurrence(e.target.value)}
                className="flex h-10 w-full rounded-md border border-brand/20 bg-slate-800 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              >
                {RECURRENCES.map(r => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
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
            <Button type="submit" className="flex-1" disabled={isLoading || !title || !scheduledAt}>
              {isLoading ? 'Creating...' : 'Add Reminder'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
