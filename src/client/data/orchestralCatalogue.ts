import { Track, MasterArchiveItem } from '../../types';

export interface ExtendedTrackData {
  id: string;
  title: string;
  artist: string;
  artistBio?: string;
  fundamentalHz: number;
  musicalKey: string;
  durationSeconds: number;
  priceCentsCad: number;
  isrc: string;
  sha256Certificate: string;
  carriers: {
    '440_BYPASS': { leftHz: number; rightHz: number };
    '432_NATURAL': { leftHz: number; rightHz: number };
    '432_PHI': { leftHz: number; rightHz: number; binauralBeatHz: number };
    '432_528_BINAURAL': { leftHz: number; rightHz: number; solfeggioCarrierHz: number };
    '432_ORCHESTRAL': { leftHz: number; rightHz: number; spatialWidth: number; ambiophonicField: string };
  };
}

const createMasterArchives = (trackId: string, durationStr = '03:36'): MasterArchiveItem[] => [
  {
    id: '440',
    title: 'Master 440 Hz Standard',
    tuning: 'A=440.0 Hz (Bypass studio)',
    duration: durationStr,
    bitrate: '320 kbps',
    fingerprint: `SHA256:${trackId}-440hz-cert-7f49`,
  },
  {
    id: '432',
    title: 'Master 432 Hz Naturel',
    tuning: 'A=432.0 Hz (Diapason Verdi -31.76c)',
    duration: durationStr,
    bitrate: '320 kbps',
    fingerprint: `SHA256:${trackId}-432hz-verdi-8f51`,
  },
  {
    id: 'phi',
    title: "Master Φ 432 Hz Nombre d'Or",
    tuning: 'A=432.0 Hz + LFO Scalaire Φ 1.618 Hz',
    duration: durationStr,
    bitrate: '320 kbps',
    fingerprint: `SHA256:${trackId}-phi-scalar-9a62`,
  },
  {
    id: 'binaural',
    title: 'Master 432Hz + 528Hz Binaural',
    tuning: 'Ondes Thêta 4.0 Hz + Fréquence Sacrée 528 Hz',
    duration: durationStr,
    bitrate: '320 kbps',
    fingerprint: `SHA256:${trackId}-binaural-528hz-ab73`,
  },
  {
    id: 'orchestral',
    title: 'Master 432 Hz Ambiophonique Orchestral',
    tuning: 'A=432.0 Hz + Champ 3D Holophonique Symphonique',
    duration: durationStr,
    bitrate: '320 kbps',
    fingerprint: `SHA256:${trackId}-orchestral-3d-bc84`,
  },
];

