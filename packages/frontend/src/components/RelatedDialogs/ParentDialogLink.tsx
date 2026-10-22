import { Link, Typography } from '@altinn/altinn-components';
import { DialogRelationType } from 'bff-types-generated';
import { useTranslation } from 'react-i18next';
import { useDialogRelations } from '../../api/hooks/useDialogRelations.ts';
import { usePartyGraph } from '../../api/hooks/usePartiesSelectors.ts';
import { getRelatedDialogTitle } from './mapRelatedDialog.ts';
import { RelatedDialogLink, useRelatedDialogLinkTarget } from './partySwitch.tsx';
import styles from './relatedDialogs.module.css';

interface ParentDialogLinkProps {
  dialogId: string;
}

/**
 * Shown on a dialog with relations: links to its parent dialog, if it has one the end user can access. Renders nothing
 * otherwise, as the API leaves out relations to dialogs the end user cannot access.
 */
export const ParentDialogLink = ({ dialogId }: ParentDialogLinkProps) => {
  const { t } = useTranslation();
  const { relations } = useDialogRelations({ dialogId, type: DialogRelationType.Parent, limit: 1 });
  const getLinkTarget = useRelatedDialogLinkTarget(usePartyGraph());
  const parent = relations[0]?.dialog;

  if (!parent) {
    return null;
  }

  return (
    <Typography className={styles.parentLink} data-testid="parent-dialog-link">
      <p>
        <Link as={RelatedDialogLink} {...getLinkTarget(parent.id, parent.party)}>
          {t('dialog.related.part_of', { title: getRelatedDialogTitle(parent) })}
        </Link>
      </p>
    </Typography>
  );
};
