import type { ServiceResource } from 'bff-types-generated';

export const services: ServiceResource[] = [
  { id: 'brg-samordnet-registermelding', title: 'Samordnet registermelding', org: 'brg' },
  { id: 'mat-tilsyn-naeringsmiddelvirksomhet', title: 'Tilsyn med næringsmiddelvirksomheter', org: 'mat' },
  { id: 'nav-sykepenger-arbeidsgiver', title: 'Sykepenger for arbeidsgivere', org: 'nav' },
  { id: 'ok-serveringsbevilling', title: 'Søknad om serveringsbevilling', org: 'ok' },
  { id: 'ok-uteservering', title: 'Søknad om uteservering', org: 'ok' },
  { id: 'skd-a-melding', title: 'A-melding', org: 'skd' },
  { id: 'skd-merverdiavgiftsregisteret', title: 'Registrering i Merverdiavgiftsregisteret', org: 'skd' },
  { id: 'ssb-omsetningsstatistikk', title: 'Omsetningsstatistikk', org: 'ssb' },
  { id: 'svv-eierskifte-kjoretoy', title: 'Eierskifte av kjøretøy', org: 'svv' },
];
