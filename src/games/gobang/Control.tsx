import { useLanguage } from '../../i18n';
import { getStatusText, getWinnerLabel } from './engine';
import { useGobang } from './store';
import './control.css';

export default function Control() {
  const { t } = useLanguage();
  const { state, endGame, setIndex, setWhiteFirst, startGame, undoMove } = useGobang();
  const { history, index, status, whiteFirst, winner } = state;

  return (
    <div className="control">
      <div className="buttons">
        <button type="button" className="button gomoku-action-btn" onClick={startGame}>
          {history.length === 0 ? t('gomoku.start') : t('gomoku.restart')}
        </button>
        <button
          type="button"
          className="button gomoku-action-btn"
          onClick={undoMove}
          disabled={status !== 'gaming' || history.length === 0}
        >
          {t('gomoku.undo')}
        </button>
        <button
          type="button"
          className="button gomoku-action-btn"
          onClick={endGame}
          disabled={status !== 'gaming'}
        >
          {t('gomoku.resign')}
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
            {t('gomoku.whiteFirst')}
          </label>
          <label className="setting-item setting-checkbox">
            <input
              type="checkbox"
              checked={index}
              onChange={(event) => setIndex(event.target.checked)}
            />
            {t('gomoku.index')}
          </label>
        </div>
      </div>

      <div className="status">
        <div className="status-item">{t('gomoku.status')}：{getStatusText(state, t)}</div>
        <div className="status-item">{t('gomoku.moves')}：{history.length}</div>
        <div className="status-item">{t('gomoku.result')}：{getWinnerLabel(winner, t)}</div>
      </div>
    </div>
  );
}
