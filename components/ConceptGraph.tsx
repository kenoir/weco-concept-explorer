import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

const styles = {
  card: {
    background: '#fff',
    borderRadius: 16,
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    padding: '2em',
    marginBottom: '2em',
    minHeight: 350,
  },
  h2: {
    fontSize: '1.2em',
    fontWeight: 700,
    marginBottom: '1em',
  },
  graphContainer: {
    width: '100%',
    height: 480, // Increased height for a taller graph
    minHeight: 400,
    display: 'flex',
    flexGrow: 1,
    background: '#f7f7fa',
    borderRadius: 12,
    marginTop: 12,
    overflow: 'hidden',
  },
  tooltip: {
    position: 'absolute' as const,
    textAlign: 'center' as const,
    padding: '6px 8px',
    font: '12px sans-serif',
    background: 'rgba(0,0,0,0.7)',
    color: 'white',
    border: 0,
    borderRadius: 4,
    pointerEvents: 'none' as const,
    opacity: 0,
    transition: 'opacity 0.2s',
    zIndex: 10,
  },
};

// Interfaces from original SPA and adapted for React props
interface ConceptNode extends d3.SimulationNodeDatum {
  id: string;
  label: string;
  type?: string; // Optional as not all nodes in graph might be fully fetched concepts
  depth: number;
  isRoot?: boolean;
  // Store original concept data if needed
  originalConcept?: any;
}

interface ConceptLink extends d3.SimulationLinkDatum<ConceptNode> {
  source: string | ConceptNode; // D3 link source can be ID or node object
  target: string | ConceptNode; // D3 link target can be ID or node object
}

interface GraphData {
  nodes: ConceptNode[];
  links: ConceptLink[];
}

interface ConceptGraphProps {
  rootConcept: any | null; // The main concept object fetched by parent
  onNodeClick: (conceptId: string) => void; // Callback to handle concept change
  currentConceptId: string | null;
}

function getRelatedConcepts(concept: any): Array<{ id: string, label: string, type: string }> {
  const relations: Array<{ id: string, label: string, type: string }> = [];
  if (!concept || !concept.relatedConcepts) return relations; // Check if root concept or its relatedConcepts field is missing

  Object.values(concept.relatedConcepts).forEach((group: any) => { // Iterate over arrays like 'broaderThan', 'relatedTo', 'relatedTopics'
    if (Array.isArray(group)) {
      group.forEach(related => {
        // Use related.conceptType for the 'type' field.
        // Ensure the stub has an id, a label, and a conceptType to be useful.
        if (related && related.id && related.label && related.conceptType) {
          relations.push({ id: related.id, label: related.label, type: related.conceptType });
        }
      });
    }
  });
  return relations;
}

