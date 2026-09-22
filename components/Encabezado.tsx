import { router } from 'expo-router'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useSesion } from '../lib/sesion'
import { colors } from '../theme'

type Props = {
  titulo: string
  bajada?: string
}

/** Barra superior comun a todas las pantallas internas. */
export default function Encabezado({ titulo, bajada }: Props) {
  const insets = useSafeAreaInsets()
  const { cuenta, cerrar } = useSesion()

  const salir = async () => {
    await cerrar()
    router.replace('/login')
  }

  return (
    <View style={[styles.barra, { paddingTop: insets.top + 14 }]}>
      <View style={styles.textos}>
        <Text style={styles.titulo}>{titulo}</Text>
        {bajada ? <Text style={styles.bajada}>{bajada}</Text> : null}
      </View>

      <Pressable accessibilityRole="button" onPress={salir} style={styles.salir}>
        <Text style={styles.salirTexto}>Salir</Text>
        <Text style={styles.correo} numberOfLines={1}>
          {cuenta?.correo}
        </Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  barra: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 16,
    paddingHorizontal: 20,
    paddingBottom: 14,
    backgroundColor: colors.superficie,
    borderBottomWidth: 1,
    borderBottomColor: colors.borde
  },
  textos: {
    flex: 1,
    gap: 2
  },
  titulo: {
    fontWeight: '700',
    fontSize: 22,
    letterSpacing: -0.5,
    color: colors.tinta
  },
  bajada: {
    fontSize: 13,
    color: colors.tintaSuave
  },
  salir: {
    alignItems: 'flex-end',
    maxWidth: 140
  },
  salirTexto: {
    fontWeight: '600',
    fontSize: 14,
    color: colors.acento
  },
  correo: {
    fontSize: 11,
    color: colors.tintaTenue
  }
})
