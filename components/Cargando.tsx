import { ActivityIndicator, StyleSheet, View } from 'react-native'
import { colors } from '../theme'

export default function Cargando() {
  return (
    <View style={styles.centro}>
      <ActivityIndicator color={colors.acento} />
    </View>
  )
}

const styles = StyleSheet.create({
  centro: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.fondo
  }
})
