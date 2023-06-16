import {createSvg} from "../svgGen";
import * as d3 from "d3";
import {SimulationNodeDatum} from "d3";

type Vertex = { name: string, value: number, children: Vertex[], x: number, y: number, vx: number, vy: number };
const nodes: Vertex[] = [
    {
        name: "A",
        value: 25,
        x: null,
        y: null,
        vx: 0,
        vy: 0,
        children: [
            {
                name: "B",
                x: null,
                y: null,
                vx: 0,
                vy: 0,
                value: 10,
                children: []
            },
            {
                name: "C",
                value: 5,
                x: null,
                y: null,
                vx: 0,
                vy: 0,
                children: []
            }
        ]
    },
    {
        name: "D",
        value: 40,
        x: null,
        y: null,
        vx: 0,
        vy: 0,
        children: []
    }
];

type Edge = { source: Vertex, target: Vertex }
const edges = [
    {source: "A", target: "D"},
    {source: "B", target: "C"},
    {source: "B", target: "D"}
]


let currentNodes = nodes.map(x => ({...x}))
let currentLinks = edges.map(x => ({...x})).filter(isEdgeVisible)

const height = window.innerHeight * 0.95;
const width = window.innerWidth * 0.98;
const svg = createSvg(height, width)

const simulation = d3
    .forceSimulation(currentNodes as SimulationNodeDatum[])
    .force("charge", d3.forceManyBody())
    .force("x", d3.forceX())
    .force("y", d3.forceY())
    .force("center", d3.forceCenter(width / 2, height / 2).strength(0.1))
    .force("collide", d3
        .forceCollide()
        .radius(d => (d as Vertex).value)
        .iterations(2))
    .force("link", d3.forceLink().links(currentLinks).id(d => (d as Vertex).name))
    .on("tick", ticked);

let links = svg
    .selectAll("link")
    .data(currentLinks).enter()
    .append("line")
    .style("stroke", "#aaa");

let circles = svg
    .selectAll("circle")
    .data(currentNodes)
    .join("circle")
    .style("fill", "white")
    .style("stroke", "black")
    .style("stroke-width", 0.5)
    .attr("r", d => d.value)
    // @ts-ignore
    .call(drag(simulation))
    .on("click", onclick)


const promise = new Promise(r => setTimeout(r, 5000)).then(() => simulation.stop());

function drag(simulation) {
    function dragstarted(event) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
    }

    function dragged(event) {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
    }

    function dragended(event) {
        if (!event.active) simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
    }

    return d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended);
}

function ticked() {
    circles
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
    console.log(currentLinks)
}

function onclick(event, d: Vertex) {
    console.log("clicked")
    circles.remove()
    // @ts-ignore
    links.remove()
    const newNodes = currentNodes.filter(x => x.name !== d.name)
    const copiedChildren = d.children.map(x => ({...x}))
    copiedChildren.forEach(x => {
        x.x = d.x;
        x.y = d.y;
    })
    const childrenNames = d.children.map(x => x.name)

    newNodes.push(...copiedChildren);
    currentNodes = newNodes;
    const newLinks = edges.filter(isEdgeVisible).map(x => ({...x}))
    links = svg
        .selectAll("link")
        .data(newLinks).enter()
        .append("line")
        .style("stroke", "#aaa")
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
    currentLinks = newLinks;
    circles = svg
        .selectAll("circle")
        .data(newNodes)
        .join("circle")
        .style("fill", "white")
        .style("stroke", "black")
        .style("stroke-width", 0.5)
        .attr("r", d => d.value)
        .attr("cx", dd => dd.x)
        .attr("cy", dd => dd.y)
        .on("click", onclick)
        // @ts-ignore
        .call(drag(simulation))
    simulation.nodes(newNodes as SimulationNodeDatum[]);
    (simulation.force("link") as d3.ForceLink<d3.SimulationNodeDatum, d3.SimulationLinkDatum<d3.SimulationNodeDatum>>).links(newLinks)

    simulation.alpha(1).restart();
}

function isEdgeVisible(e: Edge | {source: string, target: string}): boolean {
    const sourceName = (isEdge(e) ? e.source.name : e.source);
    const targetName = (isEdge(e) ? e.source.name : e.target);
    return currentNodes.filter(x => x.name === sourceName).length > 0 &&
        currentNodes.filter(x => x.name === targetName).length > 0
}

function isEdge(e: Edge | {source: string, target: string}): e is Edge {
    return typeof e.source !== "string"
}