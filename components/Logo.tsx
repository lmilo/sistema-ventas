import { StyleSheet, Text, View } from 'react-native'
import { colors, radios } from '../theme'

type Props = {
  tono?: 'claro' | 'oscuro'
}

export default function Logo({ tono = 'claro' }: Props) {
  const esClaro = tono === 'claro'

  return (
    <View style={styles.fila}>
      <View style={[styles.marca, esClaro ? styles.marcaClara : styles.marcaOscura]}>
        <Text style={[styles.glifo, esClaro && styles.glifoClaro]}>◆</Text>
      </View>
      <Text style={[styles.nombre, esClaro ? styles.nombreClaro : styles.nombreOscuro]}>
        LoginApp
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  marca: {
    width: 34,
    height: 34,
    borderRadius: radios.sm,
    alignItems: 'center',
    justifyContent: 'center'
  },
  marcaClara: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)'
  },
  marcaOscura: {
    backgroundColor: colors.acentoSuave
  },
  glifo: {
    fontSize: 13,
    color: colors.acento
  },
  glifoClaro: {
    color: '#a5b4fc'
  },
  nombre: {
    fontWeight: '600',
    fontSize: 16,
    letterSpacing: -0.2
  },
  nombreClaro: {
    color: '#ffffff'
  },
  nombreOscuro: {
    color: colors.tinta
  }
})
