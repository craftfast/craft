# Auto Preview Lifecycle - Visual Flow

## State Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                       PROJECT PAGE LOADED                        │
│                    (Preview Tab Active by Default)               │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
                    ┌────────────────┐
                    │  PreviewPanel  │
                    │  Mounts        │
                    │  isActive=true │
                    └────────┬───────┘
                             │
                             ▼
                    ┌────────────────┐
                    │  Wait 500ms    │
                    │  (smooth UX)   │
                    └────────┬───────┘
                             │
                             ▼
                    ┌────────────────┐
                    │  Start Sandbox │
                    │  Automatically │
                    └────────┬───────┘
                             │
                             ▼
                    ┌────────────────┐
                    │  Loading...    │
                    │  (20-30s)      │
                    └────────┬───────┘
                             │
                             ▼
                    ┌────────────────┐
                    │  Preview       │◄─────────────────┐
                    │  Running       │                  │
                    └────────┬───────┘                  │
                             │                          │
              ┌──────────────┼──────────────┐          │
              │              │              │           │
              ▼              ▼              ▼           │
        ┌──────────┐  ┌──────────┐  ┌──────────┐      │
        │   Code   │  │Analytics │  │ Database │      │
        │   Tab    │  │   Tab    │  │   Tab    │      │
        └────┬─────┘  └────┬─────┘  └────┬─────┘      │
             │             │             │             │
             └─────────────┼─────────────┘             │
                           │                           │
                           ▼                           │
                  ┌────────────────┐                   │
                  │  isActive =    │                   │
                  │  false         │                   │
                  └────────┬───────┘                   │
                           │                           │
                           ▼                           │
                  ┌────────────────┐                   │
                  │  Stop Sandbox  │                   │
                  │  Automatically │                   │
                  └────────┬───────┘                   │
                           │                           │
                           ▼                           │
                  ┌────────────────┐                   │
                  │  Preview Panel │                   │
                  │  Hidden        │                   │
                  │  (still mounted)│                  │
                  └────────┬───────┘                   │
                           │                           │
                    User returns to                    │
                     Preview Tab?                      │
                           │                           │
                           └───────────────────────────┘
```

## Tab Switching Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│  TAB STATE MANAGEMENT                                           │
│                                                                  │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌──────────┐ │
│  │  Preview   │  │    Code    │  │ Analytics  │  │   Logs   │ │
│  │  (Active)  │  │ (Inactive) │  │ (Inactive) │  │(Inactive)│ │
│  └─────┬──────┘  └────────────┘  └────────────┘  └──────────┘ │
│        │                                                         │
│        │  ┌────────────────────────────────────┐                │
│        └─▶│ PreviewPanel                       │                │
│           │ - Mounted & Visible                │                │
│           │ - className="h-full"               │                │
│           │ - isActive={true}                  │                │
│           │ - Sandbox: RUNNING ✓               │                │
│           └────────────────────────────────────┘                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

                    User Clicks "Code" Tab
                             ▼

┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌──────────┐ │
│  │  Preview   │  │    Code    │  │ Analytics  │  │   Logs   │ │
│  │ (Inactive) │  │  (Active)  │  │ (Inactive) │  │(Inactive)│ │
│  └─────┬──────┘  └────────────┘  └────────────┘  └──────────┘ │
│        │                                                         │
│        │  ┌────────────────────────────────────┐                │
│        └─▶│ PreviewPanel                       │                │
│           │ - Mounted but Hidden               │                │
│           │ - className="hidden"               │                │
│           │ - isActive={false}                 │                │
│           │ - Sandbox: STOPPED ✗               │                │
│           └────────────────────────────────────┘                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

                  User Clicks "Preview" Tab Again
                             ▼

┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌──────────┐ │
│  │  Preview   │  │    Code    │  │ Analytics  │  │   Logs   │ │
│  │  (Active)  │  │ (Inactive) │  │ (Inactive) │  │(Inactive)│ │
│  └─────┬──────┘  └────────────┘  └────────────┘  └──────────┘ │
│        │                                                         │
│        │  ┌────────────────────────────────────┐                │
│        └─▶│ PreviewPanel                       │                │
│           │ - Mounted & Visible                │                │
│           │ - className="h-full"               │                │
│           │ - isActive={true}                  │                │
│           │ - Sandbox: AUTO-STARTING... ⟳      │                │
│           └────────────────────────────────────┘                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Component Lifecycle

```
PROJECT OPEN                     TAB SWITCH                    PROJECT CLOSE
     │                               │                              │
     │                               │                              │
     ▼                               ▼                              ▼
┌─────────┐                   ┌─────────┐                   ┌─────────┐
│ Mount   │                   │isActive │                   │Unmount  │
│Preview  │                   │Changed  │                   │Preview  │
│Panel    │                   │         │                   │Panel    │
└────┬────┘                   └────┬────┘                   └────┬────┘
     │                             │                              │
     │                             │                              │
     ▼                             ▼                              ▼
