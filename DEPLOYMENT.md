# 🚀 Vercel Deployment — Schritt-für-Schritt-Anleitung

So bringst du dein Projekt online und öffnest deine Steuerzentrale `/studio`.
Geplante Dauer: **ca. 15 Minuten.** Kosten: **0 €.**

---

## 📋 Bevor du startest: Die 3 Pflicht-Keys besorgen

Halte diese 3 Werte bereit (in einem Notizzettel sammeln):

### 1. Pokémon TCG API-Key (kostenlos)
1. Geh auf **https://dev.pokemontcg.io/**
2. Klicke "Sign Up" → registriere dich mit E-Mail
3. Nach Login findest du deinen Key im Dashboard
4. Kopiere ihn → das ist dein `POKEMON_TCG_API_KEY`

### 2. Claude API-Key (Anthropic)
1. Geh auf **https://console.anthropic.com/**
2. Registriere dich → "API Keys" → "Create Key"
3. Kopiere den Key (beginnt mit `sk-ant-...`) → das ist dein `ANTHROPIC_API_KEY`
4. Wichtig: Bei "Billing" ein paar Euro Guthaben aufladen (Nutzung kostet nur Cent-Beträge)

### 3. CRON_SECRET
- Den hat Claude dir bereits generiert (im Chat).
- Falls du einen neuen brauchst: irgendein langer Zufallsstring (mind. 32 Zeichen).

---

## 🟢 Teil A: Vercel-Account erstellen

1. Geh auf **https://vercel.com/**
2. Klicke **"Sign Up"**
3. Wähle **"Continue with GitHub"** (damit Vercel dein Projekt sehen kann)
4. Erlaube Vercel den Zugriff auf GitHub (Button "Authorize")
5. Wähle den kostenlosen **"Hobby"**-Plan

---

## 🟢 Teil B: Projekt importieren

1. Im Vercel-Dashboard: klicke **"Add New..."** → **"Project"**
2. Du siehst eine Liste deiner GitHub-Repos → suche **`newidea`**
3. Klicke daneben auf **"Import"**

> ⚠️ **Wichtiger Hinweis zur Branch:**
> Vercel nimmt standardmäßig den `main`-Branch. Unser Code liegt aber auf
> `claude/side-project-monetization-srmacs`.
> **Lösung:** Bitte Claude, den Branch nach `main` zu mergen (1 Klick für Claude) —
> dann funktioniert alles automatisch. Oder du stellst es später unter
> Settings → Git → "Production Branch" um.

---

## 🟢 Teil C: Umgebungsvariablen (API-Keys) eintragen

Beim Import siehst du den Punkt **"Environment Variables"**. Klappe ihn auf und trage ein:

| Name (Key) | Value (dein Wert) |
|---|---|
| `POKEMON_TCG_API_KEY` | dein Pokémon-Key |
| `ANTHROPIC_API_KEY` | dein Claude-Key (sk-ant-...) |
| `CRON_SECRET` | der von Claude generierte Schlüssel |

> Für jede Zeile: Name links, Wert rechts eintragen → "Add" klicken.
> Die anderen Keys (Beehiiv, ElevenLabs, etc.) kannst du **später** ergänzen —
> sie sind nicht nötig, damit die Seite startet.

---

## 🟢 Teil D: Deployen

1. Klicke den großen Button **"Deploy"**
2. Warte 1–2 Minuten (Vercel baut deine Seite)
3. Wenn du Konfetti 🎉 siehst → **geschafft!**

---

## 🟢 Teil E: Deine Zentrale öffnen

Vercel zeigt dir eine Adresse wie `https://newidea-xyz.vercel.app`

- **Öffentliche Website:** `https://newidea-xyz.vercel.app`
- **Deine Steuerzentrale:** `https://newidea-xyz.vercel.app/studio`

Speichere dir die `/studio`-Adresse als Lesezeichen — das ist dein Cockpit.

---

## ✅ Funktionstest

1. Öffne `/studio`
2. Oben sollten **grüne Lichter** bei "Pokémon TCG API" und "Claude AI" stehen
3. Klicke unten **"Marktbericht"** → nach ein paar Sekunden erscheint ein KI-Text
4. Funktioniert? **Dein System läuft live!** 🚀

---

## 🔄 Was passiert jetzt automatisch?

- Jeden **Montag 07:00 Uhr** läuft die Wochen-Automatik (Cron-Job)
- Sie erstellt Marktbericht, Newsletter-Entwurf, Video-Skripte & Social-Posts
- Jeden **Tag 08:00 Uhr** wird der Tagesartikel vorgewärmt und — falls Supabase
  eingerichtet ist — die aktuellen Karten-Preise gespeichert
- Sobald du die weiteren Keys (Beehiiv etc.) einträgst, wird auch automatisch gepusht

---

## 📈 Optional: Echte Preis-Historie mit Supabase

Standardmäßig zeigt der Preis-Verlauf die echten Cardmarket-Durchschnitte
(Ø 1/7/30 Tage). Für einen **tag-genauen** echten Verlauf:

1. Kostenloses Projekt auf [supabase.com](https://supabase.com/) anlegen
2. Im **SQL-Editor** den Inhalt von `supabase/migrations/0001_price_snapshots.sql` ausführen
3. In Vercel zwei Variablen eintragen (Project Settings → API in Supabase):
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Neu deployen

Ab dann sammelt der tägliche Cron-Job echte Preise, und jede aufgerufene Karte
baut über die Zeit ihre eigene tag-genaue Historie auf.

---

## ❓ Probleme?

| Problem | Lösung |
|---|---|
| Graue Lichter im Studio | API-Keys fehlen → Vercel → Settings → Environment Variables prüfen |
| "Build failed" | Branch-Problem → Claude bitten, nach `main` zu mergen |
| Seite ist leer / nur README | Falscher Branch deployed → Production Branch umstellen |
| Marktbericht-Fehler | Claude-Guthaben aufladen (console.anthropic.com → Billing) |

> Bei jedem Problem: schick Claude den Fehlertext, dann lösen wir es zusammen.

---

## 🔐 Wichtig: Nach dem Eintragen neuer Keys

Wenn du später Variablen hinzufügst/änderst, musst du **neu deployen**:
Vercel → dein Projekt → "Deployments" → neuestes → "..." → **"Redeploy"**
