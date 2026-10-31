import {
  Alert,
  Badge,
  DsDetails,
  Heading,
  SelectField,
  Switch,
  TextField,
  Typography,
} from '@altinn/altinn-components';
import type { PartyFieldsFragment } from 'bff-types-generated';
import type { ChangeEvent, ReactNode } from 'react';
import { getPreferredPropertyByLocale } from '../../i18n/property.ts';
import { useOrganizations } from '../Inbox/useOrganizations.ts';
import type { BuilderState, DialogDraft } from './builderDraft.ts';
import styles from './dialogBuilder.module.css';
import {
  ACTIVITY_TYPES,
  ACTOR_TYPES,
  type Activity,
  type Actor,
  ADDITIONAL_INFO_MEDIA_TYPES,
  type Attachment,
  DIALOG_STATUSES,
  EMBED_MEDIA_TYPES,
  GUI_ACTION_PRIORITIES,
  type GuiAction,
  HTTP_METHODS,
  type Language,
  type Localization,
  type NavigationalAction,
  SERVICE_RESOURCE_TYPES,
  type ServiceResourceType,
  SYSTEM_LABELS,
  TRANSMISSION_TYPES,
  type Transmission,
  type ValidationIssue,
} from './dialogSchema.ts';
import { LocalizedField } from './LocalizedField.tsx';
import { RepeatableItems } from './RepeatableItems.tsx';

const DEFAULT_ATTACHMENT_MEDIA_TYPE = 'application/pdf';
const LINK_MEDIA_TYPE = 'text/html';
const EMBED_HELPER_TEXT = 'Tas med i JSON-en, men hentes ikke i forhåndsvisningen.';

interface DialogSectionProps {
  dialog: DialogDraft;
  languages: Language[];
  errors: ValidationIssue[];
  onChange: (dialog: DialogDraft) => void;
}

const countErrors = (errors: ValidationIssue[], ...paths: string[]) =>
  errors.filter(({ path }) => paths.some((prefix) => path === prefix || path.startsWith(`${prefix}.`))).length;

const getNbValue = (values: Localization[] | null | undefined) => getPreferredPropertyByLocale(values, 'nb')?.value;

const withDetail = (title: string | undefined, detail: string) => (title ? `${title} (${detail})` : detail);

const formatCount = (count: number | null | undefined, singular: string, plural: string) =>
  count ? `${count} ${count === 1 ? singular : plural}` : undefined;

interface SectionProps {
  title: string;
  description?: string;
  count?: number;
  errorCount: number;
  defaultOpen?: boolean;
  children: ReactNode;
}

const Section = ({ title, description, count, errorCount, defaultOpen, children }: SectionProps) => (
  <DsDetails defaultOpen={defaultOpen}>
    <DsDetails.Summary>
      <span className={styles.sectionTitle}>
        {title} {count !== undefined && <Badge size="sm" color="neutral" label={String(count)} />}{' '}
        {errorCount > 0 && <Badge size="sm" color="danger" label={`${errorCount} feil`} />}
      </span>
    </DsDetails.Summary>
    <DsDetails.Content>
      <div className={styles.section}>
        {description && (
          <Typography size="sm">
            <p>{description}</p>
          </Typography>
        )}
        {children}
      </div>
    </DsDetails.Content>
  </DsDetails>
);

interface OptionsFieldProps<T extends string> {
  label: string;
  path: string;
  value: T | null | undefined;
  options: readonly T[];
  onChange: (value: T) => void;
}

const OptionsField = <T extends string>({ label, path, value, options, onChange }: OptionsFieldProps<T>) => (
  <SelectField
    label={label}
    data-path={path}
    size="sm"
    value={value ?? ''}
    onChange={(event: ChangeEvent<HTMLSelectElement>) => onChange(event.target.value as T)}
  >
    {options.map((option) => (
      <option key={option} value={option}>
        {option}
      </option>
    ))}
  </SelectField>
);

const toDateTimeInputValue = (value: string | null | undefined): string => {
  if (!value) {
    return '';
  }
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
};

interface DateTimeFieldProps {
  label: string;
  path: string;
  value: string | null | undefined;
  onChange: (value: string | undefined) => void;
}

const DateTimeField = ({ label, path, value, onChange }: DateTimeFieldProps) => (
  <TextField
    label={label}
    data-path={path}
    type="datetime-local"
    size="sm"
    value={toDateTimeInputValue(value)}
    onChange={(event: ChangeEvent<HTMLInputElement>) =>
      onChange(event.target.value ? new Date(event.target.value).toISOString() : undefined)
    }
  />
);

