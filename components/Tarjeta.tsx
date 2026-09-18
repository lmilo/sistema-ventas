import { StyleSheet, View, type ViewStyle } from 'react-native'
import type { ReactNode } from 'react'
import { colors, radios } from '../theme'

export default function Tarjeta({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return <View style={[styles.tarjeta, style]}>{children}</View>
}

const styles = StyleSheet.create({
  tarjeta: {
    backgroundColor: colors.superficie,
    borderWidth: 1,
    borderColor: colors.borde,
    borderRadius: radios.lg,
    padding: 16
  }
})
