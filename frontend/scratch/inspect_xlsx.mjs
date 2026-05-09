import XLSX from 'xlsx';
import fs from 'fs';

const filePath = 'c:/Users/Akanksha V/Downloads/forgetrack/docs/Data Engineering and AI - Actual Program.xlsx';
const fileBuffer = fs.readFileSync(filePath);
const workbook = XLSX.read(fileBuffer, { type: 'buffer' });

console.log('Sheets:', workbook.SheetNames);

workbook.SheetNames.forEach(sheetName => {
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    console.log(`\nSheet: ${sheetName}`);
    console.log('Row 0:', JSON.stringify(data[0]));
    console.log('Row 1:', JSON.stringify(data[1]));
    console.log('Row 2:', JSON.stringify(data[2]));
});
