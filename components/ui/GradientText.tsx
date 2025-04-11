import React, { useState } from "react";
import { View, StyleSheet, Text } from "react-native";
import {
  Svg,
  Text as SvgText,
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
} from "react-native-svg";

const GradientText = ({ text }: { text: string }) => {
  const [textWidth, setTextWidth] = useState(0);

  const onTextLayout = (event: any) => {
    const { width } = event.nativeEvent.layout;
    setTextWidth(width * 0.85);
  };

  return (
    <View style={styles.textContainer}>
      {textWidth > 0 ? (
        <Svg height="40" width={textWidth}>
          <Defs>
            <SvgLinearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor="#8AD4EC" stopOpacity="1" />
              <Stop offset="22%" stopColor="#EF96FF" stopOpacity="1" />
              <Stop offset="54%" stopColor="#FF56A9" stopOpacity="1" />
              <Stop offset="85%" stopColor="#FFAA6C" stopOpacity="1" />
            </SvgLinearGradient>
          </Defs>
          <SvgText
            fill="url(#grad)"
            fontSize="30"
            fontWeight="bold"
            x="0"
            y="30"
            textAnchor="start">
            {text}
          </SvgText>
        </Svg>
      ) : (
        <Text style={styles.hiddenText} onLayout={onTextLayout}>
          {text}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  textContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  hiddenText: {
    fontSize: 30,
    fontWeight: "bold",
    opacity: 0, // Hide the text
    position: "absolute",
  },
});

export default GradientText;
