import base64
import zlib

ZW_ZERO = "\u200B"  # bit 0
ZW_ONE  = "\u200C"  # bit 1
ZW_MARK = "\u200D"  # separator (invisible)


def _bytes_to_zw(data: bytes) -> str:
    bits = "".join(f"{b:08b}" for b in data)
    return "".join(ZW_ONE if bit == "1" else ZW_ZERO for bit in bits)


def _zw_to_bytes(text: str) -> bytes:
    bits = []
    for ch in text:
        if ch == ZW_ONE:
            bits.append("1")
        elif ch == ZW_ZERO:
            bits.append("0")

    bit_string = "".join(bits)
    if len(bit_string) % 8 != 0:
        raise ValueError("Corrupted hidden data")

    return bytes(
        int(bit_string[i:i + 8], 2)
        for i in range(0, len(bit_string), 8)
    )


def encode_video_into_text(cover_text: str, hidden_video) -> str:
    if not cover_text.strip():
        raise ValueError("Cover text cannot be empty")

    hidden_video.seek(0)
    video_bytes = hidden_video.read()
    if not video_bytes:
        raise ValueError("Hidden video is empty")

    checksum = zlib.crc32(video_bytes)
    payload  = checksum.to_bytes(4, "big") + video_bytes
    encoded  = base64.b64encode(payload)

    zw_payload = _bytes_to_zw(encoded)

    return cover_text.rstrip() + ZW_MARK + zw_payload


def decode_video_from_text(data) -> bytes:
    if isinstance(data, bytes):
        data = data.decode("utf-8")

    if ZW_MARK not in data:
        raise ValueError("No hidden video found")

    zw_payload  = data.split(ZW_MARK, 1)[1]
    encoded     = _zw_to_bytes(zw_payload)

    raw         = base64.b64decode(encoded)
    checksum    = int.from_bytes(raw[:4], "big")
    video_bytes = raw[4:]

    if zlib.crc32(video_bytes) != checksum:
        raise ValueError("Hidden video corrupted (checksum mismatch)")

    return video_bytes