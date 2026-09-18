import * as SecureStore from 'expo-secure-store'
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Cuenta } from '../db/tipos'

const CLAVE = 'sesion'

type Contexto = {
  usuario: Cuenta | null
  cargando: boolean
  iniciar: (usuario: Cuenta) => Promise<void>
  cerrar: () => Promise<void>
}

const SesionContext = createContext<Contexto | null>(null)

export function SesionProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Cuenta | null>(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    SecureStore.getItemAsync(CLAVE)
      .then(valor => setUsuario(valor ? (JSON.parse(valor) as Cuenta) : null))
      .catch(() => setUsuario(null))
      .finally(() => setCargando(false))
  }, [])

  const iniciar = async (nuevo: Cuenta) => {
    await SecureStore.setItemAsync(CLAVE, JSON.stringify(nuevo))
    setUsuario(nuevo)
  }

  const cerrar = async () => {
    await SecureStore.deleteItemAsync(CLAVE)
    setUsuario(null)
  }

  return (
    <SesionContext.Provider value={{ usuario, cargando, iniciar, cerrar }}>
      {children}
    </SesionContext.Provider>
  )
}

export function useSesion() {
  const contexto = useContext(SesionContext)
  if (!contexto) throw new Error('useSesion debe usarse dentro de SesionProvider')
  return contexto
}
