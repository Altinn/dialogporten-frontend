import {
  Button,
  ButtonGroup,
  type ButtonProps,
  TextField,
  Typography,
  UsedByLog,
  type UsedByLogItemProps,
} from '@altinn/altinn-components';
import { ExternalLinkIcon } from '@navikt/aksel-icons';
import i18n from 'i18next';
import { useTranslation } from 'react-i18next';

const getIsProdEnvironment = () => location.hostname.includes('af.altinn.no');

export const ContactProfileDetails = ({
  variant,
  readOnly = false,
  phoneNumber,
  emailAddress,
  mailingAddress,
  mailingPostalCity,
  mailingPostalCode,
  usedByItems = [],
  buttons,
  description,
}: {
  variant: 'phone' | 'email' | 'address' | 'alerts';
  phoneNumber?: string;
  emailAddress?: string;
  readOnly?: boolean;
  mailingAddress?: string;
  mailingPostalCode?: string;
  mailingPostalCity?: string;
  description?: string;
  buttons?: ButtonProps[];
  usedByItems?: UsedByLogItemProps[];
}) => {
  const { t } = useTranslation();
  const isProdEnvironment = getIsProdEnvironment();
  const krrBaseUrl = isProdEnvironment
    ? 'https://minprofil.kontaktregisteret.no'
    : 'https://minprofil.test.kontaktregisteret.no';
  const krrUrl = `${krrBaseUrl}/?locale=${i18n.language}`;
  const krrInfoUrl = 'https://eid.difi.no/nb/kontakt-og-reservasjonsregisteret';
  const folkeRegisteretUrl = isProdEnvironment
    ? 'https://www.skatteetaten.no/person/folkeregister/flytte/'
    : 'https://testdata.skatteetaten.no/web/testnorge/soek/freg';

  return (
    <>
      {(variant === 'phone' || variant === 'alerts') && (
        <TextField label={t('contact_profile.mobile_phone')} value={phoneNumber} size="sm" readOnly={readOnly} />
      )}
      {(variant === 'email' || variant === 'alerts') && (
        <TextField label={t('contact_profile.email_address')} value={emailAddress} size="sm" readOnly={readOnly} />
      )}
      {variant === 'address' && (
        <>
          <TextField label={t('contact_profile.address')} value={mailingAddress} size="sm" readOnly={readOnly} />
          <TextField
            label={t('contact_profile.location')}
            value={`${mailingPostalCode} ${mailingPostalCity}`}
            size="sm"
            readOnly={readOnly}
          />
        </>
      )}
      {usedByItems.length > 0 && (
        <UsedByLog
          endUserLabel={t('contact_profile.used_by_you')}
          items={usedByItems}
          title={t('contact_profile.used_by_actors', { count: usedByItems?.length })}
        />
      )}
      {description && (
        <Typography size="sm">
          <p>{description}</p>
        </Typography>
      )}
      {buttons}
      {readOnly && variant === 'address' ? (
        <>
          <Typography size="sm">
            <p>
              {t('contact_profile.address_from_register_part1')}{' '}
              <a href={folkeRegisteretUrl}>{t('contact_profile.address_from_register_link')}</a>
              {t('contact_profile.address_from_register_part2')}
            </p>
          </Typography>
          <ButtonGroup size="md">
            <Button variant="outline" href={folkeRegisteretUrl} icon={{ svgElement: ExternalLinkIcon }} as="a" reverse>
              {t('profile.notifications.change_address')}
            </Button>
          </ButtonGroup>
        </>
      ) : (
        !description && (
          <>
            <Typography size="sm">
              <p>
                {t('contact_profile.contact_info_part1')} <a href={krrInfoUrl}>{t('contact_profile.email_register')}</a>
                {t('contact_profile.contact_info_part2')}
              </p>
            </Typography>
            <ButtonGroup size="md">
              <Button variant="outline" href={krrUrl} icon={{ svgElement: ExternalLinkIcon }} as="a" reverse>
                {t('profile.change_contact_settings')}
              </Button>
            </ButtonGroup>
          </>
        )
      )}
    </>
  );
};
