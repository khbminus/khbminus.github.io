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

export type TreeMapNode = {
    name: string,
    children: TreeMapNode[],
    category: "retained" | "shallow" | "middle",
    value: number
}

export function findHierarchy(strings: Array<string>, depth: number, name: string, values: Map<string, number>, shallowValues: Map<string, number>): TreeMapNode {
    const leafs: TreeMapNode[] = strings.filter(x => findNumberOfDots(x) == depth).map(x => {
        return {
            name: x,
            value: values.get(x),
            category: "retained",
            children: [{name: x, value: shallowValues.get(x), category: "shallow", children: []}]
        };
    });

    const notLeafs = strings.filter(x => findNumberOfDots(x) != depth);
    const firstElements = new Set(notLeafs.map(x => x.split(".")[depth]));
    firstElements.forEach((element) => {
        const newLeaf = findHierarchy(
            notLeafs.filter(x => x.split(".")[depth] == element),
            depth + 1,
            element,
            values,
            shallowValues
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

export type Edge = { source: string, target: string, description: string, isTargetContagious: boolean };
export type Node = { name: string, value: number, shallowValue: number };

export function deleteSelfEdges(edges: Array<Edge>): Array<Edge> {
    return edges.filter(e => e.source !== e.target);
}

function exists(names: string[], name: string): boolean {
    return names
            .find(x => x === name)
        !== undefined
}

export function deleteBadEdges(edges: Array<Edge>, nodes: Node[]): Array<Edge> {
    const names = nodes.map(n => n.name);
    return edges.filter(e => exists(names, e.source) && exists(names, e.target));
}

export const escapeHtml = (unsafe) => {
    return unsafe
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}