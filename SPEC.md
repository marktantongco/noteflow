# NoteFlow Recovery Application - Specification

## 1. Project Overview

**Project Name:** NoteFlow Recovery  
**Project Type:** Full-stack Next.js 15 SPA (Single Page Application)  
**Core Functionality:** A comprehensive substance use recovery companion app combining knowledge management, mood/trigger tracking, substance use logging, analytics visualization, and peer support.  
**Target Users:** Individuals in substance use recovery, addiction counselors, recovery coaches

---

## 2. UI/UX Specification

### Layout Structure

**Global Layout:**
- Fixed sidebar navigation (280px width on desktop, bottom tabs on mobile)
- Main content area with 12-column CSS Grid
- Responsive breakpoints: 375px (mobile), 768px (tablet), 1440px (desktop)

**Page Sections:**
- **Header:** App logo, user avatar, theme toggle, notification bell (64px height)
- **Sidebar:** Navigation tabs with icons and labels, collapsible on mobile
- **Main Content:** Dynamic content area with max-width 1200px, centered
- **Footer:** Minimal - version info, help links (only on settings page)

**Responsive Breakpoints:**
- Mobile: < 768px (bottom navigation, single column)
- Tablet: 768px - 1024px (collapsible sidebar, 2-column grid)
- Desktop: > 1024px (full sidebar, 12-column grid)

### Visual Design

**Color Palette:**
```
--background: #0a0a0f (deep space black)
--background-secondary: #12121a (card backgrounds)
--foreground: #fafafa (primary text)
--foreground-muted: #a1a1aa (secondary text)
--primary: #6366f1 (indigo-500 - main accent)
--primary-hover: #818cf8 (indigo-400)
--primary-glow: rgba(99, 102, 241, 0.3)
--secondary: #10b981 (emerald-500 - success/positive)
--destructive: #ef4444 (red-500 - alerts/negative)
--warning: #f59e0b (amber-500)
--accent-purple: #a855f7 (purple-500)
--accent-cyan: #06b6d4 (cyan-500)
--glass-bg: rgba(18, 18, 26, 0.7)
--glass-border: rgba(255, 255, 255, 0.08)
--glass-highlight: rgba(255, 255, 255, 0.05)
```

**Typography:**
- Primary Font: Inter (UI text)
- Monospace Font: JetBrains Mono (code, timestamps)
- Heading 1: 32px, font-weight 700, letter-spacing -0.02em
- Heading 2: 24px, font-weight 600
- Heading 3: 18px, font-weight 600
- Body: 15px, font-weight 400, line-height 1.6
- Small: 13px, font-weight 400
- Caption: 11px, font-weight 500, uppercase, letter-spacing 0.05em

**Spacing System:**
- Base unit: 4px
- xs: 4px, sm: 8px, md: 16px, lg: 24px, xl: 32px, 2xl: 48px

**Visual Effects:**
- Glassmorphism: backdrop-filter: blur(12px), background: var(--glass-bg)
- Card shadows: 0 4px 24px rgba(0, 0, 0, 0.4), border: 1px solid var(--glass-border)
- Glow effects: box-shadow: 0 0 20px var(--primary-glow)
- Hover transitions: 200ms ease-out
- Active states: scale(0.98) transform

### Components

**Navigation Tabs:**
- Icons: Lucide React icons (BookOpen, PenLine, FlaskConical, BarChart3, Users, Settings)
- Active state: Primary color background with glow, icon filled
- Inactive: Muted foreground, icon outline
- Hover: Background highlight

**Cards:**
- Background: var(--glass-bg)
- Border: 1px solid var(--glass-border)
- Border-radius: 16px
- Padding: 24px
- Hover: Border color transitions to var(--primary), subtle glow

**Buttons:**
- Primary: Gradient from var(--primary) to var(--accent-purple), white text
- Secondary: Glass background, border, muted text
- Ghost: Transparent, text only
- Sizes: sm (32px height), md (40px height), lg (48px height)
- Border-radius: 8px
- Ripple effect on click (Framer Motion)

