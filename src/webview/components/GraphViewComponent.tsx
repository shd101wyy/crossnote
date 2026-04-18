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

const NODE_RADIUS = 6;
const ACTIVE_NODE_COLOR = '#ef4444';
const DEFAULT_NODE_COLOR = '#3b82f6';
const HOVER_NODE_COLOR = '#f59e0b';
const NEIGHBOR_NODE_COLOR = '#10b981';
const LINK_COLOR = 'rgba(148, 163, 184, 0.5)';
const ACTIVE_LINK_COLOR = 'rgba(99, 102, 241, 0.8)';
const TEXT_MIN_ZOOM = 0.4;

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

  // Keep a ref in sync so simulation callbacks can read the latest value
  // without needing to be in the dependency array
  useEffect(() => {
    activeFilePathRef.current = activeFilePath;
  }, [activeFilePath]);

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

  // Compute neighbor sets for the active hovered node
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

  // Filter nodes/links for local mode
  const localNodeIds = useMemo(() => {
    const ids = new Set<string>();
    if (!activeFilePath || !graphData) return ids;
    ids.add(activeFilePath);
    for (const link of graphData.links) {
      const src = typeof link.source === 'string' ? link.source : link.source;
      const tgt = typeof link.target === 'string' ? link.target : link.target;
      const srcId = typeof src === 'object' ? (src as GraphViewNode).id : src;
      const tgtId = typeof tgt === 'object' ? (tgt as GraphViewNode).id : tgt;
      if (srcId === activeFilePath || tgtId === activeFilePath) {
        ids.add(srcId);
        ids.add(tgtId);
      }
    }
    return ids;
  }, [activeFilePath, graphData]);

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
    ctx.clearRect(0, 0, width, height);
    ctx.translate(t.x, t.y);
    ctx.scale(t.k, t.k);

    const isFiltering = searchQuery.trim().length > 0;
    const isHovering = hoveredNodeId !== null;

    // Draw links
    for (const link of links) {
      const src = link.source as D3Node;
      const tgt = link.target as D3Node;
      if (src.x == null || src.y == null || tgt.x == null || tgt.y == null)
        continue;

      const isActiveLink =
        isHovering && (src.id === hoveredNodeId || tgt.id === hoveredNodeId);

      ctx.beginPath();
      ctx.moveTo(src.x, src.y);
      ctx.lineTo(tgt.x, tgt.y);
      ctx.strokeStyle = isActiveLink ? ACTIVE_LINK_COLOR : LINK_COLOR;
      ctx.lineWidth = isActiveLink ? 1.5 / t.k : 1 / t.k;
      ctx.globalAlpha =
        isHovering && !isActiveLink ? 0.2 : isFiltering ? 0.3 : 1;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // Draw nodes
    for (const node of nodes) {
      if (node.x == null || node.y == null) continue;

      const isActive = node.id === activeFilePath;
      const isHovered = node.id === hoveredNodeId;
      const isNeighbor = neighborIds.has(node.id);
      const isMatch = searchMatches.has(node.id);

      let color: string;
      if (isActive) color = ACTIVE_NODE_COLOR;
      else if (isHovered) color = HOVER_NODE_COLOR;
      else if (isNeighbor) color = NEIGHBOR_NODE_COLOR;
      else color = DEFAULT_NODE_COLOR;

      const radius = isActive || isHovered ? NODE_RADIUS * 1.4 : NODE_RADIUS;

      const dimmed =
        (isHovering && !isHovered && !isNeighbor && !isActive) ||
        (isFiltering && !isMatch && !isActive);

      ctx.globalAlpha = dimmed ? 0.2 : 1;

      ctx.beginPath();
      ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.fill();

      if (isMatch || isActive) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius + 3, 0, 2 * Math.PI);
        ctx.strokeStyle = isActive ? ACTIVE_NODE_COLOR : '#f59e0b';
        ctx.lineWidth = 2 / t.k;
        ctx.stroke();
      }

      ctx.globalAlpha = 1;

      // Draw label
      if (t.k > TEXT_MIN_ZOOM) {
        const labelAlpha = dimmed ? 0.2 : 1;
        ctx.globalAlpha = labelAlpha;
        ctx.fillStyle = isActive || isHovered ? '#1e293b' : '#475569';
        ctx.font = `${isActive || isHovered ? 'bold ' : ''}${Math.max(10, 12 / t.k)}px sans-serif`;
        ctx.fillText(node.label, node.x + radius + 3, node.y + 4);
        ctx.globalAlpha = 1;
      }
    }

    ctx.restore();
  }, [activeFilePath, hoveredNodeId, neighborIds, searchMatches, searchQuery]);

  const scheduleRedraw = useCallback(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    animFrameRef.current = requestAnimationFrame(draw);
  }, [draw]);

  // Initialize simulation when visible data changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const d3Nodes: D3Node[] = visibleData.nodes.map((n) => ({
      ...n,
      // preserve position if we already have it
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
      .force('collide', forceCollide<D3Node>(NODE_RADIUS * 2));

    nodesRef.current = d3Nodes;
    linksRef.current = d3Links;

    simulation.on('tick', scheduleRedraw);
    simulation.on('end', () => {
      // After simulation stabilizes, center the view on the active node (if any)
      const canvas = canvasRef.current;
      const afp = activeFilePathRef.current;
      if (!canvas || !afp || !zoomBehaviorRef.current) return;
      const activeNode = nodesRef.current.find((n) => n.id === afp);
      if (!activeNode || activeNode.x == null || activeNode.y == null) return;
      const tx = canvas.width / 2 - activeNode.x;
      const ty = canvas.height / 2 - activeNode.y;
      select(canvas)
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

  // Redraw when hover/search/active change
  useEffect(() => {
    scheduleRedraw();
  }, [hoveredNodeId, searchMatches, activeFilePath, scheduleRedraw]);

  // Set up zoom on canvas
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

  // Get canvas coordinates adjusted for zoom/pan
  const canvasToWorld = useCallback((cx: number, cy: number) => {
    const t = transformRef.current;
    return {
      x: (cx - t.x) / t.k,
      y: (cy - t.y) / t.k,
    };
  }, []);

  const getNodeAtPos = useCallback((worldX: number, worldY: number) => {
    const nodes = nodesRef.current;
    for (let i = nodes.length - 1; i >= 0; i--) {
      const n = nodes[i];
      if (n.x == null || n.y == null) continue;
      const dx = worldX - n.x;
      const dy = worldY - n.y;
      if (Math.sqrt(dx * dx + dy * dy) <= NODE_RADIUS * 1.5) {
        return n;
      }
    }
    return null;
  }, []);

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
      if (node) {
        postMessage('openFile', [node.id]);
      }
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

  // IPC: listen for messages from extension host
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      const message = event.data as {
        command: string;
        data?: GraphViewData;
        activeFilePath?: string;
        filePath?: string;
      };
      if (message.command === 'graphData') {
        if (message.data) setGraphData(message.data);
        if (message.activeFilePath != null) {
          setActiveFilePath(message.activeFilePath);
          // Default to local mode when a specific file is focused
          setViewMode('local');
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
    <div className="flex flex-col h-screen w-screen bg-base-100 text-base-content">
      {/* Toolbar */}
      <div className="flex flex-row items-center gap-2 px-3 py-2 border-b border-base-300 bg-base-200 shrink-0">
        <input
          type="text"
          placeholder="Search notes…"
          className="input input-xs input-bordered flex-1 max-w-xs"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <div className="flex rounded-btn border border-base-300 overflow-hidden text-xs">
          <button
            className={`px-2 py-1 ${viewMode === 'global' ? 'bg-primary text-primary-content' : 'bg-base-100 hover:bg-base-200'}`}
            onClick={() => setViewMode('global')}
            title="Show all notes"
          >
            Global
          </button>
          <button
            className={`px-2 py-1 ${viewMode === 'local' ? 'bg-primary text-primary-content' : 'bg-base-100 hover:bg-base-200'}`}
            onClick={() => setViewMode('local')}
            title="Show only notes connected to the current file"
          >
            Local
          </button>
        </div>
        <span className="text-xs text-base-content/50 hidden sm:inline">
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
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-base-300 text-base-content text-xs px-2 py-1 rounded pointer-events-none z-50 max-w-xs truncate">
          {nodesRef.current.find((n) => n.id === hoveredNodeId)?.label ??
            hoveredNodeId}
        </div>
      )}
    </div>
  );
}
