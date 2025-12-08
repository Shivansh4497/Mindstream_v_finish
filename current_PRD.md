# Product Requirement Document: Mindstream
**Version:** 6.4  
**Last Updated:** December 9, 2025 (MVP Hardening: Account Reset, AI Quality, Streamlined Onboarding)  
**Status:** Production (MVP Ready - Invite-Only Launch)  
**Repository:** [github.com/Shivansh4497/Mindstream_v1](https://github.com/Shivansh4497/Mindstream_v1)  
**Tech Stack:** React 19, TypeScript, Vite, Tailwind CSS, Supabase (PostgreSQL + Auth), Google Gemini 2.0 Flash, Sentry  
**Author:** Product Team

---


## Table of Contents

1. [Executive Summary & Vision](#1-executive-summary--vision)
2. [Target User](#2-target-user)
3. [Core Value Proposition](#3-core-value-proposition)
4. [Product Architecture: The 6 Pillars](#4-product-architecture-the-6-pillars)
5. [User Flows](#5-user-flows)
6. [Progressive Disclosure System](#6-progressive-disclosure-system) ← **NEW v6.0**
7. [Analytics & Measurement](#7-analytics--measurement) ← **NEW v6.0**
8. [Technical Architecture](#8-technical-architecture)
9. [Database Schema](#9-database-schema)
10. [AI System](#10-ai-system)
11. [Design System & UI/UX](#11-design-system--uiux)
12. [Security & Privacy](#12-security--privacy)
13. [Deployment & DevOps](#13-deployment--devops)
14. [Future Roadmap](#14-future-roadmap)

---

## 1. Executive Summary & Vision

### 1.1 The Core Problem

Humans experience an **"Input/Output" disconnect**:
- **Input:** Feelings, thoughts, moods
- **Output:** Actions, behaviors, systems

We feel things and do things, but **rarely understand the correlation** between them.

**Example:**  
*"Why am I anxious?"* → The answer might be: *"Because you haven't exercised in 3 days."*

Most apps track either inputs (journals) or outputs (habit trackers). Mindstream tracks **both** and uses AI to **close the loop**.

### 1.2 The Solution

**Mindstream: Your Second Brain for Clarity**

A private, AI-powered journaling companion that acts as a **Self-Correction Engine**. It:
- Captures scattered thoughts effortlessly (text + **voice in all contexts**)
- Tracks behavioral systems (habits) and finite goals (intentions)
- Synthesizes patterns using AI + RAG (Retrieval Augmented Generation)
- Delivers actionable insights that connect feelings with behaviors
- **Adapts its personality** to match your preferred coaching style
- **Proactively detects patterns** and offers timely interventions
- **Generates yearly insights** to show long-term growth
- Provides **professional dark theme** designed for calm, sophisticated user experience

### 1.3 Product Philosophy

1. **Privacy First:** Your data = Your vault. Complete data export available.
2. **Zero Friction:** Capture thoughts in <5 seconds (voice or text).
3. **Zero Latency:** Optimistic UI makes the app feel instant.
4. **Contextual Intelligence:** AI knows your history, preventing generic advice.
5. **Graceful Degradation:** Works as a "dumb journal" even if AI fails.
6. **Personalization:** 5 distinct AI personalities to match your needs.
7. **Accessibility:** Voice input/output for hands-free interaction.
8. **Premium Design:** Calm, sophisticated dark theme aligned with "Calm · Growth · Clarity" principles.

---

## 2. Target User

### Primary Persona: "Alex, the Introspective Builder"

**Demographics:**
- Age: 25-40
- Occupation: Knowledge worker, creative, entrepreneur
- Technical literacy: Medium to High

**Psychographics:**
- High ambition, prone to burnout
- Values privacy and data ownership
- Wants to "debug" their own mind
- Loves data but hates manual entry

**Current Pain Points:**
- Tried journaling but suffers from "Blank Page Paralysis"
- Used habit trackers (Streaks, Atomic Habits) but finds them too rigid
- Seeks self-awareness but lacks time/tools to connect the dots
- Wants personalized coaching, not one-size-fits-all advice

**What They Want:**
- A tool that learns their patterns
- Actionable insights, not platitudes
- Fast, beautiful, private
- An AI companion that matches their communication style
- Hands-free input for on-the-go journaling

---

## 3. Core Value Proposition

### 3.1 For the User

| Feature | Benefit |
|---------|---------|
| **Universal Voice Input** | **NEW!** Dictate in Stream AND Chat tabs - capture thoughts anywhere |
| **AI Enrichment** | Auto-tags, titles, and analyzes sentiment without manual work |
| **Habit-Feeling Correlation** | "You felt anxious 3 days in a row. Coincides with skipping meditation." |
| **Conversational Exploration** | Ask your journal questions: "Why do I procrastinate?" with voice output |
| **5 AI Personalities** | Choose between Stoic, Empathetic, Tough Coach, Curious, or Cheerleader |
| **Proactive Nudges** | AI detects patterns and intervenes before issues escalate |
| **Life Area Dashboards** | View habits/intentions by domain (Health, Career, etc.) |
| **Yearly Review** | Beautiful "Spotify Wrapped" style annual summary |
| **Full Data Export** | Download your entire history in JSON or Markdown |
| **Voice Output** | AI can speak responses using Text-to-Speech |
| **Professional Design** | **NEW!** Refined color system for optimal readability and calm aesthetic |

### 3.2 Competitive Differentiation

| Competitor | What They Do | What Mindstream Does Better |
|------------|--------------|----------------------------|
| Notion/Obsidian | Manual note-taking | **AI auto-organizes + Voice everywhere + Personality adaptation** |
| Day One | Beautiful journal | **Connects feelings → actions + Proactive nudges + Voice input** |
| Habitica/Streaks | Gamified habits | **Ties habits to emotional state + Long-term insights** |
| Therapist Apps | Generic CBT prompts | **Personalized via RAG + 5 coaching styles + Voice interaction** |
| Replika | AI companion | **Action-oriented + Data ownership + Zero vendor lock-in** |

---

## 4. Product Architecture: The 6 Pillars

Mindstream is structured around **6 interconnected pillars** feeding a central data lake.

### Pillar 1: **Stream** (Input Layer)

**Purpose:** Capture raw thoughts in a reverse-chronological feed.

**Features:**
- **Voice Dictation:** Web Speech API integration with microphone button
  - Real-time transcription
  - Pulse animation during recording
  - Automatic text append
  - Browser compatibility detection
- **Guided Prompts:** Contextual chips like *"Small win today..."* to unblock users
- **AI Enrichment:**
  - Auto-generates title (3-5 words)
  - Extracts 2-4 tags
  - Analyzes primary + secondary sentiment from 13 granular emotions
  - Assigns emoji
- **Entry Suggestions:** AI generates 3 actionable follow-ups (e.g., "Start a meditation habit")
- **Thematic Reflection:** Click any tag to generate an AI deep-dive on that theme
- **Today's Focus Banner:** Shows daily intentions at top of Stream

**UI Pattern:**
- Entries grouped by date (Today, Yesterday, Nov 19...)
- Each entry shows emoji, title, sentiment badge, tags
- Click to expand for full text + suggestions
- Microphone button in input bar for voice dictation
- "Listening..." placeholder during recording

**REMOVED in v6.4:**
- ❌ Proactive Nudges - removed from MVP (low value, duplicate/generic messages)

---

### Pillar 2: **Habits** (Behavior Tracking)

**Purpose:** Track the "Systems" that power the user's life.

**Features:**
- **Frequency Tabs:** Daily | Weekly | Monthly
  - Users switch tabs to view/create habits of that frequency
  - Reduces clutter, improves focus
- **AI Categorization:** Auto-sorts into 6 domains:
  - 🏃 Health
  - ⚡ Growth
  - 💼 Career
  - 💰 Finance
  - 💜 Connection
  - 🛠️ System
- **AI Tagging (Async):** NEW v6.1
  - Habit created with defaults (🎯 emoji, "Growth" category)
  - Background AI call assigns personalized emoji + category
  - Non-blocking: UI updates when AI responds
- **Creation-Date-Aware Tracking:** NEW v6.1
  - Habits only show tracking dots from creation date forward
  - Prevents "fake broken streak" impression for new habits
  - Daily: 1-7 dots (days since creation)
  - Weekly: 1-4 dots (weeks since creation)
  - Monthly: 1-6 dots (months since creation)
- **Streak Tracking:**
  - Current streak (e.g., "4 day streak 🔥")
  - Visual history respects creation date
  - Heatmap visualization for detailed pattern analysis
- **Edit Modal:** NEW v6.1
  - Expandable card with Edit/Delete buttons
  - Edit: Change name, emoji, category
- **Optimistic UI:** Check/uncheck updates instantly, syncs in background with 500ms debounce
- **Smart Detection:** Pattern detector identifies habit abandonment

**UI Pattern:**
```
[Daily] [Weekly] [Monthly] ← Tabs
─────────────────────────────
Your Daily Systems
Track the habits that power your life.

📚 Read 5 pages
GROWTH • 4 day streak
[✓][✓][✓][✓] ← Only 4 dots (created 4 days ago)

⚡ Take vitamins  
SYSTEM • New today
[✓] ← Only 1 dot (created today)
```

---

### Pillar 3: **Intentions** (Goal Management)

**Purpose:** Finite goals with clear deadlines (vs. infinite habits).

**Features:**
- **ETA-Based System:** Replaces rigid timeframes with natural language deadlines.
  - **Presets:** Today | Tomorrow | This Week | Next Week | This Month | Life | Custom Date
  - **Smart Calculation:** Auto-sets due dates (e.g., "This Week" → Sunday at 23:59)
  - **Timezone-Safe Storage:** NEW v6.1 - Dates stored as `YYYY-MM-DD` in local time to prevent offset bugs
- **Urgency Grouping:** Intentions auto-sorted by deadline:
  - 🔴 Overdue
  - 🟢 Today
  - 🔵 This Week
  - 🟣 This Month
  - ⚪ Later
  - 🟡 Life Goals
- **AI Tagging (Async):** NEW v6.1
  - Intention created with defaults (🎯 emoji, "Growth" category)
  - Background AI call assigns personalized emoji + category
  - Non-blocking: UI updates when AI responds
  - Same 6 categories as Habits (Health, Growth, Career, Finance, Connection, System)
- **Edit Modal:** NEW v6.1
  - Pencil icon on each IntentionCard
  - Edit: Change intention text
  - Emoji/Category preserved (AI-assigned)
- **Collapsible History:** Completed items move to a hidden dropdown to reduce clutter.
- **AI Suggestions:** Reflections and onboarding auto-generate intentions with default deadlines.

**UI Pattern:**
```
┌─────────────────────────────────────────────────┐
│ [ ] 🎯 Complete the migration task             │
│     Due: Today • Growth                    ⭐ ✏️ 🗑 │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ [✓] 💪 Exercise for 30 minutes                 │
│     Completed • Health                          │
└─────────────────────────────────────────────────┘
```

- **Input:** Modal with one-tap ETA presets + Custom Date picker
- **List:** Grouped by urgency color codes
- **Life Goals:** Distinct section for ongoing aspirations without deadlines
- **Completed:** Collapsible "Completed (X)" section at bottom

---

### Pillar 4: **Reflections** (Synthesis Engine)

**Purpose:** AI-powered insights connecting inputs (Stream) with behaviors (Habits).

**Types:**
| Type | Scope | Summary Length | Max Suggestions |
|------|-------|----------------|-----------------|
| **Daily** | Last 24 hours | 3-5 sentences | 1-2 |
| **Weekly** | Last 7 days | 3-5 sentences | 1 |
| **Monthly** | Last 30 days | 4-6 sentences | 1 |
| **Thematic** | All entries with tag X | Variable | Variable |
| **Yearly** | Annual aggregation | Multi-slide | N/A |

**What It Analyzes:**
- Entries (feelings, topics)
- Habits (completion rates)
- Intentions (progress)
- Cross-correlations (*"Anxiety spikes when you skip exercise"*)

**AI Quality Requirements:** NEW v6.1

Summary must:
- Paint the emotional arc of the period
- Celebrate ONE specific win (by name)
- Offer ONE gentle observation for improvement

Suggestions must:
- Reference **user's actual data** (specific goal name, habit name, entry text)
- Be **5-12 words**, actionable, specific
- Return **empty array** if period was balanced (prefer no suggestion over generic)

| ❌ Bad Suggestion | ✅ Good Suggestion |
|-------------------|-------------------|
| "Prioritize your pending goals" | "Complete the 'Finish migration' goal tomorrow" |
| "Focus on self-care" | "Break down 'Launch project' into 3 daily tasks" |
| "Set clearer goals" | "Next month: dedicate mornings to 'Learn Spanish' goal" |

**Output:**
- Summary paragraph (adapted to selected AI personality)
- 0-2 AI-generated, data-specific intention suggestions
- Display in professional elevated background card

---

### Pillar 5: **Chat** (Conversational Exploration)

**Purpose:** "Talk to your journal" via conversational AI.

**Features:**
- **Universal Voice Input:** **NEW!** Microphone button matching Stream tab
  - Web Speech API integration
  - Real-time voice-to-text transcription
  - Pulse animation during recording
  - Seamless combination with manual typing
  - "Listening..." placeholder feedback
- **RAG Context Window:**
  - Last 15 entries
  - Pending intentions
  - Active habits
  - Latest reflection
  - Search results (keyword extraction)
  - AI Personality context
- **Smart Starters:** AI generates conversation openers based on recent data
- **Seamless Onboarding Handoff:** Continues context from onboarding wizard
- **Voice Output:** Optional Text-to-Speech for AI responses
- **Personality Adaptation:** Tone matches selected companion
- **Streaming Responses:** Chunk-by-chunk display for immediate feedback

**Technical Implementation:**
- Streaming responses (chunk-by-chunk display)
- Keyword extraction for semantic search
- Full-text search on entries via PostgreSQL
- Dynamic system prompt based on user's personality preference
- Voice recognition with browser compatibility checks

**Example Queries:**
- *"Why do I procrastinate?"*
- *"What patterns do you see in my anxiety?"*
- *"Help me create a morning routine"*

---

### Pillar 6: **Life** (Long-Term View)

**Purpose:** Manage life across domains and track long-term progress.

**Sub-Features:**

#### **6.1 Life Area Dashboards**
- **6 Life Domains:**
  - 🏃 Health: Physical and mental well-being
  - ⚡ Growth: Learning and personal development
  - 💼 Career: Professional goals and projects
  - 💰 Finance: Financial health and planning
  - 💜 Connection: Relationships and community
  - 🛠️ System: Organization and productivity
- **Filtered Views:** Each area shows relevant habits and stats
- **Quick Insights:** AI-generated tips specific to each domain
- **Color Coding:** Visual distinction between areas
- **Average Completion Rates:** Track performance by domain

#### **6.2 Yearly Review**
- **"Spotify Wrapped" Style:** Animated slideshow presentation
- **Key Metrics:**
  - Total entries and words written
  - Top emotions experienced
  - Longest habit streaks
  - Intentions completed
- **AI Analysis:**
  - Major themes of the year
  - "Core Memories" (most significant entries)
  - Growth patterns
- **Shareable:** Beautiful design for social sharing (future)
- **Professional Background:** Uses elevated surface color

#### **6.3 Data Export**
- **Formats:** JSON (machine-readable) and Markdown (human-readable)
- **Complete History:** All entries, habits, intentions, reflections
- **Privacy First:** Emphasizes data ownership
- **No Lock-In:** Users can leave anytime with their data

#### **6.4 Settings**
- **AI Personality Selection:** Switch between 5 companions anytime
- **Data Management:** Export and account controls
- **Professional UI:** Clean, organized settings interface

---

## 5. User Flows

### 5.1 Onboarding Flow: "The Golden Path" (v6.4 Streamlined)

**Goal:** Deliver an "Awe Moment" within 60 seconds without making user face a blank page.

**NEW v6.4 - Clean Slate Guarantee:**
- When user starts Guided Setup, ALL existing data is deleted
- `profile.created_at` is updated to NOW()
- Ensures 100% fresh start with no data contamination from previous sessions

**Steps (7 total - streamlined from 8 in v6.3):**

1. **The Sanctuary (Privacy)**
   - Minimalist lock icon
   - Message: *"Your thoughts. Your vault."*
   
2. **The Spark (Emotion)**
   - Select from 8 sentiments: Anxious, Excited, Overwhelmed, Calm, Tired, Inspired, Frustrated, Grateful
   - Background gradient shifts to match mood (monochromatic radial gradients)
   
3. **The Container (Life Area)**
   - Select domain: Work | Relationships | Health | Self | Money
   
4. **The Friction (Trigger)**
   - NEW v6.4: Full 8x5 sentiment-aware trigger matrix
   - 40 unique trigger sets based on sentiment + life area combination
   - Example: Anxious + Work → "Deadlines, Performance Review, Job Security, Overwhelming Tasks, Imposter Syndrome"
   
5. **Elaboration**
   - Dynamic question based on sentiment polarity
   - Positive sentiments: *"What's on your mind?"*
   - Negative sentiments: *"What's bringing you this feeling?"*
   - **Voice or text input** with microphone button
   - Personality selection integrated in this step
   
6. **Processing**
   - Visual feedback with animated processing messages
   - Entry saved to database
   - AI generates instant insight
   
7. **The Awe Moment**
   - Typewriter effect reveals insight card
   - Follow-up reflection question displayed
   - **Call-to-actions:**
     - *"Unpack this with Mindstream"* → Chat with full context
     - *"Go to my Stream"* → Stream view

**REMOVED in v6.4:**
- ❌ Suggestions step (habits/goals) - moved to post-onboarding discovery
- Reason: Too early in funnel, low context = generic suggestions

---

### 5.2 Daily Usage Flow

**Morning:**
1. Open app → See "Today's Focus" banner with daily intentions
2. **Add quick thought via voice** while making coffee (new!)
3. Check off morning habit ("Meditation")
4. Personality-matched greeting in chat

**During Day:**
5. Feeling stressed → **Quick voice entry**: *"Overwhelmed by project deadline"*
6. AI auto-tags: `work`, `stress`, suggests: *"Take a 10-minute walk"*
7. **Proactive Nudge appears:** "I've noticed stress mentions increasing. Want to talk?"
8. **Tap microphone in Chat** to voice a response

**Evening:**
9. Check Habits tab → Mark "Read 5 pages" as done
10. Generate Daily Reflection
11. Review AI insight (adapted to personality): *"Stress peaked when you skipped lunch. Consider meal habit."*
12. Accept AI suggestion → Creates new intention: *"Eat lunch by 1 PM"*
13. **Optional:** Enable voice output to hear AI responses

---

### 5.3 Voice Input Flow (NEW!)

**Scenario:** User wants to journal hands-free

1. **Stream Tab:**
   - Tap microphone button in input bar
   - Button turns teal with pulse animation
   - Placeholder changes to "Listening..."
   - User speaks: "Had a great meeting today, feeling confident"
   - Text appears in real-time
   - Tap microphone again to stop or pause automatically
   - Tap send to create entry

2. **Chat Tab:**
   - Same voice input experience
   - Ask questions hands-free: "Why do I feel anxious lately?"
   - AI responds (optionally with voice output)
   - Seamless conversation without typing

**Benefits:**
- Capture thoughts while walking, driving, exercising
- Faster input for long-form reflections
- Accessibility for users with typing difficulties
- Natural conversation flow in chat

---

### 5.4 Dual Onboarding System (NEW v6.0)

**Goal:** Accommodate different user preferences for getting started.

**The Landing Screen:**
```
┌─────────────────────────────────────┐
│          Welcome to Mindstream       │
│    Your AI companion for clarity     │
│                                      │
│  ┌─────────────┐  ┌─────────────┐   │
│  │ Quick Start │  │Guided Setup │   │
│  │  Just write │  │  5-step     │   │
│  └─────────────┘  └─────────────┘   │
└─────────────────────────────────────┘
```

#### Path A: Quick Start (Fast Users)
1. User taps "Quick Start"
2. Lands directly in Stream view (empty state with prompts)
3. Writes first entry
4. **Insight Modal appears** (NEW!) with:
   - AI-generated insight from their entry
   - Follow-up question
   - Suggested habit
   - Suggested intention
5. User chooses action: Track Habit | Set Goal | Explore in Chat | Skip
6. Action is pre-filled based on AI suggestions

#### Path B: Guided Setup (Guided Users)
1. User taps "Guided Setup"
2. Goes through 5-step onboarding wizard:
   - Privacy acknowledgment
   - Emotion selection
   - Life area selection
   - Trigger identification
   - Elaboration + AI personality selection
3. Receives AI insight and suggestions
4. Option to "Unpack in Chat"

**User Story:**
> *As a new user who doesn't like long tutorials, I can tap "Quick Start" to immediately begin journaling, and receive personalized insights after my first entry.*

---

### 5.5 Post-Entry Insight Modal (NEW v6.0)

**Purpose:** Delight Quick Start users with instant AI value after their first entry.

**Trigger Conditions:**
- User is Quick Start (not guided onboarding)
- First real entry just saved
- Entry has 10+ characters

**Modal Contents:**
```
┌─────────────────────────────────────┐
│  ✨ Here's what I noticed...        │
│                                      │
│  "[AI insight based on entry]"      │
│                                      │
│  💭 Question:                       │
│  "[Follow-up reflection question]"  │
│                                      │
│  ┌─────────────────────────────────┐│
│  │ 📈 Track Habit: "Meditation"   ││
│  │ 🎯 Set Goal: "Practice calm"   ││
│  │ 💬 Explore in Chat              ││
│  │ ✕ Skip for now                  ││
│  └─────────────────────────────────┘│
└─────────────────────────────────────┘
```

**Action Behaviors:**
| Action | Behavior |
|--------|----------|
| Track Habit | Navigate to Focus > Habits, add suggested habit |
| Set Goal | Navigate to Focus > Goals, add suggested intention |
| Explore in Chat | Open Chat, seed with entry context + follow-up question |
| Skip | Dismiss modal, continue journaling |

---

## 6. Progressive Disclosure System (NEW v6.0)

**Philosophy:** Show features only when they become meaningful.

### 6.1 The Rule (Tiered System)
```
1. Insights Tab Unlock:  5 entries
2. Daily Reflections:    5 entries
3. Weekly Reflections:   3 days since install AND 5 entries
4. Monthly Reflections:  14 days since install AND 10 entries
```

### 6.2 Tab Visibility by Entry Count

| Entries | Visible Tabs |
|---------|--------------|
| 0-4 | Stream, Focus, Chat |
| 5+ | Stream, Focus, **Insights**, Chat |

### 6.3 Why Hide Insights?

- **Empty State Problem:** Reflections with no data are meaningless
- **Cognitive Load:** New users need to focus on writing, not exploring
- **Deferred Gratification:** Reward consistent journaling with new features

### 6.4 Unlock Experience

**When a tier is unlocked:**
1. **Modal:** `ReflectionUnlockModal` appears with celebration (confetti + icon)
2. **Action:** User clicks "Check it out" → Navigates to Insights view
3. **Badge:** Red pulsing badge appears on Insights tab until visited
4. **Toast:** "🎉 Insights tab unlocked!" (for the initial 5-entry unlock)

**Implementation:**
```typescript
// MindstreamApp.tsx
const WEEKLY_UNLOCK = { days: 3, entries: 5 };
const MONTHLY_UNLOCK = { days: 14, entries: 10 };

const unlockStatus = useMemo(() => {
    // ... calculation logic ...
    return { dailyUnlocked, weeklyUnlocked, monthlyUnlocked };
}, [state.accountCreatedAt, realEntryCount]);
```

### 6.5 Future Progressive Disclosure (Deferred)

| Feature | Unlock Condition | Status |
|---------|------------------|--------|
| Insights tab | 5 entries | ✅ Implemented |
| Yearly Review | 90 days or 50 entries | 🔮 Future |
| Pattern Detection | 10+ entries | 🔮 Future |
| Behavior-based unlocks | Engagement metrics | 🔮 Future |

---

## 7. Analytics & Measurement (NEW v6.0)

**Purpose:** Track user behavior for retention analysis and product iteration.

### 7.1 Analytics Events

| Event | When | Properties |
|-------|------|------------|
| `onboarding_completed` | Landing screen choice | `{ path: 'quick_start' \| 'guided' }` |
| `entry_created` | Entry saved | `{ word_count, sentiment }` |
| `insight_modal_action` | Modal button clicked | `{ action: 'habit' \| 'goal' \| 'chat' \| 'dismiss' }` |
| `habit_completed` | Habit toggled on | `{ habit_name }` |
| `insights_unlocked` | 5th entry saved | `{}` |
| `chat_message_sent` | Chat message sent | `{ word_count }` |

### 7.2 Database Table

```sql
CREATE TABLE analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    event_name TEXT NOT NULL,
    properties JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 7.3 Query Examples

```sql
-- Daily active users
SELECT DATE(created_at), COUNT(DISTINCT user_id) 
FROM analytics_events GROUP BY DATE(created_at);

-- Onboarding funnel
SELECT properties->>'path' as path, COUNT(*) 
FROM analytics_events WHERE event_name = 'onboarding_completed'
GROUP BY properties->>'path';

-- Insight modal conversion
SELECT properties->>'action' as action, COUNT(*) 
FROM analytics_events WHERE event_name = 'insight_modal_action'
GROUP BY properties->>'action';
```

### 7.4 Key Metrics to Track

| Metric | Formula | Target |
|--------|---------|--------|
| **D1 Retention** | Users who journal on Day 2 | > 30% |
| **Onboarding Completion** | Users who write first entry | > 70% |
| **Insight Modal Engagement** | Non-dismiss actions | > 50% |
| **5-Entry Milestone** | Users reaching Insights unlock | > 40% |

---

## 8. Technical Architecture

### 6.1 Frontend Stack

| Technology | Purpose | Version | Notes |
|------------|---------|---------|-------|
| **React** | UI framework | 19.2.0 | Latest stable with concurrent features |
| **TypeScript** | Type safety | 5.8.2 | Strict mode enabled |
| **Vite** | Build tool | 6.2.0 | HMR for dev speed |
| **Tailwind CSS** | Styling | Latest | Custom brand colors + professional dark mode |
| **Framer Motion** | Animations | 11.0.0 | Used in Life view & onboarding |
| **Supabase Client** | DB/Auth | 2.45.0 | Real-time subscriptions available |
| **Google Generative AI SDK** | AI integration | 1.29.0 | Structured JSON outputs |
| **Web Speech API** | Voice I/O | Native | Text-to-Speech & Speech-to-Text |
| **Lucide React** | Icons | 0.344.0 | Consistent icon system |
| **date-fns** | Date utilities | 4.1.0 | Timezone handling |
| **react-markdown** | Chat rendering | 10.1.0 | Markdown in AI responses |
| **canvas-confetti** | Celebrations | 1.9.3 | Streak milestones |
| **recharts** | Data viz | 2.15.0 | Sentiment timelines |
| **AIStatusBanner** | UI Comp | Custom | Shows real-time AI status (ready, error, etc.) |

### 6.2 Backend Stack

| Technology | Purpose | Notes |
|------------|---------|-------|
| **Supabase (PostgreSQL)** | Database | Free tier (500MB) |
| **Supabase Auth** | User management | Magic links + OAuth ready |
| **Row Level Security (RLS)** | Data isolation | Users can only access their own data |
| **Google Gemini 2.0 Flash** | AI model | Latest multimodal model |

### 6.3 Core Architectural Patterns

#### **1. Optimistic UI (Zero Latency UX)**

**Problem:** Network requests create perceived lag.

**Solution:** Update UI immediately, sync DB in background.

**Implementation:**
```typescript
// Example: Habit Toggle
const handleToggleHabit = (habitId) => {
  // 1. Update UI instantly using Ref (prevents race conditions)
  habitLogsRef.current = [...newLogs];
  setHabitLogs(newLogs);
  
  // 2. Debounce network call (500ms)
  debounceTimers.current[habitId] = setTimeout(() => {
    db.syncHabitCompletion(userId, habitId, willBeCompleted);
  }, 500);
}
```

**Benefits:**
- Feels native
- Handles spam-clicking
- Self-healing (server is source of truth)

---

#### **2. Graceful Degradation (AI Safety Net)**

**Problem:** AI APIs can fail (rate limits, outages).

**Solution:** App works as "dumb journal" if AI unavailable.

**Scenario A: Entry Creation**
1. User submits text
2. AI call fails
3. **Fallback:** Save with defaults
   - Tags: `["Unprocessed"]`
   - Emoji: `"📝"`
   - Title: `"Entry"`
4. User's data is never lost

**Scenario B: Habit Creation**
- AI categorization fails → Defaults to `Category: System`, `Emoji: ⚡`

---

#### **3. Debounced Persistence**

**Problem:** Rapid UI interactions (spam-clicking habits) flood DB.

**Solution:** Batch writes with intelligent debouncing.

**Implementation:**
- User clicks habit 5 times in 2 seconds
- Only 1 DB call fires after 500ms of inactivity
- Final state is **idempotent** (DB enforces correctness)

**Benefits:**
- Reduces Supabase API calls (stays under free tier)
- Prevents race conditions
- Improves perceived performance

---

#### **4. Dynamic Personality Loading**

**Problem:** AI needs to adapt tone based on user preference.

**Solution:** Inject personality-specific system prompts.

**Implementation:**
```typescript
const getUserContext = async (userId) => {
  const preferences = await getPreferences(userId);
  return {
    ...context,
    personalityId: preferences.ai_personality || 'stoic'
  };
};

const getChatResponse = async (messages, context) => {
  const personality = getPersonality(context.personalityId);
  const systemInstruction = personality.systemPrompt + contextPrompt;
  // ...
};
```

**Benefits:**
- Single codebase, multiple personalities
- Easy to add new personalities
- User can switch anytime

---

#### **5. Pattern Detection & Proactive Nudging**

**Problem:** Users don't always notice their own patterns.

**Solution:** Background analysis triggers timely interventions.

**Implementation:**
```typescript
// Pattern Detector
const detectMoodDecline = (entries) => {
  const recentNegative = entries
    .slice(0, 3)
    .filter(e => ['Anxious', 'Sad', 'Overwhelmed'].includes(e.sentiment));
  
  return recentNegative.length >= 2; // 2 of last 3 entries negative
};

// Nudge Engine
if (detectMoodDecline(entries)) {
  createNudge({
    pattern_type: 'mood_decline',
    message: 'I'm noticing some challenging emotions lately. Want to talk about it?',
    suggested_action: 'chat_reflection'
  });
}
```

**Detected Patterns:**
- Mood decline (3+ consecutive negative entries)
- Habit abandonment (breaking consistent streaks)
- Intention stagnation (goals pending 7+ days)
- Positive reinforcement (celebrate streaks)

---

#### **6. Universal Voice Input (NEW!)**

**Problem:** Users want to journal hands-free in multiple contexts.

**Solution:** Consistent voice input pattern across Stream and Chat tabs.

**Implementation:**
```typescript
// Speech Recognition Setup
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();
recognition.continuous = false;
recognition.interimResults = true;
recognition.lang = 'en-US';

// State Management
const [isListening, setIsListening] = useState(false);
const recognitionRef = useRef(recognition);

// Event Handlers
recognition.onresult = (event) => {
  let finalTranscript = '';
  for (let i = event.resultIndex; i < event.results.length; ++i) {
    if (event.results[i].isFinal) {
      finalTranscript += event.results[i][0].transcript;
    }
  }
  setText(prevText => prevText + (prevText ? ' ' : '') + finalTranscript);
};

// UI Feedback
<button onClick={toggleListening} className={isListening ? 'bg-brand-teal' : ''}>
  <MicIcon />
  {isListening && <div className="animate-pulse-ring" />}
</button>
```

**Components with Voice:**
- `InputBar.tsx` (Stream tab)
- `ChatInputBar.tsx` (Chat tab) **← NEW!**
- `OnboardingWizard.tsx` (Elaboration step)

**Browser Support:**
- Chrome/Edge: Full support
- Safari: Full support (iOS 14.5+)
- Firefox: Limited (requires flag)

---

### 6.4 State Management

**Pattern:** Centralized logic hook (`useAppLogic.ts`)

**Why not Redux/Zustand?**
- App is small enough for React Context + custom hooks
- Avoids boilerplate
- Keeps logic colocated with UI

**Structure:**
```typescript
const { state, actions } = useAppLogic();

state: {
  entries, reflections, intentions, habits, habitLogs,
  insights, nudges, autoReflections, messages,
  isDataLoaded, aiStatus, toast, userPreferences, ...
}

actions: {
  handleAddEntry, handleToggleHabit, handleSendMessage,
  handleAcceptSuggestion, handleDismissNudge,
  handleChangePersonality, handleExportData, ...
}
```

---

### 6.5 AI Integration

**Service:** `services/geminiService.ts`

**Key Functions:**

| Function | Input | Output | Purpose |
|----------|-------|--------|---------|
| `processEntry` | Entry text | Title, tags, sentiment, emoji | Enriches raw text |
| `generateReflection` | Entries + Habits + Intentions | Summary + suggestions | Daily/weekly synthesis |
| `getChatResponseStream` | Messages + UserContext | Streaming text | Conversational AI |
| `generateChatStarters` | Recent entries + intentions | 3 conversation openers | Reduce blank-state friction |
| `generateOnboardingSuggestions` | First entry text | Habits + Intentions | Smart onboarding |
| `generateYearlyReview` | Annual data | Themes + Core Memories | Yearly insights |

**Schema-Driven Outputs:**
- All AI calls use `responseMimeType: "application/json"`
- Responses validated against TypeScript interfaces
- Fails gracefully if JSON parsing errors

**Example:**
```typescript
const response = await ai.models.generateContent({
  model: 'gemini-2.0-flash',
  contents: prompt,
  config: {
    responseMimeType: "application/json",
    responseSchema: {
      type: "object",
      properties: {
        title: { type: "string" },
        tags: { type: "array", items: { type: "string" } },
        emoji: { type: "string" }
      }
    }
  }
});
```

---

## 7. Database Schema

### Complete Schema Definition

```sql
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Custom Enums
create type intention_timeframe as enum ('daily', 'weekly', 'monthly', 'yearly', 'life');
create type intention_status as enum ('pending', 'completed');

-- 1. Profiles Table
create table profiles (
  id uuid references auth.users(id) on delete cascade not null primary key,
  full_name text,
  avatar_url text,
  email text,
  created_at timestamptz default now()
);

-- 2. User Preferences Table
create table user_preferences (
  user_id uuid references auth.users(id) on delete cascade not null primary key,
  ai_personality text default 'stoic',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3. Entries Table
create table entries (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  text text not null,
  title text,
  type text,
  audio_url text,
  timestamp timestamptz default now(),
  tags text[],
  primary_sentiment text,
  emoji text,
  secondary_sentiment text,
  suggestions jsonb
);

-- 4. Reflections Table
create table reflections (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  summary text,
  date date not null,
  timestamp timestamptz default now(),
  type text not null,
  suggestions jsonb,
  auto_generated boolean default false
);

-- 5. Habits Table
create table habits (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  emoji text,
  frequency text not null,
  current_streak int4 default 0,
  longest_streak int4 default 0,
  created_at timestamptz default now(),
  category text
);

-- 6. Habit Logs Table
create table habit_logs (
  id uuid default uuid_generate_v4() primary key,
  habit_id uuid references habits(id) on delete cascade not null,
  completed_at timestamptz default now()
);

-- 7. Intentions Table
create table intentions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  text text not null,
  due_date timestamptz,
  is_life_goal boolean default false,
  timeframe intention_timeframe, -- DEPRECATED: Kept for migration
  status intention_status default 'pending',
  is_recurring bool default false,
  tags text[],
  target_date date, -- DEPRECATED
  completed_at timestamptz,
  created_at timestamptz default now()
);

-- 8. Insight Cards Table
create table insight_cards (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  type text not null,
  title text not null,
  content text not null,
  metadata jsonb,
  created_at timestamptz default now(),
  dismissed boolean default false
);

-- 9. Proactive Nudges Table
create table proactive_nudges (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  pattern_type text not null,
  message text not null,
  suggested_action text not null,
  status text default 'pending',
  created_at timestamptz default now(),
  acted_on_at timestamptz
);

-- Row Level Security (RLS)
alter table profiles enable row level security;
alter table user_preferences enable row level security;
alter table entries enable row level security;
alter table reflections enable row level security;
alter table habits enable row level security;
alter table habit_logs enable row level security;
alter table intentions enable row level security;
alter table insight_cards enable row level security;
alter table proactive_nudges enable row level security;

-- RLS Policies (Users can only access their own data)
create policy "Users can view own profile" on profiles for select using (auth.uid() = id);
create policy "Users can view own preferences" on user_preferences for select using (auth.uid() = user_id);
create policy "Users can update own preferences" on user_preferences for update using (auth.uid() = user_id);
create policy "Users can view own entries" on entries for select using (auth.uid() = user_id);
create policy "Users can insert own entries" on entries for insert with check (auth.uid() = user_id);
create policy "Users can view own nudges" on proactive_nudges for select using (auth.uid() = user_id);
create policy "Users can update own nudges" on proactive_nudges for update using (auth.uid() = user_id);
-- (Additional policies for all tables following same pattern)
```

### Key Design Decisions

1. **No user_id in habit_logs**
   - Ownership determined via `habits.user_id` FK
   - Reduces redundancy
   - RLS enforced via EXISTS subquery

2. **JSONB for suggestions**
   - Flexible schema for AI outputs
   - Avoids separate tables for now
   - Can add indexes later if needed

3. **Timezone handling**
   - All timestamps stored as `timestamptz` (UTC)
   - Client converts to local time for display

4. **User preferences table**
   - Stores AI personality preference
   - Extensible for future settings
   - Separate from profiles for clarity

5. **Proactive nudges table**
   - Tracks pattern-based interventions
   - Status field for accept/dismiss tracking
   - Timestamps for analytics

---

## 8. AI System

### 8.1 Model Selection

**Primary Model:** Google Gemini 2.0 Flash

**Why?**
- Fast (<2s latency)
- Multimodal ready (future: voice, images)
- Structured output support (JSON schema)
- Cost-effective vs. GPT-4
- Good at personality adaptation

### 8.2 Personality System

**Implementation:**

**5 Distinct Personalities:**

| Personality | Emoji | Traits | Use Case |
|------------|-------|--------|----------|
| **Stoic Companion** | 🏛️ | Direct, wise, philosophical | Logical users who value clarity |
| **Empathetic Friend** | 💙 | Warm, validating, gentle | Emotional processing, difficult times |
| **Tough Coach** | 💪 | Challenging, accountable, direct | Users who need accountability |
| **Curious Explorer** | 🔍 | Questioning, analytical, Socratic | Self-discovery, deep exploration |
| **Cheerleader** | 🎉 | Enthusiastic, celebratory, positive | Motivation, celebration, momentum |

**Technical Details:**
- Each personality has unique `systemPrompt`
- User selection stored in `user_preferences.ai_personality`
- Prompt dynamically injected into all AI calls
- Can be changed anytime via Settings

**Example System Prompt (Stoic):**
```
You are Mindstream's Stoic Companion—a wise, direct, and compassionate guide.
- Short, clear sentences
- Use "you" and "your" (personal, not clinical)
- Be honest but never harsh
- Occasional philosophical references
- No jargon, no platitudes
Example: "Three days of 'anxious' tags. What's the pattern here?"
```

### 8.3 RAG (Retrieval Augmented Generation)

**Implementation:**
1. User asks question in Chat
2. AI extracts keywords from question
3. PostgreSQL full-text search finds relevant entries
4. Relevant entries injected into system prompt
5. AI responds with informed context (in selected personality's voice)

**NEW v6.4 - Date Filtering:**
- All search results filtered by `profile.created_at` (account creation timestamp)
- Prevents retrieval of entries from before user's current account session
- Uses `getAccountCreatedAt()` with caching for performance

**Example:**
```
User: "Why do I procrastinate?"

Keywords extracted: ["procrastinate", "delay", "avoidance"]

Search results (filtered by created_at):
- "Feeling overwhelmed by project" (Nov 20)
- "Avoided starting proposal" (Nov 18)

Context injected:
"[Personality: Stoic] User mentioned procrastination in these entries: [...]
Based on their history, provide insight."
```

### 8.4 AI Quality Improvements (NEW v6.4)

**Problem:** AI was fabricating historical context for new users (e.g., "Three days of anxious tags" when user had only one entry).

**Root Causes Identified:**
1. `searchEntries()` was not filtering by `profile.created_at`, allowing old test data to be returned
2. Date formatting was ambiguous (`8/12/2025` interpreted as Aug 12 instead of Dec 8)
3. System prompts lacked explicit anti-hallucination instructions

**Solutions Implemented:**

#### 1. Anti-Hallucination System Prompt
Added explicit instructions to `geminiService.ts`:
```
CRITICAL RULES:
- NEVER fabricate history. If the context shows few or no entries, the user is new.
- NEVER claim the user has "X days of..." anything unless the context explicitly shows it.
- If the context shows "No recent entries" or minimal data, treat the user as brand new.
- If asked about patterns you don't have data for, say "Based on what you've shared so far..." not "I see a pattern of..."
```

#### 2. User Status Indicator
Added explicit entry count to context:
```
USER STATUS: This user has 1 journal entries total.
⚠️ THIS IS A BRAND NEW USER - they just started using the app.
Do NOT claim they have patterns, history, or "X days of..." anything.
```

#### 3. Unambiguous Date Formatting
Changed from `toLocaleDateString()` (ambiguous: `8/12/2025`) to:
```typescript
toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
// Output: "December 8, 2025"
```

#### 4. Account Reset on Onboarding
When user starts Guided Setup:
```typescript
resetAccountData(userId):
  - DELETE all entries, habits, intentions, reflections
  - DELETE all habit_logs, chart_insights, analytics
  - UPDATE profile.created_at = NOW()
  - CLEAR accountCreatedAt cache
```
This guarantees 100% clean slate with no data contamination.

### 8.5 Pattern Detection AI (Deferred in v6.4)

**Purpose:** Automatically identify behavioral patterns without user input.

**Patterns Detected:**
1. **Mood Decline:** 3+ consecutive entries with negative sentiment
2. **Habit Abandonment:** Breaking a 7+ day streak
3. **Intention Stagnation:** Intention is overdue or pending >7 days without progress
4. **Positive Reinforcement:** Milestone streaks (7, 30, 100 days)

**Implementation:**
- Runs on `useEffect` 2 seconds after data loads
- Uses simple heuristics (no ML needed yet)
- Creates nudge records in DB
- UI polls for pending nudges

**Future Enhancements:**
- More sophisticated pattern matching
- Correlation detection (e.g., "anxiety correlates with low sleep")
- Predictive nudging ("You usually skip habits on Fridays")

### 8.5 Yearly Review AI

**Purpose:** Generate annual insights and identify major themes.

**Process:**
1. Aggregate all user data for selected year
2. Calculate statistics (words, sentiment distribution, streaks)
3. AI analyzes entries to extract:
   - **Yearly Themes:** 3-4 major life themes
   - **Core Memories:** Most impactful entries
   - **Growth Patterns:** Changes over time

**AI Prompt Strategy:**
```
Analyze these entries from 2024:
[Sample entries with timestamps]

Identify:
1. 3-4 major themes that defined this year
2. 3-5 "core memories" (most significant moments)
3. Any notable growth patterns

Format: JSON with themes[], coreMemories[]
```

---

## 9. Design System & UI/UX

### 9.1 Professional Color System (v5.0 UPDATE)

**Philosophy:** Calm · Growth · Clarity

**Core Principle:** Every color choice supports mental clarity and reduces cognitive load.

#### **Brand Colors (Tailwind Config)**

```javascript
colors: {
  // === BRAND IDENTITY ===
  'brand-indigo': '#191E38',    // Primary dark background (legacy)
  'brand-teal': '#2DD4BF',      // Primary accent (teal-400) - FIXED from invalid hex
  'brand-surface': '#F8F9FA',   // Light surface (unused in dark theme)
  
  // === SEMANTIC DARK BACKGROUNDS ===
  'mindstream-bg-primary': '#0F1419',    // Deepest, richer dark (main app)
  'mindstream-bg-surface': '#1A1F2E',    // Card backgrounds (warmer than gray)
  'mindstream-bg-elevated': '#242938',   // Modals, tooltips, reflection cards
  
  // === FUNCTIONAL GRAYS ===
  'dark-surface': '#1F2937',          // Gray-800 (cards, surfaces)
  'dark-surface-light': '#374151',    // Gray-700 (inputs, elevated)
}
```

#### **Text Hierarchy (Semantic)**

| Level | Color | Hex | Usage | Contrast Ratio |
|-------|-------|-----|-------|----------------|
| **Primary** | `text-white` | #FFFFFF | Headings, primary content, CTAs | 14.8:1 ✅ |
| **Secondary** | `text-gray-200` | #E5E7EB | Section headers, card titles | 12.6:1 ✅ |
| **Tertiary** | `text-gray-300` | #D1D5DB | Body text, descriptions | 10.2:1 ✅ |
| **Muted** | `text-gray-400` | #9CA3AF | Helper text, metadata, timestamps | 6.4:1 ✅ |
| **Borders/Separators** | `text-gray-500` | #6B7280 | **Never for text on dark BG** | 4.2:1 ⚠️ |
| **Disabled** | `text-gray-600` | #4B5563 | **Avoid entirely** | 2.9:1 ❌ |

#### **Overlay System**

| Overlay | Value | Usage |
|---------|-------|-------|
| **Modal Backdrop** | `bg-black/70` | All modal backgrounds |
| **Light Overlay** | `bg-white/5` | Unselected states, subtle highlights |
| **Hover** | `bg-white/10` | Interactive hover states |
| **Active/Selected** | `bg-white/10-20` | Selected items, active tabs |
| **Themed Overlays** | `bg-[color]-900/20-30` | Error (red), info (blue), debug (red) |

**Critical Rules:**
- ❌ **Never use `text-gray-500` or darker on dark backgrounds**
- ✅ **Minimum readability:** `text-gray-400` for helper text
- ✅ **Prefer:** `text-gray-300` for body, `text-gray-200` for labels
- ❌ **Avoid black overlays** (`bg-black/20-50`) - use themed alternatives

#### **Accessibility Compliance**

**WCAG AA Standards:**
- Normal text (< 18pt): **4.5:1 minimum** ✅
- Large text (≥ 18pt): **3:1 minimum** ✅
- Interactive elements: **3:1 minimum** ✅

**Current Compliance:**
- All primary text: **10.2:1+** (Excellent)
- Helper text: **6.4:1** (Good)
- Teal accent: **7.8:1** (Excellent)

#### **Mood & Category Colors**

**13 Granular Sentiments:**
| Mood | Background | Text | Usage |
|------|------------|------|-------|
| Joyful | `bg-yellow-700/50` | `text-yellow-300` | Positive entries |
| Grateful | `bg-green-700/50` | `text-green-300` | Appreciation |
| Anxious | `bg-red-800/50` | `text-red-300` | Stress, worry |
| Sad | `bg-blue-800/50` | `text-blue-300` | Low mood |
| Overwhelmed | `bg-purple-800/50` | `text-purple-300` | High stress |
| Reflective | `bg-slate-700/50` | `text-slate-300` | Contemplative |

**6 Habit Categories:**
| Category | Icon | Color | Light | Usage |
|----------|------|-------|-------|-------|
| Health | 🏃 | `red-400` | `red-300` | Physical/mental wellness |
| Growth | ⚡ | `yellow-400` | `yellow-300` | Learning, development |
| Career | 💼 | `blue-400` | `blue-300` | Professional goals |
| Finance | 💰 | `green-400` | `green-300` | Money management |
| Connection | 💜 | `purple-300` | `purple-300` | Relationships |
| System | 🛠️ | `slate-400` | `slate-300` | Organization |

#### **Animation System**

**Custom Tailwind Animations:**
```javascript
animation: {
  'fade-in': 'fadeIn 0.5s ease-in-out',
  'fade-in-up': 'fadeInUp 0.5s ease-in-out',
  'pulse-ring': 'pulseRing 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
  'slide-up': 'slideUp 0.3s ease-out'
}
```

**Usage:**
- `fade-in`: Modal overlays, toasts
- `fade-in-up`: Cards, entry reveal
- `pulse-ring`: Voice recording indicator
- `slide-up`: Bottom sheets, popups

#### **Shadow System**

**Elevation Layers:**
```javascript
boxShadow: {
  'sm': '0 1px 2px rgba(0, 0, 0, 0.05)',
  'DEFAULT': '0 1px 3px rgba(0, 0, 0, 0.1)',
  'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
  'xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
  'teal-glow': '0 0 8px rgba(45, 212, 191, 0.3)'
}
```

**Usage:**
- `shadow-lg`: Cards, buttons
- `shadow-teal-glow`: Active habit cells, teal highlights
- `shadow-xl`: Modals, popovers

### 9.2 Typography System

**Font Stack:**
```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 
             'Helvetica Neue', Arial, sans-serif;
```

**Display Font:**
- Used for headings, numbers
- Weight: 700 (Bold)
- Applied via `font-display` utility class

**Scale:**
| Size | Class | Usage |
|------|-------|-------|
| 3xl | `text-3xl` | Page titles |
| 2xl | `text-2xl` | Section headers |
| xl | `text-xl` | Card headers |
| lg | `text-lg` | Entry titles |
| base | `text-base` | Body text |
| sm | `text-sm` | Helper text |
| xs | `text-xs` | Metadata, labels |

### 9.3 Component UI Patterns

#### **Cards**
```tsx
className="bg-dark-surface border border-white/10 rounded-lg p-4"
```
- Elevated backgrounds for importance: `bg-mindstream-bg-elevated`
- Reflection cards use elevated for premium feel

#### **Buttons**

**Primary (Teal):**
```tsx
className="bg-brand-teal text-white rounded-full px-4 py-2 hover:bg-teal-300"
```

**Secondary:**
```tsx
className="bg-dark-surface text-white border border-white/10 hover:bg-white/10"
```

**Icon Buttons:**
```tsx
className="p-3 rounded-full hover:bg-white/10 transition-colors"
```

**Active State (Voice):**
```tsx
className={isListening ? 'bg-brand-teal' : 'hover:bg-white/10'}
```

#### **Input Fields**

**Textarea:**
```tsx
className="bg-dark-surface-light text-white placeholder-gray-400 
           rounded-lg p-3 focus:ring-2 focus:ring-brand-teal"
```

**Select/Dropdown:**
```tsx
className="bg-dark-surface-light text-white border border-white/10"
```

#### **Badges & Tags**

**Sentiment Badges:**
```tsx
className="px-2 py-1 rounded-full text-xs bg-[mood-bg] text-[mood-text]"
```

**Category Badges:**
```tsx
className="px-3 py-1 rounded-full bg-[category]/20 text-[category] ring-1 ring-[category]/50"
```

### 9.4 Responsive Design

**Breakpoints:**
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px

**Mobile-First Patterns:**
- Stack vertically on mobile
- Side-by-side layouts on `md+`
- Hidden on mobile (hamburger menu): `hidden lg:flex`
- Full width on mobile: `w-full lg:w-auto`

**Touch Targets:**
- Minimum 44x44px (iOS/Android standards)
- All buttons: `p-3` (48x48px)
- Icon buttons: `w-12 h-12` minimum

### 9.5 Loading & Empty States

**Loading Spinners:**
```tsx
<div className="w-5 h-5 border-2 border-brand-teal border-t-transparent rounded-full animate-spin" />
```

**Empty States:**
- Centered layout
- Icon/emoji
- Clear message
- Call-to-action

**Skeleton Loaders:**
```tsx
className="animate-pulse bg-gray-700/50 h-4 rounded"
```

### 9.6 Micro-Interactions

**Haptic Feedback:**
- Entry saved: `light`
- Habit toggled: `medium`
- Error: `error`

**Confetti:**
- 7-day streak
- 30-day streak
- 100-day streak

**Toasts:**
- Success: Green with checkmark
- Error: Red with X
- Info: Blue with info icon
- Auto-dismiss after 3s

---

## 10. Security & Privacy

### 10.1 Data Ownership

**Your Data = Your Vault**
- All user data stored in their isolated Supabase project
- No analytics tracking
- No third-party data sharing
- **Full export functionality** (JSON + Markdown)
- Users can delete account and take data with them

### 10.2 Authentication

**Provider:** Supabase Auth
- Magic Link (passwordless)
- OAuth ready (Google, GitHub)
- JWT tokens with automatic refresh
- Secure session management

### 10.3 Row Level Security (RLS)

**Enforcement:**
```sql
-- Example: Entries
create policy "Users can view own entries" 
  on entries for select 
  using (auth.uid() = user_id);

-- Example: Habit Logs (via FK)
create policy "Users can view own habit logs"
  on habit_logs for select
  using (
    exists (
      select 1 from habits
      where habits.id = habit_logs.habit_id
      and habits.user_id = auth.uid()
    )
  );
```

**Result:** Users can ONLY access their own data. PostgreSQL enforces at database level (not just app logic).

### 10.4 API Keys

**Current:** Client-side Gemini API key (user provides)
**Roadmap:** Move to Supabase Edge Functions to hide API key

---

## 11. Deployment & DevOps

### 11.1 Architecture

```
GitHub (onboarding_improvement branch)
    ↓
Vercel (Auto-deploy)
    ↓
Production URL: mindstream-v1.vercel.app
```

### 11.2 Branch Strategy

| Branch | Purpose | Auto-Deploy |
|--------|---------|-------------|
| `main` | Production | ✅ Yes → Production |
| `onboarding_improvement` | **Active development** | ✅ Yes → Preview URL |
| Feature branches | Development | ✅ Yes → Preview URL |

### 11.3 Deployment Workflow

1. Developer pushes to `onboarding_improvement`
2. Vercel detects commit → Builds preview
3. Preview URL: `mindstream-git-onboarding-improvement.vercel.app`
4. Product Manager tests features
5. Merge PR to `main`
6. Vercel deploys to production within ~60 seconds

### 11.4 Environment Variables

**Required in Vercel:**
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_SENTRY_DSN` (for error monitoring)

**Required in Supabase Secrets (Server-Side):**
- `GEMINI_API_KEY` (used by `ai-proxy` Edge Function - never exposed to client)

---

## 12. Future Roadmap

### Phase 7: Enhanced Intelligence (Q1 2026)
- [x] AI Personality System
- [x] Proactive Nudges
- [x] Voice Output (TTS)
- [x] Voice Input (Universal) **← COMPLETED v5.0**
- [x] Smart Onboarding Suggestions
- [x] Data Export
- [x] Yearly Review
- [x] Professional Color System **← COMPLETED v5.0**
- [ ] Sentiment trend graphs
- [ ] Habit completion correlation charts
- [ ] Voice journaling with audio storage
- [ ] Automated weekly email summaries

### Phase 8: Platform Expansion (Q2 2026)
- [ ] Progressive Web App (offline mode)
- [ ] iOS/Android native apps (React Native)
- [ ] Browser extension for quick capture
- [ ] API for third-party integrations

### Phase 9: Integrations (Q3 2026)
- [ ] Calendar sync (Google Calendar for Intentions)
- [ ] Spotify integration (music mood analysis)
- [ ] Apple Health / Google Fit (activity correlation)
- [ ] Todoist/Notion sync

### Phase 10: Advanced Features (Q4 2026)
- [ ] Collaborative reflections (share with therapist/coach)
- [ ] Custom personality creation
- [ ] Multi-modal input (photos, location)
- [ ] Advanced pattern ML (beyond heuristics)

---

## Appendix A: Key Metrics

**Current Stats (as of Nov 2025):**
- **Users:** Early access (<100)
- **Entries:** ~8,000
- **Habits Tracked:** ~2,500
- **AI Personalities:** 5 available
- **Average session:** 4.1 minutes
- **Return rate:** 72% (7-day)
- **Voice input adoption:** TBD (new feature)

**Target Metrics (6 months):**
- 1,000 active users
- 80%+ 7-day retention
- <3s average load time
- 95%+ uptime
- 50%+ users try multiple personalities
- 30%+ users adopt voice input

---

## Appendix B: Technical Debt

**Resolved in v5.0:**
1. ~~Invalid brand-teal hex value~~ **(FIXED Nov 29)**
2. ~~Illegible text on dark backgrounds~~ **(FIXED Nov 29)**
3. ~~Missing voice input in Chat~~ **(FIXED Nov 29)**
4. ~~Harsh black overlays~~ **(FIXED Nov 29)**

**Known Issues:**
1. Type safety (`any` casts in `dbService.ts`)
2. No automated tests
3. Client-side API key exposure
4. Some TypeScript lint errors (module declarations - IDE only, runtime OK)

**Priority:** Address in Q1 2026

---

## Appendix C: Complete Component Architecture

### Component Inventory (57 Files)

#### **Views (7 components)**
- `Stream.tsx` - Main thought feed with voice input
- `HabitsView.tsx` - Habit tracking with frequency tabs
- `ChatView.tsx` - Conversational AI with voice input **← UPDATED v5.0**
- `IntentionsView.tsx` - Goal management with ETA presets
- `ReflectionsView.tsx` - Daily/Weekly/Monthly insights
- `InsightsView.tsx` - Analytics dashboard
- `SettingsView.tsx` - User preferences & data export

#### **Cards (9 components)**
- `EntryCard.tsx` - Journal entry with AI enrichment
- `HabitCard.tsx` - Habit with streak & history
- `IntentionCard.tsx` - Goal with ETA display
- `ReflectionCard.tsx` - AI reflection summary **← UPDATED v5.0 (color)**
- `InsightCard.tsx` - Pattern insight
- `AutoReflectionCard.tsx` - Auto-generated reflection
- `YearlyReview.tsx` - Annual review slideshow
- `ProactiveNudge.tsx` - Pattern-based alert
- `OnboardingSuggestionCard.tsx` - Smart onboarding

#### **Input Components (5 components)**
- `InputBar.tsx` - Stream voice/text input
- `ChatInputBar.tsx` - Chat voice/text input **← UPDATED v5.0**
- `HabitsInputBar.tsx` - Habit creation
- `IntentionsInputBar.tsx` - Intention creation with ETA
- `ETASelector.tsx` - Deadline preset picker

#### **Interactive Components (11 components)**
- `OnboardingWizard.tsx` - 7-step onboarding flow **← UPDATED v6.3 (logo header)**
- `PersonalitySelector.tsx` - AI companion picker
- `SearchModal.tsx` - Full-text entry search
- `ThematicModal.tsx` - Tag-based deep dive
- `EditEntryModal.tsx` - Entry editing
- `EditHabitModal.tsx` - Habit editing
- `EditIntentionModal.tsx` - Intention editing with ETA picker
- `DeleteConfirmationModal.tsx` - Safe deletion
- `PrivacyModal.tsx` - First-launch privacy message
- `ReflectionUnlockModal.tsx` - Tier unlock celebration **← NEW v6.2**
- `LifeAreaDashboard.tsx` - Domain-filtered view

#### **Empty State Components (3 components)**
- `EmptyStreamState.tsx` - No entries yet (with guided prompts)
- `EmptyHabitsState.tsx` - No habits yet (with quick-add)
- `EmptyIntentionsState.tsx` - No intentions yet (with suggestions)

#### **Loading & Skeleton Components (1 component)** ← **NEW v6.3**
- `SkeletonLoader.tsx` - Reusable loading placeholders (text, circular, rectangular variants)

#### **Data Visualization (5 components)**
- `HabitHeatmap.tsx` - GitHub-style completion graph
- `SentimentTimeline.tsx` - Mood trends over time
- `CorrelationDashboard.tsx` - Habit-mood correlations
- `DailyPulse.tsx` - Quick stats widget
- `TodaysFocusBanner.tsx` - Daily focus intentions

#### **Utility Components (10 components)**
- `NavBar.tsx` - Bottom tab navigation
- `Header.tsx` - Top bar with search/settings
- `Toast.tsx` - Notification system
- `MessageBubble.tsx` - Chat message display
- `HabitLogButton.tsx` - Individual habit checkbox
- `FloatingBubbles.tsx` - Mood background animation
- `InfoTooltip.tsx` - Help tooltip
- `ActionableSuggestion.tsx` - AI suggestion chip
- `ReflectionList.tsx` - Reflection history
- `SuggestionChips.tsx` - Guided prompts

#### **System Components (3 components)**
- `Login.tsx` - Google OAuth login
- `MissingCredentials.tsx` - API key prompt
- `ConfigurationError.tsx` - Setup error
- `AIStatusBanner.tsx` - AI health status

#### **Weekly/Monthly Reflections (2 components)**
- `WeeklyReflections.tsx` - 7-day synthesis
- `MonthlyReflections.tsx` - 30-day synthesis
- `DailyReflections.tsx` - 24-hour synthesis

#### **Icons (21 components)**
All icons in `/components/icons/` using Lucide React standard:
- `MicIcon.tsx` **← Used for voice input**
- `SendIcon.tsx`, `ChatIcon.tsx`, `SearchIcon.tsx`
- `FlameIcon.tsx`, `SparklesIcon.tsx`, `CheckCircleIcon.tsx`
- `TrashIcon.tsx`, `PencilIcon.tsx`, `PlusCircleIcon.tsx`
- Plus 12 more utility icons

---

### Service Architecture (13 Files)

#### **Core Services (3 files)**
- `dbService.ts` - All Supabase database operations (23KB)
- `geminiService.ts` - AI API calls & streaming (8KB)
- `supabaseClient.ts` - Supabase initialization

#### **AI Intelligence Services (5 files)**
- `intelligenceEngine.ts` - Core AI logic orchestration
- `reflectionService.ts` - Daily/weekly/monthly synthesis
- `patternDetector.ts` - Behavioral pattern detection
- `nudgeEngine.ts` - Proactive intervention system
- `onboardingSuggestions.ts` - Smart first-time suggestions

#### **Feature Services (3 files)**
- `yearlyReviewService.ts` - Annual insights generation
- `dataExportService.ts` - JSON/Markdown full export
- `chartInsightsService.ts` - Data visualization prep

#### **Utility Services (2 files)**
- `smartDefaults.ts` - Dynamic placeholder prompts
- `geminiClient.ts` - API client configuration

---

### Utility Functions (6 Files)

- `celebrations.ts` - Confetti animations for milestones
- `date.ts` - Date formatting & timezone handling
- `etaCalculator.ts` - Deadline calculation logic
- `haptics.ts` - Mobile haptic feedback
- `streak.ts` - Habit streak computation
- `tts.ts` - Text-to-Speech voice output **← Voice system**

---

### Root Files

- `MindstreamApp.tsx` - Main app component with state management (17KB)
- `App.tsx` - Router wrapper
- `types.ts` - TypeScript interfaces (all data models)
- `index.html` - Tailwind config with color system **← UPDATED v5.0**
- `schema.sql` - Database schema reference
- `package.json` - Dependencies

---

## Appendix D: Contact & Links

**Repository:** [github.com/Shivansh4497/Mindstream_v1](https://github.com/Shivansh4497/Mindstream_v1)  
**Live App:** [mindstream-v1.vercel.app](https://mindstream-v1.vercel.app)  
**Database:** Supabase (PostgreSQL)  
**Product Manager:** Shivansh  
**CTO (AI):** Your Friendly AI Assistant 🤖

---

**Document Change Log:**
- **v6.0 (Dec 6, 2025):** Dual Onboarding, Progressive Disclosure & Analytics
  - **NEW:** Landing Screen with Quick Start / Guided Setup paths
  - **NEW:** Post-Entry Insight Modal for Quick Start users
  - **NEW:** Progressive Disclosure - hide Insights tab until 5 entries
  - **NEW:** Badge + Toast unlock notification system
  - **NEW:** Analytics events system (7 core events in Supabase)
  - **NEW:** Sections 6 (Progressive Disclosure) and 7 (Analytics)
  - **UPDATED:** User Flows with dual onboarding paths
  - **UPDATED:** Technical architecture with new components

- **v5.0 (Nov 30, 2025):** Professional Design System & Universal Voice Input
  - **NEW:** Added universal voice input to Chat tab (matching Stream)
  - **NEW:** Professional color system v2.0 (fixed invalid brand-teal, semantic tokens)
  - **NEW:** Comprehensive design system documentation
  - **NEW:** Professional dark theme guidelines (mindstream-bg-*)
  - **NEW:** Accessibility compliance section (WCAG AA)
  - **NEW:** Complete component inventory (57 components documented)
  - **NEW:** Service architecture details (13 services)
  - **FIXED:** Illegible text on dark backgrounds (color audit & fixes)
  - **FIXED:** Dark overlays replaced with themed alternatives
  - **UPDATED:** All UI/UX sections with current implementation
  - **UPDATED:** Technical architecture with voice input patterns
  - **UPDATED:** Browser compatibility for voice features
  
- **v4.1 (Nov 29, 2025):** Intentions System Redesign
  - Replaced timeframe buckets with ETA-based system (Due Dates)
  - Added "Custom Date" and natural language presets
  - Updated schema with `due_date` and `is_life_goal`
  - Added collapsible "Completed" section for cleaner UI

- **v4.0 (Nov 29, 2025):** Major update reflecting Phases 4-5 implementation
  - Added AI Personality System (5 personalities)
  - Added Proactive Nudges with pattern detection
  - Added Voice Output (TTS)
  - Added Life Area Dashboards
  - Added Yearly Review ("Spotify Wrapped" style)
  - Added Data Export (JSON + Markdown)
  - Added Smart Onboarding Suggestions
  - Restructured to 6 pillars (added "Life" pillar)
  - Updated all schemas, flows, and technical details

- **v3.0 (Nov 26, 2025):** Frequency tabs, enhanced RAG, production deployment
- **v2.0 (Nov 20, 2025):** Initial production version

---

*End of PRD v6.0*


---

## 15. MVP Verification Report (December 2025)

> **Verification Date:** December 6, 2025  
> **Status:** ✅ MVP Ready for Invite-Only Launch

### 15.1 Hardening Completed

| Phase | Focus | Status |
|-------|-------|--------|
| Day 1 | Critical | ✅ Analytics events, Sentry, Voice handling |
| Day 2 | Hardening | ✅ Quality scripts, RLS audit, Smoke tests |
| Day 3 | Polish | ✅ UX improvements, Fallback messaging |

### 15.2 Features Verified

| Feature | Status | Notes |
|---------|--------|-------|
| Stream entries | ✅ | Loads, saves, AI enriches |
| Habits tracking | ✅ | Creation-date-aware dots, toggle works |
| Goals/Intentions | ✅ | Urgency groups, edit modal |
| Reflections | ✅ | Daily/Weekly/Monthly with suggestions |
| Chat | ✅ | Smart starters, TTS, ephemerality notice |
| InsightModal | ✅ | Confidence gating, prefilled suggestions |
| Voice input | ✅ | Error handling for all failure modes |
| Edit modals | ✅ | Entry, Habit, Intention |

### 15.3 Error Monitoring

- **Sentry** integrated with:
  - Automatic error capture
  - Browser tracing (10% sample)
  - Session replay (100% on error)
  - Environment tagging

### 15.4 Analytics Events

| Event | Purpose |
|-------|---------|
| `first_insight_viewed` | Track first InsightModal display |
| `first_action_taken` | Track first habit/goal/chat action |
| `reflection_generated` | Track daily/weekly/monthly reflections |
| `error_event` | Track AI and system failures |

### 15.5 Security Verified

- All 11 tables have RLS enabled
- All policies restrict to `user_id = auth.uid()`
- No tables exposed without policies

---

### Changelog v6.2

- **v6.2 (Dec 6, 2025):** MVP Verification Complete
  - **NEW:** Sentry error monitoring with session replay
  - **NEW:** Analytics events: `first_insight_viewed`, `first_action_taken`, `reflection_generated`
  - **NEW:** Analytics idempotency with `client_event_id`
  - **NEW:** Voice error handling with user-friendly toasts
  - **NEW:** "Why This Insight?" microcopy in InsightModal
  - **NEW:** AI fallback toast when enrichment fails
  - **VERIFIED:** All core flows via smoke testing
  - **VERIFIED:** RLS policies on all 11 tables
  - **STATUS:** Ready for invite-only launch

