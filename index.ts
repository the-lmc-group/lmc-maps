import { registerRootComponent } from "expo";

import "./mapboxInit";

import {
  configureReanimatedLogger,
  ReanimatedLogLevel,
} from "react-native-reanimated";

configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: false,
});

import App from "./App";
registerRootComponent(App);
