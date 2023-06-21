import * as d3 from "d3";
import {SimulationNodeDatum} from "d3";

import {deleteSelfEdges, escapeHtml, IrSizeNode} from "../../processing";
import {createSvg} from "../../svgGen";
import {diffDeclarationsSizes, diffMetaNodesInfo, diffReachibilityInfos} from "../commonDiffResources";


const allMetaNodes = new Set(diffMetaNodesInfo.metaNodesList);
console.log(allMetaNodes);
// @ts-ignore
const metaNodeData: Map<string, string> = new Map([...Object.entries(diffMetaNodesInfo.parent)]);
const visibleVertex: Set<string> = new Set();

function isMetaNode(v: string): boolean {
    return allMetaNodes.has(v);
}

const metaNodesChildren: Map<string, string[]> = new Map();

allMetaNodes.forEach(x => metaNodesChildren.set(x, []));

([...metaNodeData.entries()]).forEach(x => {
    const name = x[0]
    const metaNode = x[1];
    metaNodesChildren.get(metaNode).push(name);
})

const UNFOCUSED_LINE_STROKE = "#aaa";
const FOCUSED_LINE_STROKE = "#fbe106"
const FIX_UNKNOWN_NODES = true;
const height = window.innerHeight * 0.95;
const width = window.innerWidth * 0.8;
const svg = createSvg(height, width)
export type Node = { name: string, value: number };

// @ts-ignore
const irMap: Map<string, IrSizeNode> = new Map(Object.entries(diffDeclarationsSizes));
const sizeValues = [...irMap.entries()]
    .map(x => [x[1].size, x[1].size])
    .reduce((a, b) => [Math.min(a[0], b[0]), Math.max(a[1], b[1])]);

const radiusScale = d3
    .scaleLinear()
    .domain([
        0,
        sizeValues.reduce((a, b) => Math.max(a, b))
    ])
    .range([5, 100]);

const nodeEntries: Node[] = [...irMap.entries()].map(lst => {
    const r = radiusScale(Math.abs(lst[1].size))

    return {
        "name": lst[0],
        "value": r
    };
});

const names = new Set(nodeEntries.map(x => x.name));

type EdgeWithVisibility = {
    source: string,
    target: string,
    isVisible: boolean
}

// @ts-ignore
const edges: EdgeWithVisibility[] = deleteSelfEdges(diffReachibilityInfos).map(x => {
    return {
        "source": x.source,
        "target": x.target,
        "isVisible": true
    }
});

if (FIX_UNKNOWN_NODES) {

    const pushNewNode = (name) => {
        nodeEntries.push({
            "name": name,
            "value": radiusScale(0)
        })
        names.add(name);
        irMap.set(name, {size: 0, type: "unknown"});
    }
    edges.forEach(e => {
        if (!names.has(e.source)) {
            console.log(e.source);
            pushNewNode(e.source)
        }
        if (!names.has(e.target)) {
            console.log(e.target);
            pushNewNode(e.target)
        }
    });
}
const oldEdges = edges.map(x => ({...x}))
const newAdjList: Map<string, Set<string>> = new Map();
oldEdges.forEach(e => {
    const src = e.source
    const trg = e.target
    if (isMetaNode(src)) {
        return
    }
    const arr = (newAdjList.has(src) ? newAdjList.get(src) : new Set<string>());
    arr.add(metaNodeData.get(trg))
    newAdjList.set(src, arr);
});
([...newAdjList.entries()]).forEach(x => {
    const src = x[0];
    x[1].forEach(trg => {
        edges.push({
            source: src,
            target: trg,
            isVisible: true
        })
    })
})
const nameToNodeMap = new Map(nodeEntries.map(x => [x.name, x]))

