```typescript
import { Notebook } from 'crossnote';

const notebook = new Notebook({
  workspaceFolder: '/path/to/workspace',
  fn: {
    fs,
    spawn,
  },
  config: {
    configFolder: '/path/to/config',
  },
});
```
