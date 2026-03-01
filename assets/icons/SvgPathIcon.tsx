import React from "react";
import Svg, { Path } from "react-native-svg";

export default function SvgPathIcon({
  d,
  fill = "#e3e3e3",
  width = 24,
  height = 24,
  viewBox = "0 -960 960 960",
}: {
  d: string;
  fill?: string;
  width?: number | string;
  height?: number | string;
  viewBox?: string;
}) {
  return (
    <Svg width={width} height={height} viewBox={viewBox}>
      <Path d={d} fill={fill} />
    </Svg>
  );
}
