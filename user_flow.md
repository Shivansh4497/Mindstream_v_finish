# Mindstream User Flows

**Last Updated:** December 6, 2025  
**Version:** 2.0

---

## Table of Contents

1. [Onboarding Flows](#1-onboarding-flows)
2. [Daily Usage: Stream Flow](#2-daily-usage-stream-flow)
3. [Habits Flow](#3-habits-flow)
4. [Intentions (Goals) Flow](#4-intentions-goals-flow)
5. [Reflections Flow](#5-reflections-flow)
6. [Chat Flow](#6-chat-flow)
7. [Settings & Data Flow](#7-settings--data-flow)

---

## 1. Onboarding Flows

### 1.1 Landing Screen

```
┌─────────────────────────────────────┐
│          🌿 Mindstream             │
│                                     │
│   "Your Second Brain for Clarity"   │
│                                     │
│  ┌─────────────────────────────────┐│
│  │     ⚡ Quick Start              ││
│  │   Skip setup, start journaling  ││
│  └─────────────────────────────────┘│
│                                     │
│  ┌─────────────────────────────────┐│
│  │     🎯 Guided Setup             ││
│  │   5-min personalized onboarding ││
│  └─────────────────────────────────┘│
└─────────────────────────────────────┘
```

### 1.2 Quick Start Path

```
Landing → Stream (empty) → Add first entry → AI processes entry → Done
```

**Steps:**
1. User clicks "Quick Start"
2. Immediately lands on Stream view
3. InputBar is focused with "What's on your mind?" placeholder
4. User types/speaks first entry
5. Entry saved, AI assigns emoji + sentiment + tags + suggestions
6. User continues journaling naturally

### 1.3 Guided Setup Path

```
Landing → Privacy → Emotion Select → Life Area → Trigger → Elaboration → 
AI Personality → AI Analysis → Optional Chat → Stream
```

**Steps:**
1. **Privacy Sanctuary** - Acknowledge data privacy
2. **Emotion Selection** - Pick current emotional state
3. **Life Area** - Choose primary focus area
4. **Trigger Identification** - Select what prompted the feeling
5. **Elaboration** - Text/Voice input (optional, can skip)
6. **AI Personality** - Choose companion style (5 options)
7. **AI Analysis** - View personalized insight + suggestions
8. **Optional Chat** - Explore insight deeper
9. **Complete** - Land on Stream with first entry created

---

## 2. Daily Usage: Stream Flow

### 2.1 Adding an Entry

```
Stream → InputBar → Type/Voice → Submit → AI Processing → Entry Card appears
```

**Entry Processing:**
1. User submits text (keyboard) or voice (microphone button)
2. Optimistic UI: Entry appears immediately
3. Background: AI proxy processes entry
4. AI assigns: Title, Emoji, Sentiment, Tags, Suggestions
5. Entry card updates with AI enrichments

### 2.2 AI Suggestions (Quality-Gated)

**Trigger:** After each entry, AI evaluates if suggestions are valuable

**Suggestion Rules:**
- Only suggest for **clear intent** (behavior change, habit goal, commitment)
- No suggestions for trivial entries (test, casual, vague)
- Maximum **1-2 concise suggestions** (5-7 words)
- Default to **empty array** if no clear intent

**Suggestion Types:**
| Type | Icon | Action |
|------|------|--------|
| `habit` | 🔄 | Creates recurring habit |
| `intention` | 🎯 | Creates one-time goal |

**User Actions:**
- Click suggestion → Opens confirmation modal
- Accept → Habit/Intention created, sparkle animation
- Dismiss → Suggestion removed

### 2.3 Entry Actions

| Action | How | Result |
|--------|-----|--------|
| **Edit** | Tap entry → Menu → Edit | Opens EditEntryModal |
| **Delete** | Tap entry → Menu → Delete | Confirmation → Removes entry |
| **View Tags** | Tap tag pill | Opens ThematicModal for that tag |
| **Accept Suggestion** | Tap suggestion pill | Creates Habit/Intention |

---

## 3. Habits Flow

### 3.1 Creating a Habit

```
Focus → Habits Tab → HabitsInputBar → Type name → Submit → AI Tagging → Habit Card
```

**AI Tagging (Async):**
1. Habit created with defaults (🎯 emoji, "Growth" category)
2. Background: AI analyzes habit text
3. AI assigns: Emoji + Category (Health, Growth, Career, Finance, Connection, System)
4. Habit card updates with AI-assigned emoji/category

### 3.2 Tracking a Habit

**Display Logic (NEW v2.0):**
- Habits only show tracking dots from **creation date forward**
- Daily: 1-7 dots (days since creation, max 7)
- Weekly: 1-4 dots (weeks since creation, max 4)
- Monthly: 1-6 dots (months since creation, max 6)

```
Habit created today:     [●]          ← 1 dot
Habit created 3 days ago: [○][●][●][●] ← 4 dots
Habit 7+ days old:       [○][●][●][●][○][●][●] ← Full 7 dots
```

**Toggle Action:**
- Tap dot → Toggles completion for that day/week/month
- Optimistic UI → Syncs in background (500ms debounce)
- Streak updates instantly (calculated from logs)

### 3.3 Editing a Habit

```
Habit Card → Tap to expand → "Edit" button → EditHabitModal
```

**Editable Fields:**
- Icon (emoji picker)
- Name (text)
- Category (6 options)

### 3.4 Deleting a Habit

```
Habit Card → Tap to expand → "Delete" button → Removed
```

---

## 4. Intentions (Goals) Flow

### 4.1 Creating an Intention

```
Focus → Goals Tab → IntentionsInputBar → Type text → Select ETA → Submit → 
AI Tagging → IntentionCard
```

**ETA Options:**
| Preset | Due Date Calculation |
|--------|---------------------|
| Today | End of today (23:59) |
| Tomorrow | End of tomorrow |
| This Week | Sunday 23:59 |
| Next Week | Following Sunday |
| This Month | Last day of month |
| Life | No due date (is_life_goal = true) |
| Custom | Date picker |

**Date Storage (NEW v2.0):**
- Dates stored as `YYYY-MM-DD` in **local time**
- Prevents timezone offset bugs (e.g., "Today" showing as tomorrow)

**AI Tagging (Async):**
1. Intention created with defaults (🎯 emoji, "Growth" category)
2. Background: AI analyzes intention text
3. AI assigns: Emoji + Category
4. IntentionCard updates with AI-assigned emoji/category

### 4.2 Intention Card Display

```
┌─────────────────────────────────────────────────┐
│ [ ] 🎯 Complete the migration task             │
│     Due: Today • Growth                    ⭐ ✏️ 🗑 │
└─────────────────────────────────────────────────┘
```

**Elements:**
- Checkbox (toggle complete/pending)
- Emoji (AI-assigned)
- Intention text
- Due date + Category
- Star button (prioritize)
- Edit button (NEW v2.0)
- Delete button

### 4.3 Editing an Intention (NEW v2.0)

```
IntentionCard → Tap pencil icon → EditIntentionModal
```

**Editable Fields:**
- Text only (simple text edit)
- Emoji/Category not editable (AI-assigned)

### 4.4 Completing an Intention

```
Tap checkbox → Celebration animation → Moves to "Completed" section
```

**Celebration:**
- Haptic feedback (if supported)
- Confetti animation
- Intention moves to collapsed "Completed" section

### 4.5 Urgency Grouping

Intentions auto-sorted into sections:

| Section | Color | Criteria |
|---------|-------|----------|
| Overdue | 🔴 Red | Past due_date, pending |
| Today | 🟢 Green | Due today |
| This Week | 🔵 Blue | Due within 7 days |
| This Month | 🟣 Purple | Due within 30 days |
| Later | ⚪ Gray | Due beyond 30 days |
| Life | 🟡 Gold | is_life_goal = true |

---

## 5. Reflections Flow

### 5.1 Generating a Reflection

```
Insights → Reflections Tab → Daily/Weekly/Monthly → Generate → AI Processing → 
ReflectionCard appears
```

**Reflection Types:**
| Type | Data Range | Summary Length | Suggestions |
|------|------------|----------------|-------------|
| Daily | Last 24 hours | 3-5 sentences | Max 1-2 |
| Weekly | Last 7 days | 3-5 sentences | Max 1 |
| Monthly | Last 30 days | 4-6 sentences | Max 1 |

### 5.2 Reflection Card Display

```
┌─────────────────────────────────────────────────┐
│ ✨ Your Daily Reflection                        │
│                                                 │
│ Today was productive with significant progress  │
│ on the migration task. Your morning routine     │
│ set the tone for focused work...                │
│                                                 │
│ Daily: Complete the 'API refactor' by EOD   ⊕  │
│                                                 │
│         📧 Explore in Chat                      │
└─────────────────────────────────────────────────┘
```

### 5.3 AI Suggestions (Quality-Gated, NEW v2.0)

**Summary Requirements:**
- 3-5 sentences (daily/weekly), 4-6 sentences (monthly)
- Paint emotional arc of the period
- Celebrate ONE specific win
- Offer ONE gentle observation

**Suggestion Requirements:**
- MUST reference **user's actual data** (specific goal, habit, entry)
- NO generic advice (e.g., "Prioritize your goals")
- 5-12 words, actionable, specific
- If period was balanced, return **empty array**

**Good vs Bad Suggestions:**
| ❌ Bad | ✅ Good |
|--------|---------|
| "Prioritize your pending goals" | "Complete the 'Finish migration' goal tomorrow" |
| "Focus on self-care" | "Break down 'Launch project' into 3 daily tasks" |

### 5.4 Accepting a Suggestion

```
Tap ⊕ button → Confirm modal → Habit/Intention created → Removed from reflection
```

---

## 6. Chat Flow

### 6.1 Starting a Conversation

```
Chat Tab → Smart Starters shown → Tap starter or type custom → AI response
```

**Context Provided to AI:**
- Last 15 entries
- Pending intentions
- Active habits
- Latest reflection
- Selected AI personality

### 6.2 Ephemerality Notice (NEW v2.0)

```
┌─────────────────────────────────────────────────┐
│ 💬 Your conversation resets when you leave.    │
│    Your entries and reflections are saved.      │
└─────────────────────────────────────────────────┘
```

Displayed below chat input to set expectations.

### 6.3 Voice Input

```
Tap 🎤 → "Listening..." placeholder → Speak → Text appears → Send
```

### 6.4 Text-to-Speech

```
Toggle 🔊 button → AI responses are spoken aloud
```

---

## 7. Settings & Data Flow

### 7.1 AI Personality Selection

```
Settings → AI Personality → Select from 5 options → Saved instantly
```

**Personalities:**
| Name | Style |
|------|-------|
| Stoic | Calm, philosophical |
| Cheerful | Upbeat, encouraging |
| Analytical | Data-driven, logical |
| Empathetic | Warm, understanding |
| Direct | No-nonsense, action-oriented |

### 7.2 Data Export

```
Settings → Export Data → Choose format → Download
```

**Formats:**
- JSON (machine-readable)
- Markdown (human-readable)

### 7.3 Account Management

```
Settings → Sign Out → Confirmation → Logged out
```

---

## Appendix: Key UX Decisions

### A.1 Progressive Disclosure

| Feature | Unlock Condition |
|---------|------------------|
| Insights Tab | ≥5 entries |
| Yearly Review | ≥90 days or 50 entries |

### A.2 Optimistic UI

All mutations (add entry, toggle habit, complete intention) update UI **immediately**, then sync in background.

### A.3 Error Handling

- AI failures: Graceful fallback, app works as "dumb journal"
- Network errors: Toast notification, retry option
- Crash: ErrorBoundary with reload button

### A.4 Celebrations

| Action | Celebration |
|--------|-------------|
| Complete intention | Confetti + haptic |
| Maintain streak | Flame emoji + streak count |
| Unlock Insights | Toast + pulsing badge |
