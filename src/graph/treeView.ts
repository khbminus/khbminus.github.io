const tableDiv = document.getElementById("tree-view-content");
let table: HTMLTableElement = null

export function buildTreeView(irMap: Map<string, number>, defaultValue: boolean, onTableUpdate: (string, boolean) => void) {

    const entries = [...irMap.entries()];
    const visibilityMap = new Map(entries.map(x => {
        const name = x[0];
        return [name, defaultValue];
    }))
    buildTable("");

    const searchBarContainer = document.getElementById("tree-view-searchbar");
    const searchBar = document.createElement("input");
    searchBar.type = "text";
    searchBar.placeholder = "Filter nodes..."
    searchBar.oninput = ev => {
        table.remove()
        const text = (ev.currentTarget as HTMLInputElement).value;
        buildTable(text);
    }

    searchBarContainer.append(searchBar);

    function checkBoxInput(ev: Event) {
        const input = ev.currentTarget as HTMLInputElement;
        const row = input.parentElement.parentElement as HTMLTableRowElement;
        const name = row.cells[1].textContent;
        visibilityMap.set(name, input.checked);
        if (onTableUpdate !== null) {
            onTableUpdate(name, input.checked);
        }
    }

    function buildTable(inputString: string) {
        table = document.createElement("table");
        entries.forEach(x => {
            const name = x[0];
            if (!name.includes(inputString)) {
                return;
            }

            const row = table.insertRow();
            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.oninput = checkBoxInput;
            checkbox.checked = visibilityMap.get(name);
            row.insertCell().append(checkbox);
            row.insertCell().append(document.createTextNode(name));
        });
        tableDiv.appendChild(table);
    }
    return visibilityMap
}