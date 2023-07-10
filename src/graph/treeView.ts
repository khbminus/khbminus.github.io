const tableDiv = document.getElementById("tree-view-content");
let table: HTMLTableElement = null
let keys: string[] = []
let visibilityMap: Map<string, boolean> = null
let updFunc: (a: string[], b: boolean) => void = null
let dValue = false

export function buildTreeView(irMap: Map<string, number>, defaultValue: boolean, onTableUpdate: (a: string[], b: boolean) => void, types: string[] = []) {
    keys = [...irMap.keys()].concat(types.map(x => `type: ${x}`))
    console.log(`types: ${types}`);
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
    visibilityMap = new Map(keys.map(x => {
        return [x, defaultValue];
    }));
    dValue = defaultValue;
    updFunc = onTableUpdate;
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

    return visibilityMap
}

function checkBoxInput(ev: Event) {
    const input = ev.currentTarget as HTMLInputElement;
    const row = input.parentElement.parentElement as HTMLTableRowElement;
    const name = row.cells[1].textContent;
    visibilityMap.set(name, input.checked);
    if (updFunc !== null) {
        updFunc([name], input.checked);
    }
}

export function updateKeys(newKeys: string[]) {
    const newKeysSet = new Set(newKeys);
    newKeys.forEach(x => {
        if (!visibilityMap.has(x)) {
            visibilityMap.set(x, dValue);
        }
    });
    keys.forEach(x => {
        if (!newKeysSet.has(x)) {
            visibilityMap.delete(x);
        }
    });
    keys = newKeys;
    table.remove();
    buildTable("");
}

function buildTable(inputString: string) {
    table = document.createElement("table");
    keys.forEach(x => {
        const name = x;
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
    document.getElementById("tree-view-content").appendChild(table);
}