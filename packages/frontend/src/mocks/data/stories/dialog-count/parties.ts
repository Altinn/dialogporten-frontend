import type { PartyFieldsFragment } from 'bff-types-generated';

export const parties: PartyFieldsFragment[] = [
  {
    "party": "urn:altinn:person:identifier-no:12907499179",
    "partyType": "Person",
    "subParties": [],
    "isAccessManager": true,
    "isMainAdministrator": false,
    "name": "ASK UGLESETT",
    "isCurrentEndUser": true,
    "isDeleted": false,
    "hasOnlyAccessToSubParties": false,
  },
  {
    "party": "urn:altinn:organization:identifier-no:213294342",
    "partyType": "Organization",
    "hasOnlyAccessToSubParties": false,
    "subParties": [
      {
        "party": "urn:altinn:organization:identifier-no:215421902",
        "partyType": "Organization",
        "isAccessManager": true,
        "isMainAdministrator": true,
        "name": "LATTERMILD ORIENTAL TIGER AS",
        "isCurrentEndUser": false,
        "isDeleted": false
      }
    ],
    "isAccessManager": true,
    "isMainAdministrator": true,
    "name": "LATTERMILD ORIENTAL TIGER AS",
    "isCurrentEndUser": false,
    "isDeleted": false
  },
  {
    "party": "urn:altinn:organization:identifier-no:313549461",
    "partyType": "Organization",
    "hasOnlyAccessToSubParties": false,
    "subParties": [
      {
        "party": "urn:altinn:organization:identifier-no:311615696",
        "partyType": "Organization",
        "isAccessManager": true,
        "isMainAdministrator": true,
        "name": "DYPSINDIG FUNKSJONELL FJELLREV",
        "isCurrentEndUser": false,
        "isDeleted": false
      },
      {
        "party": "urn:altinn:organization:identifier-no:311615688",
        "partyType": "Organization",
        "isAccessManager": true,
        "isMainAdministrator": true,
        "name": "UPRESIS KONSENTRISK FJELLREV",
        "isCurrentEndUser": false,
        "isDeleted": false
      }
    ],
    "isAccessManager": true,
    "isMainAdministrator": true,
    "name": "ORDENTLIG VIRTUELL TIGER AS",
    "isCurrentEndUser": false,
    "isDeleted": false
  },
  {
    "party": "urn:altinn:organization:identifier-no:313776816",
    "partyType": "Organization",
    "hasOnlyAccessToSubParties": false,
    "subParties": [
      {
        "party": "urn:altinn:organization:identifier-no:315073693",
        "partyType": "Organization",
        "isAccessManager": false,
        "isMainAdministrator": false,
        "name": "PLUTSELIG NYBAKT TIGER AS",
        "isCurrentEndUser": false,
        "isDeleted": false
      }
    ],
    "isAccessManager": false,
    "isMainAdministrator": false,
    "name": "PLUTSELIG NYBAKT TIGER AS",
    "isCurrentEndUser": false,
    "isDeleted": false
  },
  {
    "party": "urn:altinn:organization:identifier-no:312409216",
    "partyType": "Organization",
    "hasOnlyAccessToSubParties": false,
    "subParties": [
      {
        "party": "urn:altinn:organization:identifier-no:314518748",
        "partyType": "Organization",
        "isAccessManager": false,
        "isMainAdministrator": false,
        "name": "STYRBAR UTTRYKKSFULL TIGER AS",
        "isCurrentEndUser": false,
        "isDeleted": false
      }
    ],
    "isAccessManager": false,
    "isMainAdministrator": false,
    "name": "STYRBAR UTTRYKKSFULL TIGER AS",
    "isCurrentEndUser": false,
    "isDeleted": false
  }
]
