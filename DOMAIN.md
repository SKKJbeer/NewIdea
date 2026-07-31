# Domain-Umzug auf `pokemarketintelligence.com`

Diese Datei beschreibt ausschließlich, **was nach dem Verbinden der Domain zu tun
ist**. Am Code ist dafür nichts zu ändern — die Vorbereitung ist abgeschlossen.

## Ausgangslage (Stand v3.3.4)

Die Seite läuft unter `https://new-idea-livid.vercel.app`. Alle kanonischen
Adressen zeigen aber bereits auf `https://pokemarketintelligence.com`, weil
`NEXT_PUBLIC_SITE_URL` in Vercel auf diesen Wert gesetzt ist.

**Was das bedeutet:** Suchmaschinen bekommen derzeit die Auskunft, die
maßgebliche Fassung jeder Seite liege unter einer Adresse, die nicht antwortet.
Das ist der einzige verbliebene harte SEO-Fehler — und er verschwindet in dem
Moment, in dem die Domain verbunden ist. Vorher etwas umzubauen wäre falsch:
Man würde die Canonicals zweimal ändern und beide Male eine Neubewertung
auslösen.

Betroffene Stellen (alle lesen dieselbe Variable, keine Änderung nötig):

| Datei | Verwendung |
|---|---|
| `src/app/layout.tsx` | `metadataBase`, OpenGraph-URLs |
| `src/app/sitemap.ts` | alle Einträge der Sitemap |
| `src/app/robots.ts` | Sitemap-Verweis |

## Schritte nach dem Verbinden

### 1. Domain in Vercel hinzufügen
Projekt → **Settings → Domains** → `pokemarketintelligence.com` eintragen.
Zusätzlich `www.pokemarketintelligence.com` eintragen und auf die Variante ohne
`www` weiterleiten lassen (Vercel bietet das direkt an). **Eine** Variante muss
die kanonische sein — sonst existiert jede Seite doppelt.

### 2. DNS beim Registrar setzen
Vercel zeigt die genauen Werte an. Üblich sind:

| Typ | Name | Wert |
|---|---|---|
| `A` | `@` | `76.76.21.21` |
| `CNAME` | `www` | `cname.vercel-dns.com` |

Die von Vercel angezeigten Werte haben Vorrang vor dieser Tabelle — sie können
sich ändern. Bis zur weltweiten Verteilung vergehen je nach Registrar Minuten
bis 48 Stunden.

### 3. Zertifikat abwarten
Vercel stellt automatisch ein Let's-Encrypt-Zertifikat aus, sobald das DNS
zeigt. Erst danach antwortet `https://` — vorher sind Fehlermeldungen im Browser
normal und kein Defekt.

### 4. `NEXT_PUBLIC_SITE_URL` prüfen
Der Wert muss **exakt** `https://pokemarketintelligence.com` lauten:
ohne abschließenden Schrägstrich, ohne `www`, mit `https`. Ein abweichender Wert
erzeugt Canonicals, die auf eine Weiterleitung zeigen — technisch nicht falsch,
aber unnötig.

Steht der Wert bereits richtig, ist **kein neues Deployment nötig**; die
Variable wird zur Laufzeit gelesen. Nach einer Änderung dagegen schon:
Deployments → **Redeploy**.

### 5. Danach verifizieren
```bash
curl -sI  https://pokemarketintelligence.com | head -3
curl -s   https://pokemarketintelligence.com | grep -o '<link rel="canonical"[^>]*>'
curl -s   https://pokemarketintelligence.com/robots.txt
curl -s   https://pokemarketintelligence.com/sitemap.xml | head -20
```
Erwartung: HTTP 200, Canonical auf die neue Domain, Sitemap mit neuer Domain in
jedem Eintrag.

### 6. Google Search Console
- Property für `pokemarketintelligence.com` anlegen (Domain-Property, per
  DNS-TXT bestätigt — deckt `www` und Unterdomains mit ab)
- `https://pokemarketintelligence.com/sitemap.xml` einreichen
- Unter **Seiten** nach einigen Tagen prüfen, ob Seiten als „indexiert" geführt
  werden und keine Canonical-Warnungen auftreten

### 7. Vercel-Adresse nicht bewerben
`new-idea-livid.vercel.app` bleibt erreichbar. Da alle Canonicals auf die eigene
Domain zeigen, entsteht dadurch kein doppelter Inhalt. Verlinkt werden sollte
ausschließlich die eigene Domain.

## Was NICHT zu tun ist

- **Keine Weiterleitungen von Hand bauen.** Vercel macht `www` → ohne `www`
  selbst.
- **Keine Canonicals im Code hart eintragen.** Sie kommen aus der Variablen;
  ein fester Wert wäre beim nächsten Umzug wieder ein Fehler.
- **Kein Umbau der Adressen.** Alle Pfade (`/artikel`, `/guides`,
  `/marktbericht`, `/sets`, `/karten/…`, `/methodik`) bleiben unverändert —
  es wechselt nur der Domainteil davor.
