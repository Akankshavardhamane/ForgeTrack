import * as XLSX from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = 'c:/Users/Akanksha V/Downloads/forgetrack/docs/Data Engineering and AI - Actual Program.xlsx';

try {
    const workbook = XLSX.readFile(filePath);
    console.log('Sheet Names:', workbook.SheetNames);

    workbook.SheetNames.forEach(name => {
        const worksheet = workbook.Sheets[name];
        const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        console.log(`\n--- Sheet: ${name} ---`);
        console.log('Headers (Row 1):', data[0] ? data[0].slice(0, 10) : 'None');
        console.log('Headers (Row 2):', data[1] ? data[1].slice(0, 10) : 'None');
        console.log('Headers (Row 3):', data[2] ? data[2].slice(0, 10) : 'None');
        console.log('Sample Data (Row 4):', data[3] ? data[3].slice(0, 10) : 'None');
    });
} catch (err) {
    console.error('Error reading file:', err.message);
}
