import React, { useCallback, useEffect, useRef, useState } from 'react';
import { GraphData } from 'react-force-graph-2d';

// Define types for graph elements
interface NodeData {
  id: string;
  firstName: string;
  lastName: string;
  connectionCount: number;
  bgColor: string;
  x: number;
  y: number;
}

interface EdgeData {
  id: string;
  source: string;
  target: string;
  color: string;
  width: number;
}

interface CustomGraphData extends GraphData {
  nodes: NodeData[];
  edges: EdgeData[];
}

interface CanvasGraphProps {
  data: CustomGraphData,
  width: number,
  height: number,
  zoomLevel: number,
  onNodeClick: (nodeId: string) => void,
  onNodeDrag: (nodeId, x, y) => void
}

// Physics constants
const NODE_RADIUS = 45; // Node radius in pixels
const MIN_DISTANCE = 110; // Minimum distance between any two nodes
const MAX_DISTANCE = 500; // Maximum distance between connected nodes
const REPULSION_STRENGTH = 500; // How strongly nodes repel each other when too close
const ATTRACTION_STRENGTH = 0.1; // Default attraction between connected nodes
const CONSTRAINT_STRENGTH = 0.2; // Strength of distance constraints
const DAMPING = 0.6; // Damping factor for velocity (0-1)
const CENTER_GRAVITY = 0.01; // Force pulling nodes to the center
const MAX_VELOCITY = 5; // Maximum velocity to prevent wild movement
const COOLING_FACTOR = 0.99; // System gradually cools down

