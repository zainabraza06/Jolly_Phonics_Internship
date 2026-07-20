import React, { useEffect, useRef } from 'react';
import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Image,
  Easing,
} from 'react-native';

import LottieView from 'lottie-react-native';

const { width, height } = Dimensions.get('window');

const WelcomeScreen = ({ navigation }) => {
  // Animated values for illustrations
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  // For animated slides
  const slideAnim = [useRef(new Animated.Value(1)).current, useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current];
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    let slideIndex = 0;
    slideAnim.forEach((anim, i) => anim.setValue(i === 0 ? 1 : 0));
    const interval = setInterval(() => {
      const prevIndex = slideIndex;
      slideIndex = (slideIndex + 1) % 3;
      Animated.timing(slideAnim[prevIndex], {
        toValue: 0,
        duration: 700,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }).start();
      Animated.timing(slideAnim[slideIndex], {
        toValue: 1,
        duration: 700,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }).start();
      setCurrentSlide(slideIndex);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let bounceLoop, pulseLoop, rotateLoop;
    // Slide 1 bounce
    if (currentSlide === 0) {
      bounceLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(bounceAnim, { toValue: -20, duration: 500, useNativeDriver: true }),
          Animated.timing(bounceAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
        ])
      );
      bounceLoop.start();
    }
    // Slide 2 pulse
    if (currentSlide === 1) {
      pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.1, duration: 500, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        ])
      );
      pulseLoop.start();
    }
    // Slide 3 rotate
    if (currentSlide === 2) {
      rotateLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(rotateAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
          Animated.timing(rotateAnim, { toValue: -1, duration: 500, useNativeDriver: true }),
          Animated.timing(rotateAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
        ])
      );
      rotateLoop.start();
    }
    // Cleanup animations on slide change
    return () => {
      if (bounceLoop) bounceLoop.stop();
      if (pulseLoop) pulseLoop.stop();
      if (rotateLoop) rotateLoop.stop();
      bounceAnim.setValue(0);
      pulseAnim.setValue(1);
      rotateAnim.setValue(0);
    };
  }, [currentSlide]);

  // Animation values
  const kidBounceAnim = useRef(new Animated.Value(0)).current;
  const laptopGlowAnim = useRef(new Animated.Value(0)).current;
  const buttonScaleAnim = useRef(new Animated.Value(1)).current;
  const buttonOpacityAnim = useRef(new Animated.Value(0)).current;
  const buttonTranslateYAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    // Start kid bouncing animation
    const startKidBouncing = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(kidBounceAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(kidBounceAnim, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    // Start laptop glow animation
    const startLaptopGlow = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(laptopGlowAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: false,
          }),
          Animated.timing(laptopGlowAnim, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: false,
          }),
        ])
      ).start();
    };

    startKidBouncing();
    startLaptopGlow();

    // Start button entrance animations
    Animated.parallel([
      Animated.timing(buttonOpacityAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(buttonTranslateYAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, [kidBounceAnim, laptopGlowAnim, buttonOpacityAnim, buttonTranslateYAnim]);

  // Interpolate kid bounce animation
  const kidBounceInterpolate = kidBounceAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -8],
  });

  // Interpolate laptop glow animation
  const laptopGlowInterpolate = laptopGlowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.1],
  });

  const handleButtonPress = (callback) => {
    // Button press animation
    Animated.sequence([
      Animated.timing(buttonScaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(() => {
      callback();
    });
  };

  const handleNewUser = () => {
    navigation.navigate('SignUp');
  };

  const handleExistingUser = () => {
    navigation.navigate('Login');
  };

  return (
    <View style={styles.container}>
      <View style={styles.slideContainer}>
        {/* Slide 1 */}
        <Animated.View style={[styles.slide, styles.slide1, { opacity: slideAnim[0] }]}> 
          <View style={styles.illustrationBox}>
            <LottieView
              source={require('../assets/welcome1.json')}
              autoPlay
              loop
              style={styles.illustrationImg}
            />
          </View>
          <View style={styles.dividerLine} />
          <View style={styles.bottomBox}>
            <Text style={styles.slideTitle}>Welcome !</Text>
            <Text style={styles.slideText}>Say it. Show it. Learn it!</Text>
            <Text></Text>
            <Animated.View
              style={[
                styles.buttonContainer,
                {
                  opacity: buttonOpacityAnim,
                  transform: [
                    { translateY: buttonTranslateYAnim },
                    { scale: buttonScaleAnim }
                  ],
                },
              ]}
            >
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => handleButtonPress(handleNewUser)}
                activeOpacity={0.8}
              >
                <Text style={styles.primaryButtonText}>I'm new at PhonicNest</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => handleButtonPress(handleExistingUser)}
                activeOpacity={0.8}
              >
                <Text style={styles.secondaryButtonText}>I already have an Account</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </Animated.View>

        {/* Slide 2 */}
        <Animated.View style={[styles.slide, styles.slide2, { opacity: slideAnim[1], position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }]}> 
          <View style={styles.illustrationBox}>
            <LottieView
              source={require('../assets/welcome2.json')}
              autoPlay
              loop
              style={styles.illustrationImg}
            />
          </View>
          <View style={styles.dividerLine} />
          <View style={styles.bottomBox}>
            <Text style={styles.slideTitle}>Welcome !</Text>
            <Text style={styles.slideText}>Say it. Show it. Learn it!</Text>
            <Text></Text>
            <Animated.View
              style={[
                styles.buttonContainer,
                {
                  opacity: buttonOpacityAnim,
                  transform: [
                    { translateY: buttonTranslateYAnim },
                    { scale: buttonScaleAnim }
                  ],
                },
              ]}
            >
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => handleButtonPress(handleNewUser)}
                activeOpacity={0.8}
              >
                <Text style={[styles.primaryButtonText, { color: '#7B5CD6' }]}>
                  I'm new at PhonicNest
                </Text>

              </TouchableOpacity>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => handleButtonPress(handleExistingUser)}
                activeOpacity={0.8}
              >
                <Text style={styles.secondaryButtonText}>I already have an Account</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </Animated.View>

        {/* Slide 3 */}
        <Animated.View style={[styles.slide, styles.slide3, { opacity: slideAnim[2], position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }]}> 
          <View style={styles.illustrationBox}>
            <LottieView
              source={require('../assets/welcome3.json')}
              autoPlay
              loop
              style={styles.illustrationImg}
            />
          </View>
          <View style={styles.dividerLine} />
          <View style={styles.bottomBox}>
            <Text style={styles.slideTitle}>Welcome !</Text>
            <Text style={styles.slideText}>Say it. Show it. Learn it!</Text>
            <Text></Text>
            <Animated.View
              style={[
                styles.buttonContainer,
                {
                  opacity: buttonOpacityAnim,
                  transform: [
                    { translateY: buttonTranslateYAnim },
                    { scale: buttonScaleAnim }
                  ],
                },
              ]}
            >
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => handleButtonPress(handleNewUser)}
                activeOpacity={0.8}
              >
                <Text style={[styles.primaryButtonText, { color: '#5D3FD3' }]}>
                  I'm new at PhonicNest
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => handleButtonPress(handleExistingUser)}
                activeOpacity={0.8}
              >
                <Text style={styles.secondaryButtonText}>I already have an Account</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  illustrationImg: {
    width: 160,
    height: 160,
  },
  slide1: {
    backgroundColor: '#2346A0',
  },
  slide2: {
    backgroundColor: '#7B5CD6',
  },
  slide3: {
    backgroundColor: '#5D3FD3',
  },
  illustrationBox: {
    flex: 0.5,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  illustrationPlaceholder1: {
    width: 160,
    height: 160,
    backgroundColor: '#FF8C42',
    borderRadius: 30,
  },
  illustrationPlaceholder2: {
    width: 160,
    height: 160,
    backgroundColor: '#F7C948',
    borderRadius: 80,
  },
  illustrationPlaceholder3: {
    width: 160,
    height: 160,
    backgroundColor: '#6DD3FA',
    borderRadius: 80,
  },
  dividerLine: {
    height: 2,
    backgroundColor: 'white',
    width: '100%',
  },
  bottomBox: {
    flex: 0.5,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 30,
  },
  slideContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    backgroundColor: '#2D479D',
  },
  slide: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  slideTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
  },
  slideText: {
    fontSize: 18,
    color: 'white',
    textAlign: 'center',
    marginHorizontal: 30,
  },
  container: {
    flex: 1,
    backgroundColor: '#2D479D',
  },
  illustrationSection: {
    flex: 0.4,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  kidContainer: {
    alignItems: 'center',
    zIndex: 2,
  },
  kidHead: {
    width: 40,
    height: 40,
    backgroundColor: '#FFE4B5',
    borderRadius: 20,
    position: 'relative',
    marginBottom: 10,
  },
  kidFace: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: 8,
  },
  kidEye: {
    width: 6,
    height: 6,
    backgroundColor: '#000000',
    borderRadius: 3,
    marginHorizontal: 2,
  },
  kidMouth: {
    width: 12,
    height: 6,
    backgroundColor: '#FF6B6B',
    borderRadius: 3,
    position: 'absolute',
    bottom: 8,
  },
  kidPonytail: {
    width: 8,
    height: 20,
    backgroundColor: '#000000',
    borderRadius: 4,
    position: 'absolute',
    top: -5,
    right: -2,
    transform: [{ rotate: '15deg' }],
  },
  kidBody: {
    width: 80,
    height: 100,
    backgroundColor: '#FF8C42',
    borderRadius: 40,
    position: 'relative',
    marginBottom: 20,
  },
  kidArmLeft: {
    width: 20,
    height: 8,
    backgroundColor: '#FF8C42',
    borderRadius: 4,
    position: 'absolute',
    left: -15,
    top: 30,
    transform: [{ rotate: '-45deg' }],
  },
  kidArmRight: {
    width: 20,
    height: 8,
    backgroundColor: '#FF8C42',
    borderRadius: 4,
    position: 'absolute',
    right: -15,
    top: 30,
    transform: [{ rotate: '45deg' }],
  },
  kidLegLeft: {
    width: 8,
    height: 30,
    backgroundColor: '#FF8C42',
    borderRadius: 4,
    position: 'absolute',
    bottom: -25,
    left: 25,
  },
  kidLegRight: {
    width: 8,
    height: 30,
    backgroundColor: '#FF8C42',
    borderRadius: 4,
    position: 'absolute',
    bottom: -25,
    right: 25,
  },
  laptop: {
    position: 'absolute',
    bottom: -40,
    zIndex: 1,
  },
  laptopScreen: {
    width: 60,
    height: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
  },
  laptopDot: {
    width: 8,
    height: 8,
    backgroundColor: '#FF8C42',
    borderRadius: 4,
  },
  laptopBase: {
    width: 70,
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
  },
  backgroundElements: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  chairOutline: {
    width: 100,
    height: 60,
    borderWidth: 2,
    borderColor: '#000000',
    borderRadius: 30,
    position: 'absolute',
    bottom: 20,
    left: '50%',
    marginLeft: -50,
  },
  frameLine1: {
    width: 40,
    height: 2,
    backgroundColor: '#FF8C42',
    position: 'absolute',
    top: 30,
    left: '50%',
    marginLeft: -20,
    transform: [{ rotate: '45deg' }],
  },
  frameLine2: {
    width: 40,
    height: 2,
    backgroundColor: '#000000',
    position: 'absolute',
    top: 30,
    right: '50%',
    marginRight: -20,
    transform: [{ rotate: '-45deg' }],
  },
  divider: {
    height: 1,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 40,
    marginVertical: 20,
  },
  contentSection: {
    flex: 0.6,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  welcomeText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
    fontFamily: 'System',
  },
  taglineText: {
    fontSize: 18,
    color: '#FFFFFF',
    marginBottom: 30,
    textAlign: 'center',
    fontFamily: 'System',
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 25,
    width: '100%',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  primaryButtonText: {
    color: '#2D479D',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    fontFamily: 'System',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 25,
    width: '100%',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  secondaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    fontFamily: 'System',
  },
});

export default WelcomeScreen;
