import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  Modal,
  ScrollView,
  ImageBackground,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withDelay,
  withTiming,
  FadeIn,
  SlideInUp,
} from 'react-native-reanimated';
import {
  PlayerState,
  StatDefinition,
  ResourceDefinition,
  SurvivalReportShareCard,
  BattleReportShareCard,
} from '@theme-card-games/core';
import { useTheme } from '../theme/ThemeContext';
import { useI18n } from '../i18n';
import { SurvivalReportCard } from './share/SurvivalReportCard';
import { BattleReportCard } from './share/BattleReportCard';
import { ShareCardContainerRef } from './share/ShareCardContainer';
import { UseShareServiceReturn } from '../hooks/useShareService';
import { getStatColor } from '../theme/enhancedStyles';

const _dimensions = Dimensions.get('window');

interface EnhancedGameOverScreenProps {
  winner: PlayerState | null;
  reason?: string;
  player: PlayerState;
  statDefinitions: StatDefinition[];
  resourceDefinitions: ResourceDefinition[];
  onRestart?: () => void;
  onMainMenu?: () => void;
  style?: ViewStyle;
  /** 生存报告分享卡数据 (单人模式) */
  survivalReportData?: SurvivalReportShareCard;
  /** 对战战报分享卡数据 (多人模式) */
  battleReportData?: BattleReportShareCard;
  /** 分享服务 (由 app 层提供) */
  shareService?: UseShareServiceReturn;
  /** 胜利背景图片 */
  victoryBackground?: string;
  /** 失败背景图片 */
  defeatBackground?: string;
}

const AnimatedView = Animated.createAnimatedComponent(View);
const AnimatedText = Animated.createAnimatedComponent(Text);