interface ServiceSectionProps {
  state: BuilderState;
  party: PartyFieldsFragment | undefined;
  errors: ValidationIssue[];
  onChange: (state: BuilderState) => void;
}

export const ServiceSection = ({ state, party, errors, onChange }: ServiceSectionProps) => {
  const { organizations } = useOrganizations();
  const { org, serviceResourceType, dialog } = state;
  const organizationOptions = (organizations ?? [])
    .flatMap(({ id, name }) => (id ? [{ id, name: name?.nb ?? id }] : []))
    .sort((a, b) => a.name.localeCompare(b.name));
  const hasSelectedOrg = organizationOptions.some(({ id }) => id === org);
  const setDialog = (patch: Partial<DialogDraft>) => onChange({ ...state, dialog: { ...dialog, ...patch } });

  return (
    <Section
      title="Tjeneste og mottaker"
      errorCount={countErrors(errors, 'party', 'serviceResource', 'status', 'systemLabel', 'dueAt')}
      defaultOpen
    >
      <div data-path="party" tabIndex={-1}>
        {party ? (
          <Typography size="sm">
            <p>
              Mottaker: <strong>{party.name}</strong>. Bytt mottaker i aktørvelgeren øverst på siden.
            </p>
          </Typography>
        ) : (
          <Alert
            variant="warning"
            heading="Velg én aktør"
            message="Dialogen må ha én mottaker. Velg en aktør øverst."
          />
        )}
      </div>
      <SelectField
        label="Tjenesteeier"
        size="sm"
        value={org}
        onChange={(event: ChangeEvent<HTMLSelectElement>) => onChange({ ...state, org: event.target.value })}
      >
        {!hasSelectedOrg && <option value={org}>{org}</option>}
        {organizationOptions.map(({ id, name }) => (
          <option key={id} value={id}>
            {`${name} (${id})`}
          </option>
        ))}
      </SelectField>
      <TextField
        label="Tjenesteressurs"
        data-path="serviceResource"
        helperText="For eksempel urn:altinn:resource:min-tjeneste"
        required
        size="sm"
        value={dialog.serviceResource}
        onChange={(event: ChangeEvent<HTMLInputElement>) => setDialog({ serviceResource: event.target.value })}
      />
      <OptionsField<ServiceResourceType>
        label="Ressurstype"
        path="serviceResourceType"
        value={serviceResourceType}
        options={SERVICE_RESOURCE_TYPES}
        onChange={(value) => onChange({ ...state, serviceResourceType: value })}
      />
      <OptionsField
        label="Status"
        path="status"
        value={dialog.status ?? DIALOG_STATUSES[0]}
        options={DIALOG_STATUSES}
        onChange={(status) => setDialog({ status })}
      />
      <OptionsField
        label="Plassering"
        path="systemLabel"
        value={dialog.systemLabel ?? 'Default'}
        options={SYSTEM_LABELS}
        onChange={(systemLabel) => setDialog({ systemLabel })}
      />
      <DateTimeField label="Frist" path="dueAt" value={dialog.dueAt} onChange={(dueAt) => setDialog({ dueAt })} />
    </Section>
  );
};

export const ContentSection = ({ dialog, languages, errors, onChange }: DialogSectionProps) => {
  const { content } = dialog;
  const setContent = (patch: Partial<DialogDraft['content']>) =>
    onChange({ ...dialog, content: { ...content, ...patch } });

  return (
    <Section title="Innhold" errorCount={countErrors(errors, 'content')} defaultOpen>
      <LocalizedField
        label="Tittel"
        path="content.title"
        required
        values={content.title.value}
        languages={languages}
        onChange={(value) => setContent({ title: { value } })}
      />
      <LocalizedField
        label="Sammendrag"
        path="content.summary"
        multiline
        values={content.summary?.value}
        languages={languages}
        onChange={(value) => setContent({ summary: { value } })}
      />
      <LocalizedField
        label="Avsendernavn"
        path="content.senderName"
        values={content.senderName?.value}
        languages={languages}
        onChange={(value) => setContent({ senderName: { value } })}
      />
      <LocalizedField
        label="Utvidet status"
        path="content.extendedStatus"
        values={content.extendedStatus?.value}
        languages={languages}
        onChange={(value) => setContent({ extendedStatus: { value } })}
      />
      <LocalizedField
        label="Tilleggsinformasjon"
        path="content.additionalInfo"
        multiline
        values={content.additionalInfo?.value}
        languages={languages}
        onChange={(value) => setContent({ additionalInfo: { ...content.additionalInfo, value } })}
      />
      <OptionsField
        label="Format på tilleggsinformasjon"
        path="content.additionalInfo.mediaType"
        value={content.additionalInfo?.mediaType ?? ADDITIONAL_INFO_MEDIA_TYPES[0]}
        options={ADDITIONAL_INFO_MEDIA_TYPES}
        onChange={(mediaType) =>
          setContent({ additionalInfo: { value: content.additionalInfo?.value ?? [], mediaType } })
        }
      />
      <LocalizedField
        label="URL til hovedinnhold (FCE)"
        path="content.mainContentReference"
        helperText={EMBED_HELPER_TEXT}
        type="url"
        values={content.mainContentReference?.value}
        languages={languages}
        onChange={(value) =>
          setContent({
            mainContentReference: { value, mediaType: content.mainContentReference?.mediaType ?? EMBED_MEDIA_TYPES[0] },
          })
        }
      />
      <OptionsField
        label="Format på hovedinnhold"
        path="content.mainContentReference.mediaType"
        value={content.mainContentReference?.mediaType ?? EMBED_MEDIA_TYPES[0]}
        options={EMBED_MEDIA_TYPES}
        onChange={(mediaType) =>
          setContent({ mainContentReference: { value: content.mainContentReference?.value ?? [], mediaType } })
        }
      />
    </Section>
  );
};

