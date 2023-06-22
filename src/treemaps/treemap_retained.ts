import * as d3 from "d3";
import {escapeHtml, TreeMapNode} from "../processing";
import {colors, createSvg} from "../svgGen";
import {buildTreeView} from "../graph/treeView";
import {
    buildOnTableUpdate,
    createGradients,
    height,
    irMap, irShallowMap, paintGradients,
    updateHierarchy,
    width
} from "./resources";

let rects = null
let titles = null

const STROKE_SPACE = 4


const svg = createSvg(height, width)
const patterns = d3.select("svg").append("defs");
const gradients = createGradients(patterns);

const treemap = d3.treemap()
    .size([width, height])
    .paddingInner(3);

const update = updateHierarchy(false, (x) => {
    svg.selectAll("rect").remove();
    svg.selectAll("text").remove();
    buildTreeMap(x);
});
update();
buildTreeView(irMap, true, buildOnTableUpdate(update));


function buildTreeMap(hierarchy: d3.HierarchyNode<TreeMapNode>) {
    console.log(hierarchy);
    const root = treemap(hierarchy);
    const colorScale = (d: d3.HierarchyRectangularNode<any>) => colors[d.depth];
    rects = svg.selectAll("rect")
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
            if (data.category == "retained" || data.category == "middle" || !paintGradients) {
                return color;
            }
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

    titles = svg
        .selectAll("text")
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
}

const select = document.getElementById("viewMode") as HTMLSelectElement
select.oninput = update;

