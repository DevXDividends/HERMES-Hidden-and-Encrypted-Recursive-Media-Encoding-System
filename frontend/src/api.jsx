import axios from 'axios'
console.log("API URL =", import.meta.env.VITE_API_URL);

const BASE = `${import.meta.env.VITE_API_URL}/api`;


// Extract filename from Content-Disposition header
function getFilename(headers, fallback = 'hermes_output') {
  const cd = headers['content-disposition'] || ''
  const match = cd.match(/filename[^;=\n]*=\s*(['"]?)([^'"\n;]+)\1/)
  return match ? match[2].trim() : fallback
}

export async function encodeData(payload) {
  const form = new FormData()
  form.append('hidden_type',  payload.hiddenType)
  form.append('carrier_type', payload.carrierType)
  form.append('enc_mode',     payload.encMode)
  form.append('password',     payload.password   || '')
  form.append('pub_key',      payload.pubKey     || '')
  form.append('cover_text',   payload.coverText  || '')
  form.append('secret_text',  payload.secretText || '')

  if (payload.carrierFile) form.append('carrier_file', payload.carrierFile)
  if (payload.hiddenFile)  form.append('hidden_file',  payload.hiddenFile)

  const res = await axios.post(`${BASE}/encode`, form, {
    responseType: 'blob',
    headers: { 'Content-Type': 'multipart/form-data' },
  })

  // Determine correct extension based on carrier type
  const extensionMap = {
    text:  '.txt',
    image: '.png',
    audio: '.wav',
    video: '.mp4',
  }
  const ext      = extensionMap[payload.carrierType] || ''
  const filename = getFilename(res.headers, `hermes_${payload.hiddenType}_in_${payload.carrierType}${ext}`)

  return { blob: res.data, filename, headers: res.headers }
}

export async function decodeData(payload) {
  const form = new FormData()
  form.append('hidden_type',  payload.hiddenType)
  form.append('carrier_type', payload.carrierType)
  form.append('enc_mode',     payload.encMode)
  form.append('password',     payload.password || '')
  form.append('priv_key',     payload.privKey  || '')

  if (payload.stegoFile) form.append('stego_file', payload.stegoFile)

  const res = await axios.post(`${BASE}/decode`, form, {
    responseType: 'blob',
    headers: { 'Content-Type': 'multipart/form-data' },
  })

  const contentType = res.headers['content-type'] || ''

  // Text hidden type returns JSON with content field
  if (contentType.includes('application/json')) {
    const text = await res.data.text()
    try {
      return { type: 'text', content: JSON.parse(text).content }
    } catch {
      return { type: 'text', content: text }
    }
  }

  const extensionMap = { text: '.txt', image: '.png', audio: '.wav', video: '.mp4' }
  const ext      = extensionMap[payload.hiddenType] || ''
  const filename = getFilename(res.headers, `hidden_${payload.hiddenType}${ext}`)

  return { type: 'file', blob: res.data, filename, headers: res.headers }
}

export async function generateKeypair() {
  const res = await axios.post(`${BASE}/generate-keypair`)
  return res.data
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a   = document.createElement('a')
  a.href     = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}