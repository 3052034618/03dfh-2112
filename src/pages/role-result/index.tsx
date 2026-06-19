import React, { useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import classNames from 'classnames';
import { useGameStore } from '@/store/gameStore';
import { getGenderText, formatDateTime } from '@/utils/gameUtils';
import styles from './index.module.scss';

const RoleResultPage: React.FC = () => {
  const router = useRouter();
  const gameId = router.params.gameId as string;

  const getGameById = useGameStore((state) => state.getGameById);
  const getRoleById = useGameStore((state) => state.getRoleById);
  const currentUserId = useGameStore((state) => state.currentUserId);

  const game = getGameById(gameId);

  const myAssignment = useMemo(() => {
    if (!game || !game.finalAssignments) return null;
    const roleId = game.finalAssignments[currentUserId];
    if (!roleId) return null;
    return getRoleById(gameId, roleId);
  }, [game, gameId, currentUserId, getRoleById]);

  const allAssignments = useMemo(() => {
    if (!game || !game.finalAssignments) return [];

    return Object.entries(game.finalAssignments).map(([playerId, roleId]) => {
      const player = game.players.find((p) => p.id === playerId);
      const role = getRoleById(gameId, roleId);
      return {
        playerId,
        playerName: player?.nickname || '未知玩家',
        isHost: player?.isHost || false,
        playerGender: player?.gender || 'neutral',
        roleId,
        roleName: role?.name || '未知角色',
        roleGender: role?.gender || 'neutral',
      };
    });
  }, [game, gameId, getRoleById]);

  const isCrossDress = useMemo(() => {
    if (!myAssignment || !game) return false;
    const player = game.players.find((p) => p.id === currentUserId);
    if (!player) return false;
    return myAssignment.gender !== 'neutral' && player.gender !== myAssignment.gender;
  }, [myAssignment, game, currentUserId]);

  const handleBack = () => {
    Taro.navigateBack();
  };

  const handleBackToHall = () => {
    Taro.switchTab({
      url: '/pages/hall/index',
    });
  };

  if (!game) {
    return (
      <View className={styles.page}>
        <View style={{ textAlign: 'center', padding: '100rpx 0' }}>
          <Text style={{ fontSize: '48rpx', marginBottom: '16rpx' }}>😢</Text>
          <Text style={{ fontSize: '28rpx', color: '#9ca3af' }}>数据加载失败</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView scrollY className={styles.page}>
      <View className={styles.header}>
        <Text className={styles.successIcon}>🎉</Text>
        <Text className={styles.title}>角色分配已确认</Text>
        <Text className={styles.subtitle}>大家都已确认，准备好开始你的剧本之旅吧！</Text>
      </View>

      <View className={styles.resultCard}>
        <View className={styles.myRoleSection}>
          <Text className={styles.myRoleLabel}>你的角色</Text>
          <Text className={styles.myRoleName}>
            {myAssignment?.name || '待定'}
          </Text>
          <View className={classNames(styles.myRoleGender, styles[myAssignment?.gender || 'neutral'])}>
            {getGenderText(myAssignment?.gender || 'neutral')}角色
          </View>

          <View className={styles.roleTags}>
            {myAssignment?.isHighlight && (
              <Text className={classNames(styles.roleTag, styles.tagHighlight)}>
                ⭐ 高光角色
              </Text>
            )}
            {myAssignment?.isKiller && (
              <Text className={classNames(styles.roleTag, styles.tagKiller)}>
                🔪 可能是凶手
              </Text>
            )}
            {myAssignment?.hasIntimateScene && (
              <Text className={classNames(styles.roleTag, styles.tagIntimate)}>
                💕 有感情线
              </Text>
            )}
            {isCrossDress && (
              <Text className={classNames(styles.roleTag, styles.tagCrossDress)}>
                🎭 反串
              </Text>
            )}
          </View>

          {myAssignment?.description && (
            <Text className={styles.myRoleDesc}>{myAssignment.description}</Text>
          )}
        </View>

        <Text className={styles.sectionTitle}>
          <Text className={styles.sectionIcon}>📋</Text>
          全部角色分配
        </Text>

        <View className={styles.allRolesList}>
          {allAssignments.map((item) => (
            <View key={item.playerId} className={styles.roleItem}>
              <View className={styles.roleAvatar}>
                {item.playerGender === 'male' ? '👨' : '👩'}
              </View>
              <View className={styles.roleInfo}>
                <Text className={styles.roleItemName}>
                  {item.roleName}
                  {item.isHost && <Text className={styles.hostBadge}>发起人</Text>}
                </Text>
                <Text className={styles.roleItemPlayer}>
                  扮演者：{item.playerName}
                </Text>
              </View>
              <View className={classNames(styles.roleItemGender, styles[item.roleGender])}>
                {getGenderText(item.roleGender)}
              </View>
            </View>
          ))}
        </View>
      </View>

      <View className={styles.gameInfoCard}>
        <Text className={styles.sectionTitle}>
          <Text className={styles.sectionIcon}>📅</Text>
          车局信息
        </Text>

        <View className={styles.infoRow}>
          <Text className={styles.infoIcon}>📚</Text>
          <View className={styles.infoContent}>
            <Text className={styles.infoLabel}>剧本</Text>
            <Text className={styles.infoValue}>{game.scriptName}</Text>
          </View>
        </View>

        <View className={styles.infoRow}>
          <Text className={styles.infoIcon}>⏰</Text>
          <View className={styles.infoContent}>
            <Text className={styles.infoLabel}>时间</Text>
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
      </View>

      <View className={styles.tipCard}>
        <Text className={styles.tipTitle}>
          <Text>💡</Text>
          温馨提示
        </Text>
        <Text className={styles.tipContent}>
          1. 请准时到达剧本杀店，不要让大家等太久哦{'\n'}
          2. 角色分配结果已提前确认，请安心享受游戏{'\n'}
          3. 如果有特殊情况，请及时联系发起人
        </Text>
      </View>

      <View className={styles.bottomBar}>
        <View className={styles.secondaryBtn} onClick={handleBack}>
          返回详情
        </View>
        <View className={styles.primaryBtn} onClick={handleBackToHall}>
          回到大厅
        </View>
      </View>
    </ScrollView>
  );
};

export default RoleResultPage;
