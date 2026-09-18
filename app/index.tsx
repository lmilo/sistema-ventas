import { Redirect } from 'expo-router'
import { useSQLiteContext } from 'expo-sqlite'
import { useEffect, useState } from 'react'
import Cargando from '../components/Cargando'
import { obtenerClientePorLogin } from '../db/clientes'
import { useSesion } from '../lib/sesion'

/** Decide a donde entra cada quien. HU-03: el cliente sin datos personales
 *  no llega a ninguna parte hasta completarlos. */
export default function Entrada() {
  const db = useSQLiteContext()
  const { cuenta, cargando } = useSesion()
  const [tienePerfil, setTienePerfil] = useState<boolean | null>(null)

  useEffect(() => {
    if (!cuenta || cuenta.rol !== 'cliente') {
      setTienePerfil(true)
      return
    }
    obtenerClientePorLogin(db, cuenta.id).then(cliente => setTienePerfil(cliente !== null))
  }, [db, cuenta])

  if (cargando || tienePerfil === null) return <Cargando />
  if (!cuenta) return <Redirect href="/login" />
  if (cuenta.rol === 'administrador') return <Redirect href="/(admin)/inicio" />
  if (!tienePerfil) return <Redirect href="/completar-perfil" />
  return <Redirect href="/(cliente)/inicio" />
}
