import React from "react";
import Svg, { Path, SvgProps } from "react-native-svg";

const AppLogoIcon = (props: SvgProps) => {
  const { fill, width = 60, height = 60, ...rest } = props as any;
  return (
    <Svg width={width} height={height} viewBox="0 -960 960 960" {...rest}>
      <Path
        d="M480-240 222-130q-13 5-24.5 2.5T178-138q-8-8-10.5-20t2.5-25l273-615q5-12 15.5-18t21.5-6q11 0 21.5 6t15.5 18l273 615q5 13 2.5 25T782-138q-8 8-19.5 10.5T738-130L480-240Z"
        fill={fill ?? "#0d7ff2"}
      />
    </Svg>
  );
};

export default AppLogoIcon;
