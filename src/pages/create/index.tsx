import React, { useState } from 'react';
import { View, Text, Input, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classNames from 'classnames';
import { useGameStore } from '@/store/gameStore';
import { mockScripts } from '@/data/mockGames';
import { Script, Gender } from '@/types/game';
import styles from './index.module.scss';

const CreatePage: React.FC = () => {
  const createGame = useGameStore((state) => state.createGame);
  
  const [title, setTitle] = useState('');
  const [selectedScript, setSelectedScript] = useState<Script | null>(null);
  const [maleCount, setMaleCount] = useState(3);
  const [femaleCount, setFemaleCount] = useState(3);
  const [allowCrossDress, setAllowCrossDress] = useState(true);
  const [location, setLocation] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [description, setDescription] = useState('');
  const [nickname, setNickname] = useState('');
  const [gender, setGender] = useState<Gender>('male');

  const totalPlayers = maleCount + femaleCount;

  const canSubmit = title && selectedScript && location && date && time && nickname;

  const handleSelectScript = (script: Script) => {
    setSelectedScript(script);
    setMaleCount(script.maleRoles);
    setFemaleCount(script.femaleRoles);
    if (!title) {
      setTitle(`${script.name}·找队友`);
    }
  };

  const handleSubmit = () => {
    if (!canSubmit || !selectedScript) return;

    const dateTimeStr = `${date}T${time}:00`;
    const startTime = new Date(dateTimeStr).getTime();

    const newGameId = createGame({
      title,
      scriptName: selectedScript.name,
      scriptType: selectedScript.type,
      totalPlayers,
      maleRoles: maleCount,
      femaleRoles: femaleCount,
      allowCrossDress,
      roles: selectedScript.roles,
      startTime,
      location,
      description,
      host: {
        nickname,
        gender,
      },
    });

    Taro.showToast({
      title: '发布成功',
      icon: 'success',
      duration: 1500,
    });

    setTimeout(() => {
      Taro.redirectTo({
        url: `/pages/game-detail/index?id=${newGameId}`,
      });
    }, 1500);
  };

  return (
    <ScrollView scrollY className={styles.page}>
      <View className={styles.formSection}>
        <Text className={styles.sectionTitle}>
          <Text className={styles.sectionIcon}>✏️</Text>
          基本信息
        </Text>

        <View className={styles.formItem}>
          <Text className={styles.itemLabel}>车局名称</Text>
          <Input
            className={styles.itemInput}
            placeholder="给车局起个名字"
            placeholderStyle="color: #9ca3af"
            value={title}
            onInput={(e) => setTitle(e.detail.value)}
          />
        </View>

        <View className={styles.formItem}>
          <Text className={styles.itemLabel}>我的昵称</Text>
          <Input
            className={styles.itemInput}
            placeholder="输入你的昵称"
            placeholderStyle="color: #9ca3af"
            value={nickname}
            onInput={(e) => setNickname(e.detail.value)}
          />
        </View>

        <View className={styles.formItem}>
          <Text className={styles.itemLabel}>我的性别</Text>
          <View style={{ display: 'flex', gap: '16rpx' }}>
            <View
              className={classNames(styles.counterBtn, { [styles.active]: gender === 'male' })}
              style={{
                flex: 1,
                height: '80rpx',
                borderRadius: '12rpx',
                background: gender === 'male' ? 'rgba(59, 130, 246, 0.1)' : '#f3f4f6',
                color: gender === 'male' ? '#3b82f6' : '#6b7280',
                fontSize: '28rpx',
                border: gender === 'male' ? '2rpx solid #3b82f6' : '2rpx solid transparent',
              }}
              onClick={() => setGender('male')}
            >
              男生
            </View>
            <View
              className={classNames(styles.counterBtn, { [styles.active]: gender === 'female' })}
              style={{
                flex: 1,
                height: '80rpx',
                borderRadius: '12rpx',
                background: gender === 'female' ? 'rgba(236, 72, 153, 0.1)' : '#f3f4f6',
                color: gender === 'female' ? '#ec4899' : '#6b7280',
                fontSize: '28rpx',
                border: gender === 'female' ? '2rpx solid #ec4899' : '2rpx solid transparent',
              }}
              onClick={() => setGender('female')}
            >
              女生
            </View>
          </View>
        </View>
      </View>

      <View className={styles.formSection}>
        <Text className={styles.sectionTitle}>
          <Text className={styles.sectionIcon}>📚</Text>
          选择剧本
        </Text>

        <View className={styles.scriptList}>
          {mockScripts.map((script) => (
            <View
              key={script.id}
              className={classNames(styles.scriptItem, selectedScript?.id === script.id && styles.selected)}
              onClick={() => handleSelectScript(script)}
            >
              <Text className={styles.scriptName}>{script.name}</Text>
              <View className={styles.scriptMeta}>
                <Text className={styles.scriptTag}>{script.type}</Text>
                <Text className={styles.scriptTag}>{script.playerCount}</Text>
                <Text className={styles.scriptTag}>{script.duration}</Text>
                <Text className={styles.scriptTag}>
                  {'⭐'.repeat(script.difficulty)}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      <View className={styles.formSection}>
        <Text className={styles.sectionTitle}>
          <Text className={styles.sectionIcon}>👥</Text>
          角色配置
        </Text>

        <View className={styles.genderConfig}>
          <View className={styles.genderItem}>
            <Text className={classNames(styles.genderIcon, styles.maleColor)}>♂ 男角色</Text>
            <View className={styles.genderCounter}>
              <View
                className={classNames(styles.counterBtn, maleCount <= 0 && styles.disabled)}
                onClick={() => maleCount > 0 && setMaleCount(maleCount - 1)}
              >
                -
              </View>
              <Text className={classNames(styles.counterValue, styles.maleColor)}>{maleCount}</Text>
              <View
                className={styles.counterBtn}
                onClick={() => setMaleCount(maleCount + 1)}
              >
                +
              </View>
            </View>
          </View>

          <View className={styles.genderItem}>
            <Text className={classNames(styles.genderIcon, styles.femaleColor)}>♀ 女角色</Text>
            <View className={styles.genderCounter}>
              <View
                className={classNames(styles.counterBtn, femaleCount <= 0 && styles.disabled)}
                onClick={() => femaleCount > 0 && setFemaleCount(femaleCount - 1)}
              >
                -
              </View>
              <Text className={classNames(styles.counterValue, styles.femaleColor)}>{femaleCount}</Text>
              <View
                className={styles.counterBtn}
                onClick={() => setFemaleCount(femaleCount + 1)}
              >
                +
              </View>
            </View>
          </View>
        </View>

        <View style={{ marginTop: '24rpx', textAlign: 'center' }}>
          <Text style={{ fontSize: '28rpx', color: '#6b7280' }}>
            共 <Text style={{ color: '#7c3aed', fontWeight: 600, fontSize: '32rpx' }}>{totalPlayers}</Text> 人
          </Text>
        </View>
      </View>

      <View className={styles.formSection}>
        <Text className={styles.sectionTitle}>
          <Text className={styles.sectionIcon}>🎭</Text>
          反串设置
        </Text>

        <View className={styles.switchRow}>
          <View>
            <Text className={styles.switchLabel}>允许反串</Text>
            <Text className={styles.switchDesc}>开启后，玩家可以扮演不同性别的角色</Text>
          </View>
          <View
            className={classNames(styles.switch, allowCrossDress && styles.active)}
            onClick={() => setAllowCrossDress(!allowCrossDress)}
          />
        </View>
      </View>

      <View className={styles.formSection}>
        <Text className={styles.sectionTitle}>
          <Text className={styles.sectionIcon}>📍</Text>
          时间地点
        </Text>

        <View className={styles.formItem}>
          <Text className={styles.itemLabel}>日期</Text>
          <Input
            className={styles.itemInput}
            placeholder="如：2024-06-20"
            placeholderStyle="color: #9ca3af"
            value={date}
            onInput={(e) => setDate(e.detail.value)}
          />
        </View>

        <View className={styles.formItem}>
          <Text className={styles.itemLabel}>时间</Text>
          <Input
            className={styles.itemInput}
            placeholder="如：14:00"
            placeholderStyle="color: #9ca3af"
            value={time}
            onInput={(e) => setTime(e.detail.value)}
          />
        </View>

        <View className={styles.formItem}>
          <Text className={styles.itemLabel}>地点</Text>
          <Input
            className={styles.itemInput}
            placeholder="剧本杀店名称或地址"
            placeholderStyle="color: #9ca3af"
            value={location}
            onInput={(e) => setLocation(e.detail.value)}
          />
        </View>

        <View className={styles.formItem}>
          <Text className={styles.itemLabel}>备注（选填）</Text>
          <Input
            className={styles.itemTextarea}
            placeholder="对队友的要求、注意事项等"
            placeholderStyle="color: #9ca3af"
            value={description}
            onInput={(e) => setDescription(e.detail.value)}
          />
        </View>
      </View>

      <View className={styles.bottomBar}>
        <View
          className={classNames(styles.submitBtn, !canSubmit && styles.disabled)}
          onClick={handleSubmit}
        >
          发布车局
        </View>
      </View>
    </ScrollView>
  );
};

export default CreatePage;
