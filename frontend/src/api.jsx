import axios from 'axios'

const BASE = 'http://localhost:8000/api'

export async function encodeData(payload) {
  const form = new FormData()
  form.append('hidden_type',  payload.hiddenType)
  form.append('carrier_type', payload.carrierType)
  form.append('enc_mode',     payload.encMode)
  form.append('password',     payload.password  || '')
  form.append('pub_key',      payload.pubKey    || '')
  form.append('cover_text',   payload.coverText || '')
  form.append('secret_text',  payload.secretText|| '')

  if (payload.carrierFile) form.append('carrier_file', payload.carrierFile)
  if (payload.hiddenFile)  form.append('hidden_file',  payload.hiddenFile)

  const res = await axios.post(`${BASE}/encode`, form, {
    responseType: 'blob',
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res
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

  // Check if response is JSON (text result) or binary (file result)
  const contentType = res.headers['content-type'] || ''
  if (contentType.includes('application/json')) {
    const text = await res.data.text()
    return { type: 'text', content: JSON.parse(text).content }
  }
  return { type: 'file', blob: res.data, headers: res.headers }
}

export async function generateKeypair() {
  const res = await axios.post(`${BASE}/generate-keypair`)
  return res.data
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a   = document.createElement('a')
  a.href    = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}