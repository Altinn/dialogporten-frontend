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
  const isProdEnvironment = location.hostname.includes('af.altinn.no');
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
        <TextField
          label="Mobiltelefon"
          placeholder="Mobilnummer for varslinger"
          value={phoneNumber}
          size="sm"
          readOnly={readOnly}
        />
      )}
      {(variant === 'email' || variant === 'alerts') && (
        <TextField
          label="E-postadresse"
          placeholder="E-postadresse for varslinger"
          value={emailAddress}
          size="sm"
          readOnly={readOnly}
        />
      )}
      {variant === 'address' && (
        <>
          <TextField label="Postadresse" value={mailingAddress} size="sm" readOnly={readOnly} />
          <TextField
            label="Postnummer og sted"
            value={`${mailingPostalCode} ${mailingPostalCity}`}
            size="sm"
            readOnly={readOnly}
          />
        </>
      )}
      {usedByItems.length > 0 && (
        <UsedByLog endUserLabel="Deg" items={usedByItems} title={'Brukes av ' + usedByItems?.length + ' aktører'} />
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
              Altinn bruker postadressen din fra <a href={folkeRegisteretUrl}>Folkeregisteret</a>. Hvis adressen er feil
              må du endre den der.
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
                Altinn bruker kontaktinformasjon fra <a href={krrInfoUrl}>Kontakt- og reservasjonsregisteret</a>, et
                felles kontaktregister for stat og kommune.
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
