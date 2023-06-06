import * as d3 from "d3";

export const margin = {top: 5, right: 30, bottom: 40, left: 5},
    width = window.innerWidth - margin.left - margin.right,
    height = window.innerHeight - margin.top - margin.bottom;

export const svg = d3
    .select("body")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform",
        "translate(" + margin.left + "," + margin.top + ")");

export const
    colors = ['#3C1832', '#9E999D', '#F2259C', '#347EB4',
        '#08ACB6', '#91BB91', '#BCD32F', '#75EDB8',
        "#89EE4B", '#AD4FE8', '#D5AB61', '#BC3B3A',
        '#F6A1F9', '#87ABBB', '#412433', '#56B870',
        '#FDAB41', '#64624F']