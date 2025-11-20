import { Heading, Section, Typography } from '@altinn/altinn-components';
import styles from './notice.module.css';

interface NoticeProps {
  title: string;
  description?: string;
  link?: {
    href: string;
    label: string;
  };
}

export const Notice = ({ title, description, link }: NoticeProps) => {
  return (
    <Section spacing={3} margin="section">
      <Heading size="lg">{title}</Heading>
      <Typography size="sm">
        {description && <p>{description}</p>}
        {link && (
          <a className={styles.link} href={link.href}>
            {link.label}
          </a>
        )}
      </Typography>
    </Section>
  );
};
