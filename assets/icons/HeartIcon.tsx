import React from "react";
import Svg, { Path, SvgProps } from "react-native-svg";

const HeartIcon = (props: SvgProps & { color?: string }) => (
  <Svg
    width={24}
    height={24}
    viewBox="0 -960 960 960"
    fill={props.color ?? "#e3e3e3"}
    {...props}
  >
    <Path d="m480-120-58-53q-101-91-167-157T150-447q-39-51-54.5-97T80-639q0-104 70.5-174.5T325-884q55 0 105 25t88 71q38-46 88-71t105-25q104 0 174.5 70.5T956-639q0 49-15.5 95T886-447q-39 51-105 117T614-173l-58 53h-76Z" />
  </Svg>
);

export default HeartIcon;
