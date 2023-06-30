import {getHierarchy} from "./dataProcessing";
import {kotlinRetainedSize} from "../resources/retained-left/retained-sizes";
import {retainedTreeInfo} from "../resources/retained-left/dominator-tree";
import {build} from "./retainedTree";

const hierarchy = getHierarchy(kotlinRetainedSize, retainedTreeInfo);
build(hierarchy);