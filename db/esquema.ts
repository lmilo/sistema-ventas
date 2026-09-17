import type { SQLiteDatabase } from 'expo-sqlite'
import { sembrarDatosDemo } from './seed'

export const DATABASE_NAME = 'sistema-ventas.db'
export const DATABASE_VERSION = 1

type UserVersionRow = {
  user_version: number
}

export async function migrarBaseDeDatos(db: SQLiteDatabase) {
  await db.execAsync(`
    PRAGMA foreign_keys = ON;
    PRAGMA journal_mode = WAL;
  `)

  const resultado = await db.getFirstAsync<UserVersionRow>('PRAGMA user_version')
  const versionActual = resultado?.user_version ?? 0

  if (versionActual >= DATABASE_VERSION) {
    return
  }

  if (versionActual === 0) {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        correo TEXT NOT NULL UNIQUE COLLATE NOCASE,
        password_hash TEXT NOT NULL,
        salt TEXT NOT NULL,
        rol TEXT NOT NULL CHECK (rol IN ('cliente', 'administrador')),
        intentos_fallidos INTEGER NOT NULL DEFAULT 0,
        bloqueado_hasta TEXT,
        creado_en TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS clientes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        id_usuario INTEGER NOT NULL UNIQUE REFERENCES usuarios(id) ON DELETE CASCADE,
        nombre_completo TEXT NOT NULL,
        fecha_nacimiento TEXT NOT NULL,
        correo TEXT NOT NULL UNIQUE COLLATE NOCASE
      );

      CREATE TABLE IF NOT EXISTS productos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        descripcion TEXT,
        stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
        precio_unitario REAL NOT NULL CHECK (precio_unitario >= 0),
        precio_compra REAL NOT NULL DEFAULT 0 CHECK (precio_compra >= 0),
        imagen_uri TEXT,
        activo INTEGER NOT NULL DEFAULT 1
      );

      CREATE TABLE IF NOT EXISTS ventas_encabezado (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        id_cliente INTEGER NOT NULL REFERENCES clientes(id),
        fecha_venta TEXT NOT NULL DEFAULT (datetime('now')),
        total REAL NOT NULL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS ventas_detalle (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        id_encabezado INTEGER NOT NULL REFERENCES ventas_encabezado(id) ON DELETE CASCADE,
        id_producto INTEGER NOT NULL REFERENCES productos(id),
        cantidad INTEGER NOT NULL CHECK (cantidad > 0),
        precio_unitario REAL NOT NULL,
        costo_unitario REAL NOT NULL,
        subtotal REAL NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_detalle_encabezado
        ON ventas_detalle(id_encabezado);

      CREATE INDEX IF NOT EXISTS idx_encabezado_cliente
        ON ventas_encabezado(id_cliente);
    `)
  }

  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`)
  await sembrarDatosDemo(db)
}
