#!/usr/bin/env python3
"""TestFlight-Verteilung über die App-Store-Connect-API (Nutzer-Freigabe 07.10.2026).

  testflight.py einrichten    interne Gruppe „Team" (alle Teammitglieder, jeder Build automatisch)
                              + öffentliche Gruppe „Öffentlich" mit Einladungslink, Testinfos,
                              neuesten Build zuordnen und zur Beta-Prüfung einreichen
  testflight.py neuer-build   neuesten Build der öffentlichen Gruppe zuordnen und einreichen

Umgebung: KEY_ID, ISSUER, KEY_P8; optional CONTACT_PHONE (für die Beta-Prüfung).
Kontakt-E-Mail = Impressum (bereits öffentlich). Name aus dem App-Store-Connect-Konto.
"""
import json, os, sys, time, urllib.request, urllib.error
import jwt

API = "https://api.appstoreconnect.apple.com/v1"
BUNDLE = "de.cardbeacon.app"
KONTAKT_MAIL = "bierfinanzen@gmail.com"  # steht im Impressum
LOCALE = "de-DE"
BESCHREIBUNG = ("CardBeacon zeigt Cardmarket-Preise für Pokémon-Sammelkarten mit Datenstand vom Vortag: "
                "CardBeacon Index, Marktbreite, stärkste Bewegungen, Set-Bewegung, Neuheiten, Suche über rund 20.000 Karten "
                "und alle Sets, Preisverlauf aus echten Tageswerten, JP/KR-Preise bei eindeutiger Zuordnung, Portfolio "
                "und Merkliste auf dem Gerät, Marktberichte, Artikel und Guides. Inoffizielle Fan-App, keine Anlageberatung.")
TESTEN = ("Portfolio (Karte über + suchen und hinzufügen, Zeitraum, Aufteilung, Sammlung), Markt, Suche und Sets, "
          "Kartendetail mit Sprachpreisen, Lesen (Bericht, Artikel, Guides), Merkliste. "
          "Rückmeldungen bitte über die Feedback-Funktion von TestFlight.")
OEFFENTLICH = {"publicLinkEnabled": True, "publicLinkLimitEnabled": True, "publicLinkLimit": 1000, "feedbackEnabled": True}


def token() -> str:
    t = int(time.time())
    return jwt.encode({"iss": os.environ["ISSUER"], "iat": t, "exp": t + 1100, "aud": "appstoreconnect-v1"},
                      os.environ["KEY_P8"], algorithm="ES256", headers={"kid": os.environ["KEY_ID"], "typ": "JWT"})


class AppleFehler(Exception):
    def __init__(self, code, text):
        super().__init__(f"HTTP {code}: {text[:700]}")
        self.code = code


