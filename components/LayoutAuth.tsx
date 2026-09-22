import type { ReactNode } from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Logo from './Logo'
import { colors, espacio, tipo } from '../theme'

type Props = {
  children: ReactNode
}

/**
 * Composicion editorial: banda de color arriba con la marca, contenido sobre
 * crema. Sin tarjeta flotante centrada, que es la silueta de cualquier
 * plantilla de login.
 */
export default function LayoutAuth({ children }: Props) {
  const insets = useSafeAreaInsets()

  return (
    <View style={styles.raiz}>
      <View style={[styles.banda, { paddingTop: insets.top + espacio.xl }]}>
        <Logo tono="claro" />
        <Text style={styles.lema}>Inventario, clientes y ventas en un solo lugar.</Text>
        <View style={styles.marcas}>
          {[0, 1, 2].map(i => (
            <View key={i} style={[styles.marca, i === 0 && styles.marcaViva]} />
          ))}
        </View>
      </View>

      <ScrollView
        style={styles.hoja}
        contentContainerStyle={styles.contenido}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  raiz: {
    flex: 1,
    backgroundColor: colors.terracota
  },
  banda: {
    paddingHorizontal: espacio.xl,
    paddingBottom: espacio.xl,
    gap: espacio.lg,
    backgroundColor: colors.terracota
  },
  lema: {
    fontFamily: 'Fraunces_600SemiBold',
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.3,
    color: '#fff7ed',
    maxWidth: 260
  },
  marcas: {
    flexDirection: 'row',
    gap: 6
  },
  marca: {
    width: 22,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,247,237,0.32)'
  },
  marcaViva: {
    backgroundColor: '#fff7ed',
    width: 34
  },
  hoja: {
    flex: 1,
    backgroundColor: colors.fondo,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -12
  },
  contenido: {
    padding: espacio.xl,
    paddingTop: espacio.xxl,
    gap: espacio.lg
  }
})
