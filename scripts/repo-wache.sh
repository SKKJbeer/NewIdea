#!/usr/bin/env bash
# REPO-WACHE — Schutz gegen ein zurückgesetztes Arbeitsverzeichnis
#
# ═══════════════════════════════════════════════════════════════════════════
# DER BEFUND (05.08.2026, neunmal in einer einzigen Sitzung)
# ═══════════════════════════════════════════════════════════════════════════
#
# Das Arbeitsverzeichnis der Entwicklungsumgebung springt ohne Vorwarnung auf
# den Stand v3.2.6 vom 30.07.2026 zurück — mitten in der Arbeit.
#
# Es ist KEINE Git-Operation. Nachgemessen:
#
#   .git/logs/HEAD    30.07. 19:15   ← neuester Reflog-Eintrag ist v3.2.6
#   .git/index        30.07. 19:15
#   .git/refs/…       30.07. 19:15
#   package.json      30.07. 19:14
#   .git/config       HEUTE          ← einzige Ausnahme
#
# Der Reflog enthält keinen einzigen Eintrag über einen Checkout oder Reset.
# Das ganze Verzeichnis wird aus einem Abbild vom 30.07. wiederhergestellt;
# danach schreibt die Umgebung nur `.git/config` neu, um die Zugangsdaten
# einzutragen. Von innen ist daran nichts abstellbar.
#
# ═══════════════════════════════════════════════════════════════════════════
# WARUM ES GEFÄHRLICH IST — nicht nur lästig
# ═══════════════════════════════════════════════════════════════════════════
#
# Beim neunten Mal lag der Rücksprung ZWISCHEN Bearbeitung und Commit. Das
# Ergebnis war ein Commit mit der richtigen Nachricht („v6.0.0 — …") und dem
# Dateiinhalt vom 30. Juli. Er sah in `git log` vollkommen normal aus.
#
# Aufgefallen ist es nur an einer Nebensache: Die Testzahl fiel von 1.077 auf
# 770. Ohne diesen Zufall wäre ein leerer Release nach Produktion gegangen.
#
# ═══════════════════════════════════════════════════════════════════════════
# WAS DIESES SKRIPT TUT
# ═══════════════════════════════════════════════════════════════════════════
#
#   sitzung  Prüft beim Sitzungsstart gegen origin und holt den Stand zurück.
#   wache    Sperrt `git commit`/`git push`, solange der Baum veraltet ist.
#   pruefen  Sagt nur, wie es steht (für die manuelle Kontrolle).
#
# NICHTS WIRD ÜBERSCHRIEBEN, WAS NICHT AUF ORIGIN LIEGT. Ausgerichtet wird nur,
# wenn der lokale Stand ein VORFAHR von origin ist — dann kann nichts Eigenes
# verloren gehen. Bei echter Abweichung wird gewarnt und nichts angefasst.
#
# ═══════════════════════════════════════════════════════════════════════════
# EINRICHTUNG (einmalig, muss von Hand geschehen)
# ═══════════════════════════════════════════════════════════════════════════
#
#   cp scripts/repo-wache.sh ~/.claude/repo-wache.sh
#   chmod +x ~/.claude/repo-wache.sh
#
# Dann in ~/.claude/settings.json (anlegen, falls nicht vorhanden):
#
#   {
#     "hooks": {
#       "SessionStart": [
#         { "hooks": [{ "type": "command",
#                       "command": "~/.claude/repo-wache.sh sitzung" }] }
#       ],
#       "PreToolUse": [
#         { "matcher": "Bash",
#           "hooks": [{ "type": "command",
#                       "command": "~/.claude/repo-wache.sh wache" }] }
#       ]
#     }
#   }
#
# Die Kopie nach ~/.claude ist notwendig: Alles im Projektverzeichnis wird beim
# Rücksprung mit zurückgesetzt — auch dieses Skript. Nur außerhalb überlebt es.

set -uo pipefail

REPO="${REPO_WACHE_PFAD:-/home/user/NewIdea}"
MARKER="${REPO_WACHE_MARKER:-$HOME/.claude/letzter-guter-stand}"
MODUS="${1:-pruefen}"

cd "$REPO" 2>/dev/null || exit 0
git rev-parse --git-dir >/dev/null 2>&1 || exit 0

LOKAL=$(git rev-parse HEAD 2>/dev/null) || exit 0
ZWEIG=$(git symbolic-ref --short HEAD 2>/dev/null || echo '')

# LOSGELÖSTER HEAD ist kein Grund auszusteigen — im Gegenteil.
#
# Die erste Fassung verließ hier das Skript, wenn kein Zweig auf HEAD zeigte.
# Beim Testen fiel auf: Dann greift die Wache genau in der Lage nicht, in der
# ein Commit am meisten anrichtet (er hängt an gar keinem Zweig). Für die
# Vergleiche gegen den Marker braucht es keinen Zweignamen — nur für den
# Vorschlag, wie man wiederherstellt.
if [ -z "$ZWEIG" ]; then
  if [ "$MODUS" = "sitzung" ] || [ "$MODUS" = "pruefen" ]; then
    # Ohne Zweig gibt es nichts, wogegen man abgleichen könnte.
    exit 0
  fi
  ZWEIG='<zweig>'
