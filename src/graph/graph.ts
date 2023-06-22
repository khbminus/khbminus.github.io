import {draw} from "./graphCommon";
import {kotlinDeclarationsSize} from "../ir-sizes";
import {kotlinReachabilityInfos} from "../dce-graph";
import {kotlinRetainedSize} from "../ir-sizes-retained";

draw(kotlinDeclarationsSize, kotlinReachabilityInfos, kotlinRetainedSize)