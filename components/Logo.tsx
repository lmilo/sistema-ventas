import { StyleSheet, Text, View } from 'react-native'
import { colors, fuentes, radios } from '../theme'

type Props = {
  tono?: 'claro' | 'oscuro'
  compacto?: boolean
}

/** Marca: un cuadro terracota con la inicial y el nombre en la serif del sistema. */
export default function Logo({ tono = 'oscuro', compacto = false }: Props) {
  const esClaro = tono === 'claro'

  return (
    <View style={styles.fila}>
      <View style={[styles.sello, esClaro && styles.selloClaro]}>
        <Text style={[styles.inicial, esClaro && styles.inicialClara]}>V</Text>
      </View>
      {!compacto && (
        <Text style={[styles.nombre, esClaro && styles.nombreClaro]}>Ventas</Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  sello: {
    width: 30,
    height: 30,
    borderRadius: radios.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.terracota
  },
  selloClaro: {
    backgroundColor: '#fff7ed'
  },
  inicial: {
    fontFamily: fuentes.displayFuerte,
    fontSize: 16,
    lineHeight: 20,
    color: '#fff7ed'
  },
  inicialClara: {
    color: colors.terracota
  },
  nombre: {
    fontFamily: fuentes.display,
    fontSize: 18,
    letterSpacing: -0.2,
    color: colors.tinta
  },
  nombreClaro: {
    color: '#fff7ed'
  }
})
