import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated, // ✅ fixed import
} from 'react-native';
import LottieView from 'lottie-react-native';

const { width, height } = Dimensions.get('window');

const SplashScreen = ({ navigation }) => {
  // Animation values
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const emojiOpacityAnim = useRef(new Animated.Value(0)).current;
  const emojiTranslateYAnim = useRef(new Animated.Value(50)).current;
  const emojiScaleAnim = useRef(new Animated.Value(0.8)).current;
  const textOpacityAnim = useRef(new Animated.Value(0)).current;
  const textTranslateYAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    // Start bouncing animation
    const startBouncing = () => {
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1.1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start(() => {
        startBouncing();
      });
    };

    // Start rotating animation
    const startRotating = () => {
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        })
      ).start();
    };

    startBouncing();
    startRotating();

    // Start entrance animations
    Animated.parallel([
      Animated.timing(emojiOpacityAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(emojiTranslateYAnim, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(emojiScaleAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start();

    // Animate text after emoji animation
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(textOpacityAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(textTranslateYAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ]).start();
    }, 300);

    const timer = setTimeout(() => {
      navigation.replace('Welcome');
    }, 3000);

    return () => clearTimeout(timer);
  }, [
    navigation,
    bounceAnim,
    scaleAnim,
    rotateAnim,
    emojiOpacityAnim,
    emojiTranslateYAnim,
    emojiScaleAnim,
    textOpacityAnim,
    textTranslateYAnim,
  ]);

  const bounceInterpolate = bounceAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -20],
  });

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      {/* Lottie animation only */}
      <LottieView
        source={require('../assets/yay-jump.json')}
        autoPlay
        loop
        style={styles.splashLottie}
      />
      <Animated.View
        style={[
          styles.textContainer,
          {
            opacity: textOpacityAnim,
            transform: [{ translateY: textTranslateYAnim }],
          },
        ]}
      >
        <Text style={styles.appLogoText}>Jholly Phonics</Text>
        <Text style={styles.byText}>by Murabbi</Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  splashLottie: {
    position: 'absolute',
    width: 150,
    height: 148,
    left: width / 2 - 75, // 150px/2
    top: 431,
    zIndex: 10,
  },
  container: {
    flex: 1,
    backgroundColor: '#2D479D',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emojiContainer: {
    alignItems: 'center',
    marginBottom: height * 0.1,
  },
  emojiBody: {
    width: 120,
    height: 120,
    backgroundColor: '#FF8C42',
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  eyesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 60,
    marginBottom: 10,
  },
  eye: {
    width: 20,
    height: 25,
    backgroundColor: '#FFFFFF',
    borderRadius: 12.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pupil: {
    width: 12,
    height: 12,
    backgroundColor: '#000000',
    borderRadius: 6,
  },
  mouth: {
    width: 50,
    height: 30,
    position: 'relative',
  },
  mouthInner: {
    width: 50,
    height: 30,
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  tongue: {
    width: 20,
    height: 15,
    backgroundColor: '#FF6B6B',
    borderRadius: 10,
    position: 'absolute',
    bottom: 0,
    left: 15,
  },
  hat: {
    width: 30,
    height: 15,
    backgroundColor: '#34495E',
    borderRadius: 15,
    position: 'absolute',
    top: -5,
    right: 10,
    transform: [{ rotate: '15deg' }],
  },
  armLeft: {
    width: 25,
    height: 8,
    backgroundColor: '#FF8C42',
    borderRadius: 4,
    position: 'absolute',
    left: -20,
    top: 40,
    transform: [{ rotate: '-30deg' }],
  },
  armRight: {
    width: 25,
    height: 8,
    backgroundColor: '#FF8C42',
    borderRadius: 4,
    position: 'absolute',
    right: -20,
    top: 40,
    transform: [{ rotate: '30deg' }],
  },
  legLeft: {
    width: 8,
    height: 25,
    backgroundColor: '#FF8C42',
    borderRadius: 4,
    position: 'absolute',
    bottom: -20,
    left: 35,
  },
  legRight: {
    width: 8,
    height: 25,
    backgroundColor: '#FF8C42',
    borderRadius: 4,
    position: 'absolute',
    bottom: -20,
    right: 35,
  },
  shadow: {
    width: 80,
    height: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 7.5,
    marginTop: 10,
  },
  textContainer: {
    alignItems: 'center',
    position: 'absolute',
    bottom: height * 0.2,
  },
  appLogoText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    fontFamily: 'System',
  },
  byText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontFamily: 'System',
  },
});

export default SplashScreen;
