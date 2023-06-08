import * as d3 from "d3";
import {kotlinRetainedSize} from "../retained-size";
import {escapeHtml, findHierarchy} from "../processing";
import {colors, height, svg, width} from "../svgGen";

type Node = { name: string, value: number }

const irMap = new Map(Object.entries(kotlinRetainedSize));
const keys = [...irMap.keys()];

const hierarchyObj = findHierarchy(keys, 0, "Kotlin IR", irMap)

const hierarchy = d3
    .hierarchy(hierarchyObj)
    .sum((d: any) => d.value)
console.log(hierarchyObj)
console.log(hierarchy)
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
    .attr("fill", d => colorScale(d))
    .on("mousemove", function (event, d) {
        tool.style("left", event.x + 10 + "px")
        tool.style("top", event.y - 20 + "px")
        tool.style("display", "inline-block");
        tool.html(`${escapeHtml((d.data as Node).name)}: ${(d.data as Node).value}`);
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
    .text(d => (d.data as Node).name)
    .attr("font-size", "19px")
    .attr("fill", (d) => {
        return "#ffffff";
    })


const tool = d3.select("body").append("div").attr("class", "toolTip");
