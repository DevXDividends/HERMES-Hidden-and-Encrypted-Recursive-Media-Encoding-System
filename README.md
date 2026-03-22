<div align="center">
  <img src="https://img.icons8.com/color/120/000000/satellite-in-orbit.png" alt="Hermes Logo" width="120" />
  
  # 🛰️ HERMES
  
  **H**idden & **E**ncrypted **R**ecursive **M**edia **E**ncoding **S**ystem
  
  *A unified steganography platform to conceal anything, anywhere.*

  [![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
  [![React](https://img.shields.io/badge/Frontend-React%20+%20Vite-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
  [![Python](https://img.shields.io/badge/Python-3.8%2B-blue?style=for-the-badge&logo=python)](https://python.org)
  [![Cryptography](https://img.shields.io/badge/Cryptography-Secure-yellow?style=for-the-badge&logo=LetsEncrypt)](https://cryptography.io)
  [![Contributions Welcome](https://img.shields.io/badge/Contributions-Welcome-brightgreen.svg?style=for-the-badge)](#contributors)
  [![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](#license)
  
</div>

---

## 🌟 Overview

**HERMES** provides a modern, full-stack web interface for hiding secret data within various media types — Text, Images, Audio, and Video files.

Using steganography techniques like **Least Significant Bit (LSB)** embedding, **Zero-Width character mapping**, and **EOF appending**, HERMES ensures hidden data remains completely invisible. Combined with **end-to-end encryption**, even if someone discovers the hidden data, they cannot read it without the correct password or private key.

---

## 🏗️ Architecture

HERMES is built as a decoupled full-stack application:

```
┌─────────────────────────────────┐        ┌──────────────────────────────────┐
│         Frontend (React)        │        │        Backend (FastAPI)          │
│                                 │        │                                   │
│  React + Vite + Tailwind        │◄──────►│  /api/encode   — hide data       │
│  Framer Motion animations       │  HTTP  │  /api/decode   — extract data    │
│  Lucide icons                   │        │  /api/keypair  — generate keys   │
│  Deep space animated UI         │        │                                   │
└─────────────────────────────────┘        └──────────────────────────────────┘
         localhost:5173                              localhost:8000
```

### Request Flow

```
User selects options in UI
        │
        ▼
Frontend builds FormData
(hidden_type, carrier_type, enc_mode, files...)
        │
        ▼
POST /api/encode  or  POST /api/decode
        │
        ▼
Backend router selects correct core module
        │
        ├── Encrypt payload (if enc_mode != none)
        │
        ├── Call core steganography function
        │       e.g. encode_text_into_image()
        │            encode_audio_into_text()
        │
        └── Stream file back as download
                │
                ▼
        Frontend triggers browser download
```

---

## ✨ Features Supported

All 16 carrier × payload combinations are fully implemented:

| Payload 👇 \ Carrier 👉 | **📝 Text** | **🖼️ Image** | **🎵 Audio** | **🎬 Video** |
| :---: | :---: | :---: | :---: | :---: |
| **📝 Text**  | ✅ Zero-Width Chars | ✅ LSB (PNG) | ✅ LSB (WAV) | ✅ EOF Appending |
| **🖼️ Image** | ✅ Zero-Width Chars | ✅ LSB (PNG) | ✅ LSB (WAV) | ✅ EOF Appending |
| **🎵 Audio** | ✅ Zero-Width Chars | ✅ LSB (PNG) | ✅ LSB (WAV) | ✅ EOF Appending |
| **🎬 Video** | ✅ Zero-Width Chars | ✅ EOF Appending | ✅ EOF Appending | ✅ EOF Appending |

> **Note:** Text carriers use Zero-Width Unicode characters — the cover text looks completely normal when opened. Video carriers use fast EOF Appending — no size limits, encodes in seconds.

---

## 🔐 Encryption

HERMES supports **two encryption modes**. Encryption is applied to the payload *before* steganographic embedding — so even raw extraction reveals nothing readable.

### Mode 1 — Password (AES-256-GCM + PBKDF2)

- **PBKDF2** converts your password into a strong 256-bit key
- **AES-256-GCM** encrypts the data (same standard used by banks and governments)
- A random **salt** is generated every time — same password → different ciphertext each time
- The **GCM tag** detects any tampering automatically

### Mode 2 — Keypair (RSA-OAEP + AES-256-GCM)

- Receiver generates a keypair — a **public key** and a **private key**
- Sender encrypts using receiver's **public key** (safe to share)
- Only receiver's **private key** can decrypt — it never leaves their device

**How to use Keypair mode:**
1. **Receiver** opens HERMES → Encryption → Keypair → click **"Generate keypair"**
2. Download **both** files immediately — `hermes_private.pem` and `hermes_public.pem`
3. **Receiver** sends `hermes_public.pem` to the sender (safe to share)
4. **Sender** selects Keypair mode → pastes public key → encodes the message
5. **Receiver** selects Keypair mode → pastes private key → decodes the message

> ⚠️ **Never share your private key.** If someone gets it, they can decrypt all your messages.

---

## 📁 Project Structure

```
HERMES/
├── backend/
│   ├── main.py               ← FastAPI app — registers routers, CORS config
│   ├── crypto.py             ← AES-256-GCM + RSA-OAEP encryption module
│   ├── requirements.txt
│   ├── routers/
│   │   ├── encode.py         ← POST /api/encode — handles all 16 encode combos
│   │   ├── decode.py         ← POST /api/decode — handles all 16 decode combos
│   │   └── keypair.py        ← POST /api/keypair — RSA keypair generation
│   └── core/
│       ├── text/
│       │   ├── text_to_text.py
│       │   ├── text_to_image.py
│       │   ├── text_to_audio.py
│       │   └── text_to_video.py
│       ├── image/
│       │   ├── image_to_text.py
│       │   ├── image_to_image.py
│       │   ├── image_to_audio.py
│       │   └── image_to_video.py
│       ├── audio/
│       │   ├── audio_to_text.py
│       │   ├── audio_to_image.py
│       │   ├── audio_to_audio.py
│       │   └── audio_to_video.py
│       └── video/
│           ├── video_to_text.py
│           ├── video_to_image.py
│           ├── video_to_audio.py
│           └── video_to_video.py
└── frontend/
    └── src/
        ├── api.js            ← Axios wrappers for all backend endpoints
        ├── App.jsx           ← React Router setup
        ├── main.jsx
        ├── index.css         ← CSS variables, global styles
        ├── pages/
        │   ├── Landing.jsx   ← Deep space landing page with LSB demo
        │   └── AppPage.jsx   ← Main encode/decode UI
        └── components/
            └── LSBDemo.jsx   ← Interactive pixel-level LSB visualizer
```

---

## 🚀 Getting Started

### Prerequisites

Ensure you have **Python 3.8+** and **Node.js 18+** installed.

**Install FFmpeg** (required for Video steganography):

| OS | Command |
|---|---|
| Windows | `winget install ffmpeg` |
| macOS | `brew install ffmpeg` |
| Linux | `sudo apt install ffmpeg` |

Verify:
```bash
ffmpeg -version
```

### Backend Setup

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

Backend runs at `http://localhost:8000`  
Swagger docs available at `http://localhost:8000/docs`

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`

> Both backend and frontend must be running simultaneously.

---

## 🛠️ How It Works

### Steganography Techniques

**📝 Text Carriers — Zero-Width Characters**  
Invisible Unicode characters (`\u200B` = 0, `\u200C` = 1, `\u200D` = separator) are inserted after the cover text. The file looks and reads completely normally — the hidden bits are imperceptible to any viewer or editor.

**🖼️ Image Carriers — LSB (Least Significant Bit)**  
The least significant bit of each RGB channel in every pixel is modified to encode payload bits. A 1-bit change per channel is completely invisible to the human eye. Cover image must be PNG (lossless) and large enough to hold the payload.

**🎵 Audio Carriers — LSB (WAV PCM)**  
The same LSB technique is applied to the raw PCM sample bytes of WAV audio files. The audio sounds identical before and after encoding.

**🎬 Video Carriers — EOF Appending**  
Hidden data is appended after the video's end-of-file marker with a magic byte sequence and checksum header. Media players ignore everything after EOF — the video plays perfectly. This method is fast and has no effective size limit.

### Encryption Layer

When encryption is enabled, the payload is encrypted *first*, then embedded:

```
Original data
      │
      ▼  (if password mode)
encrypt_with_password()
  → PBKDF2 derives 256-bit key from password + random salt
  → AES-256-GCM encrypts payload
  → Output: [0x01][salt 16B][nonce 12B][ciphertext + GCM tag]
      │
      ▼  (if keypair mode)
encrypt_with_public_key()
  → Random AES key generated
  → RSA-OAEP encrypts the AES key with receiver's public key
  → AES-256-GCM encrypts payload
  → Output: [0x02][rsa_len 2B][encrypted AES key][nonce 12B][ciphertext]
      │
      ▼
Steganography encode (LSB / Zero-Width / EOF)
      │
      ▼
Stego file — safe to send
```

Decryption reverses this: extract hidden bytes → decrypt → return original data.

---

## 🛡️ Security Details

Every hidden payload includes:
- **CRC32 checksum** — detects any corruption or tampering
- **Length header** — ensures exact byte count on extraction

When encryption is enabled, the full encrypted blob (salt + nonce + ciphertext + GCM tag) is what gets embedded — raw extraction reveals nothing readable without the correct key.

---

## 🧪 Testing Guide

### Test 1 — Basic Steganography (No Encryption)

1. Open HERMES → Encryption → **None**
2. Hidden: **Text**, Carrier: **Image** → Encode
3. Upload a PNG cover image, type `Hello HERMES` → click **Encode** → download
4. Switch to Decode → upload downloaded image → click **Decode**
5. ✅ `Hello HERMES` should appear

### Test 2 — Password Encryption

1. Encryption → **Password** → enter `test123`
2. Encode a message → download stego file
3. Decode with same password `test123`
4. ✅ Original message returned

### Test 3 — Wrong Password (Security Test)

1. Use stego file from Test 2
2. Decode with wrong password `wrongpass`
3. ✅ Red error: `Decryption failed — wrong password or corrupted data`

### Test 4 — Keypair Encryption

1. Encryption → **Keypair** → click **Generate keypair**
2. Download both `hermes_private.pem` and `hermes_public.pem`
3. Encode with public key → download stego file
4. Decode with private key
5. ✅ Original data returned

### Test 5 — Wrong Private Key (Security Test)

1. Generate a **new** keypair
2. Try to decode Test 4's file with the new private key
3. ✅ Red error: `Decryption failed — wrong private key or corrupted data`

### Test 6 — Video → Video

1. Hidden: **Video**, Carrier: **Video**, Encryption: **None**
2. Upload two MP4 files → click **Encode** → should complete in seconds
3. Decode the stego video → ✅ hidden video extracted

### Quick Reference

| Test | Expected Result |
|---|---|
| No encryption encode/decode | Original data returned |
| Correct password | Original data returned |
| Wrong password | Red error shown |
| Correct private key | Original data returned |
| Wrong private key | Red error shown |
| Video → Video | Encodes in seconds, no size limit |

---

## 👨‍💻 Contributors

- **Kartik Pagariya** —   [@KartikPagariya25](https://github.com/KartikPagariya25)
- **Aditya Dengale** —    [@DevXDividends](https://github.com/DevXDividends)
- **Janhavi Pagare** —    [@janhvi-2403](https://github.com/janhvi-2403)
- **Pranali Yelavikar** — [@pranaliyelavikar14](https://github.com/pranaliyelavikar14)

---

<div align="center">
  <p><i>Keep it secret. Keep it safe. 🛰️</i></p>
</div>