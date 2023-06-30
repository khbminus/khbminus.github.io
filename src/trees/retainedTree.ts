import {TreeNode, TreeType} from "./dataProcessing";
import * as d3 from "d3";
import {buildTreeView} from "../graph/treeView";
import {colors} from "../svgGen";


export function build(hierarchy: d3.HierarchyNode<TreeNode>) {

    buildTreeView(
        new Map(hierarchy.descendants().map(node => [node.data.name, node.data.size])),
        false,
        updateVisible
    );

    const width = window.innerWidth
    let nodes: Map<string, TreeNode> = null;

    const dx = 25
    const dy = 180
    const tree = d3.tree().nodeSize([dx, dy]);
    const visited = new Set<string>()

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
        // .scaleExtent([1, 10])
        .on("zoom", zoomed);

    svg.call(zoom);

    const buildLink = d3.linkHorizontal()
        // @ts-ignore
        .x(d => d.y)
        // @ts-ignore
        .y(d => d.x)

    let height = 0;

    function update(event: Event, source: d3.HierarchyNode<TreeNode>) {
        const nodes: d3.HierarchyNode<TreeNode>[] = hierarchy.descendants().reverse();
        const links: d3.HierarchyLink<TreeNode>[] = hierarchy.links();

        tree(hierarchy);

        let left = hierarchy;
        let right = hierarchy;
        hierarchy.eachBefore(node => {
            // @ts-ignore
            if (node.x < left.x) left = node;
            // @ts-ignore
            if (node.x > right.x) right = node;
        });

        // @ts-ignore
        height = right.x - left.x + 10;

        const transition = svg.transition()
            .duration(250)
            // @ts-ignore
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
                return colors[type];
            })
            .attr("r", 5)

        nodeEnter
            .append("text")
            .attr("dy", "0.31em")
            .attr("x", d => d.data.children.length > 0 ? -6 : 6)
            .attr("text-anchor", d => d.data.children.length > 0 ? "end" : "start")
            .text(d => d.data.name)
            .clone(true).lower()
            .attr("stroke-linejoin", "round")
            .attr("stroke-width", 3)
            .attr("stroke", "white")

        nodeEnter
            .append("title")
            .text(d => {
                let type = "mixed";
                switch (d.data.type) {
                    case TreeType.Field:
                        type = "Field";
                        break;
                    case TreeType.AnonymousInitializer:
                        type = "Anonymous initializer";
                        break;
                    case TreeType.Class:
                        type = "Class";
                        break;
                    case TreeType.Property:
                        type = "Property";
                        break;
                    case TreeType.Function:
                        type = "Function";
                        break;
                    case TreeType.Unknown:
                        type = "Unknown";
                        break;
                }
                return `${d.data.name}\n${type}\nΔ: ${d.data.size}`;
            });

        node.merge(nodeEnter)
            .attr("opacity", d => visited.has(d.data.name) || visited.size == 0 ? 1 : 0.4);


        const nodeUpdate = node.merge(nodeEnter).transition(transition)
            // @ts-ignore
            .attr("transform", d => `translate(${d.y},${d.x})`)
            .attr("fill-opacity", 1)
            .attr("stroke-opacity", 1);

        // Transition exiting nodes to the parent's new position.
        const nodeExit = node.exit().transition(transition).remove()
            // @ts-ignore
            .attr("transform", d => `translate(${source.y},${source.x})`)
            .attr("fill-opacity", 0)
            .attr("stroke-opacity", 0);

        const link = gLink
            .selectAll("path")
            .data(links, (d: d3.HierarchyLink<TreeNode>) => d.target.id);

        const linkEnter = link.enter().append("path")
            // @ts-ignore
            .attr("d", d => {
                // @ts-ignore
                const o = {x: source.x0, y: source.y0};
                // @ts-ignore
                return buildLink({source: o, target: o});
            })
            .attr("stroke", d => {
                return "#545454";
            });

        link.merge(linkEnter)
            .attr("opacity", d =>
                (visited.has(d.source.data.name) && visited.has(d.target.data.name)) || visited.size == 0 ? 0.6 : 0.1);

        link.merge(linkEnter).transition(transition)
            // @ts-ignore
            .attr("d", buildLink);
        link.exit().transition(transition).remove()
            .attr("d", d => {
                // @ts-ignore
                const o = {x: source.x, y: source.y};
                // @ts-ignore
                return buildLink({source: o, target: o});
            });

        hierarchy.eachBefore(d => {
            // @ts-ignore
            d.x0 = d.x;
            // @ts-ignore
            d.y0 = d.y;
        });
    }

    function zoomed({transform}) {
        globalG.attr("transform", transform);
    }


    function reset() {
        svg.transition().duration(750).call(
            zoom.transform,
            d3.zoomIdentity,
            d3.zoomTransform(svg.node()).invert([0, 0])
        );
    }

    (document.getElementById("reset-button") as HTMLButtonElement).onclick = reset;

    let currentAdded = new Set<string>();

    function updateVisible(names: string[], value: boolean) {
        visited.clear();
        if (value) {
            names.forEach(x => currentAdded.add(x));
        } else {
            names.forEach(x => currentAdded.delete(x));
        }
        currentAdded.forEach(x => {
            if (visited.has(x))
                return;
            if (!visited.has(x)) visitSubtree(nodes.get(x));
            if (!visited.has(x)) {
                return;
            }
            let node = nodes.get(x).node;

            node.children = nodes.get(x)._children;
            while (node !== hierarchy) {
                if (node.parent.children == null) {
                    node.parent.children = [node];
                } else if (!node.parent.children.includes(node)) {
                    node.parent.children.push(node);
                }
                node = node.parent;
            }
        });
        update(null, hierarchy);
        if (!value) return;
        const point = nodes.get(names[names.length - 1]).node;
        svg.transition().duration(750).call(
            zoom.translateTo,
            // @ts-ignore
            point.y,
            // @ts-ignore
            point.x
        );
    }

    function visitSubtree(node: TreeNode) {
        if (node.size == 0) {
            return;
        }
        visited.add(node.name);
        node.children.forEach(visitSubtree);
    }
}