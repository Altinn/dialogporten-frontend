/**
 * Same as the base feature flags but with the AccountNavigator disabled, so that
 * exceeding the party limit has no paginator fallback and the party-limit notice
 * must be shown instead.
 */
export const features = {
  'dialogporten.disableFlipNamesPatch': false,
  'inbox.enableAltinn2Messages': true,
  'inbox.enableAlertBanner': false,
  'dialogporten.disableSubscriptions': false,
  'inbox.accountNavigatorEnabled': false,
  'SI.emailAccount.enableConnectLink': true,
  'profil.enableSIPhoneEdit': true,
};
