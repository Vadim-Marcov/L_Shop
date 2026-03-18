import fs from 'fs/promises';
import path from 'path';

const DATA_PATH = path.join(__dirname, '../../data');

export const db = {
    async read(fileName: string) {
        try {
            const filePath = path.join(DATA_PATH, `${fileName}.json`);
            const data = await fs.readFile(filePath, 'utf-8');
            return JSON.parse(data);
        } catch (error) {
            return [];
        }
    },
    async write(fileName: string, data: any) {
        const filePath = path.join(DATA_PATH, `${fileName}.json`);
        await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    }
};