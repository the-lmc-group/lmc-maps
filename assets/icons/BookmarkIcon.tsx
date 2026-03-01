import { Colors } from "@/constants/theme";
import Svg, { Path } from "react-native-svg";

const BookmarkIcon = ({ color = "#e3e3e3", active = false }) => (
  <Svg
    width={24}
    height={24}
    viewBox="0 -960 960 960"
    fill={active ? Colors.dark.primary : color}
  >
    <Path d="m480-240-168 72q-40 17-76-6.5T200-241v-519q0-33 23.5-56.5T280-840h400q33 0 56.5 23.5T760-760v519q0 43-36 66.5t-76 6.5l-168-72Zm0-88 200 86v-518H280v518l200-86Zm0-432H280h400-200Z" />
  </Svg>
);

export default BookmarkIcon;
