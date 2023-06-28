import {kotlinDeclarationsSize as sizes1} from "../ir-sizes";
import {kotlinDeclarationsSize as sizes2} from "../ir-sizes-changed";

import {kotlinRetainedSize as rsz1} from "../ir-sizes-retained";
import {kotlinRetainedSize as rsz2} from "../ir-sizes-changed-retained";

import {diffDeclarationsSizes as dd} from "./simple-diff/ir-sizes";
import {diffReachibilityInfos as dr} from "./simple-diff/dce-graph";
import {diffMetaNodesInfo as dm} from "./simple-diff/metanodes";
import {diffDeclarationsDifference as ddd} from "./simple-diff/node-diff";
// import {diffDeclarationsSizes as dd} from "./stdlib-diff/ir-sizes";
// import {diffReachibilityInfos as dr} from "./stdlib-diff/dce-graph";
// import {diffMetaNodesInfo as dm} from "./stdlib-diff/metanodes";
// import {diffDeclarationsDifference as ddd} from "./stdlib-diff/node-diff";

// import {diffDeclarationsSizes as rdd} from "./simple-diff-retained/ir-sizes";
// import {diffReachibilityInfos as rdr} from "./simple-diff-retained/dce-graph";
// import {diffMetaNodesInfo as rdm} from "./simple-diff-retained/metanodes";
// import {diffDeclarationsDifference as rddd} from "./simple-diff-retained/node-diff";
// import {diffTreeParents as rtp} from "./simple-diff-retained/parents";
// import {diffDeclarationsSizes as rdd} from "./stdlib-diff-retained/ir-sizes";
// import {diffReachibilityInfos as rdr} from "./stdlib-diff-retained/dce-graph";
// import {diffMetaNodesInfo as rdm} from "./stdlib-diff-retained/metanodes";
// import {diffDeclarationsDifference as rddd} from "./stdlib-diff-retained/node-diff";
// import {diffTreeParents as rtp} from "./stdlib-diff-retained/parents";
import {diffDeclarationsSizes as rdd} from "./incremental-research-diff/ir-sizes";
import {diffReachibilityInfos as rdr} from "./stdlib-diff-commit-graph/dce-graph";
import {diffMetaNodesInfo as rdm} from "./stdlib-diff-commit-graph/metanodes";
import {diffDeclarationsDifference as rddd} from "./stdlib-diff-commit-graph/node-diff";
import {diffTreeParents as rtp} from "./incremental-research-diff/parents";


export const irMap1 = new Map(Object.entries(sizes1).map(x => [x[0], x[1].size]));
export const irMap2 = new Map(Object.entries(sizes2).map(x => [x[0], x[1].size]));

export const retainedIrMap1 = new Map(Object.entries(rsz1).map(x => [x[0], x[1].size]));
export const retainedIrMap2 = new Map(Object.entries(rsz2).map(x => [x[0], x[1].size]));

export const diffDeclarationsSizes = dd;
export const diffReachibilityInfos = dr;
export const diffMetaNodesInfo = dm;
export const diffDeclarationsDifference = ddd;
export const retainedDiffDeclarationsSizes = rdd;
export const retainedDiffReachibilityInfos = rdr;
export const retainedDiffMetaNodesInfo = rdm;
export const retainedDeclarationsDifference = rddd;
export const retainedDiffTreeParents = rtp;