import {
  forceCenter,
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
} from 'd3-force';
import type { SimulationLinkDatum, SimulationNodeDatum } from 'd3-force';
import { select } from 'd3-selection';
import { zoom, zoomIdentity } from 'd3-zoom';
import type { ZoomTransform } from 'd3-zoom';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

interface GraphViewNode {
  id: string;
  label: string;
}

interface GraphViewLink {
  source: string;
  target: string;
}

interface GraphViewData {
  hash: string;
  nodes: GraphViewNode[];
  links: GraphViewLink[];
}

type D3Node = SimulationNodeDatum & GraphViewNode;
type D3Link = SimulationLinkDatum<D3Node>;

type ViewMode = 'global' | 'local';

const MIN_NODE_RADIUS = 5;
const MAX_NODE_RADIUS = 14;
const TEXT_MIN_ZOOM = 0.4;

interface ThemeColors {
  background: string;
  text: string;
  activeNode: string;
  hoverNode: string;
  neighborNode: string;
  defaultNode: string;
  link: string;
  activeLink: string;
}

function getCssVar(name: string, fallback: string): string {
  return (
    getComputedStyle(document.documentElement).getPropertyValue(name).trim() ||
    fallback
  );
}

function buildThemeColors(isDark: boolean): ThemeColors {
  return isDark
    ? {
        background: getCssVar('--vscode-editor-background', '#1e1e2e'),
        text: getCssVar('--vscode-editor-foreground', '#cdd6f4'),
        activeNode: '#f38ba8',
        hoverNode: '#fab387',
        neighborNode: '#a6e3a1',
        defaultNode: getCssVar('--vscode-charts-blue', '#89b4fa'),
        link: 'rgba(255,255,255,0.12)',
        activeLink: getCssVar('--vscode-focusBorder', 'rgba(137,180,250,0.75)'),
      }
    : {
        background: getCssVar('--vscode-editor-background', '#ffffff'),
        text: getCssVar('--vscode-editor-foreground', '#374151'),
        activeNode: '#dc2626',
        hoverNode: '#d97706',
        neighborNode: '#16a34a',
        defaultNode: getCssVar('--vscode-charts-blue', '#2563eb'),
        link: 'rgba(0,0,0,0.12)',
        activeLink: getCssVar('--vscode-focusBorder', 'rgba(37,99,235,0.75)'),
      };
}

/** Stable hue from a string, used for folder-based node coloring. */
function stringToHue(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % 360;
}

function getFolderFromPath(nodeId: string): string {
  const parts = nodeId.replace(/\\/g, '/').split('/');
  return parts.length > 1 ? parts[parts.length - 2] : '';
}