const ConceptGraph: React.FC<ConceptGraphProps> = ({ rootConcept, onNodeClick, currentConceptId }) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const [isLoadingGraph, setIsLoadingGraph] = useState(false);

  // Function to fetch a single concept (used for populating graph)
  const fetchConceptById = async (id: string): Promise<any | null> => {
    try {
      const response = await fetch(`https://api.wellcomecollection.org/catalogue/v2/concepts/${id}`);
      if (!response.ok) {
        console.warn(`Failed to fetch concept ${id} for graph: ${response.status}`);
        return null;
      }
      return await response.json();
    } catch (error) {
      console.error(`Error fetching concept ${id} for graph:`, error);
      return null;
    }
  };

  useEffect(() => {
    if (!rootConcept || !svgRef.current || !tooltipRef.current) {
      // Clear previous graph if rootConcept is null
      if (svgRef.current) d3.select(svgRef.current).selectAll("*").remove();
      return;
    }

    setIsLoadingGraph(true);
    const d3Svg = d3.select(svgRef.current);
    const d3Tooltip = d3.select(tooltipRef.current);
    d3Svg.selectAll("*").remove(); // Clear previous graph elements

    const buildGraphData = async (initialRootConcept: any): Promise<GraphData> => {
      const nodesMap = new Map<string, ConceptNode>();
      const links: ConceptLink[] = [];
      const queue: Array<{ concept: any; depth: number }> = [];

      nodesMap.set(initialRootConcept.id, {
        id: initialRootConcept.id,
        label: initialRootConcept.label,
        type: initialRootConcept.type,
        depth: 0,
        isRoot: true,
        originalConcept: initialRootConcept,
      });
      queue.push({ concept: initialRootConcept, depth: 0 });

      let head = 0;
      while (head < queue.length) {
        const queueItem = queue[head++];
        if (!queueItem) continue;
        const { concept: currentConceptData, depth } = queueItem;

        if (depth >= 2) {
          continue; // Only allow two jumps from the root
        }

        const relatedConceptStubs = getRelatedConcepts(currentConceptData);
        if (relatedConceptStubs.length === 0) {
          continue;
        }

        // Fetch full related concept data for up to two jumps
        if (depth + 1 <= 2) {
          const fetchedFullRelatedConcepts = await Promise.all(
            relatedConceptStubs.filter(stub => stub && stub.id).map(stub => fetchConceptById(stub.id))
          );

          for (const fullRelatedConcept of fetchedFullRelatedConcepts) {
            if (fullRelatedConcept && fullRelatedConcept.id) {
              if (!nodesMap.has(fullRelatedConcept.id)) {
                nodesMap.set(fullRelatedConcept.id, {
                  id: fullRelatedConcept.id,
                  label: fullRelatedConcept.label,
                  type: fullRelatedConcept.type,
                  depth: depth + 1,
                  isRoot: false,
                  originalConcept: fullRelatedConcept,
                });
                // Enqueue for further expansion if depth + 1 < 2
                if (depth + 1 < 2) {
                  queue.push({ concept: fullRelatedConcept, depth: depth + 1 });
                }
              }
              const linkExists = links.some(
                (l) =>
                  (typeof l.source === "string" ? l.source === currentConceptData.id : (l.source as ConceptNode).id === currentConceptData.id) &&
                  (typeof l.target === "string" ? l.target === fullRelatedConcept.id : (l.target as ConceptNode).id === fullRelatedConcept.id)
              );
              if (!linkExists) {
                links.push({ source: currentConceptData.id, target: fullRelatedConcept.id });
              }
            }
          }
        }
      }
      return { nodes: Array.from(nodesMap.values()), links };
    };

    const draw = async (initialRootConcept: any) => {
      const { nodes, links } = await buildGraphData(initialRootConcept);
      setIsLoadingGraph(false);

      if (nodes.length <= 1 && links.length === 0) {
        d3Svg.append("text")
          .attr("x", "50%")
          .attr("y", "50%")
          .attr("text-anchor", "middle")
          .attr("fill", "currentColor") // Use Tailwind text color
          .attr("class", "text-gray-500 text-sm") // Tailwind classes
          .text("No related concepts found to build a graph.");
        return;
      }

      // --- Best Practice: Always clear SVG before drawing ---
      d3Svg.selectAll("*").remove();

      const container = svgRef.current?.parentElement;
      if (!container) return;

      const width = container.clientWidth;
      const height = Math.max(container.clientHeight, 350); // Ensure min height

      d3Svg.attr("width", width).attr("height", height).attr("viewBox", [-width / 2, -height / 2, width, height]);

      const g = d3Svg.append("g");

      const simulation = d3.forceSimulation(nodes)
        .force("link", d3.forceLink<ConceptNode, ConceptLink>(links).id(d => d.id).distance(80))
        .force("charge", d3.forceManyBody().strength(-150))
        .force("center", d3.forceCenter(0,0)); // Centered in the viewBox

      // Add a force to prevent node text from overlapping other nodes
      // Estimate text width (approx 7px per character, min 30px)
      simulation.force("collision", d3.forceCollide<ConceptNode>(d => {
        const baseRadius = d.isRoot ? 8 : (d.depth === 1 ? 6 : 4);
        const textWidth = Math.max(30, d.label.length * 7);
        // Add a buffer so text doesn't overlap other nodes
        return Math.sqrt(baseRadius * baseRadius + (textWidth * textWidth) / 16) + 8;
      }));

      const linkElements = g.append("g")
        .attr("class", "graph-link-group")
        .selectAll("line")
        .data(links)
        .join("line")
        .attr("stroke-width", 1.5)
        .attr("stroke", "rgba(34,34,34,0.5)"); // 50% opacity for edges

      const nodeElements = g.append("g")
        .selectAll("g")
        .data(nodes)
        .join("g")
        .attr("class", "nodes") // From CSS module for cursor pointer etc.
        .call(d3.drag<any, ConceptNode>() // Make `any` the type of the <g> element
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended));

      nodeElements.append("circle")
        .attr("class", "nodeCircle")
        .attr("r", d => d.id === currentConceptId ? 16 : (d.isRoot ? 8 : (d.depth === 1 ? 6 : 4)))
        .attr("fill", d => d.id === currentConceptId ? "#f59e0b" : (d.isRoot ? "#0ea5e9" : (d.depth === 1 ? "#6366f1" : "#a78bfa")))
        .attr("stroke", d => d.id === currentConceptId ? "#b45309" : "#fff")
        .attr("stroke-width", d => d.id === currentConceptId ? 3 : 1.5);

      // Add a label background rect for each node
      nodeElements.append("rect")
        .attr("class", "nodeLabelBg")
        .attr("x", 8)
        .attr("y", -10)
        .attr("rx", 4)
        .attr("height", 20)
        .attr("fill", d => d.id === currentConceptId ? "#fffbe8" : "#fff")
        .attr("stroke", d => d.id === currentConceptId ? "#f59e0b" : "#e5e7eb")
        .attr("stroke-width", 1.2)
        .attr("opacity", 0.95)
        .attr("width", d => Math.max(30, d.label.length * 7) + 8);

      nodeElements.append("text")
        .text(d => d.label)
        .attr("x", 12)
        .attr("y", "0.31em")
        .attr("class", "nodeText")
        .style("font-size", d => d.id === currentConceptId ? "1.15em" : "12px")
        .style("font-weight", d => d.id === currentConceptId ? 700 : 400)
        .style("fill", d => d.id === currentConceptId ? "#b45309" : "#222");

      // Highlight 1st order nodes and edges
      const firstOrderNodeIds = new Set<string>();
      if (currentConceptId) {
        nodes.forEach(n => {
          if (n.id === currentConceptId) return;
          const isFirstOrder = links.some(l =>
            (typeof l.source === 'string' ? l.source : l.source.id) === currentConceptId &&
            (typeof l.target === 'string' ? l.target : l.target.id) === n.id ||
            (typeof l.target === 'string' ? l.target : l.target.id) === currentConceptId &&
            (typeof l.source === 'string' ? l.source : l.source.id) === n.id
          );
          if (isFirstOrder) firstOrderNodeIds.add(n.id);
        });
      }

      linkElements
        .attr("stroke", d => {
          const isFirstOrder = (typeof d.source === 'string' ? d.source : d.source.id) === currentConceptId ||
                               (typeof d.target === 'string' ? d.target : d.target.id) === currentConceptId;
          return isFirstOrder ? "#f59e0b" : "rgba(34,34,34,0.25)";
        })
        .attr("stroke-width", d => {
          const isFirstOrder = (typeof d.source === 'string' ? d.source : d.source.id) === currentConceptId ||
                               (typeof d.target === 'string' ? d.target : d.target.id) === currentConceptId;
          return isFirstOrder ? 2.5 : 1.2;
        })
        .attr("opacity", d => {
          const isFirstOrder = (typeof d.source === 'string' ? d.source : d.source.id) === currentConceptId ||
                               (typeof d.target === 'string' ? d.target : d.target.id) === currentConceptId;
          return isFirstOrder ? 1 : 0.5;
        });

      nodeElements.selectAll("circle")
        .attr("opacity", d =>
          (d as any).id === currentConceptId || firstOrderNodeIds.has((d as any).id) ? 1 : 0.5
        );
      nodeElements.selectAll("rect")
        .attr("opacity", d =>
          (d as any).id === currentConceptId || firstOrderNodeIds.has((d as any).id) ? 0.95 : 0.5
        );
      nodeElements.selectAll("text")
        .style("opacity", d =>
          (d as any).id === currentConceptId || firstOrderNodeIds.has((d as any).id) ? 1 : 0.5
        );

      // Center the graph on the selected node after layout
      simulation.on("end", () => {
        if (currentConceptId) {
          const centerNode = nodes.find(n => n.id === currentConceptId);
          if (centerNode) {
            const cx = typeof centerNode.x === 'number' ? centerNode.x : 0;
            const cy = typeof centerNode.y === 'number' ? centerNode.y : 0;
            g.transition().duration(500).attr("transform", `translate(${-cx},${-cy})`);
          }
        }
      });

      nodeElements.on("click", (event, d) => {
        event.stopPropagation();
        if (d.id !== currentConceptId) {
          onNodeClick(d.id);
        }
      }).on("mouseover", (event, d) => {
        d3Tooltip.transition().duration(200).style("opacity", 1);
        d3Tooltip.html(`<strong>${d.label}</strong><br/><span class="font-mono text-xs">${d.id}</span>`)
          .style("left", `${event.pageX + 10}px`)
          .style("top", `${event.pageY - 15}px`); // Adjusted y-offset for better placement
      }).on("mouseout", () => {
        d3Tooltip.transition().duration(500).style("opacity", 0);
      });

      const zoom = d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.3, 5])
        .on("zoom", (event) => {
          g.attr("transform", event.transform);
        });
      d3Svg.call(zoom);

      // Center graph initially - adjust as needed
      // This might require calculating the bounding box of the graph if not using forceCenter(0,0)
      // For now, forceCenter(0,0) with viewBox should handle it.

      simulation.on("tick", () => {
        linkElements
          .attr("x1", d => (d.source as ConceptNode).x!)
          .attr("y1", d => (d.source as ConceptNode).y!)
          .attr("x2", d => (d.target as ConceptNode).x!)
          .attr("y2", d => (d.target as ConceptNode).y!);
        nodeElements.attr("transform", d => `translate(${d.x!},${d.y!})`);
      });

      // --- Store simulation for cleanup ---
      (d3Svg as any).simulation = simulation;

      function dragstarted(event: d3.D3DragEvent<any, ConceptNode, any>, d: ConceptNode) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      }
      function dragged(event: d3.D3DragEvent<any, ConceptNode, any>, d: ConceptNode) {
        d.fx = event.x;
        d.fy = event.y;
      }
      function dragended(event: d3.D3DragEvent<any, ConceptNode, any>, d: ConceptNode) {
        if (!event.active) simulation.alphaTarget(0);
        if (!event.subject.fixed) { // Allow unfixing nodes
             d.fx = null;
             d.fy = null;
        }
      }
    };

    draw(rootConcept);

    // Resize observer for redrawing graph on container resize
    const resizeObserver = new ResizeObserver(() => {
        // Re-draw or update graph dimensions
        // For simplicity, just re-calling draw. A more optimized approach would update attributes.
        if (svgRef.current && rootConcept) {
           // d3.select(svgRef.current).selectAll("*").remove(); // Clear before redraw
           // draw(rootConcept); // This could be expensive. A better way is to update existing elements.
           // For now, let\'s avoid auto-redraw on resize to prevent excessive API calls from buildGraphData
           // A proper resize would update width/height and potentially the viewBox, then restart simulation or update forces.
        }
    });
    if (svgRef.current?.parentElement) {
        resizeObserver.observe(svgRef.current.parentElement);
    }

    return () => {
      // --- Best Practice: Stop simulation and clean up SVG ---
      if ((d3Svg as any).simulation) {
        (d3Svg as any).simulation.stop();
        (d3Svg as any).simulation = null;
      }
      resizeObserver.disconnect();
      d3.select(svgRef.current).selectAll("*").remove(); // Clean up SVG
    };

  }, [rootConcept, onNodeClick, currentConceptId]); // currentConceptId dependency to re-color selected node

  return (
    <div style={styles.card}>
      <div style={styles.h2}>Related Concepts Graph</div>
      <div style={{ color: '#666', fontSize: '0.95em', marginBottom: 8 }}>Click node to explore. Drag background to pan. Zoom with scroll.</div>
      {isLoadingGraph && (
        <div style={{ minHeight: 350, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          Loading graph...
        </div>
      )}
      <div ref={tooltipRef} style={styles.tooltip}></div>
      <div style={styles.graphContainer}>
        <svg ref={svgRef} style={{ width: '100%', height: '100%' }}></svg>
      </div>
    </div>
  );
};

export default ConceptGraph;
