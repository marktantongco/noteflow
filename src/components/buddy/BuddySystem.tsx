'use client';

import { useState, useEffect, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  Search,
  Send,
  MoreVertical,
  UserPlus,
  Check,
  X,
  MessageCircle,
  Heart,
  Share2,
  Ban,
  Flag,
} from 'lucide-react';
import { db, addMessage, getBuddyMessages } from '@/lib/db';
import { Button, Input, Card, Badge, useToast, Dialog } from '@/components/shared';
import { useUser } from '@/lib/context';
import { NUDGE_MESSAGES } from '@/lib/constants';
import { formatTime, encryptMessage, decryptMessage } from '@/lib/utils';
import type { BuddyConnection, Message } from '@/types';

export function BuddySystem() {
  const { user } = useUser();
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBuddy, setSelectedBuddy] = useState<BuddyConnection | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [showNudgeDialog, setShowNudgeDialog] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const buddies = useLiveQuery(
    () => user
      ? db.buddies
          .where('status')
          .equals('accepted')
          .and(b => b.requesterId === user.id || b.recipientId === user.id)
          .toArray()
      : [],
    [user]
  );

  const pendingRequests = useLiveQuery(
    () => user
      ? db.buddies
          .where('status')
          .equals('pending')
          .and(b => b.recipientId === user.id)
          .toArray()
      : [],
    [user]
  );

  useEffect(() => {
    if (selectedBuddy) {
      loadMessages(selectedBuddy.id);
    }
  }, [selectedBuddy]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadMessages = async (connectionId: string) => {
    const msgs = await getBuddyMessages(connectionId);
    setMessages(msgs);
  };

  const sendRequest = async () => {
    if (!user || !searchQuery) return;
    
    const mockBuddy: BuddyConnection = {
      id: crypto.randomUUID(),
      requesterId: user.id,
      recipientId: crypto.randomUUID(),
      requesterName: user.name,
      recipientName: searchQuery,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    await db.buddies.put(mockBuddy);
    showToast('Buddy request sent', 'success');
    setSearchQuery('');
    setShowSearch(false);
  };

  const acceptRequest = async (request: BuddyConnection) => {
    await db.buddies.put({ ...request, status: 'accepted' });
    showToast('Buddy request accepted', 'success');
  };

  const declineRequest = async (request: BuddyConnection) => {
    await db.buddies.delete(request.id);
    showToast('Buddy request declined', 'success');
  };

  const sendMessage = async () => {
    if (!user || !selectedBuddy || !newMessage) return;

    const encrypted = encryptMessage(newMessage);
    const message: Omit<Message, 'id'> = {
      connectionId: selectedBuddy.id,
      senderId: user.id,
      senderName: user.name,
      content: encrypted,
      timestamp: new Date().toISOString(),
      encrypted: true,
      read: false,
    };

    await addMessage(message);
    setNewMessage('');
    loadMessages(selectedBuddy.id);
  };

  const sendNudge = async (message: string) => {
    if (!user || !selectedBuddy) return;

    const encrypted = encryptMessage(message);
    const msg: Omit<Message, 'id'> = {
      connectionId: selectedBuddy.id,
      senderId: user.id,
      senderName: user.name,
      content: encrypted,
      timestamp: new Date().toISOString(),
      encrypted: true,
      read: false,
    };

    await addMessage(msg);
    loadMessages(selectedBuddy.id);
    setShowNudgeDialog(false);
    showToast('Nudge sent!', 'success');
  };

  const getBuddyName = (buddy: BuddyConnection) => {
    if (!user) return '';
    return buddy.requesterId === user.id ? buddy.recipientName : buddy.requesterName;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-8rem)]">
      <div className="lg:col-span-1 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Buddies</h2>
          <Button size="sm" onClick={() => setShowSearch(true)}>
            <UserPlus className="w-4 h-4 mr-1" />
            Add
          </Button>
        </div>

        {pendingRequests && pendingRequests.length > 0 && (
          <Card className="p-3">
            <p className="text-sm font-medium mb-2">Pending Requests</p>
            {pendingRequests.map(request => (
              <div key={request.id} className="flex items-center justify-between py-2">
                <span className="text-sm">{request.requesterName}</span>
                <div className="flex gap-1">
                  <button
                    onClick={() => acceptRequest(request)}
                    className="p-1 rounded bg-secondary/20 hover:bg-secondary/40"
                  >
                    <Check className="w-4 h-4 text-secondary" />
                  </button>
                  <button
                    onClick={() => declineRequest(request)}
                    className="p-1 rounded bg-destructive/20 hover:bg-destructive/40"
                  >
                    <X className="w-4 h-4 text-destructive" />
                  </button>
                </div>
              </div>
            ))}
          </Card>
        )}

        <div className="flex-1 overflow-auto space-y-2">
          {buddies?.map(buddy => (
            <button
              key={buddy.id}
              onClick={() => setSelectedBuddy(buddy)}
              className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                selectedBuddy?.id === buddy.id
                  ? 'bg-primary/20 border border-primary'
                  : 'hover:bg-glass-highlight'
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent-purple flex items-center justify-center text-white font-medium">
                {getBuddyName(buddy)[0].toUpperCase()}
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium">{getBuddyName(buddy)}</p>
                <p className="text-xs text-foreground-muted">Buddy</p>
              </div>
              <MessageCircle className="w-4 h-4 text-foreground-muted" />
            </button>
          ))}
          {(!buddies || buddies.length === 0) && (
            <p className="text-center text-foreground-muted py-8">
              No buddies yet. Add someone to get started!
            </p>
          )}
        </div>
      </div>

      <div className="lg:col-span-2">
        {selectedBuddy ? (
          <Card className="h-full flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-glass-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent-purple flex items-center justify-center text-white font-medium">
                  {getBuddyName(selectedBuddy)[0].toUpperCase()}
                </div>
                <div>
                  <p className="font-medium">{getBuddyName(selectedBuddy)}</p>
                  <p className="text-xs text-foreground-muted">Connected</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={() => setShowNudgeDialog(true)}>
                  <Heart className="w-4 h-4 mr-1" />
                  Nudge
                </Button>
                <Button variant="ghost" size="sm">
                  <Share2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-4 space-y-3">
              {messages.map(msg => {
                const isOwn = msg.senderId === user?.id;
                const content = msg.encrypted ? decryptMessage(msg.content) : msg.content;
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] p-3 rounded-lg ${
                        isOwn
                          ? 'bg-primary text-white'
                          : 'glass border border-glass-border'
                      }`}
                    >
                      <p className="text-sm">{content}</p>
                      <p className={`text-xs mt-1 ${isOwn ? 'text-white/60' : 'text-foreground-muted'}`}>
                        {formatTime(msg.timestamp)}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t border-glass-border">
              <div className="flex gap-2">
                <Input
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendMessage()}
                  className="flex-1"
                />
                <Button onClick={sendMessage}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        ) : (
          <Card className="h-full flex items-center justify-center">
            <p className="text-foreground-muted">Select a buddy to start chatting</p>
          </Card>
        )}
      </div>

      <Dialog open={showSearch} onClose={() => setShowSearch(false)} title="Find Buddy">
        <div className="space-y-4">
          <p className="text-sm text-foreground-muted">
            Search for other users by their anonymous username. They won't see your email or personal info.
          </p>
          <Input
            placeholder="Enter username..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendRequest()}
          />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowSearch(false)}>Cancel</Button>
            <Button onClick={sendRequest} disabled={!searchQuery}>Send Request</Button>
          </div>
        </div>
      </Dialog>

      <Dialog open={showNudgeDialog} onClose={() => setShowNudgeDialog(false)} title="Send Encouragement">
        <div className="space-y-3">
          {NUDGE_MESSAGES.map((msg, i) => (
            <button
              key={i}
              onClick={() => sendNudge(msg)}
              className="w-full p-3 text-left glass rounded-lg hover:bg-glass-highlight transition-colors"
            >
              {msg}
            </button>
          ))}
          <Button
            variant="secondary"
            className="w-full"
            onClick={() => setShowNudgeDialog(false)}
          >
            Cancel
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
