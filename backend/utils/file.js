import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const DATA_DIR = path.join(__dirname, '..', 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR);
}

export const GITA_DATA_PATH = path.join(__dirname, '..', 'gita_data.json');
export const REFLECTIONS_CACHE_PATH = path.join(DATA_DIR, 'reflections.json');

// Initialize local JSON DB files
export const initFile = (filePath, defaultData) => {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2));
  }
};

initFile(REFLECTIONS_CACHE_PATH, {});

// Read data helper
export const readData = async (filePath) => {
  try {
    const data = await fs.promises.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (e) {
    console.error(`Error reading ${filePath}`, e);
    return [];
  }
};

// Write data helper
export const writeData = async (filePath, data) => {
  try {
    await fs.promises.writeFile(filePath, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error(`Error writing ${filePath}`, e);
  }
};
