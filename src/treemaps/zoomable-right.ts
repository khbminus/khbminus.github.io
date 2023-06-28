import {build} from "./zoomableCommon";
import {kotlinRetainedSize} from "../resources/retained-right/retained-sizes";
import {kotlinDeclarationsSize} from "../resources/ir-sizes-right";

build(kotlinRetainedSize, kotlinDeclarationsSize);