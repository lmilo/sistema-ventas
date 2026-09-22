import { StyleSheet, Text, View } from 'react-native'
import { colors } from '../theme'

export default function EstadoVacio({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <View style={styles.centro}>
      <Text style={styles.titulo}>{titulo}</Text>
      <Text style={styles.texto}>{texto}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  centro: {
    alignItems: 'center',
    gap: 6,
    padding: 32
  },
  titulo: {
    fontWeight: '600',
    fontSize: 16,
    color: colors.tinta
  },
  texto: {
    fontSize: 14,
    textAlign: 'center',
    color: colors.tintaSuave
  }
})
