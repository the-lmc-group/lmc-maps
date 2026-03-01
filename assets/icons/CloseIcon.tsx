import React from "react";
import Svg, { Path, SvgProps } from "react-native-svg";

const CloseIcon = (props: SvgProps) => (
  <Svg width={24} height={24} viewBox="0 -960 960 960" {...props}>
    <Path
      d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z"
      fill="#fff"
    />
  </Svg>
);

export default CloseIcon;
