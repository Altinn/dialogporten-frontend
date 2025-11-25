# Changelog

## [1.105.0](https://github.com/Altinn/dialogporten-frontend/compare/v1.104.1...v1.105.0) (2025-11-25)


### Features

* **infra:** enable HA for app gateway in production ([#3320](https://github.com/Altinn/dialogporten-frontend/issues/3320)) ([d8e8f26](https://github.com/Altinn/dialogporten-frontend/commit/d8e8f2696b33c9ac2b64773f8f95698ce030846f))


### Bug Fixes

* Showing read migrated A2 messages as read ([0c1e519](https://github.com/Altinn/dialogporten-frontend/commit/0c1e519502b19ddbe55d831733f09d4b3b958a31))

## [1.104.1](https://github.com/Altinn/dialogporten-frontend/compare/v1.104.0...v1.104.1) (2025-11-25)


### Bug Fixes

* Bump AC v0.48.3 - AccountList virtualized global menu overlap fix ([#3314](https://github.com/Altinn/dialogporten-frontend/issues/3314)) ([9f04fd1](https://github.com/Altinn/dialogporten-frontend/commit/9f04fd1dd1d956fbfacbe5fa69f35a734ee5797e))
* **ci:** deployment lag monitor ([#3308](https://github.com/Altinn/dialogporten-frontend/issues/3308)) ([d5f0320](https://github.com/Altinn/dialogporten-frontend/commit/d5f032027eeef85825fc482b5ca21735b7cfcf17))
* **frontend:** ensure enough ajax calls are tracked per session ([#3290](https://github.com/Altinn/dialogporten-frontend/issues/3290)) ([d645a06](https://github.com/Altinn/dialogporten-frontend/commit/d645a0640aba20e72c85504c54066ccf1e4bb0ed))
* Welcome modal navigation, link to help in floating dropdown ([#3312](https://github.com/Altinn/dialogporten-frontend/issues/3312)) ([2e0d4af](https://github.com/Altinn/dialogporten-frontend/commit/2e0d4afa76df9e07297a92741cc25bed812bea8b))

## [1.104.0](https://github.com/Altinn/dialogporten-frontend/compare/v1.103.1...v1.104.0) (2025-11-25)


### Features

* Bump AC v0.48 - virtualized profile list ([#3305](https://github.com/Altinn/dialogporten-frontend/issues/3305)) ([cbd9c18](https://github.com/Altinn/dialogporten-frontend/commit/cbd9c18a64d8f98a203cbba85d8742ee24758a92))

## [1.103.1](https://github.com/Altinn/dialogporten-frontend/compare/v1.103.0...v1.103.1) (2025-11-24)


### Bug Fixes

* Altinn 2 active elements notification now behind feature flag ([9ffa2bc](https://github.com/Altinn/dialogporten-frontend/commit/9ffa2bca511a987eba563011176e3fa5a9f9858f))
* **fce:** connectivity problems or idle time unneccessary unmounts FCE content ([#3301](https://github.com/Altinn/dialogporten-frontend/issues/3301)) ([32967fe](https://github.com/Altinn/dialogporten-frontend/commit/32967fe44e71ac884e1d8f723f2e757f0cc11ba2))
* **routing:** ensure AltinnPartyId cookie updates when navigating from inbox to app ([#3302](https://github.com/Altinn/dialogporten-frontend/issues/3302)) ([a45151b](https://github.com/Altinn/dialogporten-frontend/commit/a45151b8f08f58e70ecdbddc2378e3e2ec5b29fe))
* Texts ([97dacfc](https://github.com/Altinn/dialogporten-frontend/commit/97dacfcb28487408b087a09eef27804546f88fee))

## [1.103.0](https://github.com/Altinn/dialogporten-frontend/compare/v1.102.4...v1.103.0) (2025-11-24)


### Features

* always display all organizations option from 2 or more orgs ([#3277](https://github.com/Altinn/dialogporten-frontend/issues/3277)) ([adf38f8](https://github.com/Altinn/dialogporten-frontend/commit/adf38f880220dd635c5a5ec31a3b3ab11208944b))
* New welcome modal, design and functionality ([#3281](https://github.com/Altinn/dialogporten-frontend/issues/3281)) ([5f04d02](https://github.com/Altinn/dialogporten-frontend/commit/5f04d02559ba9e05d1e24cb675455f3d13d42eb9))


### Bug Fixes

* Align left global menu beta label ([#3288](https://github.com/Altinn/dialogporten-frontend/issues/3288)) ([590611d](https://github.com/Altinn/dialogporten-frontend/commit/590611dca41f695cff24118fd0208ac24f4c275c))
* avoid redudant profile calls on every page load ([#3294](https://github.com/Altinn/dialogporten-frontend/issues/3294)) ([fce0d82](https://github.com/Altinn/dialogporten-frontend/commit/fce0d82120f7a7949b1b97faf9add57b6cda06c0))
* bump ac to 0.47.5 ([#3295](https://github.com/Altinn/dialogporten-frontend/issues/3295)) ([6894e0d](https://github.com/Altinn/dialogporten-frontend/commit/6894e0dddd056ddd45c604b88067ffa96e930533))
* **frontend:** improve security in nginx and ensure security policies do not break features ([#3285](https://github.com/Altinn/dialogporten-frontend/issues/3285)) ([2cab476](https://github.com/Altinn/dialogporten-frontend/commit/2cab4763f466e4789c47ca9bd720576eb314dbca))
* **frontend:** revert improve security in nginx ([20f07f2](https://github.com/Altinn/dialogporten-frontend/commit/20f07f2038d101ce1f900352489aa77564b08f5c))
* Notifications from A2 now showing the chosen party's data ([e34fe20](https://github.com/Altinn/dialogporten-frontend/commit/e34fe20dce2a25ab4341c5dd3d11db32b9cf79ff))
* support feature toggle for dialogs count ([#3291](https://github.com/Altinn/dialogporten-frontend/issues/3291)) ([bb686a7](https://github.com/Altinn/dialogporten-frontend/commit/bb686a7e9d9d2912198e6dd3bb6ff5f33a0f2fd7))

## [1.102.4](https://github.com/Altinn/dialogporten-frontend/compare/v1.102.3...v1.102.4) (2025-11-21)


### Bug Fixes

* **frontend:** add security headers ([#3238](https://github.com/Altinn/dialogporten-frontend/issues/3238)) ([b23970b](https://github.com/Altinn/dialogporten-frontend/commit/b23970bb407f8d8573be20de3b4ccffb17bab8b1))
* **frontend:** revert security changes ([2766091](https://github.com/Altinn/dialogporten-frontend/commit/2766091d8a4f60dd6094882181454253f4d1fbcc))
* **infra:** disable HA for app gateway in prod ([eb18199](https://github.com/Altinn/dialogporten-frontend/commit/eb18199a1d6ecf09d9a7b8c6d2ca85f468a004b1))

## [1.102.3](https://github.com/Altinn/dialogporten-frontend/compare/v1.102.2...v1.102.3) (2025-11-21)


### Bug Fixes

* Altinn 2 active elements notification showing correctly ([7ae878c](https://github.com/Altinn/dialogporten-frontend/commit/7ae878c08a551a7af58d3913ce28e0627bdff420))
* **frontend:** filter out 401 issues ([#3282](https://github.com/Altinn/dialogporten-frontend/issues/3282)) ([09c91ab](https://github.com/Altinn/dialogporten-frontend/commit/09c91ab80c6e911bc719e93f11d6e10d1609dc22))

## [1.102.2](https://github.com/Altinn/dialogporten-frontend/compare/v1.102.1...v1.102.2) (2025-11-20)


### Bug Fixes

* **infra:** avoid duplicate zonal IPs ([a992985](https://github.com/Altinn/dialogporten-frontend/commit/a992985a6fb4147beee8340399b0d9836094f09a))

## [1.102.1](https://github.com/Altinn/dialogporten-frontend/compare/v1.102.0...v1.102.1) (2025-11-20)


### Bug Fixes

* **infra:** add zonal public ip for app gateway ([#3263](https://github.com/Altinn/dialogporten-frontend/issues/3263)) ([deb8fe6](https://github.com/Altinn/dialogporten-frontend/commit/deb8fe6b2c149b38bcb9653886c836cce90d5e53))

## [1.102.0](https://github.com/Altinn/dialogporten-frontend/compare/v1.101.0...v1.102.0) (2025-11-20)


### Features

* **apps:** add resources and move apps to dedicated profile ([#3272](https://github.com/Altinn/dialogporten-frontend/issues/3272)) ([1429e7b](https://github.com/Altinn/dialogporten-frontend/commit/1429e7b9a1601da66b897749716f1af47da8599c))

## [1.101.0](https://github.com/Altinn/dialogporten-frontend/compare/v1.100.3...v1.101.0) (2025-11-20)


### Features

* **infra:** add dedicated workload profile types to yt01 and prod ([#3271](https://github.com/Altinn/dialogporten-frontend/issues/3271)) ([66c9f21](https://github.com/Altinn/dialogporten-frontend/commit/66c9f2199f471d6381b8423cbc44004359c639c9))


### Bug Fixes

* Altinn 2 showing other than skjema messages ([b960353](https://github.com/Altinn/dialogporten-frontend/commit/b9603532b8930023b20134e851a8245918f0874e))
* revert Altinn 2 showing other than skjema messages ([3dc5eb2](https://github.com/Altinn/dialogporten-frontend/commit/3dc5eb224527e3ec7c0273a6cc7135c482e6d82c))

## [1.100.3](https://github.com/Altinn/dialogporten-frontend/compare/v1.100.2...v1.100.3) (2025-11-20)


### Bug Fixes

* **infra:** test zonal public ip addresses ([#3264](https://github.com/Altinn/dialogporten-frontend/issues/3264)) ([e73226d](https://github.com/Altinn/dialogporten-frontend/commit/e73226d58c82bfc32b204d9bc41074dd23fa1766))

## [1.100.2](https://github.com/Altinn/dialogporten-frontend/compare/v1.100.1...v1.100.2) (2025-11-19)


### Bug Fixes

* **infra:** remove zones from application gateway in staging ([#3259](https://github.com/Altinn/dialogporten-frontend/issues/3259)) ([9708c50](https://github.com/Altinn/dialogporten-frontend/commit/9708c50c8c891846504937eae3fab09ad76343e9))

## [1.100.1](https://github.com/Altinn/dialogporten-frontend/compare/v1.100.0...v1.100.1) (2025-11-19)


### Bug Fixes

* always load feature flag first ([#3258](https://github.com/Altinn/dialogporten-frontend/issues/3258)) ([2c9cf1c](https://github.com/Altinn/dialogporten-frontend/commit/2c9cf1c05a36c3dbc39997d93a192f930771a91c))
* do not encode ul value in altinnPersistentContext for A2 compabilities ([#3256](https://github.com/Altinn/dialogporten-frontend/issues/3256)) ([9d7561c](https://github.com/Altinn/dialogporten-frontend/commit/9d7561c96d5badd95fcdbbd1759bc4d70d868816))

## [1.100.0](https://github.com/Altinn/dialogporten-frontend/compare/v1.99.0...v1.100.0) (2025-11-19)


### Features

* Update GlobalMenu with new design ref and links ([#3254](https://github.com/Altinn/dialogporten-frontend/issues/3254)) ([dc45c79](https://github.com/Altinn/dialogporten-frontend/commit/dc45c79bbf36624663daa9976f1d20071f584541))


### Bug Fixes

* 4xx errors against correspondence and graphql ([#3253](https://github.com/Altinn/dialogporten-frontend/issues/3253)) ([2309462](https://github.com/Altinn/dialogporten-frontend/commit/2309462e72c3535f51696a058eacbc2f8b2ce77b))
* **ci:** ensure deployment lag monitor doesnt fail on long msgs ([#3250](https://github.com/Altinn/dialogporten-frontend/issues/3250)) ([32ecae4](https://github.com/Altinn/dialogporten-frontend/commit/32ecae48ce2b3086090f878d0de12749a0453fcb))

## [1.99.0](https://github.com/Altinn/dialogporten-frontend/compare/v1.98.9...v1.99.0) (2025-11-19)


### Features

* add support for self-identified user with warning that will not be able to have any content atm ([#3239](https://github.com/Altinn/dialogporten-frontend/issues/3239)) ([ecd4f61](https://github.com/Altinn/dialogporten-frontend/commit/ecd4f61094468c70ea135d5ed95e895dad0e3e60))


### Bug Fixes

* Global menu updates ([35924ce](https://github.com/Altinn/dialogporten-frontend/commit/35924ce3b4f26cf524328e4247ed8c4332968a31))

## [1.98.9](https://github.com/Altinn/dialogporten-frontend/compare/v1.98.8...v1.98.9) (2025-11-18)


### Bug Fixes

* **ci:** ensure deployment success message is run ([#3243](https://github.com/Altinn/dialogporten-frontend/issues/3243)) ([a6929ca](https://github.com/Altinn/dialogporten-frontend/commit/a6929ca3a03157b156043d00d16512e583f02e50))

## [1.98.8](https://github.com/Altinn/dialogporten-frontend/compare/v1.98.7...v1.98.8) (2025-11-18)


### Bug Fixes

* oidc url in yt01 ([#3241](https://github.com/Altinn/dialogporten-frontend/issues/3241)) ([30f4b9b](https://github.com/Altinn/dialogporten-frontend/commit/30f4b9bdd2d1720b73df7810b30b3a2cb5f6079d))

## [1.98.7](https://github.com/Altinn/dialogporten-frontend/compare/v1.98.6...v1.98.7) (2025-11-18)


### Bug Fixes

* enable new oidc in yt01 ([#3240](https://github.com/Altinn/dialogporten-frontend/issues/3240)) ([919a589](https://github.com/Altinn/dialogporten-frontend/commit/919a5896e1154752b8064c5e3ca9ea867e165cc2))
* Update E2E_BASE_URL ([#3236](https://github.com/Altinn/dialogporten-frontend/issues/3236)) ([e582afa](https://github.com/Altinn/dialogporten-frontend/commit/e582afa97238f89bc89e4d23006430ae64e7d705))

## [1.98.6](https://github.com/Altinn/dialogporten-frontend/compare/v1.98.5...v1.98.6) (2025-11-18)


### Bug Fixes

* E2e tests, global menu enabled ([#3234](https://github.com/Altinn/dialogporten-frontend/issues/3234)) ([96be6f9](https://github.com/Altinn/dialogporten-frontend/commit/96be6f958ac1392b6c3400aa928557429bf82f5b))
* update locale for link for infoportal new schema ([#3232](https://github.com/Altinn/dialogporten-frontend/issues/3232)) ([330bc10](https://github.com/Altinn/dialogporten-frontend/commit/330bc10bd58c27f8a7489aa342165c3ca52e9f81))

## [1.98.5](https://github.com/Altinn/dialogporten-frontend/compare/v1.98.4...v1.98.5) (2025-11-17)


### Bug Fixes

* **node-logger:** ensure correct node-version and npm version ([#3229](https://github.com/Altinn/dialogporten-frontend/issues/3229)) ([39b2556](https://github.com/Altinn/dialogporten-frontend/commit/39b2556a28509b22c5c11ddc4a3989af9bd35bfd))

## [1.98.4](https://github.com/Altinn/dialogporten-frontend/compare/v1.98.3...v1.98.4) (2025-11-17)


### Bug Fixes

* **infra:** fix compile issue for altinn2baseurl ([#3227](https://github.com/Altinn/dialogporten-frontend/issues/3227)) ([d13021c](https://github.com/Altinn/dialogporten-frontend/commit/d13021cce5f9aa605196b116c75bcf3dc69d92a2))

## [1.98.3](https://github.com/Altinn/dialogporten-frontend/compare/v1.98.2...v1.98.3) (2025-11-17)


### Bug Fixes

* **infra:** add redirect from tt to tt02 ([#3223](https://github.com/Altinn/dialogporten-frontend/issues/3223)) ([7f13e99](https://github.com/Altinn/dialogporten-frontend/commit/7f13e992f157c3757e8828515999446602d54a25))

## [1.98.2](https://github.com/Altinn/dialogporten-frontend/compare/v1.98.1...v1.98.2) (2025-11-17)


### Bug Fixes

* Update info portal links with language ([#3224](https://github.com/Altinn/dialogporten-frontend/issues/3224)) ([8e9c11c](https://github.com/Altinn/dialogporten-frontend/commit/8e9c11cc4ca0155d2c53726bd178cefdc30e19ce))

## [1.98.1](https://github.com/Altinn/dialogporten-frontend/compare/v1.98.0...v1.98.1) (2025-11-17)


### Bug Fixes

* Set correct theme colors in inbox ([#3217](https://github.com/Altinn/dialogporten-frontend/issues/3217)) ([deff209](https://github.com/Altinn/dialogporten-frontend/commit/deff20968de96380d4ee938f077d9d90d9337919))

## [1.98.0](https://github.com/Altinn/dialogporten-frontend/compare/v1.97.1...v1.98.0) (2025-11-17)


### Features

* Old inbox active elements notification ([d741928](https://github.com/Altinn/dialogporten-frontend/commit/d741928c1392ed90c1c169b780d9383f85c92260))


### Bug Fixes

* bump ac which includes improvements to header ([#3219](https://github.com/Altinn/dialogporten-frontend/issues/3219)) ([486d879](https://github.com/Altinn/dialogporten-frontend/commit/486d879caba009989f8f9d9fcc3bc3d929d765df))
* cookie overriding local preferred language ([#3207](https://github.com/Altinn/dialogporten-frontend/issues/3207)) ([2f873b3](https://github.com/Altinn/dialogporten-frontend/commit/2f873b37fde1fb5927e73e9d6d7f9f98cfa1d7ad))
* remove search for inbox from profile ([#3208](https://github.com/Altinn/dialogporten-frontend/issues/3208)) ([7897843](https://github.com/Altinn/dialogporten-frontend/commit/7897843f23f57306350144c9946e4ea83cb528e9))
* Update environment in footer links ([#3215](https://github.com/Altinn/dialogporten-frontend/issues/3215)) ([b4a7ea1](https://github.com/Altinn/dialogporten-frontend/commit/b4a7ea1130434d862483a70324288a34a4238322))
* update icon for access management ui link ([#3209](https://github.com/Altinn/dialogporten-frontend/issues/3209)) ([96af093](https://github.com/Altinn/dialogporten-frontend/commit/96af093d28cc9a5c35a5e0e79042441f88b10e8c))

## [1.97.1](https://github.com/Altinn/dialogporten-frontend/compare/v1.97.0...v1.97.1) (2025-11-14)


### Bug Fixes

* Update AC with virtualized account menu fix ([#3199](https://github.com/Altinn/dialogporten-frontend/issues/3199)) ([239eba3](https://github.com/Altinn/dialogporten-frontend/commit/239eba3f3369c13bea24b708ea8ec60e966595b5))

## [1.97.0](https://github.com/Altinn/dialogporten-frontend/compare/v1.96.7...v1.97.0) (2025-11-14)


### Features

* ensure party is forwarded on linking to external routes ([#3193](https://github.com/Altinn/dialogporten-frontend/issues/3193)) ([e00b104](https://github.com/Altinn/dialogporten-frontend/commit/e00b104a6222cddcc30408d11b028cf8a2a9df86))


### Bug Fixes

* encoding for ul value in altinnPersistentContext ([#3196](https://github.com/Altinn/dialogporten-frontend/issues/3196)) ([bde28ac](https://github.com/Altinn/dialogporten-frontend/commit/bde28ac11cd86d2505b2d38222b35ba7eff68043))
* Fix for 'Cannot write headers after they are sent to the client' error ([859236e](https://github.com/Altinn/dialogporten-frontend/commit/859236e1f5c09d95184902522cb47256d61bd7ed))
* Profile texts ([#3152](https://github.com/Altinn/dialogporten-frontend/issues/3152)) ([6f763b2](https://github.com/Altinn/dialogporten-frontend/commit/6f763b2331bff21579ceb55e21bb6785d7ac3437))

## [1.96.7](https://github.com/Altinn/dialogporten-frontend/compare/v1.96.6...v1.96.7) (2025-11-13)


### Bug Fixes

* **infra:** add support for several hosts ([#3186](https://github.com/Altinn/dialogporten-frontend/issues/3186)) ([dc6c15e](https://github.com/Altinn/dialogporten-frontend/commit/dc6c15e0d73b2efd661377040f8823639d2936c5))
* **infra:** naming length issue ([#3188](https://github.com/Altinn/dialogporten-frontend/issues/3188)) ([f1db0b6](https://github.com/Altinn/dialogporten-frontend/commit/f1db0b64d2e68376ec00d7afbc283cb995a790db))

## [1.96.6](https://github.com/Altinn/dialogporten-frontend/compare/v1.96.5...v1.96.6) (2025-11-13)


### Bug Fixes

* revert back to tt ([#3183](https://github.com/Altinn/dialogporten-frontend/issues/3183)) ([02a3d3e](https://github.com/Altinn/dialogporten-frontend/commit/02a3d3e6cd2f9d38b3c50f181e33546f4b3d83a4))
* Set correct account cookie after selecting account ([#3184](https://github.com/Altinn/dialogporten-frontend/issues/3184)) ([c0b12b1](https://github.com/Altinn/dialogporten-frontend/commit/c0b12b136afff9604315fbcecd2bd34aa9c022cc))

## [1.96.5](https://github.com/Altinn/dialogporten-frontend/compare/v1.96.4...v1.96.5) (2025-11-13)


### Bug Fixes

* check for new links form ([#3180](https://github.com/Altinn/dialogporten-frontend/issues/3180)) ([139624b](https://github.com/Altinn/dialogporten-frontend/commit/139624bd0b43afb99f56b93f26d60b0af8b4b8a3))
* Improved rules for validation of email addresses ([e97990d](https://github.com/Altinn/dialogporten-frontend/commit/e97990d7b29bf1554691e6e6b6ade92adddd1204))

## [1.96.4](https://github.com/Altinn/dialogporten-frontend/compare/v1.96.3...v1.96.4) (2025-11-12)


### Bug Fixes

* Saved Searches title position fix ([#3178](https://github.com/Altinn/dialogporten-frontend/issues/3178)) ([5c2b382](https://github.com/Altinn/dialogporten-frontend/commit/5c2b382ce6f4afdd4374ccff562c7154f7f9e623))

## [1.96.3](https://github.com/Altinn/dialogporten-frontend/compare/v1.96.2...v1.96.3) (2025-11-12)


### Bug Fixes

* Bumb AC containing fixes for saved search and searchbar ([#3176](https://github.com/Altinn/dialogporten-frontend/issues/3176)) ([87039f7](https://github.com/Altinn/dialogporten-frontend/commit/87039f71d69a1b52b224e919c18a32cf400ff71c))
* form links after new domain in at and tt ([#3175](https://github.com/Altinn/dialogporten-frontend/issues/3175)) ([2546381](https://github.com/Altinn/dialogporten-frontend/commit/2546381efd4915efdb732bba466afc1db702b296))

## [1.96.2](https://github.com/Altinn/dialogporten-frontend/compare/v1.96.1...v1.96.2) (2025-11-12)


### Bug Fixes

* ensure links to access am ui are env aware ([#3173](https://github.com/Altinn/dialogporten-frontend/issues/3173)) ([816307d](https://github.com/Altinn/dialogporten-frontend/commit/816307d9f636d2bb2fe2afc1a658b602cdeb02f1))
* hydrate preferred language in cookie if cookie is not set ([#3172](https://github.com/Altinn/dialogporten-frontend/issues/3172)) ([9cc8ef6](https://github.com/Altinn/dialogporten-frontend/commit/9cc8ef681a2573d92e2f5237d5634e91bfa815b9))

## [1.96.1](https://github.com/Altinn/dialogporten-frontend/compare/v1.96.0...v1.96.1) (2025-11-12)


### Bug Fixes

* **bff:** fix hostname for staging ([#3171](https://github.com/Altinn/dialogporten-frontend/issues/3171)) ([ac82a55](https://github.com/Altinn/dialogporten-frontend/commit/ac82a55daf65e0cc5ba3813e8ec764a4c1d3ba6f))
* update condition for correct links now that af has changed host in at and tt ([#3169](https://github.com/Altinn/dialogporten-frontend/issues/3169)) ([16a80fe](https://github.com/Altinn/dialogporten-frontend/commit/16a80fe2304bcbaf0b28fbc88b5a30a5274794b2))

## [1.96.0](https://github.com/Altinn/dialogporten-frontend/compare/v1.95.2...v1.96.0) (2025-11-12)


### Features

* activate new oid in staging ([#3167](https://github.com/Altinn/dialogporten-frontend/issues/3167)) ([1e8968d](https://github.com/Altinn/dialogporten-frontend/commit/1e8968dca813426076a7fa7b163375cce3e7a577))


### Bug Fixes

* change host names for environments ([#3165](https://github.com/Altinn/dialogporten-frontend/issues/3165)) ([f2b6d33](https://github.com/Altinn/dialogporten-frontend/commit/f2b6d331d3b76a323ff57f8a7b712a7218dcf9b2))

## [1.95.2](https://github.com/Altinn/dialogporten-frontend/compare/v1.95.1...v1.95.2) (2025-11-11)


### Bug Fixes

* ensure correct name order for name for profile landing page ([#3154](https://github.com/Altinn/dialogporten-frontend/issues/3154)) ([ab6446f](https://github.com/Altinn/dialogporten-frontend/commit/ab6446fd6e6965a46744022daf32107af4e944f0))
* fallback to sub for self-identified users without pid ([#3156](https://github.com/Altinn/dialogporten-frontend/issues/3156)) ([4598964](https://github.com/Altinn/dialogporten-frontend/commit/4598964731a18aebd616ef279cf95a9930379283))
* Fix data parties data structure for Global Header ([#3150](https://github.com/Altinn/dialogporten-frontend/issues/3150)) ([34124cd](https://github.com/Altinn/dialogporten-frontend/commit/34124cdec6713578214f2dad9858f505c5016838))
* Fix global search routing ([#3135](https://github.com/Altinn/dialogporten-frontend/issues/3135)) ([2768dff](https://github.com/Altinn/dialogporten-frontend/commit/2768dffa74266198e2093d85e3575c78a7019174))
* Fix GlobalHeader inconsistencies across apps ([#3138](https://github.com/Altinn/dialogporten-frontend/issues/3138)) ([09a37bb](https://github.com/Altinn/dialogporten-frontend/commit/09a37bb5eb31abf1296fbce25ae1fc251c8738ca))
* Ignore benign ReizeObserver errors ([c10f7c7](https://github.com/Altinn/dialogporten-frontend/commit/c10f7c70298408ef12069b8e0b9991653c9e14d6))
* Map GlobalHeader properties, fix styling ([#3133](https://github.com/Altinn/dialogporten-frontend/issues/3133)) ([4cb8f39](https://github.com/Altinn/dialogporten-frontend/commit/4cb8f39763dd14c5ff0021240794200382617fe5))
* Map inbox color to match global header, fix icon sizes ([#3157](https://github.com/Altinn/dialogporten-frontend/issues/3157)) ([e719fcd](https://github.com/Altinn/dialogporten-frontend/commit/e719fcd14cd5d8c993fb85c11e0d55d4ecf7de0e))
* Now using secure cookies and blocks framing attempts ([778726d](https://github.com/Altinn/dialogporten-frontend/commit/778726dd08210cc6bc6fc9821b1b14fa0ad5e9c4))
* Sidebar links ([6010c5f](https://github.com/Altinn/dialogporten-frontend/commit/6010c5f9dea0a446db79bb3ef8d34c76d89ae2a2))

## [1.95.1](https://github.com/Altinn/dialogporten-frontend/compare/v1.95.0...v1.95.1) (2025-11-07)


### Bug Fixes

* env variables for cookie domain ([#3126](https://github.com/Altinn/dialogporten-frontend/issues/3126)) ([acd3af3](https://github.com/Altinn/dialogporten-frontend/commit/acd3af33965a2cdc1867ad146cece69e6c05e006))

## [1.95.0](https://github.com/Altinn/dialogporten-frontend/compare/v1.94.1...v1.95.0) (2025-11-07)


### Features

* read language and write to altinnPersistentContext on language change ([#3121](https://github.com/Altinn/dialogporten-frontend/issues/3121)) ([e36bb5e](https://github.com/Altinn/dialogporten-frontend/commit/e36bb5ecb91fb11d34c194100315f25dfe3f7315))


### Bug Fixes

* improvements to parties overview filter ([#3124](https://github.com/Altinn/dialogporten-frontend/issues/3124)) ([5656dc6](https://github.com/Altinn/dialogporten-frontend/commit/5656dc6147e3d79843f3f3ab2288528a53a84fe0))
* Inbox search not visible with global header ([#3120](https://github.com/Altinn/dialogporten-frontend/issues/3120)) ([ad00089](https://github.com/Altinn/dialogporten-frontend/commit/ad00089154cfa839c5f848f566e4002c806495c2))
* remove same-site strict in altinn context cookie ([#3125](https://github.com/Altinn/dialogporten-frontend/issues/3125)) ([52f646c](https://github.com/Altinn/dialogporten-frontend/commit/52f646c9946ad0d096060b065705fc73c0144ecb))

## [1.94.1](https://github.com/Altinn/dialogporten-frontend/compare/v1.94.0...v1.94.1) (2025-11-06)


### Bug Fixes

* **bff:** change URL for graphql subscriptions ([#3089](https://github.com/Altinn/dialogporten-frontend/issues/3089)) ([b829bcb](https://github.com/Altinn/dialogporten-frontend/commit/b829bcb687e9270e2874c2c5c337323c5e166125))
* include only sub parties with same name for fetching dialogs ([#3112](https://github.com/Altinn/dialogporten-frontend/issues/3112)) ([845d1a9](https://github.com/Altinn/dialogporten-frontend/commit/845d1a94938048cf4eb1d57addd01d1d7d3c9f87))

## [1.94.0](https://github.com/Altinn/dialogporten-frontend/compare/v1.93.1...v1.94.0) (2025-11-05)


### Features

* Enable Global Menu in AF ([#3101](https://github.com/Altinn/dialogporten-frontend/issues/3101)) ([05db726](https://github.com/Altinn/dialogporten-frontend/commit/05db7263a8a30ece6e6590aaf4104bad08f775fb))
* support new altinn oidc ([#3095](https://github.com/Altinn/dialogporten-frontend/issues/3095)) ([ed912f8](https://github.com/Altinn/dialogporten-frontend/commit/ed912f801bd96f8b1317348840364fd5fb78ae61))


### Bug Fixes

* **bff:** ensure secrets for oidc are stored as secrets ([#3111](https://github.com/Altinn/dialogporten-frontend/issues/3111)) ([e42a47a](https://github.com/Altinn/dialogporten-frontend/commit/e42a47aa1adffb862aa12b2a6f4efdaf85d24ca7))
* Fix e2e after savedSearches changes ([#3104](https://github.com/Altinn/dialogporten-frontend/issues/3104)) ([41f6d0b](https://github.com/Altinn/dialogporten-frontend/commit/41f6d0b0413e5e93b6c537a5cd84a00576bdf96a))
* **node-logger:** move package to [@altinn](https://github.com/altinn) and enable trusted publishers ([#3084](https://github.com/Altinn/dialogporten-frontend/issues/3084)) ([4d2a773](https://github.com/Altinn/dialogporten-frontend/commit/4d2a77381d3281b74c6d2004ca63deba5567e24b))

## [1.93.1](https://github.com/Altinn/dialogporten-frontend/compare/v1.93.0...v1.93.1) (2025-11-04)


### Bug Fixes

* disappearing search from account menu ([#3102](https://github.com/Altinn/dialogporten-frontend/issues/3102)) ([93bf892](https://github.com/Altinn/dialogporten-frontend/commit/93bf89207bcf6e79a59a58473ac4146a8a747bd9))

## [1.93.0](https://github.com/Altinn/dialogporten-frontend/compare/v1.92.2...v1.93.0) (2025-11-04)


### Features

* Replace BookmarksSection with BookmarksSettingsList ([#3093](https://github.com/Altinn/dialogporten-frontend/issues/3093)) ([77e159f](https://github.com/Altinn/dialogporten-frontend/commit/77e159f535e92fc280c188b146ded20c81919056))


### Bug Fixes

* Double gui action issue ([c91f2b7](https://github.com/Altinn/dialogporten-frontend/commit/c91f2b73691752096508ec649fb8048cfce6ba8e))

## [1.92.2](https://github.com/Altinn/dialogporten-frontend/compare/v1.92.1...v1.92.2) (2025-11-03)


### Bug Fixes

* Gui button now disables while waiting for subscription event ([e801c9f](https://github.com/Altinn/dialogporten-frontend/commit/e801c9f1aad8d5d650c2bf43959c2b81913c9cab))

## [1.92.1](https://github.com/Altinn/dialogporten-frontend/compare/v1.92.0...v1.92.1) (2025-11-03)


### Bug Fixes

* Fix for the 'Cannot write headers after they are sent to the client' error ([bb0c05c](https://github.com/Altinn/dialogporten-frontend/commit/bb0c05c110dc0b8e6b586bcaa1ce2494e92bf23e))

## [1.92.0](https://github.com/Altinn/dialogporten-frontend/compare/v1.91.0...v1.92.0) (2025-11-03)


### Features

* add feature-flag for not reversing person names due to ongoing API changes ([#3079](https://github.com/Altinn/dialogporten-frontend/issues/3079)) ([68f2928](https://github.com/Altinn/dialogporten-frontend/commit/68f29284f1f688f53fc7a1a720c343934ff6b833))


### Bug Fixes

* always refetch dialog on mount to ensure correct content is loaded ([#3088](https://github.com/Altinn/dialogporten-frontend/issues/3088)) ([d1c4f1b](https://github.com/Altinn/dialogporten-frontend/commit/d1c4f1be6574ef1650d04054edf3abb5d8c0ebb7))
* Change root with content extendedStatus ([#3072](https://github.com/Altinn/dialogporten-frontend/issues/3072)) ([80807c9](https://github.com/Altinn/dialogporten-frontend/commit/80807c9bb3d7853702f02650b45733bae00cc8f8))

## [1.91.0](https://github.com/Altinn/dialogporten-frontend/compare/v1.90.5...v1.91.0) (2025-10-30)


### Features

* Add returnUrl parameter on URLs to apps with receipt to ensure that closing receipt returns back to correct inbox ([#3070](https://github.com/Altinn/dialogporten-frontend/issues/3070)) ([ad558e6](https://github.com/Altinn/dialogporten-frontend/commit/ad558e662ee335f0176707f36b6bac47a1c200e4))

## [1.90.5](https://github.com/Altinn/dialogporten-frontend/compare/v1.90.4...v1.90.5) (2025-10-29)


### Bug Fixes

* **ci:** include more packages when checking for app changes ([#3067](https://github.com/Altinn/dialogporten-frontend/issues/3067)) ([ebdd29e](https://github.com/Altinn/dialogporten-frontend/commit/ebdd29e686596badc9231a9a2a45cec1a953758a))

## [1.90.4](https://github.com/Altinn/dialogporten-frontend/compare/v1.90.3...v1.90.4) (2025-10-29)


### Bug Fixes

* support left, center and right alignment for tables ([#3065](https://github.com/Altinn/dialogporten-frontend/issues/3065)) ([b9ccf7b](https://github.com/Altinn/dialogporten-frontend/commit/b9ccf7b3ea160c7affb73a364841d405c6ae2584))

## [1.90.3](https://github.com/Altinn/dialogporten-frontend/compare/v1.90.2...v1.90.3) (2025-10-29)


### Bug Fixes

* format name and type of avatar of party representative based on actor id ([#3060](https://github.com/Altinn/dialogporten-frontend/issues/3060)) ([58102e4](https://github.com/Altinn/dialogporten-frontend/commit/58102e4651af9442e58d6a4818fd52fcd793d8ef))

## [1.90.2](https://github.com/Altinn/dialogporten-frontend/compare/v1.90.1...v1.90.2) (2025-10-27)


### Bug Fixes

* About page texts ([#3050](https://github.com/Altinn/dialogporten-frontend/issues/3050)) ([322bc01](https://github.com/Altinn/dialogporten-frontend/commit/322bc0133d4e6cca4207f49081580445aa79021f))

## [1.90.1](https://github.com/Altinn/dialogporten-frontend/compare/v1.90.0...v1.90.1) (2025-10-24)


### Bug Fixes

* Implement new texts for About page ([b124b51](https://github.com/Altinn/dialogporten-frontend/commit/b124b512a3af19c33525f858a8f99901832cb84a))
* Update MainContentRef error message ([#3043](https://github.com/Altinn/dialogporten-frontend/issues/3043)) ([08034e0](https://github.com/Altinn/dialogporten-frontend/commit/08034e0e472e2ff7752d540b2ad33e387f536d26))

## [1.90.0](https://github.com/Altinn/dialogporten-frontend/compare/v1.89.3...v1.90.0) (2025-10-23)


### Features

* Added paries expanded view organization tree ([6d3e3fa](https://github.com/Altinn/dialogporten-frontend/commit/6d3e3fad25b9444ab30c2d4cd8bd0da21dc8e13b))


### Bug Fixes

* Account list - support org search ([#3035](https://github.com/Altinn/dialogporten-frontend/issues/3035)) ([570c784](https://github.com/Altinn/dialogporten-frontend/commit/570c784d766f9e288cf6b0e318992bd2b5dcada5))

## [1.89.3](https://github.com/Altinn/dialogporten-frontend/compare/v1.89.2...v1.89.3) (2025-10-23)


### Bug Fixes

* Add extended status to detailed view ([#3011](https://github.com/Altinn/dialogporten-frontend/issues/3011)) ([72bd20f](https://github.com/Altinn/dialogporten-frontend/commit/72bd20ff50d0120cf380bf752b3855da05363e8d))
* Set correct sender name for sub parties ([#3017](https://github.com/Altinn/dialogporten-frontend/issues/3017)) ([403449d](https://github.com/Altinn/dialogporten-frontend/commit/403449da3f4022974ee8945219b8d62bb43bcd4d))

## [1.89.2](https://github.com/Altinn/dialogporten-frontend/compare/v1.89.1...v1.89.2) (2025-10-20)


### Bug Fixes

* Revert default values for refresh token ([#3005](https://github.com/Altinn/dialogporten-frontend/issues/3005)) ([b87b96b](https://github.com/Altinn/dialogporten-frontend/commit/b87b96b5c995eabe509bd746ff0e1febab743612))

## [1.89.1](https://github.com/Altinn/dialogporten-frontend/compare/v1.89.0...v1.89.1) (2025-10-20)


### Bug Fixes

* refresh token default values ([#3002](https://github.com/Altinn/dialogporten-frontend/issues/3002)) ([d4f122c](https://github.com/Altinn/dialogporten-frontend/commit/d4f122c220df8a346ab17d1bc400bf0dcac4167d))

## [1.89.0](https://github.com/Altinn/dialogporten-frontend/compare/v1.88.2...v1.89.0) (2025-10-17)


### Features

* **bff:** use otel exporter to export logs, metrics and traces ([#2990](https://github.com/Altinn/dialogporten-frontend/issues/2990)) ([600b320](https://github.com/Altinn/dialogporten-frontend/commit/600b32075ec2ceedf2747eea7e1684f6d2f6f3ce))


### Bug Fixes

* Add row gab to header ([d73e9d8](https://github.com/Altinn/dialogporten-frontend/commit/d73e9d82f46fbdb8777afa78d20f29b9d618db33))
* **bff:** remove hardcoded otel endpoint and protocol ([#2996](https://github.com/Altinn/dialogporten-frontend/issues/2996)) ([e08c2b8](https://github.com/Altinn/dialogporten-frontend/commit/e08c2b8a86068b14ff45d582e961f5724e12f519))
* Remove bankruptcy group title and description ([#2993](https://github.com/Altinn/dialogporten-frontend/issues/2993)) ([39f96db](https://github.com/Altinn/dialogporten-frontend/commit/39f96db89b9843a34408f2dcf58790a19f66848e))
* Set correct default window size ([#2998](https://github.com/Altinn/dialogporten-frontend/issues/2998)) ([3066acc](https://github.com/Altinn/dialogporten-frontend/commit/3066accf4a689e45f50e933c7d880666a9c8eb96))
* title for account menu on mobile ([#2997](https://github.com/Altinn/dialogporten-frontend/issues/2997)) ([5e4fbfd](https://github.com/Altinn/dialogporten-frontend/commit/5e4fbfd5d0fc8f05c1317a0169c00e0aec8c072d))

## [1.88.2](https://github.com/Altinn/dialogporten-frontend/compare/v1.88.1...v1.88.2) (2025-10-16)


### Bug Fixes

* flaky e2e profile test ([#2991](https://github.com/Altinn/dialogporten-frontend/issues/2991)) ([686e459](https://github.com/Altinn/dialogporten-frontend/commit/686e459c4b53350fa7aa3d125fc528a7d3a286aa))

## [1.88.1](https://github.com/Altinn/dialogporten-frontend/compare/v1.88.0...v1.88.1) (2025-10-16)


### Bug Fixes

* feature api error ([#2988](https://github.com/Altinn/dialogporten-frontend/issues/2988)) ([fada77b](https://github.com/Altinn/dialogporten-frontend/commit/fada77b90461f4d7e0696ea86e266ac0e835a0ff))

## [1.88.0](https://github.com/Altinn/dialogporten-frontend/compare/v1.87.0...v1.88.0) (2025-10-16)


### Features

* Add extended status label to dialog list ([#2985](https://github.com/Altinn/dialogporten-frontend/issues/2985)) ([72f7ad5](https://github.com/Altinn/dialogporten-frontend/commit/72f7ad55cf4891db35ecce4e4f87a5b639078a07))


### Bug Fixes

* Improving issue where Header breaks into two lines ([9708621](https://github.com/Altinn/dialogporten-frontend/commit/9708621dd1d0616f35f37d194fc7cd5873e0a547))
* Output folder path ([4cf08d4](https://github.com/Altinn/dialogporten-frontend/commit/4cf08d40a27bf487accaf81b97f8238a5d79ea89))
* Output path for polaris extraction ([a991447](https://github.com/Altinn/dialogporten-frontend/commit/a99144703c8e15ef80b89daaf44e151c9c4ab22b))

## [1.87.0](https://github.com/Altinn/dialogporten-frontend/compare/v1.86.0...v1.87.0) (2025-10-16)


### Features

* Add integration between Polaris and Github ([8317a16](https://github.com/Altinn/dialogporten-frontend/commit/8317a168a09e4575083f401769230a57cd8fe573))


### Bug Fixes

* subscription issues ([#2979](https://github.com/Altinn/dialogporten-frontend/issues/2979)) ([d6f7720](https://github.com/Altinn/dialogporten-frontend/commit/d6f77202bc5c74311a5d4f93a8d0de8883316161))

## [1.86.0](https://github.com/Altinn/dialogporten-frontend/compare/v1.85.0...v1.86.0) (2025-10-15)


### Features

* **infra:** Enable OTEL for container app env ([#2968](https://github.com/Altinn/dialogporten-frontend/issues/2968)) ([1286382](https://github.com/Altinn/dialogporten-frontend/commit/1286382fe80aacfb9c50919b3a84aadede4bff70))


### Bug Fixes

* **bff:** ensure more errors are logged using node-logger ([#2967](https://github.com/Altinn/dialogporten-frontend/issues/2967)) ([0b5f016](https://github.com/Altinn/dialogporten-frontend/commit/0b5f0168c903e133169c2dbf1a3e2139d76dc0cd))
* minor tweaks to props for deleted accounts ([#2973](https://github.com/Altinn/dialogporten-frontend/issues/2973)) ([7184c01](https://github.com/Altinn/dialogporten-frontend/commit/7184c01fc9740a1f3ed3cd2615877d6c8cacf266))
* Skip onboarding steps for hidden elements ([#2971](https://github.com/Altinn/dialogporten-frontend/issues/2971)) ([1b619a2](https://github.com/Altinn/dialogporten-frontend/commit/1b619a2104f711f93e75d66176b22dd47dbe7941))

## [1.85.0](https://github.com/Altinn/dialogporten-frontend/compare/v1.84.1...v1.85.0) (2025-10-15)


### Features

* Bump AC v42.5 ([#2966](https://github.com/Altinn/dialogporten-frontend/issues/2966)) ([416526e](https://github.com/Altinn/dialogporten-frontend/commit/416526e7c50f0a07848c3839e123581c14b659b3))


### Bug Fixes

* **bff:** ensure error logger is used for errors ([#2953](https://github.com/Altinn/dialogporten-frontend/issues/2953)) ([157b738](https://github.com/Altinn/dialogporten-frontend/commit/157b738283e1b51af2ec9ffd3af491129cb21090))
* Bump AC v42.4 ([#2960](https://github.com/Altinn/dialogporten-frontend/issues/2960)) ([e4c341e](https://github.com/Altinn/dialogporten-frontend/commit/e4c341e240fc45ebb6e5177fdbdebd70d3041ad9))
* **frontend:** ensure we trace feature flag request ([#2963](https://github.com/Altinn/dialogporten-frontend/issues/2963)) ([6122bf4](https://github.com/Altinn/dialogporten-frontend/commit/6122bf4b8151216880bd49ff01c113665d178424))
* only show attachment links with consumer type AttachmentUrlConsumer.Gui ([#2965](https://github.com/Altinn/dialogporten-frontend/issues/2965)) ([b9af5be](https://github.com/Altinn/dialogporten-frontend/commit/b9af5be37421591053c274e4fe230fe030d7e4c0))

## [1.84.1](https://github.com/Altinn/dialogporten-frontend/compare/v1.84.0...v1.84.1) (2025-10-15)


### Bug Fixes

* Fixing notification settings on deleted party ([#2956](https://github.com/Altinn/dialogporten-frontend/issues/2956)) ([4be90ea](https://github.com/Altinn/dialogporten-frontend/commit/4be90ea52af0c895e976703cd777acb7a704bd74))

## [1.84.0](https://github.com/Altinn/dialogporten-frontend/compare/v1.83.5...v1.84.0) (2025-10-14)


### Features

* Added i18n strings for Profile page. ([5ba95cb](https://github.com/Altinn/dialogporten-frontend/commit/5ba95cb0777137e88e1b53bca1ce48ab05f7ef61))


### Bug Fixes

* Fixed companies string ([95bc41f](https://github.com/Altinn/dialogporten-frontend/commit/95bc41fd8e30f39c5c6c9de03cbbbf78fc34ad3d))

## [1.83.5](https://github.com/Altinn/dialogporten-frontend/compare/v1.83.4...v1.83.5) (2025-10-14)


### Bug Fixes

* disable save button for notification setting if there are no changes ([#2948](https://github.com/Altinn/dialogporten-frontend/issues/2948)) ([3bbf3a8](https://github.com/Altinn/dialogporten-frontend/commit/3bbf3a8da51ff48bcd7a2cc68ac2affedc7d9d60))

## [1.83.4](https://github.com/Altinn/dialogporten-frontend/compare/v1.83.3...v1.83.4) (2025-10-14)


### Bug Fixes

* **bff:** increase max replicas ([#2941](https://github.com/Altinn/dialogporten-frontend/issues/2941)) ([3b5837c](https://github.com/Altinn/dialogporten-frontend/commit/3b5837cc37d74b5ef4013c8dbfde0450419af71f))
* Hide onboarding trigger on profile notifications and settings ([#2944](https://github.com/Altinn/dialogporten-frontend/issues/2944)) ([c52e162](https://github.com/Altinn/dialogporten-frontend/commit/c52e162bdf7dacbcfce84b12af65a8556c870b95))
* tweaks before release ([#2947](https://github.com/Altinn/dialogporten-frontend/issues/2947)) ([844ebe3](https://github.com/Altinn/dialogporten-frontend/commit/844ebe3d28e8bdb8e20026b25d891f2ac4889ee6))
* Updated link and about texts ([a2fa7bc](https://github.com/Altinn/dialogporten-frontend/commit/a2fa7bcc55e8913a9e7fad11dc4751643f321529))

## [1.83.3](https://github.com/Altinn/dialogporten-frontend/compare/v1.83.2...v1.83.3) (2025-10-14)


### Bug Fixes

* enable api integration for core in production ([#2933](https://github.com/Altinn/dialogporten-frontend/issues/2933)) ([9103ace](https://github.com/Altinn/dialogporten-frontend/commit/9103acef9afa8b0074ff91f8a6d709c8ab3be35c))
* **frontend:** clean up errors reported on failed queries ([#2940](https://github.com/Altinn/dialogporten-frontend/issues/2940)) ([dd1ee49](https://github.com/Altinn/dialogporten-frontend/commit/dd1ee49b48071e405840880e9fe13fd121fdd345))

## [1.83.2](https://github.com/Altinn/dialogporten-frontend/compare/v1.83.1...v1.83.2) (2025-10-14)


### Bug Fixes

* re-enable feature toggle api ([#2930](https://github.com/Altinn/dialogporten-frontend/issues/2930)) ([63fc65d](https://github.com/Altinn/dialogporten-frontend/commit/63fc65ddad23e1b45eaaab161e2144a80519106b))

## [1.83.1](https://github.com/Altinn/dialogporten-frontend/compare/v1.83.0...v1.83.1) (2025-10-13)


### Bug Fixes

* format ssn consistently across af ([#2929](https://github.com/Altinn/dialogporten-frontend/issues/2929)) ([ecbc813](https://github.com/Altinn/dialogporten-frontend/commit/ecbc813cb103856119015955a853a6acb54338ef))
* Page title beta suffix ([#2924](https://github.com/Altinn/dialogporten-frontend/issues/2924)) ([a5695ee](https://github.com/Altinn/dialogporten-frontend/commit/a5695eeb7ee06fa7fb79f8d27fe43a38efc41dfc))

## [1.83.0](https://github.com/Altinn/dialogporten-frontend/compare/v1.82.3...v1.83.0) (2025-10-13)


### Features

* Onboarding profile ([#2867](https://github.com/Altinn/dialogporten-frontend/issues/2867)) ([dcdd801](https://github.com/Altinn/dialogporten-frontend/commit/dcdd8016a86488b23668bd4bc3b56b8b0ac842f8))


### Bug Fixes

* sub parties with different names than parent does not get grouped ([#2921](https://github.com/Altinn/dialogporten-frontend/issues/2921)) ([a23e9c2](https://github.com/Altinn/dialogporten-frontend/commit/a23e9c2240d76324956ed32cabae6b9aacb5be5d))

## [1.82.3](https://github.com/Altinn/dialogporten-frontend/compare/v1.82.2...v1.82.3) (2025-10-13)


### Bug Fixes

* inconsistent avatar groups for used by for notifications ([#2919](https://github.com/Altinn/dialogporten-frontend/issues/2919)) ([c2b010a](https://github.com/Altinn/dialogporten-frontend/commit/c2b010ab63718cb71db54a70e2397c2338db06f5))

## [1.82.2](https://github.com/Altinn/dialogporten-frontend/compare/v1.82.1...v1.82.2) (2025-10-13)


### Bug Fixes

* **bff:** use correct secret ref for app configuration conn string ([#2911](https://github.com/Altinn/dialogporten-frontend/issues/2911)) ([778c960](https://github.com/Altinn/dialogporten-frontend/commit/778c960ef9c5ea2cc83ead1e91712ad2c1964512))
* **infra:** ensure correct hostname for maintenance backend ([#2884](https://github.com/Altinn/dialogporten-frontend/issues/2884)) ([102a4dc](https://github.com/Altinn/dialogporten-frontend/commit/102a4dcd45c73a7a3ef7088cc0b7803978c3b97c))

## [1.82.1](https://github.com/Altinn/dialogporten-frontend/compare/v1.82.0...v1.82.1) (2025-10-13)


### Bug Fixes

* deleted parties not possible to choose as selected or current party ([#2904](https://github.com/Altinn/dialogporten-frontend/issues/2904)) ([c703ea6](https://github.com/Altinn/dialogporten-frontend/commit/c703ea6d330fe892774ffee4e4dcbc58698e8cf4))

## [1.82.0](https://github.com/Altinn/dialogporten-frontend/compare/v1.81.1...v1.82.0) (2025-10-10)


### Features

* basic feature toggle API  ([6efc36a](https://github.com/Altinn/dialogporten-frontend/commit/6efc36aa6f260a763f521601d39b737a95a874ae))
* basic feature toggle API  ([#2835](https://github.com/Altinn/dialogporten-frontend/issues/2835)) ([6efc36a](https://github.com/Altinn/dialogporten-frontend/commit/6efc36aa6f260a763f521601d39b737a95a874ae))
* organize accounts across AF ([#2890](https://github.com/Altinn/dialogporten-frontend/issues/2890)) ([02f0b8d](https://github.com/Altinn/dialogporten-frontend/commit/02f0b8dc464a0d83b36142869fa15e940c747a02))

## [1.81.1](https://github.com/Altinn/dialogporten-frontend/compare/v1.81.0...v1.81.1) (2025-10-08)


### Bug Fixes

* Fix savedsearch icon size and globalmenu icons on safari ([#2887](https://github.com/Altinn/dialogporten-frontend/issues/2887)) ([e59d051](https://github.com/Altinn/dialogporten-frontend/commit/e59d051bbc2a409145ab6542f75adca3faef091d))

## [1.81.0](https://github.com/Altinn/dialogporten-frontend/compare/v1.80.0...v1.81.0) (2025-10-07)


### Features

* Fixed actor list bugs. Added grouping logic. Refactoring ([3b75b98](https://github.com/Altinn/dialogporten-frontend/commit/3b75b9879a13369f32bde6e77812ef2f26b60169))


### Bug Fixes

* saved search safari fix ([#2873](https://github.com/Altinn/dialogporten-frontend/issues/2873)) ([3774a4e](https://github.com/Altinn/dialogporten-frontend/commit/3774a4ea490e18d9512850a18815c027a391bd21))

## [1.80.0](https://github.com/Altinn/dialogporten-frontend/compare/v1.79.0...v1.80.0) (2025-10-07)


### Features

* Added skeleton loading to Profile pages ([26f2d03](https://github.com/Altinn/dialogporten-frontend/commit/26f2d03d8377cce641a2a29ec638f5c08f787b58))


### Bug Fixes

* Fix savedSearch icon on Safari zoom ([#2872](https://github.com/Altinn/dialogporten-frontend/issues/2872)) ([cd90497](https://github.com/Altinn/dialogporten-frontend/commit/cd90497d094082a0a3654d4807fc51205209f726))
* **infra:** ensure correct naming for app configuration ([#2866](https://github.com/Altinn/dialogporten-frontend/issues/2866)) ([6ddfb07](https://github.com/Altinn/dialogporten-frontend/commit/6ddfb07991bdb7202d1683c625ffeba71c6148d1))

## [1.79.0](https://github.com/Altinn/dialogporten-frontend/compare/v1.78.1...v1.79.0) (2025-10-03)


### Features

* Added toolbar filter to Notification Page ([47bb7da](https://github.com/Altinn/dialogporten-frontend/commit/47bb7dabb4ca7066fd8448ddfba33d72e7aca72f))
* **infra:** add app configuration ([#2859](https://github.com/Altinn/dialogporten-frontend/issues/2859)) ([335466e](https://github.com/Altinn/dialogporten-frontend/commit/335466ecc5d980e1ac09a35fa5235775ea32c476))


### Bug Fixes

* **frontend:** improve error tracking ([#2853](https://github.com/Altinn/dialogporten-frontend/issues/2853)) ([5047109](https://github.com/Altinn/dialogporten-frontend/commit/5047109ae3f0b8bd15a0a6e3ca80b4cbffce807d))

## [1.78.1](https://github.com/Altinn/dialogporten-frontend/compare/v1.78.0...v1.78.1) (2025-10-02)


### Bug Fixes

* fix safari icons on zoom ([#2851](https://github.com/Altinn/dialogporten-frontend/issues/2851)) ([a817271](https://github.com/Altinn/dialogporten-frontend/commit/a817271f9f44f21d25104f5c1b78ee535324be1a))
* improvements to filtering party types in party overview ([#2849](https://github.com/Altinn/dialogporten-frontend/issues/2849)) ([7d8326d](https://github.com/Altinn/dialogporten-frontend/commit/7d8326d623026abd750c99f22854e076df53bd39))

## [1.78.0](https://github.com/Altinn/dialogporten-frontend/compare/v1.77.0...v1.78.0) (2025-10-02)


### Features

* Settings page + other profile improvements ([c054d5b](https://github.com/Altinn/dialogporten-frontend/commit/c054d5ba908065bd7da88a454584b33c48bad45a))


### Bug Fixes

* **frontend:** avoid tracking unhandled exceptions ([#2845](https://github.com/Altinn/dialogporten-frontend/issues/2845)) ([0a57683](https://github.com/Altinn/dialogporten-frontend/commit/0a5768391ea43420339d53ae8660d17ef10a510a))
* Some minor fixes to Settings page ([4af0faa](https://github.com/Altinn/dialogporten-frontend/commit/4af0faa104c4feac3f6a17e02a368eb4e6446b7e))

## [1.77.0](https://github.com/Altinn/dialogporten-frontend/compare/v1.76.1...v1.77.0) (2025-10-01)


### Features

* Added counter to usage of private notification email/phone ([29663f7](https://github.com/Altinn/dialogporten-frontend/commit/29663f7f6671bbdcb7eaa0f7ff6e18df6a1ac761))


### Bug Fixes

* Remove link indication for org no. ([098ccb5](https://github.com/Altinn/dialogporten-frontend/commit/098ccb52ccedc2b948ae089d4c10b82fe887ed65))
* Remove link indication for org no. ([a16bfea](https://github.com/Altinn/dialogporten-frontend/commit/a16bfea48ca9c93f4ff0a1514f0afeb5cce5a56c))
* update url to access management to point to at23 ([#2828](https://github.com/Altinn/dialogporten-frontend/issues/2828)) ([61f3e6c](https://github.com/Altinn/dialogporten-frontend/commit/61f3e6c53b2edb0b5426f06eca9357e5424719c3))

## [1.76.1](https://github.com/Altinn/dialogporten-frontend/compare/v1.76.0...v1.76.1) (2025-10-01)


### Bug Fixes

* update to latest version of altinn-components 0.41.0 ([#2823](https://github.com/Altinn/dialogporten-frontend/issues/2823)) ([64de38f](https://github.com/Altinn/dialogporten-frontend/commit/64de38f625ff7a4ba725f9fa3506bb4731c6c1e7))

## [1.76.0](https://github.com/Altinn/dialogporten-frontend/compare/v1.75.0...v1.76.0) (2025-09-30)


### Features

* Added phone number validation same as Core backend ([531f81f](https://github.com/Altinn/dialogporten-frontend/commit/531f81fb001a1f9ab6a5c8371b64300130b0d48f))
* Implemented new Altinn Core API endpoint for notifications ([ada23e9](https://github.com/Altinn/dialogporten-frontend/commit/ada23e92619b854844ee79ced0d79722acd6c6fc))
* refactor global menu for profile ([#2818](https://github.com/Altinn/dialogporten-frontend/issues/2818)) ([bb9611b](https://github.com/Altinn/dialogporten-frontend/commit/bb9611bd45a6214c1977ed79cc51362f6e82a384))


### Bug Fixes

* **env:** point to at23 instead of at22 for test url + SLO A2-fix ([#2809](https://github.com/Altinn/dialogporten-frontend/issues/2809)) ([4d47236](https://github.com/Altinn/dialogporten-frontend/commit/4d472368dbdc16ab4699691fa27a77be2acb1fbf))
* User address change URL for test env ([aa19a81](https://github.com/Altinn/dialogporten-frontend/commit/aa19a8133676efe430762ac720097dcc12709a5b))
* wrong env assumed ([#2819](https://github.com/Altinn/dialogporten-frontend/issues/2819)) ([6f06a96](https://github.com/Altinn/dialogporten-frontend/commit/6f06a9654d735898c18c2615780b7e5f4824c07a))

## [1.75.0](https://github.com/Altinn/dialogporten-frontend/compare/v1.74.0...v1.75.0) (2025-09-26)


### Features

* Use Core AT env and enable profile in AF AT env ([5de0ef7](https://github.com/Altinn/dialogporten-frontend/commit/5de0ef7b3a7090076071b37d1877f0cd4a49c85d))


### Bug Fixes

* Notification page texts ([43ea997](https://github.com/Altinn/dialogporten-frontend/commit/43ea99710e2da89cec5f48796af692f83361589b))

## [1.74.0](https://github.com/Altinn/dialogporten-frontend/compare/v1.73.0...v1.74.0) (2025-09-26)


### Features

* Introduce bankruptcy dialogs group and put on top of the dialog list ([#2794](https://github.com/Altinn/dialogporten-frontend/issues/2794)) ([724935c](https://github.com/Altinn/dialogporten-frontend/commit/724935ce42e0af77c7017ae2a9bb58b63ab79a63))


### Bug Fixes

* display service owners with name for preferred locale ([#2802](https://github.com/Altinn/dialogporten-frontend/issues/2802)) ([1f21aa6](https://github.com/Altinn/dialogporten-frontend/commit/1f21aa65274683d290455b15036d9e64172dc828))
* Using test API for personal notification settings in all env except in prod ([48e4bbb](https://github.com/Altinn/dialogporten-frontend/commit/48e4bbba133bb601366abc7b303da53ceaf7018e))

## [1.73.0](https://github.com/Altinn/dialogporten-frontend/compare/v1.72.2...v1.73.0) (2025-09-26)


### Features

* Added search to Profile Notifications Page ([fdb0fe3](https://github.com/Altinn/dialogporten-frontend/commit/fdb0fe34b6b7cf6a4e584aeca9c962070b703eb5))
* format party names by formatDisplayName ([#2796](https://github.com/Altinn/dialogporten-frontend/issues/2796)) ([9d4ca73](https://github.com/Altinn/dialogporten-frontend/commit/9d4ca73f5bd697d3817bf51a2ad019bca6c01b68))

## [1.72.2](https://github.com/Altinn/dialogporten-frontend/compare/v1.72.1...v1.72.2) (2025-09-25)


### Bug Fixes

* add authenticated query hooks and improve token handling ([#2783](https://github.com/Altinn/dialogporten-frontend/issues/2783)) ([efc7625](https://github.com/Altinn/dialogporten-frontend/commit/efc7625f0c6c6261cfe5b301b39e1290f01080f7))

## [1.72.1](https://github.com/Altinn/dialogporten-frontend/compare/v1.72.0...v1.72.1) (2025-09-25)


### Bug Fixes

* broken e2e tests after aria label change on close button ([#2785](https://github.com/Altinn/dialogporten-frontend/issues/2785)) ([5234bb3](https://github.com/Altinn/dialogporten-frontend/commit/5234bb3e094f6e640289f94e78e0e5cabb9233e8))
* **frontend:** make sure we can identify the app in AI easier ([#2781](https://github.com/Altinn/dialogporten-frontend/issues/2781)) ([d689179](https://github.com/Altinn/dialogporten-frontend/commit/d6891794ed298dd42950cabdc03d90698b39063c))

## [1.72.0](https://github.com/Altinn/dialogporten-frontend/compare/v1.71.4...v1.72.0) (2025-09-24)


### Features

* Implemented new design for subparties ([5f02ae1](https://github.com/Altinn/dialogporten-frontend/commit/5f02ae142fc05a80c15a5717f03cf75701fcaa47))


### Bug Fixes

* Focus trap for tour popover og modal esc support ([#2769](https://github.com/Altinn/dialogporten-frontend/issues/2769)) ([4b8fe7c](https://github.com/Altinn/dialogporten-frontend/commit/4b8fe7c5935466569f26b9acedb1f0bd5663e8da))

## [1.71.4](https://github.com/Altinn/dialogporten-frontend/compare/v1.71.3...v1.71.4) (2025-09-24)


### Bug Fixes

* remove unwanted logged in label in sidebar ([#2772](https://github.com/Altinn/dialogporten-frontend/issues/2772)) ([05dd0e5](https://github.com/Altinn/dialogporten-frontend/commit/05dd0e5005c8e68b78bf9acdf1b56bfa878aae39))

## [1.71.3](https://github.com/Altinn/dialogporten-frontend/compare/v1.71.2...v1.71.3) (2025-09-24)


### Bug Fixes

* reintroduce logged in as label in global menu after it disappeared because of api changes ([#2770](https://github.com/Altinn/dialogporten-frontend/issues/2770)) ([325e46c](https://github.com/Altinn/dialogporten-frontend/commit/325e46c0183c160e3cddcb8c9ae156571f5da926))

## [1.71.2](https://github.com/Altinn/dialogporten-frontend/compare/v1.71.1...v1.71.2) (2025-09-23)


### Bug Fixes

* **frontend:** use start and stop tracking to avoid timing issues ([#2766](https://github.com/Altinn/dialogporten-frontend/issues/2766)) ([e54d074](https://github.com/Altinn/dialogporten-frontend/commit/e54d074d25015b0054ec55729a721a0590aa6dac))

## [1.71.1](https://github.com/Altinn/dialogporten-frontend/compare/v1.71.0...v1.71.1) (2025-09-23)


### Bug Fixes

* e2e test ([#2764](https://github.com/Altinn/dialogporten-frontend/issues/2764)) ([b371b8a](https://github.com/Altinn/dialogporten-frontend/commit/b371b8ad32a648dbadc4f9a25f05251a97144006))

## [1.71.0](https://github.com/Altinn/dialogporten-frontend/compare/v1.70.1...v1.71.0) (2025-09-23)


### Features

* keyboard navigation for toolbar ([#2762](https://github.com/Altinn/dialogporten-frontend/issues/2762)) ([5c24632](https://github.com/Altinn/dialogporten-frontend/commit/5c2463225ff858032e3d7c1de97d01f5094b1c8c))
* Showing deleted actors if chosen in filter on Parties profile page ([402c030](https://github.com/Altinn/dialogporten-frontend/commit/402c0305ab73f805795521f72c22cfd94deae965))

## [1.70.1](https://github.com/Altinn/dialogporten-frontend/compare/v1.70.0...v1.70.1) (2025-09-22)


### Bug Fixes

* Capitalize double names with dash ([#2745](https://github.com/Altinn/dialogporten-frontend/issues/2745)) ([9fe8800](https://github.com/Altinn/dialogporten-frontend/commit/9fe880091fbc58ff0bca6f430345499a9e2130ea))
* **frontend:** make page tracking more robust ([#2760](https://github.com/Altinn/dialogporten-frontend/issues/2760)) ([04c24af](https://github.com/Altinn/dialogporten-frontend/commit/04c24afc39693886b3414e9ff73ea26e9c54ea6f))

## [1.70.0](https://github.com/Altinn/dialogporten-frontend/compare/v1.69.0...v1.70.0) (2025-09-19)


### Features

* Added modal for changing user notifications. ([5dd21de](https://github.com/Altinn/dialogporten-frontend/commit/5dd21de155df694e193402431fc9376b62982269))
* Notification settings for user's parties ([c35e39d](https://github.com/Altinn/dialogporten-frontend/commit/c35e39d0db04377ef54fab585c1faa6ad9593066))


### Bug Fixes

* **frontend:** avoid errors from AI calculating page durations ([#2748](https://github.com/Altinn/dialogporten-frontend/issues/2748)) ([2c5b466](https://github.com/Altinn/dialogporten-frontend/commit/2c5b4661bfa2ca6f311cdec22a6fceafea51862e))

## [1.69.0](https://github.com/Altinn/dialogporten-frontend/compare/v1.68.2...v1.69.0) (2025-09-18)


### Features

* Close button for welcome modal ([#2736](https://github.com/Altinn/dialogporten-frontend/issues/2736)) ([6bc9041](https://github.com/Altinn/dialogporten-frontend/commit/6bc90410d32cfeb4a9882f9239058697786bc2be))

## [1.68.2](https://github.com/Altinn/dialogporten-frontend/compare/v1.68.1...v1.68.2) (2025-09-18)


### Bug Fixes

* **frontend:** remove pageview calculations ([#2739](https://github.com/Altinn/dialogporten-frontend/issues/2739)) ([1ad7c26](https://github.com/Altinn/dialogporten-frontend/commit/1ad7c2637715ba69553f0f9ea11b303dc84e9299))

## [1.68.1](https://github.com/Altinn/dialogporten-frontend/compare/v1.68.0...v1.68.1) (2025-09-17)


### Bug Fixes

* correct page title translations ([#2733](https://github.com/Altinn/dialogporten-frontend/issues/2733)) ([82f718a](https://github.com/Altinn/dialogporten-frontend/commit/82f718ac1b8ffe88839126d1fe6f0a95a2c9aeb2))

## [1.68.0](https://github.com/Altinn/dialogporten-frontend/compare/v1.67.0...v1.68.0) (2025-09-16)


### Features

* Added validation to phone number and email fields ([aad7219](https://github.com/Altinn/dialogporten-frontend/commit/aad7219d27afc7e2a884c4eeefebfc4cf74165a9))


### Bug Fixes

* **frontend:** fix pageview calculations ([#2731](https://github.com/Altinn/dialogporten-frontend/issues/2731)) ([ab2cf2a](https://github.com/Altinn/dialogporten-frontend/commit/ab2cf2a8cf8756e7e19c9f28cb3d73b4c7599343))

## [1.67.0](https://github.com/Altinn/dialogporten-frontend/compare/v1.66.5...v1.67.0) (2025-09-16)


### Features

* Dymanic page title ([#2723](https://github.com/Altinn/dialogporten-frontend/issues/2723)) ([54b0d67](https://github.com/Altinn/dialogporten-frontend/commit/54b0d67efeb0f4c714c8f75058293234eaa24722))


### Bug Fixes

* **lang:** change html lang tag on language change ([#2725](https://github.com/Altinn/dialogporten-frontend/issues/2725)) ([bf6a79a](https://github.com/Altinn/dialogporten-frontend/commit/bf6a79a3702361ff479ec262b89598f2e11d1352))

## [1.66.5](https://github.com/Altinn/dialogporten-frontend/compare/v1.66.4...v1.66.5) (2025-09-15)


### Bug Fixes

* improve page tracking ([#2696](https://github.com/Altinn/dialogporten-frontend/issues/2696)) ([c0eaca1](https://github.com/Altinn/dialogporten-frontend/commit/c0eaca1ff93d17851df05f31a260990bbbff37ca))

## [1.66.4](https://github.com/Altinn/dialogporten-frontend/compare/v1.66.3...v1.66.4) (2025-09-15)


### Bug Fixes

* duplicate test ids for sub items in sidemenu ([#2718](https://github.com/Altinn/dialogporten-frontend/issues/2718)) ([b231759](https://github.com/Altinn/dialogporten-frontend/commit/b231759246c5dc42258e5089862cfdd7b6789a15))

## [1.66.3](https://github.com/Altinn/dialogporten-frontend/compare/v1.66.2...v1.66.3) (2025-09-15)


### Bug Fixes

* improve instrumentation ([#2658](https://github.com/Altinn/dialogporten-frontend/issues/2658)) ([dbbd384](https://github.com/Altinn/dialogporten-frontend/commit/dbbd3842765699085244864cee1ee5c9ca06e680))

## [1.66.2](https://github.com/Altinn/dialogporten-frontend/compare/v1.66.1...v1.66.2) (2025-09-12)


### Bug Fixes

* **bff:** add dialogporten to health check ([#2704](https://github.com/Altinn/dialogporten-frontend/issues/2704)) ([f6c11db](https://github.com/Altinn/dialogporten-frontend/commit/f6c11dbe0c8712a8c6eb1889246c0c5323290d73))
* use sender in filters instead of senders from 100 first dialogs ([#2710](https://github.com/Altinn/dialogporten-frontend/issues/2710)) ([1eb3d79](https://github.com/Altinn/dialogporten-frontend/commit/1eb3d792914c67b06da44d381152448887be014b))

## [1.66.1](https://github.com/Altinn/dialogporten-frontend/compare/v1.66.0...v1.66.1) (2025-09-12)


### Bug Fixes

* tour not showing ([#2702](https://github.com/Altinn/dialogporten-frontend/issues/2702)) ([66d4a7f](https://github.com/Altinn/dialogporten-frontend/commit/66d4a7f0d80ef3aac27d671f99bd389235da7c30))

## [1.66.0](https://github.com/Altinn/dialogporten-frontend/compare/v1.65.3...v1.66.0) (2025-09-12)


### Features

* New modal design. Improved logic for notification settings. ([daabc56](https://github.com/Altinn/dialogporten-frontend/commit/daabc566dee85e1484eb28a5af7337ecb92134fd))

## [1.65.3](https://github.com/Altinn/dialogporten-frontend/compare/v1.65.2...v1.65.3) (2025-09-12)


### Bug Fixes

* **deps:** update dependency typeorm to v0.3.26 ([#2288](https://github.com/Altinn/dialogporten-frontend/issues/2288)) ([c6e2abe](https://github.com/Altinn/dialogporten-frontend/commit/c6e2abe68dfdbc277cf36d552bd0daf688f558a0))
* prevent cursor jump in search input ([#2697](https://github.com/Altinn/dialogporten-frontend/issues/2697)) ([e51aeb9](https://github.com/Altinn/dialogporten-frontend/commit/e51aeb93d375892975b06f199a88a1c6842eea68))

## [1.65.2](https://github.com/Altinn/dialogporten-frontend/compare/v1.65.1...v1.65.2) (2025-09-11)


### Bug Fixes

* add test ids to sidebar menu items ([#2691](https://github.com/Altinn/dialogporten-frontend/issues/2691)) ([1d882f1](https://github.com/Altinn/dialogporten-frontend/commit/1d882f11f2d2264bf81ed0a1b32097bcccfef9bc))
* **autocomplete:** avoid duplicate params when org matches query ([#2689](https://github.com/Altinn/dialogporten-frontend/issues/2689)) ([a4974c4](https://github.com/Altinn/dialogporten-frontend/commit/a4974c445837024942a90f92bc428562692c45d5))

## [1.65.1](https://github.com/Altinn/dialogporten-frontend/compare/v1.65.0...v1.65.1) (2025-09-09)


### Bug Fixes

* wait on subscription to be established before loading fce ([#2671](https://github.com/Altinn/dialogporten-frontend/issues/2671)) ([d2a84e1](https://github.com/Altinn/dialogporten-frontend/commit/d2a84e17c88e0d21e06ae6645e75f438ad2acd17))

## [1.65.0](https://github.com/Altinn/dialogporten-frontend/compare/v1.64.3...v1.65.0) (2025-09-08)


### Features

* support for github flavored markdown for table support in markdown/html ([#2669](https://github.com/Altinn/dialogporten-frontend/issues/2669)) ([611594f](https://github.com/Altinn/dialogporten-frontend/commit/611594f781eea4b92d044de90fe4bdddedce997e))

## [1.64.3](https://github.com/Altinn/dialogporten-frontend/compare/v1.64.2...v1.64.3) (2025-09-08)


### Bug Fixes

* group search results into a single group with a description ([#2662](https://github.com/Altinn/dialogporten-frontend/issues/2662)) ([ab8d638](https://github.com/Altinn/dialogporten-frontend/commit/ab8d6384381bb21b76f55e253d50336656bfffc9))
* Update maintenance page support email ([#2660](https://github.com/Altinn/dialogporten-frontend/issues/2660)) ([d1ce046](https://github.com/Altinn/dialogporten-frontend/commit/d1ce04614b404e3ce9b3ed058375b54b4ba6d029))

## [1.64.2](https://github.com/Altinn/dialogporten-frontend/compare/v1.64.1...v1.64.2) (2025-09-05)


### Bug Fixes

* set secure cookie only when session exists ([#2656](https://github.com/Altinn/dialogporten-frontend/issues/2656)) ([613cf34](https://github.com/Altinn/dialogporten-frontend/commit/613cf346d406120aed10c1a5f4a75604d820dd88))

## [1.64.1](https://github.com/Altinn/dialogporten-frontend/compare/v1.64.0...v1.64.1) (2025-09-04)


### Bug Fixes

* **bff:** ensure security headers are always exposed ([#2651](https://github.com/Altinn/dialogporten-frontend/issues/2651)) ([348b440](https://github.com/Altinn/dialogporten-frontend/commit/348b440d5eb7d1a955f3a0c0cc4975deb24136f0))
* ensure gql requests are instrumented properly ([#2653](https://github.com/Altinn/dialogporten-frontend/issues/2653)) ([05f9182](https://github.com/Altinn/dialogporten-frontend/commit/05f9182ca0bed08dafa513e006abbdf7342ce1a5))
* improvements to searchbar ([#2648](https://github.com/Altinn/dialogporten-frontend/issues/2648)) ([272c2c3](https://github.com/Altinn/dialogporten-frontend/commit/272c2c3f9701f3eebe3702f17327e1babc7ea235))

## [1.64.0](https://github.com/Altinn/dialogporten-frontend/compare/v1.63.6...v1.64.0) (2025-09-03)


### Features

* **frontend:** add tracking for dialog actions ([#2646](https://github.com/Altinn/dialogporten-frontend/issues/2646)) ([eb9ad76](https://github.com/Altinn/dialogporten-frontend/commit/eb9ad765e16c6025d177aeba15cc61453847e2c9))


### Bug Fixes

* **app-insights:** avoid tracing every http request ([#2636](https://github.com/Altinn/dialogporten-frontend/issues/2636)) ([84c677b](https://github.com/Altinn/dialogporten-frontend/commit/84c677b28ea3eacc45aecf2139af3648eb02bdfa))
* **frontend:** use correct way of setting headers when tracking ([#2647](https://github.com/Altinn/dialogporten-frontend/issues/2647)) ([fb94d13](https://github.com/Altinn/dialogporten-frontend/commit/fb94d13d43981aaef191c633213f7710068fc1c6))

## [1.63.6](https://github.com/Altinn/dialogporten-frontend/compare/v1.63.5...v1.63.6) (2025-09-01)


### Bug Fixes

* beta modal navigation to onboarding missing ctx ([#2621](https://github.com/Altinn/dialogporten-frontend/issues/2621)) ([1a65565](https://github.com/Altinn/dialogporten-frontend/commit/1a655659cac64ef2a212f16e0e4b393f7eedb400))
* do not fetch isAuthenticated in background ([#2623](https://github.com/Altinn/dialogporten-frontend/issues/2623)) ([63019be](https://github.com/Altinn/dialogporten-frontend/commit/63019be2e9c2f5d6516dd968dc2a3677daaca9c2))

## [1.63.5](https://github.com/Altinn/dialogporten-frontend/compare/v1.63.4...v1.63.5) (2025-08-29)


### Bug Fixes

* adjustments to texts in folders ([#2617](https://github.com/Altinn/dialogporten-frontend/issues/2617)) ([6b9878e](https://github.com/Altinn/dialogporten-frontend/commit/6b9878eb12f757771106aa56f72577011e314f67))

## [1.63.4](https://github.com/Altinn/dialogporten-frontend/compare/v1.63.3...v1.63.4) (2025-08-29)


### Bug Fixes

* add links to about the new Altinn ([#2614](https://github.com/Altinn/dialogporten-frontend/issues/2614)) ([576c970](https://github.com/Altinn/dialogporten-frontend/commit/576c970e1daa869fc6b382825b80e14a0bb981ea))
* change translations for awaiting and not_applicable ([#2615](https://github.com/Altinn/dialogporten-frontend/issues/2615)) ([cebbadc](https://github.com/Altinn/dialogporten-frontend/commit/cebbadc31defcfcc5cb7af49ba05a8f05444a6aa))
* update texts for folder and use take me back in stead of leave beta as link text ([#2612](https://github.com/Altinn/dialogporten-frontend/issues/2612)) ([ce3e20b](https://github.com/Altinn/dialogporten-frontend/commit/ce3e20bca2b40132e93c797ce95c384454201808))

## [1.63.3](https://github.com/Altinn/dialogporten-frontend/compare/v1.63.2...v1.63.3) (2025-08-29)


### Bug Fixes

* **infra:** increase resources for bff ([#2610](https://github.com/Altinn/dialogporten-frontend/issues/2610)) ([30bfdda](https://github.com/Altinn/dialogporten-frontend/commit/30bfdda58fbe6f70c9cb647e134af72e827fcc72))

## [1.63.2](https://github.com/Altinn/dialogporten-frontend/compare/v1.63.1...v1.63.2) (2025-08-29)


### Bug Fixes

* beta modal texts ([#2603](https://github.com/Altinn/dialogporten-frontend/issues/2603)) ([864d7d0](https://github.com/Altinn/dialogporten-frontend/commit/864d7d0245cf7cee64ad258f82fcd19c691a81d6))
* changes to contact section for about inbox page ([#2608](https://github.com/Altinn/dialogporten-frontend/issues/2608)) ([1015810](https://github.com/Altinn/dialogporten-frontend/commit/10158104130185df49e7386dbf6e7183eaa4f595))
* use aktør intead of konto and avgivere consistently ([#2606](https://github.com/Altinn/dialogporten-frontend/issues/2606)) ([1a24794](https://github.com/Altinn/dialogporten-frontend/commit/1a24794fcfbef86373dcacac3e40f490f32c37ae))

## [1.63.1](https://github.com/Altinn/dialogporten-frontend/compare/v1.63.0...v1.63.1) (2025-08-29)


### Bug Fixes

* **graphql:** avoid unnecessary tracing of fields without resolvers ([#2604](https://github.com/Altinn/dialogporten-frontend/issues/2604)) ([ea02f45](https://github.com/Altinn/dialogporten-frontend/commit/ea02f450693d12cc70f6f245677c5a26fbee4d84))

## [1.63.0](https://github.com/Altinn/dialogporten-frontend/compare/v1.62.0...v1.63.0) (2025-08-28)


### Features

* Implement Organization endpoint from core + bugfixes and enhancements ([a991165](https://github.com/Altinn/dialogporten-frontend/commit/a9911655cd0e3ffa0d17f1b8a88e1ba902deb519))


### Bug Fixes

* change html title ([#2598](https://github.com/Altinn/dialogporten-frontend/issues/2598)) ([1b584ff](https://github.com/Altinn/dialogporten-frontend/commit/1b584ff569a672f0ac01eaf47efeab025d82bf53))

## [1.62.0](https://github.com/Altinn/dialogporten-frontend/compare/v1.61.5...v1.62.0) (2025-08-28)


### Features

* Add e2e for saved searches ([#2591](https://github.com/Altinn/dialogporten-frontend/issues/2591)) ([400d965](https://github.com/Altinn/dialogporten-frontend/commit/400d965bb53f9fa0aafcc03539b9a21ec6e943ba))


### Bug Fixes

* error page translations ([#2593](https://github.com/Altinn/dialogporten-frontend/issues/2593)) ([e586c96](https://github.com/Altinn/dialogporten-frontend/commit/e586c96a2b258e464092cceaaf37290efc4e0875))

## [1.61.5](https://github.com/Altinn/dialogporten-frontend/compare/v1.61.4...v1.61.5) (2025-08-28)


### Bug Fixes

* Creating SavedSearch now works again ([#2586](https://github.com/Altinn/dialogporten-frontend/issues/2586)) ([cdacf47](https://github.com/Altinn/dialogporten-frontend/commit/cdacf47e665157c96481b11357c640e7c709ca46))
* Creating SavedSearch now works again ([#2589](https://github.com/Altinn/dialogporten-frontend/issues/2589)) ([d2003a6](https://github.com/Altinn/dialogporten-frontend/commit/d2003a622f023b74d83dd5620cc021a124cf41ab))

## [1.61.4](https://github.com/Altinn/dialogporten-frontend/compare/v1.61.3...v1.61.4) (2025-08-28)


### Bug Fixes

* use only contentUpdatedAfter instead of updatedAt for filter and display label ([#2582](https://github.com/Altinn/dialogporten-frontend/issues/2582)) ([35e3903](https://github.com/Altinn/dialogporten-frontend/commit/35e39031ec813de8fc5b8e1410962d6ed1e57fd5))

## [1.61.3](https://github.com/Altinn/dialogporten-frontend/compare/v1.61.2...v1.61.3) (2025-08-28)


### Bug Fixes

* update texts for no results and empty folders ([#2580](https://github.com/Altinn/dialogporten-frontend/issues/2580)) ([9d078aa](https://github.com/Altinn/dialogporten-frontend/commit/9d078aa2f2ff042668eb59036b3038be5356d01e))

## [1.61.2](https://github.com/Altinn/dialogporten-frontend/compare/v1.61.1...v1.61.2) (2025-08-27)


### Bug Fixes

* **text:** update About page with new text ([#2577](https://github.com/Altinn/dialogporten-frontend/issues/2577)) ([0a01eb1](https://github.com/Altinn/dialogporten-frontend/commit/0a01eb1b694ca164e35199d338f150be859b7265))

## [1.61.1](https://github.com/Altinn/dialogporten-frontend/compare/v1.61.0...v1.61.1) (2025-08-27)


### Bug Fixes

* add whitelisted IPs to infra dispatch ([#2575](https://github.com/Altinn/dialogporten-frontend/issues/2575)) ([f37df12](https://github.com/Altinn/dialogporten-frontend/commit/f37df12d244ac8ad7440dd63c1142021de4ccf34))

## [1.61.0](https://github.com/Altinn/dialogporten-frontend/compare/v1.60.0...v1.61.0) (2025-08-27)


### Features

* Hiding profile pages in prod env ([68a92b7](https://github.com/Altinn/dialogporten-frontend/commit/68a92b78b882e6f050f2e66b920bfea364cede1f))
* remove counting and unread badge for accounts ([#2572](https://github.com/Altinn/dialogporten-frontend/issues/2572)) ([6a2faab](https://github.com/Altinn/dialogporten-frontend/commit/6a2faaba8891f3c4b051aa218cac75d9a5eb5a90))


### Bug Fixes

* Improve logic for welcome modal and onboarding ([#2571](https://github.com/Altinn/dialogporten-frontend/issues/2571)) ([839744d](https://github.com/Altinn/dialogporten-frontend/commit/839744d07bedf1caac092ebb781d1449f894caeb))

## [1.60.0](https://github.com/Altinn/dialogporten-frontend/compare/v1.59.0...v1.60.0) (2025-08-27)


### Features

* **infra:** add maintenance page to application gateway ([#2561](https://github.com/Altinn/dialogporten-frontend/issues/2561)) ([7c4b63b](https://github.com/Altinn/dialogporten-frontend/commit/7c4b63bf804d46b03a844b22e5e290f0960f5627))


### Bug Fixes

* **e2e:** close intro modal before clicking dialog ([#2563](https://github.com/Altinn/dialogporten-frontend/issues/2563)) ([5f8f13f](https://github.com/Altinn/dialogporten-frontend/commit/5f8f13fbb1c9db483ba0f3a354356df5effab487))

## [1.59.0](https://github.com/Altinn/dialogporten-frontend/compare/v1.58.0...v1.59.0) (2025-08-26)


### Features

* Add interactive user onboarding ([#2527](https://github.com/Altinn/dialogporten-frontend/issues/2527)) ([4b7bebb](https://github.com/Altinn/dialogporten-frontend/commit/4b7bebbaf75fe77bf08af68d678fbb7713addf8d))


### Bug Fixes

* menu items for global menu ([#2557](https://github.com/Altinn/dialogporten-frontend/issues/2557)) ([fee7e28](https://github.com/Altinn/dialogporten-frontend/commit/fee7e287fe7f747c11c847f2c2965be2f63bd903))

## [1.58.0](https://github.com/Altinn/dialogporten-frontend/compare/v1.57.1...v1.58.0) (2025-08-26)


### Features

* introduce beta modal ([#2554](https://github.com/Altinn/dialogporten-frontend/issues/2554)) ([67fd187](https://github.com/Altinn/dialogporten-frontend/commit/67fd1877ad2bbae2f21b704600394ba4585f57eb))


### Bug Fixes

* floating button was incorrectly placed ([#2556](https://github.com/Altinn/dialogporten-frontend/issues/2556)) ([ed80947](https://github.com/Altinn/dialogporten-frontend/commit/ed809474f6f7576ac096d8a35ff3e2d24c5a37e9))

## [1.57.1](https://github.com/Altinn/dialogporten-frontend/compare/v1.57.0...v1.57.1) (2025-08-25)


### Bug Fixes

* prepare global menu for beta release + couple of fixes to about routing ([#2552](https://github.com/Altinn/dialogporten-frontend/issues/2552)) ([f750821](https://github.com/Altinn/dialogporten-frontend/commit/f75082182cc61b1927a89cec18db0e2d60d29bcb))

## [1.57.0](https://github.com/Altinn/dialogporten-frontend/compare/v1.56.0...v1.57.0) (2025-08-25)


### Features

* add about page ([#2550](https://github.com/Altinn/dialogporten-frontend/issues/2550)) ([5be9889](https://github.com/Altinn/dialogporten-frontend/commit/5be98895ec4562c8f9c4f3f49ac47b78c6bed8ff))


### Bug Fixes

* **release-please:** update new version of release please ([#2548](https://github.com/Altinn/dialogporten-frontend/issues/2548)) ([266c83d](https://github.com/Altinn/dialogporten-frontend/commit/266c83d217689745e3f9b90d75e1f9970ffcfb9a))

## [1.56.0](https://github.com/Altinn/dialogporten-frontend/compare/v1.55.1...v1.56.0) (2025-08-25)


### Features

* Notification settings can now be changed + other improvements ([fe98914](https://github.com/Altinn/dialogporten-frontend/commit/fe98914820db4622281d86e4128aa0c084b73798))
* remove beta banner ([#2540](https://github.com/Altinn/dialogporten-frontend/issues/2540)) ([c0ac8bd](https://github.com/Altinn/dialogporten-frontend/commit/c0ac8bdccb6f2b5cb6b6b3e1a2a723d4078d98fc))


### Bug Fixes

* Redirect end user to Altinn landing page after logout ([#2534](https://github.com/Altinn/dialogporten-frontend/issues/2534)) ([8ddf2b2](https://github.com/Altinn/dialogporten-frontend/commit/8ddf2b2d553f19aeafe67cd8f05e62e98ce7d346))

## [1.55.1](https://github.com/Altinn/dialogporten-frontend/compare/v1.55.0...v1.55.1) (2025-08-22)


### Bug Fixes

* sort order for activity log + url in homepage redirect ([#2532](https://github.com/Altinn/dialogporten-frontend/issues/2532)) ([56aeb3f](https://github.com/Altinn/dialogporten-frontend/commit/56aeb3ff043cf358b5d446437af26263ebae9ec0))

## [1.55.0](https://github.com/Altinn/dialogporten-frontend/compare/v1.54.2...v1.55.0) (2025-08-22)


### Features

* change logo url in header ([#2525](https://github.com/Altinn/dialogporten-frontend/issues/2525)) ([10a3dab](https://github.com/Altinn/dialogporten-frontend/commit/10a3dab19ffe5713e72338207d81b01d8c835562))

## [1.54.2](https://github.com/Altinn/dialogporten-frontend/compare/v1.54.1...v1.54.2) (2025-08-21)


### Bug Fixes

* Change e2e test actor, fix tests ([#2520](https://github.com/Altinn/dialogporten-frontend/issues/2520)) ([fceb360](https://github.com/Altinn/dialogporten-frontend/commit/fceb36091feecf8154b3cce6297c639af0b2f4ad))

## [1.54.1](https://github.com/Altinn/dialogporten-frontend/compare/v1.54.0...v1.54.1) (2025-08-21)


### Bug Fixes

* improvements to accessbility: contextmenu and language picker now have keyboard navigation + introduce skip link ([#2514](https://github.com/Altinn/dialogporten-frontend/issues/2514)) ([69efab9](https://github.com/Altinn/dialogporten-frontend/commit/69efab9fb5ef1eb259780027898a0bb312f5e8e4))
* sorting of activity history ([#2512](https://github.com/Altinn/dialogporten-frontend/issues/2512)) ([a36d98b](https://github.com/Altinn/dialogporten-frontend/commit/a36d98bebca056f2e46a51514ed7983896580d05))

## [1.54.0](https://github.com/Altinn/dialogporten-frontend/compare/v1.53.1...v1.54.0) (2025-08-20)


### Features

* Fetching notificationSettings from Core API ([11c1b5f](https://github.com/Altinn/dialogporten-frontend/commit/11c1b5f188398aed3be91f8b6e3e5a524c48aef9))


### Bug Fixes

* Bump AC to v.0.37.0, remove double scrollbar ([#2508](https://github.com/Altinn/dialogporten-frontend/issues/2508)) ([5fe2408](https://github.com/Altinn/dialogporten-frontend/commit/5fe2408e650af718eb9bc5be8b7a7ae99691c578))
* ensure end-user transmissions are never marked as unread ([#2509](https://github.com/Altinn/dialogporten-frontend/issues/2509)) ([2985473](https://github.com/Altinn/dialogporten-frontend/commit/2985473ccabeec0a208e3ec8bf3deeb5b305bc1a))
* Hide sender filters with zero hits ([#2507](https://github.com/Altinn/dialogporten-frontend/issues/2507)) ([7614798](https://github.com/Altinn/dialogporten-frontend/commit/7614798722a09d90471258045249ef98d285073e))

## [1.53.1](https://github.com/Altinn/dialogporten-frontend/compare/v1.53.0...v1.53.1) (2025-08-19)


### Bug Fixes

* improve getActorProps handling of ServiceOwner vs PartyRepresentative ([#2499](https://github.com/Altinn/dialogporten-frontend/issues/2499)) ([b7c70f9](https://github.com/Altinn/dialogporten-frontend/commit/b7c70f9223c28714ab99abf05c08ec376094c580))
* remove count and alert for sidebar ([#2484](https://github.com/Altinn/dialogporten-frontend/issues/2484)) ([fb27169](https://github.com/Altinn/dialogporten-frontend/commit/fb27169dff68d36c3d1c236a18f05c13bdf881bf))
* revisions to plain langauge ([#2471](https://github.com/Altinn/dialogporten-frontend/issues/2471)) ([#2497](https://github.com/Altinn/dialogporten-frontend/issues/2497)) ([2d7506e](https://github.com/Altinn/dialogporten-frontend/commit/2d7506ed9365c2b183794353b471a370eab2242c))
* Sort by contentUpdatedAt in all inbox views ([#2495](https://github.com/Altinn/dialogporten-frontend/issues/2495)) ([03d080a](https://github.com/Altinn/dialogporten-frontend/commit/03d080a38356fc740d814c4bf768b51907469900))

## [1.53.0](https://github.com/Altinn/dialogporten-frontend/compare/v1.52.3...v1.53.0) (2025-08-15)


### Features

* Update AC-lib with new awaiting labels ([#2491](https://github.com/Altinn/dialogporten-frontend/issues/2491)) ([f87ff49](https://github.com/Altinn/dialogporten-frontend/commit/f87ff49aab06bea8f7c9514a624fa411d66af105))

## [1.52.3](https://github.com/Altinn/dialogporten-frontend/compare/v1.52.2...v1.52.3) (2025-08-14)


### Bug Fixes

* change kl to kl. as clock prefix for bm and nn ([#2479](https://github.com/Altinn/dialogporten-frontend/issues/2479)) ([fe6eae0](https://github.com/Altinn/dialogporten-frontend/commit/fe6eae0d19795b5984e7c3163b61d56ff6a18d60))
* simplify by always directing user to main entry on successful login ([#2471](https://github.com/Altinn/dialogporten-frontend/issues/2471)) ([dc77090](https://github.com/Altinn/dialogporten-frontend/commit/dc77090b95669c312a5ddf6e8054c1c848c3d89a))

## [1.52.2](https://github.com/Altinn/dialogporten-frontend/compare/v1.52.1...v1.52.2) (2025-08-12)


### Bug Fixes

* Disclaimers spacing and size ([75606c5](https://github.com/Altinn/dialogporten-frontend/commit/75606c5e76d06dec9904cfa837df92a6b12aae2c))
* prevent unnecessary initial fetch of saved searches ([#2431](https://github.com/Altinn/dialogporten-frontend/issues/2431)) ([22100da](https://github.com/Altinn/dialogporten-frontend/commit/22100dabc74174049d96c774721560bd1977b1ec))
* when previous data is being used for dialogs and a fetch is being done, it should show a loading indicator ([#2451](https://github.com/Altinn/dialogporten-frontend/issues/2451)) ([32ac64d](https://github.com/Altinn/dialogporten-frontend/commit/32ac64d5a43ab0cb8fead7f2799a0da25daf12f4))

## [1.52.1](https://github.com/Altinn/dialogporten-frontend/compare/v1.52.0...v1.52.1) (2025-08-11)


### Bug Fixes

* bump up AC-lib for virtualized list fix ([#2428](https://github.com/Altinn/dialogporten-frontend/issues/2428)) ([b988995](https://github.com/Altinn/dialogporten-frontend/commit/b9889954315eb1da584f6ff6910adb38eff3cdaf))
* Read by mark is now greyed if dialog is read by anyone ([#2426](https://github.com/Altinn/dialogporten-frontend/issues/2426)) ([2ceb5ba](https://github.com/Altinn/dialogporten-frontend/commit/2ceb5ba3d67e12722ddaed97c4d1a27f89f78452))

## [1.52.0](https://github.com/Altinn/dialogporten-frontend/compare/v1.51.2...v1.52.0) (2025-08-11)


### Features

* Add awaiting status to dialog filters ([#2418](https://github.com/Altinn/dialogporten-frontend/issues/2418)) ([22e0989](https://github.com/Altinn/dialogporten-frontend/commit/22e0989fd206e8437535faabe7922c2594bde5a4))
* add i18n query param for QA translation validation ([#2421](https://github.com/Altinn/dialogporten-frontend/issues/2421)) ([c885bfe](https://github.com/Altinn/dialogporten-frontend/commit/c885bfe921dd4556eec034dfd7a84ec1d8dfa1b0))

## [1.51.2](https://github.com/Altinn/dialogporten-frontend/compare/v1.51.1...v1.51.2) (2025-08-08)


### Bug Fixes

* maintain sidebar selection when viewing dialogs ([#2419](https://github.com/Altinn/dialogporten-frontend/issues/2419)) ([b81bf46](https://github.com/Altinn/dialogporten-frontend/commit/b81bf46c67f6e8fe2fab6289f718f44d80226e5e))

## [1.51.1](https://github.com/Altinn/dialogporten-frontend/compare/v1.51.0...v1.51.1) (2025-08-08)


### Bug Fixes

* bump a-c to latest to include logical keyboard navigation order in global layout ([#2417](https://github.com/Altinn/dialogporten-frontend/issues/2417)) ([fbfc017](https://github.com/Altinn/dialogporten-frontend/commit/fbfc0171837b69991d1973acad46739a026fca40))
* consist check for comparing if a saved search can be saved or not ([#2414](https://github.com/Altinn/dialogporten-frontend/issues/2414)) ([b6d006f](https://github.com/Altinn/dialogporten-frontend/commit/b6d006f2ed4dee331ea2df2b4a5b424e1c20e8a9))

## [1.51.0](https://github.com/Altinn/dialogporten-frontend/compare/v1.50.2...v1.51.0) (2025-08-07)


### Features

* Dialog is considered as sent based on systemLabel-sent ([#2406](https://github.com/Altinn/dialogporten-frontend/issues/2406)) ([94646e3](https://github.com/Altinn/dialogporten-frontend/commit/94646e388a0bcb7cd9345aee3e7680e856a57642))


### Bug Fixes

* Added missing transmission counts on Dialog Details ([2ab9847](https://github.com/Altinn/dialogporten-frontend/commit/2ab9847cf25daba2ee1bef6647c6e13069118508))
* incorrect badge color for trasnmissions in activity log ([#2402](https://github.com/Altinn/dialogporten-frontend/issues/2402)) ([ea1c072](https://github.com/Altinn/dialogporten-frontend/commit/ea1c072b9ff01c610e25724ac564d92a1492f7c8))
* Transmission sent/received count now showing correct numbers ([611d0f2](https://github.com/Altinn/dialogporten-frontend/commit/611d0f25364535f9c5caf6d5f93956aab0c79f5f))

## [1.50.2](https://github.com/Altinn/dialogporten-frontend/compare/v1.50.1...v1.50.2) (2025-08-06)


### Bug Fixes

* couple of missing aria attributes in search bar by upgrading to latest version of altinn-components ([#2390](https://github.com/Altinn/dialogporten-frontend/issues/2390)) ([ede71fb](https://github.com/Altinn/dialogporten-frontend/commit/ede71fb99bf57b007cadb023ff9018021ae59d30))

## [1.50.1](https://github.com/Altinn/dialogporten-frontend/compare/v1.50.0...v1.50.1) (2025-08-05)


### Bug Fixes

* Fixes saved search bug ([e092c73](https://github.com/Altinn/dialogporten-frontend/commit/e092c73d64ccb8aeeb899591f06bde41c48ec362))
* incorrect badge color ([#2385](https://github.com/Altinn/dialogporten-frontend/issues/2385)) ([97f4164](https://github.com/Altinn/dialogporten-frontend/commit/97f41640bad9ce4898cb7a7a904248f8ef7f6a2a))

## [1.50.0](https://github.com/Altinn/dialogporten-frontend/compare/v1.49.1...v1.50.0) (2025-08-05)


### Features

* **bff:** add /init-session endpoint for performance testing ([#2380](https://github.com/Altinn/dialogporten-frontend/issues/2380)) ([9d42a5f](https://github.com/Altinn/dialogporten-frontend/commit/9d42a5fec78b1799632c9760b57115c20e391988))

## [1.49.1](https://github.com/Altinn/dialogporten-frontend/compare/v1.49.0...v1.49.1) (2025-08-04)


### Bug Fixes

* ensure source map filenames matches build filenames ([#2375](https://github.com/Altinn/dialogporten-frontend/issues/2375)) ([760810b](https://github.com/Altinn/dialogporten-frontend/commit/760810bd607e2a791d9ca6a8464e664445142537))
* Giving list items a unique key prop ([d9d3fe7](https://github.com/Altinn/dialogporten-frontend/commit/d9d3fe78e08a0f204471bc5a9982f894ae4abd85))
* **infra:** ensure devs has access to source maps in appinsights ([#2357](https://github.com/Altinn/dialogporten-frontend/issues/2357)) ([9011d1c](https://github.com/Altinn/dialogporten-frontend/commit/9011d1c8e0ebddf26d03d0ec2390e2ec81b82143))
* prioritize emblem over logo for org avatar with generic logo as fallback ([#2379](https://github.com/Altinn/dialogporten-frontend/issues/2379)) ([83de458](https://github.com/Altinn/dialogporten-frontend/commit/83de458ad1baa39a6ebfacf5d0cdf9ae115edb7e))

## [1.49.0](https://github.com/Altinn/dialogporten-frontend/compare/v1.48.0...v1.49.0) (2025-07-30)


### Features

* Implement read/add/remove favorites from Core ([556a207](https://github.com/Altinn/dialogporten-frontend/commit/556a2074646903c517b2b6edaf6c4f8f1f1333e6))


### Bug Fixes

* Banner no longer covers filters on mobile ([6892d21](https://github.com/Altinn/dialogporten-frontend/commit/6892d216c4221fb7cc450bf31386a104ba0aa64d))
* Context menu is now opening modal ([#2368](https://github.com/Altinn/dialogporten-frontend/issues/2368)) ([3da84a8](https://github.com/Altinn/dialogporten-frontend/commit/3da84a853afaac6e9dddf94de82b7a0bd761e39b))
* Updated graphql files according to changes in DP schema ([1ca773a](https://github.com/Altinn/dialogporten-frontend/commit/1ca773a172f69694a9edd05cf2ac732c3ad9cd82))

## [1.48.0](https://github.com/Altinn/dialogporten-frontend/compare/v1.47.0...v1.48.0) (2025-07-23)


### Features

* Added partyUuid to parties ([334c30d](https://github.com/Altinn/dialogporten-frontend/commit/334c30d54ad9ad8d9edd0cd79e0fcef10bd55f0b))


### Bug Fixes

* Fix logo on dialog detailed view ([#2353](https://github.com/Altinn/dialogporten-frontend/issues/2353)) ([05a1702](https://github.com/Altinn/dialogporten-frontend/commit/05a170248d87a038b5821bec667b2e3dbebe2bcb))

## [1.47.0](https://github.com/Altinn/dialogporten-frontend/compare/v1.46.1...v1.47.0) (2025-07-22)


### Features

* Banner now without close/hide button. Updated text with translations. ([fd5f089](https://github.com/Altinn/dialogporten-frontend/commit/fd5f0893dbfc1950721aae3463732fad4038361a))
* Show number of sent/received transmissions ([50bd06f](https://github.com/Altinn/dialogporten-frontend/commit/50bd06f0a31453c365abcf3ae0413ad8bc3a1dda))
* Transmission will now be shown as read based on activities ([554f6d8](https://github.com/Altinn/dialogporten-frontend/commit/554f6d831b1178164456b2708cbeccf65e37eb62))


### Bug Fixes

* Filters calculating label dynamically based on all views and providing expected result ([#2348](https://github.com/Altinn/dialogporten-frontend/issues/2348)) ([af8b98d](https://github.com/Altinn/dialogporten-frontend/commit/af8b98dae8991e42cf32403c1a59ada32163b907))
* Filters now showing count label of all dialogs found ([#2341](https://github.com/Altinn/dialogporten-frontend/issues/2341)) ([afe5471](https://github.com/Altinn/dialogporten-frontend/commit/afe5471f6f7ada3bb6184ab93c2c7dcd21ec9be5))
* Update filters number label dynamically ([#2347](https://github.com/Altinn/dialogporten-frontend/issues/2347)) ([6fc506a](https://github.com/Altinn/dialogporten-frontend/commit/6fc506ad56e0fabcfa28dd7ad382029fe8560bcc))

## [1.46.1](https://github.com/Altinn/dialogporten-frontend/compare/v1.46.0...v1.46.1) (2025-07-11)


### Bug Fixes

* Org logo looks off on dialog list item ([#2338](https://github.com/Altinn/dialogporten-frontend/issues/2338)) ([e1180b1](https://github.com/Altinn/dialogporten-frontend/commit/e1180b152ae1a800cb73720ec3dbc9aa205dcc79))

## [1.46.0](https://github.com/Altinn/dialogporten-frontend/compare/v1.45.0...v1.46.0) (2025-07-11)


### Features

* Mark unread based on seenSinceLastContentUpdate ([#2330](https://github.com/Altinn/dialogporten-frontend/issues/2330)) ([dd0b79e](https://github.com/Altinn/dialogporten-frontend/commit/dd0b79e43f178935da49bc2ae47c2cbedb4c9eae))


### Bug Fixes

* **infra:** ensure correct role assignment for uploading source maps ([#2337](https://github.com/Altinn/dialogporten-frontend/issues/2337)) ([d4edaad](https://github.com/Altinn/dialogporten-frontend/commit/d4edaadb4f20fd71f49ee484af53c171db8eae11))

## [1.45.0](https://github.com/Altinn/dialogporten-frontend/compare/v1.44.0...v1.45.0) (2025-07-10)


### Features

* Added information to Archive and Bin ([5c5fd98](https://github.com/Altinn/dialogporten-frontend/commit/5c5fd98550b442a188509889826c23a9f9ec6897))


### Bug Fixes

* **infra:** ensure name is correctly formatted for storage-account ([54c4790](https://github.com/Altinn/dialogporten-frontend/commit/54c4790ac97979a944885d887cb000c0a91504f5))
* **infra:** ensure tags are correctly formatted for app insights ([2fdb849](https://github.com/Altinn/dialogporten-frontend/commit/2fdb849501cdc554d3a86600d4fc2e6fd85c2555))

## [1.44.0](https://github.com/Altinn/dialogporten-frontend/compare/v1.43.0...v1.44.0) (2025-07-08)


### Features

* Added hasUnopenedContent to dialog list view [#2230](https://github.com/Altinn/dialogporten-frontend/issues/2230) ([7d94562](https://github.com/Altinn/dialogporten-frontend/commit/7d94562c79216d71983d042c2e6f04572f2b8a77))
* Dialog list view now sorting by contentUpdatedAt prop ([#2231](https://github.com/Altinn/dialogporten-frontend/issues/2231)) ([eb20f60](https://github.com/Altinn/dialogporten-frontend/commit/eb20f6098e11a81def3093305f04daafc8a4e3ac))
* Update error page content ([#2321](https://github.com/Altinn/dialogporten-frontend/issues/2321)) ([df3ecaa](https://github.com/Altinn/dialogporten-frontend/commit/df3ecaab673d85b137eab562384f29ca1f5acba4))

## [1.43.0](https://github.com/Altinn/dialogporten-frontend/compare/v1.42.0...v1.43.0) (2025-07-04)


### Features

* add context menu to dialog list item with functionality for archiving and putting to bin ([#2316](https://github.com/Altinn/dialogporten-frontend/issues/2316)) ([4af10c1](https://github.com/Altinn/dialogporten-frontend/commit/4af10c1edc4ce960b8e30a03d78bc7682e672dc6))
* add seen by log details in modal from dialog list view ([#2318](https://github.com/Altinn/dialogporten-frontend/issues/2318)) ([6d8c24b](https://github.com/Altinn/dialogporten-frontend/commit/6d8c24b9126f432122548eb12cc1add0a766d9b2))
* Added filters to PartiesOverview and added Feature Toggle ([13e73c6](https://github.com/Altinn/dialogporten-frontend/commit/13e73c648ce26d637a51d7cb37720c8000f211f6))
* **orgs:** prioritize emblem over logo for org avatar with generic logo as fallback ([#2315](https://github.com/Altinn/dialogporten-frontend/issues/2315)) ([c2e5dc0](https://github.com/Altinn/dialogporten-frontend/commit/c2e5dc0b4eaa59c803ee46e061d401235fb2fe09))

## [1.42.0](https://github.com/Altinn/dialogporten-frontend/compare/v1.41.0...v1.42.0) (2025-07-03)


### Features

* add badge for archived and binned dialogs in listview and dialog details ([#2313](https://github.com/Altinn/dialogporten-frontend/issues/2313)) ([aa22156](https://github.com/Altinn/dialogporten-frontend/commit/aa2215606512c308d8930d56bef01cc3a9aaf83c))
* add error page and error boundary logic ([#2303](https://github.com/Altinn/dialogporten-frontend/issues/2303)) ([3fa233d](https://github.com/Altinn/dialogporten-frontend/commit/3fa233d5ea8e347d0ce88af13546a064da30d0dc))
* structural updates to transmissions and activities ([#2298](https://github.com/Altinn/dialogporten-frontend/issues/2298)) ([8163d8a](https://github.com/Altinn/dialogporten-frontend/commit/8163d8ad5b9ed463091251c9785e14030cbb9e95))


### Bug Fixes

* disable errorBoundary in dev ([#2312](https://github.com/Altinn/dialogporten-frontend/issues/2312)) ([92117d8](https://github.com/Altinn/dialogporten-frontend/commit/92117d830cdb3e4aa20ae7e69f0ca3c27272c6c5))
* Include senders from search params in filters ([#2301](https://github.com/Altinn/dialogporten-frontend/issues/2301)) ([32c38dd](https://github.com/Altinn/dialogporten-frontend/commit/32c38dd027ac44c881bbc8b5f4fb07e45f177d99))

## [1.41.0](https://github.com/Altinn/dialogporten-frontend/compare/v1.40.1...v1.41.0) (2025-06-26)


### Features

* add grant_access profil page ([#2291](https://github.com/Altinn/dialogporten-frontend/issues/2291)) ([87dd69f](https://github.com/Altinn/dialogporten-frontend/commit/87dd69ff5e9326a2ff042d6fd5a8681fdfed2fa3))


### Bug Fixes

* add mock for show more logic ([#2278](https://github.com/Altinn/dialogporten-frontend/issues/2278)) ([a927072](https://github.com/Altinn/dialogporten-frontend/commit/a92707201b34fc420a8542aa49aa21bca1bd2d36))

## [1.40.1](https://github.com/Altinn/dialogporten-frontend/compare/v1.40.0...v1.40.1) (2025-06-26)


### Bug Fixes

* exclude parent parties when user only has access to sub partieds from party list ([#2293](https://github.com/Altinn/dialogporten-frontend/issues/2293)) ([16ad4c1](https://github.com/Altinn/dialogporten-frontend/commit/16ad4c169e9e8ebdad68bf9ee3e32cab07f5fdcf))

## [1.40.0](https://github.com/Altinn/dialogporten-frontend/compare/v1.39.3...v1.40.0) (2025-06-26)


### Features

* add profile grant-access page ([#2265](https://github.com/Altinn/dialogporten-frontend/issues/2265)) ([eb7f80e](https://github.com/Altinn/dialogporten-frontend/commit/eb7f80e7861c1a04744ddbf1fe23914349240eeb))
* Implemented AC components, grouped favorites, design implementation ([#2228](https://github.com/Altinn/dialogporten-frontend/issues/2228)) ([4c3c95a](https://github.com/Altinn/dialogporten-frontend/commit/4c3c95a20850e764cf8030a9108a3aafc643b3bb))


### Bug Fixes

* **deps:** change (downgrade) missing cdn links that disappeared ([#2287](https://github.com/Altinn/dialogporten-frontend/issues/2287)) ([f2710e2](https://github.com/Altinn/dialogporten-frontend/commit/f2710e27a65e805bb322a8a28319157a46bfe42b))
* remove Altinn As from footer ([#2283](https://github.com/Altinn/dialogporten-frontend/issues/2283)) ([01e7eb9](https://github.com/Altinn/dialogporten-frontend/commit/01e7eb9ac95dd7b4cd5f766206fd1693f4ef4566))

## [1.39.3](https://github.com/Altinn/dialogporten-frontend/compare/v1.39.2...v1.39.3) (2025-06-23)


### Bug Fixes

* breaking changes from new-&gt;not_applicable and sent-&gt;awaiting ([#2261](https://github.com/Altinn/dialogporten-frontend/issues/2261)) ([a84d1e2](https://github.com/Altinn/dialogporten-frontend/commit/a84d1e271a8a30b95ff63ec853e65439ffcdefd4))
* update to be compatible with dialogporten-schema v 1.70.0-29be76e - summary is now nullable and interface for retrieving system labels and mutating them have changed ([f23a07c](https://github.com/Altinn/dialogporten-frontend/commit/f23a07c04056fae5f0460b02aaaaddb6e66bd506))
* update to latest version of altinn-components ([#2246](https://github.com/Altinn/dialogporten-frontend/issues/2246)) ([ec4d258](https://github.com/Altinn/dialogporten-frontend/commit/ec4d258dd524473beaa9b58bc2460c431330a3f7))
* use the new beta banner from altinn-components ([#2252](https://github.com/Altinn/dialogporten-frontend/issues/2252)) ([8b4265f](https://github.com/Altinn/dialogporten-frontend/commit/8b4265fe5bf7befaf7655a4d8194a92bcda3cdc9))

## [1.39.2](https://github.com/Altinn/dialogporten-frontend/compare/v1.39.1...v1.39.2) (2025-06-12)


### Bug Fixes

* missing saved search for other folders than inbox ([#2232](https://github.com/Altinn/dialogporten-frontend/issues/2232)) ([b06f703](https://github.com/Altinn/dialogporten-frontend/commit/b06f70363f478e9946c42fd0d307a54cb20bc5af))

## [1.39.1](https://github.com/Altinn/dialogporten-frontend/compare/v1.39.0...v1.39.1) (2025-06-11)


### Bug Fixes

* show counts only for contented that is fetched when filter is applied + group results ([#2225](https://github.com/Altinn/dialogporten-frontend/issues/2225)) ([530a663](https://github.com/Altinn/dialogporten-frontend/commit/530a663363a89bb673d0f32103680937dcaeb9ab))

## [1.39.0](https://github.com/Altinn/dialogporten-frontend/compare/v1.38.0...v1.39.0) (2025-06-10)


### Features

* Profile notifications dummy page ([#2197](https://github.com/Altinn/dialogporten-frontend/issues/2197)) ([c493deb](https://github.com/Altinn/dialogporten-frontend/commit/c493deb03c15f78865a0500d321c3b16b5f9d007))

## [1.38.0](https://github.com/Altinn/dialogporten-frontend/compare/v1.37.0...v1.38.0) (2025-06-06)


### Features

* Add dummy profile activity page ([#2209](https://github.com/Altinn/dialogporten-frontend/issues/2209)) ([4f68bdc](https://github.com/Altinn/dialogporten-frontend/commit/4f68bdc91f4dea2b7804571d688e4dc5d1b2e8c0))
* Added interim solution for actor favorite categories ([c7f198b](https://github.com/Altinn/dialogporten-frontend/commit/c7f198b519ea55cdfb29b319cc773c759b0da654))


### Bug Fixes

* remove quasi status DEFAULT from bookmark links ([#2220](https://github.com/Altinn/dialogporten-frontend/issues/2220)) ([474c014](https://github.com/Altinn/dialogporten-frontend/commit/474c01477f43cd96886911edf552a38163888ca8))

## [1.37.0](https://github.com/Altinn/dialogporten-frontend/compare/v1.36.1...v1.37.0) (2025-06-03)


### Features

* Profile settings page ([#2125](https://github.com/Altinn/dialogporten-frontend/issues/2125)) ([2f585f2](https://github.com/Altinn/dialogporten-frontend/commit/2f585f23f3d67f35ab4f224ce4e38393281377ec))


### Bug Fixes

* disable getting dialogs for parties over 20 and render state as inconclusive if so ([#2205](https://github.com/Altinn/dialogporten-frontend/issues/2205)) ([1c38f89](https://github.com/Altinn/dialogporten-frontend/commit/1c38f8995eb124737140f89cbc69a689fdfe8229))

## [1.36.1](https://github.com/Altinn/dialogporten-frontend/compare/v1.36.0...v1.36.1) (2025-05-30)


### Bug Fixes

* translation of sender to recipient word ([#2203](https://github.com/Altinn/dialogporten-frontend/issues/2203)) ([dc4b1ba](https://github.com/Altinn/dialogporten-frontend/commit/dc4b1ba7764b4caebd6fa01f7796bceb63f29b88))

## [1.36.0](https://github.com/Altinn/dialogporten-frontend/compare/v1.35.1...v1.36.0) (2025-05-28)


### Features

* **infra:** enable HA and higher SKU for postgresql ([#2195](https://github.com/Altinn/dialogporten-frontend/issues/2195)) ([5cfc71f](https://github.com/Altinn/dialogporten-frontend/commit/5cfc71f09e22ee0ce97b4643edd3ee6f0aeedb2e))


### Bug Fixes

* Fix tanstack query console errors ([#2194](https://github.com/Altinn/dialogporten-frontend/issues/2194)) ([7f9ee7a](https://github.com/Altinn/dialogporten-frontend/commit/7f9ee7a0759ecaa538546f38376ab3bd354faa3b))
* **infra:** add missing type for sku in postgresql ([#2198](https://github.com/Altinn/dialogporten-frontend/issues/2198)) ([a007a90](https://github.com/Altinn/dialogporten-frontend/commit/a007a908fee06e12d949e798104af5bb32ff5319))

## [1.35.1](https://github.com/Altinn/dialogporten-frontend/compare/v1.35.0...v1.35.1) (2025-05-23)


### Bug Fixes

* **infra:** avoid issues with private link in app gateway ([#2184](https://github.com/Altinn/dialogporten-frontend/issues/2184)) ([c8e9284](https://github.com/Altinn/dialogporten-frontend/commit/c8e9284a60d4c095ad752dc47e340f3799e64596))
* **infra:** use correct param for workload profile for apps ([#2186](https://github.com/Altinn/dialogporten-frontend/issues/2186)) ([469dc10](https://github.com/Altinn/dialogporten-frontend/commit/469dc107352bd1587bb3b318d9d8891c506805b8))

## [1.35.0](https://github.com/Altinn/dialogporten-frontend/compare/v1.34.4...v1.35.0) (2025-05-23)


### Features

* **infra:** enable workload profiles for CAE ([#2154](https://github.com/Altinn/dialogporten-frontend/issues/2154)) ([a496c84](https://github.com/Altinn/dialogporten-frontend/commit/a496c848a44ee103e0d8192b28aa1d93d9d5b497))


### Bug Fixes

* Fix breaking changes after ac v28 update ([#2177](https://github.com/Altinn/dialogporten-frontend/issues/2177)) ([bb41503](https://github.com/Altinn/dialogporten-frontend/commit/bb415039ff0bedcaa567abb62d5a621024029150))
* **infra:** avoid using containerappenv subnet for private link in app gateway ([#2183](https://github.com/Altinn/dialogporten-frontend/issues/2183)) ([d035bd0](https://github.com/Altinn/dialogporten-frontend/commit/d035bd0a5d68b71d93a7ddef2a03fb985c915722))
* **infra:** set default workload profile for CAEs ([#2182](https://github.com/Altinn/dialogporten-frontend/issues/2182)) ([2682b14](https://github.com/Altinn/dialogporten-frontend/commit/2682b14e55a2c8a1162fa5eee90a4615b61e0ee4))

## [1.34.4](https://github.com/Altinn/dialogporten-frontend/compare/v1.34.3...v1.34.4) (2025-05-22)


### Bug Fixes

* Display raw ssn from profile api ([#2176](https://github.com/Altinn/dialogporten-frontend/issues/2176)) ([9daa7f1](https://github.com/Altinn/dialogporten-frontend/commit/9daa7f1405c2dfa109f90fcdb90abdbb4d6218aa))
* sanitize html tags for embedable content + doc ([#2174](https://github.com/Altinn/dialogporten-frontend/issues/2174)) ([b3a2d12](https://github.com/Altinn/dialogporten-frontend/commit/b3a2d12976cf0d28ecb022015ba92df451ea0e08))

## [1.34.3](https://github.com/Altinn/dialogporten-frontend/compare/v1.34.2...v1.34.3) (2025-05-19)


### Bug Fixes

* use idp sid instead of session id for destroying session correctly ([#2163](https://github.com/Altinn/dialogporten-frontend/issues/2163)) ([05610d1](https://github.com/Altinn/dialogporten-frontend/commit/05610d1adc1c4f0cdcbeea8407589a4e72273d5d))

## [1.34.2](https://github.com/Altinn/dialogporten-frontend/compare/v1.34.1...v1.34.2) (2025-05-19)


### Bug Fixes

* destroy current session if found directly - terminated session immediately ([#2159](https://github.com/Altinn/dialogporten-frontend/issues/2159)) ([d34a416](https://github.com/Altinn/dialogporten-frontend/commit/d34a416fa0df2ef6fbfe02430ddc314760e75580))

## [1.34.1](https://github.com/Altinn/dialogporten-frontend/compare/v1.34.0...v1.34.1) (2025-05-16)


### Bug Fixes

* clear cookie (if present) after destroying session for front channel logout ([#2155](https://github.com/Altinn/dialogporten-frontend/issues/2155)) ([518092a](https://github.com/Altinn/dialogporten-frontend/commit/518092a794b72b57f2054eea011c2ab8c2f6da5d))
* suggested order order + query will produce the same outcome ([#2153](https://github.com/Altinn/dialogporten-frontend/issues/2153)) ([6268645](https://github.com/Altinn/dialogporten-frontend/commit/6268645e4a368c6f86681990fedb9cb927e55937))

## [1.34.0](https://github.com/Altinn/dialogporten-frontend/compare/v1.33.1...v1.34.0) (2025-05-15)


### Features

* Scroll to previous position on going back from dialog details ([#2141](https://github.com/Altinn/dialogporten-frontend/issues/2141)) ([7987abe](https://github.com/Altinn/dialogporten-frontend/commit/7987abeb9c24d6fc310847091c540c01883d22f5))


### Bug Fixes

* ensure fresh dialog token by setting refetch interval of maximum 10 minutes ([#2142](https://github.com/Altinn/dialogporten-frontend/issues/2142)) ([b410039](https://github.com/Altinn/dialogporten-frontend/commit/b4100390f89ca7415561995f63f8db2c1377326d))

## [1.33.1](https://github.com/Altinn/dialogporten-frontend/compare/v1.33.0...v1.33.1) (2025-05-12)


### Bug Fixes

* remove trailing slash in uri for issuer check ([#2137](https://github.com/Altinn/dialogporten-frontend/issues/2137)) ([f49faae](https://github.com/Altinn/dialogporten-frontend/commit/f49faae9aac6e8917517fe08e81dc4f024774688))

## [1.33.0](https://github.com/Altinn/dialogporten-frontend/compare/v1.32.1...v1.33.0) (2025-05-09)


### Features

* add route for front channel logout responsibility ([#2134](https://github.com/Altinn/dialogporten-frontend/issues/2134)) ([0085f1e](https://github.com/Altinn/dialogporten-frontend/commit/0085f1efa6933058ce6fa95474354d0e048bc7ac))

## [1.32.1](https://github.com/Altinn/dialogporten-frontend/compare/v1.32.0...v1.32.1) (2025-05-09)


### Bug Fixes

* Fix mobile actor list styles ([#2132](https://github.com/Altinn/dialogporten-frontend/issues/2132)) ([a603be7](https://github.com/Altinn/dialogporten-frontend/commit/a603be717147a03ce5a1549b81e0ea54863444b4))

## [1.32.0](https://github.com/Altinn/dialogporten-frontend/compare/v1.31.0...v1.32.0) (2025-05-09)


### Features

* Added profile data to Actor page. ([00bb414](https://github.com/Altinn/dialogporten-frontend/commit/00bb4141cf2fbff74c7b9a16c9f1df9537bb3a98))


### Bug Fixes

* Make actor lists responsive ([#2130](https://github.com/Altinn/dialogporten-frontend/issues/2130)) ([f8bcc33](https://github.com/Altinn/dialogporten-frontend/commit/f8bcc3384a8b19b1301fe55b882c4ddeda14ab99))

## [1.31.0](https://github.com/Altinn/dialogporten-frontend/compare/v1.30.2...v1.31.0) (2025-05-06)


### Features

* support upgrade of security level when needed for content ([#2122](https://github.com/Altinn/dialogporten-frontend/issues/2122)) ([1247bd5](https://github.com/Altinn/dialogporten-frontend/commit/1247bd5bda4ff643af0550a8ea67e415e5ca71fc))

## [1.30.2](https://github.com/Altinn/dialogporten-frontend/compare/v1.30.1...v1.30.2) (2025-05-06)


### Bug Fixes

* Add links to profile dashboard cards, fix styling ([#2120](https://github.com/Altinn/dialogporten-frontend/issues/2120)) ([cb0c26b](https://github.com/Altinn/dialogporten-frontend/commit/cb0c26bf9c40dc0623dc3ebbc8aede105656186f))

## [1.30.1](https://github.com/Altinn/dialogporten-frontend/compare/v1.30.0...v1.30.1) (2025-05-05)


### Bug Fixes

* keep query params when navigated to inbox upon dialog delete ([#2118](https://github.com/Altinn/dialogporten-frontend/issues/2118)) ([65e77e6](https://github.com/Altinn/dialogporten-frontend/commit/65e77e67df8923ff0f0dd3364bcbd2fb1514574d))

## [1.30.0](https://github.com/Altinn/dialogporten-frontend/compare/v1.29.1...v1.30.0) (2025-05-05)


### Features

* profile landing page layout ([#2088](https://github.com/Altinn/dialogporten-frontend/issues/2088)) ([2559985](https://github.com/Altinn/dialogporten-frontend/commit/2559985d04d74e3db35f223f0b9cb5ac5625d544))


### Bug Fixes

* add missing translations for query drafts ([#2109](https://github.com/Altinn/dialogporten-frontend/issues/2109)) ([a61742b](https://github.com/Altinn/dialogporten-frontend/commit/a61742bdd5da37411554dbdc49a7a6e9728372f9))
* bumpt to latest version of ac including fix badge height to be fixed ([#2116](https://github.com/Altinn/dialogporten-frontend/issues/2116)) ([09bbab9](https://github.com/Altinn/dialogporten-frontend/commit/09bbab96f0992d3fc717b7b2ce3110e14556d602))
* Display full SSN and fix translations ([#2115](https://github.com/Altinn/dialogporten-frontend/issues/2115)) ([821ddf5](https://github.com/Altinn/dialogporten-frontend/commit/821ddf5f215ba4d11d745f3262e8b5aa1bf37c16))

## [1.29.1](https://github.com/Altinn/dialogporten-frontend/compare/v1.29.0...v1.29.1) (2025-04-30)


### Bug Fixes

* bump ac to 0.24.4 containing fix to prevent unneccessary reload of page on enter in search bar when item is rendered as link ([#2093](https://github.com/Altinn/dialogporten-frontend/issues/2093)) ([16db6e6](https://github.com/Altinn/dialogporten-frontend/commit/16db6e6950ea8a74ffae34b78c9cd14dcbfa0762))

## [1.29.0](https://github.com/Altinn/dialogporten-frontend/compare/v1.28.0...v1.29.0) (2025-04-29)


### Features

* scalable faceted search ([#2052](https://github.com/Altinn/dialogporten-frontend/issues/2052)) ([48f03cf](https://github.com/Altinn/dialogporten-frontend/commit/48f03cf7eaa31aa599b98c68b73d4eddf19710d7))

## [1.28.0](https://github.com/Altinn/dialogporten-frontend/compare/v1.27.0...v1.28.0) (2025-04-28)


### Features

* Added routes and skeleton for further development of profile pages ([d1c19a8](https://github.com/Altinn/dialogporten-frontend/commit/d1c19a88bc2ee82c9bfddbeb98e32a6e01bd6b4e))

## [1.27.0](https://github.com/Altinn/dialogporten-frontend/compare/v1.26.0...v1.27.0) (2025-04-23)


### Features

* Added fetching of profile data from Core platform API ([346ea27](https://github.com/Altinn/dialogporten-frontend/commit/346ea27839935eae203630efd20e2f5e1d2a5b6c))
* **infra:** enable HA for container app envs ([#2019](https://github.com/Altinn/dialogporten-frontend/issues/2019)) ([989a5d1](https://github.com/Altinn/dialogporten-frontend/commit/989a5d1e97012d471ffde21f50c88d85e0f237a9))


### Bug Fixes

* add isLoading to dialogList ([#2062](https://github.com/Altinn/dialogporten-frontend/issues/2062)) ([66d2fb0](https://github.com/Altinn/dialogporten-frontend/commit/66d2fb0a91d69f0c8822beb35a37b564d9e220a5))
* **infra:** ensure only relevant envs has CAE HA ([#2066](https://github.com/Altinn/dialogporten-frontend/issues/2066)) ([bb76c60](https://github.com/Altinn/dialogporten-frontend/commit/bb76c60355fab886f0dc89890acbf3f7ac524eb0))
* **infra:** ensure vm version is supported by auto vm patching ([#2064](https://github.com/Altinn/dialogporten-frontend/issues/2064)) ([d27e869](https://github.com/Altinn/dialogporten-frontend/commit/d27e86941f00e12e8d023e3cf5ca53344f866767))
* **infra:** upgrade os version for virtual machines ([#2061](https://github.com/Altinn/dialogporten-frontend/issues/2061)) ([05903ad](https://github.com/Altinn/dialogporten-frontend/commit/05903ad0705b596be9fc34a7e9d64df3eb53f5fc))

## [1.26.0](https://github.com/Altinn/dialogporten-frontend/compare/v1.25.0...v1.26.0) (2025-04-14)


### Features

* Add language picker support, add nynorsk translation ([#2034](https://github.com/Altinn/dialogporten-frontend/issues/2034)) ([c18fe8e](https://github.com/Altinn/dialogporten-frontend/commit/c18fe8e961864c2a49579f57413309ec89134023))
* Added interim solution for storing actor favorites in BFF ([7189d91](https://github.com/Altinn/dialogporten-frontend/commit/7189d91d488118e8c5cbb023c0de02a0b5fcd4a8))
* Added rough draft of actors list, mainly to merge favorite functionality ([39fe61c](https://github.com/Altinn/dialogporten-frontend/commit/39fe61cf46b0640d1befecf6bc155f642a315174))
* support fetch more ([#2042](https://github.com/Altinn/dialogporten-frontend/issues/2042)) ([0788b6a](https://github.com/Altinn/dialogporten-frontend/commit/0788b6afbc02ba6339fed72fdd69923c8983849a))


### Bug Fixes

* use ds components from altinn-components instead of from ds directly ([#2047](https://github.com/Altinn/dialogporten-frontend/issues/2047)) ([f871be0](https://github.com/Altinn/dialogporten-frontend/commit/f871be02406e036e9927eaa7a086e299d1d6585e))

## [1.25.0](https://github.com/Altinn/dialogporten-frontend/compare/v1.24.3...v1.25.0) (2025-04-07)


### Features

* add actors to activites and translate missing activity types ([#2020](https://github.com/Altinn/dialogporten-frontend/issues/2020)) ([a44ad78](https://github.com/Altinn/dialogporten-frontend/commit/a44ad787004731b051e20bbbbd62fc5af80b1cdb))

## [1.24.3](https://github.com/Altinn/dialogporten-frontend/compare/v1.24.2...v1.24.3) (2025-04-04)


### Bug Fixes

* change sort order for items in dialog history for activities ([#2016](https://github.com/Altinn/dialogporten-frontend/issues/2016)) ([4a6098c](https://github.com/Altinn/dialogporten-frontend/commit/4a6098cdc60e5408646c01f140c3d0c44cb74acb))
* **deps:** update dependency @opentelemetry/instrumentation-fastify to v0.45.0 ([#1851](https://github.com/Altinn/dialogporten-frontend/issues/1851)) ([b803a8a](https://github.com/Altinn/dialogporten-frontend/commit/b803a8a1724b8f1e456b5d09c98e04ea4a1ac93a))
* **deps:** update dependency @opentelemetry/instrumentation-graphql to v0.48.0 ([#1852](https://github.com/Altinn/dialogporten-frontend/issues/1852)) ([3f92293](https://github.com/Altinn/dialogporten-frontend/commit/3f92293b273d18f40ef45a263d8f961607eb27cd))
* **deps:** update dependency @opentelemetry/instrumentation-ioredis to v0.48.0 ([#1901](https://github.com/Altinn/dialogporten-frontend/issues/1901)) ([5f91fe0](https://github.com/Altinn/dialogporten-frontend/commit/5f91fe01da74f55ff753955e9f4d0029ae629676))

## [1.24.2](https://github.com/Altinn/dialogporten-frontend/compare/v1.24.1...v1.24.2) (2025-04-03)


### Bug Fixes

* disregard fce user is not authorized to access ([#2006](https://github.com/Altinn/dialogporten-frontend/issues/2006)) ([46b905e](https://github.com/Altinn/dialogporten-frontend/commit/46b905e9883962ae82cdf4a9cd7f7ce15228f2de))

## [1.24.1](https://github.com/Altinn/dialogporten-frontend/compare/v1.24.0...v1.24.1) (2025-04-02)


### Bug Fixes

* reduce requests to fce and increase staale time for dialog by id requests ([#2003](https://github.com/Altinn/dialogporten-frontend/issues/2003)) ([8bd5dea](https://github.com/Altinn/dialogporten-frontend/commit/8bd5dea3cd3b12f795ac0c8c5c3ebe74905839d4))

## [1.24.0](https://github.com/Altinn/dialogporten-frontend/compare/v1.23.0...v1.24.0) (2025-04-01)


### Features

* Replace Activities with DialogHistory ([#1996](https://github.com/Altinn/dialogporten-frontend/issues/1996)) ([d91ffdb](https://github.com/Altinn/dialogporten-frontend/commit/d91ffdb792433e5712b7f52f38bc35dab0a57bef))


### Bug Fixes

* **infra:** ensure we enable periodic assessment updates for ssh-jumpers ([#1994](https://github.com/Altinn/dialogporten-frontend/issues/1994)) ([cb522eb](https://github.com/Altinn/dialogporten-frontend/commit/cb522eb89ef52c93f8d240e2dfa6bda78c1de0cd))

## [1.23.0](https://github.com/Altinn/dialogporten-frontend/compare/v1.22.1...v1.23.0) (2025-03-28)


### Features

* Enable virtualization for accounts lists ([#1992](https://github.com/Altinn/dialogporten-frontend/issues/1992)) ([f64347f](https://github.com/Altinn/dialogporten-frontend/commit/f64347f784976fefe749c8b0c3aa1028b5b751fb))

## [1.22.1](https://github.com/Altinn/dialogporten-frontend/compare/v1.22.0...v1.22.1) (2025-03-25)


### Bug Fixes

* **infra:** enable JIT for ssh-jumpers ([#1984](https://github.com/Altinn/dialogporten-frontend/issues/1984)) ([d711de3](https://github.com/Altinn/dialogporten-frontend/commit/d711de3989aff5f2a2a588f16b3c9591f55d5b80))
* **infra:** separate subnet for ssh jumper with restricted rules ([#1982](https://github.com/Altinn/dialogporten-frontend/issues/1982)) ([f2b9309](https://github.com/Altinn/dialogporten-frontend/commit/f2b9309a1592f914d46f9bdcb3b6f84f7e55c33f))
* prevent duplicate entries of searching for same sender ([#1987](https://github.com/Altinn/dialogporten-frontend/issues/1987)) ([a9cae4f](https://github.com/Altinn/dialogporten-frontend/commit/a9cae4fb1f416b0af22be0e212533c14cb74c84b))

## [1.22.0](https://github.com/Altinn/dialogporten-frontend/compare/v1.21.1...v1.22.0) (2025-03-25)


### Features

* Display transmissions as DialogHistory ([#1969](https://github.com/Altinn/dialogporten-frontend/issues/1969)) ([6793351](https://github.com/Altinn/dialogporten-frontend/commit/6793351a7dfe1b687b08ce1d76291cadb2ed51d3))

## [1.21.1](https://github.com/Altinn/dialogporten-frontend/compare/v1.21.0...v1.21.1) (2025-03-17)


### Bug Fixes

* update ac to 21.6, fix filtering of gui actions ([#1959](https://github.com/Altinn/dialogporten-frontend/issues/1959)) ([5eeda04](https://github.com/Altinn/dialogporten-frontend/commit/5eeda04571a800709283dbfbe378366eb57210aa))

## [1.21.0](https://github.com/Altinn/dialogporten-frontend/compare/v1.20.6...v1.21.0) (2025-03-14)


### Features

* Added integrity check for Altinn CDN css file ([d8233c1](https://github.com/Altinn/dialogporten-frontend/commit/d8233c1422b09ed041117107515c0abc5c9d529e))
* Exclude Parent Parties When Only Access to Sub-Parties ([a356892](https://github.com/Altinn/dialogporten-frontend/commit/a3568924684a99fdb1a851c2a2e55ce4f9d1c8dd))


### Bug Fixes

* Add hidden prop to guiActions mapping, update altinn components ([#1955](https://github.com/Altinn/dialogporten-frontend/issues/1955)) ([c7f7845](https://github.com/Altinn/dialogporten-frontend/commit/c7f7845d4ce1e40a4cd13c676e2c4be37fca6fbf))
* update to v. 0.21.4 of altinn-components without font imports from altinn cdn ([#1949](https://github.com/Altinn/dialogporten-frontend/issues/1949)) ([7e13aef](https://github.com/Altinn/dialogporten-frontend/commit/7e13aef6f5d355da0757b2b51440a7cacbd7995c))

## [1.20.6](https://github.com/Altinn/dialogporten-frontend/compare/v1.20.5...v1.20.6) (2025-03-13)


### Bug Fixes

* The numbers in the 'actor menu' do not match either the new or the total number of dialogues ([#1945](https://github.com/Altinn/dialogporten-frontend/issues/1945)) ([159444e](https://github.com/Altinn/dialogporten-frontend/commit/159444e87096e07ae39493274af3ef88051c4261))

## [1.20.5](https://github.com/Altinn/dialogporten-frontend/compare/v1.20.4...v1.20.5) (2025-03-13)


### Bug Fixes

* check for if filter already was saved ignored fromView property ([#1941](https://github.com/Altinn/dialogporten-frontend/issues/1941)) ([f34733c](https://github.com/Altinn/dialogporten-frontend/commit/f34733cbb7414e4693dab527844ed033be090af8))
* Fix grouping dialogs by updatedAt, add sorting dialogs in groups by updatedAt ([#1933](https://github.com/Altinn/dialogporten-frontend/issues/1933)) ([b008c31](https://github.com/Altinn/dialogporten-frontend/commit/b008c31d44319cd264a99acf209abb57b5719b51))

## [1.20.4](https://github.com/Altinn/dialogporten-frontend/compare/v1.20.3...v1.20.4) (2025-03-10)


### Bug Fixes

* Hide delete gui action if systemLabel is not BIN ([#1925](https://github.com/Altinn/dialogporten-frontend/issues/1925)) ([1f9ddce](https://github.com/Altinn/dialogporten-frontend/commit/1f9ddce039c6b204620fe277a6ea0042cf2d8c92))

## [1.20.3](https://github.com/Altinn/dialogporten-frontend/compare/v1.20.2...v1.20.3) (2025-03-10)


### Bug Fixes

* show technical error with link to log out if user has no profile ([#1926](https://github.com/Altinn/dialogporten-frontend/issues/1926)) ([7093161](https://github.com/Altinn/dialogporten-frontend/commit/7093161f875c810c82da57fcf40f7c74c5fbead7))

## [1.20.2](https://github.com/Altinn/dialogporten-frontend/compare/v1.20.1...v1.20.2) (2025-03-10)


### Bug Fixes

* ensure filters are active in Toolbar on reload of state ([#1922](https://github.com/Altinn/dialogporten-frontend/issues/1922)) ([a22689a](https://github.com/Altinn/dialogporten-frontend/commit/a22689a6569b92dcd201cfd30de6ae9a3d240684))
* Remove search parameters if searh value is empty ([#1916](https://github.com/Altinn/dialogporten-frontend/issues/1916)) ([589804d](https://github.com/Altinn/dialogporten-frontend/commit/589804dabafc06fbd747e0e4775c9180f7da5771))

## [1.20.1](https://github.com/Altinn/dialogporten-frontend/compare/v1.20.0...v1.20.1) (2025-03-07)


### Bug Fixes

* issues with dialog actions with click away not working and primary button in combo button not being triggered ([#1915](https://github.com/Altinn/dialogporten-frontend/issues/1915)) ([630a292](https://github.com/Altinn/dialogporten-frontend/commit/630a2926ac7ac558321450a3fab154900345c78f))
* Refetch data on going back from dialog, avoid unnecessary request when only org is provided ([#1903](https://github.com/Altinn/dialogporten-frontend/issues/1903)) ([b51442a](https://github.com/Altinn/dialogporten-frontend/commit/b51442a45e15d0f1d51dda33d38883138ef2a0cd))

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
