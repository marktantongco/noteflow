import Dexie, { Table } from 'dexie';
import type {
  User,
  RecoveryEntry,
  SubstanceLog,
  NoteDocument,
  NoteFolder,
  BuddyConnection,
  Message,
} from '@/types';

export class NoteFlowDB extends Dexie {
  users!: Table<User>;
  entries!: Table<RecoveryEntry>;
  logs!: Table<SubstanceLog>;
  notes!: Table<NoteDocument>;
  folders!: Table<NoteFolder>;
  buddies!: Table<BuddyConnection>;
  messages!: Table<Message>;

  constructor() {
    super('NoteFlowDB');
    this.version(1).stores({
      users: 'id, email',
      entries: 'id, userId, date, createdAt',
      logs: 'id, userId, timestamp, substance',
      notes: 'id, userId, folderId, createdAt, *title',
      folders: 'id, userId, parentId',
      buddies: 'id, requesterId, recipientId, status',
      messages: 'id, connectionId, timestamp',
    });
  }
}

export const db = new NoteFlowDB();

db.on('ready', async () => {
  console.log('NoteFlowDB ready');
});

export async function getUserData(userId: string) {
  const [entries, logs, notes, folders, buddies] = await Promise.all([
    db.entries.where('userId').equals(userId).toArray(),
    db.logs.where('userId').equals(userId).toArray(),
    db.notes.where('userId').equals(userId).toArray(),
    db.folders.where('userId').equals(userId).toArray(),
    db.buddies
      .where('requesterId')
      .equals(userId)
      .or('recipientId')
      .equals(userId)
      .toArray(),
  ]);

  return { entries, logs, notes, folders, buddies };
}

export async function clearUserData(userId: string) {
  await Promise.all([
    db.entries.where('userId').equals(userId).delete(),
    db.logs.where('userId').equals(userId).delete(),
    db.notes.where('userId').equals(userId).delete(),
    db.folders.where('userId').equals(userId).delete(),
    db.buddies.where('requesterId').equals(userId).delete(),
    db.buddies.where('recipientId').equals(userId).delete(),
  ]);
}

export async function exportUserData(userId: string) {
  const data = await getUserData(userId);
  return JSON.stringify(data, null, 2);
}

export async function importUserData(userId: string, jsonData: string) {
  const data = JSON.parse(jsonData);

  await db.transaction('rw', [db.entries, db.logs, db.notes, db.folders], async () => {
    if (data.entries) {
      for (const entry of data.entries) {
        await db.entries.put({ ...entry, userId });
      }
    }
    if (data.logs) {
      for (const log of data.logs) {
        await db.logs.put({ ...log, userId });
      }
    }
    if (data.notes) {
      for (const note of data.notes) {
        await db.notes.put({ ...note, userId });
      }
    }
    if (data.folders) {
      for (const folder of data.folders) {
        await db.folders.put({ ...folder, userId });
      }
    }
  });
}

export async function searchNotes(userId: string, query: string) {
  const lowerQuery = query.toLowerCase();
  const notes = await db.notes.where('userId').equals(userId).toArray();
  return notes.filter(
    (note) =>
      note.title.toLowerCase().includes(lowerQuery) ||
      note.content.toLowerCase().includes(lowerQuery)
  );
}

export async function getEntriesInRange(userId: string, start: Date, end: Date) {
  return db.entries
    .where('userId')
    .equals(userId)
    .and((entry) => {
      const date = new Date(entry.date);
      return date >= start && date <= end;
    })
    .toArray();
}

export async function getLogsInRange(userId: string, start: Date, end: Date) {
  return db.logs
    .where('userId')
    .equals(userId)
    .and((log) => {
      const date = new Date(log.timestamp);
      return date >= start && date <= end;
    })
    .toArray();
}

export async function getBuddyMessages(connectionId: string) {
  return db.messages
    .where('connectionId')
    .equals(connectionId)
    .sortBy('timestamp');
}

export async function addMessage(message: Omit<Message, 'id'>) {
  const id = crypto.randomUUID();
  await db.messages.put({ ...message, id });
  return id;
}
