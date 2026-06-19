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
  const confirmPlayerRole = useGameStore((state) => state.confirmPlayerRole);
  const restartVote = useGameStore((state) => state.restartVote);
  const removePlayer = useGameStore((state) => state.removePlayer);
  const leaveGame = useGameStore((state) => state.leaveGame);

  const game = getGameById(gameId);
  const player = game?.players.find((p) => p.id === currentUserId);
  const isHost = game?.hostId === currentUserId;
  const isPlayer = !!player;
  const hasConfirmed = !!player?.confirmedRole;

  const myAssignment = useMemo(() => {
    if (!game || !game.finalAssignments) return null;
    const roleId = game.finalAssignments[currentUserId];
    if (!roleId) return null;
    return getRoleById(gameId, roleId);
  }, [game, gameId, currentUserId, getRoleById]);

  const allAssignments = useMemo(() => {
    if (!game || !game.finalAssignments) return [];

    return Object.entries(game.finalAssignments).map(([playerId, roleId]) => {
      const playerItem = game.players.find((p) => p.id === playerId);
      const role = getRoleById(gameId, roleId);
      return {
        playerId,
        playerName: playerItem?.nickname || '未知玩家',
        isHost: playerItem?.isHost || false,
        playerGender: playerItem?.gender || 'neutral',
        confirmed: playerItem?.confirmedRole || false,
        roleId,
        roleName: role?.name || '未知角色',
        roleGender: role?.gender || 'neutral',
      };
    });
  }, [game, gameId, getRoleById]);

  const isCrossDress = useMemo(() => {
    if (!myAssignment || !game) return false;
    const p = game.players.find((pl) => pl.id === currentUserId);
    if (!p) return false;
    return myAssignment.gender !== 'neutral' && p.gender !== myAssignment.gender;
  }, [myAssignment, game, currentUserId]);

  const comfortHitInfo = useMemo(() => {
    if (!myAssignment || !game) return null;
    const p = game.players.find((pl) => pl.id === currentUserId);
    if (!p || !p.comfortZone) return null;

    const info = {
      crossDress: {
        needed: isCrossDress,
        level: isCrossDress
          ? (p.gender === 'male'
              ? p.comfortZone.crossDressMaleToFemale
              : p.comfortZone.crossDressFemaleToMale)
          : null,
      },
      intimate: {
        needed: myAssignment.hasIntimateScene || false,
        level: myAssignment.hasIntimateScene ? p.comfortZone.intimateScene : null,
      },
      killer: {
        needed: myAssignment.isKiller || false,
        avoided: p.comfortZone.avoidKiller,
      },
      highlight: {
        needed: myAssignment.isHighlight || false,
        preferred: p.comfortZone.preferHighlight,
      },
    };

    return info;
  }, [myAssignment, game, currentUserId, isCrossDress]);

  const getHitStatus = (info: typeof comfortHitInfo) => {
    if (!info) return 'neutral';

    let hits = 0;
    let total = 0;

    if (info.crossDress.needed && info.crossDress.level) {
      total++;
      if (info.crossDress.level === 'yes') hits++;
      else if (info.crossDress.level === 'maybe') hits += 0.5;
    }

    if (info.intimate.needed && info.intimate.level) {
      total++;
      if (info.intimate.level === 'yes') hits++;
      else if (info.intimate.level === 'maybe') hits += 0.5;
    }

    if (info.killer.needed) {
      total++;
      if (!info.killer.avoided) hits++;
    }

    if (info.highlight.needed) {
      total++;
      if (info.highlight.preferred) hits++;
    }

    if (total === 0) return 'neutral';
    const ratio = hits / total;
    if (ratio >= 0.8) return 'perfect';
    if (ratio >= 0.5) return 'good';
    return 'compromise';
  };

  const hitStatus = getHitStatus(comfortHitInfo);

  const hitStatusText = {
    perfect: '💯 完美匹配',
    good: '👍 总体满意',
    compromise: '🤝 稍有妥协',
    neutral: '📋 分配结果',
  };

  const hitStatusColor = {
    perfect: '#10b981',
    good: '#3b82f6',
    compromise: '#f59e0b',
    neutral: '#6b7280',
  };

  const confirmProgress = useMemo(() => {
    if (!game) return { confirmed: 0, total: 0, percentage: 0 };
    const confirmed = game.players.filter((p) => p.confirmedRole).length;
    const total = game.players.length;
    return {
      confirmed,
      total,
      percentage: total > 0 ? (confirmed / total) * 100 : 0,
    };
  }, [game]);

  const handleConfirm = () => {
    if (!gameId || !isPlayer || hasConfirmed) return;
    confirmPlayerRole(gameId, currentUserId);
    Taro.showToast({
      title: '已确认',
      icon: 'success',
      duration: 1500,
    });
  };

  const handleRestartVote = () => {
    if (!gameId || !isHost) return;
    Taro.showModal({
      title: '重新分配角色',
      content: '确定要重新发起角色分配投票吗？当前分配结果将作废。',
      confirmText: '重新分配',
      success: (res) => {
        if (res.confirm) {
          restartVote(gameId, currentUserId);
          Taro.showToast({
            title: '已重置',
            icon: 'success',
            duration: 1000,
          });
          setTimeout(() => {
            Taro.redirectTo({
              url: `/pages/role-plaza/index?gameId=${gameId}`,
            });
          }, 1000);
        }
      },
    });
  };

  const handleRemovePlayer = (playerId: string, playerName: string) => {
    if (!gameId || !isHost) return;
    Taro.showModal({
      title: '移出玩家',
      content: `确定要将「${playerName}」移出车局吗？角色分配将重置。`,
      confirmText: '移出',
      confirmColor: '#ef4444',
      success: (res) => {
        if (res.confirm) {
          removePlayer(gameId, currentUserId, playerId);
          Taro.showToast({
            title: '已移出',
            icon: 'success',
            duration: 1000,
          });
          setTimeout(() => {
            Taro.navigateBack();
          }, 1000);
        }
      },
    });
  };

  const handleLeave = () => {
    if (!gameId || !isPlayer || isHost) return;
    Taro.showModal({
      title: '退出车局',
      content: '确定要退出这个车局吗？角色分配将重置。',
      confirmText: '退出',
      confirmColor: '#ef4444',
      success: (res) => {
        if (res.confirm) {
          leaveGame(gameId, currentUserId);
          Taro.showToast({
            title: '已退出',
            icon: 'success',
            duration: 1000,
          });
          setTimeout(() => {
            Taro.switchTab({ url: '/pages/hall/index' });
          }, 1000);
        }
      },
    });
  };

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

  const isPreparing = game.status === 'preparing';

  return (
    <ScrollView scrollY className={styles.page}>
      <View className={styles.header}>
        <Text className={styles.successIcon}>{isPreparing ? '🚗' : '🎉'}</Text>
        <Text className={styles.title}>
          {isPreparing ? '准备开车' : '角色分配已确认'}
        </Text>
        <Text className={styles.subtitle}>
          {isPreparing
            ? '全员已确认角色，准时到店即可发车！'
            : '角色分配结果已出，确认你的角色准备发车'}
        </Text>
      </View>

      <View className={styles.resultCard}>
        <View className={styles.myRoleSection}>
          <View className={styles.myRoleHeader}>
            <Text className={styles.myRoleLabel}>你的角色</Text>
            <Text
              className={styles.hitStatus}
              style={{ color: hitStatusColor[hitStatus] }}
            >
              {hitStatusText[hitStatus]}
            </Text>
          </View>

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
            <View className={styles.myRoleDescBox}>
              <Text className={styles.myRoleDescTitle}>角色说明</Text>
              <Text className={styles.myRoleDesc}>{myAssignment.description}</Text>
            </View>
          )}

          {comfortHitInfo && (
            <View className={styles.comfortHitSection}>
              <Text className={styles.comfortHitTitle}>舒适区命中情况</Text>

              <View className={styles.comfortHitList}>
                {comfortHitInfo.crossDress.needed && comfortHitInfo.crossDress.level && (
                  <View className={styles.comfortHitItem}>
                    <Text className={styles.comfortHitLabel}>反串意愿</Text>
                    <Text
                      className={classNames(
                        styles.comfortHitValue,
                        styles[`level${comfortHitInfo.crossDress.level}`]
                      )}
                    >
                      {comfortHitInfo.crossDress.level === 'yes'
                        ? '✅ 完全接受'
                        : comfortHitInfo.crossDress.level === 'maybe'
                        ? '⚠️ 可以接受'
                        : '❌ 需要克服'}
                    </Text>
                  </View>
                )}

                {comfortHitInfo.intimate.needed && comfortHitInfo.intimate.level && (
                  <View className={styles.comfortHitItem}>
                    <Text className={styles.comfortHitLabel}>亲密戏接受度</Text>
                    <Text
                      className={classNames(
                        styles.comfortHitValue,
                        styles[`level${comfortHitInfo.intimate.level}`]
                      )}
                    >
                      {comfortHitInfo.intimate.level === 'yes'
                        ? '✅ 完全接受'
                        : comfortHitInfo.intimate.level === 'maybe'
                        ? '⚠️ 适度可接受'
                        : '❌ 需要克服'}
                    </Text>
                  </View>
                )}

                {comfortHitInfo.killer.needed && (
                  <View className={styles.comfortHitItem}>
                    <Text className={styles.comfortHitLabel}>凶手位偏好</Text>
                    <Text
                      className={classNames(
                        styles.comfortHitValue,
                        comfortHitInfo.killer.avoided ? styles.levelno : styles.levelyes
                      )}
                    >
                      {comfortHitInfo.killer.avoided ? '⚠️ 你本想避开' : '✅ 你不介意'}
                    </Text>
                  </View>
                )}

                {comfortHitInfo.highlight.needed && (
                  <View className={styles.comfortHitItem}>
                    <Text className={styles.comfortHitLabel}>高光角色偏好</Text>
                    <Text
                      className={classNames(
                        styles.comfortHitValue,
                        comfortHitInfo.highlight.preferred
                          ? styles.levelyes
                          : styles.levelneutral
                      )}
                    >
                      {comfortHitInfo.highlight.preferred ? '✅ 刚好你想要' : '📋 分配到了'}
                    </Text>
                  </View>
                )}

                {!comfortHitInfo.crossDress.needed &&
                  !comfortHitInfo.intimate.needed &&
                  !comfortHitInfo.killer.needed &&
                  !comfortHitInfo.highlight.needed && (
                    <Text style={{ fontSize: '24rpx', color: '#9ca3af' }}>
                      该角色无特殊偏好要求，分配结果自然中立
                    </Text>
                  )}
              </View>
            </View>
          )}
        </View>

        <View className={styles.confirmSection}>
          <View className={styles.confirmHeader}>
            <Text className={styles.sectionTitle}>
              <Text className={styles.sectionIcon}>✅</Text>
              开车前确认清单
            </Text>
            <Text className={styles.confirmProgress}>
              {confirmProgress.confirmed}/{confirmProgress.total}
            </Text>
          </View>

          <View className={styles.confirmProgressBar}>
            <View
              className={styles.confirmProgressFill}
              style={{ width: `${confirmProgress.percentage}%` }}
            />
          </View>

          <View className={styles.confirmList}>
            {allAssignments.map((item) => (
              <View
                key={item.playerId}
                className={classNames(
                  styles.confirmItem,
                  isHost && !item.isHost && styles.confirmItemClickable
                )}
                onClick={() => {
                  if (isHost && !item.isHost) {
                    handleRemovePlayer(item.playerId, item.playerName);
                  }
                }}
              >
                <View className={styles.confirmAvatar}>
                  {item.playerGender === 'male' ? '👨' : '👩'}
                </View>
                <View className={styles.confirmInfo}>
                  <View className={styles.confirmNameRow}>
                    <Text className={styles.confirmName}>
                      {item.playerName}
                      {item.isHost && (
                        <Text className={styles.hostBadge}>发起人</Text>
                      )}
                      {item.playerId === currentUserId && (
                        <Text className={styles.selfBadge}>你</Text>
                      )}
                    </Text>
                    <Text className={styles.confirmRole}>{item.roleName}</Text>
                  </View>
                </View>
                <View className={styles.confirmStatus}>
                  {item.confirmed ? (
                    <Text className={styles.confirmedText}>✓ 已确认</Text>
                  ) : (
                    <Text className={styles.unconfirmedText}>待确认</Text>
                  )}
                </View>
                {isHost && !item.isHost && (
                  <Text className={styles.removeHint}>移出</Text>
                )}
              </View>
            ))}
          </View>
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
                  {item.playerId === currentUserId && (
                    <Text className={styles.selfBadge}>你</Text>
                  )}
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
        {isHost && (
          <View className={styles.secondaryBtn} onClick={handleRestartVote}>
            重新分配
          </View>
        )}
        {isPlayer && !isHost && !hasConfirmed && (
          <View className={styles.secondaryBtn} onClick={handleLeave}>
            退出车局
          </View>
        )}
        {isPlayer && !hasConfirmed ? (
          <View className={styles.primaryBtn} onClick={handleConfirm}>
            我已确认角色
          </View>
        ) : !isPlayer ? (
          <View className={styles.secondaryBtn} onClick={handleBack}>
            返回详情
          </View>
        ) : (
          <View className={styles.primaryBtn} onClick={handleBackToHall}>
            回到大厅
          </View>
        )}
      </View>
    </ScrollView>
  );
};

export default RoleResultPage;
