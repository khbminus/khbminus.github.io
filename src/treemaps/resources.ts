import {kotlinRetainedSize} from "../retained-size";
import {kotlinDeclarationsSize} from "../ir-sizes";
import {colors} from "../svgGen";

export const STROKE_SPACE = 4

export const irMap = new Map(Object.entries(kotlinRetainedSize));
export const irShallowMap = new Map(Object.entries(kotlinDeclarationsSize).map(x => [x[0], x[1].size]));
export const height = window.innerHeight * 0.97;
export const width = window.innerWidth * 0.8;
export let keys = new Set([...irMap.keys()]);

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