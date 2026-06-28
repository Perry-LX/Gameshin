import { useLanguage } from '../i18n';

export function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="pixel-footer">
      <div className="footer-divider">
        <span className="divider-pixel">◆</span>
        <span className="divider-pixel">◆</span>
        <span className="divider-pixel">◆</span>
        <span className="divider-pixel">◆</span>
        <span className="divider-pixel">◆</span>
      </div>
      <div className="footer-content">
        <p className="footer-text">
          ♥ {t('footer.text')}
        </p>
        <p className="footer-copy">{t('footer.copyright')}</p>
      </div>
    </footer>
  );
}
