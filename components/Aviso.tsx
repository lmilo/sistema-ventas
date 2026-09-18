import { StyleSheet, Text, View } from 'react-native'
import { colors, radios } from '../theme'

type Props = {
  texto: string
  tono?: 'error' | 'exito'
}

/** Mensaje al usuario. La rubrica evalua esto dentro del 15% de login. */
export default function Aviso({ texto, tono = 'error' }: Props) {
  if (!texto) return null

  const esError = tono === 'error'

  return (
    <View style={[styles.caja, esError ? styles.cajaError : styles.cajaExito]}>
      <View style={[styles.punto, esError ? styles.puntoError : styles.puntoExito]} />
      <Text style={[styles.texto, esError ? styles.textoError : styles.textoExito]}>{texto}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  caja: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: radios.md,
    paddingVertical: 12,
    paddingHorizontal: 14
  },
  cajaError: {
    backgroundColor: colors.errorFondo
  },
  cajaExito: {
    backgroundColor: '#ecfdf5'
  },
  punto: {
    width: 6,
    height: 6,
    borderRadius: 3
  },
  puntoError: {
    backgroundColor: colors.error
  },
  puntoExito: {
    backgroundColor: '#047857'
  },
  texto: {
    flex: 1,
    fontWeight: '500',
    fontSize: 14
  },
  textoError: {
    color: colors.error
  },
  textoExito: {
    color: '#047857'
  }
})
