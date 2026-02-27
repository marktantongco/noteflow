export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  createdAt: string;
  notificationPrefs: NotificationSettings;
}

export interface NotificationSettings {
  journalReminder: boolean;
  journalReminderTime: string;
  medicationAlerts: boolean;
  customReminders: CustomReminder[];
  quietHoursStart: string;
  quietHoursEnd: string;
  pushEnabled: boolean;
}

export interface CustomReminder {
  id: string;
  title: string;
  time: string;
  days: number[];
  enabled: boolean;
}

export interface RecoveryEntry {
  id: string;
  userId: string;
  date: string;
  mood: number;
  cravingLevel: number;
  triggers: string[];
  copingStrategies: string[];
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface SubstanceLog {
  id: string;
  userId: string;
  substance: string;
  quantity: number;
  unit: string;
  timestamp: string;
  location: string;
  context: 'Social' | 'Solo' | 'Unknown';
  emotions: string[];
  photo?: string;
}

export interface NoteDocument {
  id: string;
  userId: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  folderId: string | null;
  order: number;
}

export interface NoteFolder {
  id: string;
  userId: string;
  name: string;
  parentId: string | null;
  order: number;
  createdAt: string;
}

export interface BuddyConnection {
  id: string;
  requesterId: string;
  recipientId: string;
  requesterName: string;
  recipientName: string;
  status: 'pending' | 'accepted' | 'blocked';
  createdAt: string;
}

export interface Message {
  id: string;
  connectionId: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
  encrypted: boolean;
  read: boolean;
}

export interface InsightData {
  entries: RecoveryEntry[];
  logs: SubstanceLog[];
  analysisType: 'patterns' | 'risk' | 'suggestions';
}

export interface InsightResponse {
  insights: string[];
  patterns: { label: string; value: number }[];
  riskLevel: number;
}

export type Theme = 'light' | 'dark' | 'system';

export type TabId = 'notes' | 'journal' | 'tracker' | 'analytics' | 'buddy' | 'settings';

export interface AppState {
  user: User | null;
  theme: Theme;
  activeTab: TabId;
  isLoading: boolean;
  isOffline: boolean;
}

export type AppAction =
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_THEME'; payload: Theme }
  | { type: 'SET_ACTIVE_TAB'; payload: TabId }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_OFFLINE'; payload: boolean };
