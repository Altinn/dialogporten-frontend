import styles from './dialogBuilder.module.css';
import type { ValidationIssue } from './dialogSchema.ts';

interface ValidationIssueListProps {
  issues: ValidationIssue[];
  onSelect?: (path: string) => void;
}

export const ValidationIssueList = ({ issues, onSelect }: ValidationIssueListProps) => (
  <ul className={styles.issues}>
    {issues.map(({ path, message }) => (
      <li key={`${path}-${message}`}>
        {onSelect && path ? (
          <button type="button" className={styles.issueLink} onClick={() => onSelect(path)}>
            <code>{path}</code> {message}
          </button>
        ) : (
          <>
            {path && <code>{path}</code>} {message}
          </>
        )}
      </li>
    ))}
  </ul>
);
