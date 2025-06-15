import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import styles from "./ConceptGraph.module.css";

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

// Helper: Get related concepts from a concept object (similar to SPA)
function getRelatedConcepts(concept: any): Array<{ id: string, label: string, type: string }> {
  const relations: Array<{ id: string, label: string, type: string }> = [];
  if (!concept || !concept.relatedConcepts) return relations;
  // The structure of relatedConcepts can vary, ensure it\'s handled robustly
  // This assumes relatedConcepts is an object where each value is an array of concepts
  Object.values(concept.relatedConcepts).forEach((group: any) => {
    if (Array.isArray(group)) {
      group.forEach(related => {
        // Ensure the related concept has an ID and a label to be useful
        if (related && related.id && related.label && related.type) {
          relations.push({ id: related.id, label: related.label, type: related.type });
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
          continue;
        }

        const relatedConceptStubs = getRelatedConcepts(currentConceptData);

        if (relatedConceptStubs.length === 0) {
            continue;
        }

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

      const linkElements = g.append("g")
        .attr("class", styles.link) // From CSS module for base link style
        .selectAll("line")
        .data(links)
        .join("line")
        .attr("stroke-width", 1.5);

      const nodeElements = g.append("g")
        .selectAll("g")
        .data(nodes)
        .join("g")
        .attr("class", styles.node) // From CSS module for cursor pointer etc.
        .call(d3.drag<any, ConceptNode>() // Make `any` the type of the <g> element
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended));

      nodeElements.append("circle")
        .attr("class", styles.nodeCircle) // From CSS module
        .attr("r", d => d.isRoot ? 8 : (d.depth === 1 ? 6 : 4))
        .attr("fill", d => d.id === currentConceptId ? "#f59e0b" : (d.isRoot ? "#0ea5e9" : (d.depth === 1 ? "#6366f1" : "#a78bfa")));


      nodeElements.append("text")
        .text(d => d.label)
        .attr("x", 10)
        .attr("y", "0.31em")
        .attr("class", styles.nodeText); // From CSS module

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
      // simulation?.stop(); // Stop simulation on unmount // This line is commented out in the source
      resizeObserver.disconnect();
      d3.select(svgRef.current).selectAll("*").remove(); // Clean up SVG
    };

  }, [rootConcept, onNodeClick, currentConceptId]); // currentConceptId dependency to re-color selected node

  return (
    <div className="bg-white p-4 rounded-lg shadow-md flex-grow flex flex-col">
      <h2 className="text-lg font-bold mb-1 text-gray-900">Related Concepts Graph</h2>
      <p className="text-xs text-gray-500 mb-2">Click node to explore. Drag background to pan. Zoom with scroll.</p>
      {isLoadingGraph && (
         <div className="flex-grow flex items-center justify-center min-h-[350px]">
            <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
         </div>
      )}
      <div ref={tooltipRef} className={styles.tooltip}></div>
      <div className={`${styles.graphContainer} ${isLoadingGraph ? "hidden" : ""}`}>
        <svg ref={svgRef}></svg>
      </div>
    </div>
  );
};

export default ConceptGraph;
