import {buildTraversableGraph} from "../diff/graphs/traverseDiffGraphCommon";
import {kotlinDeclarationsSize} from "../resources/ir-sizes-left";
import {kotlinReachibilityInfos} from "../resources/dce-graph-left";

buildTraversableGraph(kotlinDeclarationsSize, {"metaNodesList": [], "parent": {}}, kotlinReachibilityInfos);