export default function GraphViewComponent() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number>(0);
  const transformRef = useRef<ZoomTransform>(zoomIdentity);
  const nodesRef = useRef<D3Node[]>([]);
  const linksRef = useRef<D3Link[]>([]);
  const zoomBehaviorRef = useRef<ReturnType<
    typeof zoom<HTMLCanvasElement, unknown>
  > | null>(null);
  const activeFilePathRef = useRef<string>('');

  const [graphData, setGraphData] = useState<GraphViewData | null>(null);
  const [activeFilePath, setActiveFilePath] = useState<string>('');
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('global');
  const [localDepth, setLocalDepth] = useState(1);
  const [colorByFolder, setColorByFolder] = useState(false);

  // Keep ref in sync so simulation callbacks can read the latest active path
  // without needing to be in the dependency array
  useEffect(() => {
    activeFilePathRef.current = activeFilePath;
  }, [activeFilePath]);

  // Detect VS Code theme from body class (set by VS Code itself)
  const isDarkTheme = useMemo(() => {
    return (
      document.body.classList.contains('vscode-dark') ||
      document.body.classList.contains('vscode-high-contrast')
    );
  }, []);

  const themeColors = useMemo(
    () => buildThemeColors(isDarkTheme),
    [isDarkTheme],
  );

  // DaisyUI theme for the toolbar/UI chrome
  const daisyTheme = isDarkTheme ? 'dark' : 'light';

  const vscodeApi = useMemo(() => {
    if (globalThis.acquireVsCodeApi) {
      return globalThis.acquireVsCodeApi() as {
        postMessage: (msg: { command: string; args: unknown[] }) => void;
      };
    }
    return null;
  }, []);

  const postMessage = useCallback(
    (command: string, args: unknown[]) => {
      if (vscodeApi) {
        vscodeApi.postMessage({ command, args });
      }
    },
    [vscodeApi],
  );

  // Neighbor ids of the currently hovered node
  const neighborIds = useMemo(() => {
    const ids = new Set<string>();
    if (!hoveredNodeId || !graphData) return ids;
    for (const link of graphData.links) {
      const src =
        typeof link.source === 'object'
          ? (link.source as GraphViewNode).id
          : link.source;
      const tgt =
        typeof link.target === 'object'
          ? (link.target as GraphViewNode).id
          : link.target;
      if (src === hoveredNodeId) ids.add(tgt);
      if (tgt === hoveredNodeId) ids.add(src);
    }
    return ids;
  }, [hoveredNodeId, graphData]);

  // Per-node connection count for sizing
  const nodeDegreeMap = useMemo(() => {
    const map = new Map<string, number>();
    if (!graphData) return map;
    for (const link of graphData.links) {
      const src =
        typeof link.source === 'string'
          ? link.source
          : (link.source as GraphViewNode).id;
      const tgt =
        typeof link.target === 'string'
          ? link.target
          : (link.target as GraphViewNode).id;
      map.set(src, (map.get(src) ?? 0) + 1);
      map.set(tgt, (map.get(tgt) ?? 0) + 1);
    }
    return map;
  }, [graphData]);

  const maxDegree = useMemo(() => {
    let max = 1;
    for (const v of nodeDegreeMap.values()) if (v > max) max = v;
    return max;
  }, [nodeDegreeMap]);

  const getNodeRadius = useCallback(
    (nodeId: string) => {
      const degree = nodeDegreeMap.get(nodeId) ?? 0;
      return (
        MIN_NODE_RADIUS +
        (degree / maxDegree) * (MAX_NODE_RADIUS - MIN_NODE_RADIUS)
      );
    },
    [nodeDegreeMap, maxDegree],
  );

  // Stable folder → color mapping (one hue per unique parent folder)
  const folderColorMap = useMemo(() => {
    const map = new Map<string, string>();
    if (!graphData) return map;
    for (const node of graphData.nodes) {
      const folder = getFolderFromPath(node.id);
      if (!map.has(folder)) {
        const hue = stringToHue(folder || node.id);
        map.set(
          folder,
          isDarkTheme ? `hsl(${hue},65%,65%)` : `hsl(${hue},55%,40%)`,
        );
      }
    }
    return map;
  }, [graphData, isDarkTheme]);

  // BFS-based local mode: include up to `localDepth` hops from the active file
  const localNodeIds = useMemo(() => {
    const ids = new Set<string>();
    if (!activeFilePath || !graphData) return ids;
    let frontier = new Set([activeFilePath]);
    ids.add(activeFilePath);
    for (let d = 0; d < localDepth; d++) {
      const next = new Set<string>();
      for (const nodeId of frontier) {
        for (const link of graphData.links) {
          const src =
            typeof link.source === 'string'
              ? link.source
              : (link.source as GraphViewNode).id;
          const tgt =
            typeof link.target === 'string'
              ? link.target
              : (link.target as GraphViewNode).id;
          if (src === nodeId && !ids.has(tgt)) {
            ids.add(tgt);
            next.add(tgt);
          }
          if (tgt === nodeId && !ids.has(src)) {
            ids.add(src);
            next.add(src);
          }
        }
      }
      frontier = next;
      if (frontier.size === 0) break;
    }
    return ids;
  }, [activeFilePath, graphData, localDepth]);

  const visibleData = useMemo(() => {
    if (!graphData) return { nodes: [], links: [] };
    if (viewMode === 'local' && activeFilePath) {
      const nodes = graphData.nodes.filter((n) => localNodeIds.has(n.id));
      const links = graphData.links.filter((l) => {
        const src =
          typeof l.source === 'string'
            ? l.source
            : (l.source as GraphViewNode).id;
        const tgt =
          typeof l.target === 'string'
            ? l.target
            : (l.target as GraphViewNode).id;
        return localNodeIds.has(src) && localNodeIds.has(tgt);
      });
      return { nodes, links };
    }
    return { nodes: graphData.nodes, links: graphData.links };
  }, [graphData, viewMode, activeFilePath, localNodeIds]);

  // Search matched node ids
  const searchMatches = useMemo(() => {
    const ids = new Set<string>();
    if (!searchQuery.trim()) return ids;
    const q = searchQuery.toLowerCase();
    for (const node of visibleData.nodes) {
      if (
        node.label.toLowerCase().includes(q) ||
        node.id.toLowerCase().includes(q)
      ) {
        ids.add(node.id);
      }
    }
    return ids;
  }, [searchQuery, visibleData.nodes]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvas;
    const t = transformRef.current;
    const nodes = nodesRef.current;
    const links = linksRef.current;

    ctx.save();
    // Fill background with theme color
    ctx.fillStyle = themeColors.background;
    ctx.fillRect(0, 0, width, height);
    ctx.translate(t.x, t.y);
    ctx.scale(t.k, t.k);

    const isFiltering = searchQuery.trim().length > 0;
    const isHovering = hoveredNodeId !== null;

    // Draw links with directional arrow heads
    for (const link of links) {
      const src = link.source as D3Node;
      const tgt = link.target as D3Node;
      if (src.x == null || src.y == null || tgt.x == null || tgt.y == null)
        continue;

      const isActiveLink =
        isHovering && (src.id === hoveredNodeId || tgt.id === hoveredNodeId);

      const alpha = isHovering && !isActiveLink ? 0.15 : isFiltering ? 0.25 : 1;
      const strokeColor = isActiveLink
        ? themeColors.activeLink
        : themeColors.link;
      const lineW = isActiveLink ? 1.5 / t.k : 1 / t.k;

      // Direction vector
      const dx = tgt.x - src.x;
      const dy = tgt.y - src.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 1) continue;
      const ux = dx / dist;
      const uy = dy / dist;

      // Stop the line at the target node's surface
      const tgtRadius =
        getNodeRadius(tgt.id) *
        (tgt.id === activeFilePath || tgt.id === hoveredNodeId ? 1.4 : 1);
      const arrowLen = 7 / t.k;
      const arrowAngle = Math.PI / 7; // ~25°
      const angle = Math.atan2(dy, dx);

      // Arrowhead tip sits just outside the target node
      const tipX = tgt.x - ux * (tgtRadius + 1 / t.k);
      const tipY = tgt.y - uy * (tgtRadius + 1 / t.k);

      // Line body ends before the arrowhead base
      const bodyEndX = tipX - ux * arrowLen;
      const bodyEndY = tipY - uy * arrowLen;

      ctx.globalAlpha = alpha;

      // Line body
      ctx.beginPath();
      ctx.moveTo(src.x, src.y);
      ctx.lineTo(bodyEndX, bodyEndY);
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = lineW;
      ctx.stroke();

      // Filled arrowhead triangle
      ctx.beginPath();
      ctx.moveTo(tipX, tipY);
      ctx.lineTo(
        tipX - arrowLen * Math.cos(angle - arrowAngle),
        tipY - arrowLen * Math.sin(angle - arrowAngle),
      );
      ctx.lineTo(
        tipX - arrowLen * Math.cos(angle + arrowAngle),
        tipY - arrowLen * Math.sin(angle + arrowAngle),
      );
      ctx.closePath();
      ctx.fillStyle = strokeColor;
      ctx.fill();

      ctx.globalAlpha = 1;
    }

    // Draw nodes
    for (const node of nodes) {
      if (node.x == null || node.y == null) continue;

      const isActive = node.id === activeFilePath;
      const isHovered = node.id === hoveredNodeId;
      const isNeighbor = neighborIds.has(node.id);
      const isMatch = searchMatches.has(node.id);

      const baseRadius = getNodeRadius(node.id);
      const radius = isActive || isHovered ? baseRadius * 1.4 : baseRadius;

      let color: string;
      if (isActive) color = themeColors.activeNode;
      else if (isHovered) color = themeColors.hoverNode;
      else if (isNeighbor) color = themeColors.neighborNode;
      else if (colorByFolder) {
        const folder = getFolderFromPath(node.id);
        color = folderColorMap.get(folder) ?? themeColors.defaultNode;
      } else {
        color = themeColors.defaultNode;
      }

      const dimmed =
        (isHovering && !isHovered && !isNeighbor && !isActive) ||
        (isFiltering && !isMatch && !isActive);

      ctx.globalAlpha = dimmed ? 0.15 : 1;

      ctx.beginPath();
      ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.fill();

      // Ring indicator for active/hovered/matched nodes
      if (isMatch || isActive || isHovered) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius + 3 / t.k, 0, 2 * Math.PI);
        ctx.strokeStyle = isActive
          ? themeColors.activeNode
          : themeColors.hoverNode;
        ctx.lineWidth = 2 / t.k;
        ctx.stroke();
      }

      ctx.globalAlpha = 1;

      // Labels (only at sufficient zoom)
      if (t.k > TEXT_MIN_ZOOM) {
        ctx.globalAlpha = dimmed ? 0.15 : 1;
        ctx.fillStyle = themeColors.text;
        const fontSize = Math.max(10, 12 / t.k);
        ctx.font = `${isActive || isHovered ? 'bold ' : ''}${fontSize}px var(--vscode-font-family,system-ui,sans-serif)`;
        ctx.fillText(node.label, node.x + radius + 3, node.y + 4);
        ctx.globalAlpha = 1;
      }
    }

    ctx.restore();
  }, [
    activeFilePath,
    colorByFolder,
    folderColorMap,
    getNodeRadius,
    hoveredNodeId,
    neighborIds,
    searchMatches,
    searchQuery,
    themeColors,
  ]);

  // Keep a ref to the latest draw so scheduleRedraw stays stable (no deps)
  const drawRef = useRef<() => void>(() => undefined);
  // Sync ref every render so it always points to the latest draw closure
  drawRef.current = draw;

  const scheduleRedraw = useCallback(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    animFrameRef.current = requestAnimationFrame(() => drawRef.current());
  }, []); // stable — never recreated

  // Initialize simulation when visible data changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const d3Nodes: D3Node[] = visibleData.nodes.map((n) => ({
      ...n,
      // Preserve existing positions to avoid layout thrash on minor data changes
      x: nodesRef.current.find((e) => e.id === n.id)?.x,
      y: nodesRef.current.find((e) => e.id === n.id)?.y,
    }));
    const d3Links: D3Link[] = visibleData.links.map((l) => ({ ...l }));

    const simulation = forceSimulation<D3Node>(d3Nodes)
      .force(
        'link',
        forceLink<D3Node, D3Link>(d3Links)
          .id((d) => d.id)
          .distance(80),
      )
      .force('charge', forceManyBody<D3Node>().strength(-200))
      .force('center', forceCenter(canvas.width / 2, canvas.height / 2))
      .force('collide', forceCollide<D3Node>(MAX_NODE_RADIUS * 2));

    nodesRef.current = d3Nodes;
    linksRef.current = d3Links;

    simulation.on('tick', scheduleRedraw);
    simulation.on('end', () => {
      const c = canvasRef.current;
      const afp = activeFilePathRef.current;
      if (!c || !afp || !zoomBehaviorRef.current) return;
      const activeNode = nodesRef.current.find((n) => n.id === afp);
      if (!activeNode || activeNode.x == null || activeNode.y == null) return;
      const tx = c.width / 2 - activeNode.x;
      const ty = c.height / 2 - activeNode.y;
      select(c)
        .transition()
        .duration(600)
        .call(
          zoomBehaviorRef.current.transform,
          zoomIdentity.translate(tx, ty),
        );
    });
    simulation.alpha(0.3).restart();

    return () => {
      simulation.stop();
    };
  }, [visibleData, scheduleRedraw]);

  // Redraw when hover/search/active state changes (no simulation restart needed)
  useEffect(() => {
    scheduleRedraw();
  }, [
    hoveredNodeId,
    searchMatches,
    activeFilePath,
    colorByFolder,
    scheduleRedraw,
  ]);

  // Set up zoom/pan on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const zoomBehavior = zoom<HTMLCanvasElement, unknown>()
      .scaleExtent([0.1, 10])
      .on('zoom', (event) => {
        transformRef.current = event.transform as ZoomTransform;
        scheduleRedraw();
      });

    zoomBehaviorRef.current = zoomBehavior;
    select(canvas).call(zoomBehavior);

    return () => {
      select(canvas).on('.zoom', null);
    };
  }, [scheduleRedraw]);

  const canvasToWorld = useCallback((cx: number, cy: number) => {
    const t = transformRef.current;
    return { x: (cx - t.x) / t.k, y: (cy - t.y) / t.k };
  }, []);

  const getNodeAtPos = useCallback(
    (worldX: number, worldY: number) => {
      const nodes = nodesRef.current;
      for (let i = nodes.length - 1; i >= 0; i--) {
        const n = nodes[i];
        if (n.x == null || n.y == null) continue;
        const dx = worldX - n.x;
        const dy = worldY - n.y;
        const r = getNodeRadius(n.id) * 1.5;
        if (Math.sqrt(dx * dx + dy * dy) <= r) return n;
      }
      return null;
    },
    [getNodeRadius],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const { x, y } = canvasToWorld(
        e.clientX - rect.left,
        e.clientY - rect.top,
      );
      const node = getNodeAtPos(x, y);
      setHoveredNodeId(node ? node.id : null);
      canvas.style.cursor = node ? 'pointer' : 'grab';
    },
    [canvasToWorld, getNodeAtPos],
  );

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const { x, y } = canvasToWorld(
        e.clientX - rect.left,
        e.clientY - rect.top,
      );
      const node = getNodeAtPos(x, y);
      if (node) postMessage('openFile', [node.id]);
    },
    [canvasToWorld, getNodeAtPos, postMessage],
  );

  // Resize canvas to fill container
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const observer = new ResizeObserver(() => {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      scheduleRedraw();
    });
    observer.observe(container);
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;

    return () => observer.disconnect();
  }, [scheduleRedraw]);

  // IPC: receive graph data and active file updates from extension host
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      const message = event.data as {
        command: string;
        data?: GraphViewData;
        activeFilePath?: string;
        filePath?: string;
        viewMode?: ViewMode;
        colorByFolder?: boolean;
      };
      if (message.command === 'graphData') {
        if (message.data) {
          setGraphData((prev) => {
            const isFirstLoad = prev === null;
            if (isFirstLoad) {
              // Apply persisted settings from extension on initial load
              if (message.viewMode != null) setViewMode(message.viewMode);
              if (message.colorByFolder != null)
                setColorByFolder(message.colorByFolder);
            }
            if (message.activeFilePath != null)
              setActiveFilePath(message.activeFilePath);
            return message.data ?? prev;
          });
        } else if (message.activeFilePath != null) {
          setActiveFilePath(message.activeFilePath);
        }
      } else if (message.command === 'setActiveFile') {
        if (message.filePath != null) setActiveFilePath(message.filePath);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  // Signal to extension that the webview is ready to receive data
  useEffect(() => {
    postMessage('graphViewReady', []);
  }, [postMessage]);

  const nodeCount = visibleData.nodes.length;
  const linkCount = visibleData.links.length;

  return (
    <div
      data-theme={daisyTheme}
      className="flex flex-col h-screen w-screen bg-base-100 text-base-content"
    >
      {/* Toolbar */}
      <div className="flex flex-row flex-wrap items-center gap-2 px-3 py-2 border-b border-base-300 bg-base-200 shrink-0">
        {/* Search */}
        <input
          type="text"
          placeholder="Search notes…"
          className="input input-xs input-bordered flex-1 min-w-[120px] max-w-xs"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        {/* Global / Local toggle — use btn-group style for clean appearance */}
        <div className="join shrink-0">
          <button
            className={`join-item btn btn-xs ${viewMode === 'global' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => {
              setViewMode('global');
              postMessage('saveSetting', [
                { key: 'viewMode', value: 'global' },
              ]);
            }}
            title="Show all notes"
          >
            Global
          </button>
          <button
            className={`join-item btn btn-xs ${viewMode === 'local' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => {
              setViewMode('local');
              postMessage('saveSetting', [{ key: 'viewMode', value: 'local' }]);
            }}
            title="Show notes connected to the current file"
          >
            Local
          </button>
        </div>

        {/* Depth slider — only visible in local mode */}
        {viewMode === 'local' && (
          <div className="flex items-center gap-1 text-xs shrink-0">
            <span className="text-base-content/60">Depth</span>
            <input
              type="range"
              min={1}
              max={5}
              value={localDepth}
              onChange={(e) => setLocalDepth(Number(e.target.value))}
              className="range range-xs range-primary w-20"
              title={`Show ${localDepth} hop${localDepth > 1 ? 's' : ''} from current file`}
            />
            <span className="w-3 text-center font-mono text-base-content/80">
              {localDepth}
            </span>
          </div>
        )}

        {/* Color by folder toggle */}
        <button
          className={`btn btn-xs shrink-0 ${colorByFolder ? 'btn-primary' : 'btn-ghost border border-base-300'}`}
          onClick={() => {
            const next = !colorByFolder;
            setColorByFolder(next);
            postMessage('saveSetting', [{ key: 'colorByFolder', value: next }]);
          }}
          title="Color nodes by folder"
        >
          By Folder
        </button>

        {/* Stats */}
        <span className="text-xs text-base-content/50 ml-auto hidden sm:inline">
          {nodeCount} notes · {linkCount} links
        </span>
      </div>

      {/* Canvas */}
      <div ref={containerRef} className="flex-1 relative overflow-hidden">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          style={{ cursor: 'grab' }}
          onMouseMove={handleMouseMove}
          onClick={handleClick}
          onMouseLeave={() => setHoveredNodeId(null)}
        />
        {!graphData && (
          <div className="absolute inset-0 flex items-center justify-center text-base-content/40 text-sm">
            Loading graph…
          </div>
        )}
        {graphData && nodeCount === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-base-content/40 text-sm">
            No notes found. Open a markdown file to get started.
          </div>
        )}
      </div>

      {/* Hover tooltip */}
      {hoveredNodeId && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-base-300 text-base-content text-xs px-2 py-1 rounded pointer-events-none z-50 max-w-xs truncate shadow">
          {nodesRef.current.find((n) => n.id === hoveredNodeId)?.label ??
            hoveredNodeId}
        </div>
      )}
    </div>
  );
}
