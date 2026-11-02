import { Alert, Button, TextareaField, Typography } from '@altinn/altinn-components';
import { type ChangeEvent, useState } from 'react';
import type { DialogDraft } from './builderDraft.ts';
import styles from './dialogBuilder.module.css';
import { parseDialogJson, type ValidationIssue, validateCreateDialog } from './dialogSchema.ts';
import { type DialogOrigin, normalizePastedDialog } from './normalizePastedDialog.ts';
import { ValidationIssueList } from './ValidationIssueList.tsx';

interface PasteJsonPanelProps {
  onLoad: (dialog: DialogDraft, origin: DialogOrigin) => void;
}

export const PasteJsonPanel = ({ onLoad }: PasteJsonPanelProps) => {
  const [text, setText] = useState('');
  const [errors, setErrors] = useState<ValidationIssue[]>([]);

  const handleLoad = () => {
    const { json, error } = parseDialogJson(text);
    if (error) {
      setErrors([{ path: '', message: `Ugyldig JSON: ${error}` }]);
      return;
    }

    const { dialog, ...origin } = normalizePastedDialog(json);
    const validation = validateCreateDialog(dialog);
    setErrors(validation.errors);
    if (validation.dialog) {
      onLoad(validation.dialog, origin);
    }
  };

  return (
    <div className={styles.section}>
      <Typography size="sm">
        <p>
          Lim inn en dialog du har hentet fra Dialogporten, eller JSON-en du ville sendt inn. Felter som bare finnes i
          responsen fjernes, og en gyldig dialog lastes inn i skjemaet.
        </p>
      </Typography>
      <TextareaField
        label="Dialog som JSON"
        size="sm"
        rows={16}
        value={text}
        onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setText(event.target.value)}
      />
      <div>
        <Button onClick={handleLoad}>Valider og last inn</Button>
      </div>
      {errors.length > 0 && (
        <Alert variant="danger" heading="Dialogen er ikke gyldig">
          <ValidationIssueList issues={errors} />
        </Alert>
      )}
    </div>
  );
};