┌─────────┐                  ┌──────────┐                  ┌─────────┐
│Check if │                  │ If true: │                  │ Stop    │
│Sandbox  │                  │ Start    │                  │ Sandbox │
│Exists   │                  │          │                  │         │
└────┬────┘                  │ If false:│                  └────┬────┘
     │                       │ Stop     │                       │
     │                       └─────┬────┘                       │
     ▼                             │                            ▼
┌─────────┐                        │                      ┌─────────┐
│Wait 500 │                        │                      │ Clean   │
│ms       │                        │                      │ Up API  │
└────┬────┘                        │                      │ Call    │
     │                             │                      └─────────┘
     ▼                             │
┌─────────┐                        │
│Auto     │◄───────────────────────┘
│Start    │
│Sandbox  │
└─────────┘
```

## User Experience Timeline

```
TIME    EVENT                          SCREEN                    SANDBOX STATE
────────────────────────────────────────────────────────────────────────────
0:00    Project page opens             "Loading project..."      INACTIVE
        Preview tab active by default

0:01    PreviewPanel mounts            "Starting Preview..."     INACTIVE
        Detects isActive=true

0:01.5  Auto-start triggered           "Initializing Next.js     LOADING
        (500ms delay)                   environment..."

0:15    Sandbox created                "Setting up Next.js       LOADING
                                        project..."

0:20    Files synced                   "Verifying server is      LOADING
                                        ready..."

0:25    Server ready                   "Connecting to            LOADING
                                        preview..."

0:30    Preview loads!                 [Next.js App Visible]     RUNNING ✓

─────   ─────────────────────────────────────────────────────────────────────
0:45    User clicks "Code" tab         [Code Editor Visible]     RUNNING ✓

0:45.1  isActive=false detected        [Code Editor Visible]     STOPPING...

0:45.2  Sandbox stopped                [Code Editor Visible]     STOPPED ✗
        Preview hidden

─────   ─────────────────────────────────────────────────────────────────────
1:30    User clicks "Preview" tab      "Starting Preview..."     STOPPED ✗

1:30.5  Auto-start triggered           "Initializing Next.js     LOADING
        (500ms delay)                   environment..."

1:45    Preview loads again            [Next.js App Visible]     RUNNING ✓

─────   ─────────────────────────────────────────────────────────────────────
2:00    User navigates away            Navigation occurs         RUNNING ✓
        from project

2:00.1  Unmount cleanup                [Dashboard Visible]       CLEANING...

2:00.2  Sandbox deleted                [Dashboard Visible]       DELETED ✗
```

## Benefits Visualization

```
┌────────────────────────────────────────────────────────────────┐
│  BEFORE: Manual Start/Stop                                     │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  1. Open project          →  Click "Start Preview" button     │
│  2. Wait for load         →  Preview shows                    │
│  3. Switch to Code tab    →  Sandbox keeps running (waste!)   │
│  4. Back to Preview       →  Still running (good)             │
│  5. Close project         →  Sandbox keeps running (leak!)    │
│                                                                │
│  ❌ Requires user action                                       │
│  ❌ Resource waste when inactive                               │
│  ❌ Potential resource leaks                                   │
│  ❌ Manual cleanup needed                                      │
│                                                                │
└────────────────────────────────────────────────────────────────┘

                             ▼

┌────────────────────────────────────────────────────────────────┐
│  AFTER: Automatic Start/Stop                                   │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  1. Open project          →  Preview starts automatically!    │
│  2. Wait for load         →  Preview shows                    │
│  3. Switch to Code tab    →  Sandbox stops automatically!     │
│  4. Back to Preview       →  Sandbox starts automatically!    │
│  5. Close project         →  Sandbox cleans up automatically! │
│                                                                │
│  ✓ Zero user action needed                                    │
│  ✓ Resources only used when needed                            │
│  ✓ Automatic cleanup                                          │
│  ✓ Smooth, professional UX                                    │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

## Key Implementation Details

### 1. Component Mounting Strategy

```
Instead of:  activeTab === "preview" && <PreviewPanel />
We use:      <div className={activeTab === "preview" ? "h-full" : "hidden"}>
               <PreviewPanel isActive={activeTab === "preview"} />
             </div>
```

**Why?** Component stays mounted, allowing it to react to tab changes via props.

### 2. Timing

```
Auto-start delay: 500ms
  → Allows smooth visual transition
  → Prevents jarring immediate load

Cleanup: Immediate
  → No delay when stopping
  → Faster resource reclamation
```

### 3. State Management

```
isActive Prop Flow:
  Parent (CodingInterface)    →    Child (PreviewPanel)
  activeTab === "preview"     →    isActive={true/false}
                                        ↓
                              useEffect hooks trigger
                                        ↓
                              Auto start/stop sandbox
```
