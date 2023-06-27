import * as d3 from "d3";
import {scaleLinear, SimulationNodeDatum} from "d3";
import {deleteSelfEdges, escapeHtml, IrSizeNode, Node} from "../processing";
import {colors, createSvg} from "../svgGen";
import {buildTreeView} from "./treeView";


const UNFOCUSED_LINE_STROKE = "#aaa";
const FOCUSED_LINE_STROKE = "#fbe106"
const FIX_UNKNOWN_NODES = true;

export function draw(kotlinDeclarationsSize, kotlinReachabilityInfos, kotlinRetainedSize) {

    const height = window.innerHeight * 0.95;
    const width = window.innerWidth * 0.8;
    const svg = createSvg(height, width)

// @ts-ignore
    const irMap: Map<string, IrSizeNode> = new Map(Object.entries(kotlinDeclarationsSize));
    const sizeValues = [...irMap.entries()]
        .map(x => [kotlinRetainedSize[x[0]].size, kotlinRetainedSize[x[0]].size])
        .reduce((a, b) => [Math.min(a[0], b[0]), Math.max(a[1], b[1])]);
    const radiusScale = d3
        .scaleLinear()
        .domain(sizeValues)
        .range([5, 100]);

    const nodeEntries: Node[] = [...irMap.entries()].map(lst => {
        // console.log(kotlinRetainedSize[lst[0]], radiusScale(kotlinRetainedSize[lst[0]]), radiusScale.domain())
        // console.log(lst[1])
        const r = radiusScale(kotlinRetainedSize[lst[0]].size)
        const scale = scaleLinear()
            .domain([0, r])
            .range([0, r / Math.sqrt(2)]);

        return {
            "name": lst[0],
            "value": r,
            "shallowValue": scale(radiusScale(lst[1].size))
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
            irMap.set(name, {size: 0, type: "unknown"});
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
    console.log("fixed");

    const categories = ["function", "property", "field", "anonymousInitializer", "class", "unknown"],
        colorScale = d3.scaleOrdinal() // the scale function
            .domain(categories) // the data
            .range(colors);

    buildLegend();


    const links = svg
        .selectAll("line")
        .data(edges)
        .enter()
        .append("line")
        .style("stroke", UNFOCUSED_LINE_STROKE);

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

    const nodes = svg
        .selectAll(".outer-circle")
        .data(nodeEntries)
        .join("circle")
        .style("fill", d => colorScale(irMap.get(d.name).type) as string)
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
        .style("fill", d => colorScale(irMap.get(d.name).type) as string)
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
    const tool = d3.select("body").append("div").attr("class", "toolTip").style("z-index", 2);

    const visibilityMap = buildTreeView(
        new Map([...irMap.entries()].map(x => [x[0], x[1].size])),
        true,
        () => {
            nodes
                .style("visibility", d => {
                    return isNodeVisible(d) ? "visible" : "hidden";
                })
            innerNodes
                .style("visibility", d => {
                    return isNodeVisible(d) ? "visible" : "hidden";
                })
            links
                .style("visibility", e => {
                    return isEdgeVisible(e) ? "visible" : "hidden";
                });
            (simulation.force("link") as d3.ForceLink<d3.SimulationNodeDatum, d3.SimulationLinkDatum<d3.SimulationNodeDatum>>)
                .links(edges.filter(isEdgeVisible));
            simulation.nodes(
                nodeEntries.filter(d => isNodeVisible(d)) as SimulationNodeDatum[]
            );
            simulation.alpha(0.1).restart();
        })

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
        const width = (d.name in kotlinDeclarationsSize ? kotlinDeclarationsSize[d.name].size : 0);
        tool.html(`Name: ${escapeHtml(d.name)}<br>Retained value (radius): ${radius}<br>Size of node (square width): ${width}`);
    }

    let lastClicked = null;
    const reachableFromLastClickedNode = new Set([...nodeEntries.map(x => x.name)]);
    type NewEdge = {
        source: { name: string },
        target: { name: string },
        isVisible: boolean
    }
    const adjacencyList: Map<string, NewEdge[]> = new Map();
// @ts-ignore
    (edges as NewEdge[]).forEach(e => {
        const list = (adjacencyList.has(e.source.name) ? adjacencyList.get(e.source.name) : []);
        list.push(e);
        adjacencyList.set(e.source.name, list);
    });


    function changeLinksOnClick(event, d) {
        if (lastClicked === d.name) {
            nodeEntries.forEach(x => reachableFromLastClickedNode.add(x.name));
            svg.selectAll("line")
                .style("visibility", ee => {
                    const e = ee as EdgeWithVisibility;
                    e.isVisible = true;
                    return isEdgeVisible(e) ? "visible" : "hidden";
                });
            nodes
                .style("visibility", d => {
                    return isNodeVisible(d) ? "visible" : "hidden";
                })
            innerNodes
                .style("visibility", d => {
                    return isNodeVisible(d) ? "visible" : "hidden";
                })
            lastClicked = null;
            (simulation.force("link") as d3.ForceLink<d3.SimulationNodeDatum, d3.SimulationLinkDatum<d3.SimulationNodeDatum>>)
                .links(edges);
            simulation.nodes(nodeEntries.filter(d => isNodeVisible(d)) as SimulationNodeDatum[]);
            simulation.alpha(0.1).restart();
            return;
        }
        reachableFromLastClickedNode.clear();
        edges.forEach(x => x.isVisible = false);
        depthFirstSearch(d.name);
        links
            .style("visibility", ee => {
                const e = ee as EdgeWithVisibility;
                return isEdgeVisible(e) ? "visible" : "hidden";
            });
        nodes
            .style("visibility", d => {
                return isNodeVisible(d) ? "visible" : "hidden";
            })
        innerNodes
            .style("visibility", d => {
                return isNodeVisible(d) ? "visible" : "hidden";
            })
        lastClicked = d.name;
        (simulation.force("link") as d3.ForceLink<d3.SimulationNodeDatum, d3.SimulationLinkDatum<d3.SimulationNodeDatum>>)
            .links(edges.filter(isEdgeVisible));
        simulation.nodes(
            nodeEntries.filter(d => isNodeVisible(d)) as SimulationNodeDatum[]
        );

        simulation.alpha(0.1).restart();
    }

    function depthFirstSearch(currentNode: string) {
        reachableFromLastClickedNode.add(currentNode);
        adjacencyList.get(currentNode)?.forEach(edge => {
            if (!reachableFromLastClickedNode.has(edge.target.name)) {
                depthFirstSearch(edge.target.name);
            }
            edge.isVisible = true;
        });
    }

    function isEdgeVisible(e: EdgeWithVisibility): boolean {
        // @ts-ignore
        const source = e.source.name;
        // @ts-ignore
        const target = e.target.name;
        return isNodeVisible(source) && isNodeVisible(target) && e.isVisible;
    }

    function isNodeVisible(d: Node | string): boolean {
        const name = (typeof d == "string" ? d : d.name);
        return visibilityMap.get(name) && reachableFromLastClickedNode.has(name);
    }

    function buildLegend() {
        const legend = svg
            .append("g")
            .attr("class", "legend")
            .attr("transform", "translate(20, 10)");

        const legendRect = legend
            .append("rect")
            .attr("x", 0)
            .attr("y", 0)
            .style("fill", "#fff")
            .style("stroke", "black")
            .style("stroke-width", 0.1);
        const legendInner = legend
            .append("g")
            .attr("class", "legend-inner")
            .attr("transform", "translate(10, 10)")
            .style("font-size", "12px")
        const legendCircle = legendInner
            .append("circle")
            .attr("r", "0.5em")
            .attr("cx", 0)
            .attr("cy", "-0.25em")
            .style("fill", "#abc")
        const CircleText = legendInner
            .append("text")
            .text("Retained size of an object")
            .attr("x", "1em")
            .attr("y", 0);
        const square = legendInner
            .append("rect")
            .attr("x", "-0.5em")
            .attr("y", "0.75em")
            .attr("height", "1em")
            .attr("width", "1em")
            .attr("stroke", "black")
            .style("fill", "#ffffff")
            .attr("stroke-width", 1.5)
        const squareText = legendInner
            .append("text")
            .text("Shallow size of an object")
            .attr("x", "1em")
            .attr("y", "1.6em")
        const categoriesSquares = legendInner
            .selectAll(".cat-rect")
            .data(categories)
            .enter()
            .append("rect")
            .attr("x", "-0.5em")
            .attr("y", (d, i) => `${2.25 + i * 1.5}em`)
            .attr("width", "1em")
            .attr("height", "1em")
            .attr("class", "cat-rect")
            .style("fill", d => colorScale(d) as string);
        const categoriesCircle = legendInner
            .selectAll(".cat-circle")
            .data(categories)
            .enter()
            .append("circle")
            .attr("cx", "1.5em")
            .attr("cy", (d, i) => `${2.75 + i * 1.5}em`)
            .attr("r", "0.5em")
            .attr("class", "cat-circle")
            .style("fill", d => colorScale(d) as string);
        const categoriesText = legendInner
            .selectAll(".cat-text")
            .data(categories)
            .enter()
            .append("text")
            .text(d => `Ir element with type ${d}`)
            .attr("x", "2.5em")
            .attr("y", (d, i) => `${3 + i * 1.5}em`)
            .attr("class", ".cat-text");

        const size = legendInner.node().getBBox();
        legendRect.attr("height", size.height + 10)
            .attr("width", size.width + 10)

    }
}