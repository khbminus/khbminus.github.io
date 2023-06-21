import {colors, createSvg} from "../../svgGen";
import * as d3 from "d3";
import {DiffTreeMapNode, findHierarchy} from "./processTreeDiff";
import {escapeHtml} from "../../processing";
import {irMap1, irMap2} from "../commonDiffResources";

const STROKE_SPACE = 4

export function buildDiffMap(irMap1: Map<string, number>, irMap2: Map<string, number>, includeNotChanged: boolean) {
    console.log(irMap1, irMap2)
    const keys = [...new Set([...irMap1.keys(), ...irMap2.keys()])];
    const height = window.innerHeight * 0.96;
    const width = window.innerWidth * 0.98;
    const svg = createSvg(height, width)
    const patterns = d3.select("svg").append("defs");

    const minusGradients = new Map([...colors.keys()].map(i => {
        const color = colors[((i - 1) % colors.length + colors.length) % colors.length];
        const id = "minus" + color.replace("#", "");
        const gradient = patterns
            .append("pattern")
            .attr("id", "minus" + color.replace("#", ""))
            .attr("patternUnits", "userSpaceOnUse")
            .attr("width", STROKE_SPACE + .5)
            .attr("height", STROKE_SPACE + .5)
            .attr("patternTransform", "rotate(90)")
            .style("background", color)
            .append("line")
            .attr("x1", 0)
            .attr("y1", 0.5)
            .attr("x2", 0)
            .attr("y2", STROKE_SPACE)
            .attr("stroke", `#ED1B24`)
            .attr("stroke-width", 2)
        return [colors[i], id]
    }));

    const plusGradients = new Map([...colors.keys()].map(i => {
        const color = colors[((i - 1) % colors.length + colors.length) % colors.length];
        const id = "plus" + color.replace("#", "");
        const gradient = patterns
            .append("pattern")
            .attr("id", "plus" + color.replace("#", ""))
            .attr("patternUnits", "userSpaceOnUse")
            .attr("width", 20)
            .attr("height", 20)
            .attr("patternTransform", "scale(0.5) rotate(90)")
            .style("background", color)
            .append("path")
            .attr("d", "M3.25 10h13.5M10 3.25v13.5")
            .attr("stroke-linecap", "square")
            .attr("stroke-width", 0.5)
            .attr("stroke", "hsl(121,100%,50%)")
        // .attr("fill", "none")
        return [colors[i], id]
    }));
    const hierarchyObj = findHierarchy(keys, 0, "Kotlin IR", irMap1, irMap2, includeNotChanged)

    const hierarchy = d3
        .hierarchy(hierarchyObj)
        .sum((d: any) => d.value)
        .sort((a, b) => b.value - a.value)
    hierarchy.children.sort((a, b) => b.value - a.value)
    const treemap = d3.treemap()
        .size([width, height])
    // .paddingInner(4)
    // .paddingRight(10)
    // .paddingInner(3);
    const root = treemap(hierarchy);
    const colorScale = (d: d3.HierarchyRectangularNode<any>) => colors[d.depth];
    const nodes = svg.selectAll("rect")
        .data(root.descendants())
        .enter()
        .append("rect")
        .attr("x", d => d.x0)
        .attr("y", d => d.y0)
        .attr("width", (d, i) => d.x1 - d.x0 - 2 * d.depth)
        .attr("height", (d, i) => d.y1 - d.y0 - 2 * d.depth)
        .attr("fill", chooseCommonColor)
        .on("mousemove", function (event, d) {
            tool.style("left", event.x + 10 + "px")
            tool.style("top", event.y - 20 + "px")
            tool.style("display", "inline-block");
            const data = d.data as DiffTreeMapNode;
            let value = d.value;
            let cat = "";
            if (data.category == "diff-pos") {
                const val2 = (irMap2.has(data.name) ? irMap2.get(data.name) : 0);
                const val1 = (irMap1.has(data.name) ? irMap1.get(data.name) : 0);
                value = val2 - val1;
                cat = " (added)"
            } else if (data.category == "diff-neg") {
                const val2 = (irMap2.has(data.name) ? irMap2.get(data.name) : 0);
                const val1 = (irMap1.has(data.name) ? irMap1.get(data.name) : 0);
                value = val1 - val2;
                cat = " (removed)"
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
        .text(d => (d.data as DiffTreeMapNode).name)
        .attr("font-size", "19px")
        .attr("fill", (d) => {
            return "#ffffff";
        })


    const tool = d3.select("body").append("div").attr("class", "toolTip");

    (document.getElementById("viewMode") as HTMLSelectElement).oninput = (ev) => {
        const value = (ev.currentTarget as HTMLSelectElement).value
        let chooseNextColorFun = null
        if (value == "common") {
            chooseNextColorFun = chooseCommonColor
        } else if (value == "diff-pos") {
            chooseNextColorFun = (d) => {
                const data = d.data as DiffTreeMapNode
                if (data.category == "diff-pos") {
                    return "#BCD32F";
                } else {
                    return "#808080";
                }
            }
        } else {
            chooseNextColorFun = (d) => {
                const data = d.data as DiffTreeMapNode
                if (data.category == "diff-neg") {
                    return "#b04046";
                } else {
                    return "#808080";
                }
            }
        }
        nodes
            .style("fill", chooseNextColorFun)
    }

    function chooseCommonColor(d): string {
        const data = d.data as DiffTreeMapNode;
        const color = colorScale(d);
        if (data.category == "regular" || data.category == "middle") {
            return color;
        }
        if (data.category == "diff-neg") {
            console.log(`url(#${minusGradients.get(color)})`)
            return `url(#${minusGradients.get(color)})`;
        }
        return `url(#${plusGradients.get(color)})`
    }
}

export function buildAdded(irMap1, irMap2) {
    const keys = new Set(([...irMap2.keys()]).filter(x => {
        const irMap1Value = (irMap1.has(x) ? irMap1.get(x) : 0);
        return irMap2.get(x) > irMap1Value;
    }));

    buildDiffMap(
        new Map(([...irMap1.entries()]).filter(x => keys.has(x[0]))),
        new Map(([...irMap2.entries()]).filter(x => keys.has(x[0]))),
        false
    )
}

export function buildDeleted(irMap1, irMap2) {
    const keys = new Set(([...irMap1.keys()]).filter(x => {
        const irMap2Value = (irMap2.has(x) ? irMap2.get(x) : 0);
        return irMap1.get(x) > irMap2Value;
    }));

    buildDiffMap(
        new Map(([...irMap1.entries()]).filter(x => keys.has(x[0]))),
        new Map(([...irMap2.entries()]).filter(x => keys.has(x[0]))),
        false
    )
}