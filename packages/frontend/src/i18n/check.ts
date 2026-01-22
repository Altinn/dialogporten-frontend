import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CI = process.env.CI === 'true';

const directoryPath = path.join(__dirname, './resources/');
const masterFileName = 'nb.json';

const args = process.argv.slice(2);
const sortKeys = args.includes('--sort');

const loadJsonFile = (filePath: string): Record<string, string> => {
  const rawData = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(rawData);
};

const saveJsonFile = (filePath: string, data: object) => {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};

const getJsonFiles = (dir: string): string[] => {
  return fs.readdirSync(dir).filter((file) => file.endsWith('.json'));
};

const compareKeys = (masterKeys: string[], targetKeys: string[]): string[] => {
  return masterKeys.filter((key) => !targetKeys.includes(key));
};

const main = () => {
  const masterFilePath = path.join(directoryPath, masterFileName);
  const masterData = loadJsonFile(masterFilePath);
  const masterKeys = Object.keys(masterData).sort((a, b) => a.localeCompare(b));

  const jsonFiles = getJsonFiles(directoryPath);

  const warnings: { [key: string]: string[] } = {};
  let hasMissingKeys = false;

  for (const file of jsonFiles) {
    const filePath = path.join(directoryPath, file);
    const data = loadJsonFile(filePath);
    const keys = Object.keys(data);

    if (sortKeys) {
      const sortedData: { [key: string]: string } = {};
      for (const key of keys.sort((a, b) => a.localeCompare(b))) {
        sortedData[key] = data[key];
      }
      saveJsonFile(filePath, sortedData);
    }

    if (file === masterFileName) {
      continue;
    }

    const missingKeys = compareKeys(masterKeys, keys).sort((a, b) => a.localeCompare(b));

    if (missingKeys.length > 0) {
      warnings[file] = missingKeys;
      hasMissingKeys = true;
    }
  }

  for (const [file, missingKeys] of Object.entries(warnings)) {
    console.warn(`${file} is missing translations for the following keys: \n  ${missingKeys.join(',\n  ')}`);
  }

  if (hasMissingKeys && CI) {
    process.exit(1);
  }
};

main();
