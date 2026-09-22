import Feather from '@expo/vector-icons/Feather'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { colors, espacio, fuentes, radios } from '../theme'

type Props = {
  titulo: string
  onPress: () => void
  variante?: 'primario' | 'contorno' | 'discreto'
  icono?: keyof typeof Feather.glyphMap
  deshabilitado?: boolean
}

export default function Boton({
  titulo,
  onPress,
  variante = 'primario',
  icono,
  deshabilitado = false
}: Props) {
  const esPrimario = variante === 'primario'
  const tinte = esPrimario ? '#fff7ed' : variante === 'contorno' ? colors.tinta : colors.terracota

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: deshabilitado }}
      disabled={deshabilitado}
      onPress={onPress}
      style={({ pressed }) => [
        styles.boton,
        styles[variante],
        // Hundido al tocar: 0.97 se siente fisico, 0.9 se siente roto.
        pressed && styles.presionado,
        deshabilitado && styles.inerte
      ]}
    >
      <View style={styles.contenido}>
        {icono ? <Feather name={icono} size={16} color={tinte} /> : null}
        <Text style={[styles.texto, { color: tinte }]}>{titulo}</Text>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  boton: {
    paddingVertical: 14,
    paddingHorizontal: espacio.xl,
    borderRadius: radios.md,
    alignItems: 'center'
  },
  contenido: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacio.sm
  },
  primario: {
    backgroundColor: colors.terracota
  },
  contorno: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.bordeFuerte
  },
  discreto: {
    backgroundColor: colors.terracotaSuave
  },
  presionado: {
    opacity: 0.9,
    transform: [{ scale: 0.97 }]
  },
  inerte: {
    opacity: 0.45
  },
  texto: {
    fontFamily: fuentes.textoFuerte,
    fontSize: 15,
    letterSpacing: 0.1
  }
})
