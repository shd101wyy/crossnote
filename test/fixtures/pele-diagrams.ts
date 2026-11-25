/**
 * One small diagram of every diagram type pele documents
 * (<https://pele.run/compatibility>), written for the tests: the browser spec
 * draws each of them with the vendored bundle in a real Chromium and in Node,
 * and compares the two.
 */
/** `type` is the name pele reports for the diagram (`aria-roledescription` of its SVG). */
export const PELE_DIAGRAMS: { name: string; type: string; source: string }[] = [
  {
    name: 'flowchart',
    type: 'flowchart',
    source: `flowchart LR
  A[Mermaid text] --> B{Flowchart?}
  B -- Yes --> C[Pele]
  B -- No --> D[Mermaid]
  C --> E([SVG])
  D --> E
  click C "https://pele.run" "open"
  C@{ img: "https://example.com/pele.png", label: "logo" }`,
  },
  {
    name: 'swimlane',
    type: 'swimlane',
    source: `swimlane-beta LR
  subgraph Customer
    request[Request service]
  end

  subgraph Support
    triage[Triage request]
  end

  request --> triage`,
  },
  {
    name: 'sequence',
    type: 'sequence',
    source: `sequenceDiagram
  Alice->>Bob: Hi
  Bob-->>Alice: Hello
  Note over Alice,Bob: A note`,
  },
  {
    name: 'class',
    type: 'class',
    source: `classDiagram
  class Animal {
    +name
    +speak()
  }
  Animal <|-- Duck`,
  },
  {
    name: 'state',
    type: 'state',
    source: `stateDiagram-v2
  [*] --> Draft
  Draft --> Published : publish
  Published --> [*]`,
  },
  {
    name: 'entity relationship',
    type: 'er',
    source: `erDiagram
  CUSTOMER ||--o{ ORDER : places
  ORDER {
    int id
  }`,
  },
  {
    name: 'gantt',
    type: 'gantt',
    source: `gantt
  title A Gantt
  dateFormat YYYY-MM-DD
  section Section
  A task :a1, 2026-01-01, 30d
  Another :after a1, 20d`,
  },
  {
    name: 'git graph',
    type: 'gitGraph',
    source: `gitGraph
  commit
  branch develop
  checkout main
  commit
  merge develop tag: "v1.0"`,
  },
  {
    name: 'pie',
    type: 'pie',
    source: `pie title Pets
  "Dogs" : 386
  "Cats" : 85`,
  },
  {
    name: 'mindmap',
    type: 'mindmap',
    source: `mindmap
  root((mind))
    a
      b
    c`,
  },
  {
    name: 'kanban',
    type: 'kanban',
    source: `kanban
  todo[Todo]
    id1[Write docs]@{ ticket: PELE-1, assigned: 'me', priority: 'High' }
  doing[Doing]
    id2[Ship it]`,
  },
  {
    name: 'timeline',
    type: 'timeline',
    source: `timeline
  title History
    2001 : First
    2026 : Pele`,
  },
  {
    name: 'user journey',
    type: 'journey',
    source: `journey
  title My working day
  section Go to work
    Make tea: 5: Me
    Go upstairs: 3: Me`,
  },
  {
    name: 'quadrant chart',
    type: 'quadrantChart',
    source: `quadrantChart
  title Reach and engagement
  x-axis Low Reach --> High Reach
  y-axis Low Engagement --> High Engagement
  quadrant-1 We should expand
  Campaign A: [0.3, 0.6]`,
  },
  {
    name: 'XY chart',
    type: 'xychart',
    source: `xychart
  title "Temperature"
  x-axis [jan, feb, mar]
  y-axis "Degrees" 0 --> 10
  bar [3, 5, 2]
  line [2, 4, 3]`,
  },
  {
    name: 'requirement',
    type: 'requirement',
    source: `requirementDiagram
  requirement checkout_req {
    id: 1
    text: Orders must be payable online.
    risk: high
    verifymethod: test
  }`,
  },
  {
    name: 'sankey',
    type: 'sankey',
    source: `sankey-beta
  Grid,Homes,113.7
  Grid,Industry,342.2
  Industry,Losses,56.7`,
  },
  {
    name: 'architecture',
    type: 'architecture',
    source: `architecture-beta
  service db(database)[Database]
  service server(internet)[Server]
  junction j
  db:R --> L:server`,
  },
  {
    name: 'C4',
    type: 'c4',
    source: `C4Context
  Person(a, "Author")
  System(b, "Notes", "Holds notes")
  Rel(a, b, "writes")`,
  },
  {
    name: 'block',
    type: 'block',
    source: `block-beta
  columns 3
  a["One"] b["Two"]
  a --> b`,
  },
  {
    name: 'agentflow',
    type: 'agentflow',
    source: `agentflow-beta TB
  flow intake["Intake"]
    receive["Receive request"]@{ shape: input }
  end

  flow processing["Processing"]
    validate["Validate"]@{ shape: task }
  end

  receive --> validate`,
  },
  {
    name: 'tree view',
    type: 'treeView',
    source: `treeView-beta
  src/
    App.tsx
    main.tsx
  README.md`,
  },
  {
    name: 'cynefin',
    type: 'cynefin',
    source: `cynefin-beta
  title Strategy

  complex
    "Market research"

  clear
    "Standard pricing"

  complex --> clear : "Pattern identified"`,
  },
  {
    name: 'wardley map',
    type: 'wardley',
    source: `wardley-beta
title Tea Shop

anchor Business [0.95, 0.63]
component Cup of Tea [0.79, 0.61]
component Kettle [0.43, 0.35]

Business -> Cup of Tea
Cup of Tea -> Kettle`,
  },
  {
    name: 'use case',
    type: 'usecase',
    source: `usecase-beta
direction LR
actor Customer
Browse("Browse catalog")
Customer --> Browse`,
  },
  {
    name: 'venn',
    type: 'venn',
    source: `venn-beta
  title What makes a good feature
  set Desirable
  set Feasible
  union Desirable,Feasible["Buildable"]`,
  },
  {
    name: 'radar',
    type: 'radar',
    source: `radar-beta
  title Comparison
  axis food["Food Quality"], service["Service"], speed["Speed"], value["Value"]
  curve a["Restaurant A"]{4, 3, 5, 2}
  curve b["Restaurant B"]{3, 4, 2, 5}`,
  },
  {
    name: 'ishikawa',
    type: 'ishikawa',
    source: `ishikawa-beta
  Blurry Photo
  Process
    Out of focus
  User
    Shaky hands`,
  },
  {
    name: 'packet',
    type: 'packet',
    source: `---
title: "TCP Packet"
---
packet
0-15: "Source Port"
16-31: "Destination Port"
32-63: "Sequence Number"
64-95: "Acknowledgment Number"
96-99: "Data Offset"`,
  },
  {
    name: 'treemap',
    type: 'treemap',
    source: `treemap-beta
  "Budget"
    "Operations"
      "Salaries": 700000
    "Marketing"
      "Advertising": 400000`,
  },
  {
    name: 'railroad',
    type: 'railroad',
    source: `railroad-ebnf-beta
title "Arithmetic Expression Grammar"

expression = term ( ( "+" | "-" ) term )* ;
term = number ;
number = digit+ ;
digit = "0" | "1" ;`,
  },
  {
    name: 'event modeling',
    type: 'eventmodeling',
    source: `eventmodeling

timeframe 01 ui CartUI
timeframe 02 command AddItem [[AddItem01]]
timeframe 03 event ItemAdded [[ItemAdded]]

data AddItem01 {
  description: string
  price: number
}`,
  },
  {
    name: 'info',
    type: 'info',
    source: `info
  showInfo
  title An info box`,
  },
];

/** A diagram that cannot be parsed: its error is shown in place. */
export const PELE_INVALID = 'flowchart LR\n  A --> --> B';
