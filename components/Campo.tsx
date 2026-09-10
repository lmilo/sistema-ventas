import { useState } from 'react'
import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native'
import { colors, radios } from '../theme'

type Props = TextInputProps & {
  etiqueta: string
}

export default function Campo({ etiqueta, style, ...props }: Props) {
  const [enfocado, setEnfocado] = useState(false)

  return (
    <View style={styles.contenedor}>
      <Text style={styles.etiqueta}>{etiqueta}</Text>
      <TextInput
        style={[styles.input, enfocado && styles.inputEnfocado, style]}
        placeholderTextColor={colors.tintaTenue}
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
    gap: 8
  },
  etiqueta: {
    fontWeight: '500',
    fontSize: 13,
    letterSpacing: 0.1,
    color: colors.tinta
  },
  input: {
    borderWidth: 1,
    borderColor: colors.borde,
    borderRadius: radios.md,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontWeight: '400',
    fontSize: 15,
    color: colors.tinta,
    backgroundColor: colors.superficie
  },
  inputEnfocado: {
    borderColor: colors.bordeFoco,
    backgroundColor: colors.acentoSuave
  }
})
