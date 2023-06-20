import {kotlinDeclarationsSize as sizes2} from "../ir-sizes-stdlib-changed";
import {kotlinDeclarationsSize as sizes1} from "../ir-sizes-stdlib";

export const irMap1 = new Map(Object.entries(sizes1).map(x => [x[0], x[1].size]));
export const irMap2 = new Map(Object.entries(sizes2).map(x => [x[0], x[1].size]));