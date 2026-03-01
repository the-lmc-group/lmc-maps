import React from "react";
import Svg, { Circle, Defs, Pattern, Rect } from "react-native-svg";

export default function HeroPattern() {
  return (
    <Svg width="100%" height="100%">
      <Defs>
        <Pattern id="dots" patternUnits="userSpaceOnUse" width={20} height={20}>
          <Circle cx={1} cy={1} r={1} fill="rgba(255, 255, 255, 0.8)" />
        </Pattern>
      </Defs>
      <Rect width="100%" height="100%" fill="url(#dots)" />
    </Svg>
  );
}
