import {splitByDot} from "../../processing";

function findNumberOfDots(string: string): number {
    return splitByDot(string).length - 1;
}

export type DiffTreeMapNode = {
    value: number,
    plusChange: number,
    minusChange: number,
    name: string,
    category: "regular" | "diff-pos" | "diff-neg" | "middle",
    children: DiffTreeMapNode[]
}


export function findHierarchy(
    strings: Array<string>,
    depth: number,
    name: string,
    oldValues: Map<string, number>,
    newValues: Map<string, number>,
    includeNotChanged: boolean
): DiffTreeMapNode {
    const leafs: DiffTreeMapNode[] = strings.filter(x => findNumberOfDots(x) == depth).map(x => {
        const oldValue = (oldValues.has(x) ? oldValues.get(x) : 0);
        const newValue = (newValues.has(x) ? newValues.get(x) : 0);
        const value = Math.max(oldValue, newValue) - Math.abs(oldValue - newValue);
        const children: DiffTreeMapNode[] = (includeNotChanged ? [{
            name: x,
            value: newValue - oldValue,
            plusChange: (newValue > oldValue ? newValue - oldValue : 0),
            minusChange: (newValue < oldValue ? oldValue - newValue : 0),
            category: (newValue > oldValue ? "diff-pos" : "diff-neg"),
            children: []
        }, {
            name: x,
            value: value,
            plusChange: 0,
            minusChange: 0,
            category: "regular",
            children: []
        }] : [{
            name: x,
            value: newValue - oldValue,
            plusChange: (newValue > oldValue ? newValue - oldValue : 0),
            minusChange: (newValue < oldValue ? oldValue - newValue : 0),
            category: (newValue > oldValue ? "diff-pos" : "diff-neg"),
            children: []
        }]);
        return {
            name: x,
            value: 0,
            category: "middle",
            plusChange: children.map(x => x.plusChange).reduce((a, b) => a + b),
            minusChange: children.map(x => x.minusChange).reduce((a, b) => a + b),
            children: children
        };
    });

    const notLeafs = strings.filter(x => findNumberOfDots(x) != depth);
    const firstElements = new Set(notLeafs.map(x =>splitByDot(x)[depth]));
    firstElements.forEach((element) => {
        const newLeaf = findHierarchy(
            notLeafs.filter(x => splitByDot(x)[depth] == element),
            depth + 1,
            element,
            oldValues,
            newValues,
            includeNotChanged
        );
        leafs.push(newLeaf);
    });
    return {
        name: name,
        category: "middle",
        children: leafs,
        plusChange: leafs.map(x => x.plusChange).reduce((a, b) => a + b),
        minusChange: leafs.map(x => x.minusChange).reduce((a, b) => a + b),
        value: 0// leafs.map(x => x.value).reduce((a, b) => a + b)
    }
}