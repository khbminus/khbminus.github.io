import {kotlinDeclarationsSize as sizes1} from "../resources/ir-sizes-left";
import {kotlinDeclarationsSize as sizes2} from "../resources/ir-sizes-right";

import {kotlinRetainedSize as rsz1} from "../resources/retained-left/retained-sizes";
import {kotlinRetainedSize as rsz2} from "../resources/retained-right/retained-sizes";

import {diffDeclarationsSizes as dd} from "../resources/graph-diff/ir-sizes";
import {diffReachibilityInfos as dr} from "../resources/graph-diff/dce-graph";
import {diffMetaNodesInfo as dm} from "../resources/graph-diff/metanodes";
import {diffDeclarationsDifference as ddd} from "../resources/graph-diff/node-diff";

import {diffDeclarationsSizes as rdd} from "../resources/retained-diff/ir-sizes";
import {diffTreeParents as rtp} from "../resources/retained-diff/parents";


export const irMap1 = new Map(Object.entries(sizes1).map(x => [x[0], x[1].size]));
export const irMap2 = new Map(Object.entries(sizes2).map(x => [x[0], x[1].size]));

export const retainedIrMap1 = new Map(Object.entries(rsz1).map(x => [x[0], x[1].size]));
export const retainedIrMap2 = new Map(Object.entries(rsz2).map(x => [x[0], x[1].size]));

export const diffDeclarationsSizes = dd;
export const diffReachibilityInfos = dr;
export const diffMetaNodesInfo = dm;
export const diffDeclarationsDifference = ddd;
export const retainedDiffDeclarationsSizes = rdd;
export const retainedDiffTreeParents = rtp;