interface AttachmentsEditorProps {
  path: string;
  attachments: Attachment[] | null | undefined;
  languages: Language[];
  onChange: (attachments: Attachment[]) => void;
}

const createAttachment = (): Attachment => ({
  displayName: [],
  urls: [{ url: '', mediaType: DEFAULT_ATTACHMENT_MEDIA_TYPE, consumerType: 'Gui' }],
});

const getAttachmentTitle = ({ displayName, urls }: Attachment) => {
  const title = getNbValue(displayName);
  return urls[0]?.mediaType === LINK_MEDIA_TYPE ? withDetail(title, 'lenke') : title;
};

const AttachmentsEditor = ({ path, attachments, languages, onChange }: AttachmentsEditorProps) => (
  <RepeatableItems
    itemLabel="Vedlegg"
    path={path}
    items={attachments ?? []}
    createItem={createAttachment}
    getTitle={getAttachmentTitle}
    onChange={onChange}
  >
    {(attachment, update, itemPath) => {
      const [firstUrl, ...otherUrls] = attachment.urls;
      const setFirstUrl = (patch: Partial<Attachment['urls'][number]>) =>
        update({ urls: [{ ...firstUrl, ...patch }, ...otherUrls] });
      const isLink = firstUrl?.mediaType === LINK_MEDIA_TYPE;

      return (
        <>
          <LocalizedField
            label="Visningsnavn"
            path={`${itemPath}.displayName`}
            required
            values={attachment.displayName}
            languages={languages}
            onChange={(displayName) => update({ displayName })}
          />
          <TextField
            label="URL"
            data-path={`${itemPath}.urls.0.url`}
            type="url"
            required
            size="sm"
            value={firstUrl?.url ?? ''}
            onChange={(event: ChangeEvent<HTMLInputElement>) => setFirstUrl({ url: event.target.value })}
          />
          <Switch
            label="Er en lenke"
            size="sm"
            checked={isLink}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              setFirstUrl({ mediaType: event.target.checked ? LINK_MEDIA_TYPE : DEFAULT_ATTACHMENT_MEDIA_TYPE })
            }
          />
          {!isLink && (
            <TextField
              label="Medietype"
              data-path={`${itemPath}.urls.0.mediaType`}
              size="sm"
              value={firstUrl?.mediaType ?? ''}
              onChange={(event: ChangeEvent<HTMLInputElement>) => setFirstUrl({ mediaType: event.target.value })}
            />
          )}
        </>
      );
    }}
  </RepeatableItems>
);

export const AttachmentsSection = ({ dialog, languages, errors, onChange }: DialogSectionProps) => (
  <Section title="Vedlegg" count={dialog.attachments?.length ?? 0} errorCount={countErrors(errors, 'attachments')}>
    <AttachmentsEditor
      path="attachments"
      attachments={dialog.attachments}
      languages={languages}
      onChange={(attachments) => onChange({ ...dialog, attachments })}
    />
  </Section>
);

const getNextPriority = (actions: GuiAction[]) =>
  GUI_ACTION_PRIORITIES.find((priority) => !actions.some((action) => action.priority === priority)) ?? 'Tertiary';

