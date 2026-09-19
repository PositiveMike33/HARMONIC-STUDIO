import fs from 'fs';
import path from 'path';
import { resolvePhysicalTrackFile } from '../server';

const tracks = ['splintered-self', 'bones-for-the-crows', 'counting-stars', 'the-soldier-4'];
const modes = ['440', '432', 'phi', 'binaural'];

for (const t of tracks) {
  for (const m of modes) {
    const src = resolvePhysicalTrackFile(t, m);
    if (src && fs.existsSync(src)) {
      const destDir = path.join(process.cwd(), 'public', 'audio', t);
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }
      const dest = path.join(destDir, `${m}.mp3`);
      fs.copyFileSync(src, dest);
      console.log(`COPIED ${t}/${m}.mp3 (size: ${fs.statSync(dest).size} bytes)`);
    } else {
      console.error(`FAILED to find src for ${t}/${m}`);
    }
  }
}
