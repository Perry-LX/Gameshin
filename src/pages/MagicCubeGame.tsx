import { useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../i18n';
import { ThreeRubiksCube } from '../games/magic-cube/cube';
import './MagicCubeGame.css';

export function MagicCubeGame() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const wrapRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<HTMLDivElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<ThreeRubiksCube | null>(null);

  const updatePos = useCallback(() => {
    const el = controlsRef.current;
    if (!el) return;
    const wrap = wrapRef.current;
    if (wrap) {
      wrap.style.bottom = (el.offsetHeight + 20) + 'px';
      // Force renderer to match new wrapper size
      setTimeout(() => engineRef.current?.resize(), 0);
    }
  }, []);

  useEffect(() => {
    updatePos();
    window.addEventListener('resize', updatePos);
    const ro = new ResizeObserver(updatePos);
    if (controlsRef.current) ro.observe(controlsRef.current);
    return () => { window.removeEventListener('resize', updatePos); ro.disconnect(); };
  }, [updatePos]);

  useEffect(() => {
    if (!wrapRef.current) return;

    const engine = new ThreeRubiksCube(wrapRef.current);
    engineRef.current = engine;

    engine.onUpdate(({ moveCount, isSolved }: { moveCount: number; isSolved: boolean }) => {
      if (statusRef.current) {
        statusRef.current.innerHTML =
          `${t('magicCube.status')}: ${isSolved ? t('magicCube.solved') : t('magicCube.scrambled')} <span class="count">| ${t('magicCube.moves')}: ${moveCount}</span>`;
      }
    });

    if (statusRef.current)
      statusRef.current.innerHTML = `${t('magicCube.status')}: ${t('magicCube.solved')} <span class="count">| ${t('magicCube.moves')}: 0</span>`;
    if (hintRef.current) hintRef.current.textContent = t('magicCube.hint');

    return () => { engine.destroy(); };
  }, [t]);

  useEffect(() => { if (hintRef.current) hintRef.current.textContent = t('magicCube.hint'); }, [t]);

  const doMove = (m: string) => engineRef.current?.do(m);
  const scramble = () => engineRef.current?.scramble(22);
  const solve = () => engineRef.current?.solve();
  const reset = () => engineRef.current?.reset();

  const faces = ['U', "U'", 'D', "D'", 'R', "R'", 'L', "L'", 'F', "F'", 'B', "B'"];

  return (
    <div className="magic-cube-page">
      <button type="button" className="magic-cube-back-btn" onClick={() => navigate('/')}>
        ◂ {t('magicCube.back')}
      </button>

      <div ref={wrapRef} className="mc-three-wrap" />

      <div id="mc-status" ref={statusRef} />

      <div id="mc-controls" ref={controlsRef}>
        <div id="mc-hint" ref={hintRef}>{t('magicCube.hint')}</div>
        <div className="mc-control-row">
          <span className="mc-control-label">{t('magicCube.faces')}</span>
          {faces.map((move, i) => (
            <span key={move}>
              <button className={`mc-btn mc-btn-face ${move.includes("'") ? 'prime' : ''}`} onClick={() => doMove(move)}>
                {move.replace("'", '')}
              </button>
              {(i + 1) % 2 === 0 && i < faces.length - 1 && <span className="mc-divider">|</span>}
            </span>
          ))}
        </div>
        <div className="mc-control-row">
          <span className="mc-control-label">{t('magicCube.actions')}</span>
          <button className="mc-btn mc-btn-action mc-btn-scramble" onClick={scramble}>{t('magicCube.scramble')}</button>
          <button className="mc-btn mc-btn-action mc-btn-solve" onClick={solve}>{t('magicCube.solve')}</button>
          <button className="mc-btn mc-btn-action mc-btn-reset" onClick={reset}>{t('magicCube.reset')}</button>
        </div>
      </div>
    </div>
  );
}
