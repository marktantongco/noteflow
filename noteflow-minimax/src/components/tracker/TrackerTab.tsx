'use client';

import { useState, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Plus, Trash2, MapPin, Image, X } from 'lucide-react';
import { db } from '@/lib/db';
import { Button, Input, Card, Select, Textarea, Badge, useToast, Dialog } from '@/components/shared';
import { useUser } from '@/lib/context';
import { SUBSTANCE_UNITS, EMOTIONS } from '@/lib/constants';
import { formatDateTime, debounce } from '@/lib/utils';
import type { SubstanceLog } from '@/types';

export function TrackerTab() {
  const { user } = useUser();
  const { showToast } = useToast();
  const [showLogForm, setShowLogForm] = useState(false);
  const [substance, setSubstance] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState('mg');
  const [timestamp, setTimestamp] = useState(new Date().toISOString().slice(0, 16));
  const [location, setLocation] = useState('');
  const [context, setContext] = useState<'Social' | 'Solo' | 'Unknown'>('Unknown');
  const [emotions, setEmotions] = useState<string[]>([]);
  const [photo, setPhoto] = useState<string | null>(null);

  const logs = useLiveQuery(
    () => user ? db.logs.where('userId').equals(user.id).reverse().sortBy('timestamp') : [],
    [user]
  );

  const recentSubstances = [...new Set(logs?.map(l => l.substance) || [])];

  const unitOptions = SUBSTANCE_UNITS.map(u => ({ value: u, label: u }));
  const contextOptions = [
    { value: 'Social', label: 'Social' },
    { value: 'Solo', label: 'Solo' },
    { value: 'Unknown', label: 'Unknown' },
  ];

  const toggleEmotion = (emotion: string) => {
    setEmotions(prev =>
      prev.includes(emotion) ? prev.filter(e => e !== emotion) : [...prev, emotion]
    );
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const saveLog = async () => {
    if (!user || !substance) return;

    const log: SubstanceLog = {
      id: crypto.randomUUID(),
      userId: user.id,
      substance,
      quantity,
      unit,
      timestamp: new Date(timestamp).toISOString(),
      location,
      context,
      emotions,
      photo: photo || undefined,
    };

    await db.logs.put(log);
    showToast('Log saved', 'success');
    resetForm();
  };

  const resetForm = () => {
    setSubstance('');
    setQuantity(1);
    setUnit('mg');
    setTimestamp(new Date().toISOString().slice(0, 16));
    setLocation('');
    setContext('Unknown');
    setEmotions([]);
    setPhoto(null);
    setShowLogForm(false);
  };

  const deleteLog = async (id: string) => {
    await db.logs.delete(id);
    showToast('Log deleted', 'success');
  };

  const groupedLogs = logs?.reduce((acc, log) => {
    const date = log.timestamp.split('T')[0];
    if (!acc[date]) acc[date] = [];
    acc[date].push(log);
    return acc;
  }, {} as Record<string, SubstanceLog[]>);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Substance Tracker</h2>
        <Button onClick={() => setShowLogForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Quick Log
        </Button>
      </div>

      <Dialog open={showLogForm} onClose={resetForm} title="Quick Log" className="max-w-2xl">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Substance"
              placeholder="e.g., Alcohol, Nicotine..."
              value={substance}
              onChange={e => setSubstance(e.target.value)}
              list="substances"
            />
            <datalist id="substances">
              {recentSubstances.map(s => (
                <option key={s} value={s} />
              ))}
            </datalist>
            <div className="flex gap-2">
              <Input
                label="Quantity"
                type="number"
                min={0}
                value={quantity}
                onChange={e => setQuantity(parseFloat(e.target.value))}
                className="flex-1"
              />
              <Select
                label="Unit"
                options={unitOptions}
                value={unit}
                onChange={setUnit}
                className="w-24"
              />
            </div>
            <Input
              label="Date & Time"
              type="datetime-local"
              value={timestamp}
              onChange={e => setTimestamp(e.target.value)}
            />
          </div>

          <Input
            label="Location (optional)"
            placeholder="Where did this happen?"
            value={location}
            onChange={e => setLocation(e.target.value)}
          />

          <Select
            label="Context"
            options={contextOptions}
            value={context}
            onChange={v => setContext(v as 'Social' | 'Solo' | 'Unknown')}
          />

          <div>
            <label className="block text-sm font-medium text-foreground-muted mb-2">
              Emotions
            </label>
            <div className="flex flex-wrap gap-2">
              {EMOTIONS.map(emotion => (
                <button
                  key={emotion}
                  onClick={() => toggleEmotion(emotion)}
                  className={`px-3 py-1 rounded-full text-sm transition-all ${
                    emotions.includes(emotion)
                      ? 'bg-primary text-white'
                      : 'glass border border-glass-border hover:border-primary'
                  }`}
                >
                  {emotion}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground-muted mb-2">
              Photo (optional)
            </label>
            <div className="flex items-center gap-3">
              <label className="cursor-pointer glass px-4 py-2 rounded-lg hover:bg-glass-highlight transition-colors flex items-center gap-2">
                <Image className="w-4 h-4" />
                Upload Photo
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>
              {photo && (
                <div className="relative">
                  <img src={photo} alt="Upload" className="w-16 h-16 object-cover rounded" />
                  <button
                    onClick={() => setPhoto(null)}
                    className="absolute -top-2 -right-2 p-1 bg-destructive rounded-full"
                  >
                    <X className="w-3 h-3 text-white" />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="secondary" onClick={resetForm}>Cancel</Button>
            <Button onClick={saveLog}>Save Log</Button>
          </div>
        </div>
      </Dialog>

      <div className="space-y-4">
        {groupedLogs && Object.keys(groupedLogs).length > 0 ? (
          Object.entries(groupedLogs).map(([date, dayLogs]) => (
            <div key={date}>
              <h3 className="text-sm font-medium text-foreground-muted mb-2">
                {new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </h3>
              <div className="space-y-2">
                {dayLogs.map(log => (
                  <Card key={log.id} className="flex items-start gap-4 p-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{log.substance}</span>
                        <Badge variant="primary">{log.quantity} {log.unit}</Badge>
                      </div>
                      <p className="text-sm text-foreground-muted">
                        {formatDateTime(log.timestamp)}
                      </p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <Badge>{log.context}</Badge>
                        {log.location && (
                          <Badge variant="secondary">
                            <MapPin className="w-3 h-3 mr-1" />
                            {log.location}
                          </Badge>
                        )}
                        {log.emotions.slice(0, 3).map(e => (
                          <Badge key={e} variant="default">{e}</Badge>
                        ))}
                      </div>
                    </div>
                    {log.photo && (
                      <img
                        src={log.photo}
                        alt="Log"
                        className="w-16 h-16 object-cover rounded"
                      />
                    )}
                    <button
                      onClick={() => deleteLog(log.id)}
                      className="p-2 hover:bg-destructive/20 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </button>
                  </Card>
                ))}
              </div>
            </div>
          ))
        ) : (
          <Card className="text-center py-12">
            <p className="text-foreground-muted">No logs yet. Start tracking your progress!</p>
          </Card>
        )}
      </div>
    </div>
  );
}
