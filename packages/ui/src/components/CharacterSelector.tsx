/**
 * CharacterSelector - 角色选择组件
 * 用于游戏开始前选择角色
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  SafeAreaView,
} from 'react-native';
import { CharacterDefinition } from '@theme-card-games/core';
import { useTheme } from '../theme/ThemeContext';
import { CharacterCard } from './CharacterCard';

export interface CharacterSelectorProps {
  /** 可选角色列表 */
  characters: CharacterDefinition[];
  /** 已选角色列表 (多人模式下其他玩家已选的角色) */
  selectedByOthers?: string[];
  /** 当前玩家已选角色 ID */
  selectedCharacterId?: string;
  /** 选择确认回调 */
  onSelect: (characterId: string) => void;
  /** 取消回调 */
  onCancel?: () => void;
  /** 是否显示 */
  visible?: boolean;
  /** 标题 */
  title?: string;
  /** 是否允许取消 */
  allowCancel?: boolean;
}

/**
 * 角色选择器组件
 */
export const CharacterSelector: React.FC<CharacterSelectorProps> = ({
  characters,
  selectedByOthers = [],
  selectedCharacterId,
  onSelect,
  onCancel,
  visible = true,
  title = '选择角色',
  allowCancel = true,
}) => {
  const { theme } = useTheme();
  const [selectedId, setSelectedId] = useState<string | undefined>(selectedCharacterId);
  const [showDetail, setShowDetail] = useState<string | null>(null);

  const handleCharacterPress = (character: CharacterDefinition) => {
    if (selectedByOthers.includes(character.id)) {
      return; // 已被其他玩家选择
    }
    setSelectedId(character.id);
  };

  const handleLongPress = (character: CharacterDefinition) => {
    setShowDetail(character.id);
  };

  const handleConfirm = () => {
    if (selectedId) {
      onSelect(selectedId);
    }
  };

  const selectedCharacter = characters.find((c) => c.id === selectedId);

  const renderCharacterList = () => (
    <ScrollView
      style={styles.characterList}
      contentContainerStyle={styles.characterListContent}
      showsVerticalScrollIndicator={false}
    >
      {characters.map((character) => {
        const isSelectedByOther = selectedByOthers.includes(character.id);
        const isSelected = selectedId === character.id;

        return (
          <TouchableOpacity
            key={character.id}
            onPress={() => handleCharacterPress(character)}
            onLongPress={() => handleLongPress(character)}
            disabled={isSelectedByOther}
          >
            <CharacterCard
              character={character}
              isSelected={isSelected}
              disabled={isSelectedByOther}
              showDetails={false}
            />
            {isSelectedByOther && (
              <View style={styles.unavailableOverlay}>
                <Text style={styles.unavailableText}>已被选择</Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );

  const renderDetailModal = () => {
    const detailCharacter = characters.find((c) => c.id === showDetail);
    if (!detailCharacter) return null;

    return (
      <Modal
        visible={!!showDetail}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDetail(null)}
      >
        <View style={styles.detailModalOverlay}>
          <View style={[styles.detailModalContent, { backgroundColor: theme.colors.surface }]}>
            <CharacterCard character={detailCharacter} showDetails />
            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: theme.colors.primary }]}
              onPress={() => setShowDetail(null)}
            >
              <Text style={styles.closeButtonText}>关闭</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  const content = (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* 标题 */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>长按查看详情</Text>
      </View>

      {/* 角色列表 */}
      {renderCharacterList()}

      {/* 已选角色预览 */}
      {selectedCharacter && (
        <View style={[styles.previewContainer, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.previewTitle, { color: theme.colors.text }]}>已选角色</Text>
          <View style={styles.previewInfo}>
            <Text style={styles.previewIcon}>{selectedCharacter.icon}</Text>
            <View>
              <Text style={[styles.previewName, { color: theme.colors.text }]}>
                {selectedCharacter.name}
              </Text>
              <Text
                style={[styles.previewDesc, { color: theme.colors.textSecondary }]}
                numberOfLines={1}
              >
                {selectedCharacter.description}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* 操作按钮 */}
      <View style={styles.buttonContainer}>
        {allowCancel && onCancel && (
          <TouchableOpacity
            style={[
              styles.button,
              styles.cancelButton,
              { borderColor: theme.colors.textSecondary },
            ]}
            onPress={onCancel}
          >
            <Text style={[styles.cancelButtonText, { color: theme.colors.textSecondary }]}>
              取消
            </Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[
            styles.button,
            styles.confirmButton,
            {
              backgroundColor: selectedId ? theme.colors.primary : theme.colors.textSecondary,
            },
          ]}
          onPress={handleConfirm}
          disabled={!selectedId}
        >
          <Text style={styles.confirmButtonText}>确认选择</Text>
        </TouchableOpacity>
      </View>

      {/* 详情弹窗 */}
      {renderDetailModal()}
    </SafeAreaView>
  );

  if (visible === false) {
    return null;
  }

  return content;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  characterList: {
    flex: 1,
  },
  characterListContent: {
    paddingHorizontal: 12,
    paddingBottom: 16,
  },
  unavailableOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 4,
  },
  unavailableText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  previewContainer: {
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  previewTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  previewInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  previewIcon: {
    fontSize: 36,
    marginRight: 12,
  },
  previewName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  previewDesc: {
    fontSize: 12,
    marginTop: 2,
    maxWidth: 250,
  },
  buttonContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    borderWidth: 2,
    backgroundColor: 'transparent',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 2,
  },
  confirmButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  detailModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  detailModalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 16,
  },
  closeButton: {
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CharacterSelector;
