function findNumberOfDots(string: String): number {
    let cnt = 0;
    for (let i in string) {
        const x = string[i];
        if (x === ".") {
            cnt++;
        }
    }
    return cnt;
}

export type DiffTreeMapNode = {
    value: number,
    name: string,
    category: "regular" | "diff-pos" | "diff-neg" | "middle",
    children: DiffTreeMapNode[]
}


export function findHierarchy(
    strings: Array<string>,
    depth: number,
    name: string,
    oldValues: Map<string, number>,
    newValues: Map<string, number>
): DiffTreeMapNode {
    const leafs: DiffTreeMapNode[] = strings.filter(x => findNumberOfDots(x) == depth).map(x => {
        const oldValue = (oldValues.has(x) ? oldValues.get(x) : 0);
        const newValue = (newValues.has(x) ? newValues.get(x) : 0);
        const value = Math.max(oldValue, newValue) - Math.abs(oldValue - newValue);
        return {
            name: x,
            value: 0,
            category: "middle",
            children: [{
                name: x,
                value: Math.abs(oldValue - newValue),
                category: (newValue > oldValue ? "diff-pos" : "diff-neg"),
                children: []
            }, {
                name: x,
                value: value,
                category: "regular",
                children: []
            }]
        };
    });

    const notLeafs = strings.filter(x => findNumberOfDots(x) != depth);
    const firstElements = new Set(notLeafs.map(x => x.split(".")[depth]));
    firstElements.forEach((element) => {
        const newLeaf = findHierarchy(
            notLeafs.filter(x => x.split(".")[depth] == element),
            depth + 1,
            element,
            oldValues,
            newValues
        );
        leafs.push(newLeaf);
    });
    return {
        name: name,
        category: "middle",
        children: leafs,
        value: 0// leafs.map(x => x.value).reduce((a, b) => a + b)
    }
}