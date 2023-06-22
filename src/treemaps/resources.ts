import {kotlinRetainedSize} from "../ir-sizes-retained";
import {kotlinDeclarationsSize} from "../ir-sizes";
import {colors} from "../svgGen";
import {findHierarchy, TreeMapCategory, TreeMapNode} from "../processing";
import * as d3 from "d3";

export const STROKE_SPACE = 4

export const irMap = new Map(Object.entries(kotlinRetainedSize).map(x => [x[0], x[1].size]));
export const irShallowMap = new Map(Object.entries(kotlinDeclarationsSize).map(x => [x[0], x[1].size]));
export const height = window.innerHeight * 0.97;
export const width = window.innerWidth * 0.8;
export let keys = new Set([...irMap.keys()]);
export let paintGradients = true;

export function createGradients(patterns) {
    return new Map([...colors.keys()].map(i => {
        const color = colors[((i - 1) % colors.length + colors.length) % colors.length];
        const id = color.replace("#", "");
        patterns
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
}

function invertHex(hex) {
    return (Number(`0x1${hex}`) ^ 0xFFFFFF).toString(16).substr(1).toUpperCase()
}

let counter = 0
export function getId(): string {
    return `${counter++}`
}

export function isCategory(x: string): x is TreeMapCategory {
    return x === "retained" || x === "shallow" || x == "middle";
}

function getHierarchy(irMap: Map<string, number>, irMap2: Map<string, number>, topCategory: TreeMapCategory, zoomable: boolean) {
    // @ts-ignore
    const data = findHierarchy([...keys], 0, "Kotlin IR", irMap, irMap2, topCategory, zoomable);
    const hierarchy = d3
        .hierarchy(data)
        .sum(d => d.value);
    hierarchy.children.sort((a, b) => b.value - a.value)
    return hierarchy
}

export function updateHierarchy(zoomable: boolean, update: (node: d3.HierarchyNode<TreeMapNode>) => void) {
    return function() {
        const value = (document.getElementById("viewMode") as HTMLSelectElement).value;
        if (!isCategory(value)) return;

        let data = null
        paintGradients = true;
        if (value === "retained") {
            data = getHierarchy(irMap, null, "retained", zoomable);
        } else if (value === "shallow") {
            data = getHierarchy(irShallowMap, null, "shallow", zoomable);
            paintGradients = false;
        } else {
            data = getHierarchy(irMap, irShallowMap, "retained", zoomable);
        }
        update(data);
    }
}

export function buildOnTableUpdate(update: () => void) {
    return function (names: string[], state: boolean) {
        names.forEach(name => {
            if (!state) {
                keys.delete(name);
                console.log(`${name} deleted`);
            } else {
                keys.add(name);
                console.log(`${name} added`);
            }
        });
        update();
    }
}