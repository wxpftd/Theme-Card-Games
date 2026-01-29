import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  Dimensions,
  ScrollView,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  withDelay,
  withRepeat,
  Easing,
  FadeIn,
  SlideInUp,
  SlideInDown,
} from 'react-native-reanimated';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useTheme, LanguageSwitcher, useI18n } from '@theme-card-games/ui';
import { getRandomTip, loadingTips } from '@theme-card-games/theme-bigtech-worker';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const homeBgImage = require('../assets/images/home_bg.png');

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export default function HomeScreen() {
  const { theme, config, t } = useTheme();
  const { t: uiT } = useI18n();
  const [currentTip, setCurrentTip] = useState('');
  const [showContent, setShowContent] = useState(false);

  // 动画值
  const logoScale = useSharedValue(0.5);
  const logoRotate = useSharedValue(-10);
  const titleOpacity = useSharedValue(0);
  const cardFloat = useSharedValue(0);
  const buttonScale = useSharedValue(1);

  // 初始化动画
  useEffect(() => {
    // 随机提示
    setCurrentTip(getRandomTip(loadingTips));

    // Logo 弹出动画
    logoScale.value = withSpring(1, { damping: 8, stiffness: 100 });
    logoRotate.value = withSequence(
      withTiming(10, { duration: 200 }),
      withTiming(-5, { duration: 150 }),
      withTiming(0, { duration: 100 })
    );

    // 标题淡入
    titleOpacity.value = withDelay(300, withTiming(1, { duration: 500 }));

    // 卡牌浮动动画
    cardFloat.value = withRepeat(
      withSequence(
        withTiming(-8, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(8, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    // 延迟显示内容
    setTimeout(() => setShowContent(true), 100);
  }, []);

  // 动画样式
  const logoAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }, { rotate: `${logoRotate.value}deg` }],
  }));

  const titleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
  }));

  const floatingCardStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: cardFloat.value }],
  }));

  // 按钮按下效果
  const handlePressIn = useCallback(() => {
    buttonScale.value = withSpring(0.95, { damping: 15 });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const handlePressOut = useCallback(() => {
    buttonScale.value = withSpring(1, { damping: 15 });
  }, []);

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const handleStartGame = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/game');
  }, []);

  const handleTutorial = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/tutorial');
  }, []);

  const handleLesson = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/tutorial-game' as '/game');
  }, []);

  return (
    <ImageBackground
      source={homeBgImage}
      style={styles.backgroundImage}
      imageStyle={{ opacity: 0.6 }}
    >
      <ScrollView
        testID="home-screen"
        style={[styles.container]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Language Switcher */}
        <View style={styles.languageSwitcher}>
          <LanguageSwitcher mode="compact" />
        </View>

        {/* Logo / Title Area */}
        {showContent && (
          <Animated.View style={styles.header} entering={FadeIn.duration(500)}>
            {/* 浮动装饰卡牌 */}
            <Animated.View
              style={[styles.floatingCard, styles.floatingCardLeft, floatingCardStyle]}
            >
              <Text style={styles.floatingCardEmoji}>☕</Text>
            </Animated.View>
            <Animated.View
              style={[styles.floatingCard, styles.floatingCardRight, floatingCardStyle]}
            >
              <Text style={styles.floatingCardEmoji}>💼</Text>
            </Animated.View>

            {/* 主 Logo */}
            <Animated.View style={[styles.logoContainer, logoAnimatedStyle]}>
              <View style={[styles.logoBg, { backgroundColor: theme.colors.primary + '15' }]}>
                <Text style={styles.emoji}>🏢</Text>
              </View>
              <View style={styles.logoGlow} />
            </Animated.View>

            <Animated.View style={titleAnimatedStyle}>
              <Text testID="game-title" style={[styles.title, { color: theme.colors.text }]}>
                {t('game.title')}
              </Text>
              <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
                {t('game.subtitle')}
              </Text>
            </Animated.View>
          </Animated.View>
        )}

        {/* Description Card */}
        {showContent && (
          <Animated.View
            style={[styles.descriptionCard, { backgroundColor: theme.colors.surface + 'F0' }]}
            entering={SlideInUp.delay(200).duration(400).springify()}
          >
            <Text style={[styles.descText, { color: theme.colors.textSecondary }]}>
              {config.description}
            </Text>
          </Animated.View>
        )}

        {/* Stats Preview */}
        {showContent && (
          <Animated.View
            style={[styles.previewCard, { backgroundColor: theme.colors.surface + 'F5' }]}
            entering={SlideInUp.delay(300).duration(400).springify()}
          >
            <View style={styles.previewHeader}>
              <Text style={[styles.previewTitle, { color: theme.colors.text }]}>
                {t('theme.description')}
              </Text>
              <View style={[styles.previewBadge, { backgroundColor: theme.colors.primary + '20' }]}>
                <Text style={[styles.previewBadgeText, { color: theme.colors.primary }]}>
                  v{config.version}
                </Text>
              </View>
            </View>

            {/* Stats Grid */}
            <View style={styles.statsGrid}>
              {config.stats.map((stat, index) => (
                <Animated.View
                  key={stat.id}
                  style={[styles.statItem, { backgroundColor: theme.colors.background }]}
                  entering={FadeIn.delay(400 + index * 100).duration(300)}
                >
                  <Text style={styles.statEmoji}>{stat.icon}</Text>
                  <Text style={[styles.statName, { color: theme.colors.text }]}>{stat.name}</Text>
                  <View style={[styles.statBar, { backgroundColor: theme.colors.primary + '30' }]}>
                    <View
                      style={[
                        styles.statBarFill,
                        {
                          backgroundColor: theme.colors.primary,
                          width: `${50 + Math.random() * 30}%`,
                        },
                      ]}
                    />
                  </View>
                </Animated.View>
              ))}
            </View>

            {/* Resources Row */}
            <View style={styles.resourcesRow}>
              {config.resources.map((resource, index) => (
                <Animated.View
                  key={resource.id}
                  style={[styles.resourceItem, { backgroundColor: theme.colors.background }]}
                  entering={FadeIn.delay(600 + index * 100).duration(300)}
                >
                  <Text style={styles.resourceEmoji}>{resource.icon}</Text>
                  <Text style={[styles.resourceName, { color: theme.colors.textSecondary }]}>
                    {resource.name}
                  </Text>
                </Animated.View>
              ))}
            </View>
          </Animated.View>
        )}

        {/* Action Buttons */}
        {showContent && (
          <Animated.View style={styles.actions} entering={SlideInDown.delay(500).duration(400)}>
            {/* Main Start Button */}
            <AnimatedTouchable
              testID="start-game-button"
              style={[
                styles.button,
                styles.primaryButton,
                { backgroundColor: theme.colors.primary },
              ]}
              onPress={handleStartGame}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              activeOpacity={0.9}
            >
              <Animated.View style={[styles.buttonContent, buttonAnimatedStyle]}>
                <Text style={styles.buttonIcon}>🎮</Text>
                <Text style={styles.buttonText}>{t('game.start')}</Text>
              </Animated.View>
              <View style={styles.buttonShine} />
            </AnimatedTouchable>

            {/* Secondary Buttons Row */}
            <View style={styles.secondaryButtonsRow}>
              <TouchableOpacity
                testID="tutorial-button"
                style={[
                  styles.button,
                  styles.secondaryButton,
                  { borderColor: theme.colors.primary, flex: 1 },
                ]}
                onPress={handleTutorial}
                activeOpacity={0.8}
              >
                <Text style={styles.secondaryButtonIcon}>📖</Text>
                <Text style={[styles.secondaryButtonText, { color: theme.colors.primary }]}>
                  {uiT('common.tutorial')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                testID="lesson-button"
                style={[
                  styles.button,
                  styles.lessonButton,
                  { backgroundColor: theme.colors.warning, flex: 1 },
                ]}
                onPress={handleLesson}
                activeOpacity={0.8}
              >
                <Text style={styles.secondaryButtonIcon}>📚</Text>
                <Text style={styles.lessonButtonText}>加班的代价</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}

        {/* Fun Tip */}
        {showContent && currentTip && (
          <Animated.View
            style={[styles.tipContainer, { backgroundColor: theme.colors.surface + '80' }]}
            entering={FadeIn.delay(700).duration(400)}
          >
            <Text style={[styles.tipText, { color: theme.colors.textSecondary }]}>
              {currentTip}
            </Text>
          </Animated.View>
        )}
      </ScrollView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  languageSwitcher: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 20,
  },
  floatingCard: {
    position: 'absolute',
    width: 50,
    height: 70,
    backgroundColor: '#fff',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  floatingCardLeft: {
    left: SCREEN_WIDTH * 0.08,
    top: 20,
    transform: [{ rotate: '-15deg' }],
  },
  floatingCardRight: {
    right: SCREEN_WIDTH * 0.08,
    top: 30,
    transform: [{ rotate: '12deg' }],
  },
  floatingCardEmoji: {
    fontSize: 24,
  },
  logoContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  logoBg: {
    width: 120,
    height: 120,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoGlow: {
    position: 'absolute',
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    borderRadius: 40,
    backgroundColor: 'rgba(25, 118, 210, 0.1)',
    zIndex: -1,
  },
  emoji: {
    fontSize: 64,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 16,
    marginTop: 8,
    textAlign: 'center',
  },
  descriptionCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  descText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },
  previewCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  previewBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  previewBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    minWidth: '45%',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  statEmoji: {
    fontSize: 28,
    marginBottom: 6,
  },
  statName: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  statBar: {
    width: '100%',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  statBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  resourcesRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 10,
  },
  resourceItem: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
  },
  resourceEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  resourceName: {
    fontSize: 11,
  },
  actions: {
    gap: 12,
    marginBottom: 16,
  },
  button: {
    borderRadius: 28,
    overflow: 'hidden',
  },
  primaryButton: {
    paddingVertical: 18,
    shadowColor: '#1976D2',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  buttonIcon: {
    fontSize: 22,
  },
  buttonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  buttonShine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  secondaryButtonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  secondaryButtonIcon: {
    fontSize: 18,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  lessonButton: {
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  lessonButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  tipContainer: {
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  tipText: {
    fontSize: 13,
    fontStyle: 'italic',
  },
});
