import React from 'react';
import { View, StyleSheet, Image, Dimensions } from 'react-native';
import Svg, {
  Circle,
  Ellipse,
  G,
  Path,
  Rect,
  Line,
  Defs,
  Pattern,
  Use,
} from 'react-native-svg';

const { width, height } = Dimensions.get('window');

const EducationDoodleBackground = () => {
  return (
    <View style={styles.container}>
      <Svg width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
        <Rect width="100%" height="100%" fill="white" />
        
        <Defs>
          <G id="doodle-set" fill="none" stroke="#2D479D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {/* School bag */}
            <G transform="translate(0, 0)">
              <Path d="M10,40 L10,10 C10,5 15,0 20,0 L40,0 C45,0 50,5 50,10 L50,40 Z" />
              <Path d="M10,15 L50,15" />
              <Path d="M20,5 L40,5" />
            </G>
            
            {/* Book */}
            <G transform="translate(60, 0)">
              <Path d="M0,0 L0,40 L40,40 L40,0 Z" />
              <Path d="M0,0 L40,0" />
              <Path d="M20,0 L20,40" />
            </G>
            
            {/* Pencil */}
            <G transform="translate(110, 0)">
              <Path d="M5,40 L15,10 L25,40" />
              <Path d="M15,10 L15,0" />
              <Path d="M12,5 L18,5" />
            </G>
            
            {/* Notebook */}
            <G transform="translate(140, 0)">
              <Path d="M0,0 L30,0 L30,40 L0,40 Z" />
              <Path d="M5,10 L25,10" />
              <Path d="M5,20 L25,20" />
              <Path d="M5,30 L25,30" />
            </G>
            
            {/* Letter A */}
            <G transform="translate(180, 0)">
              <Path d="M10,40 L20,10 L30,40" />
              <Path d="M15,30 L25,30" />
            </G>
            
            {/* Letter B */}
            <G transform="translate(220, 0)">
              <Path d="M10,10 L10,40" />
              <Path d="M10,10 C20,10 30,15 30,20 C30,25 20,25 10,25" />
              <Path d="M10,25 C20,25 30,30 30,35 C30,40 20,40 10,40" />
            </G>
            
            {/* Letter C */}
            <G transform="translate(260, 0)">
              <Path d="M30,15 C25,10 15,10 10,15 C5,20 5,30 10,35 C15,40 25,40 30,35" />
            </G>
            
            {/* Number 1 */}
            <G transform="translate(300, 0)">
              <Path d="M15,10 L20,5 L20,40" />
              <Path d="M10,40 L30,40" />
            </G>
            
            {/* Number 2 */}
            <G transform="translate(340, 0)">
              <Path d="M10,15 C10,10 15,5 20,5 C25,5 30,10 30,15 C30,25 10,35 10,40 L30,40" />
            </G>
            
            {/* Math symbols */}
            <G transform="translate(380, 0)">
              <Path d="M10,20 L30,20" />
              <Path d="M20,10 L20,30" />
            </G>
            
            <G transform="translate(420, 0)">
              <Path d="M10,10 L30,30" />
              <Path d="M10,30 L30,10" />
            </G>
            
            {/* Atom symbol */}
            <G transform="translate(460, 0)">
              <Circle cx="20" cy="20" r="5" />
              <Ellipse cx="20" cy="20" rx="15" ry="5" />
              <Ellipse cx="20" cy="20" rx="5" ry="15" transform="rotate(45 20 20)" />
            </G>
            
            {/* DNA helix */}
            <G transform="translate(500, 0)">
              <Path d="M10,0 C20,10 30,10 40,0" />
              <Path d="M10,10 C20,20 30,20 40,10" />
              <Path d="M10,20 C20,30 30,30 40,20" />
              <Path d="M10,30 C20,40 30,40 40,30" />
              <Path d="M10,0 L10,30" />
              <Path d="M40,0 L40,30" />
            </G>
            
            {/* Music notes */}
            <G transform="translate(550, 0)">
              <Path d="M10,10 L10,30 L5,35 L5,25 L10,20" />
              <Path d="M20,5 L20,25 L15,30 L15,20 L20,15" />
              <Path d="M10,10 L20,5" />
            </G>
          </G>
          
          {/* Create a pattern that will be repeated */}
          <Pattern id="doodle-pattern" x="0" y="0" width="600" height="100" patternUnits="userSpaceOnUse">
            <Use href="#doodle-set" x="0" y="0" />
          </Pattern>
        </Defs>
        
        {/* Fill the entire background with the pattern */}
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#doodle-pattern)" />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
  },
});

export default EducationDoodleBackground;
