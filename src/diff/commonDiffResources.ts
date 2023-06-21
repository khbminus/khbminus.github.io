import {kotlinDeclarationsSize as sizes2} from "../ir-sizes-stdlib-changed";
import {kotlinDeclarationsSize as sizes1} from "../ir-sizes-stdlib";

import {diffDeclarationsSizes as dd} from "./stdlib-diff/ir-sizes";
import {diffReachibilityInfos as dr} from "./stdlib-diff/dce-graph";
import {diffMetaNodesInfo as dm} from "./stdlib-diff/metanodes";
import {diffDeclarationsDifference as ddd} from "./stdlib-diff/node-diff";

export const irMap1 = new Map(Object.entries(sizes1).map(x => [x[0], x[1].size]));
export const irMap2 = new Map(Object.entries(sizes2).map(x => [x[0], x[1].size]));

export const diffDeclarationsSizes = dd;
export const diffReachibilityInfos = dr;
export const diffMetaNodesInfo = dm;
export const diffDeclarationsDifference = ddd;