```typescript
import Crossnote from 'crossnote';

const notebook = new Crossnote({
  workspaceFolder: '/path/to/workspace',
  fn: {
    fs,
    spawn,
  },
  config: {
    configFolder: '/path/to/config',
  },
});

await notebook.addNote({
  filePath: '/path/to/note.md',
});

await notebook.updateConfig({
  previewTheme: 'dark',
});

await note.deleteNote({
  filePath: '/path/to/note.md',
});

await notebook.openInBrowser({
  filePath: '/path/to/note.md',
  runAllCodeChunks: true,
});
```
