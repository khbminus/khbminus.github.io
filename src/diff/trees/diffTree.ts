import {createSvg} from "../../svgGen";
import {hierarchy, TreeType} from "./dataProcessing";
import * as d3 from "d3";

const width = window.innerWidth

const dx = 25
const dy = width / (hierarchy.height + 1)
const tree = d3.tree().nodeSize([dx, dy]);
hierarchy.sort((a, b) => d3.ascending(a.data.name, b.data.name));
hierarchy.each(d => {
    // @ts-ignore
    d.data = d.data.target;
    if (d.data.collapsed) {
        d.children = null;
    }
})
tree(hierarchy);

let x0 = Infinity;
let x1 = -x0;
hierarchy.each(d => {
    // @ts-ignore
    if (d.x > x1) x1 = d.x;
    // @ts-ignore
    if (d.x < x0) x0 = d.x;
});

const height = x1 - x0 + dx * 2;

const svg = createSvg(height, width)
    .attr("viewBox", [-dy / 3, x0 - dx, width, height])
    .attr("style", "max-width: 100%; height: auto; font: 10px sans-serif")
    .attr("transform", `translate(${dy / 3}, ${-x0 + dx / 2})`)

const link = svg
    .append("g")
    .attr("fill", "none")
    .attr("stroke", "#555")
    .attr("stroke-opacity", 0.4)
    .attr("stroke-width", 1.5)
    .selectAll()
    .data(hierarchy.links())
    .join("path")
    // @ts-ignore
    .attr("d", d3.linkHorizontal()
        .x(d => d.y)
        .y(d => d.x));

const node = svg
    .append("g")
    .attr("stroke-linejoin", "round")
    .attr("stroke-width", 3)
    .selectAll()
    .data(hierarchy.descendants())
    .join("g")
    // @ts-ignore
    .attr("transform", d => `translate(${d.y}, ${d.x})`);

node
    .append("circle")
    .attr("fill", d => {
        const type = d.data.type;
        switch (type) {
            case TreeType.Added:
                return "#57ab5a";
            case TreeType.Removed:
                return "#e5534b";
            case TreeType.Mixed:
                return "#36728d";
            case TreeType.NotChanged:
                return "#777";
        }
    })
    .attr("r", 5);

node
    .append("text")
    .attr("dy", "0.31em")
    .attr("x", d => d.children ? -6 : 6)
    .attr("text-anchor", d => d.children ? "end" : "start")
    .text(d => {
        console.log(d)
        return d.data.name;
    })
    .clone(true).lower()
    .attr("stroke", "white");

