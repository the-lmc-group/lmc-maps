import React from "react";
import Svg, { Path } from "react-native-svg";

const WorkIcon = ({ color = "#e3e3e3", width = 24, height = 24 }) => {
  return (
    <Svg width={width} height={height} viewBox="0 -960 960 960" fill={color}>
      <Path
        fill={color}
        d="M160-120q-33 0-56.5-23.5T80-200v-440q0-33 23.5-56.5T160-720h160v-80q0-33 23.5-56.5T400-880h160q33 0 56.5 23.5T640-800v80h160q33 0 56.5 23.5T880-640v440q0 33-23.5 56.5T800-120H160Zm0-80h640v-440H160v440Zm240-520h160v-80H400v80ZM160-200v-440 440Z"
      />
    </Svg>
  );
};

export default WorkIcon;
