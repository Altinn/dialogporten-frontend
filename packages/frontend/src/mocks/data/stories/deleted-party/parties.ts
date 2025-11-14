import type { PartyFieldsFragment } from 'bff-types-generated';

export const parties: PartyFieldsFragment[] = [
  {
    "party": "urn:altinn:person:identifier-no:12907499179",
    "partyType": "Person",
    "subParties": [],
    "name": "ASK UGLESETT",
    "isCurrentEndUser": true,
    "isDeleted": false,
    "hasOnlyAccessToSubParties": false,
"partyUuid": "party:uuid:here",
  },
  {
    "party": "urn:altinn:organization:identifier-no:213294342",
    "partyType": "Organization",
    "hasOnlyAccessToSubParties": false,
    "subParties": [
      {
        "party": "urn:altinn:organization:identifier-no:215421902",
        "partyType": "Organization",
        "name": "LATTERMILD ORIENTAL TIGER AS",
        "isCurrentEndUser": false,
        "partyUuid": "urn:altinn:person:identifier-no:1337",
        "isDeleted": true,
      }
    ],
    "name": "LATTERMILD ORIENTAL TIGER AS",
    "isCurrentEndUser": false,
    "isDeleted": false,
"partyUuid": "party:uuid:here",
  },
  {
    "party": "urn:altinn:organization:identifier-no:313549461",
    "partyType": "Organization",
    "hasOnlyAccessToSubParties": false,
    "subParties": [
      {
        "party": "urn:altinn:organization:identifier-no:311615696",
        "partyType": "Organization",
        "name": "DYPSINDIG FUNKSJONELL FJELLREV",
        "isCurrentEndUser": false,
        "partyUuid": "urn:altinn:person:identifier-no:1337",
        "isDeleted": true,
      },
      {
        "party": "urn:altinn:organization:identifier-no:311615688",
        "partyType": "Organization",
        "name": "UPRESIS KONSENTRISK FJELLREV",
        "isCurrentEndUser": false,
        "partyUuid": "urn:altinn:person:identifier-no:1337",
        "isDeleted": false,
      }
    ],
    "name": "ORDENTLIG VIRTUELL TIGER AS",
    "isCurrentEndUser": false,
    "isDeleted": false,
"partyUuid": "party:uuid:here",
  },
  {
    "party": "urn:altinn:organization:identifier-no:313776816",
    "partyType": "Organization",
    "hasOnlyAccessToSubParties": false,
    "subParties": [
      {
        "party": "urn:altinn:organization:identifier-no:315073693",
        "partyType": "Organization",
        "name": "PLUTSELIG NYBAKT TIGER AS",
        "isCurrentEndUser": false,
        "partyUuid": "urn:altinn:person:identifier-no:1337",
        "isDeleted": false,
      }
    ],
    "name": "PLUTSELIG NYBAKT TIGER AS",
    "isCurrentEndUser": false,
    "isDeleted": false,
"partyUuid": "party:uuid:here",
  },
  {
    "party": "urn:altinn:organization:identifier-no:312409216",
    "partyType": "Organization",
    "hasOnlyAccessToSubParties": false,
    "subParties": [
      {
        "party": "urn:altinn:organization:identifier-no:314518748",
        "partyType": "Organization",
        "name": "STYRBAR UTTRYKKSFULL TIGER AS",
        "isCurrentEndUser": false,
        "partyUuid": "urn:altinn:person:identifier-no:1337",
        "isDeleted": false,
      }
    ],
    "name": "STYRBAR UTTRYKKSFULL TIGER AS",
    "isCurrentEndUser": false,
    "isDeleted": false,
"partyUuid": "party:uuid:here",
  }
]