const CanvasGraph: React.FC<CanvasGraphProps> = ({ data, width, height, zoomLevel, onNodeClick, onNodeDrag }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // State for interactions
  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [isPanning, setIsPanning] = useState(false);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [autoLayout, setAutoLayout] = useState(true);

  // Node physics state
  const [nodePositions, setNodePositions] = useState<
    Record<
      string,
      {
        x: number;
        y: number;
        vx: number;
        vy: number;
      }
    >
  >({});

  // Animation frame reference
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    // Only run once when component mounts or when data.nodes changes
    if (width <= 0 || height <= 0 || !data.nodes || data.nodes.length === 0) return;

    console.log('Initializing node positions...');

    // Skip if we already have positions for all nodes
    const allNodesHavePositions = data.nodes.every(
      node =>
        nodePositions[node.id] && (nodePositions[node.id].x !== 0 || nodePositions[node.id].y !== 0),
    );

    if (allNodesHavePositions) {
      console.log('All nodes already have positions');
      return;
    }

    // Create initial positions object
    const initialPositions: Record<string, { x: number; y: number; vx: number; vy: number }> = {};

    // Determine the area to place nodes
    const padding = NODE_RADIUS * 2;
    const availableWidth = width - padding * 2;
    const availableHeight = height - padding * 2;

    // Calculate a grid layout - find grid dimensions based on node count
    const nodeCount = data.nodes.length;
    const aspectRatio = availableWidth / availableHeight;
    const gridCols = Math.ceil(Math.sqrt(nodeCount * aspectRatio));
    const gridRows = Math.ceil(nodeCount / gridCols);

    console.log(`Creating a ${gridCols}x${gridRows} grid for ${nodeCount} nodes`);

    // Calculate cell size
    const cellWidth = availableWidth / gridCols;
    const cellHeight = availableHeight / gridRows;

    // Position each node in a grid cell with random offset
    data.nodes.forEach((node, index) => {
      // Only generate new position if node doesn't already have one
      if (
        nodePositions[node.id] &&
        nodePositions[node.id].x !== 0 &&
        nodePositions[node.id].y !== 0
      ) {
        initialPositions[node.id] = {
          ...nodePositions[node.id],
          vx: 0,
          vy: 0,
        };
        return;
      }

      // Calculate grid position
      const row = Math.floor(index / gridCols);
      const col = index % gridCols;

      // Add randomness within cell (20% of cell size)
      const randomOffsetX = cellWidth * 0.4 * (Math.random() - 0.5);
      const randomOffsetY = cellHeight * 0.4 * (Math.random() - 0.5);

      // Calculate final position
      const x = padding + cellWidth * (col + 0.5) + randomOffsetX;
      const y = padding + cellHeight * (row + 0.5) + randomOffsetY;

      initialPositions[node.id] = {
        x: x,
        y: y,
        vx: 0,
        vy: 0,
      };

      console.log(`Node ${node.id} positioned at (${x.toFixed(2)}, ${y.toFixed(2)})`);
    });

    // Set positions in one batch update
    setNodePositions(initialPositions);

    console.log('Node positioning complete');
  }, [data.nodes, width, height]);

  // Run physics simulation - FIX: Added proper dependencies
  useEffect(() => {
    // Only proceed if we have valid dimensions and data
    if (width <= 0 || height <= 0 || !data.nodes || data.nodes.length === 0) return;

    // Debug: Force at least one draw call to make sure graph is initially visible
    drawGraph();

    if (!autoLayout || draggedNode) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      return;
    }

    const simulatePhysics = () => {
      setNodePositions(prevPositions => {
        const newPositions = { ...prevPositions };

        // Apply forces to each node
        data.nodes.forEach(node => {
          if (!newPositions[node.id]) return;

          // Skip if this node is being dragged
          if (node.id === draggedNode) return;

          let forceX = 0;
          let forceY = 0;

          // Center gravity force
          const centerX = width / 2;
          const centerY = height / 2;
          forceX += (centerX - newPositions[node.id].x) * CENTER_GRAVITY;
          forceY += (centerY - newPositions[node.id].y) * CENTER_GRAVITY;

          // Repulsion forces (from ALL other nodes to prevent overlapping)
          data.nodes.forEach(otherNode => {
            if (node.id === otherNode.id || !newPositions[otherNode.id]) return;

            const dx = newPositions[node.id].x - newPositions[otherNode.id].x;
            const dy = newPositions[node.id].y - newPositions[otherNode.id].y;
            const distanceSq = dx * dx + dy * dy;
            const distance = Math.sqrt(distanceSq) || 1; // Avoid division by zero

            // Enforce minimum distance between any two nodes
            if (distance < MIN_DISTANCE) {
              // Strong repulsion force that increases as nodes get closer
              const repulsionFactor = 1 - distance / MIN_DISTANCE;
              const repulsionForce = REPULSION_STRENGTH * repulsionFactor * repulsionFactor;

              forceX += (dx / distance) * repulsionForce;
              forceY += (dy / distance) * repulsionForce;
            }
          });

          // Find connected nodes (neighbors) for the current node
          const connectedNodeIds = new Set<string>();
          data.edges.forEach(edge => {
            if (edge.source === node.id) {
              connectedNodeIds.add(edge.target);
            } else if (edge.target === node.id) {
              connectedNodeIds.add(edge.source);
            }
          });

          // Attraction forces (only to connected nodes)
          connectedNodeIds.forEach(targetId => {
            if (!newPositions[targetId]) return;

            const dx = newPositions[targetId].x - newPositions[node.id].x;
            const dy = newPositions[targetId].y - newPositions[node.id].y;
            const distance = Math.sqrt(dx * dx + dy * dy) || 1;

            // Enforce maximum distance constraint between connected nodes
            if (distance > MAX_DISTANCE) {
              // Strong attractive force that increases as distance exceeds max
              const excessDistance = distance - MAX_DISTANCE;
              const constraintForce = CONSTRAINT_STRENGTH * excessDistance;

              forceX += (dx / distance) * constraintForce;
              forceY += (dy / distance) * constraintForce;
            }
            // Regular attraction between connected nodes (weaker when close)
            else {
              // Linear attraction normalized by MAX_DISTANCE
              const normalizedDistance = distance / MAX_DISTANCE;
              const attractionForce = ATTRACTION_STRENGTH * normalizedDistance;

              forceX += (dx / distance) * attractionForce;
              forceY += (dy / distance) * attractionForce;
            }
          });

          // Update velocity with applied forces and damping
          newPositions[node.id].vx = newPositions[node.id].vx * DAMPING + forceX;
          newPositions[node.id].vy = newPositions[node.id].vy * DAMPING + forceY;

          // Limit maximum velocity to prevent wild movement
          const speed = Math.sqrt(
            newPositions[node.id].vx * newPositions[node.id].vx +
            newPositions[node.id].vy * newPositions[node.id].vy,
          );
          if (speed > MAX_VELOCITY) {
            newPositions[node.id].vx = (newPositions[node.id].vx / speed) * MAX_VELOCITY;
            newPositions[node.id].vy = (newPositions[node.id].vy / speed) * MAX_VELOCITY;
          }

          // Apply cooling factor to gradually slow the system
          newPositions[node.id].vx *= COOLING_FACTOR;
          newPositions[node.id].vy *= COOLING_FACTOR;

          // Update position
          newPositions[node.id].x += newPositions[node.id].vx;
          newPositions[node.id].y += newPositions[node.id].vy;

          // Boundary constraints
          const padding = NODE_RADIUS;
          if (newPositions[node.id].x < padding) {
            newPositions[node.id].x = padding;
            newPositions[node.id].vx *= -0.5; // Bounce back
          }
          if (newPositions[node.id].x > width - padding) {
            newPositions[node.id].x = width - padding;
            newPositions[node.id].vx *= -0.5;
          }
          if (newPositions[node.id].y < padding) {
            newPositions[node.id].y = padding;
            newPositions[node.id].vy *= -0.5;
          }
          if (newPositions[node.id].y > height - padding) {
            newPositions[node.id].y = height - padding;
            newPositions[node.id].vy *= -0.5;
          }
        });

        return newPositions;
      });

      animationRef.current = requestAnimationFrame(simulatePhysics);
    };

    animationRef.current = requestAnimationFrame(simulatePhysics);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [data.nodes, data.edges, width, height, autoLayout, draggedNode]); // FIX: Added proper dependencies

  // Find node at position function
  const findNodeAtPosition = useCallback(
    (x: number, y: number): string | null => {
      // Transform coordinates based on scale and pan
      const transformedX = (x - panOffset.x) / scale;
      const transformedY = (y - panOffset.y) / scale;

      // Iterate through nodes in reverse order (top-most first)
      for (let i = data.nodes.length - 1; i >= 0; i--) {
        const node = data.nodes[i];
        const pos = nodePositions[node.id];

        if (!pos) continue;

        // Calculate distance from click to node center
        const dx = pos.x - transformedX;
        const dy = pos.y - transformedY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // If click is inside node radius, return node id
        if (distance <= NODE_RADIUS) {
          return node.id;
        }
      }

      return null;
    },
    [data.nodes, nodePositions, panOffset, scale],
  ); // FIX: Added proper dependencies

  // Mouse event handlers
  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      // Get click position relative to canvas
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Find if a node was clicked
      const nodeId = findNodeAtPosition(x, y);

      if (nodeId) {
        // Set dragged node and calculate offset
        setDraggedNode(nodeId);
        const transformedX = (x - panOffset.x) / scale;
        const transformedY = (y - panOffset.y) / scale;
        setOffsetX(transformedX - nodePositions[nodeId].x);
        setOffsetY(transformedY - nodePositions[nodeId].y);

        // Reset velocity when starting to drag
        setNodePositions(prev => ({
          ...prev,
          [nodeId]: {
            ...prev[nodeId],
            vx: 0,
            vy: 0,
          },
        }));
      } else {
        // Start panning
        setIsPanning(true);
        setPanStart({ x, y });
      }
    },
    [findNodeAtPosition, nodePositions, panOffset, scale],
  ); // FIX: Added proper dependencies

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      // Get mouse position relative to canvas
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Update hovered node
      const nodeId = findNodeAtPosition(x, y);
      setHoveredNode(nodeId);

      // Handle dragging a node
      if (draggedNode) {
        // Transform coordinates based on scale and pan
        const transformedX = (x - panOffset.x) / scale;
        const transformedY = (y - panOffset.y) / scale;

        // Update node position
        setNodePositions(prev => ({
          ...prev,
          [draggedNode]: {
            ...prev[draggedNode],
            x: transformedX - offsetX,
            y: transformedY - offsetY,
            vx: 0,
            vy: 0,
          },
        }));
      }
      // Handle panning
      else if (isPanning) {
        const dx = x - panStart.x;
        const dy = y - panStart.y;
        setPanOffset(prev => ({
          x: prev.x + dx,
          y: prev.y + dy,
        }));
        setPanStart({ x, y });
      }
    },
    [findNodeAtPosition, draggedNode, isPanning, offsetX, offsetY, panOffset, panStart, scale],
  ); // FIX: Added proper dependencies

  const handleMouseUp = useCallback(() => {
    // End any drag or pan operation
    setDraggedNode(null);
    setIsPanning(false);
  }, []);

  const handleWheel = useCallback(
    (e: React.WheelEvent<HTMLCanvasElement>) => {
      e.preventDefault();

      // Get mouse position relative to canvas
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Calculate zoom factor
      const scaleFactor = e.deltaY < 0 ? 1.1 : 0.9;
      const newScale = Math.max(0.1, Math.min(5, scale * scaleFactor));

      // Calculate new pan offset so that point under mouse stays fixed
      // This is the key part for zooming toward mouse position
      const newPanOffsetX = mouseX - (mouseX - panOffset.x) * (newScale / scale);
      const newPanOffsetY = mouseY - (mouseY - panOffset.y) * (newScale / scale);

      // Update state
      setScale(newScale);
      setPanOffset({ x: newPanOffsetX, y: newPanOffsetY });
    },
    [scale, panOffset],
  );

  const toggleAutoLayout = useCallback(() => {
    setAutoLayout(prev => !prev);
  }, []);

  // Draw controls function
  const drawControls = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      // Auto layout toggle button
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(width - 120, 20, 100, 40);

      ctx.fillStyle = autoLayout ? '#4ade80' : '#cbd5e1';
      ctx.font = '16px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(autoLayout ? 'Physics: ON' : 'Physics: OFF', width - 70, 40);
    },
    [autoLayout, width],
  );

  // Draw function - FIX: Properly memoized with all dependencies
  const drawGraph = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Skip drawing if dimensions are invalid
    if (width <= 0 || height <= 0) return;

    // Set canvas dimensions to match container
    // NOTE: Setting canvas width/height clears the canvas, so only do this if needed
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    // Clear canvas
    ctx.fillStyle = '#0f172a'; // Slate-900
    ctx.fillRect(0, 0, width, height);

    // Apply transformation (scale and pan)
    ctx.save();
    ctx.translate(panOffset.x, panOffset.y);
    ctx.scale(scale, scale);

    // Draw edges
    data.edges.forEach(edge => {
      const sourceNode = data.nodes.find(n => n.id === edge.source);
      const targetNode = data.nodes.find(n => n.id === edge.target);

      if (sourceNode && targetNode) {
        const sourcePos = nodePositions[sourceNode.id];
        const targetPos = nodePositions[targetNode.id];

        if (sourcePos && targetPos) {
          ctx.beginPath();
          ctx.moveTo(sourcePos.x, sourcePos.y);
          ctx.lineTo(targetPos.x, targetPos.y);

          // Edge styling
          let highlighted = false;
          if (hoveredNode) {
            highlighted = edge.source === hoveredNode || edge.target === hoveredNode;
          }

          ctx.strokeStyle = highlighted
            ? '#3b82f6' // bright blue for highlighted edges
            : edge.color || 'rgba(255, 255, 255, 0.5)';

          ctx.lineWidth = highlighted ? (edge.width ? edge.width + 1 : 3) : edge.width || 1;

          ctx.stroke();
        }
      }
    });

    // Draw nodes
    data.nodes.forEach(node => {
      const pos = nodePositions[node.id];
      if (!pos) return;

      // Node styling based on state
      const isHovered = node.id === hoveredNode;
      const isDragged = node.id === draggedNode;

      // Glow effect for hovered or dragged nodes
      if (isHovered || isDragged) {
        ctx.shadowColor = isDragged ? '#ff9900' : '#3b82f6';
        ctx.shadowBlur = 15;
      }

      // Draw node circle
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, NODE_RADIUS, 0, 2 * Math.PI);

      // Fill style based on state
      if (isDragged) {
        ctx.fillStyle = '#ff9900'; // Orange for dragged node
      } else if (isHovered) {
        ctx.fillStyle = '#3b82f6'; // Blue for hovered node
      } else {
        ctx.fillStyle = node.bgColor || '#475569'; // Default to slate-600
      }
      ctx.fill();

      // Draw border
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw initials
      const initials = `${node.firstName} ${node.lastName.charAt(0)}.`;
      ctx.fillStyle = 'white';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(initials, pos.x, pos.y);

      // Draw name label for hovered or dragged nodes
      if (isHovered || isDragged) {
        const fullName = `${node.firstName} ${node.lastName}`;
        ctx.font = '14px sans-serif';

        // Add a background for the label
        const textMetrics = ctx.measureText(fullName);
        const textWidth = textMetrics.width;
        const textHeight = 20;
        const padding = 6;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(
          pos.x - textWidth / 2 - padding,
          pos.y + NODE_RADIUS + 5,
          textWidth + padding * 2,
          textHeight + padding * 2,
        );

        ctx.fillStyle = 'white';
        ctx.fillText(fullName, pos.x, pos.y + NODE_RADIUS + 15 + padding);
      }
    });

    // Restore canvas transformation
    ctx.restore();

    // Draw UI controls
    drawControls(ctx);
  }, [
    data,
    nodePositions,
    hoveredNode,
    draggedNode,
    scale,
    panOffset,
    width,
    height,
    drawControls,
  ]); // FIX: Added all dependencies

  // Handle clicks on controls
  const handleControlClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const x = e.nativeEvent.offsetX;
      const y = e.nativeEvent.offsetY;

      // Check if auto layout button was clicked
      if (x >= width - 120 && x <= width - 20 && y >= 20 && y <= 60) {
        toggleAutoLayout();
      }
    },
    [width, toggleAutoLayout],
  ); // FIX: Added proper dependencies

  // FIX: Ensure continuous rendering with requestAnimationFrame
  useEffect(() => {
    // Create a continuous rendering loop that doesn't depend on physics updates
    let animationFrameId: number;

    const renderLoop = () => {
      drawGraph();
      animationFrameId = requestAnimationFrame(renderLoop);
    };

    // Start the render loop
    animationFrameId = requestAnimationFrame(renderLoop);

    // Clean up
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [drawGraph]);

  // Get cursor style based on current state
  const getCursorStyle = useCallback(() => {
    if (draggedNode) return 'grabbing';
    if (hoveredNode) return 'grab';
    if (isPanning) return 'move';
    return 'default';
  }, [draggedNode, hoveredNode, isPanning]);

  // FIX: Initial rendering - make sure canvas is properly initialized
  useEffect(() => {
    // Force the initial draw
    if (width > 0 && height > 0 && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        canvas.width = width;
        canvas.height = height;
        ctx.fillStyle = '#0f172a'; // Slate-900
        ctx.fillRect(0, 0, width, height);

        // Draw a loading message until nodes are positioned
        if (data.nodes.length > 0 && Object.keys(nodePositions).length === 0) {
          ctx.fillStyle = 'white';
          ctx.font = '16px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('Initializing graph...', width / 2, height / 2);
        }
      }
    }
  }, [width, height, data.nodes.length, nodePositions]);

  return (
    <div className="w-full h-full relative">
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleControlClick}
        onWheel={handleWheel}
        width={width}
        height={height}
        className="absolute top-0 left-0 w-full h-full"
        style={{
          background: 'linear-gradient(to bottom, #0f172a, #1e293b)',
          cursor: getCursorStyle(),
        }}
      />
    </div>
  );
};

export default CanvasGraph;
