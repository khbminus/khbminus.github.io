const tableDiv = document.getElementById("tree-view-content");
let table: HTMLTableElement = null

export function buildTreeView(irMap: Map<string, number>, defaultValue: boolean, onTableUpdate: (a: string[], b: boolean) => void) {
    function tickAll(defaultValue: boolean) {
        const rowLength = table.rows.length;
        const updated: string[] = [];
        for (let i = 0; i < rowLength; i++) {
            const row = table.rows[i];
            const button = row.cells[0].children[0] as HTMLInputElement;
            const name = row.cells[1].textContent;
            console.log(row, button, name);
            if (button.checked != defaultValue) {
                button.checked = defaultValue;
                visibilityMap.set(name, defaultValue);
                if (onTableUpdate !== null) {
                    updated.push(name);
                }
            }
        }
        if (onTableUpdate !== null) {
            onTableUpdate(updated, defaultValue);
        }
    }
    const entries = [...irMap.entries()];
    const visibilityMap = new Map(entries.map(x => {
        const name = x[0];
        return [name, defaultValue];
    }))
    const searchBarContainer = document.getElementById("tree-view-searchbar");
    const buttonsDiv = document.createElement("div");


    const searchBar = document.createElement("input");
    searchBar.type = "text";
    searchBar.placeholder = "Filter nodes..."
    searchBar.oninput = ev => {
        table.remove()
        const text = (ev.currentTarget as HTMLInputElement).value;
        buildTable(text);
    }
    searchBarContainer.append(searchBar);
    buttonsDiv.style.display = "flex";
    buttonsDiv.style.flexDirection = "row";
    const buttonTick = document.createElement("button");
    buttonTick.type = "button";
    buttonTick.textContent = "Select all";
    buttonTick.onclick = () => tickAll(true);

    buttonTick.style.width = "50%";

    buttonsDiv.appendChild(buttonTick);
    const buttonUnTick = document.createElement("button");
    buttonUnTick.type = "button";
    buttonUnTick.textContent = "Unselect all";
    buttonUnTick.onclick = () => tickAll(false);
    buttonUnTick.style.width = "50%";
    buttonsDiv.appendChild(buttonUnTick);
    searchBarContainer.appendChild(buttonsDiv);
    buildTable("");

    function checkBoxInput(ev: Event) {
        const input = ev.currentTarget as HTMLInputElement;
        const row = input.parentElement.parentElement as HTMLTableRowElement;
        const name = row.cells[1].textContent;
        visibilityMap.set(name, input.checked);
        if (onTableUpdate !== null) {
            onTableUpdate([name], input.checked);
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