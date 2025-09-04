import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
  } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';


const { width } = Dimensions.get('window');
const isTablet = width > 768;

interface AchievementNotificationProps {
  visible: boolean;
  title: string;
  description: string;
  icon: string;
  reward?: string;
  onClose: () => void;
  onPress: () => void;
}

export const AchievementNotification: React.FC<AchievementNotificationProps> = ({
  visible,
  title,
  description,
  icon,
  reward,
  onClose,
  onPress,
}) => {
  const slideAnim = useRef(new Animated.Value(-width)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto-hide after 5 seconds
      const timer = setTimeout(() => {
        hideNotification();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  const hideNotification = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -width,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [
            { translateX: slideAnim },
            { scale: scaleAnim },
          ],
          opacity: opacityAnim,
        },
      ]}>
      <LinearGradient
        colors={['#4BB543', '#45A03D']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={hideNotification}>
          <Ionicons name="close" size={isTablet ? 24 : 20} color="white" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.content}
          onPress={onPress}
          activeOpacity={0.8}>
          <View style={styles.iconContainer}>
            <Ionicons name={icon as any} size={isTablet ? 40 : 32} color="white" />
            <View style={styles.sparkleContainer}>
              <Ionicons name="sparkles" size={isTablet ? 20 : 16} color="#FFD700" />
            </View>
          </View>

          <View style={styles.textContainer}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.description}>{description}</Text>
            {reward && (
              <View style={styles.rewardContainer}>
                <Ionicons name="gift" size={isTablet ? 18 : 16} color="#FFD700" />
                <Text style={styles.rewardText}>{reward}</Text>
              </View>
            )}
          </View>

          <View style={styles.arrowContainer}>
            <Ionicons name="arrow-forward" size={isTablet ? 24 : 20} color="white" />
          </View>
        </TouchableOpacity>

        {/* Progress bar */}
        <View style={styles.progressBar}>
          <Animated.View
            style={[
              styles.progressFill,
              {
                width: slideAnim.interpolate({
                  inputRange: [-width, 0],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: isTablet ? 80 : 60,
    left: isTablet ? 32 : 20,
    right: isTablet ? 32 : 20,
    zIndex: 1000,
  },
  gradient: {
    borderRadius: isTablet ? 20 : 16,
    padding: isTablet ? 20 : 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: isTablet ? 6 : 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: isTablet ? 12 : 8,
    elevation: isTablet ? 10 : 8,
  },
  closeButton: {
    position: 'absolute',
    top: isTablet ? 12 : 8,
    right: isTablet ? 12 : 8,
    width: isTablet ? 32 : 24,
    height: isTablet ? 32 : 24,
    borderRadius: isTablet ? 16 : 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    position: 'relative',
    width: isTablet ? 64 : 48,
    height: isTablet ? 64 : 48,
    borderRadius: isTablet ? 32 : 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: isTablet ? 16 : 12,
  },
  sparkleContainer: {
    position: 'absolute',
    top: isTablet ? -6 : -4,
    right: isTablet ? -6 : -4,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: isTablet ? 20 : 16,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: isTablet ? 6 : 4,
    lineHeight: isTablet ? 26 : 20,
  },
  description: {
    fontSize: isTablet ? 16 : 14,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: isTablet ? 22 : 18,
  },
  rewardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: isTablet ? 8 : 6,
  },
  rewardText: {
    fontSize: isTablet ? 14 : 12,
    color: '#FFD700',
    fontWeight: '600',
    marginLeft: isTablet ? 6 : 4,
  },
  arrowContainer: {
    width: isTablet ? 40 : 32,
    height: isTablet ? 40 : 32,
    borderRadius: isTablet ? 20 : 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: isTablet ? 4 : 3,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderBottomLeftRadius: isTablet ? 20 : 16,
    borderBottomRightRadius: isTablet ? 20 : 16,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
  },
});

export default AchievementNotification;
