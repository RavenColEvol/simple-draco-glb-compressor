import { compressGLB } from './dist/index.js';
import fs from 'fs';

(async () => {
  const data = fs.readFileSync('./monkey.glb');
  const res = await compressGLB(data);
  fs.writeFileSync('./res.glb', res);
})();
