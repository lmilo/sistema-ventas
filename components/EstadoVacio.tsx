import Feather from '@expo/vector-icons/Feather'
import { StyleSheet, Text, View } from 'react-native'
import { colors, espacio, radios, tipo } from '../theme'

type Props = {
  titulo: string
  texto: string
  icono?: keyof typeof Feather.glyphMap
}

export default function EstadoVacio({ titulo, texto, icono = 'inbox' }: Props) {
  return (
    <View style={styles.centro}>
      <View style={styles.marco}>
        <Feather name={icono} size={22} color={colors.terracota} />
      </View>
      <Text style={[tipo.subtitulo, styles.titulo]}>{titulo}</Text>
      <Text style={[tipo.cuerpo, styles.texto]}>{texto}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  centro: {
    alignItems: 'center',
    gap: espacio.md,
    paddingVertical: 48,
    paddingHorizontal: espacio.xl
  },
  marco: {
    width: 52,
    height: 52,
    borderRadius: radios.pildora,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.terracotaSuave
  },
  titulo: {
    textAlign: 'center'
  },
  texto: {
    textAlign: 'center',
    maxWidth: 280
  }
})