export const GuiActionsSection = ({ dialog, languages, errors, onChange }: DialogSectionProps) => {
  const guiActions = dialog.guiActions ?? [];

  return (
    <Section title="Handlinger" count={guiActions.length} errorCount={countErrors(errors, 'guiActions')}>
      <RepeatableItems
        itemLabel="Handling"
        path="guiActions"
        items={guiActions}
        createItem={(): GuiAction => ({
          action: 'read',
          url: '',
          httpMethod: 'GET',
          priority: getNextPriority(guiActions),
          title: [],
        })}
        getTitle={({ title, priority }) => withDetail(getNbValue(title), priority)}
        onChange={(items) => onChange({ ...dialog, guiActions: items })}
      >
        {(action, update, itemPath) => (
          <>
            <LocalizedField
              label="Knappetekst"
              path={`${itemPath}.title`}
              required
              values={action.title}
              languages={languages}
              onChange={(title) => update({ title })}
            />
            <TextField
              label="URL"
              data-path={`${itemPath}.url`}
              type="url"
              required
              size="sm"
              value={action.url}
              onChange={(event: ChangeEvent<HTMLInputElement>) => update({ url: event.target.value })}
            />
            <TextField
              label="Handling i tilgangspolicyen"
              data-path={`${itemPath}.action`}
              required
              size="sm"
              value={action.action}
              onChange={(event: ChangeEvent<HTMLInputElement>) => update({ action: event.target.value })}
            />
            <OptionsField
              label="Prioritet"
              path={`${itemPath}.priority`}
              value={action.priority}
              options={GUI_ACTION_PRIORITIES}
              onChange={(priority) => update({ priority })}
            />
            <OptionsField
              label="HTTP-metode"
              path={`${itemPath}.httpMethod`}
              value={action.httpMethod ?? 'GET'}
              options={HTTP_METHODS}
              onChange={(httpMethod) => update({ httpMethod })}
            />
            <LocalizedField
              label="Bekreftelsestekst"
              path={`${itemPath}.prompt`}
              values={action.prompt}
              languages={languages}
              onChange={(prompt) => update({ prompt })}
            />
            <Switch
              label="Sletter dialogen"
              size="sm"
              checked={action.isDeleteDialogAction ?? false}
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                update({ isDeleteDialogAction: event.target.checked })
              }
            />
          </>
        )}
      </RepeatableItems>
    </Section>
  );
};

interface ActorFieldsProps {
  label: string;
  path: string;
  actor: Actor;
  onChange: (actor: Actor) => void;
}

const ActorFields = ({ label, path, actor, onChange }: ActorFieldsProps) => (
  <>
    <OptionsField
      label={label}
      path={`${path}.actorType`}
      value={actor.actorType}
      options={ACTOR_TYPES}
      onChange={(actorType) => onChange({ actorType })}
    />
    {actor.actorType === 'PartyRepresentative' && (
      <>
        <TextField
          label="Navn"
          data-path={`${path}.actorName`}
          size="sm"
          value={actor.actorName ?? ''}
          onChange={(event: ChangeEvent<HTMLInputElement>) => onChange({ ...actor, actorName: event.target.value })}
        />
        <TextField
          label="Aktør-URN"
          data-path={`${path}.actorId`}
          size="sm"
          value={actor.actorId ?? ''}
          onChange={(event: ChangeEvent<HTMLInputElement>) => onChange({ ...actor, actorId: event.target.value })}
        />
      </>
    )}
  </>
);

export const ActivitiesSection = ({ dialog, languages, errors, onChange }: DialogSectionProps) => (
  <Section title="Aktiviteter" count={dialog.activities?.length ?? 0} errorCount={countErrors(errors, 'activities')}>
    <RepeatableItems
      itemLabel="Aktivitet"
      path="activities"
      items={dialog.activities ?? []}
      createItem={(): Activity => ({ type: 'Information', performedBy: { actorType: 'ServiceOwner' } })}
      getTitle={({ type }) => type}
      onChange={(activities) => onChange({ ...dialog, activities })}
    >
      {(activity, update, itemPath) => (
        <>
          <OptionsField
            label="Type"
            path={`${itemPath}.type`}
            value={activity.type}
            options={ACTIVITY_TYPES}
            onChange={(type) =>
              update({ type, description: type === 'Information' ? activity.description : undefined })
            }
          />
          <ActorFields
            label="Utført av"
            path={`${itemPath}.performedBy`}
            actor={activity.performedBy}
            onChange={(performedBy) => update({ performedBy })}
          />
          {activity.type === 'Information' && (
            <LocalizedField
              label="Beskrivelse"
              path={`${itemPath}.description`}
              multiline
              values={activity.description}
              languages={languages}
              onChange={(description) => update({ description })}
            />
          )}
        </>
      )}
    </RepeatableItems>
  </Section>
);

interface NavigationalActionsEditorProps {
  path: string;
  actions: NavigationalAction[] | null | undefined;
  languages: Language[];
  onChange: (actions: NavigationalAction[]) => void;
}

