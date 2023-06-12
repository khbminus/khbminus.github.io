import * as d3 from "d3";
import {scaleLinear, SimulationNodeDatum} from "d3";
import {kotlinDeclarationsSize} from "../ir-sizes";
import {kotlinReachabilityInfos} from "../dce-graph";
import {kotlinRetainedSize} from "../retained-size";
import {deleteSelfEdges, escapeHtml, Node} from "../processing";
import {colors, createSvg} from "../svgGen";
import {setOnTableUpdate, visibilityMap} from "./treeView";


const UNFOCUSED_LINE_STROKE = "#aaa";
const FOCUSED_LINE_STROKE = "#fbe106"
const FIX_UNKNOWN_NODES = true;
const height = window.innerHeight * 0.95;
const width = window.innerWidth * 0.8;
const svg = createSvg(height, width)

const irMap = new Map(Object.entries(kotlinDeclarationsSize));
const sizeValues = [...irMap.entries()]
    .map(x => [kotlinRetainedSize[x[0]], kotlinRetainedSize[x[0]]])
    .reduce((a, b) => [Math.min(a[0], b[0]), Math.max(a[1], b[1])]);
const radiusScale = d3
    .scaleLinear()
    .domain([
        0,
        sizeValues.reduce((a, b) => Math.max(a, b))
    ])
    .range([5, 100]);

const nodeEntries: Node[] = [...irMap.entries()].map(lst => {
    const r = radiusScale(kotlinRetainedSize[lst[0]])
    const scale = scaleLinear()
        .domain([0, r])
        .range([0, r / Math.sqrt(2)]);

    return {
        "name": lst[0],
        "value": r,
        "shallowValue": scale(radiusScale(lst[1]))
    };
});
const names = new Set(nodeEntries.map(x => x.name));

type EdgeWithVisibility = {
    source: string,
    target: string,
    isVisible: boolean
}

const edges: EdgeWithVisibility[] = deleteSelfEdges(kotlinReachabilityInfos).map(x => {
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
            "value": radiusScale(0),
            "shallowValue": radiusScale(0) / Math.sqrt(2)
        })
        names.add(name);
    }
    edges.forEach(e => {
        if (!names.has(e.source)) {
            pushNewNode(e.source)
        }
        if (!names.has(e.target)) {
            pushNewNode(e.target)
        }
    });
}

const links = svg
    .selectAll("line")
    .data(edges)
    .enter()
    .append("line")
    .style("stroke", UNFOCUSED_LINE_STROKE);

const categories = [...new Set(nodeEntries.map(x => x.name.split(".")[1]))],
    colorScale = d3.scaleOrdinal() // the scale function
        .domain(categories) // the data
        .range(colors);

const forceLink = d3.forceLink()
    .id(d => {
        return (d as Node).name;
    })
    .links([...edges])

const simulation = d3.forceSimulation(nodeEntries as SimulationNodeDatum[])
    .force("link", forceLink)
    .force("charge", d3.forceManyBody().strength(-20))
    .force("center", d3.forceCenter(width / 2, height / 2))
    .force("collide", d3.forceCollide().radius(d =>
        (d as Node).value + 1.5).iterations(2))
    .on("tick", ticked);

let lastClicked = null

const nodes = svg
    .selectAll(".outer-circle")
    .data(nodeEntries)
    .join("circle")
    .style("fill", d => colorScale(d.name.split(".")[1]) as string)
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
    .on("click", changeLinksOnClick)
    .call(
        // @ts-ignore
        drag(simulation)
    );

const innerNodes = svg.selectAll(".circle-inner")
    .data(nodeEntries)
    .join("rect")
    .style("fill", d => colorScale(d.name.split(".")[1]) as string)
    .style("opacity", 0.7)
    .style("stroke", "black")
    .style("stroke-width", 0.5)
    .style("z-index", 1)
    .attr("height", (d) => {
        return 2 * d.shallowValue;
    })
    .attr("width", (d) => {
        return 2 * d.shallowValue;
    })
    .attr("class", "circle-inner")
    .on("mousemove", mousemove)
    .on("mouseout", function (event, d) {
        links.attr("stroke", UNFOCUSED_LINE_STROKE);
        tool.style("display", "none");
    })
    .on("click", changeLinksOnClick)
    // @ts-ignore
    .call(drag(simulation))

const promise = new Promise(r => setTimeout(r, 5000)).then(() => simulation.stop());

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
    innerNodes
        .attr("x", d => {
            // @ts-ignore
            return d.x - d.shallowValue;
        })
        .attr("y", d => {
            // @ts-ignore
            return d.y - d.shallowValue;
        });
}

setOnTableUpdate(() => {
    nodes
        .style("visibility", d => {
            return visibilityMap.get(d.name) ? "visible" : "hidden";
        })
    innerNodes
        .style("visibility", d => {
            return visibilityMap.get(d.name) ? "visible" : "hidden";
        })
    links
        .style("visibility", e => {
            return isEdgeVisible(e) ? "visible" : "hidden";
        });
    (simulation.force("link") as d3.ForceLink<d3.SimulationNodeDatum, d3.SimulationLinkDatum<d3.SimulationNodeDatum>>)
        .links(edges.filter(isEdgeVisible));
    simulation.nodes(
        nodeEntries.filter(d => visibilityMap.get(d.name)) as SimulationNodeDatum[]
    );
    simulation.alpha(0.1).restart();
})

const tool = d3.select("body").append("div").attr("class", "toolTip").style("z-index", 2);

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
    const radius = (d.name in kotlinRetainedSize ? kotlinRetainedSize[d.name] : 0);
    const width = (d.name in kotlinDeclarationsSize ? kotlinDeclarationsSize[d.name] : 0);
    tool.html(`Name: ${escapeHtml(d.name)}<br>Retained value (radius): ${radius}<br>Size of node (square width): ${width}`);
}

function changeLinksOnClick(event, d) {
    if (lastClicked === d.name) {
        svg.selectAll("line")
            .style("visibility", ee => {
                const e = ee as EdgeWithVisibility;
                e.isVisible = true;
                return isEdgeVisible(e) ? "visible" : "hidden";
            });
        lastClicked = null;
        (simulation.force("link") as d3.ForceLink<d3.SimulationNodeDatum, d3.SimulationLinkDatum<d3.SimulationNodeDatum>>)
            .links(edges);
        simulation.alpha(0.1).restart();
        return;
    }
    svg
        .selectAll("line")
        .style("visibility", ee => {
            const e = ee as EdgeWithVisibility;
            // @ts-ignore
            e.isVisible = e.target.name === d.name || e.source.name === d.name;
            return isEdgeVisible(e) ? "visible" : "hidden";
        });
    lastClicked = d.name;
    (simulation.force("link") as d3.ForceLink<d3.SimulationNodeDatum, d3.SimulationLinkDatum<d3.SimulationNodeDatum>>)
        .links(
            edges
                // @ts-ignore
                .filter(e => e.target.name === d.name || e.source.name === d.name)
        );

    simulation.alpha(0.1).restart();
}

function isEdgeVisible(e: EdgeWithVisibility): boolean {
    // @ts-ignore
    const source = e.source.name;
    // @ts-ignore
    const target = e.target.name;
    return visibilityMap.get(source) && visibilityMap.get(target) && e.isVisible;
}