const categories = ["function", "property", "field", "anonymousInitializer",
        "class", "unknown", "left", "right", "both"],
    colorScale = d3.scaleOrdinal() // the scale function
        .domain(categories)
        .range(['#e06ec1', '#9E999D', '#824e6c', '#347EB4', '#08ACB6', '#91BB91',
            "#d3d3d3", "#2F4F4F", "#808080"]);

buildLegend();
nodeEntries.forEach(x => {
    if (isMetaNode(x.name)) {
        visibleVertex.add(x.name)
    }
})

let links = svg
    .selectAll("line")
    .data(edges.filter(e => isMetaNode(e.source) && isMetaNode(e.target)))
    .enter()
    .append("line")
    .style("stroke", UNFOCUSED_LINE_STROKE);

const forceLink = d3.forceLink()
    .id(d => {
        return (d as Node).name;
    })
    .links(edges.filter(e => isMetaNode(e.source) && isMetaNode(e.target)))

const simulation = d3.forceSimulation(nodeEntries.filter(isNodeVisible) as SimulationNodeDatum[])
    .force("link", forceLink)
    .force("charge", d3.forceManyBody().strength(-20))
    .force("center", d3.forceCenter(width / 2, height / 2))
    .force("x", d3.forceX())
    .force("y", d3.forceY())
    .force("collide", d3.forceCollide().radius(d =>
        (d as Node).value + 1.5).iterations(2))
    .on("tick", ticked);

let nodes = createNodes(nodeEntries.filter(x => visibleVertex.has(x.name)))
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
                return UNFOCUSED_LINE_STROKE;
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
    console.log(d);
    const radius = (d.name in diffDeclarationsSizes ? diffDeclarationsSizes[d.name].size : 0);
    tool.html(`Name: ${escapeHtml(d.name)}<br>Shallow value (radius): ${radius}`);
}

function isEdgeVisible(e: EdgeWithVisibility): boolean {
    // @ts-ignore
    const source = (e.source.name !== undefined ? e.source.name : e.source);
    // @ts-ignore
    const target = (e.target.name !== undefined ? e.target.name : e.target);
    return isNodeVisible(source) && isNodeVisible(target) && e.isVisible;
}

function isNodeVisible(d: Node | string): boolean {
    const name = (typeof d == "string" ? d : d.name);
    return /*reachableFromLastClickedNode.has(name) &&*/ visibleVertex.has(name);
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
        .text(d => `Ir element with type ${d}`)
        .attr("x", "1em")
        .attr("y", (d, i) => `${1.5 + i * 1.5}em`)
        .attr("class", ".cat-text");

    const size = legendInner.node().getBBox();
    legendRect.attr("height", size.height + 10)
        .attr("width", size.width + 10)
}

function splitNodeOnClick(ev, d) {
    if (!metaNodesChildren.has(d.name)) {
        return;
    }
    nodes.remove();
    links.remove();
    visibleVertex.delete(d.name);

    metaNodesChildren.get(d.name).forEach(x => {
        const node = nameToNodeMap.get(x);
        console.log(x, node);
        // @ts-ignore
        node.x = d.x;
        // @ts-ignore
        node.y = d.y;
        visibleVertex.add(x);
    });
    const nextEdges = edges.filter(e => isEdgeVisible(e))
    const nextNodes = nodeEntries.filter(isNodeVisible);
    simulation.nodes(nextNodes as SimulationNodeDatum[]);
    (simulation.force("link") as d3.ForceLink<d3.SimulationNodeDatum, d3.SimulationLinkDatum<d3.SimulationNodeDatum>>).links(nextEdges)
    links = svg
        .selectAll("link")
        .data(nextEdges).enter()
        .append("line")
        .style("stroke", "#aaa")
    nodes = createNodes(nextNodes);
    ticked();


    simulation.alpha(0.1).restart();
}

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
            links.attr("stroke", UNFOCUSED_LINE_STROKE);
            tool.style("display", "none");
        })
        .on("click", splitNodeOnClick)
        .call(
            // @ts-ignore
            drag(simulation)
        );
}
