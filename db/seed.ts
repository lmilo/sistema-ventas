import { scryptAsync } from '@noble/hashes/scrypt.js'
import { bytesToHex } from '@noble/hashes/utils.js'
import * as Crypto from 'expo-crypto'
import type { SQLiteDatabase } from 'expo-sqlite'

const ADMIN_EMAIL = 'admin@sistema-ventas.com'
const CLIENTE_EMAIL = 'cliente@sistema-ventas.com'
const ADMIN_PASSWORD = 'admin123'
const CLIENTE_PASSWORD = 'cliente123'

async function crearHashDemo(password: string): Promise<{ hash: string; salt: string }> {
  const salt = await Crypto.getRandomBytesAsync(16)
  const hash = await scryptAsync(password, salt, {
    N: 2 ** 14,
    r: 8,
    p: 1,
    dkLen: 32
  })

  return {
    hash: bytesToHex(hash),
    salt: bytesToHex(salt)
  }
}

export async function sembrarDatosDemo(db: SQLiteDatabase): Promise<void> {
  const totalUsuarios = await db.getFirstAsync<{ total: number }>(
    'SELECT COUNT(*) AS total FROM login;'
  )

  if ((totalUsuarios?.total ?? 0) > 0) {
    return
  }

  const adminHash = await crearHashDemo(ADMIN_PASSWORD)
  const clienteHash = await crearHashDemo(CLIENTE_PASSWORD)

  await db.withExclusiveTransactionAsync(async txn => {
    const admin = await txn.runAsync(
      `INSERT INTO login (correo, password_hash, salt, rol, estado) VALUES (?, ?, ?, 'administrador', 'activo');`,
      ADMIN_EMAIL,
      adminHash.hash,
      adminHash.salt
    )

    const cliente = await txn.runAsync(
      `INSERT INTO login (correo, password_hash, salt, rol, estado) VALUES (?, ?, ?, 'cliente', 'activo');`,
      CLIENTE_EMAIL,
      clienteHash.hash,
      clienteHash.salt
    )

    await txn.runAsync(
      `INSERT INTO cliente (id_login, nombre_completo, fecha_nacimiento, correo)
       VALUES (?, ?, ?, ?);`,
      cliente.lastInsertRowId,
      'Ana Gómez',
      '1995-06-15',
      CLIENTE_EMAIL
    )

    await txn.runAsync(
      `INSERT INTO producto (nombre, descripcion, stock, precio_unitario, precio_compra, imagen_uri, activo)
       VALUES (?, ?, ?, ?, ?, ?, 1), (?, ?, ?, ?, ?, ?, 1), (?, ?, ?, ?, ?, ?, 1);`,
      'Teclado mecánico',
      'Teclado gaming con iluminación RGB.',
      12,
      180000,
      115000,
      null,
      'Mouse inalámbrico',
      'Mouse ergonómico para uso diario.',
      25,
      85000,
      45000,
      null,
      'Monitor 24 pulgadas',
      'Pantalla Full HD para oficina y estudio.',
      8,
      420000,
      260000,
      null
    )

    const encabezado = await txn.runAsync(
      `INSERT INTO encabezado (id_cliente, fecha_venta, total) VALUES (?, ?, ?);`,
      1,
      '2026-09-15 10:30:00',
      265000
    )

    await txn.runAsync(
      `INSERT INTO detalle (id_encabezado, id_producto, cantidad, precio_unitario, costo_unitario, subtotal)
       VALUES (?, ?, ?, ?, ?, ?), (?, ?, ?, ?, ?, ?);`,
      encabezado.lastInsertRowId,
      1,
      1,
      180000,
      115000,
      180000,
      encabezado.lastInsertRowId,
      2,
      1,
      85000,
      45000,
      85000
    )

    await txn.runAsync(
      `UPDATE producto SET stock = stock - 1 WHERE id = ?;`,
      1
    )

    await txn.runAsync(
      `UPDATE producto SET stock = stock - 1 WHERE id = ?;`,
      2
    )

    void admin
  })
}
