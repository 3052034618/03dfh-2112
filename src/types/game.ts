export type Gender = 'male' | 'female' | 'neutral';

export type GameStatus = 'recruiting' | 'full' | 'voting' | 'confirmed';

export type ComfortLevel = 'yes' | 'maybe' | 'no';

export interface RoleInfo {
  id: string;
  name: string;
  gender: Gender;
  description?: string;
  isHighlight?: boolean;
  isKiller?: boolean;
  hasIntimateScene?: boolean;
}

export interface ComfortZone {
  crossDressMaleToFemale: ComfortLevel;
  crossDressFemaleToMale: ComfortLevel;
  intimateScene: ComfortLevel;
  avoidKiller: boolean;
  preferHighlight: boolean;
}

export interface Player {
  id: string;
  nickname: string;
  avatar?: string;
  gender: Gender;
  isHost: boolean;
  comfortZone?: ComfortZone;
  assignedRole?: string;
  candidateRoles?: string[];
}

export interface VoteOption {
  id: string;
  title: string;
  description: string;
  roleAssignments: Record<string, string>;
}

export interface VoteData {
  id: string;
  gameId: string;
  options: VoteOption[];
  votes: Record<string, string>;
  deadline: number;
  status: 'active' | 'ended' | 'tie';
}

export interface Game {
  id: string;
  title: string;
  scriptName: string;
  scriptType: string;
  totalPlayers: number;
  maleRoles: number;
  femaleRoles: number;
  allowCrossDress: boolean;
  status: GameStatus;
  hostId: string;
  players: Player[];
  roles: RoleInfo[];
  startTime: number;
  location: string;
  description?: string;
  voteData?: VoteData;
  finalAssignments?: Record<string, string>;
}

export interface Script {
  id: string;
  name: string;
  type: string;
  difficulty: number;
  duration: string;
  playerCount: string;
  maleRoles: number;
  femaleRoles: number;
  description: string;
  roles: RoleInfo[];
}
