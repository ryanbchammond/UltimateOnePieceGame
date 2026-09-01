import { create } from 'zustand';

export type GamePhase = 'booting' | 'ready';

interface GameSessionState {
  phase: GamePhase;
  setPhase: (phase: GamePhase) => void;
}

export const useGameSession = create<GameSessionState>((set) => ({
  phase: 'booting',
  setPhase: (phase) => set({ phase }),
}));
