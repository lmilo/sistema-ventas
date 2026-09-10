import type { ReactNode } from 'react'
import { ScrollView, StyleSheet, View } from 'react-native'
import { colors, radios } from '../theme'

type Props = {
  children: ReactNode
}

export default function LayoutAuth({ children }: Props) {
  return (
    <ScrollView
      style={styles.raiz}
      contentContainerStyle={styles.contenido}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.tarjeta}>{children}</View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  raiz: {
    flex: 1,
    backgroundColor: colors.fondo
  },
  contenido: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 48
  },
  tarjeta: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: colors.superficie,
    borderRadius: radios.xl,
    borderWidth: 1,
    borderColor: colors.borde,
    paddingVertical: 36,
    paddingHorizontal: 32
  }
})
