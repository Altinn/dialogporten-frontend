import papaparse  from 'https://jslib.k6.io/papaparse/5.1.1/index.js';


export function readCsv(filename) {
    try {
        return papaparse.parse(open(filename), { header: true, skipEmptyLines: true }).data;
    } catch (error) {
        console.log(`Error reading CSV file: ${error}`);
        return [];
    }
}