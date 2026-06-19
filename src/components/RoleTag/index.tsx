import React from 'react';
import { View, Text } from '@tarojs/components';
import classNames from 'classnames';
import { RoleInfo } from '@/types/game';
import { getGenderText } from '@/utils/gameUtils';
import styles from './index.module.scss';

interface RoleTagProps {
  role: RoleInfo;
  showBadges?: boolean;
  size?: 'small' | 'normal';
}

const RoleTag: React.FC<RoleTagProps> = ({ role, showBadges = false, size = 'normal' }) => {
  return (
    <View className={classNames(styles.roleTag, styles[role.gender])}>
      <Text className={styles.genderIcon}>
        {role.gender === 'male' ? '♂' : role.gender === 'female' ? '♀' : '⚥'}
      </Text>
      <Text>{role.name}</Text>
      <Text style={{ fontSize: '22rpx', opacity: 0.8 }}>({getGenderText(role.gender)})</Text>
      {showBadges && role.isHighlight && (
        <Text className={styles.highlightBadge}>高光</Text>
      )}
      {showBadges && role.isKiller && (
        <Text className={styles.killerBadge}>凶手</Text>
      )}
      {showBadges && role.hasIntimateScene && (
        <Text className={styles.intimateBadge}>感情线</Text>
      )}
    </View>
  );
};

export default RoleTag;
