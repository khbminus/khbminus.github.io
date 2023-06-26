import * as d3 from "d3";
import {retainedDiffDeclarationsSizes, retainedDiffTreeParents} from "../commonDiffResources";

export enum TreeType {
    Mixed, NotChanged, Added, Removed
}

export class TreeNode {
    public collapsed: boolean
    public name: string
    public size: number
    public type: TreeType
    public x: number = null
    public y: number = null
    public children: TreeNode[] = []
    public _children: d3.HierarchyNode<TreeNode>[] = null

    constructor(collapsed: boolean, name: string, size: number, type: TreeType) {
        this.collapsed = collapsed;
        this.name = name;
        this.size = size;
        this.type = type;
    }

    public toString = () => `Node(${this.name})`
}

export type Edge = {
    source: TreeNode,
    target: TreeNode
}

function getType(x: string): TreeType {
    if (x == "Mixed") return TreeType.Mixed;
    if (x == "Added") return TreeType.Added;
    if (x == "Removed") return TreeType.Removed;
    if (x == "NotChanged") return TreeType.NotChanged;
    throw new Error(`Unknown tree type ${x}`);
}

function getNodes() {
    return new Map(Object.entries(retainedDiffDeclarationsSizes).map(([key, value]) => {
        const type = getType(value.type);
        return [key, new TreeNode(type != TreeType.Mixed, key, value.size, type)];
    }));
}

const nodesWithoutChanged: Map<string, TreeNode> = getNodes();
const nodesChanged = getNodes();

function getEdges(node: Map<string, TreeNode>) {
    return Object.entries(retainedDiffTreeParents)
        .filter(([a, b]) => a !== b)
        .map(([child, parent]) => {
            return {source: node.get(parent), target: node.get(child)};
        });
};

getEdges(nodesWithoutChanged).forEach(e => {
    if (e.target.type != TreeType.NotChanged) {
        e.source.children.push(e.target)
    }
});
getEdges(nodesChanged).forEach(e => e.source.children.push(e.target))

// @ts-ignore
export const hierarchyWithoutChanged: d3.HierarchyNode<TreeNode> = d3.hierarchy(nodesWithoutChanged.get("Fake source"));
export const hierarchyWithChanged: d3.HierarchyNode<TreeNode> = d3.hierarchy(nodesChanged.get("Fake source"));

[hierarchyWithoutChanged, hierarchyWithChanged].forEach(hierarchy => hierarchy.descendants().forEach((d, i) => {
    d.data._children = d.children;
    // @ts-ignore
    d.id = i;
    // if (d.data.collapsed || d.data.children.filter(x => x.type != TreeType.NotChanged).length === 0) {
    if (d.data.children.length > 4)
        d.children = null;
    // }
}));
