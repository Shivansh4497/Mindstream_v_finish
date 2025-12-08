# Mindstream User Flows - Complete Analysis

> **Document Type:** Comprehensive User Flow Analysis  
> **Last Updated:** December 6, 2025 (v6.2 - MVP Verification Complete)  
> **Coverage:** All user interactions, redirections, and navigation paths  
> **Coverage:** All user interactions, redirections, and navigation paths

---

## Overview

Mindstream is structured around **4 main navigation tabs** plus **Settings**, with two distinct onboarding paths and a progressive disclosure system. This document maps every possible user flow.

---

## 1. Authentication Flows

### 1.1 Initial App Load
```
User opens app
    ↓
Check auth status (AuthContext)
    ├── No user → Login.tsx (Magic Link / OAuth)
    └── User exists → Check onboarding status
```

### 1.2 Login Flow
| Step | Action | Component |
|------|--------|-----------|
| 1 | Show login screen | `Login.tsx` |
| 2 | Enter email (Magic Link) | Supabase Auth |
| 3 | Check email for link | External |
| 4 | Click link → Authenticated | `AuthContext` |
| 5 | Redirect to Landing/App | `MindstreamApp.tsx` |

---

## 2. Onboarding Flows

### 2.1 Landing Screen Decision
**Component:** [LandingScreen.tsx](file:///Users/director/Mindstream_v1/components/LandingScreen.tsx)

```
New authenticated user (onboardingStep = 0)
    ↓
LandingScreen displays
    ├── [Quick Start] → onboardingStep = 1 → Stream View (empty state)
    └── [Guided Setup] → onboardingStep = 2 → OnboardingWizard
```

### 2.2 Quick Start Path (Fast Users)
**Flow:**
1. User taps **"Quick Start"**
2. Analytics: `logEvent('onboarding_completed', { path: 'quick_start' })`
3. Lands in **Stream View** with empty state
4. Writes first entry (10+ characters)
5. **InsightModal** appears automatically with:
   - AI-generated insight
   - Follow-up reflection question
   - Suggested habit
   - Suggested intention

**InsightModal Actions:** [InsightModal.tsx](file:///Users/director/Mindstream_v1/components/InsightModal.tsx)
| Button | Action | Redirect |
|--------|--------|----------|
| 🎯 Track Habit | Adds suggested habit | Focus > Habits tab |
| ⭐ Set Goal | Adds suggested intention | Focus > Goals tab |
| 💬 Explore | Seeds chat with context | Chat view |
| ✕ Skip | Dismisses modal | Stays in Stream |

Each action logs: `logEvent('insight_modal_action', { action: '...' })`

### 2.3 Guided Setup Path (Recommended)
**Component:** [OnboardingWizard.tsx](file:///Users/director/Mindstream_v1/components/OnboardingWizard.tsx)

| Step | Name | User Action |
|------|------|-------------|
| 1 | The Sanctuary | View privacy message → "Enter" |
| 2 | The Spark | Select emotion (8 options: Anxious, Excited, Overwhelmed, Calm, Tired, Inspired, Frustrated, Grateful) |
| 3 | The Container | Select life area (Work, Relationships, Health, Self, Money) |
| 4 | The Friction | Select trigger (context-specific to life area) |
| 5 | Elaboration | Write/speak about the issue + Select AI personality |
| 6 | AI Analysis | View insight + Accept/reject suggested habits & intentions |

**Completion Options:**
- "Unpack this with AI" → Chat view (with seeded context)
- Skip → Stream view

---

## 3. Main Navigation Flows

### 3.1 Navigation Bar
**Component:** [NavBar.tsx](file:///Users/director/Mindstream_v1/components/NavBar.tsx)

| Tab | View | Shows When |
|-----|------|------------|
| Stream | Journal entries | Always |
| Focus | Habits + Goals | Always |
| Insights | Reflections + Analytics | entries ≥ 5 |
| Chat | AI conversation | Always |

**Progressive Disclosure:**
- Insights tab hidden until 5+ entries
- Badge appears on Insights tab when unlocked (until visited)
- Toast: "🎉 Insights tab unlocked!"

### 3.2 Header Actions
**Component:** [Header.tsx](file:///Users/director/Mindstream_v1/components/Header.tsx)

| Icon | Action | Redirect |
|------|--------|----------|
| 🔍 Search | Opens SearchModal | Modal overlay |
| ⚙️ Settings | Opens SettingsView | Settings view |

---

## 4. Stream View Flows

### 4.1 Stream View Structure
**Component:** [Stream.tsx](file:///Users/director/Mindstream_v1/components/Stream.tsx)

```
Stream View
├── TodaysFocusBanner (if daily intentions exist)
├── ProactiveNudges (pending nudges)
├── Feed Items (grouped by date):
│   ├── EntryCards
│   ├── InsightCards
│   └── AutoReflectionCards
├── LoadMore button (if hasMore)
└── InputBar
```

### 4.2 Entry Creation Flow
**Component:** [InputBar.tsx](file:///Users/director/Mindstream_v1/components/InputBar.tsx)

| Method | Steps |
|--------|-------|
| **Text** | Type in textarea → Enter/Send button |
| **Voice** | Tap 🎤 → Speak → Text transcribed → Send |
| **Guided Prompt** | Click prompt chip → Pre-fills textarea |

**Guided Prompts:**
- "What's one thing I'm grateful for today?"
- "How am I feeling right now, really?"
- "What's taking up most of my headspace?"
- "A small win from today was..."

**After Submit:**
1. Optimistic UI update (temporary entry)
2. AI enrichment (title, tags, sentiment, emoji, suggestions)
3. Toast: "Entry saved ✓"
4. Confetti + haptic feedback

### 4.3 Entry Card Interactions
**Component:** [EntryCard.tsx](file:///Users/director/Mindstream_v1/components/EntryCard.tsx)

| Action | Result |
|--------|--------|
| Tap card | Expand to show full text + suggestions |
| Tap tag | Opens ThematicModal for that tag |
| Tap ✏️ Edit | Opens EditEntryModal |
| Tap 🗑️ Delete | Opens DeleteConfirmationModal |
| Accept suggestion | Depends on type (see below) |

**Suggestion Types:**
| Type | Action |
|------|--------|
| habit | Creates habit in Habits view |
| intention | Creates intention in Goals view |
| reflection | Redirects to Chat with context |

### 4.4 Proactive Nudge Interactions
**Component:** [ProactiveNudge.tsx](file:///Users/director/Mindstream_v1/components/ProactiveNudge.tsx)

**Nudge Types:**
- `mood_decline` - 3+ negative entries in a row
- `habit_abandonment` - Breaking a 7+ day streak
- `intention_stagnation` - Goals pending 7+ days
- `positive_reinforcement` - Celebrate streaks

| Button | Action |
|--------|--------|
| "Let's Chat" | Redirects to Chat view |
| "Dismiss" | Hides nudge, updates status |

---

## 5. Focus View Flows

### 5.1 Focus View Structure
**Component:** [FocusView.tsx](file:///Users/director/Mindstream_v1/components/FocusView.tsx)

```
Focus View
├── Sub-tab Switcher: [Habits] [Goals]
├── Content Area (animated transitions)
└── Input Bar (context-dependent)
```

### 5.2 Habits Tab
**Component:** [HabitsView.tsx](file:///Users/director/Mindstream_v1/components/HabitsView.tsx)

**Frequency Tabs:**
| Tab | View Period |
|-----|-------------|
| Daily | Last 7 days |
| Weekly | Last 4 weeks |
| Monthly | Last 6 months |

**Habit Card Interactions:** [HabitCard.tsx](file:///Users/director/Mindstream_v1/components/HabitCard.tsx)
| Action | Result |
|--------|--------|
| Tap checkbox | Toggle completion (optimistic UI) |
| Long press | Show edit/delete options |
| Streak milestone (7/30/100) | Confetti celebration 🎉 |

**Add Habit:** [HabitsInputBar.tsx](file:///Users/director/Mindstream_v1/components/HabitsInputBar.tsx)
1. Type habit name
2. AI auto-assigns: category, emoji (async, non-blocking)
3. Created with current frequency tab

**NEW v6.1 - Creation-Date-Aware Tracking:**
- Habits only show tracking dots from creation date forward
- Prevents "fake broken streak" impression for new habits
- Daily: 1-7 dots (days since creation)
- Weekly: 1-4 dots (weeks since creation)
- Monthly: 1-6 dots (months since creation)

**NEW v6.1 - Edit Habit Modal:** [EditHabitModal.tsx](file:///Users/director/Mindstream_v1/components/EditHabitModal.tsx)
- Expand card → "Edit" button
- Edit: name, emoji, category

### 5.3 Goals Tab
**Component:** [IntentionsView.tsx](file:///Users/director/Mindstream_v1/components/IntentionsView.tsx)

**Urgency Groups:**
| Category | Color | Meaning |
|----------|-------|---------|
| 🔴 Overdue | Red | Past due date |
| 🟢 Today | Green | Due today |
| 🔵 This Week | Blue | Due within 7 days |
| 🟣 This Month | Purple | Due within 30 days |
| ⚪ Later | Gray | Due later |
| 🟡 Life Goals | Yellow | No deadline |
| ✅ Completed | - | Collapsible section |

**Intention Card Interactions:** [IntentionCard.tsx](file:///Users/director/Mindstream_v1/components/IntentionCard.tsx)
| Action | Result |
|--------|--------|
| Tap checkbox | Mark complete (moves to Completed) |
| Tap ⭐ Star | Toggle high priority |
| Tap 🗑️ Delete | Remove intention |

**Add Intention:** [IntentionsInputBar.tsx](file:///Users/director/Mindstream_v1/components/IntentionsInputBar.tsx) + [ETASelector.tsx](file:///Users/director/Mindstream_v1/components/ETASelector.tsx)

**ETA Presets:**
| Option | Sets due_date to |
|--------|-----------------|
| Today | End of today |
| Tomorrow | End of tomorrow |
| This Week | Sunday 23:59 |
| Next Week | Next Sunday 23:59 |
| This Month | End of month |
| Life | is_life_goal = true |
| Custom | Date picker |

**NEW v6.1 - Timezone-Safe Storage:**
- Dates stored as `YYYY-MM-DD` in local time
- Prevents offset bugs (e.g., "Today" showing as tomorrow)

**NEW v6.1 - AI Tagging:**
- Intention created with defaults (🎯 emoji, "Growth" category)
- Background AI call assigns personalized emoji + category
- UI updates when AI responds (non-blocking)

**NEW v6.1 - Edit Intention Modal:** [EditIntentionModal.tsx](file:///Users/director/Mindstream_v1/components/EditIntentionModal.tsx)
- Pencil icon on IntentionCard
- Edit: intention text (emoji/category preserved)

---

## 6. Insights View Flows

### 6.1 Insights View Structure
**Component:** [InsightsView.tsx](file:///Users/director/Mindstream_v1/components/InsightsView.tsx)

```
Insights View (unlocks at 5 entries)
├── Header: "Insights" + [Deep Dive →]
├── Active Tab:
│   ├── Reflections (default)
│   └── Deep Dive (Life Areas Dashboard)
```

### 6.2 Reflections Tab
**Component:** [ReflectionsView.tsx](file:///Users/director/Mindstream_v1/components/ReflectionsView.tsx)

**Sub-tabs:**
| Tab | Content |
|-----|---------|
| Daily | Day-by-day entries + Generate Daily Reflection |
| Weekly | Week-by-week + Generate Weekly Reflection |
| Monthly | Month-by-month + Generate Monthly Reflection |
| Insights | Auto-generated insight cards + Daily Pulse |

**Generate Reflection Flow:**
1. Click "Generate" button for a day/week/month
2. AI analyzes entries + habits + intentions
3. Summary displayed in ReflectionCard
4. "Explore in Chat" button redirects to Chat with context

**NEW v6.1 - AI Quality Requirements:**

*Summary must:*
- 3-5 sentences (daily/weekly), 4-6 sentences (monthly)
- Paint the emotional arc of the period
- Celebrate ONE specific win (by name)
- Offer ONE gentle observation

*Suggestions must:*
- Reference **user's actual data** (specific goal name, habit name)
- Be 5-12 words, actionable, specific
- Return **empty array** if period was balanced (prefer 0 over generic)

| ❌ Bad Suggestion | ✅ Good Suggestion |
|-------------------|-------------------|
| "Prioritize your pending goals" | "Complete the 'Finish migration' goal tomorrow" |
| "Focus on self-care" | "Break down 'Launch project' into 3 daily tasks" |

### 6.3 Deep Dive Tab
**Component:** [LifeAreaDashboard.tsx](file:///Users/director/Mindstream_v1/components/LifeAreaDashboard.tsx)

**6 Life Domains:**
| Domain | Icon | Description |
|--------|------|-------------|
| Health | 🏃 | Physical/mental well-being |
| Growth | ⚡ | Learning/development |
| Career | 💼 | Professional goals |
| Finance | 💰 | Money management |
| Connection | 💜 | Relationships |
| System | 🛠️ | Organization |

**Interactions:**
| Action | Result |
|--------|--------|
| Select domain | Shows filtered habits/intentions |
| "Yearly Review" button | Opens YearlyReview modal |

### 6.4 Yearly Review Flow
**Component:** [YearlyReview.tsx](file:///Users/director/Mindstream_v1/components/YearlyReview.tsx)

**Slideshow Presentation:**
| Slide | Content |
|-------|---------|
| 1 | Total entries + words written |
| 2 | Top emotions chart |
| 3 | Best habit streaks |
| 4 | Goals completed |
| 5 | AI-generated yearly themes |
| 6 | "Core Memories" (significant entries) |

**Navigation:** ← Previous | Next → | Share

### 6.5 Reflection Unlock Flow (Tiered)
**Component:** [ReflectionUnlockModal.tsx](file:///Users/director/Mindstream_v1/components/ReflectionUnlockModal.tsx)

**Triggers (checked on app load):**
- **Daily:** 5 entries total
- **Weekly:** 3 days since install + 5 entries
- **Monthly:** 14 days since install + 10 entries

**Flow:**
1. User opens app
2. Threshold met for first time
3. `ReflectionUnlockModal` appears overlays screen
4. Displays tier-specific icon, title, and description
5. **Actions:**
   - "Check it out" → Redirects to Insights View (sets `seen{Tier}Unlock = true`)
   - "Maybe later" → Dismisses modal (sets `seen{Tier}Unlock = true`)
6. **Badge:** Red pulsing dot on Insights tab if unlocked but not visited

---

## 7. Chat View Flows

### 7.1 Chat View Structure
**Component:** [ChatView.tsx](file:///Users/director/Mindstream_v1/components/ChatView.tsx)

```
Chat View
├── TTS Toggle (Voice On/Off)
├── Messages (scrollable)
│   ├── User bubbles
│   └── AI bubbles (with streaming)
├── Suggestion Chips (first message only)
└── ChatInputBar
```

### 7.2 Chat Starters
**Component:** [SuggestionChips.tsx](file:///Users/director/Mindstream_v1/SuggestionChips.tsx)

When chat has only welcome message, AI generates 3 contextual starters based on:
- Recent entries
- Pending intentions
- Active habits
- Latest reflection

### 7.3 Sending Messages
**Component:** [ChatInputBar.tsx](file:///Users/director/Mindstream_v1/components/ChatInputBar.tsx)

| Method | Steps |
|--------|-------|
| Text | Type → Send |
| Voice | Tap 🎤 → Speak → Transcribe → Send |

**AI Response Process:**
1. Extract keywords from user message
2. RAG: Search entries for relevant context
3. Inject context + personality into prompt
4. Stream response chunk-by-chunk
5. Optionally speak response (if TTS enabled)

### 7.4 Text-to-Speech (TTS)
**Toggle:** Voice On/Off button in chat header
- Enabled: AI responses are spoken aloud
- Disabled: Text only
- Preference persisted in localStorage

---

## 8. Settings View Flows

### 8.1 Settings Structure
**Component:** [SettingsView.tsx](file:///Users/director/Mindstream_v1/components/SettingsView.tsx)

```
Settings View
├── ← Back button → Stream
├── AI Companion section
│   └── PersonalitySelector
├── Data & Privacy section
│   ├── Export as JSON
│   └── Export as Markdown
└── Developer Tools
    └── Debug Insights Quality
```

### 8.2 AI Personality Selection
**Component:** [PersonalitySelector.tsx](file:///Users/director/Mindstream_v1/components/PersonalitySelector.tsx)

| Personality | Emoji | Style |
|-------------|-------|-------|
| Stoic Companion | 🏛️ | Direct, philosophical |
| Empathetic Friend | 💙 | Warm, validating |
| Tough Coach | 💪 | Challenging, accountable |
| Curious Explorer | 🔍 | Questioning, analytical |
| Cheerleader | 🎉 | Enthusiastic, celebratory |

**Effect:** All AI responses adapt tone to selected personality.

### 8.3 Data Export
| Format | File |
|--------|------|
| JSON | `mindstream_export_YYYY-MM-DD.json` |
| Markdown | `mindstream_export_YYYY-MM-DD.md` |

**Exported Data:**
- All entries
- All habits + logs
- All intentions
- All reflections

---

## 9. Modal Flows

### 9.1 Search Modal
**Component:** [SearchModal.tsx](file:///Users/director/Mindstream_v1/components/SearchModal.tsx)

**Trigger:** 🔍 icon in header
**Filter options:** All | Entries | Reflections
**Close:** Esc key, X button, or click backdrop

### 9.2 Thematic Modal
**Component:** [ThematicModal.tsx](file:///Users/director/Mindstream_v1/components/ThematicModal.tsx)

**Trigger:** Click any tag on an entry
**Actions:**
- "View All Entries" → Opens SearchModal with tag query
- "Generate Reflection" → AI deep-dive on that theme

### 9.3 Edit Entry Modal
**Trigger:** Edit icon on EntryCard
**Actions:** Edit text → Save | Cancel

### 9.4 Delete Confirmation Modal
**Trigger:** Delete icon on any item
**Actions:** Confirm | Cancel

### 9.5 Edit Habit Modal
**Trigger:** Expand card, click "Edit" button
**Actions:** Edit name/emoji/category → Save | Cancel

### 9.6 Edit Intention Modal (NEW v6.1)
**Component:** [EditIntentionModal.tsx](file:///Users/director/Mindstream_v1/components/EditIntentionModal.tsx)
**Trigger:** Pencil icon on IntentionCard
**Actions:** Edit text → Save | Cancel

---

## 10. Cross-View Redirections Summary

| From | Trigger | To |
|------|---------|-----|
| Landing | Quick Start button | Stream (empty) |
| Landing | Guided Setup button | OnboardingWizard |
| OnboardingWizard | Complete + "Unpack in Chat" | Chat (seeded) |
| OnboardingWizard | Complete | Stream |
| Stream | Accept reflection suggestion | Chat |
| Stream | Accept nudge "Let's Chat" | Chat |
| InsightModal | Track Habit | Focus > Habits |
| InsightModal | Set Goal | Focus > Goals |
| InsightModal | Explore | Chat |
| EntryCard | Accept habit suggestion | Creates habit |
| EntryCard | Accept intention suggestion | Creates intention |
| Reflections | Explore in Chat | Chat |
| Header | Search icon | SearchModal |
| Header | Settings icon | Settings |
| Settings | Back arrow | Stream |
| Any tab | NavBar tap | Selected tab |

---

## 11. Analytics Events Summary

| Event | When Fired | Properties |
|-------|------------|------------|
| `onboarding_completed` | Landing choice made | `{ path: 'quick_start' \| 'guided' }` |
| `entry_created` | Entry saved | `{ word_count, sentiment }` |
| `insight_modal_action` | Modal button clicked | `{ action: 'habit' \| 'goal' \| 'chat' \| 'dismiss' }` |
| `habit_completed` | Habit toggled on | `{ habit_name }` |
| `insights_unlocked` | 5th entry saved | `{}` |
| `chat_message_sent` | Chat message sent | `{ word_count }` |

---

## 12. Progressive Disclosure Rules

| Feature | Unlock Condition | Status |
|---------|------------------|--------|
| Insights tab | 5 entries | ✅ Implemented |
| Daily Reflections | 5 entries | ✅ Implemented |
| Weekly Reflections | 3 days + 5 entries | ✅ Implemented |
| Monthly Reflections | 14 days + 10 entries | ✅ Implemented |
| InsightModal (Quick Start) | First entry submitted | ✅ Implemented |
| Yearly Review | Available in Deep Dive | ✅ Implemented |
| Pattern Detection nudges | Based on entry patterns | ✅ Implemented |

---

## 13. State Persistence

| State | Storage | Notes |
|-------|---------|-------|
| Onboarding step | localStorage | `onboardingStep_{userId}` |
| Has seen first insight | localStorage | `hasSeenFirstInsight_{userId}` |
| Has visited Insights | localStorage | `hasVisitedInsights_{userId}` |
| TTS preference | localStorage | `ttsEnabled` |
| All data | Supabase (PostgreSQL) | User-scoped with RLS |

---

## 14. MVP Verification & Smoke Tests (December 2025)

> **Verification Date:** December 6, 2025  
> **Status:** ✅ All Core Flows Verified

### 14.1 Smoke Test Results

| Test | Status | Evidence |
|------|--------|----------|
| Stream View loads | ✅ Pass | Entries displayed correctly |
| Habits - dots appear | ✅ Pass | Creation-date-aware (newer habits = fewer dots) |
| Habits - toggle works | ✅ Pass | Optimistic update + sync |
| Goals - urgency groups | ✅ Pass | "Overdue", "Today", "This Week" visible |
| Goals - edit button | ✅ Pass | Pencil icon opens EditIntentionModal |
| Insights - reflections shown | ✅ Pass | Daily/Weekly summaries with suggestions |
| Chat - AI greeting | ✅ Pass | Welcome message loads |
| Chat - smart starters | ✅ Pass | Context-aware suggestions visible |
| Chat - ephemerality notice | ✅ Pass | "Conversations reset" tooltip shown |
| Edit Modal | ✅ Pass | Opens with correct text, cancel/save work |

### 14.2 Error Handling

| Scenario | Behavior | Status |
|----------|----------|--------|
| AI enrichment fails | Toast: "Entry saved! AI enrichment will retry later." | ✅ |
| Voice permission denied | Toast: "🎤 Microphone access denied..." | ✅ |
| No speech detected | Toast: "🎤 No speech detected. Try again." | ✅ |
| Browser no voice support | Toast: "🎤 Voice input not supported in this browser." | ✅ |

### 14.3 Analytics Events Verified

| Event | Trigger | Properties |
|-------|---------|------------|
| `first_insight_viewed` | InsightModal shown for first time | `{}` |
| `first_action_taken` | First habit/goal/chat from InsightModal | `{ type }` |
| `reflection_generated` | Daily/Weekly/Monthly reflection created | `{ type, date }` |
| `insight_modal_shown` | InsightModal displayed | `{ confidence, has_habit_suggestion }` |
| `insight_modal_action` | Modal button clicked | `{ action }` |
| `error_event` | AI or system error | `{ source, message }` |

### 14.4 Security (RLS) Verified

All tables have Row Level Security enabled with proper policies:

| Table | Policies | Status |
|-------|----------|--------|
| `entries` | ALL (own) | ✅ SECURE |
| `habits` | DELETE, INSERT, UPDATE, SELECT (own) | ✅ SECURE |
| `habit_logs` | DELETE, INSERT, SELECT (own) | ✅ SECURE |
| `intentions` | ALL (own) | ✅ SECURE |
| `reflections` | ALL (own) | ✅ SECURE |
| `analytics_events` | INSERT, SELECT (own) | ✅ SECURE |
| `insight_cards` | INSERT, UPDATE, SELECT (own) | ✅ SECURE |
| `proactive_nudges` | INSERT, UPDATE, SELECT (own) | ✅ SECURE |
| `profiles` | DELETE, ALL (own) | ✅ SECURE |
| `user_preferences` | INSERT, UPDATE, SELECT (own) | ✅ SECURE |
| `chart_insights` | INSERT (service+own), SELECT, UPDATE (own) | ✅ SECURE |

### 14.5 Monitoring & Error Tracking

| Tool | Status | Configuration |
|------|--------|---------------|
| Sentry | ✅ Active | DSN configured in VITE_SENTRY_DSN |
| Session Replay | ✅ Enabled | 100% on error, 10% normal |
| Performance Tracing | ✅ Enabled | 10% sample rate |

