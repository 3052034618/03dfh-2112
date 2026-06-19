import { create } from 'zustand';
import { Game, ComfortZone, Player, RoleInfo, GameStatus, VoteData, VoteOption } from '@/types/game';
import { mockGames } from '@/data/mockGames';
import { calculateRoleMatch } from '@/utils/gameUtils';

interface GameState {
  games: Game[];
  currentGame: Game | null;
  currentUserId: string;
  setCurrentGame: (game: Game | null) => void;
  getGameById: (id: string) => Game | undefined;
  joinGame: (gameId: string, player: Omit<Player, 'id'>) => string;
  updateComfortZone: (gameId: string, playerId: string, comfortZone: ComfortZone) => void;
  submitVote: (gameId: string, playerId: string, optionId: string) => void;
  createGame: (game: Omit<Game, 'id' | 'players' | 'status' | 'hostId'> & { host: Omit<Player, 'id' | 'isHost'> }) => string;
  getRoleById: (gameId: string, roleId: string) => RoleInfo | undefined;
  getPlayerById: (gameId: string, playerId: string) => Player | undefined;
  generateVoteData: (gameId: string) => void;
  confirmRolesByMatch: (gameId: string) => void;
}

const generateRoleAssignments = (
  players: Player[],
  roles: RoleInfo[],
  allowCrossDress: boolean,
  strategy: 'match' | 'order'
): Record<string, string> => {
  const assignments: Record<string, string> = {};
  const assignedRoles = new Set<string>();
  const orderedPlayers = strategy === 'order'
    ? [...players]
    : [...players].sort((a, b) => {
        if (!a.comfortZone && !b.comfortZone) return 0;
        if (!a.comfortZone) return 1;
        if (!b.comfortZone) return -1;
        return 0;
      });

  orderedPlayers.forEach((player) => {
    const scoredRoles = roles
      .filter((r) => !assignedRoles.has(r.id))
      .map((role) => ({
        role,
        score: calculateRoleMatch(player, role, allowCrossDress),
      }))
      .sort((a, b) => b.score - a.score);

    if (scoredRoles.length > 0) {
      const selectedRole = strategy === 'order' && scoredRoles[0].score < 0 && scoredRoles.length > 1
        ? (scoredRoles.find(s => s.score >= 0)?.role || scoredRoles[0].role)
        : scoredRoles[0].role;
      assignments[player.id] = selectedRole.id;
      assignedRoles.add(selectedRole.id);
    }
  });

  const unassignedRoles = roles.filter((r) => !assignedRoles.has(r.id));
  const unassignedPlayers = players.filter((p) => !assignments[p.id]);
  unassignedPlayers.forEach((player, index) => {
    if (unassignedRoles[index]) {
      assignments[player.id] = unassignedRoles[index].id;
    }
  });

  return assignments;
};

