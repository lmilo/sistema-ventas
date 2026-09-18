import type { Cuenta, RolUsuario, Solicitud } from './tipos'
import type { SQLiteDatabase } from 'expo-sqlite'

/** N2 — Nataly, salvo `verificarCredenciales` que es de Camilo (C1).
 *  Firmas acordadas en Fase 0: cambiarlas rompe codigo del otro. */

/** HU-01: la cuenta nace pendiente y sin rol. Devuelve el id creado. */
export async function crearSolicitud(
  _db: SQLiteDatabase,
  _correo: string,
  _passwordHash: string,
  _salt: string
): Promise<number> {
  throw new Error('N2 pendiente: crearSolicitud')
}

/** HU-02: cuentas en estado pendiente, para el listado del administrador. */
export async function listarSolicitudes(_db: SQLiteDatabase): Promise<Solicitud[]> {
  throw new Error('N2 pendiente: listarSolicitudes')
}

/** HU-02: asigna rol y deja la cuenta activa. */
export async function aprobarCuenta(
  _db: SQLiteDatabase,
  _id: number,
  _rol: RolUsuario
): Promise<void> {
  throw new Error('N2 pendiente: aprobarCuenta')
}

export async function cambiarEstado(
  _db: SQLiteDatabase,
  _id: number,
  _estado: Cuenta['estado']
): Promise<void> {
  throw new Error('N2 pendiente: cambiarEstado')
}

export async function correoRegistrado(_db: SQLiteDatabase, _correo: string): Promise<boolean> {
  throw new Error('N2 pendiente: correoRegistrado')
}
