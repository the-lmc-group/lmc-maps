import React from "react";
import Svg, { Path } from "react-native-svg";

const HomeIcon = ({ color = "#e3e3e3", width = 24, height = 24 }) => {
  return (
    <Svg width={width} height={height} viewBox="0 -960 960 960" fill={color}>
      <Path
        fill={color}
        d="M160-120v-480l320-240 320 240v480H560v-280H400v280H160Z"
      />
    </Svg>
  );
};

export default HomeIcon;
