# Setting Up HTTPS Locally with mkcert

This guide explains how to set up self-signed certificates using `mkcert` to enable HTTPS for:
- **app.localhost** → Frontend
- **localhost** → Homarr homepage
- **docs.localhost** → Documentation

## 📌 Prerequisites
Ensure you have `brew` installed (for macOS users).

---

## 🔹 Step 1: Install mkcert and NSS
```sh
brew install mkcert nss // needed for cross-platform compatibility (e.g. Firefox)
mkcert -install
```

## 🔹 Step 2: Generate SSL Certificates
```sh
mkcert -cert-file certs/cert.crt -key-file certs/key.pem app.localhost localhost docs.localhost
```

This creates a certificate valid for app.localhost, localhost, and docs.localhost.

## 🔹 Step 3: Convert to PEM Format 
```sh
openssl x509 -in certs/cert.crt -out certs/cert.pem -outform PEM
```

## 🔹 Add Certificate to System Trust Store 

```sh
sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain certs/cert.pem
```

## 🚀 Final Step: Restart Docker & Services 

```sh
make compose-down
docker stop $(docker ps -a -q)  # Stop all running containers
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
openssl x509 -in certs/cert.crt -text -noout | grep -A 2 "Subject Alternative Name"
```
should output:
```sh
X509v3 Subject Alternative Name:
    DNS:app.localhost, DNS:localhost, DNS:docs.localhost
```
