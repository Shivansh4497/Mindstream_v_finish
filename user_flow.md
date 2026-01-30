# Mindstream User Flows (Visual Map)

This document visualizes every user interaction path within Mindstream using Mermaid flowcharts.

## 1. Authentication Flow
This flow covers the initial app load, session checking, and login process via Magic Link or OAuth.

```mermaid
graph TD
    A[Start: User Opens App] --> B{Session Exists?}
    B -- Yes --> C[Check Onboarding Status]
    B -- No --> D[Show Login Screen]
    
    D --> E{Auth Method}
    E -->|Google OAuth| F[Redirect to Google]
    E -->|Magic Link| G[Enter Email]
    
    G --> H[Check Inbox]
    H --> I[Click Magic Link]
    I --> J[Authenticated]
    F --> J
    
    J --> C
    C -->|Step 0| K[Landing Screen]
    C -->|Step 1| L[Quick Start Path]
    C -->|Step 2| M[Guided Setup Path]
    C -->|Step 5| N[Main App View]
```

## 2. Onboarding Flows
Two distinct paths for new users: Quick Start (fast) and Guided Setup (thorough).

### 2.1 Landing Decision
```mermaid
graph TD
    A[Landing Screen] -->|Click Quick Start| B[Quick Start Path]
    A[Landing Screen] -->|Click Guided Setup| C[Guided Setup Path]
```

### 2.2 Quick Start Path
Designed for users who want to jump straight in.

```mermaid
graph TD
    A[Quick Start] --> B[Log 'onboarding_completed']
    B --> C[Stream View <br/> Empty State]
    C --> D[User Writes First Entry <br/> >10 chars]
    D --> E[Log 'entry_created']
    E --> F[InsightModal Appears]
    
    F --> G{User Action}
    G -->|Track Habit| H[Create Habit -> Focus Tab]
    G -->|Set Goal| I[Create Intention -> Focus Tab]
    G -->|Explore in Chat| J[Open Chat View]
    G -->|Dismiss| K[Stay in Stream]
```

### 2.3 Guided Setup Path
A 7-step wizard to calibrate the AI and user intent.

```mermaid
graph TD
    A[Guided Setup] --> B[Splash Animation <br/> 'Clarity Loop']
    B --> C[Step 1: Sanctuary <br/> Privacy Message]
    C --> D[Step 2: Spark <br/> Select Emotion]
    D --> E[Step 3: Container <br/> Select Life Area]
    E --> F[Step 4: Friction <br/> Select Trigger]
    F --> G[Step 5: Elaboration <br/> User Input + Personality]
    G --> H[Step 6: Processing <br/> AI Generation]
    H --> I[Step 7: Awe <br/> Show Insight]
    
    I --> J{Completion Choice}
    J -->|Unpack in Chat| K[Chat View <br/> seeded with context]
    J -->|Go to Stream| L[Stream View]
```

## 3. Stream View Flows
The central feed of thoughts, insights, and actions.

### 3.1 Entry Creation & Management
```mermaid
graph TD
    A[Stream View] --> B{Input Method}
    B -->|Text| C[Type in Box]
    B -->|Voice| D[Tap Mic -> Speak]
    B -->|Prompt| E[Click Guided Chip]
    
    C --> F[Send]
    D --> F
    E --> C
    
    F --> G[Optimistic UI Update]
    G --> H[AI Enrichment Service]
    H -->|Analyze| I[Generate Title, Tags, Sentiment, Emoji]
    I --> J[Update Entry in DB]
    J --> K[Show Toast 'Saved']
    
    %% Edit Flow
    L[Existing Entry] --> M[Click Edit]
    M --> N[Edit Entry Modal]
    N --> O[Save Changes]
    O --> P[Update Feed Item]
```

### 3.2 Feed Interaction
```mermaid
graph TD
    A[Feed Item] --> B{Item Type}
    B -->|Entry| C[Expand Card]
    B -->|Insight| D[View Analysis]
    B -->|Reflection| E[View Summary]
    
    C --> F{Actions}
    F -->|Edit| G[Open Edit Modal]
    F -->|Delete| H[Delete Confirmation]
    F -->|Tag Click| I[Open Thematic Modal]
    
    D --> J[Dismiss or Explore]
```

## 4. Focus View Flows
Managing behavioral systems (Habits) and finite goals (Intentions).