const NavigationalActionsEditor = ({ path, actions, languages, onChange }: NavigationalActionsEditorProps) => (
  <RepeatableItems
    itemLabel="Navigasjonshandling"
    path={path}
    items={actions ?? []}
    createItem={(): NavigationalAction => ({ title: [], url: '' })}
    getTitle={({ title }) => getNbValue(title)}
    onChange={onChange}
  >
    {(action, update, itemPath) => (
      <>
        <LocalizedField
          label="Knappetekst"
          path={`${itemPath}.title`}
          required
          values={action.title}
          languages={languages}
          onChange={(title) => update({ title })}
        />
        <TextField
          label="URL"
          data-path={`${itemPath}.url`}
          type="url"
          required
          size="sm"
          value={action.url}
          onChange={(event: ChangeEvent<HTMLInputElement>) => update({ url: event.target.value })}
        />
        <DateTimeField
          label="Utløper"
          path={`${itemPath}.expiresAt`}
          value={action.expiresAt}
          onChange={(expiresAt) => update({ expiresAt })}
        />
      </>
    )}
  </RepeatableItems>
);

const getTransmissionTitle = ({ content, attachments, navigationalActions }: Transmission) => {
  const title = getNbValue(content.title.value);
  const counts = [
    formatCount(attachments?.length, 'vedlegg', 'vedlegg'),
    formatCount(navigationalActions?.length, 'navigasjonshandling', 'navigasjonshandlinger'),
  ]
    .filter(Boolean)
    .join(', ');
  return counts ? withDetail(title, counts) : title;
};

export const TransmissionsSection = ({ dialog, languages, errors, onChange }: DialogSectionProps) => (
  <Section
    title="Forsendelser og navigasjonshandlinger"
    description="Navigasjonshandlinger og vedlegg hører til en forsendelse. Legg til en forsendelse for å få feltene."
    count={dialog.transmissions?.length ?? 0}
    errorCount={countErrors(errors, 'transmissions')}
  >
    <RepeatableItems
      itemLabel="Forsendelse"
      path="transmissions"
      items={dialog.transmissions ?? []}
      createItem={(): Transmission => ({
        type: 'Information',
        sender: { actorType: 'ServiceOwner' },
        content: { title: { value: [] } },
      })}
      getTitle={getTransmissionTitle}
      onChange={(transmissions) => onChange({ ...dialog, transmissions })}
    >
      {(transmission, update, itemPath) => {
        const { content } = transmission;
        const setContent = (patch: Partial<Transmission['content']>) => update({ content: { ...content, ...patch } });

        return (
          <>
            <OptionsField
              label="Type"
              path={`${itemPath}.type`}
              value={transmission.type}
              options={TRANSMISSION_TYPES}
              onChange={(type) => update({ type })}
            />
            <ActorFields
              label="Avsender"
              path={`${itemPath}.sender`}
              actor={transmission.sender}
              onChange={(sender) => update({ sender })}
            />
            <LocalizedField
              label="Tittel"
              path={`${itemPath}.content.title`}
              required
              values={content.title.value}
              languages={languages}
              onChange={(value) => setContent({ title: { value } })}
            />
            <LocalizedField
              label="Sammendrag"
              path={`${itemPath}.content.summary`}
              multiline
              values={content.summary?.value}
              languages={languages}
              onChange={(value) => setContent({ summary: { value } })}
            />
            <LocalizedField
              label="URL til innhold (FCE)"
              path={`${itemPath}.content.contentReference`}
              helperText={EMBED_HELPER_TEXT}
              type="url"
              values={content.contentReference?.value}
              languages={languages}
              onChange={(value) =>
                setContent({
                  contentReference: { value, mediaType: content.contentReference?.mediaType ?? EMBED_MEDIA_TYPES[0] },
                })
              }
            />
            <Heading as="h3" size="xs">
              {`Vedlegg (${transmission.attachments?.length ?? 0})`}
            </Heading>
            <AttachmentsEditor
              path={`${itemPath}.attachments`}
              attachments={transmission.attachments}
              languages={languages}
              onChange={(attachments) => update({ attachments })}
            />
            <Heading as="h3" size="xs">
              {`Navigasjonshandlinger (${transmission.navigationalActions?.length ?? 0})`}
            </Heading>
            <NavigationalActionsEditor
              path={`${itemPath}.navigationalActions`}
              actions={transmission.navigationalActions}
              languages={languages}
              onChange={(navigationalActions) => update({ navigationalActions })}
            />
          </>
        );
      }}
    </RepeatableItems>
  </Section>
);
