import {buildDiffMap} from "./treeDiffMap_common";
import {irMap1 as irMap2, irMap2 as irMap1} from "./commonDiffResources";

const keys = new Set(([...irMap1.keys()]).filter(x => {
    const irMap2Value = (irMap2.has(x) ? irMap2.get(x) : 0);
    return irMap1.get(x) > irMap2Value;
}));

console.log(keys);

buildDiffMap(
    new Map(([...irMap1.entries()]).filter(x => keys.has(x[0]))),
    new Map(([...irMap2.entries()]).filter(x => keys.has(x[0]))),
    false
)
