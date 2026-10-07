#!/usr/bin/env python3
"""Verteilungs-Signatur für den CI-Lauf — ohne Gerät, ohne Mac, nur App-Store-Connect-API.

  signatur.py anlegen <ausgabe-ordner>   Zertifikat (Apple Distribution) + App-Store-Profil
                                         erzeugen, .p12 + .mobileprovision + ids.json ablegen
  signatur.py aufraeumen <ausgabe-ordner> Zertifikat und Profil bei Apple wieder löschen

Warum jedes Mal neu: Der private Schlüssel entsteht auf dem Runner und verlässt ihn nie;
ihn dauerhaft zu speichern hieße, ein weiteres Geheimnis zu verwalten. Apple begrenzt die
Zahl der Verteilungszertifikate — deshalb wird nach dem Hochladen widerrufen. Bereits
hochgeladene Builds bleiben davon unberührt.

Umgebung: KEY_ID, ISSUER, KEY_P8, BUNDLE_ID.
"""
import base64, json, os, sys, time, urllib.request, urllib.error, secrets as zufall
import jwt
from cryptography import x509
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives.serialization import pkcs12
from cryptography.x509.oid import NameOID

API = "https://api.appstoreconnect.apple.com/v1"


def token() -> str:
    jetzt = int(time.time())
    return jwt.encode({"iss": os.environ["ISSUER"], "iat": jetzt, "exp": jetzt + 1100, "aud": "appstoreconnect-v1"},
                      os.environ["KEY_P8"], algorithm="ES256", headers={"kid": os.environ["KEY_ID"], "typ": "JWT"})


def api(methode: str, pfad: str, daten=None):
    anfrage = urllib.request.Request(API + pfad, method=methode,
                                     data=json.dumps(daten).encode() if daten is not None else None,
                                     headers={"Authorization": f"Bearer {token()}", "Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(anfrage, timeout=60) as r:
            text = r.read()
            return json.loads(text) if text else {}
    except urllib.error.HTTPError as e:
        raise SystemExit(f"Apple {methode} {pfad}: HTTP {e.code} {e.read().decode()[:600]}")


def anlegen(ordner: str) -> None:
    os.makedirs(ordner, exist_ok=True)
    bundle = os.environ.get("BUNDLE_ID", "de.cardbeacon.app")
    bid = api("GET", f"/bundleIds?filter%5Bidentifier%5D={bundle}")["data"][0]["id"]

    schluessel = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    csr = (x509.CertificateSigningRequestBuilder()
           .subject_name(x509.Name([x509.NameAttribute(NameOID.COMMON_NAME, "CardBeacon CI")]))
           .sign(schluessel, hashes.SHA256()))
    csr_pem = csr.public_bytes(serialization.Encoding.PEM).decode()

    zert = api("POST", "/certificates", {"data": {"type": "certificates", "attributes": {
        "certificateType": "DISTRIBUTION", "csrContent": csr_pem}}})["data"]
    zert_id = zert["id"]
    der = base64.b64decode(zert["attributes"]["certificateContent"])
    cert = x509.load_der_x509_certificate(der)

    passwort = zufall.token_urlsafe(18)
    # Klassisches PKCS12 (SHA1/3DES): macOS `security import` liest die moderne
    # AES/PBKDF2-Variante nicht ("MAC verification failed").
    verschluesselung = (serialization.PrivateFormat.PKCS12.encryption_builder()
                        .kdf_rounds(50000)
                        .key_cert_algorithm(pkcs12.PBES.PBESv1SHA1And3KeyTripleDESCBC)
                        .hmac_hash(hashes.SHA1())
                        .build(passwort.encode()))
    p12 = pkcs12.serialize_key_and_certificates(b"cardbeacon-ci", schluessel, cert, None, verschluesselung)
    open(os.path.join(ordner, "signatur.p12"), "wb").write(p12)

    name = f"CardBeacon CI {int(time.time())}"
    profil = api("POST", "/profiles", {"data": {"type": "profiles", "attributes": {"name": name, "profileType": "IOS_APP_STORE"},
        "relationships": {"bundleId": {"data": {"type": "bundleIds", "id": bid}},
                          "certificates": {"data": [{"type": "certificates", "id": zert_id}]}}}})["data"]
    open(os.path.join(ordner, "profil.mobileprovision"), "wb").write(base64.b64decode(profil["attributes"]["profileContent"]))

    json.dump({"zertifikat": zert_id, "profil": profil["id"], "profilName": name, "profilUuid": profil["attributes"]["uuid"],
               "passwort": passwort}, open(os.path.join(ordner, "ids.json"), "w"))
    print(f"Zertifikat {zert_id} und Profil '{name}' angelegt.")


def aufraeumen(ordner: str) -> None:
    pfad = os.path.join(ordner, "ids.json")
    if not os.path.exists(pfad):
        print("Nichts aufzuräumen.")
        return
    ids = json.load(open(pfad))
    for art, schluessel in (("profiles", "profil"), ("certificates", "zertifikat")):
        try:
            api("DELETE", f"/{art}/{ids[schluessel]}")
            print(f"{art} {ids[schluessel]} gelöscht.")
        except SystemExit as e:
            print(f"Warnung: {e}")


if __name__ == "__main__":
    {"anlegen": anlegen, "aufraeumen": aufraeumen}[sys.argv[1]](sys.argv[2])