### 4.1 Habit Management
```mermaid
graph TD
    A[Focus: Habits Tab] --> B{Action}
    
    B -->|Create| C[Input Name]
    C --> D[AI Auto-Categorization]
    D --> E[Entry Created]
    
    B -->|Toggle| F[Click Checkbox]
    F --> G[Optimistic Update]
    G --> H[Calculate Streak]
    H -->|Streak Milestone?| I[Confetti 🎉]
    
    B -->|Edit| J[Long Press / Edit Btn]
    J --> K[Edit Habit Modal]
    K --> L[Update Name/Frequency]
```

### 4.2 Intention (Goal) Management
```mermaid
graph TD
    A[Focus: Goals Tab] --> B{Action}
    
    B -->|Create| C[Input Text]
    C --> D[Select Deadline (ETA)]
    D --> E[AI Auto-Tagging]
    E --> F[Add to List (Sorted by Urgency)]
    
    B -->|Complete| G[Click Checkbox]
    G --> H[Move to Completed Section]
    
    B -->|Edit| I[Click Pencil]
    I --> J[Edit Intention Modal]
```

## 5. Insights View Flows
Progressive disclosure of analysis and patterns.

### 5.1 Reflection Generation
```mermaid
graph TD
    A[Insights View] --> B{Tab Selection}
    B -->|Daily| C[View Daily Relfections]
    B -->|Weekly| D[View Weekly Reflections]
    B -->|Monthly| E[View Monthly Reflections]
    
    C --> F{Content Exists?}
    F -->|Yes| G[Show Summary Card]
    F -->|No| H[Show 'Generate' Button]
    
    H --> I[Click Generate]
    I --> J[AI Analyzes Entries/Habits]
    J --> K[Display Reflection Card]
    K --> L[Action: Explore in Chat]
    L --> M[Redirect to Chat w/ Context]
```

### 5.2 Deep Dive (Life Areas)
```mermaid
graph TD
    A[Insights: Deep Dive] --> B[Life Area Dashboard]
    B --> C{Select Area}
    C -->|Health| D[Filtered View: Health]
    C -->|Growth| E[Filtered View: Growth]
    C -->|Career| F[Filtered View: Career]
    
    D --> G[Show Area Stats & Hazards]
```

## 6. Chat View Flows
Conversational intelligence and memory.

### 6.1 Chat Interaction
```mermaid
graph TD
    A[Chat View] --> B{Input}
    B -->|Text/Voice| C[Send Message]
    
    C --> D[RAG System]
    D --> E[Search Entries + Intentions]
    E --> F[Inject Context Window]
    F --> G[Detect User Intent]
    G --> H[Stream AI Response]
    
    H --> I{Actions}
    I -->|TTS Enabled| J[Speak Response]
    I -->|Share Logic| K[Update Shared Session?]
```

### 6.2 Chat Takeaways
```mermaid
graph TD
    A[Conversation Active] --> B{Check Thresholds}
    B -->|Messages > 6 & Words > 20| C[Show 'Save Takeaway' Button]
    
    C --> D[Click Button]
    D --> E[AI Summarizes Insight]
    E --> F[Create Entry: type='chat_takeaway']
    F --> G[Save to Stream]
```

## 7. Settings & Modals
Cross-cutting concerns and configuration.

### 7.1 Search & Thematic Analysis
```mermaid
graph TD
    A[Global Header] --> B[Click Search Zoom]
    B --> C[Search Modal]
    C --> D[Type Query]
    D --> E[Show Results]
    
    E --> F[Click Result -> View Entry]
    
    G[Entry Tag] --> H[Click Tag]
    H --> I[Thematic Modal]
    I --> J{Action}
    J -->|View All| C
    J -->|Generate Reflection| K[AI Thematic Analysis]
```

### 7.2 Settings & Data
```mermaid
graph TD
    A[Settings View] --> B{Section}
    B -->|AI Companion| C[Personality Selector]
    B -->|Data & Privacy| D[Export Options]
    B -->|Developer| E[Debug Tools]
    
    C --> F[Select Personality]
    F --> G[Update User Preferences]
    G --> H[AI Tone Changes Globally]
    
    D --> I{Format}
    I -->|JSON| J[Download Complete Backup]
    I -->|Markdown| K[Download Human-Readable]
```



