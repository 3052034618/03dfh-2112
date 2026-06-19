import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Input } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classNames from 'classnames';
import { useGameStore } from '@/store/gameStore';
import { Game } from '@/types/game';
import GameCard from '@/components/GameCard';
import styles from './index.module.scss';

const filterOptions = [
  { key: 'all', label: '全部' },
  { key: 'recruiting', label: '招募中' },
  { key: 'full', label: '已满员' },
  { key: 'hardcore', label: '硬核推理' },
  { key: 'emotion', label: '情感本' },
  { key: 'horror', label: '恐怖本' },
  { key: 'ancient', label: '古风本' },
];

const HallPage: React.FC = () => {
  const games = useGameStore((state) => state.games);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchText, setSearchText] = useState('');

  const filteredGames = useMemo(() => {
    let result = [...games];

    if (searchText) {
      result = result.filter(
        (g) =>
          g.title.includes(searchText) ||
          g.scriptName.includes(searchText) ||
          g.scriptType.includes(searchText)
      );
    }

    switch (activeFilter) {
      case 'recruiting':
        result = result.filter((g) => g.status === 'recruiting');
        break;
      case 'full':
        result = result.filter((g) => g.status === 'full' || g.status === 'voting' || g.status === 'confirmed');
        break;
      case 'hardcore':
        result = result.filter((g) => g.scriptType.includes('推理') || g.scriptType.includes('硬核'));
        break;
      case 'emotion':
        result = result.filter((g) => g.scriptType.includes('情感'));
        break;
      case 'horror':
        result = result.filter((g) => g.scriptType.includes('恐怖'));
        break;
      case 'ancient':
        result = result.filter((g) => g.scriptType.includes('古风'));
        break;
      default:
        break;
    }

    return result;
  }, [games, activeFilter, searchText]);

  const recruitingGames = filteredGames.filter((g) => g.status === 'recruiting');
  const otherGames = filteredGames.filter((g) => g.status !== 'recruiting');

  const handleCreateGame = () => {
    Taro.switchTab({
      url: '/pages/create/index',
    });
  };

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <Text className={styles.headerTitle}>找一车好本</Text>
        <Text className={styles.headerSubtitle}>组野车，先说好舒适区，避免现场尴尬</Text>
      </View>

      <View className={styles.searchBar}>
        <Text className={styles.searchIcon}>🔍</Text>
        <Input
          className={styles.searchInput}
          placeholder="搜索剧本、车局..."
          placeholderStyle="color: #9ca3af"
          value={searchText}
          onInput={(e) => setSearchText(e.detail.value)}
        />
      </View>

      <ScrollView scrollX className={styles.filterTabs} showScrollbar={false}>
        {filterOptions.map((opt) => (
          <View
            key={opt.key}
            className={classNames(styles.filterTab, activeFilter === opt.key && styles.active)}
            onClick={() => setActiveFilter(opt.key)}
          >
            {opt.label}
          </View>
        ))}
      </ScrollView>

      <ScrollView scrollY className={styles.gameList}>
        {recruitingGames.length > 0 && (
          <>
            <View className={styles.sectionTitle}>
              <Text>🔥 正在招募</Text>
              <Text className={styles.sectionMore}>{recruitingGames.length}车</Text>
            </View>
            {recruitingGames.map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </>
        )}

        {otherGames.length > 0 && (
          <>
            <View className={styles.sectionTitle} style={{ marginTop: '32rpx' }}>
              <Text>📋 其他车局</Text>
              <Text className={styles.sectionMore}>{otherGames.length}车</Text>
            </View>
            {otherGames.map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </>
        )}

        {filteredGames.length === 0 && (
          <View className={styles.emptyState}>
            <Text className={styles.emptyIcon}>🎭</Text>
            <Text className={styles.emptyText}>暂无符合条件的车局</Text>
          </View>
        )}
      </ScrollView>

      <View className={styles.fab} onClick={handleCreateGame}>
        <Text>+</Text>
      </View>
    </View>
  );
};

export default HallPage;
