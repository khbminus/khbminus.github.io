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
    colors = ['#e06ec1', '#9E999D', '#824e6c', '#347EB4',
        '#08ACB6', '#91BB91', '#BCD32F', '#75EDB8',
        "#a4d08e", '#AD4FE8', '#D5AB61', '#bb9367',
        '#F6A1F9', '#87ABBB', '#91647c', '#56B870',
        '#FDAB41', '#64624F']