# Mermaid beta renderer coverage

```mermaid
swimlane-beta LR
  subgraph Customer
    request[Request]
  end
  subgraph Support
    triage[Triage]
  end
  request --> triage
```

```mermaid
sankey-beta
Traffic,Checkout,100
Checkout,Completed,70
Checkout,Abandoned,30
```

```mermaid
xychart-beta
  x-axis [Mon, Tue, Wed]
  y-axis "Orders" 0 --> 10
  bar [4, 7, 9]
```

```mermaid
block-beta
  columns 2
  client api
```

```mermaid
packet-beta
  0-3: "Version"
  4-7: "Flags"
```

```mermaid
architecture-beta
  service client(internet)[Client]
  service api(server)[API]
  client:R --> L:api
```

```mermaid
radar-beta
  axis speed["Speed"], quality["Quality"], cost["Cost"]
  curve current["Current"]{70, 80, 60}
  max 100
```

```mermaid
treemap-beta
  "Application"
    "API": 60
    "Worker": 40
```

```mermaid
venn-beta
  set platform[Platform]: 18
  set product[Product]: 14
  union platform,product[Shared]: 6
```

```mermaid
ishikawa-beta
  "Slow checkout"
    "Application"
      "Repeated serialization"
    "Database"
      "Missing index"
```

```mermaid
wardley-beta
  component Customer [0.95, 0.85]
  component Checkout [0.70, 0.60]
  Customer -> Checkout
```

```mermaid
cynefin-beta
  complex
    "Investigate incident"
  complicated
    "Analyze metrics"
  clear
    "Restart service"
  chaotic
    "Page on-call"
  confusion
    "Unknown failure"
```

```mermaid
treeView-beta
  project/
    src/
      index.ts
    README.md
```
