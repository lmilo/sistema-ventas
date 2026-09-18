import type { SQLiteDatabase } from 'expo-sqlite'
import { coincide, derivarHash, generarSalt, minutosRestantes, siguienteBloqueo } from '../lib/auth'
import type { Cuenta, EstadoCuenta, RolUsuario, Solicitud } from './tipos'

/** N2 — Nataly, salvo `autenticar` y `crearCuentaPendiente` que son de Camilo (C1).
 *  Implementado por Camilo para desbloquear C1: Nataly puede revisarlo y ajustarlo. */

type FilaLogin = {
  id: number
  correo: string
  password_hash: string
  salt: string
  rol: RolUsuario | null
  estado: EstadoCuenta
  intentos_fallidos: number
  bloqueado_hasta: string | null
}

export type ResultadoLogin =
  | { ok: true; cuenta: Cuenta }
  | { ok: false; motivo: 'credenciales' }
  | { ok: false; motivo: 'pendiente' }
  | { ok: false; motivo: 'inactivo' }
  | { ok: false; motivo: 'bloqueado'; minutos: number }

export async function correoRegistrado(db: SQLiteDatabase, correo: string): Promise<boolean> {
  const fila = await db.getFirstAsync<{ id: number }>(
    'SELECT id FROM login WHERE correo = ?;',
    [correo.trim().toLowerCase()]
  )
  return fila !== null
}

/** HU-01: la cuenta nace pendiente y sin rol. */
export async function crearCuentaPendiente(
  db: SQLiteDatabase,
  correo: string,
  password: string
): Promise<number> {
  const salt = await generarSalt()
  const hash = await derivarHash(password, salt)

  const resultado = await db.runAsync(
    `INSERT INTO login (correo, password_hash, salt, rol, estado)
     VALUES (?, ?, ?, NULL, 'pendiente');`,
    [correo.trim().toLowerCase(), hash, salt]
  )
  return resultado.lastInsertRowId
}

/** HU-02: cuentas en espera de aprobacion. */
export async function listarSolicitudes(db: SQLiteDatabase): Promise<Solicitud[]> {
  const filas = await db.getAllAsync<{ id: number; correo: string; creado_en: string }>(
    `SELECT id, correo, creado_en
     FROM login
     WHERE estado = 'pendiente'
     ORDER BY creado_en ASC;`
  )
  return filas.map(f => ({ id: f.id, correo: f.correo, creadoEn: f.creado_en }))
}

/** HU-02: asigna rol y activa. Ambas cosas van juntas: una cuenta activa sin rol no puede entrar. */
export async function aprobarCuenta(db: SQLiteDatabase, id: number, rol: RolUsuario): Promise<void> {
  await db.runAsync("UPDATE login SET rol = ?, estado = 'activo' WHERE id = ?;", [rol, id])
}

export async function cambiarEstado(
  db: SQLiteDatabase,
  id: number,
  estado: EstadoCuenta
): Promise<void> {
  await db.runAsync('UPDATE login SET estado = ? WHERE id = ?;', [estado, id])
}

/** HU-03: valida estado antes que credenciales, pero sin delatar cual fallo. */
export async function autenticar(
  db: SQLiteDatabase,
  correo: string,
  password: string
): Promise<ResultadoLogin> {
  const fila = await db.getFirstAsync<FilaLogin>('SELECT * FROM login WHERE correo = ?;', [
    correo.trim().toLowerCase()
  ])

  // Se deriva el hash aunque el correo no exista, para no delatar por tiempo
  // de respuesta cuales correos estan registrados.
  const salt = fila?.salt ?? (await generarSalt())
  const hash = await derivarHash(password, salt)

  if (!fila) return { ok: false, motivo: 'credenciales' }

  const bloqueo = minutosRestantes(fila.bloqueado_hasta)
  if (bloqueo > 0) return { ok: false, motivo: 'bloqueado', minutos: bloqueo }

  if (!coincide(hash, fila.password_hash)) {
    const intentos = fila.intentos_fallidos + 1
    await db.runAsync(
      'UPDATE login SET intentos_fallidos = ?, bloqueado_hasta = ? WHERE id = ?;',
      [intentos, siguienteBloqueo(intentos), fila.id]
    )
    return { ok: false, motivo: 'credenciales' }
  }

  await db.runAsync(
    'UPDATE login SET intentos_fallidos = 0, bloqueado_hasta = NULL WHERE id = ?;',
    [fila.id]
  )

  // La contrasena era correcta: recien aqui se revisa el estado, y el mensaje
  // ya puede ser explicito porque quien pregunta demostro ser el dueno.
  if (fila.estado === 'pendiente' || fila.rol === null) return { ok: false, motivo: 'pendiente' }
  if (fila.estado === 'inactivo') return { ok: false, motivo: 'inactivo' }

  return {
    ok: true,
    cuenta: { id: fila.id, correo: fila.correo, rol: fila.rol, estado: fila.estado }
  }
}
