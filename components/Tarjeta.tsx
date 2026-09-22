import { StyleSheet, View, type ViewStyle } from 'react-native'
import type { ReactNode } from 'react'
import { colors, espacio, radios } from '../theme'

type Props = {
  children: ReactNode
  style?: ViewStyle
  /** Variante calida para bloques que deben leerse antes que el resto. */
  destacada?: boolean
}

export default function Tarjeta({ children, style, destacada = false }: Props) {
  return <View style={[styles.tarjeta, destacada && styles.destacada, style]}>{children}</View>
}

const styles = StyleSheet.create({
  tarjeta: {
    backgroundColor: colors.superficie,
    borderWidth: 1,
    borderColor: colors.borde,
    borderRadius: radios.lg,
    padding: espacio.lg
  },
  destacada: {
    backgroundColor: colors.superficieCalida,
    borderColor: colors.bordeFuerte
  }
})
