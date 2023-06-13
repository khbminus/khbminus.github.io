import * as d3 from "d3";
import {kotlinRetainedSize} from "../retained-size";
import {escapeHtml, findHierarchy, TreeMapNode} from "../processing";
import {colors, createSvg} from "../svgGen";
import {kotlinDeclarationsSize} from "../ir-sizes";

const STROKE_SPACE = 4

const irMap = new Map(Object.entries(kotlinRetainedSize));
const irShallowMap = new Map(Object.entries(kotlinDeclarationsSize));

const keys = [...irMap.keys()];
const height = window.innerHeight * 0.985;
const width = window.innerWidth * 0.98;
const svg = createSvg(height, width)
const patterns = d3.select("svg").append("defs");
const gradients = new Map([...colors.keys()].map(i => {
    const color = colors[((i - 1) % colors.length + colors.length) % colors.length];
    const id =  color.replace("#", "");
    const gradient = patterns
        .append("pattern")
        .attr("id", color.replace("#", ""))
        .attr("patternUnits", "userSpaceOnUse")
        .attr("width", STROKE_SPACE + .5)
        .attr("height", STROKE_SPACE + .5)
        .attr("patternTransform", "rotate(45)")
        .style("background", color)
        .append("line")
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("x2", 0)
        .attr("y2", STROKE_SPACE + 0.5)
        .attr("stroke", `#${invertHex(id)}`)
        .attr("stroke-width", 3)
    return [colors[i], id]
}));

const hierarchyObj = findHierarchy(keys, 0, "Kotlin IR", irMap, irShallowMap)

const hierarchy = d3
    .hierarchy(hierarchyObj)
    .sum((d: any) => d.value)
hierarchy.children.sort((a, b) => b.value - a.value)
const treemap = d3.treemap()
    .size([width, height])
    .paddingTop(28)
    .paddingRight(10)
    .paddingInner(3);

const root = treemap(hierarchy);
const colorScale = (d: d3.HierarchyRectangularNode<any>) => colors[d.depth];
svg.selectAll("rect")
    .data(root.descendants())
    .enter()
    .append("rect")
    .attr("x", d => d.x0)
    .attr("y", d => d.y0)
    .attr("width", d => d.x1 - d.x0)
    .attr("height", d => d.y1 - d.y0)
    .attr("fill", d => {
        const data = d.data as TreeMapNode;
        const color = colorScale(d);
        if (data.category == "retained" || data.category == "middle") {
            return color;
        }
        console.log(color);
        console.log(gradients.keys(), gradients.get(color));
        return `url(#${gradients.get(color)})`;
    })
    .on("mousemove", function (event, d) {
        tool.style("left", event.x + 10 + "px")
        tool.style("top", event.y - 20 + "px")
        tool.style("display", "inline-block");
        const data = d.data as TreeMapNode;
        let value = d.value;
        let cat = "";
        if (data.category == "shallow") {
            value = irShallowMap.get(data.name);
            cat = " (Shallow size)"
        } else if (data.category == "retained") {
            value = irMap.get(data.name);
            cat = " (Retained size)"
        }
        const name = `${data.name}${cat}`
        tool.html(`${escapeHtml(name)}: ${value}`);
    })
    .on("mouseout", function (event, d) {
        tool.style("display", "none");
    })
    .style("stroke", "black")
    .style("z-index", d => d.depth)

svg
    .selectAll("titles")
    .data(root.descendants().filter(d => d.depth == 1))
    .enter()
    .filter(d => d.x1 - d.x0 > 10 && d.y1 - d.y0 > 10)
    .append("text")
    .attr("x", d => d.x0)
    .attr("y", d => d.y0 + 21)
    .text(d => (d.data as TreeMapNode).name)
    .attr("font-size", "19px")
    .attr("fill", (d) => {
        return "#ffffff";
    })


const tool = d3.select("body").append("div").attr("class", "toolTip");

function invertHex(hex) {
    return (Number(`0x1${hex}`) ^ 0xFFFFFF).toString(16).substr(1).toUpperCase()
}