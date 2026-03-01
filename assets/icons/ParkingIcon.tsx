import React from "react";
import Svg, { Path, SvgProps } from "react-native-svg";

const ParkingIcon = (props: SvgProps) => (
  <Svg
    width={24}
    height={24}
    viewBox="0 -960 960 960"
    fill="#e3e3e3"
    {...props}
  >
    <Path d="M400-360v160q0 33-23.5 56.5T320-120q-33 0-56.5-23.5T240-200v-560q0-33 23.5-56.5T320-840h200q100 0 170 70t70 170q0 100-70 170t-170 70H400Zm0-160h128q33 0 56.5-23.5T608-600q0-33-23.5-56.5T528-680H400v160Z" />
  </Svg>
);

export default ParkingIcon;