export const LINKIN_PARK_SONGS_METADATA: {
  id: string;
  title: string;
  artist: string;
  artistBio: string;
  fundamentalHz: number;
  musicalKey: string;
  durationSeconds: number;
  durationStr: string;
  colorFrom: string;
  colorTo: string;
}[] = [
  {
    id: 'papercut',
    title: 'Papercut',
    artist: 'Linkin Park',
    artistBio: "Piste d'ouverture emblématique de l'album culte Hybrid Theory (2000), fusionnant rap percutant de Mike Shinoda et envolées vocales de Chester Bennington dans un arrangement rythmique frénétique en Ré mineur.",
    fundamentalHz: 146.83,
    musicalKey: 'D Minor',
    durationSeconds: 185,
    durationStr: '03:05',
    colorFrom: '#EF4444',
    colorTo: '#991B1B',
  },
  {
    id: 'one-step-closer',
    title: 'One Step Closer',
    artist: 'Linkin Park',
    artistBio: "Premier single mondial de Linkin Park, hymne nu-metal légendaire produit par Don Gilmore, déployant une intensité cathartique avec riffs acérés et accordage de guitare drop D.",
    fundamentalHz: 146.83,
    musicalKey: 'D Minor',
    durationSeconds: 157,
    durationStr: '02:37',
    colorFrom: '#F97316',
    colorTo: '#C2410C',
  },
  {
    id: 'with-you',
    title: 'With You',
    artist: 'Linkin Park',
    artistBio: 'Collaboration novatrice entre Linkin Park et The Dust Brothers combinant textures électroniques industrielles, scratches de Joe Hahn et guitares saturées de Brad Delson.',
    fundamentalHz: 130.81,
    musicalKey: 'C Minor',
    durationSeconds: 203,
    durationStr: '03:23',
    colorFrom: '#8B5CF6',
    colorTo: '#5B21B6',
  },
  {
    id: 'points-of-authority',
    title: 'Points of Authority',
    artist: 'Linkin Park',
    artistBio: 'Chef-d’œuvre d’échantillonnage où Mike Shinoda découpa les riffs de guitare originaux de Brad Delson dans Pro Tools pour créer un motif rythmique heurté unique en son genre.',
    fundamentalHz: 146.83,
    musicalKey: 'D Minor',
    durationSeconds: 200,
    durationStr: '03:20',
    colorFrom: '#10B981',
    colorTo: '#047857',
  },
  {
    id: 'crawling',
    title: 'Crawling',
    artist: 'Linkin Park',
    artistBio: 'Lauréat du Grammy Award de la meilleure performance Hard Rock en 2002, sublimé par la prestation vocale brute et vulnérable de Chester Bennington.',
    fundamentalHz: 138.59,
    musicalKey: 'C# Minor',
    durationSeconds: 209,
    durationStr: '03:29',
    colorFrom: '#06B6D4',
    colorTo: '#0E7490',
  },
  {
    id: 'runaway',
    title: 'Runaway',
    artist: 'Linkin Park',
    artistBio: 'Co-écrit avec Mark Wakefield au tout début de Xero, ce titre capture la rébellion adolescente avec des dynamiques alternant couplets murmurés et refrains explosifs.',
    fundamentalHz: 164.81,
    musicalKey: 'E Minor',
    durationSeconds: 184,
    durationStr: '03:04',
    colorFrom: '#3B82F6',
    colorTo: '#1D4ED8',
  },
  {
    id: 'by-myself',
    title: 'By Myself',
    artist: 'Linkin Park',
    artistBio: 'Morceau abrasif explorant l’angoisse et l’aliénation, porté par un tempo rapide et des lignes de basse percutantes de Dave Phoenix Farrell.',
    fundamentalHz: 146.83,
    musicalKey: 'D Minor',
    durationSeconds: 190,
    durationStr: '03:10',
    colorFrom: '#EC4899',
    colorTo: '#BE185D',
  },
  {
    id: 'in-the-end',
    title: 'In the End',
    artist: 'Linkin Park',
    artistBio: 'Classique mondial absolu basé sur un arpège de piano mélancolique de Mike Shinoda et un refrain universel chanté par Chester Bennington, cumulant des milliards d’écoutes.',
    fundamentalHz: 155.56,
    musicalKey: 'Eb Minor',
    durationSeconds: 216,
    durationStr: '03:36',
    colorFrom: '#6366F1',
    colorTo: '#4338CA',
  },
  {
    id: 'a-place-for-my-head',
    title: 'A Place for My Head',
    artist: 'Linkin Park',
    artistBio: 'Une des premières compositions du groupe (originellement intitulée Esaul), célèbre pour son intro en arpèges de guitare claire et sa montée en puissance furieuse.',
    fundamentalHz: 146.83,
    musicalKey: 'D Minor',
    durationSeconds: 185,
    durationStr: '03:05',
    colorFrom: '#F59E0B',
    colorTo: '#B45309',
  },
  {
    id: 'forgotten',
    title: 'Forgotten',
    artist: 'Linkin Park',
    artistBio: 'Piste ultra-dynamique débutant instantanément sur le refrain sans préambule, issue de la démo Rinse de l’époque Xero réarrangée avec Chester Bennington.',
    fundamentalHz: 146.83,
    musicalKey: 'D Minor',
    durationSeconds: 194,
    durationStr: '03:14',
    colorFrom: '#14B8A6',
    colorTo: '#0F766E',
  },
  {
    id: 'cure-for-the-itch',
    title: 'Cure for the Itch',
    artist: 'Linkin Park',
    artistBio: 'Interlude instrumental électro-hip-hop mettant en lumière la virtuosité de DJ Joe Hahn aux platines et le design sonore expérimental de Mike Shinoda.',
    fundamentalHz: 220.0,
    musicalKey: 'A Minor',
    durationSeconds: 157,
    durationStr: '02:37',
    colorFrom: '#A855F7',
    colorTo: '#7E22CE',
  },
  {
    id: 'pushing-me-away',
    title: 'Pushing Me Away',
    artist: 'Linkin Park',
    artistBio: 'Morceau de clôture émotionnel de Hybrid Theory, alliant guitares atmosphériques et harmonisations vocales sublimes entre Chester et Mike.',
    fundamentalHz: 146.83,
    musicalKey: 'D Minor',
    durationSeconds: 192,
    durationStr: '03:12',
    colorFrom: '#0284C7',
    colorTo: '#0369A1',
  },
  {
    id: 'my-december',
    title: 'My December',
    artist: 'Linkin Park',
    artistBio: 'Ballade intimiste et hivernale composée par Mike Shinoda sur son clavier de studio, portée par la voix caressante de Chester et une boîte à rythmes épurée.',
    fundamentalHz: 146.83,
    musicalKey: 'D Minor',
    durationSeconds: 260,
    durationStr: '04:20',
    colorFrom: '#38BDF8',
    colorTo: '#0284C7',
  },
  {
    id: 'high-voltage',
    title: 'High Voltage',
    artist: 'Linkin Park',
    artistBio: 'Titre hip-hop alternatif célébrant les racines underground de Mike Shinoda et Mr. Hahn, enrichi de scratches acérés et de piano syncopé.',
    fundamentalHz: 146.83,
    musicalKey: 'D Minor',
    durationSeconds: 225,
    durationStr: '03:45',
    colorFrom: '#EAB308',
    colorTo: '#A16207',
  },
  {
    id: 'the-soldier-4',
    title: 'The Soldier 4',
    artist: 'Mike Shinoda solo Linkin Park',
    artistBio: 'Co-fondateur, producteur et multi-instrumentiste de Linkin Park, Mike Shinoda explore dans cette version solo studio des textures acoustiques hybrides et des arrangements intimistes sublimés en accordage naturel 432 Hz et résonance sacrée Phi.',
    fundamentalHz: 293.66,
    musicalKey: 'D Minor',
    durationSeconds: 218,
    durationStr: '03:38',
    colorFrom: '#F59E0B',
    colorTo: '#D97706',
  },
  {
    id: 'dedicated',
    title: 'Dedicated (1999 Demo)',
    artist: 'Linkin Park',
    artistBio: 'Démo rare enregistrée en 1999 pendant les sessions d’écriture de Hybrid Theory, dévoilant le flow percutant de Mike Shinoda sur une boucle boom-bap pure.',
    fundamentalHz: 146.83,
    musicalKey: 'D Minor',
    durationSeconds: 192,
    durationStr: '03:12',
    colorFrom: '#64748B',
    colorTo: '#334155',
  },
  {
    id: 'esaul',
    title: 'Esaul (A Place for My Head Demo)',
    artist: 'Linkin Park',
    artistBio: 'Version démo historique de A Place for My Head datant de 1999, avec des paroles alternatives et une énergie brute capturée sur bande magnétique.',
    fundamentalHz: 146.83,
    musicalKey: 'D Minor',
    durationSeconds: 188,
    durationStr: '03:08',
    colorFrom: '#FB923C',
    colorTo: '#EA580C',
  },
  {
    id: 'she-couldnt',
    title: "She Couldn't",
    artist: 'Linkin Park',
    artistBio: 'Morceau légendaire longtemps inédit de 1999 réédité pour les 20 ans de Hybrid Theory, intégrant un sample de Yosi Piamenta et une vibe trip-hop vaporeuse.',
    fundamentalHz: 174.61,
    musicalKey: 'F Major',
    durationSeconds: 306,
    durationStr: '05:06',
    colorFrom: '#818CF8',
    colorTo: '#4F46E5',
  },
  {
    id: 'step-up',
    title: 'Step Up',
    artist: 'Linkin Park',
    artistBio: 'Extrait du Hybrid Theory EP original de 1999, concentré de rap-rock technique démontrant l’aisance rythmique et la complicité fondatrice du groupe.',
    fundamentalHz: 146.83,
    musicalKey: 'D Minor',
    durationSeconds: 235,
    durationStr: '03:55',
    colorFrom: '#34D399',
    colorTo: '#059669',
  },
  {
    id: 'part-of-me',
    title: 'Part of Me',
    artist: 'Linkin Park',
    artistBio: 'Morceau progressif puissant culminant sur une longue piste instrumentale ambiante cachée, archétype du son expérimental originel de Linkin Park.',
    fundamentalHz: 146.83,
    musicalKey: 'D Minor',
    durationSeconds: 346,
    durationStr: '05:46',
    colorFrom: '#FB7185',
    colorTo: '#E11D48',
  },
];