export const useGameStore = create<GameState>((set, get) => ({
  games: mockGames,
  currentGame: null,
  currentUserId: 'p1',

  setCurrentGame: (game) => set({ currentGame: game }),

  getGameById: (id) => get().games.find((g) => g.id === id),

  getRoleById: (gameId, roleId) => {
    const game = get().getGameById(gameId);
    return game?.roles.find((r) => r.id === roleId);
  },

  getPlayerById: (gameId, playerId) => {
    const game = get().getGameById(gameId);
    return game?.players.find((p) => p.id === playerId);
  },

  joinGame: (gameId, player) => {
    const game = get().getGameById(gameId);
    if (!game || game.status !== 'recruiting') return '';
    if (game.players.length >= game.totalPlayers) return '';

    const newPlayerId = `p${Date.now()}`;
    set((state) => {
      const games = state.games.map((g) => {
        if (g.id !== gameId) return g;
        const newPlayer: Player = {
          ...player,
          id: newPlayerId,
        };
        const newPlayers = [...g.players, newPlayer];
        const isFull = newPlayers.length >= g.totalPlayers;
        const newStatus: GameStatus = isFull ? 'full' : g.status;
        return {
          ...g,
          players: newPlayers,
          status: newStatus,
        };
      });
      return {
        games,
        currentUserId: newPlayerId,
      };
    });
    return newPlayerId;
  },

  updateComfortZone: (gameId, playerId, comfortZone) => {
    set((state) => ({
      games: state.games.map((game) => {
        if (game.id !== gameId) return game;
        return {
          ...game,
          players: game.players.map((p) =>
            p.id === playerId ? { ...p, comfortZone } : p
          ),
        };
      }),
    }));
  },

  generateVoteData: (gameId) => {
    set((state) => ({
      games: state.games.map((game) => {
        if (game.id !== gameId) return game;

        const optionAAssignments = generateRoleAssignments(
          game.players,
          game.roles,
          game.allowCrossDress,
          'order'
        );
        const optionBAssignments = generateRoleAssignments(
          game.players,
          game.roles,
          game.allowCrossDress,
          'match'
        );

        const options: VoteOption[] = [
          {
            id: 'opt1',
            title: '方案A：按报名顺序优先',
            description: '先报名的玩家优先获得匹配度更高的角色',
            roleAssignments: optionAAssignments,
          },
          {
            id: 'opt2',
            title: '方案B：整体匹配最优',
            description: '全局算法匹配，最大化所有人的舒适区满意度',
            roleAssignments: optionBAssignments,
          },
        ];

        const voteData: VoteData = {
          id: `v${Date.now()}`,
          gameId,
          options,
          votes: {},
          deadline: Date.now() + 86400000,
          status: 'active',
        };

        return {
          ...game,
          status: 'voting' as GameStatus,
          voteData,
        };
      }),
    }));
  },

  confirmRolesByMatch: (gameId) => {
    set((state) => ({
      games: state.games.map((game) => {
        if (game.id !== gameId) return game;

        const finalAssignments = generateRoleAssignments(
          game.players,
          game.roles,
          game.allowCrossDress,
          'match'
        );

        return {
          ...game,
          status: 'confirmed' as GameStatus,
          finalAssignments,
        };
      }),
    }));
  },

  submitVote: (gameId, playerId, optionId) => {
    const game = get().getGameById(gameId);
    if (!game || !game.voteData) return;
    const isPlayer = game.players.some((p) => p.id === playerId);
    if (!isPlayer) return;
    if (game.voteData.votes[playerId]) return;

    set((state) => ({
      games: state.games.map((g) => {
        if (g.id !== gameId || !g.voteData) return g;
        const newVotes = { ...g.voteData.votes, [playerId]: optionId };
        const allVoted = g.players.every((p) => newVotes[p.id]);

        let finalAssignments: Record<string, string> | undefined;
        let newStatus: GameStatus = g.status;

        if (allVoted) {
          const voteCounts: Record<string, number> = {};
          Object.values(newVotes).forEach((optId) => {
            voteCounts[optId] = (voteCounts[optId] || 0) + 1;
          });
          const sorted = Object.entries(voteCounts).sort((a, b) => b[1] - a[1]);
          const winningOptionId = sorted[0][0];
          const winningOption = g.voteData.options.find(
            (o) => o.id === winningOptionId
          );
          if (winningOption) {
            finalAssignments = { ...winningOption.roleAssignments };
            newStatus = 'confirmed';
          }
        }

        return {
          ...g,
          status: newStatus,
          finalAssignments,
          voteData: {
            ...g.voteData,
            votes: newVotes,
            status: allVoted ? 'ended' : 'active',
          },
        };
      }),
    }));
  },

  createGame: (gameData) => {
    const newGameId = `g${Date.now()}`;
    const newGame: Game = {
      id: newGameId,
      title: gameData.title,
      scriptName: gameData.scriptName,
      scriptType: gameData.scriptType,
      totalPlayers: gameData.totalPlayers,
      maleRoles: gameData.maleRoles,
      femaleRoles: gameData.femaleRoles,
      allowCrossDress: gameData.allowCrossDress,
      status: 'recruiting',
      hostId: 'host',
      players: [
        {
          id: 'host',
          nickname: gameData.host.nickname,
          gender: gameData.host.gender,
          isHost: true,
        },
      ],
      roles: gameData.roles,
      startTime: gameData.startTime,
      location: gameData.location,
      description: gameData.description,
    };
    set((state) => ({
      games: [newGame, ...state.games],
      currentUserId: 'host',
    }));
    return newGameId;
  },
}));
