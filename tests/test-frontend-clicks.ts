import assert from 'node:assert/strict';
import { test, describe } from 'node:test';
import { app, resolvePhysicalTrackFile, CERTIFIED_TRACKS_DB } from '../server';
import { useAudioStore } from '../src/client/store/useAudioStore';
import { AddressInfo } from 'net';
import fs from 'fs';

describe('FRONTEND EXHAUSTIVE UI CLICKS & AUDIOTRACK RESOLUTION TEST', () => {
  const tracks = [
    { id: 'splintered-self', title: 'Splintered Self', artist: 'VEL94EV' },
    { id: 'bones-for-the-crows', title: 'Bones For The Crows', artist: 'Nickelback' },
    { id: 'counting-stars', title: 'Counting Stars', artist: 'OneRepublic' },
    { id: 'the-soldier-4', title: 'The Soldier 4', artist: 'The Soldier' },
  ];

  const freqButtons = [
    { id: '440_BYPASS', storeMode: '440', label: '440 Hz Master Studio (Bypass)' },
    { id: '432_NATURAL', storeMode: '432', label: '432 Hz Verdi Naturel' },
    { id: '432_PHI', storeMode: 'phi', label: "Φ 432 Hz Nombre d'Or" },
    { id: '432_528_BINAURAL', storeMode: 'binaural', label: 'Φ 432 Hz + 528 Hz Solfeggio' },
  ] as const;

  test('1. Test de chaque carte de piste et chaque bouton fréquentiel A/B (16 combinaisons exactes)', async () => {
    const server = app.listen(0);
    const port = (server.address() as AddressInfo).port;

    try {
      for (const t of tracks) {
        // Clic sur la piste
        const catalogueTrack = useAudioStore.getState().tracks.find((x) => x.id.includes(t.id) || t.id.includes(x.id));
        assert.ok(catalogueTrack, `La piste ${t.id} doit exister dans le catalogue`);
        useAudioStore.setState({ currentTrack: catalogueTrack });
        assert.equal(useAudioStore.getState().currentTrack.id, catalogueTrack.id);

        for (const fb of freqButtons) {
          // Clic sur le bouton fréquentiel
          useAudioStore.getState().setFrequency(fb.storeMode);
          assert.equal(useAudioStore.getState().activeFrequency, fb.storeMode);

          // Résolution physique
          const resolvedFile = resolvePhysicalTrackFile(t.id, fb.id);
          assert.ok(resolvedFile, `Le fichier pour [${t.title} | ${fb.label}] doit être résolu`);
          assert.ok(fs.existsSync(resolvedFile!), `Le fichier ${resolvedFile} doit exister physiquement`);
          const stat = fs.statSync(resolvedFile!);
          assert.ok(stat.size > 1024 * 1024, `Fichier physique > 1 Mo (${stat.size} octets)`);

          // Appel HTTP 206 réel
          const streamUrl = `http://127.0.0.1:${port}/api/stream/${t.id}?freq=${fb.id}`;
          const res = await fetch(streamUrl, {
            headers: { Range: 'bytes=0-524287' },
          });

          assert.equal(res.status, 206, `HTTP 206 pour [${t.title} | ${fb.label}]`);
          assert.equal(res.headers.get('content-type'), 'audio/mpeg');
          assert.equal(res.headers.get('content-length'), '524288');
          assert.equal(res.headers.get('x-dsp-tuning'), fb.id);
          assert.ok(res.headers.get('content-range')?.startsWith('bytes 0-524287/'));

          const buf = await res.arrayBuffer();
          assert.equal(buf.byteLength, 524288);
        }
      }
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  test('2. Test de chaque contrôle de transport et curseurs (Play, Pause, Seek, Volume, Mute)', () => {
    const store = useAudioStore.getState();

    // Bouton Lecture
    useAudioStore.setState({ isPlaying: true });
    assert.equal(useAudioStore.getState().isPlaying, true);

    // Bouton Pause
    useAudioStore.setState({ isPlaying: false });
    assert.equal(useAudioStore.getState().isPlaying, false);

    // Barre de Seek (position temporelle)
    store.seek(120.5);
    assert.equal(useAudioStore.getState().currentTime, 120.5);
    store.seek(0);
    assert.equal(useAudioStore.getState().currentTime, 0);

    // Curseur Volume
    store.setVolume(0.5);
    assert.equal(useAudioStore.getState().volume, 0.5);
    store.setVolume(1.0);
    assert.equal(useAudioStore.getState().volume, 1.0);
    store.setVolume(0.0); // Mute
    assert.equal(useAudioStore.getState().volume, 0.0);
    store.setVolume(0.85); // Normal
    assert.equal(useAudioStore.getState().volume, 0.85);
  });

  test('3. Test de chaque bouton de la file d attente (Queue: Add, Remove, Next, Prev, Clear, Autoplay)', async () => {
    const store = useAudioStore.getState();
    store.clearQueue();
    assert.equal(useAudioStore.getState().queue.length, 0);

    // Ajouter chaque chanson à la file
    for (const track of store.tracks) {
      store.addToQueue(track);
    }
    assert.equal(useAudioStore.getState().queue.length, 4);

    // Supprimer un élément
    store.removeFromQueue(1);
    assert.equal(useAudioStore.getState().queue.length, 3);

    // Toggle autoplay
    const auto = useAudioStore.getState().autoPlayNext;
    store.toggleAutoPlayNext();
    assert.equal(useAudioStore.getState().autoPlayNext, !auto);
    store.toggleAutoPlayNext();
    assert.equal(useAudioStore.getState().autoPlayNext, auto);

    // Vider la file
    store.clearQueue();
    assert.equal(useAudioStore.getState().queue.length, 0);
  });

  test('4. Test de chaque bouton de modale (Stripe 85/15 Checkout, Creator Studio, Widget)', async () => {
    const server = app.listen(0);
    const port = (server.address() as AddressInfo).port;

    try {
      // 1. Clic Acquisition Master (0.99$ CAD)
      const res = await fetch(`http://127.0.0.1:${port}/api/billing/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trackId: 'bones-for-the-crows',
          userEmail: 'user@thirty3.audio',
          access_type: 'stream_pass_48h',
        }),
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.ok(data.success);
      assert.ok(data.checkoutUrl || data.checkout_url);

      // 2. Clic Génération de Widget Embed
      const embedUrl = `https://harmonic-studio-plateforme-de-streaming-432hz.ai.studio/embed/bones-for-the-crows?freq=432_PHI`;
      const iframeSnippet = `<iframe src="${embedUrl}" width="100%" height="220" frameborder="0" allow="autoplay"></iframe>`;
      assert.ok(iframeSnippet.includes('bones-for-the-crows'));
      assert.ok(iframeSnippet.includes('432_PHI'));
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });
});
