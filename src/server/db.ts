import fs from 'fs/promises';
import path from 'path';

const DATA_PATH = path.join(__dirname, '../../data');

export const db = {
    async read(fileName: string) {
        const data = await fs.readFile(path.join(DATA_PATH, `${fileName}.json`), 'utf-8');
        return JSON.parse(data);
    },
    async write(fileName: string, data: any) {
        await fs.writeFile(path.join(DATA_PATH, `${fileName}.json`), JSON.stringify(data, null, 2));
    }
};