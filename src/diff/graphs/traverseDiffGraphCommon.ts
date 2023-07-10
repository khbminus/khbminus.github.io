import * as d3 from "d3";
import {SimulationLinkDatum, SimulationNodeDatum} from "d3";

import {deleteSelfEdges, escapeHtml, IrSizeNode} from "../../processing";
import {createSvg} from "../../svgGen";
import {buildTreeView} from "../../graph/treeView";
import {Queue} from "queue-typescript";

export function buildTraversableGraph(diffDeclarationsDifference, diffMetaNodesInfo, diffReachibilityInfos) {
    const allMetaNodes = new Set(diffMetaNodesInfo.metaNodesList);

    function isMetaNode(v: string): boolean {
        return allMetaNodes.has(v);
    }

    const UNFOCUSED_LINE_STROKE = "#aaa";
    const FOCUSED_LINE_STROKE = "#fbe106"
    const FIX_UNKNOWN_NODES = true;
    const height = window.innerHeight * 0.95;
    const width = window.innerWidth * 0.8;
    const svg = createSvg(height, width)
    let maxDepth = 3;
    let currentEdgeStatus: "forward" | "backward" | "all" = "forward";
    let isAuto: boolean = false
    type Node = { name: string, value: number };
// @ts-ignore
    const irMap: Map<string, IrSizeNode> =
        new Map(Object.entries(diffDeclarationsDifference).filter(x => !isMetaNode(x[0])));
// @ts-ignore
    const sizeValues = [...irMap.entries()]
        .map(x => [x[1].size, x[1].size])
        .reduce((a, b) => [Math.min(a[0], b[0]), Math.max(a[1], b[1])]);

    const radiusScale = d3
        .scaleLinear()
        .domain(sizeValues)
        .range([5, 20]);
// @ts-ignore
    const nodeEntries: Node[] = [...irMap.entries()].map(lst => {
        const r = radiusScale(Math.abs(lst[1].size))
        return {
            "name": lst[0],
            "value": r
        };
    });

    const names = new Set(nodeEntries.map(x => x.name));

    class EdgeWithVisibility {
        source: string | Node
        target: string | Node
        isVisible: boolean
        description: string

        constructor(source: string, target: string, description: string) {
            this.source = source;
            this.target = target;
            this.isVisible = true;
            this.description = description;
        }

        getSourceName() {
            if (typeof this.source === "string") {
                return this.source;
            }
            return this.source.name;
        }

        getTargetName() {
            if (typeof this.target === "string") {
                return this.target;
            }
            return this.target.name;
        }
    }

// @ts-ignore
    const edges: EdgeWithVisibility[] = deleteSelfEdges(diffReachibilityInfos)
        .filter(x => !isMetaNode(x.source) && !isMetaNode(x.target))
        .map(x => {
            return new EdgeWithVisibility(x.source, x.target, x.description)
        });

    if (FIX_UNKNOWN_NODES) {
        const pushNewNode = (name) => {
            if (name === "kotlin.Array.<init>.size") {
                console.log("shouldBeAdded");
            }
            nodeEntries.push({
                "name": name,
                "value": radiusScale(0)
            })
            names.add(name);
            irMap.set(name, {size: 0, type: "unknown"});
        }
        edges.forEach(e => {
            if (!names.has(e.getSourceName())) {
                pushNewNode(e.getSourceName())
            }
            if (!names.has(e.getTargetName())) {
                pushNewNode(e.getTargetName())
            }
        });
    }
    const nameToNodeMap = new Map(nodeEntries.map(x => [x.name, x]))
    createDepthSelect();
    createModeSelect();
    useAutoMod();
    const clickedStatus = buildTreeView(
// @ts-ignore
        new Map([...irMap.entries()].map(x => [x[0], x[1].size])),
        false,
        updateGraph
    )

    const reachable: Set<string> = new Set();

    const categories = ["function", "property", "field", "anonymous initializer",
            "class", "unknown"],
        colorScale = d3.scaleOrdinal() // the scale function
            .domain(categories)
            .range(['#e06ec1', '#9E999D', '#824e6c', '#347EB4', '#08ACB6', '#91BB91']);

    buildLegend();

    function createLinks(data: EdgeWithVisibility[]) {
        return svg
            .selectAll("line")
            .data(data)
            .enter()
            .append("line")
            .style("stroke", getStroke);
    }

    let links = createLinks([])

    const simulation = d3.forceSimulation(nodeEntries.filter(isNodeVisible) as SimulationNodeDatum[])
        .force("link", d3.forceLink()
            .id(d => {
                return (d as Node).name;
            })
            // @ts-ignore
            .links([])
            .distance(() => 80))
        .force("charge", d3.forceManyBody().strength(-20))
        .force("center", d3.forceCenter(width / 2, height / 2))
        .force("x", d3.forceX())
        .force("y", d3.forceY())
        .force("collide", d3.forceCollide().radius(d =>
            (d as Node).value + 1.5).iterations(2))
        .on("tick", ticked);

    function createNodes(data: Node[]) {
        return svg
            .selectAll(".outer-circle")
            .data(data)
            .join("circle")
            .style("fill", d => colorScale(irMap.get(d.name).type) as string)
            .style("stroke", "black")
            .style("stroke-width", 0.5)
            .style("z-index", 0)
            .attr("class", "outer-circle")
            .attr("r", (d) => {
                return d.value;
            })
            .on("mousemove", mousemove)
            .on("mouseout", function (event, d) {
                links.attr("stroke", getStroke);
                tool.style("display", "none");
            })
            .call(
                // @ts-ignore
                drag(simulation)
            );
    }

    let nodes = createNodes([])

    const promise = new Promise(r => setTimeout(r, 5000)).then(() => simulation.stop());
    const tool = d3.select("body").append("div").attr("class", "toolTip").style("z-index", 2);

    function drag(simulation) {
        function dragstarted(event) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            tool.style("left", event.x + 10 + "px")
            tool.style("top", event.y - 20 + "px")
            event.subject.fx = event.subject.x;
            event.subject.fy = event.subject.y;
        }

        function dragged(event) {
            tool.style("left", event.x + 10 + "px")
            tool.style("top", event.y - 20 + "px")
            event.subject.fx = event.x;
            event.subject.fy = event.y;
        }

        function dragended(event) {
            if (!event.active) simulation.alphaTarget(0);
            event.subject.fx = null;
            event.subject.fy = null;
            tool.style("display", "none");
        }

        return d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended);
    }

    function ticked() {
        links
            .attr(
                "x1",
                // @ts-ignore
                d => Math.max(0, Math.min(width, d.source.x)))
            .attr(
                "y1",
                // @ts-ignore
                d => Math.max(0, Math.min(height, d.source.y))
            )
            .attr(
                "x2",
                // @ts-ignore
                d => Math.max(0, Math.min(width, d.target.x))
            )
            .attr(
                "y2",
                // @ts-ignore
                d => Math.max(0, Math.min(height, d.target.y))
            );
        nodes
            .attr("cx", d => {
                const r = d.value;
                // @ts-ignore
                return d.x = Math.max(r, Math.min(width - r, d.x));
            })
            .attr("cy", d => {
                const r = d.value;
                // @ts-ignore
                return d.y = Math.max(r, Math.min(height - r, d.y));
            });
    }

    function mousemove(event, d) {
        links
            .style(
                "stroke",
                (e) => {
                    // @ts-ignore
                    if (e.source.name === d.name || e.target.name === d.name) {
                        return FOCUSED_LINE_STROKE;
                    }
                    return getStroke(e);
                }
            )
            .style(
                "z-index",
                (e) => {
                    // @ts-ignore
                    if (e.source.name === d.name || e.target.name === d.name) {
                        return 1;
                    }
                    return 0;
                }
            )
        tool.style("left", event.x + 10 + "px")
        tool.style("top", event.y - 20 + "px")
        tool.style("display", "inline-block");
        const radius = (d.name in diffDeclarationsDifference ? diffDeclarationsDifference[d.name].size : 0);
        tool.html(`Name: ${escapeHtml(d.name)}<br>Shallow value (radius): ${radius}`);
    }

    const adjacencyList: Map<string, EdgeWithVisibility[]> = new Map();