**Form Inputs:**
- Background: rgba(0, 0, 0, 0.3)
- Border: 1px solid var(--glass-border)
- Focus: Border color var(--primary), glow effect
- Border-radius: 8px
- Padding: 12px 16px
- Height: 44px (touch-friendly)

**Badges:**
- Background: Glass or solid color variants
- Border-radius: 9999px (pill shape)
- Sizes: sm (20px), md (24px)

**Sliders (Mood/Craving):**
- Track: Glass background
- Fill: Gradient from var(--secondary) to var(--primary)
- Thumb: 24px circle, white with glow
- Labels: 1-10 scale below

**Charts:**
- Background: Transparent
- Grid lines: var(--glass-border)
- Data colors: var(--primary), var(--secondary), var(--accent-cyan), var(--accent-purple)
- Tooltips: Glassmorphism card

### Animations

**Page Transitions:**
- Exit: Fade out + slide up (200ms)
- Enter: Fade in + slide from bottom (300ms, ease-out)

**Staggered List Items:**
- Initial delay: 100ms
- Stagger: 50ms between items
- Animation: Fade in + slide up (400ms total)

**Micro-interactions:**
- Button hover: Scale 1.02, glow increase
- Card hover: Border glow, subtle lift
- Tab switch: Underline slide animation
- Toast: Slide in from right, auto-dismiss with progress

**Loading States:**
- Skeleton screens: Shimmer animation (gradient slide)
- Spinner: Rotating gradient ring (GSAP)

**3D Elements:**
- Card flip: rotateY(180deg), preserve-3d, 600ms
- Perspective: 1000px

---

## 3. Functionality Specification

### Core Features

#### 3.1 Knowledge Base (Notes)
- Markdown editor with split-pane (editor | preview)
- Document tree with folders (collapsible)
- Drag-and-drop reordering
- Full-text search (Dexie.js indexed)
- Auto-save with 500ms debounce
- Toolbar: Bold, italic, headings, lists, links, code blocks
- Folder management: Create, rename, delete, nest

#### 3.2 Recovery Journal
- Daily check-in form:
  - Date picker (defaults to today)
  - Mood slider (1-10) with emoji indicators
  - Craving intensity slider (1-10)
  - Trigger input with autocomplete from history
  - Coping strategies (multi-select from predefined + custom)
  - Notes textarea (markdown supported)
  - Voice-to-text button (Web Speech API)
- Edit existing entries
- View calendar of past entries

#### 3.3 Substance Use Tracker
- Quick-log form:
  - Substance name (autocomplete from history)
  - Quantity + unit (dropdown: mg, oz, ml, pills, etc.)
  - Timestamp (defaults to now, editable)
  - Location (text input, optional GPS)
  - Context (dropdown: Social, Solo, Unknown)
  - Emotions (multi-select: Happy, Sad, Anxious, Angry, Bored, etc.)
  - Photo attachment (camera or file, stored as Base64)
- History view (virtualized list for 10k+ records)
- Trend analysis charts

#### 3.4 Analytics Dashboard
- Date range selector (7d, 30d, 90d, 1y, all)
- Charts:
  - Line chart: Mood/craving trends over time
  - Pie chart: Trigger distribution
  - Bar chart: Coping strategy effectiveness
  - Heatmap: Check-in consistency by day/hour (D3.js)
- Insights panel with pattern recognition
- Export to PDF button

#### 3.5 Buddy System
- Search by anonymous username
- Send buddy request (max 5 buddies)
- Accept/decline requests
- Real-time chat with E2E encryption
- Progress sharing (streaks, milestones) - opt-in
- Pre-written nudges + custom message
- Block/report functionality

#### 3.6 Settings
- Theme toggle: Light / Dark / System
- Notification preferences:
  - Daily journal reminder (time picker)
  - Medication alerts
  - Custom activity reminders
  - Quiet hours
  - Push notification toggle
- Data management:
  - Export all data (JSON)
  - Import data
  - Clear all data (with confirmation modal)
