import {draw} from "./graphCommon";
import {kotlinDeclarationsSize} from "../ir-sizes1";
import {kotlinReachabilityInfos} from "../dce-graph1";
import {kotlinRetainedSize} from "../retained-size1";

draw(kotlinDeclarationsSize, kotlinReachabilityInfos, kotlinRetainedSize)