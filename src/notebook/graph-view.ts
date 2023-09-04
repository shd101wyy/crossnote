import hash from 'object-hash';
import { basename } from 'path';
import { Notebook } from '.';
export interface GraphViewNode {
  id: string;
  label: string;
}

export interface GraphViewLink {
  source: string;
  target: string;
}

export interface GraphViewData {
  hash: string;
  nodes: GraphViewNode[];
  links: GraphViewLink[];
}

export function constructGraphView(notebook: Notebook): GraphViewData {
  const nodes: GraphViewNode[] = [];
  const links: GraphViewLink[] = [];

  const addedNodes: { [key: string]: boolean } = {};
  const addNode = (filePath: string) => {
    if (filePath in addedNodes) {
      return;
    }
    const note = notebook.notes[filePath];
    if (note) {
      nodes.push({
        id: filePath,
        label: note.title,
      });
    } else {
      const lastIndex = filePath.lastIndexOf('.');
      let label = filePath;
      if (lastIndex > 0) {
        label = filePath.slice(0, lastIndex);
      }
      nodes.push({
        id: filePath,
        label: basename(label),
      });
    }
    addedNodes[filePath] = true;
  };

  for (const filePath in notebook.referenceMap.map) {
    // eslint-disable-next-line no-prototype-builtins
    if (notebook.referenceMap.map.hasOwnProperty(filePath)) {
      addNode(filePath);
      for (const referredByFilePath in notebook.referenceMap.map[filePath]) {
        if (
          // eslint-disable-next-line no-prototype-builtins
          notebook.referenceMap.map[filePath].hasOwnProperty(referredByFilePath)
        ) {
          addNode(referredByFilePath);
          links.push({
            source: referredByFilePath,
            target: filePath,
          });
        }
      }
    }
  }

  return {
    hash: hash({ nodes, links }),
    nodes,
    links,
  };
}
