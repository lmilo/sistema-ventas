import Feather from '@expo/vector-icons/Feather'
import { router } from 'expo-router'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useSesion } from '../lib/sesion'
import { colors, espacio, radios, tipo } from '../theme'

type Props = {
  titulo: string
  bajada?: string
  /** Cifra o dato que acompana al titulo, alineado a la derecha. */
  dato?: { valor: string; etiqueta: string }
}

/** Cabecera editorial: versalitas, titular en serif y filete de cierre. */
export default function Encabezado({ titulo, bajada, dato }: Props) {
  const insets = useSafeAreaInsets()
  const { cuenta, cerrar } = useSesion()

  const salir = async () => {
    await cerrar()
    router.replace('/login')
  }

  return (
    <View style={[styles.barra, { paddingTop: insets.top + espacio.lg }]}>
      <View style={styles.superior}>
        <Text style={tipo.sobretitulo}>
          {cuenta?.rol === 'administrador' ? 'Administración' : 'Mi cuenta'}
        </Text>

        <Pressable accessibilityRole="button" onPress={salir} style={styles.salir}>
          <Feather name="log-out" size={14} color={colors.piedra} />
          <Text style={tipo.etiqueta}>Salir</Text>
        </Pressable>
      </View>

      <View style={styles.cuerpo}>
        <View style={styles.textos}>
          <Text style={tipo.titular}>{titulo}</Text>
          {bajada ? <Text style={[tipo.cuerpo, styles.bajada]}>{bajada}</Text> : null}
        </View>

        {dato ? (
          <View style={styles.dato}>
            <Text style={tipo.cifra}>{dato.valor}</Text>
            <Text style={tipo.menudo}>{dato.etiqueta}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.filete} />
    </View>
  )
}

const styles = StyleSheet.create({
  barra: {
    paddingHorizontal: espacio.xl,
    paddingBottom: espacio.lg,
    backgroundColor: colors.fondo,
    gap: espacio.md
  },
  superior: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  salir: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: espacio.sm,
    borderRadius: radios.sm
  },
  cuerpo: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: espacio.lg
  },
  textos: {
    flex: 1,
    gap: 2
  },
  bajada: {
    fontSize: 14
  },
  dato: {
    alignItems: 'flex-end'
  },
  filete: {
    height: 1,
    backgroundColor: colors.bordeFuerte,
    marginTop: espacio.xs
  }
})
