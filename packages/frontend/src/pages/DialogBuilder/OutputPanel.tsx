import {
  Button,
  ButtonGroup,
  DsAlert,
  DsParagraph,
  Heading,
  SnackbarDuration,
  useSnackbar,
} from '@altinn/altinn-components';
import { useNavigate } from 'react-router';
import styles from './dialogBuilder.module.css';
import type { CreateDialog, ValidationResult } from './dialogSchema.ts';
import { ValidationIssueList } from './ValidationIssueList.tsx';

const MAX_SHAREABLE_URL_LENGTH = 7 * 1024;

interface OutputPanelProps {
  json: Partial<CreateDialog>;
  validation: ValidationResult<CreateDialog>;
  previewUrl: string | undefined;
  onSelectIssue: (path: string) => void;
}

export const OutputPanel = ({ json, validation, previewUrl, onSelectIssue }: OutputPanelProps) => {
  const navigate = useNavigate();
  const { openSnackbar } = useSnackbar();
  const { errors, warnings } = validation;
  const formattedJson = JSON.stringify(json, null, 2);

  const copy = async (text: string, message: string) => {
    await navigator.clipboard.writeText(text);
    openSnackbar({ message, color: 'company', duration: SnackbarDuration.normal });
  };

  return (
    <section className={styles.output} aria-label="Resultat">
      <Heading as="h2" size="lg">
        Resultat
      </Heading>
      {errors.length > 0 ? (
        <DsAlert data-color="danger" data-size="sm">
          <Heading as="h3" size="xs">
            Dialogen er ikke gyldig
          </Heading>
          <ValidationIssueList issues={errors} onSelect={onSelectIssue} />
        </DsAlert>
      ) : (
        <DsAlert data-color="success" data-size="sm">
          <DsParagraph>Dialogen er gyldig</DsParagraph>
        </DsAlert>
      )}
      {warnings.length > 0 && (
        <DsAlert data-color="warning" data-size="sm">
          <Heading as="h3" size="xs">
            Ukjente felter
          </Heading>
          <ValidationIssueList issues={warnings} />
        </DsAlert>
      )}
      <ButtonGroup wrap>
        <Button disabled={!previewUrl} onClick={() => previewUrl && navigate(previewUrl)}>
          Forhåndsvis
        </Button>
        <Button variant="outline" onClick={() => copy(formattedJson, 'JSON er kopiert')}>
          Kopier JSON
        </Button>
        <Button
          variant="outline"
          disabled={!previewUrl}
          onClick={() => previewUrl && copy(new URL(previewUrl, window.location.origin).href, 'Lenken er kopiert')}
        >
          Kopier lenke
        </Button>
      </ButtonGroup>
      {previewUrl && previewUrl.length > MAX_SHAREABLE_URL_LENGTH && (
        <DsAlert data-color="warning" data-size="sm">
          <Heading as="h3" size="xs">
            Lenken er lang
          </Heading>
          <DsParagraph>
            Forhåndsvis-knappen virker, men lenker over omtrent 8 KB kan feile ved deling, oppdatering av siden og
            innlogging.
          </DsParagraph>
        </DsAlert>
      )}
      <pre className={styles.json}>{formattedJson}</pre>
    </section>
  );
};
