import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import classNames from 'classnames';
import { useGameStore } from '@/store/gameStore';
import { ComfortZone, ComfortLevel, Gender } from '@/types/game';
import styles from './index.module.scss';

const ComfortZonePage: React.FC = () => {
  const router = useRouter();
  const gameId = router.params.gameId as string;

  const getGameById = useGameStore((state) => state.getGameById);
  const updateComfortZone = useGameStore((state) => state.updateComfortZone);
  const currentUserId = useGameStore((state) => state.currentUserId);

  const game = getGameById(gameId);
  const player = game?.players.find((p) => p.id === currentUserId);
  const playerGender = player?.gender || 'male';

  const [crossDress, setCrossDress] = useState<ComfortLevel>('maybe');
  const [intimateScene, setIntimateScene] = useState<ComfortLevel>('maybe');
  const [avoidKiller, setAvoidKiller] = useState(false);
  const [preferHighlight, setPreferHighlight] = useState(false);

  useEffect(() => {
    if (player?.comfortZone) {
      const cz = player.comfortZone;
      if (playerGender === 'male') {
        setCrossDress(cz.crossDressMaleToFemale);
      } else {
        setCrossDress(cz.crossDressFemaleToMale);
      }
      setIntimateScene(cz.intimateScene);
      setAvoidKiller(cz.avoidKiller);
      setPreferHighlight(cz.preferHighlight);
    }
  }, [player, playerGender]);

  const handleSubmit = () => {
    if (!gameId) return;

    const comfortZone: ComfortZone = {
      crossDressMaleToFemale: playerGender === 'male' ? crossDress : 'no',
      crossDressFemaleToMale: playerGender === 'female' ? crossDress : 'no',
      intimateScene,
      avoidKiller,
      preferHighlight,
    };

    updateComfortZone(gameId, currentUserId, comfortZone);

    Taro.showToast({
      title: '保存成功',
      icon: 'success',
      duration: 1500,
    });

    setTimeout(() => {
      Taro.navigateBack();
    }, 1500);
  };

  const crossDressLabel = playerGender === 'male' ? '男反女' : '女反男';

  return (
    <ScrollView scrollY className={styles.page}>
      <View className={styles.header}>
        <Text className={styles.title}>设置你的舒适区</Text>
        <Text className={styles.subtitle}>
          提前说好偏好，减少现场尴尬{'\n'}你的信息将匿名展示，保护隐私
        </Text>
      </View>

      <View className={styles.card}>
        <View className={styles.anonymousBadge}>
          <Text>🔒</Text>
          <Text>匿名保护 · 仅展示统计数据</Text>
        </View>

        <View className={styles.optionGroup}>
          <Text className={styles.groupTitle}>反串意愿 · {crossDressLabel}</Text>
          <Text className={styles.groupDesc}>
            你是否愿意扮演{playerGender === 'male' ? '女性' : '男性'}角色？
          </Text>
          <View className={styles.optionsRow}>
            <View
              className={classNames(styles.optionBtn, crossDress === 'yes' && styles.activeYes)}
              onClick={() => setCrossDress('yes')}
            >
              完全可以
            </View>
            <View
              className={classNames(styles.optionBtn, crossDress === 'maybe' && styles.activeMaybe)}
              onClick={() => setCrossDress('maybe')}
            >
              看情况
            </View>
            <View
              className={classNames(styles.optionBtn, crossDress === 'no' && styles.activeNo)}
              onClick={() => setCrossDress('no')}
            >
              不行
            </View>
          </View>
        </View>

        <View className={styles.optionGroup}>
          <Text className={styles.groupTitle}>亲密戏接受度</Text>
          <Text className={styles.groupDesc}>
            如果角色有感情线或亲密互动场景，你能接受吗？
          </Text>
          <View className={styles.optionsRow}>
            <View
              className={classNames(styles.optionBtn, intimateScene === 'yes' && styles.activeYes)}
              onClick={() => setIntimateScene('yes')}
            >
              没问题
            </View>
            <View
              className={classNames(styles.optionBtn, intimateScene === 'maybe' && styles.activeMaybe)}
              onClick={() => setIntimateScene('maybe')}
            >
              适度可以
            </View>
            <View
              className={classNames(styles.optionBtn, intimateScene === 'no' && styles.activeNo)}
              onClick={() => setIntimateScene('no')}
            >
              拒绝
            </View>
          </View>
        </View>
      </View>

      <View className={styles.card}>
        <Text className={styles.sectionTitle}>
          <Text className={styles.sectionIcon}>⭐</Text>
          角色偏好
        </Text>

        <View className={styles.toggleGroup}>
          <View
            className={classNames(styles.toggleItem, avoidKiller && styles.active)}
            onClick={() => setAvoidKiller(!avoidKiller)}
          >
            <View>
              <Text className={styles.toggleLabel}>想避开凶手位</Text>
              <Text className={styles.toggleDesc}>如果不想拿凶手本，请开启</Text>
            </View>
            <View className={classNames(styles.toggleSwitch, avoidKiller && styles.active)} />
          </View>

          <View
            className={classNames(styles.toggleItem, preferHighlight && styles.active)}
            onClick={() => setPreferHighlight(!preferHighlight)}
          >
            <View>
              <Text className={styles.toggleLabel}>偏好高光角色</Text>
              <Text className={styles.toggleDesc}>希望拿到戏份多、有反转的角色</Text>
            </View>
            <View className={classNames(styles.toggleSwitch, preferHighlight && styles.active)} />
          </View>
        </View>
      </View>

      <View className={styles.tipCard}>
        <Text className={styles.tipTitle}>
          <Text>💡</Text>
          为什么要填这些？
        </Text>
        <Text className={styles.tipContent}>
          系统会根据所有人的舒适区，智能匹配最合适的角色。{'\n'}
          满员后生成「角色意向广场」，你能看到匿名的需求分布，{'\n'}
          如果有角色冲突，还可以发起投票协商。
        </Text>
      </View>

      <View className={styles.bottomBar}>
        <View className={styles.submitBtn} onClick={handleSubmit}>
          保存舒适区
        </View>
      </View>
    </ScrollView>
  );
};

export default ComfortZonePage;
