import {hierarchyWithChanged, hierarchyWithoutChanged, TreeNode, TreeType} from "./dataProcessing";
import * as d3 from "d3";
import {buildTreeView} from "../../graph/treeView";
import {retainedDiffDeclarationsSizes} from "../commonDiffResources";

buildTreeView(
    new Map(Object.entries(retainedDiffDeclarationsSizes).map(([key, value]) => [key, value.size])),
    false,
    () => {
    }
);

const width = window.innerWidth

let hierarchy = null;
let availableHierarchies = {0: hierarchyWithoutChanged, 1: hierarchyWithChanged}

const dx = 25
const dy = 180
const tree = d3.tree().nodeSize([dx, dy]);

const svg = d3.select("body")
    .append("svg")
    .attr("viewBox", [-70, -10, width, dx])
    .attr("width", width)
    .attr("height", window.innerHeight)
    .attr("style", "max-width: 100%; height: auto; font: 8px sans-serif")

const globalG = svg.append("g")
// .attr("transform", `translate(${dy / 3}, ${-x0 + dx / 2})`)
const gLink = globalG
    .append("g")
    .attr("fill", "none")
    .attr("stroke", "#555")
    .attr("stroke-opacity", 0.4)
    .attr("stroke-width", 1.5)

const gNode = globalG
    .append("g")
    .attr("stroke-linejoin", "round")
    .attr("stroke-width", 3)

const zoom = d3
    .zoom()
    .scaleExtent([1, 10])
    .on("zoom", zoomed);

svg.call(zoom);

const buildLink = d3.linkHorizontal()
    // @ts-ignore
    .x(d => d.y)
    // @ts-ignore
    .y(d => d.x)

let height = 0;

function update(event: Event, source: d3.HierarchyNode<TreeNode>) {
    const nodes = hierarchy.descendants().reverse();
    const links = hierarchy.links();

    tree(hierarchy);

    let left = hierarchy;
    let right = hierarchy;
    hierarchy.eachBefore(node => {
        if (node.x < left.x) left = node;
        if (node.x > right.x) right = node;
    });

    height = right.x - left.x + 10;

    const transition = svg.transition()
        .duration(250)
        .attr("viewBox", [-70, left.x - 5, width, height])
        .tween("resize", window.ResizeObserver ? null : () => () => svg.dispatch("toggle"));

    const node = gNode.selectAll("g")
        .data(nodes, (d: d3.HierarchyNode<TreeNode>) => d.id);

    const nodeEnter = node.enter()
        .append("g")
        // .attr("transform", d => `translate(${d.y},${d.x})`)
        .attr("fill-opacity", 0)
        .attr("stroke-opacity", 0)
        .on("click", (event, d) => {
            d.children = d.children ? null : d.data._children;
            update(event, d);
        });

    nodeEnter
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

    nodeEnter
        .append("text")
        .attr("dy", "0.31em")
        .attr("x", d => d.data.children.length > 0 ? -6 : 6)
        .attr("text-anchor", d => d.data.children.length > 0 ? "end" : "start")
        .text(d => d.data.name)
        .clone(true).lower()
        .attr("stroke-linejoin", "round")
        .attr("stroke-width", 3)
        .attr("stroke", "white");

    nodeEnter
        .append("title")
        .text(d => {
            let type = "mixed";
            switch (d.data.type) {
                case TreeType.NotChanged:
                    type = "Not changed";
                    break;
                case TreeType.Mixed:
                    type = "Mixed";
                    break;
                case TreeType.Removed:
                    type = "Removed";
                    break;
                case TreeType.Added:
                    type = "Added";
                    break;
            }
            return `${d.data.name}\n${type}\nΔ: ${d.data.size}`;
        });

    const nodeUpdate = node.merge(nodeEnter).transition(transition)
        .attr("transform", d => `translate(${d.y},${d.x})`)
        .attr("fill-opacity", 1)
        .attr("stroke-opacity", 1);

    // Transition exiting nodes to the parent's new position.
    const nodeExit = node.exit().transition(transition).remove()
        .attr("transform", d => `translate(${source.y},${source.x})`)
        .attr("fill-opacity", 0)
        .attr("stroke-opacity", 0);

    const link = gLink
        .selectAll("path")
        .data(links, (d: d3.HierarchyLink<TreeNode>) => d.target.id);

    const linkEnter = link.enter().append("path")
        // @ts-ignore
        .attr("d", d => {
            const o = {x: source.x0, y: source.y0};
            return buildLink({source: o, target: o});
        });

    link.merge(linkEnter).transition(transition)
        .attr("d", buildLink);
    link.exit().transition(transition).remove()
        .attr("d", d => {
            const o = {x: source.x, y: source.y};
            return buildLink({source: o, target: o});
        });

    hierarchy.eachBefore(d => {
        d.x0 = d.x;
        d.y0 = d.y;
    });
}

function zoomed({transform}) {
    globalG.attr("transform", transform);
}

function selectHierarchy() {
    const element = document.getElementById("show-not-changed") as HTMLInputElement;

    hierarchy = availableHierarchies[Number(element.checked)];
    hierarchy.x0 = dy / 2;
    hierarchy.y0 = 0;
    hierarchy.sort((a, b) => d3.ascending(a.data.name, b.data.name));
    hierarchy.descendants().forEach((d, i) => {
        // if (d.data.collapsed || d.data.children.filter(x => x.type != TreeType.NotChanged).length === 0) {
        if (d.data.children.length > 4)
            d.children = null;
        // }
    });
    update(null, hierarchy);
}
(document.getElementById("show-not-changed") as HTMLInputElement).onclick = selectHierarchy;
selectHierarchy();

function reset() {
    svg.transition().duration(750).call(
        zoom.transform,
        d3.zoomIdentity,
        d3.zoomTransform(svg.node()).invert([0, 0])
    );
}
(document.getElementById("reset-button") as HTMLButtonElement).onclick = reset;

