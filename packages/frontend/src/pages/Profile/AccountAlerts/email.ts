const EMAIL_REGEX =
  /^(("[^"]+")|(([a-zA-Z0-9!#$%&'*+\-=?^_`{|}~])+(\.([a-zA-Z0-9!#$%&'*+\-=?^_`{|}~])+)*))@((((([a-zA-Z0-9æøåÆØÅ]([a-zA-Z0-9\-æøåÆØÅ]{0,61})[a-zA-Z0-9æøåÆØÅ]\.)|[a-zA-Z0-9æøåÆØÅ]\.){1,9})([a-zA-Z]{2,14}))|((\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})))$/;

export const isValidEmail = (value: string): boolean => EMAIL_REGEX.test(value.trim());
