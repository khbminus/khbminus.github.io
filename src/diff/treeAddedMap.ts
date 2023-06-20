import {buildDiffMap} from "./treeDiffMap_common";
import {irMap1, irMap2} from "./commonDiffResources";

const keys = new Set(([...irMap2.keys()]).filter(x => {
    const irMap1Value = (irMap1.has(x) ? irMap1.get(x) : 0);
    console.log(irMap1.get(x), irMap2.get(x), x);
    return irMap2.get(x) > irMap1Value;
}));

console.log(keys);

buildDiffMap(
    new Map(([...irMap1.entries()]).filter(x => keys.has(x[0]))),
    new Map(([...irMap2.entries()]).filter(x => keys.has(x[0]))),
    false
)
