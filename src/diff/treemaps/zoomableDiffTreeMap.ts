import * as d3 from "d3";
import {HierarchyRectangularNode} from "d3";
import {createSvg} from "../../svgGen";
import {buildTreeView, updateKeys} from "../../graph/treeView";
import {irMap1, irMap2, retainedIrMap1, retainedIrMap2} from "../commonDiffResources";
import {getId, height, width} from "../../treemaps/resources";
import {DiffTreeMapNode, findHierarchy} from "./processTreeDiff";

const STROKE_SPACE = 4

let currentMaps = [irMap1, irMap2];

const name = d => d.ancestors().reverse().map(d => d.data.name).join("/")
const format = d3.format(",d")
let x = d3.scaleLinear().rangeRound([0, width]);
let y = d3.scaleLinear().rangeRound([0, height]);
const svg = createSvg(height, width)
    .style("font", "10px sans-serif")
    .attr("viewBox", [0.5, -30.5, width, height + 30])
    .attr("transform", "translate(0, 30)")
const patterns = d3.select("svg").append("defs");
const minusGradient = patterns
    .append("pattern")
    .attr("id", "minus")
    .attr("patternUnits", "userSpaceOnUse")
    .attr("width", STROKE_SPACE + .5)
    .attr("height", STROKE_SPACE + .5)
    .attr("patternTransform", "rotate(90)")
    .style("background", "#ccc")
    .append("line")
    .attr("x1", 0)
    .attr("y1", 0.5)
    .attr("x2", 0)
    .attr("y2", STROKE_SPACE)
    .attr("stroke", `#ED1B24`)
    .attr("stroke-width", 2)
const plusGradient = patterns
    .append("pattern")
    .attr("id", "plus")
    .attr("patternUnits", "userSpaceOnUse")
    .attr("width", 20)
    .attr("height", 20)
    .attr("patternTransform", "scale(0.5) rotate(90)")
    .style("background", "#ccc")
    .append("path")
    .attr("d", "M3.25 10h13.5M10 3.25v13.5")
    .attr("stroke-linecap", "square")
    .attr("stroke-width", 0.5)
    .attr("stroke", "hsl(121,100%,50%)")

const treemap = d3
    .treemap()
    .tile(tile);
let group = null

const select = document.getElementById("viewMode") as HTMLSelectElement;
select.oninput = update;
const sizeSelect = document.getElementById("sizeMode") as HTMLSelectElement;
sizeSelect.oninput = updateSizes;
// @ts-ignore
let keys: Set<string> = new Set([...irMap1.keys(), ...irMap2.keys()]);
buildTreeView(
    new Map(
        // @ts-ignore
        [...keys].map(x => [x, 0])),
    true,
    (names: string[], state: boolean) => {
        names.forEach(name => {
            if (!state) {
                keys.delete(name);
                console.log(`${name} deleted`);
            } else {
                keys.add(name);
                console.log(`${name} added`);
            }
        });
        update();
    });
update();

function render(group: d3.Selection<SVGGElement, any, HTMLElement, any>, root: HierarchyRectangularNode<DiffTreeMapNode>) {
    const node = group
        .selectAll("g")
        .data(root.children.concat(root))
        .join("g");

    // @ts-ignore
    node.filter(d => d === root ? d.parent : d.children)
        .attr("cursor", "pointer")
        .on("click", (event, d) => d === root ? zoomout(root) : zoomin(d));

    node.append("title")
        .text(d => {
            let res = `${name(d)}\n${format(d.value)}`;
            if (d.data.plusChange > 0) {
                res += `\n++:${format(d.data.plusChange)}`;
            }
            if (d.data.minusChange > 0) {
                res += `\n--:${format(d.data.minusChange)}`;
            }
            return res;
        });

    node
        .append("rect")
        .attr("id", d => {
            // @ts-ignore
            return (d.leafUid = `leaf${getId()}`)
        })
        .attr("fill", d => {
            if (d === root) {
                return "#fff";
            }
            if (d.data.category === "diff-pos") {
                return "url(#plus)";
            }
            if (d.data.category === "regular") {
                return "#347EB4"
            }
            if (d.data.category === "diff-neg") {
                return "url(#minus)";
            }
            return "#ccc";
        })
        .attr("stroke", d => {
            if (d.data.category === "diff-pos" || d.data.category === "diff-neg") {
                return "#000";
            }
            return "#fff";
        });


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
            if (d === root) {
                return [name(d)];
            }
            let res = [d.data.name].concat(format(d.value))
            if (d.data.plusChange > 0) {
                res = res.concat(`++: ${format(d.data.plusChange)}`)
            }
            if (d.data.minusChange > 0) {
                res = res.concat(`--: ${format(d.data.minusChange)}`);
            }
            return res;
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


function getHierarchy(irMap1: Map<string, number>, irMap2: Map<string, number>, includeNotChanged: boolean) {
    // @ts-ignore
    return d3.hierarchy(findHierarchy([...keys], 0, "Kotlin IR", irMap1, irMap2, includeNotChanged))
        .sum(d => d.value)
        .sort((a, b) => b.value - a.value)
}

function update() {
    let includeNotChanged = false;
    const [irMap1, irMap2] = currentMaps;
    if (select.value === "common") {
        // @ts-ignore
        keys = new Set([...irMap1.keys(), ...irMap2.keys()]);
        includeNotChanged = true;
    } else if (select.value === "diff-pos") {
        // @ts-ignore
        keys = new Set(([...irMap2.keys()]).filter(x => {
            const irMap1Value = (irMap1.has(x) ? irMap1.get(x) : 0);
            return irMap2.get(x) > irMap1Value;
        }));
    } else {
        // @ts-ignore
        keys = new Set(([...irMap1.keys()]).filter(x => {
            const irMap2Value = (irMap2.has(x) ? irMap2.get(x) : 0);
            return irMap1.get(x) > irMap2Value;
        }));
    }
    svg.selectAll("g").remove()
    x = d3.scaleLinear().rangeRound([0, width]);
    y = d3.scaleLinear().rangeRound([0, height]);
    // @ts-ignore
    updateKeys([...keys]);
    group = svg
        .append("g")
        .call(render, treemap(getHierarchy(irMap1, irMap2, includeNotChanged)))
}

function updateSizes() {
    if (sizeSelect.value === "shallow") {
        currentMaps = [irMap1, irMap2];
    } else {
        currentMaps = [retainedIrMap1, retainedIrMap2];
    }
    update();
}