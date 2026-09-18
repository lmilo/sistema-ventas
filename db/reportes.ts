import type { Producto, ResumenTienda } from './tipos'
import type { SQLiteDatabase } from 'expo-sqlite'

/** N5 — Nataly. Agregaciones en SQL, nunca sumando en JavaScript. */

export async function resumenTienda(_db: SQLiteDatabase): Promise<ResumenTienda> {
  throw new Error('N5 pendiente: resumenTienda')
}

export async function productosBajoStock(_db: SQLiteDatabase, _limite = 5): Promise<Producto[]> {
  throw new Error('N5 pendiente: productosBajoStock')
}