def api(methode, pfad, daten=None):
    req = urllib.request.Request(API + pfad, method=methode,
                                 data=json.dumps(daten).encode() if daten is not None else None,
                                 headers={"Authorization": f"Bearer {token()}", "Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            text = r.read()
            return json.loads(text) if text else {}
    except urllib.error.HTTPError as e:
        raise AppleFehler(e.code, e.read().decode())


def app_id():
    return api("GET", f"/apps?filter%5BbundleId%5D={BUNDLE}")["data"][0]["id"]


def neuester_build(app, warten_min=30):
    ende = time.time() + warten_min * 60
    while True:
        b = api("GET", f"/builds?filter%5Bapp%5D={app}&sort=-uploadedDate&limit=1")["data"]
        if b:
            zustand = b[0]["attributes"]["processingState"]
            print(f"Build {b[0]['attributes']['version']}: {zustand}")
            if zustand == "VALID":
                return b[0]
            if zustand in ("FAILED", "INVALID"):
                raise SystemExit("Apple hat den Build abgelehnt.")
        if time.time() > ende:
            raise SystemExit("Build ist nach 30 Minuten noch nicht verarbeitet.")
        time.sleep(30)


def gruppe(app, name, attribute):
    for g in api("GET", f"/apps/{app}/betaGroups?limit=50")["data"]:
        if g["attributes"]["name"] == name:
            return g
    return api("POST", "/betaGroups", {"data": {"type": "betaGroups", "attributes": {"name": name, **attribute},
               "relationships": {"app": {"data": {"type": "apps", "id": app}}}}})["data"]


def team_eintragen(gruppen_id):
    for u in api("GET", "/users?limit=50")["data"]:
        a = u["attributes"]
        mail = a.get("username") or a.get("email")
        name = f"{a.get('firstName', '')} {a.get('lastName', '')}".strip()
        if not mail:
            continue
        try:
            api("POST", "/betaTesters", {"data": {"type": "betaTesters",
                "attributes": {"email": mail, "firstName": a.get("firstName") or "", "lastName": a.get("lastName") or ""},
                "relationships": {"betaGroups": {"data": [{"type": "betaGroups", "id": gruppen_id}]}}}})
            print(f"Tester eingeladen: {name}")
        except AppleFehler as e:
            print(f"Tester {name}: {'bereits vorhanden' if e.code == 409 else e}")


def testinfos(app):
    vorhanden = {l["attributes"]["locale"]: l for l in api("GET", f"/apps/{app}/betaAppLocalizations")["data"]}
    attr = {"description": BESCHREIBUNG, "feedbackEmail": KONTAKT_MAIL,
            "privacyPolicyUrl": "https://cardbeacon.de/datenschutz", "marketingUrl": "https://cardbeacon.de"}
    if LOCALE in vorhanden:
        lid = vorhanden[LOCALE]["id"]
        api("PATCH", f"/betaAppLocalizations/{lid}", {"data": {"type": "betaAppLocalizations", "id": lid, "attributes": attr}})
    else:
        api("POST", "/betaAppLocalizations", {"data": {"type": "betaAppLocalizations", "attributes": {"locale": LOCALE, **attr},
            "relationships": {"app": {"data": {"type": "apps", "id": app}}}}})
    detail = api("GET", f"/apps/{app}/betaAppReviewDetail")["data"]
    nutzer = api("GET", "/users?limit=1")["data"][0]["attributes"]
    attr = {"contactFirstName": nutzer.get("firstName") or "Steffen", "contactLastName": nutzer.get("lastName") or "Karjoth",
            "contactEmail": KONTAKT_MAIL, "demoAccountRequired": False,
            "notes": "Keine Anmeldung nötig. Die App zeigt öffentliche Marktpreise; alle Daten kommen von https://cardbeacon.de/api/v1."}
    if os.environ.get("CONTACT_PHONE"):
        attr["contactPhone"] = os.environ["CONTACT_PHONE"]
    api("PATCH", f"/betaAppReviewDetails/{detail['id']}",
        {"data": {"type": "betaAppReviewDetails", "id": detail["id"], "attributes": attr}})
    print("Testinformationen gesetzt.")


def build_einreichen(build, gruppen_id):
    bid = build["id"]
    de = [l for l in api("GET", f"/builds/{bid}/betaBuildLocalizations")["data"] if l["attributes"]["locale"] == LOCALE]
    if de:
        api("PATCH", f"/betaBuildLocalizations/{de[0]['id']}",
            {"data": {"type": "betaBuildLocalizations", "id": de[0]["id"], "attributes": {"whatToTest": TESTEN}}})
    else:
        api("POST", "/betaBuildLocalizations", {"data": {"type": "betaBuildLocalizations",
            "attributes": {"locale": LOCALE, "whatToTest": TESTEN},
            "relationships": {"build": {"data": {"type": "builds", "id": bid}}}}})
    api("POST", f"/betaGroups/{gruppen_id}/relationships/builds", {"data": [{"type": "builds", "id": bid}]})
    try:
        api("POST", "/betaAppReviewSubmissions", {"data": {"type": "betaAppReviewSubmissions",
            "relationships": {"build": {"data": {"type": "builds", "id": bid}}}}})
        print(f"Build {build['attributes']['version']} zur Beta-Prüfung eingereicht.")
    except AppleFehler as e:
        print(f"Einreichung — Antwort von Apple: {e}")
        if e.code != 409:
            raise SystemExit(1)


def einrichten():
    app = app_id()
    build = neuester_build(app)
    intern = gruppe(app, "Team", {"isInternalGroup": True, "hasAccessToAllBuilds": True})
    print(f"Interne Gruppe: {intern['attributes']['name']}")
    team_eintragen(intern["id"])
    offen = gruppe(app, "Öffentlich", OEFFENTLICH)
    testinfos(app)
    build_einreichen(build, offen["id"])
    link = api("GET", f"/betaGroups/{offen['id']}")["data"]["attributes"].get("publicLink")
    print(f"Öffentlicher Link: {link or '— (aktiv nach Freigabe der Beta-Prüfung)'}")


def neuer_build():
    app = app_id()
    build_einreichen(neuester_build(app), gruppe(app, "Öffentlich", OEFFENTLICH)["id"])


if __name__ == "__main__":
    {"einrichten": einrichten, "neuer-build": neuer_build}[sys.argv[1]]()
