import { compile } from '../compile.js';
import fs from 'fs';

const index = fs.readFileSync('index.html', 'utf8');
const compiledHTML = await compile({ index });
fs.writeFileSync('index.out.html', compiledHTML);

const stats = fs.statSync('index.out.html');
const fileSize = stats.size;
const kb = fileSize / 1024;
console.log(`HTML Compiled: ${kb.toFixed(2)} KB`);
