import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classNames from 'classnames';
import { useGameStore } from '@/store/gameStore';
import { formatDateTime } from '@/utils/gameUtils';
import styles from './index.module.scss';

const MinePage: React.FC = () => {
  const games = useGameStore((state) => state.games);
  const currentUserId = useGameStore((state) => state.currentUserId);
  const [activeTab, setActiveTab] = useState('all');

  const myGames = useMemo(() => {
    return games.filter((g) => g.players.some((p) => p.id === currentUserId));
  }, [games, currentUserId]);

  const filteredGames = useMemo(() => {
    switch (activeTab) {
      case 'host':
        return myGames.filter((g) => g.hostId === currentUserId);
      case 'joined':
        return myGames.filter((g) => g.hostId !== currentUserId);
      case 'upcoming':
        return myGames.filter((g) => g.startTime > Date.now());
      default:
        return myGames;
    }
  }, [myGames, activeTab]);

  const stats = useMemo(() => {
    const total = myGames.length;
    const hosting = myGames.filter((g) => g.hostId === currentUserId).length;
    const confirmed = myGames.filter((g) => g.status === 'confirmed').length;
    return { total, hosting, confirmed };
  }, [myGames, currentUserId]);

  const handleGameClick = (gameId: string) => {
    Taro.navigateTo({
      url: `/pages/game-detail/index?id=${gameId}`,
    });
  };

  const handleMenuClick = (key: string) => {
    Taro.showToast({
      title: '功能开发中',
      icon: 'none',
    });
  };

  return (
    <ScrollView scrollY className={styles.page}>
      <View className={styles.header}>
        <View className={styles.userInfo}>
          <View className={styles.avatar}>🎭</View>
          <View className={styles.userText}>
            <Text className={styles.nickname}>剧本杀爱好者</Text>
            <Text className={styles.userDesc}>ID: 88888888</Text>
          </View>
        </View>

        <View className={styles.statsRow}>
          <View className={styles.statItem}>
            <Text className={styles.statNumber}>{stats.total}</Text>
            <Text className={styles.statLabel}>参与车局</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statNumber}>{stats.hosting}</Text>
            <Text className={styles.statLabel}>发起车局</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statNumber}>{stats.confirmed}</Text>
            <Text className={styles.statLabel}>已成行</Text>
          </View>
        </View>
      </View>

      <View className={styles.menuSection}>
        <Text className={styles.sectionTitle}>我的车局</Text>
        <View className={styles.menuItem} onClick={() => handleMenuClick('my-games')}>
          <Text className={styles.menuIcon}>📋</Text>
          <Text className={styles.menuText}>我的车局</Text>
          <Text className={styles.menuArrow}>›</Text>
        </View>
        <View className={styles.divider} />
        <View className={styles.menuItem} onClick={() => handleMenuClick('favorites')}>
          <Text className={styles.menuIcon}>❤️</Text>
          <Text className={styles.menuText}>收藏剧本</Text>
          <Text className={styles.menuArrow}>›</Text>
        </View>
        <View className={styles.divider} />
        <View className={styles.menuItem} onClick={() => handleMenuClick('history')}>
          <Text className={styles.menuIcon}>🕐</Text>
          <Text className={styles.menuText}>历史记录</Text>
          <Text className={styles.menuArrow}>›</Text>
        </View>
      </View>

      <View className={styles.menuSection}>
        <Text className={styles.sectionTitle}>设置</Text>
        <View className={styles.menuItem} onClick={() => handleMenuClick('profile')}>
          <Text className={styles.menuIcon}>👤</Text>
          <Text className={styles.menuText}>个人资料</Text>
          <Text className={styles.menuArrow}>›</Text>
        </View>
        <View className={styles.divider} />
        <View className={styles.menuItem} onClick={() => handleMenuClick('comfort')}>
          <Text className={styles.menuIcon}>🎭</Text>
          <Text className={styles.menuText}>我的舒适区</Text>
          <Text className={styles.menuArrow}>›</Text>
        </View>
        <View className={styles.divider} />
        <View className={styles.menuItem} onClick={() => handleMenuClick('about')}>
          <Text className={styles.menuIcon}>ℹ️</Text>
          <Text className={styles.menuText}>关于我们</Text>
          <Text className={styles.menuArrow}>›</Text>
        </View>
      </View>

      <View className={styles.myGamesSection}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitleText}>我的车局</Text>
          <Text className={styles.sectionMore}>全部 ›</Text>
        </View>

        <View className={styles.gameTabs}>
          <View
            className={classNames(styles.gameTab, activeTab === 'all' && styles.active)}
            onClick={() => setActiveTab('all')}
          >
            全部
          </View>
          <View
            className={classNames(styles.gameTab, activeTab === 'upcoming' && styles.active)}
            onClick={() => setActiveTab('upcoming')}
          >
            即将开始
          </View>
          <View
            className={classNames(styles.gameTab, activeTab === 'host' && styles.active)}
            onClick={() => setActiveTab('host')}
          >
            我发起
          </View>
        </View>

        <View className={styles.gameList}>
          {filteredGames.map((game) => (
            <View
              key={game.id}
              className={styles.miniGameCard}
              onClick={() => handleGameClick(game.id)}
            >
              <Text className={styles.miniGameTitle}>{game.title}</Text>
              <Text className={styles.miniGameMeta}>
                {formatDateTime(game.startTime)} · {game.location.split('·')[1] || game.location}
              </Text>
            </View>
          ))}

          {filteredGames.length === 0 && (
            <View style={{ textAlign: 'center', padding: '60rpx 0' }}>
              <Text style={{ fontSize: '48rpx', marginBottom: '16rpx', opacity: 0.5 }}>📭</Text>
              <Text style={{ fontSize: '28rpx', color: '#9ca3af' }}>暂无相关车局</Text>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
};

export default MinePage;
