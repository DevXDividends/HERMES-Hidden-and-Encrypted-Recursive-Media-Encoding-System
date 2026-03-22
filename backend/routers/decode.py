from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import StreamingResponse
from typing import Optional
from io import BytesIO
import base64
import zlib
import sys, os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from crypto import decrypt_with_password, decrypt_with_private_key

from core.text.text_to_text   import decode_text_from_text
from core.text.text_to_image  import decode_text_from_image
from core.text.text_to_audio  import decode_text_from_audio
from core.text.text_to_video  import decode_text_from_video

from core.image.image_to_image import decode_image_from_image
from core.image.image_to_video import decode_image_from_video
from core.image.image_to_audio import decode_image_from_audio

from core.audio.audio_to_audio import decode_audio_from_audio
from core.audio.audio_to_image import decode_audio_from_image
from core.audio.audio_to_video import decode_audio_from_video

from core.video.video_to_text  import decode_video_from_text
from core.video.video_to_image import decode_video_from_image
from core.video.video_to_audio import decode_video_from_audio
from core.video.video_to_video import decode_video_from_video

router = APIRouter(prefix="/api", tags=["decode"])

# ── Helpers ───────────────────────────────────────────────────────────────────

def maybe_decrypt(data: bytes, enc_mode: str, password: str = "", priv_key: str = "") -> bytes:
    if enc_mode == "password":
        if not password:
            raise HTTPException(400, "Password required for decryption")
        return decrypt_with_password(data, password)
    elif enc_mode == "keypair":
        if not priv_key:
            raise HTTPException(400, "Private key required for decryption")
        return decrypt_with_private_key(data, priv_key.encode("utf-8"))
    return data


def lsb_extract_raw_from_wav(data: bytes) -> bytes:
    import wave
    with wave.open(BytesIO(data), "rb") as w:
        frames = w.readframes(w.getnframes())
    bits = "".join(str(b & 1) for b in frames)
    raw  = bytes(int(bits[i:i+8], 2) for i in range(0, len(bits), 8))
    length   = int.from_bytes(raw[:4], "big")
    checksum = int.from_bytes(raw[4:8], "big")
    result   = raw[8:8+length]
    if len(result) != length:
        raise HTTPException(400, "Incomplete hidden data")
    if zlib.crc32(result) != checksum:
        raise HTTPException(400, "Hidden data corrupted — checksum mismatch")
    return result


def eof_extract_from_data(data: bytes, magic: bytes) -> bytes:
    idx = data.rfind(magic)
    if idx == -1:
        raise HTTPException(400, "No hidden data found in this file")
    ms       = idx + len(magic)
    length   = int.from_bytes(data[ms:ms+4], "big")
    checksum = int.from_bytes(data[ms+4:ms+8], "big")
    result   = data[ms+8:ms+8+length]
    if len(result) != length:
        raise HTTPException(400, "Incomplete hidden data")
    if zlib.crc32(result) != checksum:
        raise HTTPException(400, "Hidden data corrupted — checksum mismatch")
    return result


def stream_file(data: bytes, filename: str, media_type: str = "application/octet-stream"):
    return StreamingResponse(
        BytesIO(data),
        media_type=media_type,
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


def stream_text(text: str):
    return {"type": "text", "content": text}


# ── Decode endpoint ───────────────────────────────────────────────────────────

@router.post("/decode")
async def decode(
    hidden_type:  str  = Form(...),
    carrier_type: str  = Form(...),
    enc_mode:     str  = Form("none"),
    password:     str  = Form(""),
    priv_key:     str  = Form(""),
    stego_file:   Optional[UploadFile] = File(None),
):
    try:
        data = await stego_file.read() if stego_file else b""

        # ── TEXT hidden ───────────────────────────────────────────────────────
        if hidden_type == "text":
            if carrier_type == "text":
                extracted = decode_text_from_text(data.decode("utf-8"))
            elif carrier_type == "image":
                extracted = decode_text_from_image(BytesIO(data))
            elif carrier_type == "audio":
                extracted = decode_text_from_audio(BytesIO(data))
            elif carrier_type == "video":
                extracted = decode_text_from_video(BytesIO(data))
            else:
                raise HTTPException(400, "Unsupported carrier")

            if enc_mode != "none":
                dec_bytes = maybe_decrypt(base64.b64decode(extracted), enc_mode, password, priv_key)
                return {"type": "text", "content": dec_bytes.decode("utf-8")}
            return {"type": "text", "content": extracted}

        # ── IMAGE hidden ──────────────────────────────────────────────────────
        elif hidden_type == "image":
            if carrier_type == "text":
                raw = eof_extract_from_data(data, b"HERMESITX")
            elif carrier_type == "image":
                raw = decode_image_from_image(BytesIO(data))
            elif carrier_type == "audio":
                if enc_mode != "none":
                    raw = lsb_extract_raw_from_wav(data)
                else:
                    raw = decode_image_from_audio(BytesIO(data))
            elif carrier_type == "video":
                raw = decode_image_from_video(BytesIO(data))
            else:
                raise HTTPException(400, "Unsupported carrier")

            dec = maybe_decrypt(raw, enc_mode, password, priv_key)
            return stream_file(dec, "hidden_image.png", "image/png")

        # ── AUDIO hidden ──────────────────────────────────────────────────────
        elif hidden_type == "audio":
            if carrier_type == "text":
                raw = eof_extract_from_data(data, b"HERMESATX")
            elif carrier_type == "image":
                raw = decode_audio_from_image(BytesIO(data))
            elif carrier_type == "audio":
                if enc_mode != "none":
                    raw = lsb_extract_raw_from_wav(data)
                else:
                    raw = decode_audio_from_audio(BytesIO(data))
            elif carrier_type == "video":
                raw = decode_audio_from_video(BytesIO(data))
            else:
                raise HTTPException(400, "Unsupported carrier")

            dec = maybe_decrypt(raw, enc_mode, password, priv_key)
            return stream_file(dec, "hidden_audio.wav", "audio/wav")

        # ── VIDEO hidden ──────────────────────────────────────────────────────
        elif hidden_type == "video":
            if carrier_type == "text":
                raw = decode_video_from_text(data)
            elif carrier_type == "image":
                raw = decode_video_from_image(BytesIO(data))
            elif carrier_type == "audio":
                raw = decode_video_from_audio(BytesIO(data))
            elif carrier_type == "video":
                raw = decode_video_from_video(BytesIO(data))
            else:
                raise HTTPException(400, "Unsupported carrier")

            dec = maybe_decrypt(raw, enc_mode, password, priv_key)
            return stream_file(dec, "hidden_video.mp4", "video/mp4")

        raise HTTPException(400, f"Unsupported hidden type: {hidden_type}")

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, str(e))