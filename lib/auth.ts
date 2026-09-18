import * as Crypto from 'expo-crypto'
import { scryptAsync } from '@noble/hashes/scrypt.js'

const PARAMETROS = { N: 2 ** 14, r: 8, p: 1, dkLen: 32 }
const MAX_INTENTOS = 5
const MINUTOS_BLOQUEO = 5

const aHex = (bytes: Uint8Array) =>
  Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')

const desdeHex = (hex: string) => {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16)
  }
  return bytes
}

export async function generarSalt() {
  return aHex(await Crypto.getRandomBytesAsync(16))
}

export async function derivarHash(password: string, saltHex: string) {
  const derivada = await scryptAsync(password, desdeHex(saltHex), PARAMETROS)
  return aHex(derivada)
}

/** Comparacion en tiempo constante: no revela cuantos caracteres coincidieron. */
export function coincide(a: string, b: string) {
  if (a.length !== b.length) return false
  let diferencia = 0
  for (let i = 0; i < a.length; i++) {
    diferencia |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return diferencia === 0
}

export function siguienteBloqueo(intentosFallidos: number) {
  if (intentosFallidos < MAX_INTENTOS) return null
  const hasta = new Date(Date.now() + MINUTOS_BLOQUEO * 60_000)
  return hasta.toISOString()
}

export function minutosRestantes(bloqueadoHasta: string | null) {
  if (!bloqueadoHasta) return 0
  const restante = new Date(bloqueadoHasta).getTime() - Date.now()
  return restante <= 0 ? 0 : Math.ceil(restante / 60_000)
}

export const LIMITE_INTENTOS = MAX_INTENTOS
