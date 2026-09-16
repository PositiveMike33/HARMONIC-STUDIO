import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import crypto from 'crypto';

const PORT = 3000;
const app = express();

app.use(express.json());

// In-Memory Database State (PostgreSQL & Drizzle ORM replica)
interface TrackRecord {
  id: string;
  title: string;
  artist: string;
  durationSeconds: number;
  pitchShiftCents: number;
  lufs: number;
  truePeakDbtp: number;
  bitrateKbps: number;
  priceCad: number;
  creatorStripeId: string;
  originalTuningHz: number;
  unlocked: boolean;
  bpm: number;
  rootFreq: number;
}

const TRACKS_DB: TrackRecord[] = [
  {
    id: 'splintered-self',
    title: 'Splintered Self',
    artist: 'VEL94EV',
    durationSeconds: 234,
    pitchShiftCents: -31.76,
    lufs: -14.0,
    truePeakDbtp: -1.0,
    bitrateKbps: 320,
    priceCad: 0.99,
    creatorStripeId: 'acct_1NvEL94EVStudio',
    originalTuningHz: 440.0,
    unlocked: true,
    bpm: 110,
    rootFreq: 220.0, // A3
  },
  {
    id: 'bones-for-the-crows',
    title: 'Bones For The Crows',
    artist: 'Nickelback',
    durationSeconds: 242,
    pitchShiftCents: -31.76,
    lufs: -14.0,
    truePeakDbtp: -1.0,
    bitrateKbps: 320,
    priceCad: 0.99,
    creatorStripeId: 'acct_1NickelbackHarmonic',
    originalTuningHz: 440.0,
    unlocked: true,
    bpm: 120,
    rootFreq: 196.0, // G3
  },
  {
    id: 'counting-stars',
    title: 'Counting Stars',
    artist: 'OneRepublic',
    durationSeconds: 257,
    pitchShiftCents: -31.76,
    lufs: -14.0,
    truePeakDbtp: -1.0,
    bitrateKbps: 320,
    priceCad: 0.99,
    creatorStripeId: 'acct_1OneRepublicPub',
    originalTuningHz: 440.0,
    unlocked: true,
    bpm: 122,
    rootFreq: 261.63, // C4
  },
];

interface PurchaseRecord {
  id: string;
  userId: string;
  trackId: string;
  amountCad: number;
  creatorPayoutCad: number;
  platformFeeCad: number;
  stripePaymentIntentId: string;
  createdAt: string;
}

const PURCHASES_DB: PurchaseRecord[] = [];
let SUBSCRIBED_USERS = new Set<string>();

