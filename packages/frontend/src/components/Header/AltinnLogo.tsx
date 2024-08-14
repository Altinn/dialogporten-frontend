import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import styles from './altinnLogo.module.css';

export function AltinnLogoSvg({ small }: { small?: boolean }) {
  return (
    <svg
      width="1em"
      height="1em"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={small ? styles.altinnLogoSmall : styles.altinnLogo}
    >
      <title>Altinnsymbol i logo</title>
      <path
        d="M12.3167 0H0.486059C0.357148 0 0.233518 0.0511029 0.142363 0.142066C0.0512097 0.23303 0 0.356402 0 0.485044V23.515C0 23.6436 0.0512097 23.767 0.142363 23.8579C0.233518 23.9489 0.357148 24 0.486059 24H12.3167C15.4455 23.9112 18.4163 22.6085 20.5979 20.3686C22.7795 18.1288 24 15.1284 24 12.0049C24 8.88133 22.7795 5.88089 20.5979 3.64106C18.4163 1.40122 15.4455 0.0985018 12.3167 0.00970113V0ZM13.4735 20.3815C11.6835 20.689 9.84199 20.4199 8.21543 19.6132C6.58891 18.8066 5.26188 17.5042 4.42651 15.8948C3.59114 14.2853 3.29078 12.4523 3.56892 10.6611C3.84707 8.86999 4.68929 7.2137 5.97362 5.93205C7.25795 4.6504 8.91774 3.80994 10.7126 3.53237C12.5075 3.25481 14.3444 3.55454 15.9572 4.38817C17.57 5.2218 18.875 6.54605 19.6834 8.16918C20.4918 9.79233 20.7614 11.6301 20.4534 13.4163C20.1535 15.1547 19.3216 16.7576 18.0717 18.0049C16.8218 19.2521 15.2155 20.0824 13.4735 20.3815Z"
        fill="black"
      />
    </svg>
  );
}

interface AltinnLogoProps {
  className?: string;
}

export const AltinnLogo = ({ className }: AltinnLogoProps) => {
  const { t } = useTranslation();
  return (
    <div className={className}>
      <Link to="/" aria-label={t('link.goToMain')}>
        <div className={styles.logoWrapper}>
          <AltinnLogoSvg aria-label="Altinn logo" />
        </div>
        <span>Altinn</span>
      </Link>
    </div>
  );
};
