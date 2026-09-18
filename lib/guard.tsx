import { Redirect } from 'expo-router'
import type { ReactNode } from 'react'
import Cargando from '../components/Cargando'
import type { RolUsuario } from '../db/tipos'
import { useSesion } from './sesion'

/** Corta el render antes de que una pantalla ajena al rol llegue a montarse.
 *  HU-03: el cliente no alcanza pantallas de administrador ni escribiendo la ruta. */
export function Guard({ rol, children }: { rol: RolUsuario; children: ReactNode }) {
  const { cuenta, cargando } = useSesion()

  if (cargando) return <Cargando />
  if (!cuenta) return <Redirect href="/login" />
  if (cuenta.rol !== rol) {
    return <Redirect href={cuenta.rol === 'administrador' ? '/(admin)/inicio' : '/(cliente)/inicio'} />
  }

  return <>{children}</>
}