// Helper to construct WAV header
function createWavHeader(dataLength: number, sampleRate = 44100, channels = 2, bitsPerSample = 16): Buffer {
  const header = Buffer.alloc(44);
  const byteRate = (sampleRate * channels * bitsPerSample) / 8;
  const blockAlign = (channels * bitsPerSample) / 8;
  const totalLength = dataLength + 36;

  header.write('RIFF', 0);
  header.writeUInt32LE(totalLength, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
  header.writeUInt16LE(1, 20); // AudioFormat (1 = PCM)
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write('data', 36);
  header.writeUInt32LE(dataLength, 40);

  return header;
}

// Procedural audio sample synthesis for rich harmonic soundscape
function synthesizeSample(timeSec: number, rootFreq: number, channel: number): number {
  // Harmonic chords progression (Am - F - C - G)
  const barTime = 2.0;
  const progression = [rootFreq, rootFreq * 0.8409, rootFreq * 1.1892, rootFreq * 0.9439];
  const chordIdx = Math.floor(timeSec / barTime) % progression.length;
  const chordBase = progression[chordIdx];

  // Triad harmonics
  const h1 = Math.sin(2 * Math.PI * chordBase * timeSec);
  const h2 = Math.sin(2 * Math.PI * (chordBase * 1.25) * timeSec) * 0.6;
  const h3 = Math.sin(2 * Math.PI * (chordBase * 1.5) * timeSec) * 0.4;
  const subBass = Math.sin(2 * Math.PI * (chordBase * 0.5) * timeSec) * 0.5;

  // Gentle acoustic pulse / rhythm
  const beatTime = (timeSec * 2) % 1;
  const kickEnv = Math.exp(-beatTime * 12);
  const kick = Math.sin(2 * Math.PI * 65 * beatTime) * kickEnv * 0.35;

  // Stereo panning modulation
  const panOffset = channel === 0 ? 0.95 : 1.05;
  const tremolo = 0.9 + 0.1 * Math.sin(2 * Math.PI * 1.618 * timeSec + (channel * Math.PI * 0.5));

  const total = (h1 * 0.4 + h2 * 0.25 + h3 * 0.15 + subBass * 0.25 + kick * 0.3) * panOffset * tremolo;
  return Math.max(-0.95, Math.min(0.95, total * 0.65));
}

// -------------------------------------------------------------
// REST API Endpoints
// -------------------------------------------------------------

// 1. Tracks API
app.get('/api/tracks', (req, res) => {
  res.json({
    tracks: TRACKS_DB,
    adminSessionActive: true,
    ebuCompliance: {
      integratedLufs: -14.0,
      truePeakLimitDbtp: -1.0,
      standard: 'EBU R128 / ITU-R BS.1770-4',
    },
  });
});

// 2. RFC 7233 HTTP 206 Partial Range Streaming
app.get('/api/stream/:trackId', (req, res) => {
  const track = TRACKS_DB.find((t) => t.id === req.params.trackId) || TRACKS_DB[0];
  const sampleRate = 44100;
  const channels = 2;
  const bytesPerSample = 2;
  const totalAudioSamples = Math.floor(track.durationSeconds * sampleRate);
  const dataSize = totalAudioSamples * channels * bytesPerSample;
  const totalSize = 44 + dataSize; // Including 44-byte WAV header

  const range = req.headers.range;

  if (!range) {
    // 200 OK full response header if no range is requested
    res.writeHead(200, {
      'Content-Length': totalSize,
      'Content-Type': 'audio/wav',
      'Accept-Ranges': 'bytes',
    });
    const header = createWavHeader(dataSize, sampleRate, channels);
    res.write(header);
    // Send initial 512KB chunk
    const chunkBytes = Buffer.alloc(Math.min(524288, dataSize));
    res.end(chunkBytes);
    return;
  }

  // Parse Range header: "bytes=start-end"
  const parts = range.replace(/bytes=/, '').split('-');
  const start = parseInt(parts[0], 10);
  // Default chunk size of 512KB for smooth range streaming
  const maxChunk = 512 * 1024;
  const end = parts[1] ? parseInt(parts[1], 10) : Math.min(start + maxChunk - 1, totalSize - 1);

  if (start >= totalSize || end >= totalSize || start > end) {
    res.status(416).setHeader('Content-Range', `bytes */${totalSize}`).end();
    return;
  }

  const chunkLength = end - start + 1;

  res.writeHead(206, {
    'Content-Range': `bytes ${start}-${end}/${totalSize}`,
    'Accept-Ranges': 'bytes',
    'Content-Length': chunkLength,
    'Content-Type': 'audio/wav',
    'Cache-Control': 'no-cache',
    'X-Audio-Bitrate': '320kbps-cbr-equivalent',
    'X-DSP-Tuning': '432Hz-Verdi-Phi-Ready',
  });

  const buffer = Buffer.alloc(chunkLength);
  const wavHeader = createWavHeader(dataSize, sampleRate, channels);

  for (let offset = 0; offset < chunkLength; offset++) {
    const globalPos = start + offset;
    if (globalPos < 44) {
      buffer[offset] = wavHeader[globalPos];
    } else {
      const dataOffset = globalPos - 44;
      const sampleIndex = Math.floor(dataOffset / (channels * bytesPerSample));
      const channel = Math.floor((dataOffset % (channels * bytesPerSample)) / bytesPerSample);
      const isHighByte = dataOffset % bytesPerSample === 1;

      const timeSec = sampleIndex / sampleRate;
      const sampleVal = synthesizeSample(timeSec, track.rootFreq, channel);
      const int16Val = Math.floor(sampleVal * 32767);

      if (isHighByte) {
        buffer[offset] = (int16Val >> 8) & 0xff;
      } else {
        buffer[offset] = int16Val & 0xff;
      }
    }
  }

  res.end(buffer);
});

// 3. Colibri Native C / FFT Harmonic Tuner Gateway
app.get('/api/colibri/analyze', (req, res) => {
  const trackId = (req.query.trackId as string) || 'splintered-self';
  const track = TRACKS_DB.find((t) => t.id === trackId) || TRACKS_DB[0];

  const analysis = {
    trackId: track.id,
    detectedFundamentalHz: track.originalTuningHz + 0.02,
    tuningDeviationCents: +0.08,
    isStandard440: true,
    isAlready432: false,
    confidence: 0.994,
    fftPeaks: [
      { freq: 440.0, magDb: -12.4 },
      { freq: 880.0, magDb: -18.2 },
      { freq: 1320.0, magDb: -24.8 },
      { freq: 1760.0, magDb: -29.1 },
    ],
    dspSpecs: {
      openMpThreads: 8,
      sharedMemoryIpc: 'active',
      sampleRate: 48000,
      fftWindow: 'Blackman-Harris-4096',
      targetDeltaCents: -31.7666536,
      ratio54_55: 0.98181818,
    },
    processingTimeMs: 118,
  };

  res.json(analysis);
});

// 4. Goose ACP (Agent Client Protocol via JSON-RPC 2.0)
app.post('/api/acp/rpc', (req, res) => {
  const { jsonrpc, method, params, id } = req.body || {};

  if (method === 'initialize') {
    return res.json({
      jsonrpc: '2.0',
      id: id || 1,
      result: {
        serverInfo: { name: 'berd-hybrid-goose-acp', version: '2.1.0' },
        capabilities: {
          audioIngestion: true,
          spectralExtraction: true,
          httpRange206Streaming: true,
          colibriIpc: true,
        },
      },
    });
  }

  if (method === 'session/new') {
    const sessionId = 'sess_' + crypto.randomBytes(6).toString('hex');
    return res.json({
      jsonrpc: '2.0',
      id: id || 1,
      result: {
        sessionId,
        status: 'initialized',
        workerAllocation: 'high_priority_audio_thread',
      },
    });
  }

  if (method === 'session/prompt') {
    return res.json({
      jsonrpc: '2.0',
      id: id || 1,
      result: {
        status: 'processing',
        ingestionPercent: 100,
        normalisedLufs: -14.0,
        truePeakDbtp: -1.0,
        message: 'Master audio ready for 432Hz transposition.',
      },
    });
  }

  if (method === 'session/cancel') {
    return res.json({
      jsonrpc: '2.0',
      id: id || 1,
      result: { status: 'cancelled', message: 'Stream descriptors freed.' },
    });
  }

  res.json({
    jsonrpc: '2.0',
    id: id || 1,
    result: { status: 'ok', methodReceived: method },
  });
});

// 5. Stripe Connect & Stripe Billing Endpoints
app.post('/api/stripe/checkout-single', (req, res) => {
  const { trackId, userId = 'user_listener_default' } = req.body || {};
  const track = TRACKS_DB.find((t) => t.id === trackId) || TRACKS_DB[0];

  const totalAmount = track.priceCad; // 0.99 $ CAD
  const platformFee = Math.round(totalAmount * 0.15 * 100) / 100; // 0.15 $ CAD
  const creatorPayout = Math.round((totalAmount - platformFee) * 100) / 100; // 0.84 $ CAD

  const purchase: PurchaseRecord = {
    id: 'pur_' + crypto.randomBytes(8).toString('hex'),
    userId,
    trackId: track.id,
    amountCad: totalAmount,
    creatorPayoutCad: creatorPayout,
    platformFeeCad: platformFee,
    stripePaymentIntentId: 'pi_' + crypto.randomBytes(12).toString('hex'),
    createdAt: new Date().toISOString(),
  };

  PURCHASES_DB.push(purchase);

  res.json({
    success: true,
    transaction: purchase,
    split: {
      creatorPercentage: '85%',
      platformPercentage: '15%',
      creatorAmount: `${creatorPayout.toFixed(2)} $ CAD`,
      platformFee: `${platformFee.toFixed(2)} $ CAD`,
      creatorConnectedAccount: track.creatorStripeId,
    },
    message: `Piste "${track.title}" débloquée avec succès via Stripe Connect!`,
  });
});

app.post('/api/stripe/checkout-subscription', (req, res) => {
  const { userId = 'user_listener_default' } = req.body || {};
  SUBSCRIBED_USERS.add(userId);

  res.json({
    success: true,
    subscriptionId: 'sub_' + crypto.randomBytes(10).toString('hex'),
    plan: 'Pass Fréquentiel Illimité',
    amountMonthlyCad: 9.99,
    status: 'active',
    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
    message: 'Abonnement illimité 432Hz & 528Hz activé via Stripe Billing.',
  });
});

app.get('/api/creator/stats', (req, res) => {
  const totalPurchases = PURCHASES_DB.length;
  const grossRevenue = PURCHASES_DB.reduce((acc, p) => acc + p.amountCad, 0);
  const creatorEarnings = PURCHASES_DB.reduce((acc, p) => acc + p.creatorPayoutCad, 0);
  const platformFees = PURCHASES_DB.reduce((acc, p) => acc + p.platformFeeCad, 0);

  res.json({
    connectedAccount: 'acct_1NvEL94EVStudio',
    currency: 'CAD',
    totalPurchases,
    grossRevenue: Number(grossRevenue.toFixed(2)),
    creatorEarnings: Number(creatorEarnings.toFixed(2)),
    platformFees: Number(platformFees.toFixed(2)),
    splitRatio: '85% Créateur / 15% Plateforme',
    recentTransactions: PURCHASES_DB.slice(-5).reverse(),
  });
});

// 6. Creator Track Upload Simulation
app.post('/api/creator/upload', (req, res) => {
  const { title, artist, originalTuning = 440.0 } = req.body || {};
  const newTrack: TrackRecord = {
    id: 'track-' + Date.now(),
    title: title || 'Nouvelle Composition Acoustique',
    artist: artist || 'Artiste Indépendant',
    durationSeconds: 180 + Math.floor(Math.random() * 80),
    pitchShiftCents: -31.76,
    lufs: -14.0,
    truePeakDbtp: -1.0,
    bitrateKbps: 320,
    priceCad: 0.99,
    creatorStripeId: 'acct_1NvEL94EVStudio',
    originalTuningHz: Number(originalTuning),
    unlocked: true,
    bpm: 115,
    rootFreq: 220.0,
  };
  TRACKS_DB.unshift(newTrack);
  res.json({ success: true, track: newTrack });
});

// Start Server and Vite Middleware
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Harmonic Studio Server running on port ${PORT}`);
  });
}

startServer();
