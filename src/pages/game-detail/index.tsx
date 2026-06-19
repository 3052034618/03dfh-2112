import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import classNames from 'classnames';
import { useGameStore } from '@/store/gameStore';
import { Gender } from '@/types/game';
import { getGameStatusText, getGameStatusColor, formatDateTime, getGenderText } from '@/utils/gameUtils';
import RoleTag from '@/components/RoleTag';
import styles from './index.module.scss';

const GameDetailPage: React.FC = () => {
  const router = useRouter();
  const gameId = router.params.id as string;
  
  const getGameById = useGameStore((state) => state.getGameById);
  const currentUserId = useGameStore((state) => state.currentUserId);
  const joinGame = useGameStore((state) => state.joinGame);
  
  const game = getGameById(gameId);

  const [isJoined, setIsJoined] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [hasComfortZone, setHasComfortZone] = useState(false);

  useEffect(() => {
    if (game) {
      const player = game.players.find((p) => p.id === currentUserId);
      setIsJoined(!!player);
      setIsHost(game.hostId === currentUserId);
      setHasComfortZone(!!player?.comfortZone);
    }
  }, [game, currentUserId]);

  const handleJoin = () => {
    if (!game || isJoined) return;

    Taro.showActionSheet({
      itemList: ['男生报名', '女生报名'],
      success: (res) => {
        const gender: Gender = res.tapIndex === 0 ? 'male' : 'female';
        const nicknames = ['剧本新人', '推理达人', '情感玩家', '硬核推土机', '戏精本精'];
        const randomNickname = nicknames[Math.floor(Math.random() * nicknames.length)];

        joinGame(game.id, {
          nickname: randomNickname,
          gender,
          isHost: false,
        });

        Taro.showToast({
          title: '报名成功',
          icon: 'success',
          duration: 1500,
        });
      },
    });
  };

  const handleFillComfortZone = () => {
    if (!game) return;
    Taro.navigateTo({
      url: `/pages/comfort-zone/index?gameId=${game.id}`,
    });
  };

  const handleViewRolePlaza = () => {
    if (!game) return;
    Taro.navigateTo({
      url: `/pages/role-plaza/index?gameId=${game.id}`,
    });
  };

  const handleViewVote = () => {
    if (!game) return;
    Taro.navigateTo({
      url: `/pages/vote/index?gameId=${game.id}`,
    });
  };

  const handleViewResult = () => {
    if (!game) return;
    Taro.navigateTo({
      url: `/pages/role-result/index?gameId=${game.id}`,
    });
  };

  const actionButton = useMemo(() => {
    if (!game) return null;

    if (!isJoined) {
      return (
        <View
          className={classNames(styles.primaryBtn, game.status !== 'recruiting' && styles.disabled)}
          onClick={handleJoin}
        >
          {game.status === 'recruiting' ? '立即报名' : '已结束招募'}
        </View>
      );
    }

    if (game.status === 'recruiting' || game.status === 'full') {
      if (!hasComfortZone) {
        return (
          <View className={styles.primaryBtn} onClick={handleFillComfortZone}>
            填写舒适区
          </View>
        );
      }
      if (game.status === 'full') {
        return (
          <View className={styles.primaryBtn} onClick={handleViewRolePlaza}>
            查看角色意向广场
          </View>
        );
      }
      return (
        <View className={styles.secondaryBtn} onClick={handleFillComfortZone}>
          已填写舒适区 ✓
        </View>
      );
    }

    if (game.status === 'voting') {
      return (
        <View className={styles.primaryBtn} onClick={handleViewVote}>
          去投票
        </View>
      );
    }

    if (game.status === 'confirmed') {
      return (
        <View className={styles.primaryBtn} onClick={handleViewResult}>
          查看角色分配
        </View>
      );
    }

    return null;
  }, [game, isJoined, hasComfortZone]);

  if (!game) {
    return (
      <View className={styles.page}>
        <View style={{ textAlign: 'center', padding: '100rpx 0' }}>
          <Text style={{ fontSize: '48rpx', marginBottom: '16rpx' }}>😢</Text>
          <Text style={{ fontSize: '28rpx', color: '#9ca3af' }}>车局不存在</Text>
        </View>
      </View>
    );
  }

  const emptySeats = game.totalPlayers - game.players.length;

  return (
    <ScrollView scrollY className={styles.page}>
      <View className={styles.header}>
        <Text className={styles.title}>{game.title}</Text>
        <Text className={styles.subtitle}>{game.scriptName} · {game.scriptType}</Text>
        <View
          className={styles.statusBadge}
          style={{ backgroundColor: `${getGameStatusColor(game.status)}30` }}
        >
          {getGameStatusText(game.status)}
        </View>
      </View>

      <View className={styles.card}>
        <View className={styles.infoRow}>
          <Text className={styles.infoIcon}>⏰</Text>
          <View className={styles.infoContent}>
            <Text className={styles.infoLabel}>开始时间</Text>
            <Text className={styles.infoValue}>{formatDateTime(game.startTime)}</Text>
          </View>
        </View>

        <View className={styles.infoRow}>
          <Text className={styles.infoIcon}>📍</Text>
          <View className={styles.infoContent}>
            <Text className={styles.infoLabel}>地点</Text>
            <Text className={styles.infoValue}>{game.location}</Text>
          </View>
        </View>

        <View className={styles.infoRow}>
          <Text className={styles.infoIcon}>👥</Text>
          <View className={styles.infoContent}>
            <Text className={styles.infoLabel}>人数</Text>
            <Text className={styles.infoValue}>
              {game.totalPlayers}人 ({game.maleRoles}男{game.femaleRoles}女)
              {game.allowCrossDress && ' · 可反串'}
            </Text>
          </View>
        </View>
      </View>

      {game.description && (
        <View className={styles.section}>
          <Text className={styles.sectionTitle}>车局说明</Text>
          <Text style={{ fontSize: '28rpx', color: '#4b5563', lineHeight: 1.6 }}>
            {game.description}
          </Text>
        </View>
      )}

      <View className={styles.section}>
        <View className={styles.sectionTitle}>
          <Text>角色列表</Text>
          <Text className={styles.sectionBadge}>{game.roles.length}个角色</Text>
        </View>
        <View className={styles.rolePreview}>
          {game.roles.map((role) => (
            <RoleTag key={role.id} role={role} showBadges />
          ))}
        </View>
      </View>

      <View className={styles.section}>
        <View className={styles.sectionTitle}>
          <Text>报名玩家</Text>
          <Text className={styles.sectionBadge}>
            {game.players.length}/{game.totalPlayers}
          </Text>
        </View>
        <View className={styles.playerList}>
          {game.players.map((player) => (
            <View key={player.id} className={styles.playerItem}>
              <View className={styles.playerAvatar}>
                {player.gender === 'male' ? '👨' : '👩'}
              </View>
              <View className={styles.playerInfo}>
                <View className={styles.playerName}>
                  {player.nickname}
                  {player.isHost && <Text className={styles.hostTag}>发起人</Text>}
                </View>
                <Text className={styles.playerStatus}>
                  {player.comfortZone ? '已填写舒适区' : '待填写舒适区'}
                </Text>
              </View>
              <View className={classNames(styles.genderTag, styles[player.gender])}>
                {getGenderText(player.gender)}
              </View>
            </View>
          ))}

          {Array.from({ length: emptySeats }).map((_, index) => (
            <View key={`empty-${index}`} className={styles.emptySeat}>
              <Text>➕</Text>
              <Text>虚位以待</Text>
            </View>
          ))}
        </View>
      </View>

      {game.status === 'full' && (
        <View className={styles.tipBox}>
          <Text className={styles.tipText}>
            💡 已满人，请所有玩家填写舒适区，系统将生成角色意向广场
          </Text>
        </View>
      )}

      <View className={styles.bottomBar}>
        {actionButton}
      </View>
    </ScrollView>
  );
};

export default GameDetailPage;
