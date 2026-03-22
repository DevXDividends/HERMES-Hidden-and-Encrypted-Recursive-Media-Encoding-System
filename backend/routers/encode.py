from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import StreamingResponse
from typing import Optional
from io import BytesIO
import base64
import zlib
import sys, os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from crypto import encrypt_with_password, encrypt_with_public_key

from core.text.text_to_text   import encode_text_into_text
from core.text.text_to_image  import encode_text_into_image
from core.text.text_to_audio  import encode_text_into_audio
from core.text.text_to_video  import encode_text_into_video

from core.image.image_to_image import encode_image_into_image
from core.image.image_to_video import encode_image_into_video
from core.image.image_to_audio import encode_image_into_audio
from core.image.image_to_text  import encode_image_into_text

from core.audio.audio_to_audio import encode_audio_into_audio
from core.audio.audio_to_image import encode_audio_into_image
from core.audio.audio_to_video import encode_audio_into_video

from core.video.video_to_text  import encode_video_into_text
from core.video.video_to_image import encode_video_into_image
from core.video.video_to_audio import encode_video_into_audio
from core.video.video_to_video import encode_video_into_video

router = APIRouter(prefix="/api", tags=["encode"])

# ── Helpers ───────────────────────────────────────────────────────────────────

def maybe_encrypt(data: bytes, enc_mode: str, password: str = "", pub_key: str = "") -> bytes:
    if enc_mode == "password":
        if not password:
            raise HTTPException(400, "Password required for password encryption mode")
        return encrypt_with_password(data, password)
    elif enc_mode == "keypair":
        if not pub_key:
            raise HTTPException(400, "Public key required for keypair encryption mode")
        return encrypt_with_public_key(data, pub_key.encode("utf-8"))
    return data


def lsb_embed_raw_into_png(cover_bytes: bytes, hidden_bytes: bytes) -> bytes:
    import numpy as np
    from PIL import Image
    cover = Image.open(BytesIO(cover_bytes)).convert("RGB")
    arr   = __import__("numpy").array(cover)
    checksum = zlib.crc32(hidden_bytes)
    header   = len(hidden_bytes).to_bytes(4, "big") + checksum.to_bytes(4, "big")
    payload  = header + hidden_bytes
    bits     = "".join(f"{b:08b}" for b in payload)
    if len(bits) > arr.size:
        raise HTTPException(400, "Cover PNG too small to hold the hidden data — use a larger image")
    flat = arr.reshape(-1)
    for i in range(len(bits)):
        flat[i] = (flat[i] & 0xFE) | int(bits[i])
    out = BytesIO()
    Image.fromarray(flat.reshape(arr.shape)).save(out, format="PNG")
    out.seek(0)
    return out.read()


def lsb_embed_raw_into_wav(cover_bytes: bytes, hidden_bytes: bytes) -> bytes:
    import wave, io
    with wave.open(BytesIO(cover_bytes), "rb") as w:
        params = w.getparams()
        frames = bytearray(w.readframes(w.getnframes()))
    checksum = zlib.crc32(hidden_bytes)
    header   = len(hidden_bytes).to_bytes(4, "big") + checksum.to_bytes(4, "big")
    payload  = header + hidden_bytes
    bits     = "".join(f"{b:08b}" for b in payload)
    if len(bits) > len(frames):
        raise HTTPException(400, "Cover WAV too small — use a larger WAV file")
    for i in range(len(bits)):
        frames[i] = (frames[i] & 0xFE) | int(bits[i])
    out = BytesIO()
    with wave.open(out, "wb") as w:
        w.setparams(params)
        w.writeframes(frames)
    out.seek(0)
    return out.read()


def eof_embed_into_text(cover_text: str, hidden_bytes: bytes, magic: bytes) -> bytes:
    checksum = zlib.crc32(hidden_bytes)
    header   = len(hidden_bytes).to_bytes(4, "big") + checksum.to_bytes(4, "big")
    return cover_text.encode("utf-8") + magic + header + hidden_bytes


