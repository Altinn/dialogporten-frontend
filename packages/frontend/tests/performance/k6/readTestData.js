import papaparse from 'https://jslib.k6.io/papaparse/5.1.1/index.js';
import { SharedArray } from 'k6/data';

function readCsv(filename) {
  try {
    return papaparse.parse(open(filename), { header: true, skipEmptyLines: true }).data;
  } catch (error) {
    console.log(`Error reading CSV file: ${error}`);
    return [];
  }
}

const filenameEndusers = "testData20.csv";
export const endUsers = new SharedArray('endUsers', function () {
  return readCsv(filenameEndusers);
});

export function endUsersPart(totalVus, vuId) {
  const endUsersLength = endUsers.length;
  if (totalVus == 1) {
      return endUsers.slice(0, endUsersLength);
  }
  let usersPerVU = Math.floor(endUsersLength / totalVus);
  let extras = endUsersLength % totalVus;
  let ixStart = (vuId-1) * usersPerVU;
  if (vuId <= extras) {
      usersPerVU++;
      ixStart += vuId - 1;
  }
  else {
      ixStart += extras;
  }
  return endUsers.slice(ixStart, ixStart + usersPerVU);
}

export function setup() {
  const totalVus = __ENV.VUS;;
  let parts = [];
  for (let i = 1; i <= totalVus; i++) {
      parts.push(endUsersPart(totalVus, i));
  }
  return parts;
}


