import {buildTraversableGraph} from "./traverseDiffGraphCommon";
import {diffReachibilityInfos} from "../stdlib-diff-commit-graph/dce-graph";
import {diffDeclarationsDifference} from "../stdlib-diff-commit-graph/node-diff"
import {diffMetaNodesInfo} from "../stdlib-diff-commit-graph/metanodes";
// import {kotlinDeclarationsSize} from "../../ir-sizes-a717566";
buildTraversableGraph(diffDeclarationsDifference, diffMetaNodesInfo, diffReachibilityInfos);