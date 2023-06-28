import {buildTraversableGraph} from "./traverseDiffGraphCommon";
import {diffDeclarationsDifference, diffMetaNodesInfo, diffReachibilityInfos} from "../commonDiffResources";
buildTraversableGraph(diffDeclarationsDifference, diffMetaNodesInfo, diffReachibilityInfos);