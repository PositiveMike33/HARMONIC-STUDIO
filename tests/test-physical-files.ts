import { resolvePhysicalTrackFile, CERTIFIED_TRACKS_DB } from '../server';

const tracks = ['splintered-self', 'bones-for-the-crows', 'counting-stars', 'the-soldier-4-mike-solo', 'the-soldier-4'];

const modeSets = {
  'Backend Canonical': ['440hz', '432hz', 'phi_432hz', 'phi_432hz_528hz_binaural'],
  'Frontend App.tsx': ['440_BYPASS', '432_NATURAL', '432_PHI', '432_528_BINAURAL'],
  'AudioStore': ['440', '432', 'phi', 'binaural'],
};

let allPass = true;

for (const [setName, modes] of Object.entries(modeSets)) {
  console.log(`\n=================== ${setName} ===================`);
  for (const t of tracks) {
    console.log(`Track: ${t}`);
    for (const m of modes) {
      const res = resolvePhysicalTrackFile(t, m);
      if (!res) {
        console.error(`  FAIL [${m}] -> null`);
        allPass = false;
      } else {
        console.log(`  PASS [${m}] -> ${res}`);
      }
    }
  }
}

if (!allPass) {
  console.error('\n❌ SOME RESOLUTIONS FAILED!');
  process.exit(1);
} else {
  console.log('\n✅ ALL RESOLUTIONS PASSED 100%!');
}
