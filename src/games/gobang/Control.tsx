import { getStatusText, getWinnerLabel } from './engine';
import { useGobang } from './store';
import './control.css';

export default function Control() {
  const { state, endGame, setIndex, setWhiteFirst, startGame, undoMove } = useGobang();
  const { history, index, status, whiteFirst, winner } = state;

  return (
    <div className="control">
      <div className="buttons">
        <button type="button" className="button gomoku-action-btn" onClick={startGame}>
          {history.length === 0 ? '开始' : '重开'}
        </button>
        <button
          type="button"
          className="button gomoku-action-btn"
          onClick={undoMove}
          disabled={status !== 'gaming' || history.length === 0}
        >
          悔棋
        </button>
        <button
          type="button"
          className="button gomoku-action-btn"
          onClick={endGame}
          disabled={status !== 'gaming'}
        >
          认输
        </button>
      </div>

      <div className="setting">
        <div className="setting-row">
          <label className="setting-item setting-checkbox">
            <input
              type="checkbox"
              checked={whiteFirst}
              onChange={(event) => setWhiteFirst(event.target.checked)}
              disabled={status === 'gaming'}
            />
            白棋先手
          </label>
          <label className="setting-item setting-checkbox">
            <input
              type="checkbox"
              checked={index}
              onChange={(event) => setIndex(event.target.checked)}
            />
            序号
          </label>
        </div>
      </div>

      <div className="status">
        <div className="status-item">状态：{getStatusText(state)}</div>
        <div className="status-item">手数：{history.length}</div>
        <div className="status-item">胜负：{getWinnerLabel(winner)}</div>
      </div>
    </div>
  );
}
