import { Pressable, StyleSheet, Text } from 'react-native'
import { colors, radios } from '../theme'

type Props = {
  titulo: string
  onPress: () => void
  variante?: 'primario' | 'fantasma'
}

export default function Boton({ titulo, onPress, variante = 'primario' }: Props) {
  const esPrimario = variante === 'primario'

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.boton,
        esPrimario ? styles.primario : styles.fantasma,
        pressed && styles.presionado
      ]}
    >
      <Text style={[styles.texto, esPrimario ? styles.textoPrimario : styles.textoFantasma]}>
        {titulo}
      </Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  boton: {
    paddingVertical: 15,
    borderRadius: radios.md,
    alignItems: 'center'
  },
  primario: {
    backgroundColor: colors.tinta
  },
  fantasma: {
    backgroundColor: colors.superficie,
    borderWidth: 1,
    borderColor: colors.borde
  },
  presionado: {
    opacity: 0.82,
    transform: [{ scale: 0.99 }]
  },
  texto: {
    fontWeight: '600',
    fontSize: 15,
    letterSpacing: -0.1
  },
  textoPrimario: {
    color: '#ffffff'
  },
  textoFantasma: {
    color: colors.tinta
  }
})
