---
title: "Person URN encryption"
---
National identity numbers (fødselsnummer) must never reach the browser.
Dialogporten and Altinn identify persons with URNs like `urn:altinn:person:identifier-no:<11 digits>`,
so the BFF encrypts these before responses leave it, and decrypts them again when the frontend sends them back.

## How it works

Code: `packages/bff/src/party/`.

- **Format:** `urn:altinn:person:identifier-no:<digits>` becomes `urn:altinn:person:identifier-no:enc:<base64url ciphertext>`.
  The prefix is kept, so frontend code that checks for `person` in a URN still works.
- **Cipher:** AES-SIV (`@noble/ciphers`). It is deterministic: the same URN always gives the same ciphertext with the same key.
  The frontend relies on this, because it compares and looks up parties by URN (for example a dialog's `party` against the party list).
- **Requests:** `decryptPersonUrnsDeep` walks all GraphQL variables sent to Dialogporten and decrypts every encrypted URN it finds (`graphql/api.ts`).
- **Responses:** `encryptPersonUrnsInResponse` (`personUrnTransformers.ts`) only encrypts the `party` field under these root fields:
  - `dialogById.dialog.party`
  - `searchDialogs.items[].party`
  - `parties[].party`
- **Saved searches:** the URNs are stored decrypted in Postgres and encrypted when read (`graphql/savedSearches/`).

## When you add or change a query

Encryption is an allowlist and decryption is not. A new query that returns a person URN under another root field
or another field name sends the identity number to the browser in plain text. Nothing fails.

When a query returns party or person data:

1. Check the response for `urn:altinn:person:identifier-no:` followed by digits, for example in the browser's network tab.
2. If it is there, add a transformer for the root field in `fieldTransformers` in `personUrnTransformers.ts`.
3. Add a test in `packages/bff/tests/personUrnCipher.spec.ts`.

Persons must also never be put in the URL. The frontend leaves out person parties when it writes the selected party to the query string (`useParties.ts`).

## Keys and rotation

- `PERSON_URN_ENC_KEYS` holds one or more base64-encoded AES-SIV keys (32 or 64 bytes), separated by commas: `current,previous`.
- New values are encrypted with the first key. Decryption tries every key in order.
- Generate a key with `openssl rand -base64 64`.
- In Azure the variable comes from the Key Vault secret `PersonUrnEncryptionKey` (`.azure/applications/bff/main.bicep`).
- The config has a built-in development key. It must never be used in a deployed environment.

To rotate:

1. Set the secret to `new,old` and deploy, so the new key is used for encryption and the old one still decrypts.
2. Ciphertexts change when the key changes. They are not stored anywhere, but tabs that were opened before the deploy still hold old ones and may send them back. The old key decrypts them.
3. When those tabs are gone, set the secret to `new` only and deploy. A few days is a safe margin.
