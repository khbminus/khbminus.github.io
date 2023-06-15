import {draw} from "./graphCommon";
import {kotlinDeclarationsSize} from "../ir-sizes";
import {kotlinReachabilityInfos} from "../dce-graph";
import {kotlinRetainedSize} from "../retained-size";

draw(kotlinDeclarationsSize, kotlinReachabilityInfos, kotlinRetainedSize)