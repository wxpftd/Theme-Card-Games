import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  Modal,
  ScrollView,
} from 'react-native';
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

interface GameOverScreenProps {
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
}

export function GameOverScreen({
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
}: GameOverScreenProps) {
  const { theme } = useTheme();
  const { t } = useI18n();
  const [showShareModal, setShowShareModal] = useState(false);
  const shareCardRef = useRef<ShareCardContainerRef>(null);

  const isWinner = winner?.id === player.id;
  const hasShareData = survivalReportData || battleReportData;

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

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }, style]}>
      <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        {/* Result Header */}
        <View
          style={[
            styles.header,
            {
              backgroundColor: isWinner ? theme.colors.success : theme.colors.error,
            },
          ]}
        >
          <Text style={styles.emoji}>{isWinner ? '🎉' : '😢'}</Text>
          <Text style={styles.resultText}>
            {isWinner ? t('gameOver.victory') : t('gameOver.defeat')}
          </Text>
        </View>

        {/* Reason */}
        {reason && (
          <Text style={[styles.reason, { color: theme.colors.textSecondary }]}>{reason}</Text>
        )}

        {/* Final Stats */}
        <View style={styles.statsSection}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            {t('gameOver.finalStats')}
          </Text>

          <View style={styles.statsGrid}>
            {statDefinitions.map((stat) => {
              const value = player.stats[stat.id] ?? 0;
              return (
                <View key={stat.id} style={styles.statRow}>
                  <Text style={styles.statIcon}>{stat.icon}</Text>
                  <Text style={[styles.statName, { color: theme.colors.text }]}>{stat.name}</Text>
                  <Text style={[styles.statValue, { color: theme.colors.primary }]}>{value}</Text>
                </View>
              );
            })}
          </View>

          <View style={styles.resourcesGrid}>
            {resourceDefinitions.map((resource) => {
              const value = player.resources[resource.id] ?? 0;
              return (
                <View
                  key={resource.id}
                  style={[styles.resourceItem, { backgroundColor: theme.colors.background }]}
                >
                  <Text style={styles.resourceIcon}>{resource.icon}</Text>
                  <Text style={[styles.resourceValue, { color: theme.colors.text }]}>{value}</Text>
                  <Text style={[styles.resourceName, { color: theme.colors.textSecondary }]}>
                    {resource.name}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          {/* Share Button */}
          {hasShareData && (
            <TouchableOpacity
              style={[styles.button, styles.shareButton, { backgroundColor: theme.colors.accent }]}
              onPress={handleOpenShareModal}
            >
              <Text style={styles.shareButtonText}>{t('gameOver.shareResult')}</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.button, styles.primaryButton, { backgroundColor: theme.colors.primary }]}
            onPress={onRestart}
          >
            <Text style={styles.primaryButtonText}>{t('gameOver.playAgain')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.secondaryButton, { borderColor: theme.colors.primary }]}
            onPress={onMainMenu}
          >
            <Text style={[styles.secondaryButtonText, { color: theme.colors.primary }]}>
              {t('gameOver.mainMenu')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

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
                      {shareService.isSharing ? t('share.sharing') : t('share.share')}
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
                      {shareService.isSaving ? t('share.saving') : t('share.saveToGallery')}
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
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    width: '100%',
    maxWidth: 360,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  resultText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  reason: {
    textAlign: 'center',
    fontSize: 14,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  statsSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  statsGrid: {
    gap: 8,
    marginBottom: 16,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statIcon: {
    fontSize: 16,
    width: 24,
  },
  statName: {
    flex: 1,
    fontSize: 14,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  resourcesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  resourceItem: {
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    minWidth: 70,
  },
  resourceIcon: {
    fontSize: 20,
  },
  resourceValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  resourceName: {
    fontSize: 10,
  },
  actions: {
    padding: 16,
    gap: 12,
  },
  button: {
    paddingVertical: 14,
    borderRadius: 24,
    alignItems: 'center',
  },
  primaryButton: {},
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
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
    marginBottom: 8,
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
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalClose: {
    fontSize: 20,
    padding: 4,
  },
  modalScroll: {
    flex: 1,
  },
  modalScrollContent: {
    padding: 16,
    alignItems: 'center',
  },
  modalActions: {
    paddingHorizontal: 16,
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
