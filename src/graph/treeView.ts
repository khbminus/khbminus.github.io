import {kotlinDeclarationsSize} from "../ir-sizes";
import {kotlinReachabilityInfos} from "../dce-graph";

const tableDiv = document.getElementById("treeView");
const table = document.createElement("table")
const irMap = new Map(Object.entries(kotlinDeclarationsSize));


kotlinReachabilityInfos.forEach(edge => {
    if (!irMap.has(edge.source)) {
        irMap.set(edge.source, 0);
    }
    if (!irMap.has(edge.target)) {
        irMap.set(edge.target, 0);
    }
});

const entries = [...irMap.entries()];
let onTableUpdate = null
export const setOnTableUpdate = (fun: () => void) => {
    onTableUpdate = fun;
}
export const visibilityMap = new Map(entries.map(x => {
    const name = x[0];
    return [name, true];
}))
entries.forEach(x => {
    const name = x[0];

    const row = table.insertRow();
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.oninput = ev => {
        const input = ev.currentTarget as HTMLInputElement;
        const row = input.parentElement.parentElement as HTMLTableRowElement;
        const name = row.cells[1].textContent;
        visibilityMap.set(name, input.checked);
        if (onTableUpdate !== null) {
            onTableUpdate();
        }
    }
    checkbox.checked = true;
    row.insertCell().append(checkbox);

    row.insertCell().append(document.createTextNode(name));

});
tableDiv.appendChild(table);