fi

meldung() {
  TEXT="$1" python3 -c 'import json, os; print(json.dumps({"systemMessage": os.environ["TEXT"]}))'
}

sperre() {
  GRUND="$1" python3 -c '
import json, os
print(json.dumps({"hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "deny",
    "permissionDecisionReason": os.environ["GRUND"],
}}))'
}

wiederherstellen_hinweis="git fetch origin $ZWEIG && git checkout -B $ZWEIG origin/$ZWEIG"

# ── Betriebsart „wache" ─────────────────────────────────────────────────────
if [ "$MODUS" = "wache" ]; then
  # NUR bei commit und push eingreifen.
  #
  # Würde die Wache jeden Bash-Aufruf sperren, sägte sie den Ast ab, auf dem
  # sie sitzt: Wiederherstellen geht über `git fetch` und `git checkout` — und
  # genau die wären dann auch blockiert. Gesperrt wird deshalb ausschließlich
  # das, was Schaden anrichtet: einen Commit auf altem Baum festschreiben.
  BEFEHL=$(python3 -c '
import json, sys
try:
    print(json.load(sys.stdin).get("tool_input", {}).get("command", ""))
except Exception:
    print("")' 2>/dev/null)
  case "$BEFEHL" in
    *"git commit"*|*"git push"*) ;;
    *) exit 0 ;;
  esac

  # OHNE NETZ: Der gespeicherte Stand reicht, um einen Rücksprung zu erkennen.
  # Ein Netzaufruf vor jedem Commit wäre eine Fehlerquelle mehr.
  [ -f "$MARKER" ] || exit 0
  GUT=$(cat "$MARKER")
  [ "$LOKAL" = "$GUT" ] && exit 0

  # Kennt das Repository den guten Stand überhaupt noch? Wenn nicht, wurde es
  # zurückgesetzt — der Commit von vorhin existiert lokal nicht mehr.
  if ! git cat-file -e "$GUT" 2>/dev/null; then
    sperre "Arbeitsverzeichnis zurückgesetzt: Der lokale Stand ${LOKAL:0:7} kennt den zuletzt gepushten Commit ${GUT:0:7} nicht mehr. Ein Commit von hier aus würde alten Inhalt unter neuer Nachricht festschreiben. Zuerst: $wiederherstellen_hinweis"
    exit 0
  fi

  # Guter Stand ist bekannt und liegt VOR uns → wir sind zurückgefallen.
  if git merge-base --is-ancestor "$LOKAL" "$GUT" 2>/dev/null; then
    sperre "Der lokale Stand ${LOKAL:0:7} liegt HINTER dem zuletzt gepushten ${GUT:0:7} — das Arbeitsverzeichnis wurde zurückgesetzt. Zuerst: $wiederherstellen_hinweis"
  fi
  exit 0
fi

# ── Betriebsarten „sitzung" und „pruefen" ───────────────────────────────────
if ! git fetch --quiet origin "$ZWEIG" 2>/dev/null; then
  [ "$MODUS" = "sitzung" ] && meldung "Repo-Wache: origin nicht erreichbar, nichts geändert."
  exit 0
fi
FERN=$(git rev-parse "origin/$ZWEIG" 2>/dev/null) || exit 0

if [ "$LOKAL" = "$FERN" ]; then
  echo "$FERN" > "$MARKER" 2>/dev/null
  [ "$MODUS" = "pruefen" ] && echo "in Ordnung — lokal und origin stehen beide auf ${FERN:0:7}"
  exit 0
fi

if git merge-base --is-ancestor "$LOKAL" "$FERN" 2>/dev/null; then
  # Lokal ist ein Vorfahr von origin — es kann nichts Eigenes verloren gehen.
  if [ "$MODUS" = "pruefen" ]; then
    echo "ZURÜCKGESETZT — lokal ${LOKAL:0:7}, origin ${FERN:0:7}. Beheben mit: $wiederherstellen_hinweis"
    exit 1
  fi
  git stash push -u -m "vor-wiederherstellung-$(date +%s)" >/dev/null 2>&1
  if git checkout -B "$ZWEIG" "origin/$ZWEIG" >/dev/null 2>&1; then
    echo "$FERN" > "$MARKER" 2>/dev/null
    meldung "Repo-Wache: Arbeitsverzeichnis lag auf ${LOKAL:0:7} und wurde auf origin (${FERN:0:7}) zurückgeholt. Das Abbild der Umgebung ist älter als der Stand auf GitHub."
  fi
  exit 0
fi

# Auseinandergelaufen — hier könnten eigene, noch nicht gepushte Commits liegen.
if [ "$MODUS" = "pruefen" ]; then
  echo "ABWEICHUNG — lokal ${LOKAL:0:7} und origin ${FERN:0:7} sind auseinandergelaufen. Nichts angefasst."
  exit 2
fi
meldung "Repo-Wache: lokal ${LOKAL:0:7} und origin ${FERN:0:7} sind auseinandergelaufen. NICHTS angefasst — hier könnten eigene Commits liegen."
exit 0
