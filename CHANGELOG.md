# Changelog

## [1.20.0](https://github.com/Altinn/dialogporten-frontend/compare/v1.19.0...v1.20.0) (2025-03-07)


### Features

* Hide 'All actors' button if there are more than 20 ([8062138](https://github.com/Altinn/dialogporten-frontend/commit/8062138a8c1517249f4142222c8768f907aaa614))


### Bug Fixes

* consistent actor props for all dialogs elements ([#1908](https://github.com/Altinn/dialogporten-frontend/issues/1908)) ([a62d717](https://github.com/Altinn/dialogporten-frontend/commit/a62d717556eb70e11cc74d29e8c55e1743e33cc7))
* Fix loading dialogs stuck after refresh ([#1904](https://github.com/Altinn/dialogporten-frontend/issues/1904)) ([b758605](https://github.com/Altinn/dialogporten-frontend/commit/b75860584fbdf5e6fdd813e493f27f30fa7a8e2a))

## [1.19.0](https://github.com/Altinn/dialogporten-frontend/compare/v1.18.5...v1.19.0) (2025-03-06)


### Features

* use loading state for dialog from altinn-components ([#1884](https://github.com/Altinn/dialogporten-frontend/issues/1884)) ([0ed7832](https://github.com/Altinn/dialogporten-frontend/commit/0ed78327bf37bab5b7fcf97dfec492baa54cc6e5))


### Bug Fixes

* Fix dialogs sorting by date ([#1881](https://github.com/Altinn/dialogporten-frontend/issues/1881)) ([6adce4d](https://github.com/Altinn/dialogporten-frontend/commit/6adce4db373efa92a21aefaa221bb41fec19e1af))
* **vitest:** fix issues with imports of react-router-dom outside of scope ([#1894](https://github.com/Altinn/dialogporten-frontend/issues/1894)) ([883d700](https://github.com/Altinn/dialogporten-frontend/commit/883d700805f8008153df8a630a2cbccddabae585))

## [1.18.5](https://github.com/Altinn/dialogporten-frontend/compare/v1.18.4...v1.18.5) (2025-03-04)


### Bug Fixes

* Adjust sorting function for DialogList ([#1879](https://github.com/Altinn/dialogporten-frontend/issues/1879)) ([2946971](https://github.com/Altinn/dialogporten-frontend/commit/2946971e34769ca428f0beb1a282787106e62ab0))

## [1.18.4](https://github.com/Altinn/dialogporten-frontend/compare/v1.18.3...v1.18.4) (2025-03-03)


### Bug Fixes

* remove filters that should not be displayed ([#1875](https://github.com/Altinn/dialogporten-frontend/issues/1875)) ([978ca9e](https://github.com/Altinn/dialogporten-frontend/commit/978ca9e80955ad4e0b0a4ab8be4be29e92a65fe2))

## [1.18.3](https://github.com/Altinn/dialogporten-frontend/compare/v1.18.2...v1.18.3) (2025-03-03)


### Bug Fixes

* Add sorting function to DialogList ([#1874](https://github.com/Altinn/dialogporten-frontend/issues/1874)) ([359adeb](https://github.com/Altinn/dialogporten-frontend/commit/359adeb2e047b3356266d593dcc90ca1d48b8929))
* saved search button was visible even though no filters were applied ([#1872](https://github.com/Altinn/dialogporten-frontend/issues/1872)) ([005106f](https://github.com/Altinn/dialogporten-frontend/commit/005106ff198571a298c0056df0e667a8129714a6))

## [1.18.2](https://github.com/Altinn/dialogporten-frontend/compare/v1.18.1...v1.18.2) (2025-02-27)


### Bug Fixes

* scroll to top on navigating between routes ([#1846](https://github.com/Altinn/dialogporten-frontend/issues/1846)) ([9de045d](https://github.com/Altinn/dialogporten-frontend/commit/9de045d322afb3619cf71bc056c24a13c9781902))
* show sender name if provided for transmission ([#1854](https://github.com/Altinn/dialogporten-frontend/issues/1854)) ([d375ffc](https://github.com/Altinn/dialogporten-frontend/commit/d375ffc3903b80c07f1ecb762b921108d2567cf7))

## [1.18.1](https://github.com/Altinn/dialogporten-frontend/compare/v1.18.0...v1.18.1) (2025-02-26)


### Bug Fixes

* replace additional info content with DialogSection from altinn-components ([#1838](https://github.com/Altinn/dialogporten-frontend/issues/1838)) ([d562ccf](https://github.com/Altinn/dialogporten-frontend/commit/d562ccf4fd03ca4b6a73e95d4c16416cae112846))
* use DialogContent ([#1841](https://github.com/Altinn/dialogporten-frontend/issues/1841)) ([4c16180](https://github.com/Altinn/dialogporten-frontend/commit/4c16180defe8b46ed238714b29370646e36051ab))

## [1.18.0](https://github.com/Altinn/dialogporten-frontend/compare/v1.17.0...v1.18.0) (2025-02-24)


### Features

* Use 'pid' instead of 'sub' as primary key for profile database ([023142b](https://github.com/Altinn/dialogporten-frontend/commit/023142b6dc2b49d84e621df753c6e039b11e1a4c))


### Bug Fixes

* re-potion saved search button ([#1831](https://github.com/Altinn/dialogporten-frontend/issues/1831)) ([0ec966a](https://github.com/Altinn/dialogporten-frontend/commit/0ec966a30046c7eb3add0634a803c1eef8002fa7))
* refetch data after gui action delete ([#1835](https://github.com/Altinn/dialogporten-frontend/issues/1835)) ([3e93749](https://github.com/Altinn/dialogporten-frontend/commit/3e93749cc4676aaab42757531a041f7e62760cfb))

## [1.17.0](https://github.com/Altinn/dialogporten-frontend/compare/v1.16.0...v1.17.0) (2025-02-24)


### Features

* add dialog header and fix wrapper for dialog details page ([#1825](https://github.com/Altinn/dialogporten-frontend/issues/1825)) ([d54356c](https://github.com/Altinn/dialogporten-frontend/commit/d54356c3ad6d9b20d95e40c101c90178e76119fa))
* **infra:** add availability test for frontend ([#1818](https://github.com/Altinn/dialogporten-frontend/issues/1818)) ([6418e5c](https://github.com/Altinn/dialogporten-frontend/commit/6418e5c20205d7e3b8d72da6975c6cf9635f91d4))


### Bug Fixes

* incorrect date for calculating date options - forgot to remove static date for testing ([#1830](https://github.com/Altinn/dialogporten-frontend/issues/1830)) ([ebb2137](https://github.com/Altinn/dialogporten-frontend/commit/ebb213796c777be0e63148cebc15d03a296313ff))

## [1.16.0](https://github.com/Altinn/dialogporten-frontend/compare/v1.15.1...v1.16.0) (2025-02-20)


### Features

* Add autocomplete senders suggestions ([#1799](https://github.com/Altinn/dialogporten-frontend/issues/1799)) ([99eb04d](https://github.com/Altinn/dialogporten-frontend/commit/99eb04d3814df46992fb3f13042e7a8c32cc9d51))
* add Toolbar and remove legacy components ([#1788](https://github.com/Altinn/dialogporten-frontend/issues/1788)) ([7c2ecd0](https://github.com/Altinn/dialogporten-frontend/commit/7c2ecd0583ded6b5cd58a43e3111b98dc448f2d0))
* Improve ID-porten integration ([#1796](https://github.com/Altinn/dialogporten-frontend/issues/1796)) ([d394707](https://github.com/Altinn/dialogporten-frontend/commit/d394707d2dfd3f339a58b66c3c119dd74ee423ea))
* **infra:** enable access logs for application gateway ([#1805](https://github.com/Altinn/dialogporten-frontend/issues/1805)) ([0dee2ef](https://github.com/Altinn/dialogporten-frontend/commit/0dee2ef02a197b833542b531ad1131c5f9d5dae1))

## [1.15.1](https://github.com/Altinn/dialogporten-frontend/compare/v1.15.0...v1.15.1) (2025-02-07)


### Bug Fixes

* Log info correct app version ([#1785](https://github.com/Altinn/dialogporten-frontend/issues/1785)) ([0113b01](https://github.com/Altinn/dialogporten-frontend/commit/0113b0197bc6510f9e7374af47fa13cf0eca8fe9))

## [1.15.0](https://github.com/Altinn/dialogporten-frontend/compare/v1.14.1...v1.15.0) (2025-02-07)


### Features

* Display sender name if provided, update altinn components ([#1778](https://github.com/Altinn/dialogporten-frontend/issues/1778)) ([07c24a3](https://github.com/Altinn/dialogporten-frontend/commit/07c24a33d4a2c26f1331af5c878b056f469741a3))
* **infra:** only allow connection to production from selected IPs and azure-infrastructure ([#1766](https://github.com/Altinn/dialogporten-frontend/issues/1766)) ([0b23017](https://github.com/Altinn/dialogporten-frontend/commit/0b230170523d30ce08ec67c27381f81a2eb095aa))
* Sort saved searches ([#1780](https://github.com/Altinn/dialogporten-frontend/issues/1780)) ([6eb0bee](https://github.com/Altinn/dialogporten-frontend/commit/6eb0bee405ca5a7e8ec8a1fd16303347e0e0aef3))


### Bug Fixes

* Add secure coookie env variable ([48d3ed9](https://github.com/Altinn/dialogporten-frontend/commit/48d3ed97a0ab33509eeaaaae7f08e0c5a9a56c0c))
* Added sameSite true for cookies ([cacb700](https://github.com/Altinn/dialogporten-frontend/commit/cacb7005d00beca29944e76ee2989af551e024cb))
* icons missing in global menu ([#1782](https://github.com/Altinn/dialogporten-frontend/issues/1782)) ([c7f2c01](https://github.com/Altinn/dialogporten-frontend/commit/c7f2c01d84528a17f56dbf2040dd41f42e0d0fcf))
* process boolean variables correctly with zod ([#1756](https://github.com/Altinn/dialogporten-frontend/issues/1756)) ([ae55aa7](https://github.com/Altinn/dialogporten-frontend/commit/ae55aa7ce00144465449b96fdce671b8b0a1d077))
* revert attempts to secure cookie ([#1770](https://github.com/Altinn/dialogporten-frontend/issues/1770)) ([c5bdacd](https://github.com/Altinn/dialogporten-frontend/commit/c5bdacdb07346d65b89c234455c1ce569e2ba915))
* saved search input didnt get correct initial value ([#1764](https://github.com/Altinn/dialogporten-frontend/issues/1764)) ([b7a02ea](https://github.com/Altinn/dialogporten-frontend/commit/b7a02ea5a47e1afb42cf0b82262acd74d712a9d7))
* Secure cookie ([dce5367](https://github.com/Altinn/dialogporten-frontend/commit/dce536762a08e891d5e034c13f3fa84f8ee0a4fa))
* Secure cookies in staging/test/prod ([9248694](https://github.com/Altinn/dialogporten-frontend/commit/92486940993a34cb05a6d573612c0a93d5a9428a))
* set default enable_graphiql to true ([#1759](https://github.com/Altinn/dialogporten-frontend/issues/1759)) ([36feefe](https://github.com/Altinn/dialogporten-frontend/commit/36feefe47100ee3cf6e92f3abd500d25f1ffda84))

## [1.14.1](https://github.com/Altinn/dialogporten-frontend/compare/v1.14.0...v1.14.1) (2025-01-30)


### Bug Fixes

* **bff:** disable secure cookie in test ([#1754](https://github.com/Altinn/dialogporten-frontend/issues/1754)) ([6521923](https://github.com/Altinn/dialogporten-frontend/commit/652192397f87e0c54549f1438efc7fd779b20f2f))
* **bff:** ensure no redirect loop in test ([#1755](https://github.com/Altinn/dialogporten-frontend/issues/1755)) ([4bc13e7](https://github.com/Altinn/dialogporten-frontend/commit/4bc13e72f927f0ec3343b6b2ef2a4a6f7e225a88))
* ensure cookie env variables are properly parsed ([#1749](https://github.com/Altinn/dialogporten-frontend/issues/1749)) ([b6ddbd6](https://github.com/Altinn/dialogporten-frontend/commit/b6ddbd6ad6b4df5ed4dd03763d1db9c695180878))
* ensure cookie is secure in test environment ([#1748](https://github.com/Altinn/dialogporten-frontend/issues/1748)) ([71ccdb5](https://github.com/Altinn/dialogporten-frontend/commit/71ccdb5a0fa7cd29175800d109e807e1dad0f901))
* **infra:** use correct ssl certificate in app gateway for production ([#1747](https://github.com/Altinn/dialogporten-frontend/issues/1747)) ([b3ed370](https://github.com/Altinn/dialogporten-frontend/commit/b3ed3705e6a6e7eeffa601843578931ae600a573))
* Secure cookies in staging/test/prod ([935e3a3](https://github.com/Altinn/dialogporten-frontend/commit/935e3a3e44da9f36633bd38494e663d9117da11e))
* use only digdir:dialogporten.noconsent in order to remove consent screen ([#1753](https://github.com/Altinn/dialogporten-frontend/issues/1753)) ([cb5b198](https://github.com/Altinn/dialogporten-frontend/commit/cb5b198c45a0efe8aec9d12bc3964db72ab07d41))

## [1.14.0](https://github.com/Altinn/dialogporten-frontend/compare/v1.13.4...v1.14.0) (2025-01-28)


### Features

* add inconclusive badge for sidebar when dialog count is unknown ([#1735](https://github.com/Altinn/dialogporten-frontend/issues/1735)) ([92ee700](https://github.com/Altinn/dialogporten-frontend/commit/92ee700634eee7398c6a35f527cae9bf1fe61de9))

## [1.13.4](https://github.com/Altinn/dialogporten-frontend/compare/v1.13.3...v1.13.4) (2025-01-28)


### Bug Fixes

* adds new media types for front channel embeds: application/vnd.dialogporten.frontchannelembed-url;type=text/markdown and application/vnd.dialogporten.frontchannelembed-url;type=text/html ([#1731](https://github.com/Altinn/dialogporten-frontend/issues/1731)) ([95663b2](https://github.com/Altinn/dialogporten-frontend/commit/95663b239462258845b640b05de3e95efc231393))

## [1.13.3](https://github.com/Altinn/dialogporten-frontend/compare/v1.13.2...v1.13.3) (2025-01-24)


### Bug Fixes

* update dialogporten schema to latest + order by updated date DESC for search dialogs ([#1724](https://github.com/Altinn/dialogporten-frontend/issues/1724)) ([ace8a22](https://github.com/Altinn/dialogporten-frontend/commit/ace8a22788e27861f2e0c0b5a548115393da6be6))

## [1.13.2](https://github.com/Altinn/dialogporten-frontend/compare/v1.13.1...v1.13.2) (2025-01-23)


### Bug Fixes

* CI/CD Pipeline issue ([d876431](https://github.com/Altinn/dialogporten-frontend/commit/d87643149f2d3d1dc690d22687376714fecd23b1))
* Saved searches database issue ([8baa88a](https://github.com/Altinn/dialogporten-frontend/commit/8baa88a416d602fc3ea2078bd3060aa950b15fa3))
* SubParties missing in filters ([#1701](https://github.com/Altinn/dialogporten-frontend/issues/1701)) ([fb675ba](https://github.com/Altinn/dialogporten-frontend/commit/fb675ba59ac4a618ea254baa77d0e84bf5bb2432))

## [1.13.1](https://github.com/Altinn/dialogporten-frontend/compare/v1.13.0...v1.13.1) (2025-01-22)


### Bug Fixes

* Render sidebar navigation items in the global menu on tablet viewports (768px-1024px) ([#1710](https://github.com/Altinn/dialogporten-frontend/issues/1710)) ([f38753c](https://github.com/Altinn/dialogporten-frontend/commit/f38753cd1af90f4eac720aeaa00df28361481667))

## [1.13.0](https://github.com/Altinn/dialogporten-frontend/compare/v1.12.3...v1.13.0) (2025-01-21)


### Features

* implement new counting for dialogs: unread by end user, total per party or count inconclusive ([#1697](https://github.com/Altinn/dialogporten-frontend/issues/1697)) ([87edf51](https://github.com/Altinn/dialogporten-frontend/commit/87edf51b467f4ba851ab86690d4f9700f61aa256))
* **infra:** provision yt01 ([#1691](https://github.com/Altinn/dialogporten-frontend/issues/1691)) ([9b4899e](https://github.com/Altinn/dialogporten-frontend/commit/9b4899e2f2535a49d64fc6f634a406321ae4f3cb))


### Bug Fixes

* **infra:** add permissions to ssh into ssh-jumper ([#1703](https://github.com/Altinn/dialogporten-frontend/issues/1703)) ([896643a](https://github.com/Altinn/dialogporten-frontend/commit/896643ab11d72d824722e4ca6f70bfeb5f2c17fb))

## [1.12.3](https://github.com/Altinn/dialogporten-frontend/compare/v1.12.2...v1.12.3) (2025-01-16)


### Bug Fixes

* selecting account from global menu account should also send user to inbox ([#1678](https://github.com/Altinn/dialogporten-frontend/issues/1678)) ([1f348d3](https://github.com/Altinn/dialogporten-frontend/commit/1f348d3a74cca71ae679b150c956eb023ff84b06))

## [1.12.2](https://github.com/Altinn/dialogporten-frontend/compare/v1.12.1...v1.12.2) (2025-01-13)


### Bug Fixes

* include sub parties in accounts results in global menu ([#1669](https://github.com/Altinn/dialogporten-frontend/issues/1669)) ([e0ea4ba](https://github.com/Altinn/dialogporten-frontend/commit/e0ea4ba027f3e1fcfebbbb4eb69d2944c4661683))
* Postgres healthchecks ([#1658](https://github.com/Altinn/dialogporten-frontend/issues/1658)) ([cce5cc3](https://github.com/Altinn/dialogporten-frontend/commit/cce5cc352ff23e3bccfca573cad2edeac3a3ee4d))

## [1.12.1](https://github.com/digdir/dialogporten-frontend/compare/v1.12.0...v1.12.1) (2025-01-07)


### Bug Fixes

* Set httpOnly to true when using https ([b2a946a](https://github.com/digdir/dialogporten-frontend/commit/b2a946ad692186fcc66c9e2ace2690304458412f))
* when changing between all organizations and a company party, query params should be mutually excluding ([#1657](https://github.com/digdir/dialogporten-frontend/issues/1657)) ([d5b18f8](https://github.com/digdir/dialogporten-frontend/commit/d5b18f8426f4b6cbf1220632a9a54ecd9f08342d))

## [1.12.0](https://github.com/digdir/dialogporten-frontend/compare/v1.11.5...v1.12.0) (2024-12-27)


### Features

* write and read filters as query params in url ([#1601](https://github.com/digdir/dialogporten-frontend/issues/1601)) ([52252dd](https://github.com/digdir/dialogporten-frontend/commit/52252ddbccffcc6ec1794708292b4a4c23111c98))

## [1.11.5](https://github.com/digdir/dialogporten-frontend/compare/v1.11.4...v1.11.5) (2024-12-23)


### Bug Fixes

* Locale will now be updated in BFF database based on IDPorten selection ([f6ce240](https://github.com/digdir/dialogporten-frontend/commit/f6ce240b2490fcab2cdd7dafb8476d1893ebf612))

## [1.11.4](https://github.com/digdir/dialogporten-frontend/compare/v1.11.3...v1.11.4) (2024-12-20)


### Bug Fixes

* ui improvements to autocomplete dialog items and menu ([#1624](https://github.com/digdir/dialogporten-frontend/issues/1624)) ([d109bc6](https://github.com/digdir/dialogporten-frontend/commit/d109bc6ec251d4ae10caec93c73a29f830eb70df))

## [1.11.3](https://github.com/digdir/dialogporten-frontend/compare/v1.11.2...v1.11.3) (2024-12-19)


### Bug Fixes

* flattened subparties were undefined when subparty list was empty ([#1613](https://github.com/digdir/dialogporten-frontend/issues/1613)) ([02d77f9](https://github.com/digdir/dialogporten-frontend/commit/02d77f9f60cbf5fa0cc448e6e5b3e704b9986dc5))

## [1.11.2](https://github.com/digdir/dialogporten-frontend/compare/v1.11.1...v1.11.2) (2024-12-18)


### Bug Fixes

* autocomplete includes results for sub parties belonging to selected party ([#1595](https://github.com/digdir/dialogporten-frontend/issues/1595)) ([1def168](https://github.com/digdir/dialogporten-frontend/commit/1def168b4fbd4e29ae7cdaf1a5569d039abd8f35))
* read search query param on reload ([#1597](https://github.com/digdir/dialogporten-frontend/issues/1597)) ([21be5c8](https://github.com/digdir/dialogporten-frontend/commit/21be5c85711c9e6266d705e2212630ef4eb4acc1))

## [1.11.1](https://github.com/digdir/dialogporten-frontend/compare/v1.11.0...v1.11.1) (2024-12-17)


### Bug Fixes

* Search autocomplete translations ([ed721e4](https://github.com/digdir/dialogporten-frontend/commit/ed721e49fc908ff997b0a45cb9d0064eebe16bc4))
* unable to save search ([#1581](https://github.com/digdir/dialogporten-frontend/issues/1581)) ([ec9e232](https://github.com/digdir/dialogporten-frontend/commit/ec9e2325e15088c5c4fc9d1e02c5d99deaa47bbb))

## [1.11.0](https://github.com/digdir/dialogporten-frontend/compare/v1.10.1...v1.11.0) (2024-12-13)


### Features

* Optimization of search autocomplete. Refactoring of Inbox. ([#1560](https://github.com/digdir/dialogporten-frontend/issues/1560)) ([5b4a761](https://github.com/digdir/dialogporten-frontend/commit/5b4a76161895781ac68d90c68fc3e0a62f62b82b))
* use global components from altinn-components ([#1399](https://github.com/digdir/dialogporten-frontend/issues/1399)) ([ff75093](https://github.com/digdir/dialogporten-frontend/commit/ff75093e78869642aff008e98ddaed1a9a5f8e83))


### Bug Fixes

* autocomplete not working when searching within scope of inbox ([#1577](https://github.com/digdir/dialogporten-frontend/issues/1577)) ([bf88992](https://github.com/digdir/dialogporten-frontend/commit/bf88992fe66cb5a6263a2adcc60d74b2ac55dbcf))
* **deps:** update dependency @digdir/dialogporten-schema to v1.40.0 ([#1484](https://github.com/digdir/dialogporten-frontend/issues/1484)) ([f948e8b](https://github.com/digdir/dialogporten-frontend/commit/f948e8b9a3a5743595f8e442463d1239815687bb))
* **deps:** update dependency @easyops-cn/docusaurus-search-local to v0.46.1 ([#1485](https://github.com/digdir/dialogporten-frontend/issues/1485)) ([df54cad](https://github.com/digdir/dialogporten-frontend/commit/df54cad174de55f5154af9365b45e0fb29810890))
* update to altinn-components v 0.8.3 for fixing on click on auto complete to dismiss search bar ([#1503](https://github.com/digdir/dialogporten-frontend/issues/1503)) ([d2cbf95](https://github.com/digdir/dialogporten-frontend/commit/d2cbf952f8c64f892e8d38ca4aaf93be0203480c))

## [1.10.1](https://github.com/digdir/dialogporten-frontend/compare/v1.10.0...v1.10.1) (2024-12-05)


### Bug Fixes

* Party and subparty with the same name is shown as one option and will display all coresponding messages ([#1468](https://github.com/digdir/dialogporten-frontend/issues/1468)) ([2514b22](https://github.com/digdir/dialogporten-frontend/commit/2514b22a961a6590fd6d876b5d6e67f887d89e60))

## [1.10.0](https://github.com/digdir/dialogporten-frontend/compare/v1.9.5...v1.10.0) (2024-12-04)


### Features

* Added interim implementation of Dialog Transmissions ([0c60883](https://github.com/digdir/dialogporten-frontend/commit/0c6088340ad0b106e2a8b92a5c13e500281cbfe2))
* Added interim implementation of Dialog Transmissions ([#1465](https://github.com/digdir/dialogporten-frontend/issues/1465)) ([0c60883](https://github.com/digdir/dialogporten-frontend/commit/0c6088340ad0b106e2a8b92a5c13e500281cbfe2))

## [1.9.5](https://github.com/digdir/dialogporten-frontend/compare/v1.9.4...v1.9.5) (2024-12-04)


### Bug Fixes

* filters now show correct numbers of remaining messages after selecting another filter ([#1403](https://github.com/digdir/dialogporten-frontend/issues/1403)) ([61b1aef](https://github.com/digdir/dialogporten-frontend/commit/61b1aef50dae798385b1339964c3a6594af650ab))

## [1.9.4](https://github.com/digdir/dialogporten-frontend/compare/v1.9.3...v1.9.4) (2024-12-02)


### Bug Fixes

* **deps:** update dependency @opentelemetry/instrumentation to v0.55.0 ([#1370](https://github.com/digdir/dialogporten-frontend/issues/1370)) ([2cbf387](https://github.com/digdir/dialogporten-frontend/commit/2cbf387f40bf735ff1037836a451a3f2a08735b0))
* **deps:** update dependency @opentelemetry/instrumentation-graphql to v0.45.0 ([#1442](https://github.com/digdir/dialogporten-frontend/issues/1442)) ([fd2998f](https://github.com/digdir/dialogporten-frontend/commit/fd2998f862d9cf7aee4a8e403392cfa6d2db3c0c))
* **deps:** update dependency @opentelemetry/instrumentation-http to v0.55.0 ([#1371](https://github.com/digdir/dialogporten-frontend/issues/1371)) ([4fa8d31](https://github.com/digdir/dialogporten-frontend/commit/4fa8d3122b59ab0197598066d928272253a73f7d))
* **deps:** update dependency @opentelemetry/instrumentation-ioredis to v0.45.0 ([#1443](https://github.com/digdir/dialogporten-frontend/issues/1443)) ([cbf3091](https://github.com/digdir/dialogporten-frontend/commit/cbf3091cd6c8d6f921382617b849654aa8c740a9))
* Notification counter now gets updated when reading a dialog ([#1398](https://github.com/digdir/dialogporten-frontend/issues/1398)) ([7ca8424](https://github.com/digdir/dialogporten-frontend/commit/7ca8424614d32464282ef6a166fa51fe333053b9))
* Notification counter now gets updated when reading a dialog ([#1398](https://github.com/digdir/dialogporten-frontend/issues/1398)) ([#1404](https://github.com/digdir/dialogporten-frontend/issues/1404)) ([7ca8424](https://github.com/digdir/dialogporten-frontend/commit/7ca8424614d32464282ef6a166fa51fe333053b9))
* Showing org name if not found in organiszations JSON ([#1448](https://github.com/digdir/dialogporten-frontend/issues/1448)) ([047480e](https://github.com/digdir/dialogporten-frontend/commit/047480e268ed155a93f7c1faf8a12edd32825b72))

## [1.9.3](https://github.com/digdir/dialogporten-frontend/compare/v1.9.2...v1.9.3) (2024-11-25)


### Bug Fixes

* refactor back button logic ([#1391](https://github.com/digdir/dialogporten-frontend/issues/1391)) ([b42ad05](https://github.com/digdir/dialogporten-frontend/commit/b42ad0575a51c134dcb0aa9b95b8148fe308ae0b))

## [1.9.2](https://github.com/digdir/dialogporten-frontend/compare/v1.9.1...v1.9.2) (2024-11-22)


### Bug Fixes

* update dialogporten-schema to 1.38.x ([#1393](https://github.com/digdir/dialogporten-frontend/issues/1393)) ([77b065a](https://github.com/digdir/dialogporten-frontend/commit/77b065a1ad4ac0279c79221c52647df6806ded39))

## [1.9.1](https://github.com/digdir/dialogporten-frontend/compare/v1.9.0...v1.9.1) (2024-11-14)


### Bug Fixes

* Add search parameters to inbox message link ([#1366](https://github.com/digdir/dialogporten-frontend/issues/1366)) ([4196f0f](https://github.com/digdir/dialogporten-frontend/commit/4196f0f30779daa1218848f125c4c0f9653c7413))
* prevent context color flickering while navigating ([#1365](https://github.com/digdir/dialogporten-frontend/issues/1365)) ([fe107a6](https://github.com/digdir/dialogporten-frontend/commit/fe107a6611671492a7e848d337a14c7e9109be4a))

## [1.9.0](https://github.com/digdir/dialogporten-frontend/compare/v1.8.6...v1.9.0) (2024-11-13)


### Features

* Added inbox context to 'No messages' header ([efba0f5](https://github.com/digdir/dialogporten-frontend/commit/efba0f5752e2ad542e74e84b3e57cb9b9b4cea2e))
* Added inbox context to 'No messages' header ([#1337](https://github.com/digdir/dialogporten-frontend/issues/1337)) ([efba0f5](https://github.com/digdir/dialogporten-frontend/commit/efba0f5752e2ad542e74e84b3e57cb9b9b4cea2e))


### Bug Fixes

* Application freezing but when moving dialog to bin ([#1352](https://github.com/digdir/dialogporten-frontend/issues/1352)) ([532f2df](https://github.com/digdir/dialogporten-frontend/commit/532f2df1b15d38fd290150716095705e48e371d2))
* saved search link is now including parties parameters ([#1360](https://github.com/digdir/dialogporten-frontend/issues/1360)) ([71aac4b](https://github.com/digdir/dialogporten-frontend/commit/71aac4bec1700c5bcdb0874de40fed3b6112b5f8))

## [1.8.6](https://github.com/digdir/dialogporten-frontend/compare/v1.8.5...v1.8.6) (2024-11-12)


### Bug Fixes

* dialog attachments should be opened in a new window or tab ([#1359](https://github.com/digdir/dialogporten-frontend/issues/1359)) ([6eebad7](https://github.com/digdir/dialogporten-frontend/commit/6eebad7868f22d15a6d22a980ad0ff8f7aa416bc))
* Improve logic to saved searches including searchbar ([#1354](https://github.com/digdir/dialogporten-frontend/issues/1354)) ([a6be41c](https://github.com/digdir/dialogporten-frontend/commit/a6be41cd186c3d1a5a120049f28b75d5518ddefb))

## [1.8.5](https://github.com/digdir/dialogporten-frontend/compare/v1.8.4...v1.8.5) (2024-11-11)


### Bug Fixes

* Fix multiple browser history push when navigating and using search bar ([#1351](https://github.com/digdir/dialogporten-frontend/issues/1351)) ([90fa546](https://github.com/digdir/dialogporten-frontend/commit/90fa546ffdfaae761a3fe34bc371ff1142d4154f))

## [1.8.4](https://github.com/digdir/dialogporten-frontend/compare/v1.8.3...v1.8.4) (2024-11-08)


### Bug Fixes

* Back button will update application state based on query params ([#1350](https://github.com/digdir/dialogporten-frontend/issues/1350)) ([4480ae4](https://github.com/digdir/dialogporten-frontend/commit/4480ae40031b3f407d637fc0cce8974d64e6e826))
* Searchbar results will now reflect selected party. Added pre push hook. ([e15c158](https://github.com/digdir/dialogporten-frontend/commit/e15c158310c3734eb9d686e347ff5dbd465b9aec))
* Searchbar results. Added pre push tests. ([#1329](https://github.com/digdir/dialogporten-frontend/issues/1329)) ([e15c158](https://github.com/digdir/dialogporten-frontend/commit/e15c158310c3734eb9d686e347ff5dbd465b9aec))

## [1.8.3](https://github.com/digdir/dialogporten-frontend/compare/v1.8.2...v1.8.3) (2024-11-04)


### Bug Fixes

* improve query parameter consistency and state persistence across navigation ([#1328](https://github.com/digdir/dialogporten-frontend/issues/1328)) ([1ad78cb](https://github.com/digdir/dialogporten-frontend/commit/1ad78cbabb9a2e8f0fef302044b95d22739eb300))

## [1.8.2](https://github.com/digdir/dialogporten-frontend/compare/v1.8.1...v1.8.2) (2024-10-28)


### Bug Fixes

* Set min and max date values as default. Providing empty values will show all dialogs ([#1309](https://github.com/digdir/dialogporten-frontend/issues/1309)) ([5c1ad25](https://github.com/digdir/dialogporten-frontend/commit/5c1ad25845d23c680ec22b00881a48edf95ac4a7))

## [1.8.1](https://github.com/digdir/dialogporten-frontend/compare/v1.8.0...v1.8.1) (2024-10-28)


### Bug Fixes

* clear filters every time party is selected making it safe to switch + fix incorrect check for query defined selected org causing unwanted switch ([fe2c3e6](https://github.com/digdir/dialogporten-frontend/commit/fe2c3e68bbce4fedfa4fb63230ecd9843067ab77))

## [1.8.0](https://github.com/digdir/dialogporten-frontend/compare/v1.7.1...v1.8.0) (2024-10-25)


### Features

* GuiAction show spinner while awaiting response after click ([#1300](https://github.com/digdir/dialogporten-frontend/issues/1300)) ([92a0e41](https://github.com/digdir/dialogporten-frontend/commit/92a0e415acbb7f7066ec6167773119ee5759d0fc))

## [1.7.1](https://github.com/digdir/dialogporten-frontend/compare/v1.7.0...v1.7.1) (2024-10-24)


### Bug Fixes

* Save search button now behaves as expected. ([#1284](https://github.com/digdir/dialogporten-frontend/issues/1284)) ([27e1c06](https://github.com/digdir/dialogporten-frontend/commit/27e1c069cd08e4268cc9e51806c7b4f24288f5c3))

## [1.7.0](https://github.com/digdir/dialogporten-frontend/compare/v1.6.1...v1.7.0) (2024-10-23)


### Features

* Save search button will now reflect wether search already exists. ([#1270](https://github.com/digdir/dialogporten-frontend/issues/1270)) ([82dabd5](https://github.com/digdir/dialogporten-frontend/commit/82dabd543893c55d5ee06903bc2b8fde493e00b3))
* Saved search button will now reflect wether search already exists. ([82dabd5](https://github.com/digdir/dialogporten-frontend/commit/82dabd543893c55d5ee06903bc2b8fde493e00b3))


### Bug Fixes

* Added missing translations ([#1282](https://github.com/digdir/dialogporten-frontend/issues/1282)) ([313d5bb](https://github.com/digdir/dialogporten-frontend/commit/313d5bb92ac8f02b6ccff7a372a333ed47a90d30))
* allow refreshing of access token when graphql request is executed through graphiql IDE ([5ba3c5d](https://github.com/digdir/dialogporten-frontend/commit/5ba3c5db86460b96dda7289dee803cb853d944fe))
* Check on query response success variable to display correct snackbar messages, add tests ([#1277](https://github.com/digdir/dialogporten-frontend/issues/1277)) ([22edfcc](https://github.com/digdir/dialogporten-frontend/commit/22edfcc519efcf7c0820353e49211aea4cee3310))
* Counter on 'inbox' now reflects number of unread items ([#1278](https://github.com/digdir/dialogporten-frontend/issues/1278)) ([3d47049](https://github.com/digdir/dialogporten-frontend/commit/3d470496f9f589679654949e6e7a42042b754027))

## [1.6.1](https://github.com/digdir/dialogporten-frontend/compare/v1.6.0...v1.6.1) (2024-10-17)


### Bug Fixes

* date range of custom date period in filters was based on created date of dialogs, not updated date ([66811b7](https://github.com/digdir/dialogporten-frontend/commit/66811b707d8af5fc9b3667943e55a1d518d17c71))
* fix date input field styles and popup not showing ([#1243](https://github.com/digdir/dialogporten-frontend/issues/1243)) ([d9c5616](https://github.com/digdir/dialogporten-frontend/commit/d9c561615d49c423a90acd9a9cc71c028a26fc66))
* Fixed crashing behaviour when refreshing with query params ([#1247](https://github.com/digdir/dialogporten-frontend/issues/1247)) ([871ae5f](https://github.com/digdir/dialogporten-frontend/commit/871ae5f5bbd64f05162212030d230b16f58aad37))

## [1.6.0](https://github.com/digdir/dialogporten-frontend/compare/v1.5.0...v1.6.0) (2024-10-16)


### Features

* support legacy html as front channel embeds for main content reference ([85045f5](https://github.com/digdir/dialogporten-frontend/commit/85045f5db029b41b2d3e8865daae10f8bda05040))


### Bug Fixes

* Filter menu no longer covers global menu bar ([a3c8fb7](https://github.com/digdir/dialogporten-frontend/commit/a3c8fb7659feeefbb8182bc8dd1cc04f0ed425b8))
* Fixed menu button toggle button not closing the menu ([afe336e](https://github.com/digdir/dialogporten-frontend/commit/afe336e6520b5d12aa6431accbd1b6e807483438))
* Fixed menu button toggle button not closing the menu ([c990958](https://github.com/digdir/dialogporten-frontend/commit/c9909589672d409a70c9d134833cf13c5f43b233))
* SavedSearch action menu showing correctly on large screen sizes ([2427e3e](https://github.com/digdir/dialogporten-frontend/commit/2427e3ea03f5b26a0a6bcc5ef17261c20e77c8e0))

## [1.5.0](https://github.com/digdir/dialogporten-frontend/compare/v1.4.0...v1.5.0) (2024-10-14)


### Features

* refactor to support more flexibility when picking valueType based on langueCode ([2db72e9](https://github.com/digdir/dialogporten-frontend/commit/2db72e994faceda9ae76cef376767dfd5001855e))
* support text/markdown and text/html for additional info section in inbox details ([7b46733](https://github.com/digdir/dialogporten-frontend/commit/7b46733ea4b7c8c6ad7a38989637cf09b138a65a))


### Bug Fixes

* ensure attachment are only counted if they have urls with consumer type GUI ([18a7600](https://github.com/digdir/dialogporten-frontend/commit/18a7600d9fe64f62a57f47691a3a9b4708d96ed1))
* remove deprecated relatedActivityId ([046b2af](https://github.com/digdir/dialogporten-frontend/commit/046b2afd64b2ce933fedae64bb3572d8858acc81))

## [1.4.0](https://github.com/digdir/dialogporten-frontend/compare/v1.3.1...v1.4.0) (2024-10-07)


### Features

* add support for listing dialogs as archived or in bin and move dialogs to bin or archive ([5d4d667](https://github.com/digdir/dialogporten-frontend/commit/5d4d66707a625aaa8bdcfb9a96d16994f984407e))
* Organizations now being fetched in BFF and stored in Redis ([7c784b3](https://github.com/digdir/dialogporten-frontend/commit/7c784b381dd9c1eb4698805c05aecb18160ec3fd))


### Bug Fixes

* Updated according to PR comments ([accd02a](https://github.com/digdir/dialogporten-frontend/commit/accd02a1e6ddf47be898ee5ea7aaf19204f0941b))

## [1.3.1](https://github.com/digdir/dialogporten-frontend/compare/v1.3.0...v1.3.1) (2024-10-04)


### Bug Fixes

* fixes auth issues in bff ([e809b86](https://github.com/digdir/dialogporten-frontend/commit/e809b8681a3c30be35607941223fa1a2aaec9986))

## [1.3.0](https://github.com/digdir/dialogporten-frontend/compare/v1.2.0...v1.3.0) (2024-10-03)


### Features

* Party now stored in URL as query param for organizations ([c2afe7a](https://github.com/digdir/dialogporten-frontend/commit/c2afe7a8e4707b2026a5108ed6cf78208271d698))


### Bug Fixes

* adds missing sub parties to partylist ([2560750](https://github.com/digdir/dialogporten-frontend/commit/2560750baffbc159e00694547b16602bb48ae249))
* improvements to auth / refresh flow ([076d7d6](https://github.com/digdir/dialogporten-frontend/commit/076d7d656ed66502caabffbeeae8b1b16e8ce813))

## [1.2.0](https://github.com/digdir/dialogporten-frontend/compare/v1.1.1...v1.2.0) (2024-10-01)


### Features

* add dialog token as headers for graphql subscription on dialogEvents ([d5379fd](https://github.com/digdir/dialogporten-frontend/commit/d5379fd6754d544b49607e9fbc97d868af5ac4f3))
* **frontend:** enable application insights ([#1177](https://github.com/digdir/dialogporten-frontend/issues/1177)) ([f8d47ea](https://github.com/digdir/dialogporten-frontend/commit/f8d47ea2c8ce4d6fd71d0eb689d079f70df2b74d))
* refactor context menu for button actions for saved searches ([93668eb](https://github.com/digdir/dialogporten-frontend/commit/93668ebe2e29e447b6c4023bfe2e124650575447))


### Bug Fixes

* **frontend:** avoid instrumenting application insights if bad key ([#1195](https://github.com/digdir/dialogporten-frontend/issues/1195)) ([558aaab](https://github.com/digdir/dialogporten-frontend/commit/558aaab53ef7257b85842e73b5d5b068b2d8ed82))

## [1.1.1](https://github.com/digdir/dialogporten-frontend/compare/v1.1.0...v1.1.1) (2024-09-27)


### Bug Fixes

* add padding for 404 dialog not found fallback ([3cd4ebe](https://github.com/digdir/dialogporten-frontend/commit/3cd4ebe6573b2a27008c1ade15660285c4c6d1eb))
* Global menu bar bug on mobile using Safari ([35c48d3](https://github.com/digdir/dialogporten-frontend/commit/35c48d3c18e0de88dacc77cdc560a2b718d1ec43))
* incorrect casing on svg attributes ([cfd6b1e](https://github.com/digdir/dialogporten-frontend/commit/cfd6b1eaa9889493fc551371310740492587cc34))
* redesign meta field and status fields ([6ba8ac7](https://github.com/digdir/dialogporten-frontend/commit/6ba8ac730e534b6f9bf6ebb3635c810c80f65e0e))

## [1.1.0](https://github.com/digdir/dialogporten-frontend/compare/v1.0.2...v1.1.0) (2024-09-26)


### Features

* Summary field now has maximum two lines, overflow will be cut with ellipsis ([5f1f507](https://github.com/digdir/dialogporten-frontend/commit/5f1f507c33b97c464f14afbb62fcda59a8341671))


### Bug Fixes

* align elements in inbox details ([424256b](https://github.com/digdir/dialogporten-frontend/commit/424256b8f3908b0d175c2f76bf527c23c48face9))
* Filter label names ([135b22f](https://github.com/digdir/dialogporten-frontend/commit/135b22f8088862f87773168493eef8cbbd540071))
* Seen by bug ([ea2079d](https://github.com/digdir/dialogporten-frontend/commit/ea2079d8cca2a409ba56bc206ff390edba2ce9f7))

## [1.0.2](https://github.com/digdir/dialogporten-frontend/compare/v1.0.1...v1.0.2) (2024-09-26)


### Bug Fixes

* change format for date and display updated date instead of create date ([36414fa](https://github.com/digdir/dialogporten-frontend/commit/36414fae59eb55fa4a72bdd2b76e6f9297ab4b7a))
* font-weight for title in InboxItem, differing between read and unread ([4b15a56](https://github.com/digdir/dialogporten-frontend/commit/4b15a5620c4652a2a69529c7465ce09b4abe9488))
* merge to a single group of inbox items in for the viewtypes draft and sent ([f4587b8](https://github.com/digdir/dialogporten-frontend/commit/f4587b8f7640c639e31d1cfd6b5befba03f776c3))
* remove section header for activities and attachments if respective lists are empty ([d7cd488](https://github.com/digdir/dialogporten-frontend/commit/d7cd488df913b0ddb8c43a5538559002c62253f4))
* selected parties being nuked and improvements to app cache ([f02b818](https://github.com/digdir/dialogporten-frontend/commit/f02b8188237f567b45e234f39fa5e594679b4059))
* Unread status for search results ([0fc465a](https://github.com/digdir/dialogporten-frontend/commit/0fc465ad1ebe24e1cb9721864b7a81f7ecb2696e))
* use correct profile for avatar as sender in Inbox item detail page ([05ce083](https://github.com/digdir/dialogporten-frontend/commit/05ce0834736fe1cb40d0e6e1b97a6c074071be63))

## [1.0.1](https://github.com/digdir/dialogporten-frontend/compare/v1.0.0...v1.0.1) (2024-09-25)


### Bug Fixes

* Seen logic now works as expected ([ffa5265](https://github.com/digdir/dialogporten-frontend/commit/ffa52651e82e3b5b205fdfa9fdba8f28d739a2c5))
