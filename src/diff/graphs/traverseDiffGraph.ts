import {diffDeclarationsDifference, diffMetaNodesInfo, diffReachibilityInfos} from "../commonDiffResources";
import {buildTraversableGraph} from "./traverseDiffGraphCommon";
buildTraversableGraph(diffDeclarationsDifference, diffMetaNodesInfo, diffReachibilityInfos);