export const LINKIN_PARK_ORCHESTRAL_TRACKS: Track[] = LINKIN_PARK_SONGS_METADATA.map((s, idx) => ({
  id: s.id,
  title: s.title,
  artist: s.artist,
  durationSeconds: s.durationSeconds,
  pitchShiftCents: -31.76,
  lufs: -14.0,
  truePeakDbtp: -1.0,
  bitrateKbps: 320,
  priceCad: 0.99,
  unlocked: true,
  creatorStripeId: 'acct_LinkinParkStudio',
  originalTuningHz: 440.0,
  coverGradientFrom: s.colorFrom,
  coverGradientTo: s.colorTo,
  audioUrl: `/api/stream/${s.id}`,
  spectralFingerprint: `SHA256:lp-${s.id}-${idx}9f4a`,
  masterArchives: createMasterArchives(s.id, s.durationStr),
}));

export const LINKIN_PARK_CATALOGUE_DATA: ExtendedTrackData[] = LINKIN_PARK_SONGS_METADATA.map((s, idx) => {
  const f432 = 432.0;
  return {
    id: s.id,
    title: s.title,
    artist: s.artist,
    artistBio: s.artistBio,
    fundamentalHz: s.fundamentalHz,
    musicalKey: s.musicalKey,
    durationSeconds: s.durationSeconds,
    priceCentsCad: 99,
    isrc: `US-WB-${20 + idx}-00${idx < 10 ? '0' + idx : idx}`,
    sha256Certificate: `e84a29bf${idx}9472ba001847192aebc91028374a91b2c4e51`,
    carriers: {
      '440_BYPASS': { leftHz: 440.0, rightHz: 440.0 },
      '432_NATURAL': { leftHz: f432, rightHz: f432 },
      '432_PHI': { leftHz: Number((f432 - 0.809).toFixed(3)), rightHz: Number((f432 + 0.809).toFixed(3)), binauralBeatHz: 1.618 },
      '432_528_BINAURAL': { leftHz: 527.191, rightHz: 528.809, solfeggioCarrierHz: 528.0 },
      '432_ORCHESTRAL': { leftHz: f432, rightHz: f432, spatialWidth: 1.22, ambiophonicField: '3D Holophonique Symphonique' },
    },
  };
});
