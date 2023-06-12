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

export function findHierarchy(strings: Array<String>, depth: number, name: string, values: Map<String, number>, category: string = null) {
    const leafs: any[] = strings.filter(x => findNumberOfDots(x) == depth).map(x => {
        return {
            "name": x,
            "value": values.get(x)
        };
    });
    const notLeafs = strings.filter(x => findNumberOfDots(x) != depth);
    const firstElements = new Set(notLeafs.map(x => x.split(".")[depth]));
    firstElements.forEach((element) => {
        leafs.push(findHierarchy(
            notLeafs.filter(x => x.split(".")[depth] == element),
            depth + 1,
            element,
            values,
            depth == 0 ? element : category
        ))
    });
    return {
        "name": name,
        "children": leafs,
        "category": category,
        "value": leafs.reduce((a, b) => {
            return {
                "value": a.value + b.value
            };
        }).value
    };
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