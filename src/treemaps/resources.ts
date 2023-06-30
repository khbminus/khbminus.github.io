import {findHierarchy, TreeMapCategory, TreeMapNode} from "../processing";
import * as d3 from "d3";

export function getAllResources(kotlinRetainedSize, kotlinDeclarationsSize) {
    // @ts-ignore
    const irMap: Map<string, number> = new Map(Object.entries(kotlinRetainedSize).filter(x => x[0] != "Fake source").map(x => [x[0], x[1].size]));
    // @ts-ignore
    const irShallowMap: Map<string, number> = new Map(Object.entries(kotlinDeclarationsSize).map(x => [x[0], x[1].size]));
    const keys = new Set([...irMap.keys()]);
    const getHierarchy = function (irMap: Map<string, number>, irMap2: Map<string, number>, topCategory: TreeMapCategory, zoomable: boolean) {
        // @ts-ignore
        const data = findHierarchy([...keys], 0, "Kotlin IR", irMap, irMap2, topCategory, zoomable);
        const hierarchy = d3
            .hierarchy(data)
            .sum(d => d.value);
        hierarchy.children.sort((a, b) => b.value - a.value)
        return hierarchy
    };
    const updateHierarchy = function (zoomable: boolean, update: (node: d3.HierarchyNode<TreeMapNode>) => void) {
        return function() {
            const value = (document.getElementById("viewMode") as HTMLSelectElement).value;
            if (!isCategory(value)) return;

            let data = null
            if (value === "retained") {
                data = getHierarchy(irMap, null, "retained", zoomable);
            } else if (value === "shallow") {
                data = getHierarchy(irShallowMap, null, "shallow", zoomable);
            } else {
                data = getHierarchy(irMap, irShallowMap, "retained", zoomable);
            }
            update(data);
        }
    }
    const buildOnTableUpdate = function (update: () => void) {
        return function (names: string[], state: boolean) {
            names.forEach(name => {
                if (!state) {
                    keys.delete(name);
                    console.log(`${name} deleted`);
                } else {
                    keys.add(name);
                    console.log(`${name} added`);
                }
            });
            update();
        }
    }

    return {
        "irMap": irMap,
        "irShallowMap": irShallowMap,
        "keys": keys,
        "updateHierarchy": updateHierarchy,
        "buildOnTableUpdate": buildOnTableUpdate
    };
}
export const height = window.innerHeight * 0.97;
export const width = window.innerWidth * 0.8;

let counter = 0
export function getId(): string {
    return `${counter++}`
}

export function isCategory(x: string): x is TreeMapCategory {
    return x === "retained" || x === "shallow" || x == "middle";
}

