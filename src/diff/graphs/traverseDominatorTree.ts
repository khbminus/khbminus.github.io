import {retainedDeclarationsDifference, retainedDiffReachibilityInfos, retainedDiffMetaNodesInfo} from "../commonDiffResources";
import {buildTraversableGraph} from "./traverseDiffGraphCommon";
buildTraversableGraph(retainedDeclarationsDifference, retainedDiffMetaNodesInfo, retainedDiffReachibilityInfos);