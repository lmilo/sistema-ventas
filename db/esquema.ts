import type { SQLiteDatabase } from 'expo-sqlite'
import { sembrarDatosDemo } from './seed'

export const DATABASE_NAME = 'sistema-ventas.db'
export const DATABASE_VERSION = 2

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

  // v2: nombres de tabla del enunciado, rol nulo hasta que el administrador lo
  // asigne (HU-02) y estado de la cuenta (HU-01). El rol no se puede volver
  // nullable con ALTER, asi que login y cliente se recrean copiando los datos.
  if (versionActual < 2) {
    await db.execAsync(`
      PRAGMA foreign_keys = OFF;

      ALTER TABLE productos RENAME TO producto;
      ALTER TABLE ventas_encabezado RENAME TO encabezado;
      ALTER TABLE ventas_detalle RENAME TO detalle;

      CREATE TABLE login (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        correo TEXT NOT NULL UNIQUE COLLATE NOCASE,
        password_hash TEXT NOT NULL,
        salt TEXT NOT NULL,
        rol TEXT CHECK (rol IN ('cliente', 'administrador')),
        estado TEXT NOT NULL DEFAULT 'pendiente'
          CHECK (estado IN ('pendiente', 'activo', 'inactivo')),
        intentos_fallidos INTEGER NOT NULL DEFAULT 0,
        bloqueado_hasta TEXT,
        creado_en TEXT NOT NULL DEFAULT (datetime('now'))
      );

      INSERT INTO login (id, correo, password_hash, salt, rol, estado,
                         intentos_fallidos, bloqueado_hasta, creado_en)
        SELECT id, correo, password_hash, salt, rol, 'activo',
               intentos_fallidos, bloqueado_hasta, creado_en
        FROM usuarios;

      DROP TABLE usuarios;

      CREATE TABLE cliente (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        id_login INTEGER NOT NULL UNIQUE REFERENCES login(id) ON DELETE CASCADE,
        nombre_completo TEXT NOT NULL,
        fecha_nacimiento TEXT NOT NULL,
        correo TEXT NOT NULL UNIQUE COLLATE NOCASE
      );

      INSERT INTO cliente (id, id_login, nombre_completo, fecha_nacimiento, correo)
        SELECT id, id_usuario, nombre_completo, fecha_nacimiento, correo
        FROM clientes;

      DROP TABLE clientes;

      CREATE INDEX IF NOT EXISTS idx_detalle_encabezado ON detalle(id_encabezado);
      CREATE INDEX IF NOT EXISTS idx_encabezado_cliente ON encabezado(id_cliente);

      PRAGMA foreign_keys = ON;
    `)

    const rotas = await db.getAllAsync('PRAGMA foreign_key_check')
    if (rotas.length > 0) {
      throw new Error(`Migracion v2 dejo ${rotas.length} referencias rotas`)
    }
  }

  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`)
  await sembrarDatosDemo(db)
}
