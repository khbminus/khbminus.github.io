function findNumberOfDots(string: string): number {
    return splitByDot(string).length - 1;
}

export type TreeMapCategory = "retained" | "shallow" | "middle";

export type TreeMapNode = {
    name: string,
    children: TreeMapNode[],
    category: TreeMapCategory,
    value: number,
    shallowValue: number,
}

export function findHierarchy(
    strings: Array<string>,
    depth: number,
    name: string,
    values: Map<string, number>,
    shallowValues: Map<string, number> = null,
    topCategory: TreeMapCategory
): TreeMapNode {
    const leafs: TreeMapNode[] = strings.filter(x => findNumberOfDots(x) == depth).map(x => {
        const split = splitByDot(x);
        const name = split[split.length - 1];
        if (shallowValues != null) {
            const shallow = (shallowValues.has(x) ? shallowValues.get(x) : 0);
            return {
                name: name,
                value: 0,
                shallowValue: shallow,
                category: "middle",
                children: [{
                    name: `${x}`,
                    value: values.get(x),
                    shallowValue: shallow,
                    category: "retained",
                    children: []
                }]
            }
        }
        return {
            name: name,
            value: values.get(x),
            category: topCategory,
            shallowValue: null,
            children: []
        };
    });

    const notLeafs = strings.filter(x => findNumberOfDots(x) != depth);
    const firstElements = new Set(notLeafs.map(x => splitByDot(x)[depth]));
    firstElements.forEach((element) => {
        const newLeaf = findHierarchy(
            notLeafs.filter(x => splitByDot(x)[depth] == element),
            depth + 1,
            element,
            values,
            shallowValues,
            topCategory
        );
        leafs.push(newLeaf);
    });
    return {
        name: name,
        category: "middle",
        children: leafs,
        shallowValue: leafs.map(x => x.shallowValue).reduce((a, b) => a + b),
        value: 0// leafs.map(x => x.value).reduce((a, b) => a + b)
    }
}

export type Edge = { source: string, target: string, description: string, isTargetContagious: boolean };
export type Node = { name: string, value: number, shallowValue: number };
export type IrSizeNode = {
    size: number,
    type: "function" | "property" | "field" | "anonymousInitializer" | "class" | "unknown"
}

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

export function splitByDot(x: string): string[] {
    const compelement = {")": "(", "]": "[", ">": "<", "}": "{"};
    const chars = [...x]
    const stack: string[] = []
    const res: string[] = []
    let current = ""
    chars.forEach(c => {
        if (c === ".") {
            if (stack.length === 0) {
                res.push(current)
                current = "";
            } else {
                current = current.concat(".");
            }
            return;
        }
        if (c === "(" || c === "{" || c == "<" || c == "[") {
            stack.push(c);
        } else if (c === ")" || c === "}" || c === ">" || c === "]") {
            while (stack.length > 1 && stack[stack.length - 1] != compelement[c]) {
                stack.pop();
            }
            stack.pop();
        }
        current = current.concat(c);
    });
    if (current.length > 0) {
        res.push(current);
    }
    return res;
}