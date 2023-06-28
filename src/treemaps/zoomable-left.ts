import {build} from "./zoomableCommon";
import {kotlinDeclarationsSize} from "../resources/ir-sizes-left";
import {kotlinRetainedSize} from "../resources/retained-right/retained-sizes";

build(kotlinRetainedSize, kotlinDeclarationsSize);