export function EnhancedGameOverScreen({
  winner,
  reason,
  player,
  statDefinitions,
  resourceDefinitions,
  onRestart,
  onMainMenu,
  style,
  survivalReportData,
  battleReportData,
  shareService,
  victoryBackground,
  defeatBackground,
}: EnhancedGameOverScreenProps) {
  const { theme } = useTheme();
  const { t } = useI18n();
  const [showShareModal, setShowShareModal] = useState(false);
  const shareCardRef = useRef<ShareCardContainerRef>(null);

  const isWinner = winner?.id === player.id;
  const hasShareData = survivalReportData || battleReportData;
  const backgroundImage = isWinner ? victoryBackground : defeatBackground;

  // 动画值
  const titleScale = useSharedValue(0);
  const emojiRotate = useSharedValue(0);
  const statsOpacity = useSharedValue(0);

  useEffect(() => {
    // 标题弹出动画
    titleScale.value = withSpring(1, { damping: 8, stiffness: 100 });

    // 表情旋转动画
    if (isWinner) {
      emojiRotate.value = withSequence(
        withTiming(-15, { duration: 150 }),
        withTiming(15, { duration: 150 }),
        withTiming(-10, { duration: 100 }),
        withTiming(10, { duration: 100 }),
        withTiming(0, { duration: 100 })
      );
    }

    // 统计数据淡入
    statsOpacity.value = withDelay(500, withTiming(1, { duration: 400 }));
  }, [isWinner]);

  const titleAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: titleScale.value }],
  }));

  const emojiAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${emojiRotate.value}deg` }],
  }));

  const statsAnimatedStyle = useAnimatedStyle(() => ({
    opacity: statsOpacity.value,
  }));

  const handleShare = async () => {
    if (!shareService) {
      setShowShareModal(true);
      return;
    }
    const success = await shareService.captureAndShare(shareCardRef, t('share.dialogTitle'));
    if (!success && shareService.error) {
      // 错误由 shareService 处理
    }
  };

  const handleSave = async () => {
    if (!shareService) {
      setShowShareModal(true);
      return;
    }
    await shareService.saveToGallery(shareCardRef);
  };

  const handleOpenShareModal = () => {
    setShowShareModal(true);
  };

  const handleCloseShareModal = () => {
    setShowShareModal(false);
  };

  const renderContent = () => (
    <View style={[styles.container, { backgroundColor: theme.colors.background }, style]}>
      <AnimatedView
        style={[styles.card, { backgroundColor: theme.colors.surface }]}
        entering={SlideInUp.duration(500).springify()}
      >
        {/* Result Header */}
        <AnimatedView
          style={[
            styles.header,
            {
              backgroundColor: isWinner ? theme.colors.success : theme.colors.error,
            },
            titleAnimatedStyle,
          ]}
        >
          <AnimatedText style={[styles.emoji, emojiAnimatedStyle]}>
            {isWinner ? '🎉' : '😢'}
          </AnimatedText>
          <Text style={styles.resultText}>
            {isWinner ? t('gameOver.victory') : t('gameOver.defeat')}
          </Text>
          {isWinner && (
            <View style={styles.confettiContainer}>
              {[...Array(6)].map((_, i) => (
                <AnimatedView
                  key={i}
                  style={[
                    styles.confetti,
                    {
                      backgroundColor: [
                        '#FFD700',
                        '#FF6B6B',
                        '#4ECDC4',
                        '#9B59B6',
                        '#FF9800',
                        '#4CAF50',
                      ][i],
                      left: `${15 + i * 14}%`,
                    },
                  ]}
                  entering={FadeIn.delay(200 + i * 100).duration(300)}
                />
              ))}
            </View>
          )}
        </AnimatedView>

        {/* Reason */}
        {reason && (
          <AnimatedView entering={FadeIn.delay(300).duration(400)}>
            <Text style={[styles.reason, { color: theme.colors.textSecondary }]}>{reason}</Text>
          </AnimatedView>
        )}

        {/* Final Stats */}
        <AnimatedView style={[styles.statsSection, statsAnimatedStyle]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            {t('gameOver.finalStats')}
          </Text>

          <View style={styles.statsGrid}>
            {statDefinitions.map((stat, index) => {
              const value = player.stats[stat.id] ?? 0;
              const statColor = getStatColor(stat.id, value, stat.max);
              return (
                <AnimatedView
                  key={stat.id}
                  style={styles.statRow}
                  entering={SlideInUp.delay(600 + index * 100).duration(300)}
                >
                  <Text style={styles.statIcon}>{stat.icon}</Text>
                  <Text style={[styles.statName, { color: theme.colors.text }]}>{stat.name}</Text>
                  <View style={[styles.statValueContainer, { backgroundColor: statColor + '20' }]}>
                    <Text style={[styles.statValue, { color: statColor }]}>{value}</Text>
                  </View>
                </AnimatedView>
              );
            })}
          </View>

          <View style={styles.resourcesGrid}>
            {resourceDefinitions.map((resource, index) => {
              const value = player.resources[resource.id] ?? 0;
              return (
                <AnimatedView
                  key={resource.id}
                  style={[styles.resourceItem, { backgroundColor: theme.colors.background }]}
                  entering={FadeIn.delay(900 + index * 100).duration(300)}
                >
                  <Text style={styles.resourceIcon}>{resource.icon}</Text>
                  <Text style={[styles.resourceValue, { color: theme.colors.text }]}>{value}</Text>
                  <Text style={[styles.resourceName, { color: theme.colors.textSecondary }]}>
                    {resource.name}
                  </Text>
                </AnimatedView>
              );
            })}
          </View>
        </AnimatedView>

        {/* Actions */}
        <View style={styles.actions}>
          {/* Share Button */}
          {hasShareData && (
            <TouchableOpacity
              style={[styles.button, styles.shareButton, { backgroundColor: theme.colors.accent }]}
              onPress={handleOpenShareModal}
            >
              <Text style={styles.shareButtonText}>📤 {t('gameOver.shareResult')}</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.button, styles.primaryButton, { backgroundColor: theme.colors.primary }]}
            onPress={onRestart}
          >
            <Text style={styles.primaryButtonText}>🔄 {t('gameOver.playAgain')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.secondaryButton, { borderColor: theme.colors.primary }]}
            onPress={onMainMenu}
          >
            <Text style={[styles.secondaryButtonText, { color: theme.colors.primary }]}>
              🏠 {t('gameOver.mainMenu')}
            </Text>
          </TouchableOpacity>
        </View>
      </AnimatedView>

      {/* Share Modal */}
      <Modal
        visible={showShareModal}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCloseShareModal}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                {t('gameOver.sharePreview')}
              </Text>
              <TouchableOpacity onPress={handleCloseShareModal}>
                <Text style={[styles.modalClose, { color: theme.colors.textSecondary }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalScroll}
              contentContainerStyle={styles.modalScrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Share Card Preview */}
              {survivalReportData && (
                <SurvivalReportCard
                  data={survivalReportData}
                  statDefinitions={statDefinitions}
                  resourceDefinitions={resourceDefinitions}
                  containerRef={shareCardRef}
                />
              )}
              {battleReportData && (
                <BattleReportCard
                  data={battleReportData}
                  statDefinitions={statDefinitions}
                  containerRef={shareCardRef}
                />
              )}
            </ScrollView>

            {/* Share Actions */}
            <View style={styles.modalActions}>
              {shareService && (
                <>
                  <TouchableOpacity
                    style={[
                      styles.button,
                      styles.modalButton,
                      { backgroundColor: theme.colors.primary },
                    ]}
                    onPress={handleShare}
                    disabled={shareService.isSharing}
                  >
                    <Text style={styles.primaryButtonText}>
                      {shareService.isSharing ? t('share.sharing') : `📤 ${t('share.share')}`}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.button,
                      styles.modalButton,
                      styles.secondaryButton,
                      { borderColor: theme.colors.primary },
                    ]}
                    onPress={handleSave}
                    disabled={shareService.isSaving}
                  >
                    <Text style={[styles.secondaryButtonText, { color: theme.colors.primary }]}>
                      {shareService.isSaving ? t('share.saving') : `💾 ${t('share.saveToGallery')}`}
                    </Text>
                  </TouchableOpacity>
                </>
              )}
              {!shareService && (
                <Text style={[styles.noShareServiceText, { color: theme.colors.textSecondary }]}>
                  {t('share.notAvailable')}
                </Text>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );

  // 如果有背景图片，使用 ImageBackground 包裹
  if (backgroundImage) {
    return (
      <ImageBackground
        source={{ uri: backgroundImage }}
        style={styles.backgroundImage}
        imageStyle={{ opacity: 0.3 }}
      >
        {renderContent()}
      </ImageBackground>
    );
  }

  return renderContent();
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    borderRadius: 20,
    overflow: 'hidden',
    width: '100%',
    maxWidth: 380,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 28,
    position: 'relative',
    overflow: 'hidden',
  },
  confettiContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 20,
  },
  confetti: {
    position: 'absolute',
    width: 8,
    height: 20,
    borderRadius: 2,
    transform: [{ rotate: '15deg' }],
  },
  emoji: {
    fontSize: 56,
    marginBottom: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  resultText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  reason: {
    textAlign: 'center',
    fontSize: 14,
    paddingHorizontal: 24,
    paddingVertical: 16,
    lineHeight: 22,
  },
  statsSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  statsGrid: {
    gap: 10,
    marginBottom: 20,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  statIcon: {
    fontSize: 20,
    width: 28,
    textAlign: 'center',
  },
  statName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
  statValueContainer: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 50,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  resourcesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
  },
  resourceItem: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    minWidth: 75,
  },
  resourceIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  resourceValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  resourceName: {
    fontSize: 11,
    marginTop: 2,
  },
  actions: {
    padding: 20,
    gap: 12,
  },
  button: {
    paddingVertical: 16,
    borderRadius: 28,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  primaryButton: {
    shadowColor: '#1E88E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
  },
  secondaryButton: {
    borderWidth: 2,
    backgroundColor: 'transparent',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  shareButton: {
    marginBottom: 4,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  shareButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '85%',
    paddingBottom: 28,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalClose: {
    fontSize: 24,
    padding: 4,
  },
  modalScroll: {
    flex: 1,
  },
  modalScrollContent: {
    padding: 20,
    alignItems: 'center',
  },
  modalActions: {
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 12,
  },
  modalButton: {
    marginBottom: 0,
  },
  noShareServiceText: {
    textAlign: 'center',
    fontSize: 14,
    paddingVertical: 12,
  },
});

export default EnhancedGameOverScreen;