// @ts-ignore

    generateEdges();


    function updateGraph() {
        nodes.remove();
        links.remove();
        // @ts-ignore
        const startVertexes = [...clickedStatus.entries()].filter(x => x[1]).map(x => x[0])
        reachable.clear();
        if (isAuto) {
            startVertexes.forEach(x => {
                autoSolving(x, 0);
            })
        } else {
            breathFirstSearch(startVertexes);
        }
        console.log(reachable);
        // @ts-ignore
        const nextNodes = [...reachable].map(x => {
            return nameToNodeMap.get(x);
        });
        console.log(nextNodes, nameToNodeMap);
        const nextLinks = edges.filter(isEdgeVisible);
        simulation.nodes(nextNodes as SimulationNodeDatum[]);
        (simulation.force("link") as d3.ForceLink<d3.SimulationNodeDatum, d3.SimulationLinkDatum<d3.SimulationNodeDatum>>)
            .links(nextLinks as SimulationLinkDatum<SimulationNodeDatum>[]);
        links = createLinks(nextLinks);
        nodes = createNodes(nextNodes);
        simulation.alpha(1).restart();
    }

    function autoSolving(vertex: string, depth: number) {
        if (irMap.get(vertex).size == 0 || reachable.has(vertex) || depth == maxDepth) {
            return;
        }
        reachable.add(vertex);
        if (!adjacencyList.has(vertex)) {
            return;
        }
        adjacencyList.get(vertex).forEach(x => {
            autoSolving(x.getTargetName(), depth + 1);
        })
    }

    function breathFirstSearch(startVertexes: string[]) {
        const dist = new Map<string, number>();
        const queue = new Queue<string>();
        startVertexes.forEach(x => {
            dist.set(x, 0);
            queue.enqueue(x);
        })
        while (queue.length !== 0) {
            const v = queue.dequeue();
            if (reachable.has(v)) {
                continue;
            }
            reachable.add(v);
            const d = dist.get(v);
            if (d + 1 >= maxDepth) {
                continue;
            }
            if (!adjacencyList.has(v)) {
                continue;
            }
            adjacencyList.get(v).forEach(x => {
                const next = x.getTargetName();
                const dNext = (dist.has(next) ? dist.get(next) : Infinity);
                if (dNext > d + 1) {
                    dist.set(next, d + 1);
                    queue.enqueue(next);
                }
            })
        }
    }

    function isEdgeVisible(e: EdgeWithVisibility): boolean {
        // @ts-ignore
        const source = e.getSourceName();
        // @ts-ignore
        const target = e.getTargetName();
        return isNodeVisible(source) && isNodeVisible(target) && e.isVisible;
    }

    function isNodeVisible(d: Node | string): boolean {
        const name = (typeof d == "string" ? d : d.name);
        return reachable.has(name);
    }

    function buildLegend() {
        const legend = svg
            .append("g")
            .attr("class", "legend")
            .attr("transform", "translate(20, 10)");

        const legendRect = legend
            .append("rect")
            .attr("x", 0)
            .attr("y", 0)
            .style("fill", "#fff")
            .style("stroke", "black")
            .style("stroke-width", 0.1);
        const legendInner = legend
            .append("g")
            .attr("class", "legend-inner")
            .attr("transform", "translate(10, 10)")
            .style("font-size", "12px")
        const legendCircle = legendInner
            .append("circle")
            .attr("r", "0.5em")
            .attr("cx", 0)
            .attr("cy", "-0.25em")
            .style("fill", "#abc")
        const CircleText = legendInner
            .append("text")
            .text("Difference between two versions")
            .attr("x", "1em")
            .attr("y", 0);
        const categoriesCircle = legendInner
            .selectAll(".cat-circle")
            .data(categories)
            .enter()
            .append("circle")
            .attr("cx", "0em")
            .attr("cy", (d, i) => `${1.25 + i * 1.5}em`)
            .attr("r", "0.5em")
            .attr("class", "cat-circle")
            .style("fill", d => colorScale(d) as string);
        const categoriesText = legendInner
            .selectAll(".cat-text")
            .data(categories)
            .enter()
            .append("text")
            .text((d, i) => i == 0 ? `Ir element with type ${d}` : `${d}`)
            .attr("x", "1em")
            .attr("y", (d, i) => `${1.5 + i * 1.5}em`)
            .attr("class", ".cat-text");

        const size = legendInner.node().getBBox();
        legendRect.attr("height", size.height + 10)
            .attr("width", size.width + 10)
    }

    function createDepthSelect() {
        const div = document.getElementById("tree-view-input");
        const input = document.createElement("input");
        const label = document.createElement("label");
        const p = document.createElement("p");
        p.textContent = "Maximum depth";
        div.appendChild(p);
        input.type = "range";
        input.min = "1";
        input.max = "20";
        input.id = "depth";
        input.name = "depth";
        input.valueAsNumber = 3;
        input.oninput = (ev) => {
            maxDepth = (ev.currentTarget as HTMLInputElement).valueAsNumber;
            label.textContent = maxDepth.toString();
            updateGraph();
        }
        div.appendChild(input);
        label.htmlFor = "depth";
        label.textContent = "3";
        div.appendChild(label);
    }

    function generateEdges() {
        adjacencyList.clear();

        function pushEdge(e: EdgeWithVisibility) {
            const list = (adjacencyList.has(e.getSourceName()) ? adjacencyList.get(e.getSourceName()) : []);
            list.push(e);
            adjacencyList.set(e.getSourceName(), list);
        }

        (edges as EdgeWithVisibility[]).forEach(e => {
            if (currentEdgeStatus === "forward" || currentEdgeStatus == "all") {
                pushEdge(e);
            }
            if (currentEdgeStatus == "backward" || currentEdgeStatus == "all") {
                pushEdge(new EdgeWithVisibility(e.getTargetName(), e.getSourceName(), e.description));
            }
        });
    }

    function createModeSelect() {
        const select = document.createElement("select");
        select.innerHTML = `
  <option value="forward">Traverse edges forward</option>
  <option value="backward">Traverse edges backward</option>
  <option value="all">Traverse edges forward and backward</option>`
        select.id = "viewMode";
        select.name = "viewMode";
        select.oninput = (ev) => {
            const x = (ev.currentTarget as HTMLSelectElement).value;
            if (x != "forward" && x != "backward" && x != "all") {
                alert("Invalid select option");
            }
            // @ts-ignore
            currentEdgeStatus = x;
            generateEdges();
            updateGraph();
        }
        document.getElementById("tree-view-select").appendChild(select);
    }

    function useAutoMod() {
        const element = document.getElementById("find-reason") as HTMLInputElement;
        if (element === null) return;
        element.oninput = () => {
            isAuto = element.checked;
            updateGraph();
        }
    }

    function getStroke(e: EdgeWithVisibility) {
        console.log(e.description);
        if (e.description === "FromRight") {
            return "#1dda5a";
        } else if (e.description === "FromLeft") {
            return "#c41515";
        } else {
            return UNFOCUSED_LINE_STROKE;
        }
    }
}
