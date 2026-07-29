import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { globSync } from 'fs';
import { cachedImg } from '@/lib/cached-image';

// Der Bild-Proxy hält Kartenbilder auch bei Ausfall der TCG-API verfügbar.
// Zwei Gefahren werden hier abgesichert:
//   1. Offener Proxy — nur bekannte Hosts dürfen durchgereicht werden
//   2. Stolperstelle 18 — cachedImg NIEMALS in next/image, der Optimizer
//      lehnt verschachtelte Query-URLs mit HTTP 400 ab (Bild bleibt leer)

describe('cachedImg — bekannte Hosts', () => {
  it('leitet Kartenbilder über den Proxy', () => {
    const url = 'https://images.pokemontcg.io/sv3pt5/25.png';
    expect(cachedImg(url)).toBe(`/api/img?u=${encodeURIComponent(url)}`);
  });

  it('leitet auch das Pokémon-Asset-CDN über den Proxy', () => {
    const url = 'https://assets.pokemon.com/assets/cms2/img/logo.png';
    expect(cachedImg(url)).toContain('/api/img?u=');
  });

  it('kodiert die Ziel-URL vollständig', () => {
    const url = 'https://images.pokemontcg.io/sv3pt5/25.png?v=1&x=2';
    const proxied = cachedImg(url);
    // Query-Zeichen dürfen nicht roh durchschlagen — sonst zerfällt der
    // eigene Query-String des Proxys.
    expect(proxied.split('?u=')[1]).not.toContain('&');
    expect(decodeURIComponent(proxied.split('?u=')[1])).toBe(url);
  });
});

describe('cachedImg — kein offener Proxy', () => {
  it('lässt fremde Hosts unverändert', () => {
    const fremd = 'https://example.com/bild.png';
    expect(cachedImg(fremd)).toBe(fremd);
  });

  it('lässt einen Host durch, der nur so AUSSIEHT wie der erlaubte', () => {
    // Ein Angreifer könnte sonst über eine Subdomain den Proxy missbrauchen.
    for (const url of [
      'https://images.pokemontcg.io.evil.com/x.png',
      'https://evil.com/images.pokemontcg.io/x.png',
      'https://notimages.pokemontcg.io/x.png',
    ]) {
      expect(cachedImg(url), url).toBe(url);
    }
  });

  it('leitet unverschlüsselte Verbindungen nicht um', () => {
    const http = 'http://images.pokemontcg.io/sv3pt5/25.png';
    expect(cachedImg(http)).toBe(http);
  });
});

describe('cachedImg — Randfälle', () => {
  it('gibt für leere Eingaben einen leeren String zurück', () => {
    expect(cachedImg(undefined)).toBe('');
    expect(cachedImg(null)).toBe('');
    expect(cachedImg('')).toBe('');
  });

  it('lässt relative Pfade unverändert', () => {
    expect(cachedImg('/lokal/bild.png')).toBe('/lokal/bild.png');
  });

  it('lässt Data-URIs unverändert', () => {
    const data = 'data:image/png;base64,AAAA';
    expect(cachedImg(data)).toBe(data);
  });

  it('wirft bei kaputten URLs nicht', () => {
    expect(() => cachedImg('nicht-mal-eine-url')).not.toThrow();
    expect(cachedImg('nicht-mal-eine-url')).toBe('nicht-mal-eine-url');
  });
});

describe('Stolperstelle 18 — cachedImg niemals in next/image', () => {
  it('wird in keiner Datei zusammen mit next/image benutzt', () => {
    // v2.15.0-Regression: Das große Kartenbild verschwand komplett, weil der
    // Next-Optimizer die Proxy-URL mit HTTP 400 ablehnte.
    const files = globSync('src/**/*.{ts,tsx}', { cwd: process.cwd() }).filter(
      (f) => !f.includes('__tests__'),
    );
    // Schutz vor einem leerlaufenden Test: Findet das Muster nichts mehr,
    // würde die Prüfung stillschweigend immer bestehen.
    expect(files.length).toBeGreaterThan(50);
    expect(files.filter((f) => readFileSync(join(process.cwd(), f), 'utf8').includes('cachedImg')).length)
      .toBeGreaterThan(0);

    const treffer: string[] = [];
    for (const file of files) {
      const src = readFileSync(join(process.cwd(), file), 'utf8');
      if (!src.includes('cachedImg')) continue;
      if (/from ['"]next\/image['"]/.test(src)) treffer.push(file);
    }

    expect(
      treffer,
      `Diese Dateien importieren next/image UND nutzen cachedImg — der ` +
        `Optimizer lehnt Proxy-URLs mit HTTP 400 ab: ${treffer.join(', ')}`,
    ).toEqual([]);
  });
});
