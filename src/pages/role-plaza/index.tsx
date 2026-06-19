import React, { useMemo, useEffect, useState } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import classNames from 'classnames';
import { useGameStore } from '@/store/gameStore';
import { analyzeComfortDistribution, getCandidateRoles, checkRoleConflict, getGenderText } from '@/utils/gameUtils';
import { RoleInfo } from '@/types/game';
import styles from './index.module.scss';

const RolePlazaPage: React.FC = () => {
  const router = useRouter();
  const gameId = router.params.gameId as string;

  const getGameById = useGameStore((state) => state.getGameById);
  const currentUserId = useGameStore((state) => state.currentUserId);

  const game = getGameById(gameId);
  const player = game?.players.find((p) => p.id === currentUserId);
  const isHost = game?.hostId === currentUserId;

  const [candidateRoles, setCandidateRoles] = useState<RoleInfo[]>([]);

  const distribution = useMemo(() => {
    if (!game) return null;
    return analyzeComfortDistribution(game.players);
  }, [game]);

  const conflict = useMemo(() => {
    if (!game) return null;
    return checkRoleConflict(game);
  }, [game]);

  const allFilled = useMemo(() => {
    if (!game) return false;
    return game.players.every((p) => p.comfortZone);
  }, [game]);

  useEffect(() => {
    if (game && player && player.comfortZone) {
      const candidates = getCandidateRoles(player, game.roles, game.allowCrossDress);
      setCandidateRoles(candidates);
    }
  }, [game, player]);

  const handleStartVote = () => {
    if (!game) return;
    Taro.showModal({
      title: '发起协商投票',
      content: '检测到角色分配存在冲突，是否发起投票让大家选择方案？',
      confirmText: '发起投票',
      success: (res) => {
        if (res.confirm) {
          Taro.showToast({
            title: '投票已发起',
            icon: 'success',
          });
          setTimeout(() => {
            Taro.redirectTo({
              url: `/pages/vote/index?gameId=${game.id}`,
            });
          }, 1500);
        }
      },
    });
  };

  const handleConfirmRoles = () => {
    if (!game) return;
    Taro.showToast({
      title: '功能开发中',
      icon: 'none',
    });
  };

  if (!game || !distribution) {
    return (
      <View className={styles.page}>
        <View style={{ textAlign: 'center', padding: '100rpx 0' }}>
          <Text style={{ fontSize: '48rpx', marginBottom: '16rpx' }}>😢</Text>
          <Text style={{ fontSize: '28rpx', color: '#9ca3af' }}>数据加载失败</Text>
        </View>
      </View>
    );
  }

  const filledCount = distribution.totalFilled;
  const totalCount = game.players.length;
  const progress = (filledCount / totalCount) * 100;

  const crossDressPercentages = {
    yes: (distribution.crossDress.yes / filledCount) * 100 || 0,
    maybe: (distribution.crossDress.maybe / filledCount) * 100 || 0,
    no: (distribution.crossDress.no / filledCount) * 100 || 0,
  };

  const intimatePercentages = {
    yes: (distribution.intimate.yes / filledCount) * 100 || 0,
    maybe: (distribution.intimate.maybe / filledCount) * 100 || 0,
    no: (distribution.intimate.no / filledCount) * 100 || 0,
  };

  return (
    <ScrollView scrollY className={styles.page}>
      <View className={styles.header}>
        <Text className={styles.title}>角色意向广场</Text>
        <Text className={styles.subtitle}>匿名展示大家的偏好，保护隐私</Text>
      </View>

      <View className={styles.progressCard}>
        <View className={styles.progressTitle}>
          <Text>舒适区填写进度</Text>
          <Text className={styles.progressNumber}>
            {filledCount}/{totalCount}
          </Text>
        </View>
        <View className={styles.progressBar}>
          <View className={styles.progressFill} style={{ width: `${progress}%` }} />
        </View>
        {!allFilled && (
          <Text style={{ fontSize: '24rpx', color: '#9ca3af', marginTop: '12rpx' }}>
            还有 {totalCount - filledCount} 位玩家未填写，全部填写后可查看匹配结果
          </Text>
        )}
      </View>

      <View className={styles.anonymousNote}>
        <Text>🔒</Text>
        <Text>所有数据均为匿名统计，不会暴露个人选择</Text>
      </View>

      <View className={styles.card}>
        <Text className={styles.cardTitle}>
          <Text className={styles.cardIcon}>🎭</Text>
          反串意愿分布
        </Text>

        <View className={styles.distributionItem}>
          <View className={styles.distributionLabel}>
            <Text>愿意反串</Text>
            <Text>{distribution.crossDress.yes}人 · {crossDressPercentages.yes.toFixed(0)}%</Text>
          </View>
          <View className={styles.distributionBar}>
            <View
              className={classNames(styles.distributionSegment, styles.segmentYes)}
              style={{ width: `${crossDressPercentages.yes}%` }}
            >
              {crossDressPercentages.yes > 15 ? '可以' : ''}
            </View>
            <View
              className={classNames(styles.distributionSegment, styles.segmentMaybe)}
              style={{ width: `${crossDressPercentages.maybe}%` }}
            >
              {crossDressPercentages.maybe > 15 ? '看情况' : ''}
            </View>
            <View
              className={classNames(styles.distributionSegment, styles.segmentNo)}
              style={{ width: `${crossDressPercentages.no}%` }}
            >
              {crossDressPercentages.no > 15 ? '不行' : ''}
            </View>
          </View>
          <View className={styles.legendRow}>
            <View className={styles.legendItem}>
              <View className={classNames(styles.legendDot, styles.dotYes)} />
              <Text>可以 {distribution.crossDress.yes}人</Text>
            </View>
            <View className={styles.legendItem}>
              <View className={classNames(styles.legendDot, styles.dotMaybe)} />
              <Text>看情况 {distribution.crossDress.maybe}人</Text>
            </View>
            <View className={styles.legendItem}>
              <View className={classNames(styles.legendDot, styles.dotNo)} />
              <Text>不行 {distribution.crossDress.no}人</Text>
            </View>
          </View>
        </View>
      </View>

      <View className={styles.card}>
        <Text className={styles.cardTitle}>
          <Text className={styles.cardIcon}>💕</Text>
          亲密戏接受度
        </Text>

        <View className={styles.distributionItem}>
          <View className={styles.distributionLabel}>
            <Text>接受程度</Text>
            <Text>{distribution.intimate.yes + distribution.intimate.maybe}人可接受</Text>
          </View>
          <View className={styles.distributionBar}>
            <View
              className={classNames(styles.distributionSegment, styles.segmentYes)}
              style={{ width: `${intimatePercentages.yes}%` }}
            >
              {intimatePercentages.yes > 15 ? '没问题' : ''}
            </View>
            <View
              className={classNames(styles.distributionSegment, styles.segmentMaybe)}
              style={{ width: `${intimatePercentages.maybe}%` }}
            >
              {intimatePercentages.maybe > 15 ? '适度' : ''}
            </View>
            <View
              className={classNames(styles.distributionSegment, styles.segmentNo)}
              style={{ width: `${intimatePercentages.no}%` }}
            >
              {intimatePercentages.no > 15 ? '拒绝' : ''}
            </View>
          </View>
          <View className={styles.legendRow}>
            <View className={styles.legendItem}>
              <View className={classNames(styles.legendDot, styles.dotYes)} />
              <Text>没问题 {distribution.intimate.yes}人</Text>
            </View>
            <View className={styles.legendItem}>
              <View className={classNames(styles.legendDot, styles.dotMaybe)} />
              <Text>适度 {distribution.intimate.maybe}人</Text>
            </View>
            <View className={styles.legendItem}>
              <View className={classNames(styles.legendDot, styles.dotNo)} />
              <Text>拒绝 {distribution.intimate.no}人</Text>
            </View>
          </View>
        </View>
      </View>

      <View className={styles.card}>
        <Text className={styles.cardTitle}>
          <Text className={styles.cardIcon}>🔪</Text>
          凶手位偏好
        </Text>
        <View style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontSize: '28rpx', color: '#4b5563' }}>想避开凶手位</Text>
          <Text style={{ fontSize: '28rpx', color: '#ef4444', fontWeight: 600 }}>
            {distribution.avoidKiller} 人 ({filledCount > 0 ? ((distribution.avoidKiller / filledCount) * 100).toFixed(0) : 0}%)
          </Text>
        </View>
      </View>

      <View className={styles.card}>
        <Text className={styles.cardTitle}>
          <Text className={styles.cardIcon}>⭐</Text>
          高光角色偏好
        </Text>
        <View style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontSize: '28rpx', color: '#4b5563' }}>偏好高光角色</Text>
          <Text style={{ fontSize: '28rpx', color: '#f59e0b', fontWeight: 600 }}>
            {distribution.preferHighlight} 人 ({filledCount > 0 ? ((distribution.preferHighlight / filledCount) * 100).toFixed(0) : 0}%)
          </Text>
        </View>
      </View>

      {allFilled && player?.comfortZone && (
        <View className={styles.card}>
          <Text className={styles.cardTitle}>
            <Text className={styles.cardIcon}>🎯</Text>
            我的候选角色
          </Text>
          <Text style={{ fontSize: '24rpx', color: '#9ca3af', marginBottom: '24rpx' }}>
            基于你的舒适区智能匹配，按匹配度排序
          </Text>
          <View className={styles.candidateRoles}>
            {candidateRoles.map((role, index) => (
              <View
                key={role.id}
                className={classNames(styles.candidateRoleItem, index === 0 && styles.primary)}
              >
                <View className={classNames(styles.roleRank, styles[`rank${index + 1}`])}>
                  {index + 1}
                </View>
                <View className={styles.roleInfo}>
                  <Text className={styles.roleName}>
                    {role.name}
                    <Text style={{ fontSize: '24rpx', color: '#9ca3af', marginLeft: '8rpx' }}>
                      ({getGenderText(role.gender)})
                    </Text>
                  </Text>
                  <Text className={styles.roleDesc}>{role.description}</Text>
                  <View className={styles.roleBadges}>
                    {role.isHighlight && (
                      <Text className={classNames(styles.miniBadge, styles.badgeHighlight)}>
                        高光
                      </Text>
                    )}
                    {role.isKiller && (
                      <Text className={classNames(styles.miniBadge, styles.badgeKiller)}>
                        可能是凶手
                      </Text>
                    )}
                    {role.hasIntimateScene && (
                      <Text className={classNames(styles.miniBadge, styles.badgeIntimate)}>
                        有感情线
                      </Text>
                    )}
                  </View>
                </View>
              </View>
            ))}

            {candidateRoles.length === 0 && (
              <View style={{ textAlign: 'center', padding: '40rpx 0' }}>
                <Text style={{ fontSize: '40rpx', marginBottom: '12rpx' }}>🤔</Text>
                <Text style={{ fontSize: '26rpx', color: '#9ca3af' }}>暂无匹配的候选角色</Text>
              </View>
            )}
          </View>
        </View>
      )}

      {allFilled && conflict?.hasConflict && isHost && (
        <View className={styles.conflictWarning}>
          <Text className={styles.warningTitle}>
            <Text>⚠️</Text>
            检测到角色冲突
          </Text>
          <Text className={styles.warningContent}>
            有 {conflict.conflictingRoles.length} 个角色可能没人愿意反串，
            建议发起协商投票，让大家共同决定角色分配方案。
          </Text>
        </View>
      )}

      <View className={styles.bottomBar}>
        {isHost && allFilled && conflict?.hasConflict ? (
          <View className={styles.primaryBtn} onClick={handleStartVote}>
            发起协商投票
          </View>
        ) : isHost && allFilled ? (
          <View className={styles.primaryBtn} onClick={handleConfirmRoles}>
            确认角色分配
          </View>
        ) : !allFilled ? (
          <View className={classNames(styles.primaryBtn, styles.disabled)}>
            等待其他玩家填写...
          </View>
        ) : (
          <View className={styles.secondaryBtn} onClick={() => Taro.navigateBack()}>
            返回车局详情
          </View>
        )}
      </View>
    </ScrollView>
  );
};

export default RolePlazaPage;
