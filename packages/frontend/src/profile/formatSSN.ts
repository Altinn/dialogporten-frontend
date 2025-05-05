export function formatNorwegianSSN(ssn: string | null | undefined): string {
  if (!ssn || !/^\d{11}$/.test(ssn)) {
    return 'Invalid SSN';
  }

  const day = ssn.slice(4, 6);
  const month = ssn.slice(2, 4);
  const year = ssn.slice(0, 2);
  const individualNumber = ssn.slice(6);
  const yearNumber = Number.parseInt(year, 10);
  const individNumber = Number.parseInt(individualNumber, 10);

  let fullYear: number;
  if (individNumber >= 0 && individNumber <= 499) {
    fullYear = 1900 + yearNumber;
  } else if (individNumber >= 500 && individNumber <= 749 && yearNumber >= 54) {
    fullYear = 1800 + yearNumber;
  } else if (individNumber >= 500 && individNumber <= 999 && yearNumber >= 0 && yearNumber <= 39) {
    fullYear = 2000 + yearNumber;
  } else if (individNumber >= 900 && individNumber <= 999 && yearNumber >= 40) {
    fullYear = 1900 + yearNumber;
  } else {
    fullYear = 1900 + yearNumber;
  }

  return `${day}.${month}.${fullYear} ${individNumber}`;
}
