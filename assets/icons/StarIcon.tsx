import React from "react";
import Svg, { Path, SvgProps } from "react-native-svg";

const StarIcon = (props: SvgProps & { color?: string }) => (
  <Svg
    width={24}
    height={24}
    viewBox="0 -960 960 960"
    fill={props.color ?? "#e3e3e3"}
    {...props}
  >
    <Path d="m233-120 65-281L80-590l288-25 112-265 112 265 288 25-218 189 65 281-247-149-247 149Z" />
  </Svg>
);

export default StarIcon;
