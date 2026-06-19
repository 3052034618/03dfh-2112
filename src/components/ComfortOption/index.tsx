import React from 'react';
import { View, Text } from '@tarojs/components';
import classNames from 'classnames';
import { ComfortLevel } from '@/types/game';
import styles from './index.module.scss';

interface OptionGroupProps {
  title: string;
  description?: string;
  value: ComfortLevel;
  onChange: (value: ComfortLevel) => void;
}

export const OptionGroup: React.FC<OptionGroupProps> = ({ title, description, value, onChange }) => {
  return (
    <View className={styles.optionGroup}>
      <Text className={styles.groupTitle}>{title}</Text>
      {description && <Text className={styles.groupDesc}>{description}</Text>}
      <View className={styles.optionsRow}>
        <View
          className={classNames(styles.optionBtn, value === 'yes' && styles.activeYes)}
          onClick={() => onChange('yes')}
        >
          可以
        </View>
        <View
          className={classNames(styles.optionBtn, value === 'maybe' && styles.activeMaybe)}
          onClick={() => onChange('maybe')}
        >
          看情况
        </View>
        <View
          className={classNames(styles.optionBtn, value === 'no' && styles.activeNo)}
          onClick={() => onChange('no')}
        >
          不行
        </View>
      </View>
    </View>
  );
};

interface ToggleItemProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export const ToggleItem: React.FC<ToggleItemProps> = ({ label, description, checked, onChange }) => {
  return (
    <View
      className={classNames(styles.toggleItem, checked && styles.active)}
      onClick={() => onChange(!checked)}
    >
      <View>
        <Text className={styles.toggleLabel}>{label}</Text>
        {description && <Text className={styles.toggleDesc}>{description}</Text>}
      </View>
      <View className={classNames(styles.toggleSwitch, checked && styles.active)} />
    </View>
  );
};

interface ToggleGroupProps {
  title: string;
  description?: string;
  items: { label: string; description?: string; checked: boolean; onChange: (checked: boolean) => void }[];
}

export const ToggleGroup: React.FC<ToggleGroupProps> = ({ title, description, items }) => {
  return (
    <View className={styles.optionGroup}>
      <Text className={styles.groupTitle}>{title}</Text>
      {description && <Text className={styles.groupDesc}>{description}</Text>}
      <View className={styles.toggleGroup}>
        {items.map((item, index) => (
          <ToggleItem
            key={index}
            label={item.label}
            description={item.description}
            checked={item.checked}
            onChange={item.onChange}
          />
        ))}
      </View>
    </View>
  );
};
