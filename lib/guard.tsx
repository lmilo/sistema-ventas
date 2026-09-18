import { Redirect } from 'expo-router'
import type { ReactNode } from 'react'
import { ActivityIndicator, StyleSheet, View } from 'react-native'
import type { RolUsuario } from '../db/tipos'
import { useSesion } from './sesion'
import { colors } from '../theme'

/** Corta el render antes de que una pantalla ajena al rol llegue a montarse. */
export function Guard({ rol, children }: { rol: RolUsuario; children: ReactNode }) {
  const { usuario, cargando } = useSesion()

  if (cargando) {
    return (
      <View style={styles.centro}>
        <ActivityIndicator color={colors.acento} />
      </View>
    )
  }

  if (!usuario) return <Redirect href="/login" />
  if (usuario.rol !== rol) {
    return <Redirect href={usuario.rol === 'administrador' ? '/dashboard' : '/inicio'} />
  }

  return <>{children}</>
}

const styles = StyleSheet.create({
  centro: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.fondo
  }
})
