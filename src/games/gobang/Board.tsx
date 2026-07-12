import { type CSSProperties, useEffect } from 'react';
import bg from './assets/bg.jpg';
import { BOARD_SIZE } from './constants';
import { getLastMove } from './engine';
import { useGobang } from './store';
import { useLanguage } from '../../i18n';
import './board.css';

interface BoardProps {
  boardSize: number;
}

export default function Board({ boardSize }: BoardProps) {
  const { state, placePiece } = useGobang();
  const { t } = useLanguage();
  const { board, history, status, winner, index } = state;

  useEffect(() => {
    if (winner === 1 || winner === -1) {
      window.alert(winner === 1 ? t('gomoku.blackWin') : t('gomoku.whiteWin'));
    }
  }, [t, winner]);

  const handleClick = (i: number, j: number) => {
    if (status !== 'gaming') return;
    placePiece(i, j);
  };

  const lastMove = getLastMove(history);
  const boardStyle: CSSProperties & { '--gomoku-board-size': string } = {
    backgroundImage: `url(${bg})`,
    '--gomoku-board-size': `${boardSize}px`,
  };

  return (
    <div className="board" style={boardStyle}>
      {board.map((row, i) => (
        <div key={i} className="board-row">
          {row.map((cell, j) => {
            let cellClassName = 'cell';
            if (i === 0) cellClassName += ' top';
            if (i === BOARD_SIZE - 1) cellClassName += ' bottom';
            if (j === 0) cellClassName += ' left';
            if (j === BOARD_SIZE - 1) cellClassName += ' right';

            let pieceClassName = 'piece';
            if (cell === 1) {
              pieceClassName += ' black';
            } else if (cell === -1) {
              pieceClassName += ' white';
            }

            let number = 0;
            if (index) {
              for (let x = 0; x < history.length; x += 1) {
                if (history[x].i === i && history[x].j === j) {
                  number = x + 1;
                  break;
                }
              }
            }

            const isLastCell = lastMove?.i === i && lastMove?.j === j;

            return (
              <div
                key={j}
                className={cellClassName}
                onClick={() => handleClick(i, j)}
              >
                {cell === 0 ? '' : <div className={pieceClassName}>{number === 0 ? '' : number}</div>}
                {isLastCell ? <div className="last" /> : null}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
