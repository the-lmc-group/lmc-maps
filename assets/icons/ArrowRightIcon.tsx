import React from "react";
import Svg, { Path } from "react-native-svg";

const ArrowRightIcon = ({ color = "#e3e3e3" }) => (
  <Svg width={24} height={24} viewBox="0 -960 960 960" fill={color}>
    <Path
      fill={color}
      d="M680-624 244-188q-11 11-28 11t-28-11q-11-11-11-28t11-28l436-436H400q-17 0-28.5-11.5T360-720q0-17 11.5-28.5T400-760h320q17 0 28.5 11.5T760-720v320q0 17-11.5 28.5T720-360q-17 0-28.5-11.5T680-400v-224Z"
    />
  </Svg>
);

export default ArrowRightIcon;
