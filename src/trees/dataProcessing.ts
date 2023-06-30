import * as d3 from "d3";

export enum TreeType {
    Function, Class, Property, Field, AnonymousInitializer, Unknown
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
    public node: d3.HierarchyNode<TreeNode> = null

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
    if (x == "function") return TreeType.Function;
    if (x == "property") return TreeType.Property;
    if (x == "field") return TreeType.Field;
    if (x == "anonymous initializer") return TreeType.AnonymousInitializer;
    if (x == "class") return TreeType.Class;
    if (x == "unknown") return TreeType.Unknown;
    throw new Error(`Unknown tree type ${x}`);
}

export function getHierarchy(declarationSizes, parents) {
    function getNodes() {
        return new Map(Object.entries(declarationSizes).map(([key, value]) => {
            // @ts-ignore
            const type = getType(value.type);
            // @ts-ignore
            return [key, new TreeNode(true, key, value.size, type)];
        }));
    }

    function getEdges(node: Map<string, TreeNode>) {
        return Object.entries(parents)
            .filter(([a, b]) => a !== b)
            .map(([child, parent]) => {
                // @ts-ignore
                return {source: node.get(parent), target: node.get(child)};
            });
    }

    const nodes = getNodes();
    getEdges(nodes).forEach(e => e.source.children.push(e.target));
    const hierarchy = d3.hierarchy(nodes.get("Fake source"));
    hierarchy.descendants().forEach((d, i) => {
        d.data._children = d.children;
        d.data.node = d;
        // @ts-ignore
        d.id = i;
        if (d.data.children.length > 4)
            d.children = null;
    });
    return hierarchy;
}
