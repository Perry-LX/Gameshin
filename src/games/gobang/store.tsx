import { createContext, type ReactNode, useContext, useMemo, useState } from 'react';
import { BLACK, WHITE } from './constants';
import {
  createInitialState,
  placePiece as applyPiece,
  resign as applyResign,
  resetState,
  undoMove as applyUndo,
} from './engine';
import type { GobangState } from './types';

interface GobangContextValue {
  state: GobangState;
  startGame: () => void;
  placePiece: (i: number, j: number) => void;
  undoMove: () => void;
  endGame: () => void;
  setWhiteFirst: (whiteFirst: boolean) => void;
  setIndex: (index: boolean) => void;
}

const GobangContext = createContext<GobangContextValue | null>(null);

export function GobangProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GobangState>(createInitialState);

  const value = useMemo<GobangContextValue>(
    () => ({
      state,
      startGame: () => {
        setState((current) => resetState(current));
      },
      placePiece: (i: number, j: number) => {
        setState((current) => applyPiece(current, i, j));
      },
      undoMove: () => {
        setState((current) => applyUndo(current));
      },
      endGame: () => {
        setState((current) => applyResign(current));
      },
      setWhiteFirst: (whiteFirst: boolean) => {
        setState((current) => ({
          ...current,
          whiteFirst,
          currentPlayer:
            current.history.length === 0 && current.status === 'idle'
              ? whiteFirst
                ? WHITE
                : BLACK
              : current.currentPlayer,
        }));
      },
      setIndex: (index: boolean) => {
        setState((current) => ({ ...current, index }));
      },
    }),
    [state],
  );

  return <GobangContext.Provider value={value}>{children}</GobangContext.Provider>;
}

export function useGobang() {
  const context = useContext(GobangContext);
  if (!context) {
    throw new Error('useGobang must be used inside GobangProvider.');
  }
  return context;
}
