import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ImageBackground } from 'react-native';
import { router } from 'expo-router';
import { useTheme, LanguageSwitcher, useI18n } from '@theme-card-games/ui';

export default function HomeScreen() {
  const { theme, config, t } = useTheme();
  const { t: uiT } = useI18n();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Language Switcher */}
      <View style={styles.languageSwitcher}>
        <LanguageSwitcher mode="compact" />
      </View>

      {/* Logo / Title Area */}
      <View style={styles.header}>
        <Text style={styles.emoji}>🏢</Text>
        <Text style={[styles.title, { color: theme.colors.text }]}>{t('game.title')}</Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          {t('game.subtitle')}
        </Text>
      </View>

      {/* Description */}
      <View style={styles.description}>
        <Text style={[styles.descText, { color: theme.colors.textSecondary }]}>
          {config.description}
        </Text>
      </View>

      {/* Stats Preview */}
      <View style={[styles.previewCard, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.previewTitle, { color: theme.colors.text }]}>
          {t('theme.description')}
        </Text>
        <View style={styles.statsRow}>
          {config.stats.map((stat) => (
            <View key={stat.id} style={styles.statPreview}>
              <Text style={styles.statEmoji}>{stat.icon}</Text>
              <Text style={[styles.statName, { color: theme.colors.textSecondary }]}>
                {stat.name}
              </Text>
            </View>
          ))}
        </View>
        <View style={styles.resourcesRow}>
          {config.resources.map((resource) => (
            <View key={resource.id} style={styles.resourcePreview}>
              <Text style={styles.resourceEmoji}>{resource.icon}</Text>
              <Text style={[styles.resourceName, { color: theme.colors.textSecondary }]}>
                {resource.name}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.colors.primary }]}
          onPress={() => router.push('/game')}
        >
          <Text style={styles.buttonText}>{t('game.start')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton, { borderColor: theme.colors.primary }]}
          onPress={() => router.push('/tutorial')}
        >
          <Text style={[styles.secondaryButtonText, { color: theme.colors.primary }]}>
            {uiT('common.next')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Version */}
      <Text style={[styles.version, { color: theme.colors.textSecondary }]}>v{config.version}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
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
  },
  emoji: {
    fontSize: 64,
    marginBottom: 12,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginTop: 8,
    textAlign: 'center',
  },
  description: {
    marginVertical: 20,
    paddingHorizontal: 20,
  },
  descText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },
  previewCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  statPreview: {
    alignItems: 'center',
  },
  statEmoji: {
    fontSize: 24,
  },
  statName: {
    fontSize: 10,
    marginTop: 4,
  },
  resourcesRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  resourcePreview: {
    alignItems: 'center',
  },
  resourceEmoji: {
    fontSize: 20,
  },
  resourceName: {
    fontSize: 10,
    marginTop: 4,
  },
  actions: {
    gap: 12,
  },
  button: {
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  version: {
    textAlign: 'center',
    marginTop: 24,
    fontSize: 12,
  },
});
