import {
  LayoutNode,
  PaneNode,
  SplitNode,
  createPane,
  listPaneIds,
  removePane,
  splitPane,
} from '../../src/server-app/types';

function paneWith(id: string): PaneNode {
  return { kind: 'pane', id, tabs: [], activeTabId: null };
}

function split(
  children: LayoutNode[],
  direction: 'horizontal' | 'vertical' = 'horizontal',
): SplitNode {
  return {
    kind: 'split',
    id: `split-${children.map((c) => c.id).join('+')}`,
    direction,
    sizes: children.map(() => 1),
    children,
  };
}

describe('removePane', () => {
  test('never removes the last remaining pane', () => {
    const only = createPane();
    const result = removePane(only, only.id);
    expect(result.removed).toBe(false);
    expect(result.layout).toBe(only);
  });

  test('removes a pane and collapses the split', () => {
    const a = createPane();
    const { layout } = splitPane(a, a.id, 'horizontal');
    expect(listPaneIds(layout)).toHaveLength(2);
    const otherId = listPaneIds(layout).find((id) => id !== a.id) as string;
    const result = removePane(layout, otherId);
    expect(result.removed).toBe(true);
    expect(result.layout).toBe(a); // split collapsed to the survivor
  });

  test('keeps a 3-way split and resets sizes', () => {
    const a = paneWith('a');
    const b = paneWith('b');
    const c = paneWith('c');
    const layout = split([a, b, c]);
    const result = removePane(layout, 'b');
    expect(result.removed).toBe(true);
    expect(listPaneIds(result.layout)).toEqual(['a', 'c']);
    const splitNode = result.layout as SplitNode;
    expect(splitNode.children).toHaveLength(2);
    expect(splitNode.sizes).toEqual([1, 1]);
  });

  test('collapses nested splits upward', () => {
    const a = paneWith('a');
    const b = paneWith('b');
    const c = paneWith('c');
    const layout = split([split([a, b], 'vertical'), c]);
    // Removing c leaves a split with one child → hoisted.
    const hoisted = removePane(layout, 'c');
    expect(hoisted.removed).toBe(true);
    expect(listPaneIds(hoisted.layout)).toEqual(['a', 'b']);
    expect((hoisted.layout as SplitNode).direction).toBe('vertical');
    // Removing a then collapses everything to b.
    const final = removePane(hoisted.layout, 'a');
    expect(final.layout).toEqual(b);
  });

  test('is a no-op for an unknown pane id', () => {
    const a = createPane();
    const { layout } = splitPane(a, a.id, 'horizontal');
    const result = removePane(layout, 'nope');
    expect(result.removed).toBe(false);
    expect(result.layout).toBe(layout);
  });
});
