import React from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classNames from 'classnames';
import { Game } from '@/types/game';
import { getGameStatusText, getGameStatusColor, formatDateTime } from '@/utils/gameUtils';
import styles from './index.module.scss';

interface GameCardProps {
  game: Game;
  onClick?: () => void;
}

const GameCard: React.FC<GameCardProps> = ({ game, onClick }) => {
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      Taro.navigateTo({
        url: `/pages/game-detail/index?id=${game.id}`,
      });
    }
  };

  const progress = (game.players.length / game.totalPlayers) * 100;

  return (
    <View className={styles.card} onClick={handleClick}>
      <View className={styles.header}>
        <Text className={styles.title}>{game.title}</Text>
        <View
          className={styles.statusTag}
          style={{ backgroundColor: `${getGameStatusColor(game.status)}15`, color: getGameStatusColor(game.status) }}
        >
          {getGameStatusText(game.status)}
        </View>
      </View>

      <View className={styles.scriptInfo}>
        <View className={styles.typeTag}>{game.scriptType}</View>
        <Text className={styles.scriptName}>{game.scriptName}</Text>
      </View>

      <View className={styles.meta}>
        <View className={styles.metaItem}>
          <Text className={styles.label}>时间</Text>
          <Text>{formatDateTime(game.startTime)}</Text>
        </View>
        <View className={styles.metaItem}>
          <Text className={styles.label}>地点</Text>
          <Text style={{ maxWidth: '200rpx' }}>{game.location.split('·')[1] || game.location}</Text>
        </View>
      </View>

      <View className={styles.genderInfo}>
        <Text className={styles.maleIcon}>♂</Text>
        <Text style={{ color: '#3b82f6', fontSize: '24rpx' }}>{game.maleRoles}男</Text>
        <Text style={{ color: '#9ca3af', fontSize: '24rpx', margin: '0 8rpx' }}>/</Text>
        <Text className={styles.femaleIcon}>♀</Text>
        <Text style={{ color: '#ec4899', fontSize: '24rpx' }}>{game.femaleRoles}女</Text>
        {game.allowCrossDress && (
          <View className={styles.crossDressTag}>可反串</View>
        )}
      </View>

      <View className={styles.progressWrap}>
        <View className={styles.progressBar}>
          <View className={styles.progressFill} style={{ width: `${progress}%` }} />
        </View>
        <View className={styles.progressText}>
          <Text>
            <Text className={styles.playerCount}>{game.players.length}</Text>
            <Text>/{game.totalPlayers}人</Text>
          </Text>
          <Text>还差 {game.totalPlayers - game.players.length} 人</Text>
        </View>
      </View>
    </View>
  );
};

export default GameCard;
