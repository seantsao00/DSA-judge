import csvParser from 'csv-parser';
import fs from 'fs';
import { ArgumentParser } from 'argparse';
import { createObjectCsvWriter } from 'csv-writer';

const main = async () => {
  const parser = new ArgumentParser({
    description: 'Parse the Cool CSV file',
    addHelp: true
  });

  parser.addArgument('source', { help: 'The Cool CSV file' });
  parser.addArgument('destination', { help: 'The destination CSV file' });

  const { source, destination } = parser.parseArgs();

  const results = [];

  fs.createReadStream(source)
    .pipe(csvParser())
    .on('data', (row) => {
      if (row['身份'] !== '學生' && row['班別'] !== '資料結構與演算法 (CSIE1212-01)\n資料結構與演算法 (CSIE1212-01)') return;

      results.push({
        ID: row['學號'],
        name: row['姓名'],
        email: row['信箱'],
        role: 'student',
      });
    })
    .on('end', () => {
      const csvWriter = createObjectCsvWriter({
        path: destination,
        header: [
          { id: 'ID', title: 'ID' },
          { id: 'name', title: 'name' },
          { id: 'email', title: 'email' },
          { id: 'role', title: 'role' },
        ],
      });

      csvWriter.writeRecords(results).then(() => {
        console.log('CSV file successfully written to', destination);
      });
    })
    .on('error', (err) => {
      console.error('Error reading the CSV file:', err);
    });
};

main();
