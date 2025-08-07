/**
 * Utility function to read a CSV file and return its contents as an array of objects.
 */
import papaparse  from 'https://jslib.k6.io/papaparse/5.1.1/index.js';

/**
 * This function reads a CSV file and returns its contents as an array of objects.
 * @param {T} filename 
 * @returns 
 */
export function readCsv(filename) {
    try {
        return papaparse.parse(open(filename), { header: true, skipEmptyLines: true }).data;
    } catch (error) {
        console.log(`Error reading CSV file: ${error}`);
        return [];
    }
}