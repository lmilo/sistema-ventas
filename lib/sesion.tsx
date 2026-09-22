import * as SecureStore from 'expo-secure-store'
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Cuenta } from '../db/tipos'

const CLAVE = 'sesion'

type Contexto = {
  cuenta: Cuenta | null
  cargando: boolean
  iniciar: (cuenta: Cuenta) => Promise<void>
  cerrar: () => Promise<void>
}

const SesionContext = createContext<Contexto | null>(null)

export function SesionProvider({ children }: { children: ReactNode }) {
  const [cuenta, setCuenta] = useState<Cuenta | null>(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    SecureStore.getItemAsync(CLAVE)
      .then(valor => setCuenta(valor ? (JSON.parse(valor) as Cuenta) : null))
      .catch(() => setCuenta(null))
      .finally(() => setCargando(false))
  }, [])

  const iniciar = async (nueva: Cuenta) => {
    await SecureStore.setItemAsync(CLAVE, JSON.stringify(nueva))
    setCuenta(nueva)
  }

  const cerrar = async () => {
    await SecureStore.deleteItemAsync(CLAVE)
    setCuenta(null)
  }

  return (
    <SesionContext.Provider value={{ cuenta, cargando, iniciar, cerrar }}>
      {children}
    </SesionContext.Provider>
  )
}

export function useSesion() {
  const contexto = useContext(SesionContext)
  if (!contexto) throw new Error('useSesion debe usarse dentro de SesionProvider')
  return contexto
}
