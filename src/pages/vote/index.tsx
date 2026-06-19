import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import classNames from 'classnames';
import { useGameStore } from '@/store/gameStore';
import { VoteOption } from '@/types/game';
import { formatDateTime } from '@/utils/gameUtils';
import styles from './index.module.scss';

const VotePage: React.FC = () => {
  const router = useRouter();
  const gameId = router.params.gameId as string;

  const getGameById = useGameStore((state) => state.getGameById);
  const submitVote = useGameStore((state) => state.submitVote);
  const resolveTie = useGameStore((state) => state.resolveTie);
  const endVoteByDeadline = useGameStore((state) => state.endVoteByDeadline);
  const currentUserId = useGameStore((state) => state.currentUserId);
  const getRoleById = useGameStore((state) => state.getRoleById);
  const getPlayerById = useGameStore((state) => state.getPlayerById);

  const game = getGameById(gameId);
  const voteData = game?.voteData;
  const isPlayer = game?.players.some((p) => p.id === currentUserId);
  const isHost = game?.hostId === currentUserId;

  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [isDeadlinePassed, setIsDeadlinePassed] = useState(false);

  useEffect(() => {
    if (voteData && voteData.votes[currentUserId]) {
      setSelectedOption(voteData.votes[currentUserId]);
      setHasVoted(true);
    }
  }, [voteData, currentUserId]);

  useEffect(() => {
    if (game?.status === 'confirmed') {
      Taro.redirectTo({
        url: `/pages/role-result/index?gameId=${gameId}`,
      });
    }
  }, [game?.status, gameId]);

  useEffect(() => {
    if (!voteData) return;

    const checkDeadline = () => {
      if (Date.now() > voteData.deadline && voteData.status === 'active') {
        setIsDeadlinePassed(true);
        endVoteByDeadline(gameId);
      }
    };

    checkDeadline();
    const timer = setInterval(checkDeadline, 10000);
    return () => clearInterval(timer);
  }, [voteData, gameId, endVoteByDeadline]);

  const voteStats = useMemo(() => {
    if (!voteData || !game) return {};

    const stats: Record<string, { count: number; percentage: number }> = {};
    const totalPlayers = game.players.length;

    voteData.options.forEach((opt) => {
      const count = Object.values(voteData.votes).filter((v) => v === opt.id).length;
      stats[opt.id] = {
        count,
        percentage: totalPlayers > 0 ? (count / totalPlayers) * 100 : 0,
      };
    });

    return stats;
  }, [voteData, game]);

  const isTie = voteData?.status === 'tie';

  const handleVote = () => {
    if (!selectedOption || !gameId || hasVoted || !isPlayer || isTie) return;

    submitVote(gameId, currentUserId, selectedOption);
    setHasVoted(true);

    Taro.showToast({
      title: '投票成功',
      icon: 'success',
      duration: 1500,
    });
  };

  const handleResolveTie = (optionId: string) => {
    if (!isHost || !isTie) return;

    Taro.showModal({
      title: '确认最终方案',
      content: '作为发起人，你将决定最终的角色分配方案，是否确认？',
      success: (res) => {
        if (res.confirm) {
          resolveTie(gameId, currentUserId, optionId);
        }
      },
    });
  };

  const handleViewResult = () => {
    Taro.redirectTo({
      url: `/pages/role-result/index?gameId=${gameId}`,
    });
  };

  if (!game || !voteData) {
    return (
      <View className={styles.page}>
        <View style={{ textAlign: 'center', padding: '100rpx 0' }}>
          <Text style={{ fontSize: '48rpx', marginBottom: '16rpx' }}>😢</Text>
          <Text style={{ fontSize: '28rpx', color: '#9ca3af' }}>投票不存在</Text>
        </View>
      </View>
    );
  }

  const totalVotes = game.players.filter((p) => voteData.votes[p.id]).length;
  const totalPlayers = game.players.length;
  const allVoted = totalVotes >= totalPlayers;
  const progress = (totalVotes / totalPlayers) * 100;

  const getRoleAssignmentsDisplay = (option: VoteOption) => {
    return Object.entries(option.roleAssignments).map(([playerId, roleId]) => {
      const role = getRoleById(gameId, roleId);
      const player = getPlayerById(gameId, playerId);
      return {
        playerName: player?.nickname || '未知玩家',
        roleName: role?.name || '未知角色',
      };
    });
  };

  return (
    <ScrollView scrollY className={styles.page}>
      <View className={styles.header}>
        <Text className={styles.title}>{isTie ? '平局，发起人裁定' : '协商投票'}</Text>
        <Text className={styles.subtitle}>
          {isTie
            ? '投票结果平局，请发起人选择最终角色分配方案'
            : '角色分配存在冲突，请选择你更倾向的方案\n投票结束后将按多数人的选择确定角色'}
        </Text>
      </View>

      <View className={styles.infoCard}>
        <View className={styles.progressRow}>
          <Text className={styles.progressLabel}>投票进度</Text>
          <Text className={styles.progressValue}>
            {totalVotes}/{totalPlayers} 人已投票
          </Text>
        </View>
        <View className={styles.progressBar}>
          <View className={styles.progressFill} style={{ width: `${progress}%` }} />
        </View>
        <Text className={styles.timeLeft}>
          {allVoted && !isTie
            ? '✅ 全员已投票'
            : isTie
            ? '🤝 等待发起人裁定'
            : isDeadlinePassed
            ? '⏰ 投票已截止，按当前有效票结算'
            : `还剩 ${totalPlayers - totalVotes} 人未投票 · 截止 ${formatDateTime(voteData.deadline)}`}
        </Text>
      </View>

      {!isTie && (
        <View className={styles.tipCard}>
          <Text className={styles.tipTitle}>
            <Text>💡</Text>
            为什么需要投票？
          </Text>
          <Text className={styles.tipContent}>
            根据大家填写的舒适区，系统生成了两种角色分配方案。{'\n'}
            请选择你更倾向的方案，最终按多数票结果执行。
          </Text>
        </View>
      )}

      {isTie && (
        <View className={styles.tieCard}>
          <Text className={styles.tieTitle}>
            <Text>🤝</Text>
            投票结果平局
          </Text>
          <Text className={styles.tieContent}>
            {isHost
              ? '作为发起人，请你在下方选择最终的角色分配方案'
              : '发起人正在裁定最终方案，请稍候...'}
          </Text>
        </View>
      )}

      <View className={styles.voteSection}>
        <Text className={styles.sectionTitle}>
          {isTie && isHost ? '发起人选择最终方案' : '投票选项'}
        </Text>

        {voteData.options.map((option) => {
          const stats = voteStats[option.id] || { count: 0, percentage: 0 };
          const assignments = getRoleAssignmentsDisplay(option);
          const canSelect = !isTie ? isPlayer && !hasVoted : isHost && isTie;

          return (
            <View
              key={option.id}
              className={classNames(
                styles.voteCard,
                selectedOption === option.id && styles.selected,
                (!canSelect) && styles.disabledCard
              )}
              onClick={() => {
                if (!canSelect) return;
                if (isTie && isHost) {
                  handleResolveTie(option.id);
                } else {
                  setSelectedOption(option.id);
                }
              }}
            >
              <View className={styles.voteCardHeader}>
                <Text className={styles.optionTitle}>{option.title}</Text>
                <View
                  className={classNames(
                    styles.optionBadge,
                    selectedOption === option.id && styles.selected
                  )}
                >
                  {isTie && isHost
                    ? '点击确定此方案'
                    : selectedOption === option.id
                    ? '已选择'
                    : hasVoted || !isPlayer
                    ? '不可选择'
                    : '点击选择'}
                </View>
              </View>

              <Text className={styles.optionDesc}>{option.description}</Text>

              <View className={styles.optionRoles}>
                <Text className={styles.optionRolesTitle}>角色分配预览</Text>
                <View className={styles.roleList}>
                  {assignments.slice(0, 4).map((item, index) => (
                    <View key={index} className={styles.roleItem}>
                      <Text className={styles.roleName}>{item.roleName}</Text>
                      <Text className={styles.rolePlayer}>→ {item.playerName}</Text>
                    </View>
                  ))}
                  {assignments.length > 4 && (
                    <Text style={{ fontSize: '24rpx', color: '#9ca3af', marginTop: '8rpx' }}>
                      还有 {assignments.length - 4} 个角色...
                    </Text>
                  )}
                </View>
              </View>

              {hasVoted && (
                <View className={styles.voteStats}>
                  <Text className={styles.voteCount}>{stats.count} 票</Text>
                  <View className={styles.voteMiniBar}>
                    <View
                      className={styles.voteMiniFill}
                      style={{ width: `${stats.percentage}%` }}
                    />
                  </View>
                  <Text className={styles.votePercent}>{stats.percentage.toFixed(0)}%</Text>
                </View>
              )}
            </View>
          );
        })}
      </View>

      <View className={styles.bottomBar}>
        {allVoted && !isTie ? (
          <View className={styles.primaryBtn} onClick={handleViewResult}>
            查看最终结果
          </View>
        ) : !isPlayer ? (
          <View className={styles.secondaryBtn}>
            非本场玩家，仅可查看
          </View>
        ) : isTie && !isHost ? (
          <View className={styles.secondaryBtn}>
            等待发起人裁定...
          </View>
        ) : isTie && isHost ? (
          <View className={styles.secondaryBtn}>
            请在上方点击选择最终方案
          </View>
        ) : hasVoted ? (
          <View className={styles.secondaryBtn}>
            已投票，等待其他人...
          </View>
        ) : (
          <View
            className={classNames(styles.primaryBtn, !selectedOption && styles.disabled)}
            onClick={handleVote}
          >
            确认投票
          </View>
        )}
      </View>
    </ScrollView>
  );
};

export default VotePage;
