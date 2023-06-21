import * as d3 from "d3";
import {HierarchyRectangularNode} from "d3";
import {createSvg} from "../svgGen";
import {getId, height, irMap, irShallowMap, keys, width} from "./resources";
import {buildTreeView} from "../graph/treeView";
import {escapeHtml, findHierarchy, TreeMapCategory, TreeMapNode} from "../processing";

const STROKE_SPACE = 4
const name = d => d.ancestors().reverse().map(d => d.data.name).join("/")
const format = d3.format(",d")
const x = d3.scaleLinear().rangeRound([0, width]);
const y = d3.scaleLinear().rangeRound([0, height]);
const svg = createSvg(height, width)
    .style("font", "10px sans-serif")
    .attr("viewBox", [0.5, -30.5, width, height + 30])
    .attr("transform", "translate(0, 30)")
const treemap = d3
    .treemap()
    // .size([width, height - 60])
    .tile(tile)
buildTreeView(irMap, true, () => {
});

const data = getHierarchy(irMap, irShallowMap, "retained");
const hierarchy = d3
    .hierarchy(data)
    .sum((d: any) => d.value)
hierarchy.children.sort((a, b) => b.value - a.value)

const root = treemap(hierarchy);

let group = svg
    .append("g")
    .call(render, root);

function render(group: d3.Selection<SVGGElement, any, HTMLElement, any>, root: HierarchyRectangularNode<TreeMapNode>) {
    console.log(root);
    const node = group
        .selectAll("g")
        .data(root.children.concat(root))
        .join("g");

    node.filter(d => d === root ? d.parent : d.children)
        .attr("cursor", "pointer")
        .on("click", (event, d) => d === root ? zoomout(root) : zoomin(d));

    node.append("title")
        .text(d => `${name(d)}\n${format(d.value)}`);

    node
        .append("rect")
        .attr("id", d => {
            // @ts-ignore
            return (d.leafUid = `leaf${getId()}`)
        })
        .attr("fill", d => d === root ? "#fff" : d.children ? "#ccc" : "#ddd")
        .attr("stroke", "#fff");


    node.append("clipPath")
        .attr("id", d => {
            // @ts-ignore
            return (d.clipUid = `clip${getId()}`)
        })
        .append("use")
        // @ts-ignore
        .attr("xlink:href", d => `#${d.leafUid}`);
    node.append("text")
        // @ts-ignore
        .attr("clip-path", d => `url(#${d.clipUid})`)
        .attr("font-weight", d => d === root ? "bold" : null)
        .selectAll("tspan")
        .data(d => {
            const x = (d === root ? name(d) : d.data.name);
            return [x].concat(format(d.value))
        })
        .join("tspan")
        .attr("x", 3)
        // @ts-ignore
        .attr("y", (d, i, nodes) => `${(i === (nodes.length - 1)) * 0.3 + 1.1 + i * 0.9}em`)
        .attr("fill-opacity", (d, i, nodes) => i === nodes.length - 1 ? 0.7 : null)
        .attr("font-weight", (d, i, nodes) => i === nodes.length - 1 ? "normal" : null)
        // @ts-ignore
        .text(d => d);
    group.call(position, root);
}

function position(group, root) {
    group.selectAll("g")
        .attr("transform", d => {
            return d === root ? `translate(0,-30)` : `translate(${x(d.x0)},${y(d.y0)})`
        })
        .select("rect")
        .attr("width", d => d === root ? width : x(d.x1) - x(d.x0))
        .attr("height", d => d === root ? 30 : y(d.y1) - y(d.y0));
}

// When zooming in, draw the new nodes on top, and fade them in.
function zoomin(d) {
    const group0 = group.attr("pointer-events", "none");
    const group1 = group = svg.append("g").call(render, d);

    x.domain([d.x0, d.x1]);
    y.domain([d.y0, d.y1]);

    // @ts-ignore
    svg.transition()
        .duration(750)
        .call(t => group0.transition(t).remove()
            .call(position, d.parent))
        // @ts-ignore
        .call(t => group1.transition(t)
            .attrTween("opacity", () => d3.interpolate(0, 1))
            .call(position, d));
}

// When zooming out, draw the old nodes on top, and fade them out.
function zoomout(d) {
    const group0 = group.attr("pointer-events", "none");
    const group1 = group = svg.insert("g", "*").call(render, d.parent);

    x.domain([d.parent.x0, d.parent.x1]);
    y.domain([d.parent.y0, d.parent.y1]);

    svg.transition()
        .duration(750)
        // @ts-ignore
        .call(t => group0.transition(t).remove()
            .attrTween("opacity", () => d3.interpolate(1, 0))
            .call(position, d))
        .call(t => group1.transition(t)
            .call(position, d.parent));
}

function tile(node, x0, y0, x1, y1) {
    d3.treemapBinary(node, 0, 0, width, height);
    for (const child of node.children) {
        child.x0 = x0 + child.x0 / width * (x1 - x0);
        child.x1 = x0 + child.x1 / width * (x1 - x0);
        child.y0 = y0 + child.y0 / height * (y1 - y0);
        child.y1 = y0 + child.y1 / height * (y1 - y0);
    }
}

function getHierarchy(irMap: Map<string, number>, irMap2: Map<string, number>, topCategory: TreeMapCategory) {
    // @ts-ignore
    const data = findHierarchy([...keys], 0, "Kotlin IR", irMap, irMap2, topCategory);
    return data;
}



