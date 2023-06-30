import {getHierarchy} from "./dataProcessing";
import {kotlinRetainedSize} from "../resources/retained-right/retained-sizes";
import {retainedTreeInfo} from "../resources/retained-right/dominator-tree";
import {build} from "./retainedTree";

const hierarchy = getHierarchy(kotlinRetainedSize, retainedTreeInfo);
build(hierarchy);