import type { CompraCompleta, CompraResumen, ItemCompra } from './tipos'
import type { SQLiteDatabase } from 'expo-sqlite'

/** Archivo compartido. `crearCompra` es de Camilo (C5); las consultas de
 *  lectura son de Nataly (N5). Nadie reordena ni reformatea el archivo. */

/** HU-06: encabezado + detalles + descuento de stock, todo o nada. */
export async function crearCompra(
  _db: SQLiteDatabase,
  _idCliente: number,
  _items: ItemCompra[]
): Promise<number> {
  throw new Error('C5 pendiente: crearCompra')
}

export async function comprasDeCliente(
  _db: SQLiteDatabase,
  _idCliente: number
): Promise<CompraResumen[]> {
  throw new Error('N5 pendiente: comprasDeCliente')
}

export async function todasLasCompras(_db: SQLiteDatabase): Promise<CompraResumen[]> {
  throw new Error('N5 pendiente: todasLasCompras')
}

export async function compraCompleta(
  _db: SQLiteDatabase,
  _idEncabezado: number
): Promise<CompraCompleta> {
  throw new Error('N5 pendiente: compraCompleta')
}
