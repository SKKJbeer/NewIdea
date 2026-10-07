import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { adressName, amazonSuche, cardmarketSuche, pruefeCardmarketZiel, versionPasst } from '@/lib/kauf-links';

const utm = '?utm_source=pokemontcgio&utm_medium=image&utm_campaign=card_prices';

describe('Cardmarket-Ziel prüfen (gemessene Weiterleitungen 07.10.2026)', () => {
  it('nimmt Ziele mit passender Nummer und bereinigt sie', () => {
    expect(pruefeCardmarketZiel(`https://cardmarket.com/en/Pokemon/Products/Singles/Evolving-Skies/Umbreon-V-V1-EVS094${utm}`, { name: 'Umbreon V', number: '94' }))
      .toEqual({ url: 'https://www.cardmarket.com/en/Pokemon/Products/Singles/Evolving-Skies/Umbreon-V-V1-EVS094', art: 'nummer' });
    expect(pruefeCardmarketZiel(`https://cardmarket.com/en/Pokemon/Products/Singles/151/Charizard-ex-V3-MEW199${utm}`, { name: 'Charizard ex', number: '199' })).not.toBeNull();
    expect(pruefeCardmarketZiel(`https://cardmarket.com/en/Pokemon/Products/Singles/Base-Set/Charizard-V2-BS4${utm}`, { name: 'Charizard', number: '4' })).not.toBeNull();
    expect(pruefeCardmarketZiel(`https://cardmarket.com/en/Pokemon/Products/Singles/Destined-Rivals/Ethans-Pinsir-DRI001${utm}`, { name: "Ethan's Pinsir", number: '1' })).not.toBeNull();
  });

  it('Mega-Karten und vertauschte Zuordnung (sv8-247 → SSP248, gemessen)', () => {
    expect(pruefeCardmarketZiel('https://cardmarket.com/en/Pokemon/Products/Singles/Evolutions/MCharizard-EX-EVO101', { name: 'M Charizard-EX', number: '101' })).not.toBeNull();
    expect(pruefeCardmarketZiel('https://cardmarket.com/en/Pokemon/Products/Singles/Surging-Sparks/Pikachu-ex-V4-SSP248', { name: 'Pikachu ex', number: '247' })).toBeNull();
  });

  it('lehnt Ziele ohne Nummer ab (Shiny Vault SV107 → Charizard-VMAX ohne Kürzel)', () => {
    expect(pruefeCardmarketZiel(`https://cardmarket.com/en/Pokemon/Products/Singles/Shining-Fates/Charizard-VMAX${utm}`, { name: 'Charizard VMAX', number: 'SV107' })).toBeNull();
    expect(pruefeCardmarketZiel(`https://cardmarket.com/en/Pokemon/Products/Singles/Celebrations/Ho-Oh${utm}`, { name: 'Ho-Oh', number: '1' })).toBeNull();
  });

  it('Version ohne Nummer nur vorläufig, Gegenprobe über Produktnummern', () => {
    const z = `https://cardmarket.com/en/Pokemon/Products/Singles/Evolving-Skies/Umbreon-VMAX-V3${utm}`;
    expect(pruefeCardmarketZiel(z, { name: 'Umbreon VMAX', number: '215' })).toEqual({
      url: 'https://www.cardmarket.com/en/Pokemon/Products/Singles/Evolving-Skies/Umbreon-VMAX-V3', art: 'version', version: 3 });
    // Umbreon V darf nicht auf Umbreon VMAX zeigen
    expect(pruefeCardmarketZiel(z, { name: 'Umbreon V', number: '215' })).toBeNull();
    // Evolving Skies: 95 / 214 / 215 → 574143 / 574272 / 574273
    expect(versionPasst(3, 574273, [574143, 574272, 574273])).toBe(true);
    expect(versionPasst(3, 574273, [574273, 574143, 574272])).toBe(true);
    expect(versionPasst(2, 574273, [574143, 574272, 574273])).toBe(false);
    expect(versionPasst(3, 574273, [574143, null, 574273])).toBe(false);
    expect(versionPasst(4, 574273, [574143, 574272, 574273])).toBe(false);
    expect(versionPasst(1, null, [574143])).toBe(false);
  });

  it('lehnt falsche Nummer, falschen Namen und fremde Hosts ab', () => {
    const z = 'https://cardmarket.com/en/Pokemon/Products/Singles/Evolving-Skies/Umbreon-VMAX-V3-EVS215';
    expect(pruefeCardmarketZiel(z, { name: 'Umbreon VMAX', number: '95' })).toBeNull();
    expect(pruefeCardmarketZiel(z, { name: 'Espeon VMAX', number: '215' })).toBeNull();
    expect(pruefeCardmarketZiel(z.replace('cardmarket.com', 'cardmarket.com.evil.io'), { name: 'Umbreon VMAX', number: '215' })).toBeNull();
    expect(pruefeCardmarketZiel('http://cardmarket.com/en/Pokemon/Products/Singles/X/Umbreon-VMAX-EVS215', { name: 'Umbreon VMAX', number: '215' })).toBeNull();
    expect(pruefeCardmarketZiel(null, { name: 'Umbreon VMAX', number: '215' })).toBeNull();
  });

  it('Nummern mit Buchstaben müssen vollständig passen', () => {
    const z = 'https://cardmarket.com/en/Pokemon/Products/Singles/Brilliant-Stars/Charizard-BRSTG03';
    expect(pruefeCardmarketZiel(z, { name: 'Charizard', number: 'TG03' })).not.toBeNull();
    expect(pruefeCardmarketZiel(z, { name: 'Charizard', number: 'SV03' })).toBeNull();
    expect(pruefeCardmarketZiel(z, { name: 'Charizard', number: '3' })).not.toBeNull();
  });

  it('Adressname und Rückfälle', () => {
    expect(adressName('Flabébé')).toBe('flabebe');
    expect(adressName("Ethan's Pinsir")).toBe('ethans-pinsir');
    expect(cardmarketSuche('Raichu')).toBe('https://www.cardmarket.com/en/Pokemon/Products/Search?searchString=Raichu');
    expect(amazonSuche('Pokemon 151 Booster')).toContain('amazon.de/s?k=');
  });

  it('Kartenseite nutzt den geprüften Link statt der Namenssuche', () => {
    const seite = readFileSync('src/app/karten/[id]/page.tsx', 'utf8');
    expect(seite).toContain('kaufLinks(');
    expect(seite).not.toContain('Products/Search?searchString');
    expect(seite).not.toContain('amazon.de/s?k=');
    const app = readFileSync('src/app/api/v1/karten/[id]/route.ts', 'utf8');
    expect(app).toContain('kaufLinks(');
    expect(app).toContain('kaufen: kaufDto(links)');
  });
});
