import { Game, Gender, ComfortZone, RoleInfo, Player, ComfortLevel } from '@/types/game';

export const getGenderText = (gender: Gender): string => {
  const map: Record<Gender, string> = {
    male: '男',
    female: '女',
    neutral: '不限',
  };
  return map[gender];
};

export const getGenderColor = (gender: Gender): string => {
  const map: Record<Gender, string> = {
    male: '#3b82f6',
    female: '#ec4899',
    neutral: '#8b5cf6',
  };
  return map[gender];
};

export const getGameStatusText = (status: Game['status']): string => {
  const map: Record<Game['status'], string> = {
    recruiting: '招募中',
    full: '已满员',
    voting: '投票中',
    confirmed: '已确认',
    preparing: '准备开车',
  };
  return map[status];
};

export const getGameStatusColor = (status: Game['status']): string => {
  const map: Record<Game['status'], string> = {
    recruiting: '#10b981',
    full: '#f59e0b',
    voting: '#7c3aed',
    confirmed: '#3b82f6',
    preparing: '#10b981',
  };
  return map[status];
};

export const getComfortLevelText = (level: ComfortLevel): string => {
  const map: Record<ComfortLevel, string> = {
    yes: '可以',
    maybe: '看情况',
    no: '不行',
  };
  return map[level];
};

export const getComfortLevelColor = (level: ComfortLevel): string => {
  const map: Record<ComfortLevel, string> = {
    yes: '#10b981',
    maybe: '#f59e0b',
    no: '#ef4444',
  };
  return map[level];
};

export const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${month}月${day}日 ${hours}:${minutes}`;
};

export const formatDateTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const weekDay = weekDays[date.getDay()];
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${month}/${day} ${weekDay} ${hours}:${minutes}`;
};

export const calculateRoleMatch = (
  player: Player,
  role: RoleInfo,
  allowCrossDress: boolean
): number => {
  let score = 0;

  if (role.gender === 'neutral') {
    score += 30;
  } else if (player.gender === role.gender) {
    score += 30;
  } else if (allowCrossDress && player.comfortZone) {
    const crossDressKey = player.gender === 'male' ? 'crossDressMaleToFemale' : 'crossDressFemaleToMale';
    const level = player.comfortZone[crossDressKey];
    if (level === 'yes') score += 20;
    else if (level === 'maybe') score += 10;
    else score += 0;
  } else {
    return -100;
  }

  if (player.comfortZone) {
    if (role.hasIntimateScene) {
      if (player.comfortZone.intimateScene === 'yes') score += 20;
      else if (player.comfortZone.intimateScene === 'maybe') score += 10;
      else score -= 30;
    } else {
      score += 10;
    }

    if (role.isKiller) {
      if (player.comfortZone.avoidKiller) score -= 20;
      else score += 10;
    } else {
      score += 5;
    }

    if (role.isHighlight) {
      if (player.comfortZone.preferHighlight) score += 20;
      else score += 5;
    } else {
      score += 5;
    }
  }

  return score;
};

export const getCandidateRoles = (
  player: Player,
  roles: RoleInfo[],
  allowCrossDress: boolean
): RoleInfo[] => {
  const scored = roles
    .map((role) => ({
      role,
      score: calculateRoleMatch(player, role, allowCrossDress),
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, 3).map((item) => item.role);
};

export const analyzeComfortDistribution = (
  players: Player[]
): {
  crossDress: { yes: number; maybe: number; no: number };
  intimate: { yes: number; maybe: number; no: number };
  avoidKiller: number;
  preferHighlight: number;
  totalFilled: number;
} => {
  const filledPlayers = players.filter((p) => p.comfortZone);
  const total = filledPlayers.length;

  let crossDressYes = 0;
  let crossDressMaybe = 0;
  let crossDressNo = 0;
  let intimateYes = 0;
  let intimateMaybe = 0;
  let intimateNo = 0;
  let avoidKiller = 0;
  let preferHighlight = 0;

  filledPlayers.forEach((p) => {
    const cz = p.comfortZone!;
    
    if (cz.crossDressMaleToFemale === 'yes' || cz.crossDressFemaleToMale === 'yes') {
      crossDressYes++;
    } else if (cz.crossDressMaleToFemale === 'maybe' || cz.crossDressFemaleToMale === 'maybe') {
      crossDressMaybe++;
    } else {
      crossDressNo++;
    }

    if (cz.intimateScene === 'yes') intimateYes++;
    else if (cz.intimateScene === 'maybe') intimateMaybe++;
    else intimateNo++;

    if (cz.avoidKiller) avoidKiller++;
    if (cz.preferHighlight) preferHighlight++;
  });

  return {
    crossDress: { yes: crossDressYes, maybe: crossDressMaybe, no: crossDressNo },
    intimate: { yes: intimateYes, maybe: intimateMaybe, no: intimateNo },
    avoidKiller,
    preferHighlight,
    totalFilled: total,
  };
};

export const checkRoleConflict = (
  game: Game
): { hasConflict: boolean; conflictingRoles: string[] } => {
  const { roles, players, allowCrossDress } = game;
  const conflictingRoles: string[] = [];

  roles.forEach((role) => {
    if (role.gender === 'neutral') return;
    
    const willingPlayers = players.filter((p) => {
      if (!p.comfortZone) return false;
      if (p.gender === role.gender) return true;
      if (!allowCrossDress) return false;
      
      const crossDressKey = p.gender === 'male' ? 'crossDressMaleToFemale' : 'crossDressFemaleToMale';
      return p.comfortZone[crossDressKey] !== 'no';
    });

    if (willingPlayers.length === 0) {
      conflictingRoles.push(role.id);
    }
  });

  return {
    hasConflict: conflictingRoles.length > 0,
    conflictingRoles,
  };
};
