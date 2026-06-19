import { create } from 'zustand';
import { Game, ComfortZone, Player, RoleInfo } from '@/types/game';
import { mockGames } from '@/data/mockGames';

interface GameState {
  games: Game[];
  currentGame: Game | null;
  currentUserId: string;
  setCurrentGame: (game: Game | null) => void;
  getGameById: (id: string) => Game | undefined;
  joinGame: (gameId: string, player: Omit<Player, 'id'>) => void;
  updateComfortZone: (gameId: string, playerId: string, comfortZone: ComfortZone) => void;
  submitVote: (gameId: string, playerId: string, optionId: string) => void;
  createGame: (game: Omit<Game, 'id' | 'players' | 'status' | 'hostId'> & { host: Omit<Player, 'id' | 'isHost'> }) => string;
  getRoleById: (gameId: string, roleId: string) => RoleInfo | undefined;
  getPlayerById: (gameId: string, playerId: string) => Player | undefined;
}

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
    set((state) => ({
      games: state.games.map((game) => {
        if (game.id !== gameId) return game;
        const newPlayer: Player = {
          ...player,
          id: `p${Date.now()}`,
        };
        const newPlayers = [...game.players, newPlayer];
        const isFull = newPlayers.length >= game.totalPlayers;
        return {
          ...game,
          players: newPlayers,
          status: isFull ? 'full' : game.status,
        };
      }),
    }));
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

  submitVote: (gameId, playerId, optionId) => {
    set((state) => ({
      games: state.games.map((game) => {
        if (game.id !== gameId || !game.voteData) return game;
        const newVotes = { ...game.voteData.votes, [playerId]: optionId };
        const allVoted = game.players.every((p) => newVotes[p.id]);
        
        let finalAssignments: Record<string, string> | undefined;
        let newStatus: GameStatus = game.status;
        
        if (allVoted) {
          const voteCounts: Record<string, number> = {};
          Object.values(newVotes).forEach((optId) => {
            voteCounts[optId] = (voteCounts[optId] || 0) + 1;
          });
          const winningOptionId = Object.entries(voteCounts).sort(
            (a, b) => b[1] - a[1]
          )[0][0];
          const winningOption = game.voteData.options.find(
            (o) => o.id === winningOptionId
          );
          if (winningOption) {
            finalAssignments = winningOption.roleAssignments;
            newStatus = 'confirmed';
          }
        }

        return {
          ...game,
          status: newStatus,
          finalAssignments,
          voteData: {
            ...game.voteData,
            votes: newVotes,
            status: allVoted ? 'ended' : 'active',
          },
        };
      }),
    }));
  },

  createGame: (gameData) => {
    const newGame: Game = {
      id: `g${Date.now()}`,
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
    return newGame.id;
  },
}));
