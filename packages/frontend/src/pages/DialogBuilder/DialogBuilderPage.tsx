import {
  Alert,
  Button,
  ButtonGroup,
  Checkbox,
  DsTabs,
  Fieldset,
  Heading,
  Legend,
  Typography,
} from '@altinn/altinn-components';
import { type ChangeEvent, useMemo, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router';
import { useParties } from '../../api/hooks/useParties.ts';
import { usePageTitle } from '../../hooks/usePageTitle.ts';
import { DIALOG_PREVIEW_QUERY_PARAM, DIALOG_PREVIEW_ROUTE } from './availability.ts';
import {
  ActivitiesSection,
  AttachmentsSection,
  ContentSection,
  GuiActionsSection,
  ServiceSection,
  TransmissionsSection,
} from './BuilderSections.tsx';
import {
  type BuilderState,
  createInitialState,
  createSampleDialog,
  type DialogDraft,
  findLanguages,
  toDialogJson,
} from './builderDraft.ts';
import { DialogBuilderLayout } from './DialogBuilderLayout.tsx';
import styles from './dialogBuilder.module.css';
import { LANGUAGES, type Language, validateCreateDialog } from './dialogSchema.ts';
import { focusField } from './focusField.ts';
import type { DialogOrigin } from './normalizePastedDialog.ts';
import { OutputPanel } from './OutputPanel.tsx';
import { PasteJsonPanel } from './PasteJsonPanel.tsx';
import { decodePreview, encodePreview } from './previewEnvelope.ts';
import { ValidationIssueList } from './ValidationIssueList.tsx';

const BUILD_TAB = 'build';
const PASTE_TAB = 'paste';

const LANGUAGE_LABELS: Record<Language, string> = { nb: 'Bokmål', nn: 'Nynorsk', en: 'Engelsk' };

const DialogBuilder = () => {
  const [searchParams] = useSearchParams();
  const { search } = useLocation();
  const { selectedParties, selectedGroup } = useParties();
  const [initialPreview] = useState(() => decodePreview(searchParams.get(DIALOG_PREVIEW_QUERY_PARAM)));
  const [state, setState] = useState<BuilderState>(() => createInitialState(initialPreview));
  const [tab, setTab] = useState(BUILD_TAB);
  const { org, serviceResourceType, languages, dialog } = state;
  const party = selectedParties.length === 1 && !selectedGroup ? selectedParties[0] : undefined;

  usePageTitle({ baseTitle: 'Dialogbygger' });

  const json = useMemo(() => toDialogJson(dialog, party?.party), [dialog, party?.party]);
  const validation = useMemo(() => validateCreateDialog(json), [json]);

  const previewUrl = useMemo(() => {
    if (!validation.dialog) {
      return undefined;
    }
    const params = new URLSearchParams(search);
    params.set(DIALOG_PREVIEW_QUERY_PARAM, encodePreview(org, serviceResourceType, validation.dialog));
    return `${DIALOG_PREVIEW_ROUTE}?${params.toString()}`;
  }, [validation.dialog, search, org, serviceResourceType]);

  const setDialog = (next: DialogDraft) => setState({ ...state, dialog: next });

  const loadDialog = (next: DialogDraft, origin: DialogOrigin = {}) => {
    setState({
      org: origin.org ?? org,
      serviceResourceType: origin.serviceResourceType ?? serviceResourceType,
      languages: findLanguages(next),
      dialog: next,
    });
    setTab(BUILD_TAB);
  };

  const toggleLanguage = (language: Language, isChecked: boolean) => {
    const next = LANGUAGES.filter((item) => (item === language ? isChecked : languages.includes(item)));
    setState({ ...state, languages: next });
  };

  const selectIssue = (path: string) => {
    setTab(BUILD_TAB);
    requestAnimationFrame(() => focusField(path));
  };

  const sectionProps = { dialog, languages, errors: validation.errors, onChange: setDialog };

  return (
    <div className={styles.page}>
      <Heading as="h1" size="xl">
        Dialogbygger
      </Heading>
      <Typography size="sm">
        <p>
          Lag en dialog og se hvordan den ser ut i Arbeidsflate. Dialogen lagres ikke og sendes ikke til Dialogporten.
        </p>
      </Typography>
      {initialPreview.status === 'invalid' && (
        <Alert variant="danger" heading="Lenken inneholdt en ugyldig dialog">
          <ValidationIssueList issues={initialPreview.errors} />
        </Alert>
      )}
      <div className={styles.columns}>
        <div>
          <DsTabs value={tab} onChange={setTab}>
            <DsTabs.List>
              <DsTabs.Tab value={BUILD_TAB}>Bygg dialog</DsTabs.Tab>
              <DsTabs.Tab value={PASTE_TAB}>Lim inn JSON</DsTabs.Tab>
            </DsTabs.List>
            <DsTabs.Panel value={BUILD_TAB}>
              <div className={styles.tabPanel}>
                <ButtonGroup wrap>
                  <Button variant="outline" size="sm" onClick={() => loadDialog(createSampleDialog())}>
                    Fyll med eksempeldata
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setState(createInitialState({ status: 'missing' }))}>
                    Tøm skjema
                  </Button>
                </ButtonGroup>
                <Fieldset size="sm">
                  <Legend>Språk i skjemaet</Legend>
                  {LANGUAGES.map((language) => (
                    <Checkbox
                      key={language}
                      size="sm"
                      label={LANGUAGE_LABELS[language]}
                      value={language}
                      checked={languages.includes(language)}
                      disabled={languages.length === 1 && languages.includes(language)}
                      onChange={(event: ChangeEvent<HTMLInputElement>) =>
                        toggleLanguage(language, event.target.checked)
                      }
                    />
                  ))}
                </Fieldset>
                <div>
                  <ServiceSection state={state} party={party} errors={validation.errors} onChange={setState} />
                  <ContentSection {...sectionProps} />
                  <AttachmentsSection {...sectionProps} />
                  <GuiActionsSection {...sectionProps} />
                  <ActivitiesSection {...sectionProps} />
                  <TransmissionsSection {...sectionProps} />
                </div>
              </div>
            </DsTabs.Panel>
            <DsTabs.Panel value={PASTE_TAB}>
              <div className={styles.tabPanel}>
                <PasteJsonPanel onLoad={loadDialog} />
              </div>
            </DsTabs.Panel>
          </DsTabs>
        </div>
        <OutputPanel json={json} validation={validation} previewUrl={previewUrl} onSelectIssue={selectIssue} />
      </div>
    </div>
  );
};

export const DialogBuilderPage = () => (
  <DialogBuilderLayout>
    <DialogBuilder />
  </DialogBuilderLayout>
);
