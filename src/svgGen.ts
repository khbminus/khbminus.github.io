import * as d3 from "d3";
console.log(d3);


export function createSvg(height, width) {
        return d3
            .select("body")
            .append("svg")
            .attr("width", width)
            .attr("height", height)
            .append("g")
}

export const
    colors = ['#3C1832', '#9E999D', '#F2259C', '#347EB4',
        '#08ACB6', '#91BB91', '#BCD32F', '#75EDB8',
        "#89EE4B", '#AD4FE8', '#D5AB61', '#BC3B3A',
        '#F6A1F9', '#87ABBB', '#412433', '#56B870',
        '#FDAB41', '#64624F']