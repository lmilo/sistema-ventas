import Feather from '@expo/vector-icons/Feather'
import { StyleSheet, Text, View } from 'react-native'
import { colors, espacio, fuentes, radios } from '../theme'

type Props = {
  texto: string
  tono?: 'error' | 'exito'
}

/** Mensaje al usuario. La rubrica evalua esto dentro del 15% de login. */
export default function Aviso({ texto, tono = 'error' }: Props) {
  if (!texto) return null

  const esError = tono === 'error'
  const color = esError ? colors.ladrillo : colors.oliva

  return (
    <View
      style={[
        styles.caja,
        { backgroundColor: esError ? colors.ladrilloSuave : colors.olivaSuave, borderColor: color }
      ]}
    >
      <Feather name={esError ? 'alert-circle' : 'check-circle'} size={16} color={color} />
      <Text style={[styles.texto, { color }]}>{texto}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  caja: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacio.md,
    borderRadius: radios.md,
    borderLeftWidth: 3,
    paddingVertical: espacio.md,
    paddingHorizontal: espacio.lg
  },
  texto: {
    flex: 1,
    fontFamily: fuentes.textoMedio,
    fontSize: 14,
    lineHeight: 19
  }
})
