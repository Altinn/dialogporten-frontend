/*
 * Get the base URL for arbeidsflate (AF) based on the environment.
 * @returns {string} - The base URL for AF.
 */
export const afUrl = (() => {
  switch (__ENV.ENVIRONMENT) {
    case 'yt':
      return 'https://af.yt.altinn.cloud/';
    case 'tt':
      return 'https://af.tt.altinn.no/';
    case 'at':
      return 'https://af.at.altinn.cloud/';
    default:
      return 'https://af.yt.altinn.cloud/';
  }
})();