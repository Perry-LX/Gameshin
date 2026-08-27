import { useLanguage } from '../i18n';

export function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="pixel-footer">
      <div className="footer-ornament" aria-hidden="true"><span /></div>
      <div className="footer-content">
        <div className="footer-brand-lockup">
          <p className="footer-brand">GAMESHIN</p>
          <span>VIBE CODING GAME MIX</span>
        </div>
        <p className="footer-text">{t('footer.text')}</p>
        <p className="footer-copy">{t('footer.copyright')}</p>
      </div>
    </footer>
  );
}
