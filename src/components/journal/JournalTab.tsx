'use client';

import { useState, useEffect, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Calendar, Save, Mic, MicOff, X, Plus } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { db } from '@/lib/db';
import { Button, Input, Card, Slider, Textarea, Badge, useToast, Dialog } from '@/components/shared';
import { useUser } from '@/lib/context';
import { PREDEFINED_TRIGGERS, PREDEFINED_COPING_STRATEGIES } from '@/lib/constants';
import { formatDate, debounce } from '@/lib/utils';
import type { RecoveryEntry } from '@/types';

export function JournalTab() {
  const { user } = useUser();
  const { showToast } = useToast();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [mood, setMood] = useState(5);
  const [cravingLevel, setCravingLevel] = useState(1);
  const [triggers, setTriggers] = useState<string[]>([]);
  const [copingStrategies, setCopingStrategies] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [triggerInput, setTriggerInput] = useState('');
  const [showNewStrategy, setShowNewStrategy] = useState(false);
  const [newStrategy, setNewStrategy] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [editingEntry, setEditingEntry] = useState<RecoveryEntry | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  const entries = useLiveQuery(
    () => user ? db.entries.where('userId').equals(user.id).toArray() : [],
    [user]
  );

  const recentTriggers = [...new Set(entries?.flatMap(e => e.triggers) || [])].slice(0, 10);
  const recentStrategies = [...new Set(entries?.flatMap(e => e.copingStrategies) || [])].slice(0, 10);

  useEffect(() => {
    if (entries && selectedDate) {
      const existingEntry = entries.find(e => e.date.split('T')[0] === selectedDate);
      if (existingEntry) {
        setEditingEntry(existingEntry);
        setMood(existingEntry.mood);
        setCravingLevel(existingEntry.cravingLevel);
        setTriggers(existingEntry.triggers);
        setCopingStrategies(existingEntry.copingStrategies);
        setNotes(existingEntry.notes);
        setHasChanges(false);
      } else {
        setEditingEntry(null);
        setMood(5);
        setCravingLevel(1);
        setTriggers([]);
        setCopingStrategies([]);
        setNotes('');
        setHasChanges(false);
      }
    }
  }, [selectedDate, entries]);

  const saveEntry = async (showNotification = false) => {
    if (!user) return;
    const now = new Date().toISOString();
    const entry: RecoveryEntry = {
      id: editingEntry?.id || crypto.randomUUID(),
      userId: user.id,
      date: selectedDate,
      mood,
      cravingLevel,
      triggers,
      copingStrategies,
      notes,
      createdAt: editingEntry?.createdAt || now,
      updatedAt: now,
    };

    await db.entries.put(entry);
    setEditingEntry(entry);
    setHasChanges(false);
    if (showNotification) {
      showToast('Journal entry saved', 'success');
    }
  };

  const handleMoodChange = (value: number) => {
    setMood(value);
    setHasChanges(true);
  };

  const handleCravingChange = (value: number) => {
    setCravingLevel(value);
    setHasChanges(true);
  };

  const toggleTrigger = (trigger: string) => {
    setTriggers(prev =>
      prev.includes(trigger) ? prev.filter(t => t !== trigger) : [...prev, trigger]
    );
    setHasChanges(true);
  };

  const toggleStrategy = (strategy: string) => {
    setCopingStrategies(prev =>
      prev.includes(strategy) ? prev.filter(s => s !== strategy) : [...prev, strategy]
    );
    setHasChanges(true);
  };

  const addCustomTrigger = () => {
    if (triggerInput && !triggers.includes(triggerInput)) {
      setTriggers(prev => [...prev, triggerInput]);
      setTriggerInput('');
      setHasChanges(true);
    }
  };

  const addCustomStrategy = () => {
    if (newStrategy && !copingStrategies.includes(newStrategy)) {
      setCopingStrategies(prev => [...prev, newStrategy]);
      setNewStrategy('');
      setShowNewStrategy(false);
      setHasChanges(true);
    }
  };

  const handleNotesChange = (value: string) => {
    setNotes(value);
    setHasChanges(true);
  };

  const startVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      showToast('Voice input not supported in this browser', 'error');
      return;
    }

    const SpeechRecognitionAPI = (window as unknown as { SpeechRecognition?: new () => unknown; webkitSpeechRecognition?: new () => unknown }).SpeechRecognition || (window as unknown as { webkitSpeechRecognition?: new () => unknown }).webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recognition = new SpeechRecognitionAPI() as any;
    
    recognition.continuous = true;
    recognition.interimResults = true;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setNotes(prev => prev + ' ' + transcript);
    };

    recognition.onerror = () => {
      setIsListening(false);
      showToast('Voice input error', 'error');
    };

    recognition.onend = () => setIsListening(false);
    recognition.start();
    setIsListening(true);
  };

  const allTriggers = [...new Set([...PREDEFINED_TRIGGERS, ...recentTriggers])];
  const allStrategies = [...new Set([...PREDEFINED_COPING_STRATEGIES, ...recentStrategies])];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Daily Check-in</h2>
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-foreground-muted" />
          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="glass-input px-3 py-2"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <Slider
            label="How are you feeling today?"
            value={mood}
            onChange={handleMoodChange}
            min={1}
            max={10}
          />
        </Card>

        <Card>
          <Slider
            label="Craving Intensity"
            value={cravingLevel}
            onChange={handleCravingChange}
            min={1}
            max={10}
          />
        </Card>
      </div>

      <Card>
        <h3 className="font-medium mb-3">Triggers</h3>
        <div className="flex flex-wrap gap-2 mb-3">
          {allTriggers.slice(0, 15).map(trigger => (
            <button
              key={trigger}
              onClick={() => toggleTrigger(trigger)}
              className={`px-3 py-1 rounded-full text-sm transition-all ${
                triggers.includes(trigger)
                  ? 'bg-primary text-white'
                  : 'glass border border-glass-border hover:border-primary'
              }`}
            >
              {trigger}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Add custom trigger..."
            value={triggerInput}
            onChange={e => setTriggerInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addCustomTrigger()}
            className="flex-1"
          />
          <Button size="sm" onClick={addCustomTrigger}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </Card>

      <Card>
        <h3 className="font-medium mb-3">Coping Strategies Used</h3>
        <div className="flex flex-wrap gap-2 mb-3">
          {allStrategies.slice(0, 15).map(strategy => (
            <button
              key={strategy}
              onClick={() => toggleStrategy(strategy)}
              className={`px-3 py-1 rounded-full text-sm transition-all ${
                copingStrategies.includes(strategy)
                  ? 'bg-secondary text-white'
                  : 'glass border border-glass-border hover:border-secondary'
              }`}
            >
              {strategy}
            </button>
          ))}
        </div>
        <Button variant="ghost" size="sm" onClick={() => setShowNewStrategy(true)}>
          <Plus className="w-4 h-4 mr-1" />
          Add Custom Strategy
        </Button>
      </Card>

      <Card>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium">Notes</h3>
          <Button
            variant={isListening ? 'destructive' : 'ghost'}
            size="sm"
            onClick={isListening ? () => setIsListening(false) : startVoiceInput}
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </Button>
        </div>
        <Textarea
          placeholder="Write your thoughts... (Markdown supported)"
          value={notes}
          onChange={e => handleNotesChange(e.target.value)}
          className="min-h-[150px]"
        />
        {notes && (
          <div className="mt-4 p-4 glass rounded-lg">
            <p className="text-xs text-foreground-muted mb-2">Preview:</p>
            <div className="prose prose-invert prose-sm">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{notes}</ReactMarkdown>
            </div>
          </div>
        )}
      </Card>

      <div className="flex justify-end">
        <Button onClick={() => saveEntry(true)} disabled={!hasChanges}>
          <Save className="w-4 h-4 mr-2" />
          {hasChanges ? 'Save Entry' : 'Saved'}
        </Button>
      </div>

      <Dialog open={showNewStrategy} onClose={() => setShowNewStrategy(false)} title="Add Custom Strategy">
        <div className="space-y-4">
          <Input
            placeholder="Strategy name"
            value={newStrategy}
            onChange={e => setNewStrategy(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addCustomStrategy()}
          />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowNewStrategy(false)}>Cancel</Button>
            <Button onClick={addCustomStrategy}>Add</Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