def stream_file(data: bytes, filename: str, media_type: str = "application/octet-stream"):
    return StreamingResponse(
        BytesIO(data),
        media_type=media_type,
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


# ── Encode endpoint ───────────────────────────────────────────────────────────

@router.post("/encode")
async def encode(
    hidden_type:  str  = Form(...),
    carrier_type: str  = Form(...),
    enc_mode:     str  = Form("none"),
    password:     str  = Form(""),
    pub_key:      str  = Form(""),
    cover_text:   str  = Form(""),
    secret_text:  str  = Form(""),
    carrier_file: Optional[UploadFile] = File(None),
    hidden_file:  Optional[UploadFile] = File(None),
):
    try:
        carrier_bytes = await carrier_file.read() if carrier_file else b""
        hidden_bytes  = await hidden_file.read()  if hidden_file  else b""

        # ── TEXT hidden ───────────────────────────────────────────────────────
        if hidden_type == "text":
            enc = maybe_encrypt(secret_text.encode("utf-8"), enc_mode, password, pub_key)
            payload_str = base64.b64encode(enc).decode() if enc_mode != "none" else secret_text

            if carrier_type == "text":
                out = encode_text_into_text(payload_str, cover_text)
                return stream_file(out.encode("utf-8") if isinstance(out, str) else out, "hermes_text.txt", "text/plain")

            elif carrier_type == "image":
                stego = encode_text_into_image(BytesIO(carrier_bytes), payload_str)
                buf = BytesIO(); stego.save(buf, format="PNG"); buf.seek(0)
                return stream_file(buf.read(), "hermes_image.png", "image/png")

            elif carrier_type == "audio":
                out = encode_text_into_audio(BytesIO(carrier_bytes), payload_str)
                return stream_file(out, "hermes_audio.wav", "audio/wav")

            elif carrier_type == "video":
                out = encode_text_into_video(BytesIO(carrier_bytes), payload_str)
                return stream_file(out, "hermes_video.mp4", "video/mp4")

        # ── IMAGE hidden ──────────────────────────────────────────────────────
        elif hidden_type == "image":
            enc = maybe_encrypt(hidden_bytes, enc_mode, password, pub_key)

            if carrier_type == "text":
                if not cover_text.strip():
                    raise HTTPException(400, "Cover text is required when carrier is Text")
                out = encode_image_into_text(cover_text, BytesIO(enc))
                return stream_file(out.encode("utf-8"), "hermes_image_text.txt", "text/plain")

            elif carrier_type == "image":
                if enc_mode != "none":
                    out = lsb_embed_raw_into_png(carrier_bytes, enc)
                else:
                    stego = encode_image_into_image(BytesIO(carrier_bytes), BytesIO(enc))
                    buf = BytesIO(); stego.save(buf, format="PNG"); buf.seek(0)
                    out = buf.read()
                return stream_file(out, "hermes_image_stego.png", "image/png")

            elif carrier_type == "audio":
                if enc_mode != "none":
                    out = lsb_embed_raw_into_wav(carrier_bytes, enc)
                else:
                    out = encode_image_into_audio(BytesIO(carrier_bytes), BytesIO(enc))
                return stream_file(out, "hermes_image_audio.wav", "audio/wav")

            elif carrier_type == "video":
                out = encode_image_into_video(BytesIO(carrier_bytes), BytesIO(enc))
                return stream_file(out, "hermes_image_video.mp4")

        # ── AUDIO hidden ──────────────────────────────────────────────────────
        elif hidden_type == "audio":
            enc = maybe_encrypt(hidden_bytes, enc_mode, password, pub_key)

            if carrier_type == "text":
                if not cover_text.strip():
                    raise HTTPException(400, "Cover text is required when carrier is Text")
                out = eof_embed_into_text(cover_text, enc, b"HERMESATX")
                return stream_file(out, "hermes_audio_text.txt")

            elif carrier_type == "image":
                if enc_mode != "none":
                    out = lsb_embed_raw_into_png(carrier_bytes, enc)
                else:
                    stego = encode_audio_into_image(BytesIO(carrier_bytes), BytesIO(enc))
                    buf = BytesIO(); stego.save(buf, format="PNG"); buf.seek(0)
                    out = buf.read()
                return stream_file(out, "hermes_audio_image.png", "image/png")

            elif carrier_type == "audio":
                if enc_mode != "none":
                    out = lsb_embed_raw_into_wav(carrier_bytes, enc)
                else:
                    out = encode_audio_into_audio(BytesIO(carrier_bytes), BytesIO(enc))
                return stream_file(out, "hermes_audio_stego.wav", "audio/wav")

            elif carrier_type == "video":
                out = encode_audio_into_video(BytesIO(carrier_bytes), BytesIO(enc))
                return stream_file(out, "hermes_audio_video.mp4")

        # ── VIDEO hidden ──────────────────────────────────────────────────────
        elif hidden_type == "video":
            enc = maybe_encrypt(hidden_bytes, enc_mode, password, pub_key)

            if carrier_type == "text":
                out = encode_video_into_text(cover_text, BytesIO(enc))
                return stream_file(out, "hermes_video_text.txt")

            elif carrier_type == "image":
                out = encode_video_into_image(BytesIO(carrier_bytes), BytesIO(enc))
                return stream_file(out, "hermes_video_image.png")

            elif carrier_type == "audio":
                out = encode_video_into_audio(BytesIO(carrier_bytes), BytesIO(enc))
                return stream_file(out, "hermes_video_audio.wav")

            elif carrier_type == "video":
                out = encode_video_into_video(BytesIO(carrier_bytes), BytesIO(enc))
                return stream_file(out, "hermes_video_stego.mp4")

        raise HTTPException(400, f"Unsupported combination: {hidden_type} into {carrier_type}")

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, str(e))