- About section: Version, credits, help links

### User Interactions & Flows

**First Launch:**
1. Welcome screen with app introduction
2. Optional: Load sample data for demo
3. Sign up / Sign in prompt
4. Onboarding: Set recovery goal, notification preferences

**Daily Use:**
1. Open app → Dashboard overview
2. Quick action: Check-in, Log substance, Add note
3. View progress charts
4. Interact with buddy (if connected)

**Data Entry:**
1. Fill form → Validation (inline errors)
2. Submit → Success toast + auto-save
3. Navigate away → Debounced save

### Data Handling

**Local Storage (Dexie.js - IndexedDB):**
- User-scoped stores (prefixed by userId)
- Tables: users, entries, logs, notes, folders, buddies, messages
- Indexes: date, createdAt, userId, folderId
- Sync status tracking

**API Calls:**
- AI insights endpoint (mock)
- Buddy system (mock WebSocket)
- FCM token registration
- All protected by NextAuth session

**Offline Support:**
- Service Worker caches app shell
- IndexedDB stores all user data
- Network queue for pending requests
- Sync on reconnect

### Edge Cases

- No internet: Full offline functionality
- Large data sets: Virtualized lists, pagination
- Auth expiry: Graceful re-auth prompt
- Failed requests: Retry with exponential backoff
- Invalid imports: Validation with detailed errors
- Concurrent edits: Last-write-wins with timestamp

---

## 4. Technical Architecture

### API Routes

```
/api/auth/[...nextauth]   - NextAuth.js configuration
/api/insights             - AI analysis endpoint (POST)
/api/buddies              - Buddy CRUD operations
/api/messages             - Message sending/receiving
/api/notifications        - FCM token management
```

### Data Models

See detailed TypeScript interfaces in SPEC.md section above.

### Security

- All API routes validate session
- Dexie stores scoped to userId
- No PII in AI prompts
- E2E encryption for buddy messages (simulated with base64 for demo)
- CSRF protection via NextAuth

---

## 5. Acceptance Criteria

### Visual Checkpoints
- [ ] Glassmorphism cards render with blur and transparency
- [ ] Theme toggle switches between light/dark/system
- [ ] All animations run at 60fps
- [ ] Responsive layout works at all breakpoints
- [ ] Color contrast meets WCAG AA (4.5:1)

### Functional Checkpoints
- [ ] Notes: Create, edit, delete, search, organize in folders
- [ ] Journal: Daily check-in with all fields, edit past entries
- [ ] Tracker: Log substances with all context, view history
- [ ] Analytics: All chart types render with data, date filtering works
- [ ] Buddy: Search, request, accept, chat functionality
- [ ] Notifications: Push notification preferences save and display
- [ ] Settings: Theme, export, import, clear data work

### Performance Checkpoints
- [ ] Initial render < 1.5s
- [ ] 10,000 records load without lag (virtualization)
- [ ] Bundle size < 200KB (excluding vendor)
- [ ] Lighthouse score > 90

### Accessibility Checkpoints
- [ ] Keyboard navigation works throughout
- [ ] Screen reader announces all content
- [ ] Reduced motion disables animations
- [ ] Focus indicators visible

### Offline Checkpoints
- [ ] App loads without network
- [ ] All CRUD operations work offline
- [ ] Data persists across sessions

---

## 6. File Structure

```
/src/
  /app/
    page.tsx                    # Main SPA with tabs
    layout.tsx                  # Root layout with providers
    globals.css                 # Tailwind + custom styles
    /api/
      /auth/[...nextauth]/route.ts
      /insights/route.ts
      /buddies/route.ts
      /messages/route.ts
      /notifications/route.ts
  /components/
    /notes/
    /journal/
    /tracker/
    /analytics/
    /buddy/
    /settings/
    /shared/
  /lib/
    db.ts
    context.tsx
    animations.ts
    fcm.ts
    utils.ts
    constants.ts
  /hooks/
  /types/
  /public/
    manifest.json
    sw.js
    icons/
```
