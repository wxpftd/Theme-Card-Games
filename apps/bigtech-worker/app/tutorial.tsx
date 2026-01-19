import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '@theme-card-games/ui';
import { bigtechWorkerTheme } from '@theme-card-games/theme-bigtech-worker';

interface TutorialStep {
  title: string;
  content: string;
  emoji: string;
}

const tutorialSteps: TutorialStep[] = [
  {
    title: '欢迎来到大厂',
    content: '你是一名刚入职的大厂员工，你的目标是在保持身心健康的同时，努力提升绩效获得晋升！',
    emoji: '🏢',
  },
  {
    title: '关注四大属性',
    content:
      '📈 绩效：达到100即可晋升获胜\n❤️ 健康：降到0会被迫离职\n😊 幸福感：降到0会选择躺平\n🎯 影响力：提升你的话语权',
    emoji: '📊',
  },
  {
    title: '管理你的资源',
    content:
      '💰 薪资：你的收入\n⚡ 精力：每回合可用的精力\n🤝 人脉：职场社交资源\n📚 技能点：学习和成长',
    emoji: '💼',
  },
  {
    title: '打出卡牌',
    content:
      '每回合你可以从手牌中选择卡牌打出。不同的卡牌会影响你的属性和资源。注意平衡工作和生活！',
    emoji: '🃏',
  },
  {
    title: '策略是关键',
    content: '过度加班会损害健康，过度摸鱼会影响绩效。找到适合自己的节奏，成为最会生存的打工人！',
    emoji: '🎯',
  },
  {
    title: '准备好了吗？',
    content: '记住：身体是革命的本钱。合理安排工作和生活，才能在大厂长久生存！',
    emoji: '🚀',
  },
];

export default function TutorialScreen() {
  const { theme } = useTheme();
  const [currentStep, setCurrentStep] = useState(0);

  const step = tutorialSteps[currentStep];
  const isLastStep = currentStep === tutorialSteps.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      router.replace('/game');
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSkip = () => {
    router.back();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleSkip}>
          <Text style={[styles.skipText, { color: theme.colors.textSecondary }]}>跳过</Text>
        </TouchableOpacity>
        <View style={styles.dots}>
          {tutorialSteps.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                {
                  backgroundColor:
                    index === currentStep ? theme.colors.primary : theme.colors.background,
                  borderColor: theme.colors.primary,
                },
              ]}
            />
          ))}
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.emoji}>{step.emoji}</Text>
        <Text style={[styles.title, { color: theme.colors.text }]}>{step.title}</Text>
        <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
          {step.content}
        </Text>
      </View>

      {/* Card Types Preview (on step 4) */}
      {currentStep === 3 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.cardsPreview}
          contentContainerStyle={styles.cardsContainer}
        >
          {bigtechWorkerTheme.cards.slice(0, 5).map((card) => (
            <View
              key={card.id}
              style={[styles.cardPreview, { backgroundColor: theme.colors.surface }]}
            >
              <Text style={styles.cardName}>{card.name}</Text>
              <Text
                style={[styles.cardDesc, { color: theme.colors.textSecondary }]}
                numberOfLines={3}
              >
                {card.description}
              </Text>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Navigation */}
      <View style={styles.navigation}>
        <TouchableOpacity
          style={[
            styles.navButton,
            {
              backgroundColor: currentStep > 0 ? theme.colors.surface : 'transparent',
            },
          ]}
          onPress={handlePrev}
          disabled={currentStep === 0}
        >
          <Text
            style={[
              styles.navButtonText,
              {
                color: currentStep > 0 ? theme.colors.text : theme.colors.background,
              },
            ]}
          >
            上一步
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navButton, { backgroundColor: theme.colors.primary }]}
          onPress={handleNext}
        >
          <Text style={[styles.navButtonText, { color: '#fff' }]}>
            {isLastStep ? '开始游戏' : '下一步'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  skipText: {
    fontSize: 14,
  },
  dots: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emoji: {
    fontSize: 80,
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    lineHeight: 26,
    textAlign: 'center',
  },
  cardsPreview: {
    maxHeight: 150,
    marginBottom: 20,
  },
  cardsContainer: {
    paddingHorizontal: 20,
    gap: 12,
  },
  cardPreview: {
    width: 120,
    padding: 12,
    borderRadius: 12,
  },
  cardName: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 10,
    lineHeight: 14,
  },
  navigation: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 12,
  },
  navButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 24,
    alignItems: 'center',
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});
