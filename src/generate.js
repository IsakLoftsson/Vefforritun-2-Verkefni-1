import { writeFile } from 'fs/promises';
import { join } from 'node:path';
import {
  createDirIfNotExists,
  readFile,
  readFilesFromDir,
} from './lib/file.js';

import { indexTemplate, leikirTemplate, stadaTemplate } from './lib/html.js';
import { parseGameday, parseTeamsJson } from './lib/parse.js';
import { calculateStandings } from './lib/score.js';

const INPUT_DIR = './data';
const OUTPUT_DIR = './dist';

async function main() {
  await createDirIfNotExists(OUTPUT_DIR);

  const files = await readFilesFromDir(INPUT_DIR);

  const data = [];

  const teams = parseTeamsJson(await readFile('./data/teams.json'));
  console.log('teams', teams);

  for await (const file of files) {
    if (file.indexOf('gameday') < 0) {
      console.log('í file', file, 'gameday: ', file.indexOf('gameday'));
      continue;
    }

    const fileContents = await readFile(file);
    // console.log('fileContents', fileContents);

    // console.info('skrá', file);
    if (!fileContents) {
      continue;
    }

    const parsed = parseGameday(fileContents);
    if (!parsed) {
      continue;
    }
    
    //console.log('parsed', parsed);
    // console.log('parsed.games', parsed.games);
    //console.log('parsed.date', parsed.date);

    data.push(parsed);
    // console.log('data', data);
    //console.log('data.date:', data[0].date);
    //console.log('data.games:', data[0].games[0].home.name);
  }

  const calculatedStandings = calculateStandings(data);

  // `data` er fylki af parsed gögnum sem við viljum
  // skrifa niður í HTML skrá sem heitir `index.html`
  // (og síðan í framhaldinu `stada.html` og `leikir.html`)

  const indexHtml = indexTemplate();
  const indexFilename = join(OUTPUT_DIR, 'index.html');
  await writeFile(indexFilename, indexHtml);

  const stadaHtml = stadaTemplate(calculatedStandings);
  const stadaFilename = join(OUTPUT_DIR, 'stada.html');
  await writeFile(stadaFilename, stadaHtml);

  const leikirHtml = leikirTemplate(data);
  const leikirFilename = join(OUTPUT_DIR, 'leikir.html');
  await writeFile(leikirFilename, leikirHtml);
}

main().catch((error) => {
  console.error('error generating', error);
});
