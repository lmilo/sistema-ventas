import { useState } from 'react'
import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native'
import { colors, espacio, fuentes, radios, tipo } from '../theme'

type Props = TextInputProps & {
  etiqueta: string
}

export default function Campo({ etiqueta, style, ...props }: Props) {
  const [enfocado, setEnfocado] = useState(false)

  return (
    <View style={styles.contenedor}>
      <Text style={[tipo.etiqueta, enfocado && styles.etiquetaActiva]}>{etiqueta}</Text>
      <TextInput
        style={[styles.input, enfocado && styles.inputEnfocado, style]}
        placeholderTextColor={colors.piedraTenue}
        autoCapitalize="none"
        onFocus={() => setEnfocado(true)}
        onBlur={() => setEnfocado(false)}
        {...props}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  contenedor: {
    gap: espacio.sm
  },
  etiquetaActiva: {
    color: colors.terracota
  },
  input: {
    borderWidth: 1,
    borderColor: colors.borde,
    borderRadius: radios.md,
    paddingVertical: 13,
    paddingHorizontal: espacio.lg,
    fontFamily: fuentes.texto,
    fontSize: 15,
    color: colors.tinta,
    backgroundColor: colors.superficie
  },
  inputEnfocado: {
    borderColor: colors.terracota,
    backgroundColor: colors.terracotaSuave
  }
})
