import {buildTraversableGraph} from "../diff/graphs/traverseDiffGraphCommon";
import {kotlinDeclarationsSize} from "../resources/ir-sizes-right";
import {kotlinReachibilityInfos} from "../resources/dce-graph-right";

buildTraversableGraph(kotlinDeclarationsSize, {"metaNodesList": [], "parent": {}}, kotlinReachibilityInfos);
