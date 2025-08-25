import { Breadcrumbs, Heading, PageBase, Typography } from '@altinn/altinn-components';
import { useTranslation } from 'react-i18next';
import { PageRoutes } from '../routes';

export const AboutPage = () => {
  const { t } = useTranslation();

  return (
    <PageBase>
      <Breadcrumbs
        items={[
          {
            label: t('altinn.beta.inbox'),
            href: PageRoutes.inbox,
          },
          {
            label: t('altinn.beta.about'),
            href: PageRoutes.about,
          },
        ]}
      />
      <Heading size="xl">Om nye Altinn – enklere, tryggere og mer moderne</Heading>
      <Typography>
        <p>
          Altinn har vært en viktig digital portal for innbyggere og virksomheter i over 20 år. Teknologien begynner å
          bli utdatert. Derfor bygger vi nå om fra Altinn 2 til Altinn 3. Den nye plattformen gir bedre sikkerhet, mer
          moderne løsninger og enklere bruk for deg.
        </p>
        <h2>Hva blir bedre for deg som bruker Altinn?</h2>
        <ul>
          <li>
            <strong>Enklere å bruke:</strong> Tydelig design, enklere språk og mobilvennlig løsning.
          </li>
          <li>
            <strong>Raskere oversikt over meldinger:</strong> Innboksen samler brev, varsler og kvitteringer, og viser
            hvem som har lest meldingene og om en sak er under arbeid.
          </li>
          <li>
            <strong>Tryggere og sikrere:</strong> Personopplysningene dine beskyttes på en moderne plattform som er
            bedre rustet mot digitale trusler.
          </li>
          <li>
            <strong>Systembrukere og integrasjon:</strong> Virksomheter kan koble egne systemer direkte til Altinn, noe
            som gir tryggere og mer stabile integrasjoner.
          </li>
          <li>
            <strong>Åpen kildekode og samskaping:</strong> Offentlige etater kan bygge løsninger som deles og
            gjenbrukes, og raskere utvikle nye tjenester som møter reelle behov.
          </li>
        </ul>
        <h2>Hvordan lanserer vi endringene?</h2>
        <p>
          <strong>
            Siden Altinn brukes av mange offentlige virksomheter og alt må fungere sammen, rulles endringene ut gradvis.
            Du kan derfor oppleve at noen funksjoner mangler eller ser annerledes ut i starten.
          </strong>
          Tenk på det som et puslespill: i begynnelsen ser man bare enkelte brikker, men bit for bit kommer helheten på
          plass.
        </p>
        <p>
          1. september lanserer vi første del av puslespillet: den nye innboksen og støtte for systembrukere. Du kan ta
          i bruk den nye innboksen allerede nå, men den gamle innboksen vil fortsatt være tilgjengelig i en
          overgangsperiode.
        </p>
        <p>
          Systembrukere blir tilgjengelig for regnskapsbyråer, revisjonsselskaper og andre virksomheter som ønsker å
          koble egne systemer direkte til Altinn.
        </p>
        <h2>Hva må jeg gjøre?</h2>
        <p>Du trenger ikke gjøre noe. Vi gir beskjed dersom det er noe du må gjøre.</p>
        <h2>Takk for tålmodigheten</h2>
        <p>
          Vi gleder oss til å vise deg det nye Altinn og setter stor pris på tålmodigheten din mens vi bygger om. Har du
          spørsmål eller tilbakemeldinger, kontakt oss på brukerservice@altinn.no
        </p>
      </Typography>
    </PageBase>
  );
};
