---
title: "Setting Up HTTPS Locally with mkcert"
---
This guide explains how to set up self-signed certificates using `mkcert` to enable HTTPS for:
- **app.localhost** → Frontend
- **localhost** → Homarr homepage
- **docs.localhost** → Documentation

## 📌 Prerequisites
Ensure you have `brew` installed (for macOS users).

---

## 🔹 Step 1: Install mkcert and NSS
```sh
brew install mkcert nss # needed for cross-platform compatibility (e.g. Firefox)
mkcert -install
```

On Windows (PowerShell), restart the terminal after installing and accept the security prompt from `mkcert -install`:
```powershell
winget install FiloSottile.mkcert
mkcert -install
```

## 🔹 Step 2: Generate SSL Certificates
```sh
mkcert -cert-file certs/cert.pem -key-file certs/key.pem app.localhost localhost docs.localhost dashboard.localhost pgadmin4.localhost redisinsight.localhost
```

This creates a certificate valid for every localhost subdomain Traefik routes: app.localhost, localhost, docs.localhost, dashboard.localhost, pgadmin4.localhost, and redisinsight.localhost.

## 🚀 Final Step: Restart Docker & Services 

```sh
make compose-down
make dev
```

## 🛠 Troubleshooting

### 1. Browser Still Shows "Not Secure"?
- Try opening in **Incognito Mode** or clearing cache.
- Restart your browser after adding the trusted certificate.
- Ensure **Traefik** is correctly configured in `dynamic.yml` to use the generated certs.

### 2. Certificate Not Recognized?
- Run the following command to reinstall mkcert's local CA:
```sh
  mkcert -install
```
### 3. Verify that the certificate contains the expected domains:
```sh
openssl x509 -in certs/cert.pem -text -noout | grep -A 2 "Subject Alternative Name"
```
should output:
```sh
X509v3 Subject Alternative Name:
    DNS:app.localhost, DNS:localhost, DNS:docs.localhost, DNS:dashboard.localhost, DNS:pgadmin4.localhost, DNS:redisinsight.localhost
```

### 4. Firefox on Windows does not trust the certificate?
Open `about:config` and set `security.enterprise_roots.enabled` to `true`, so Firefox trusts the Windows certificate store.
