import { useFocusEffect } from 'expo-router'
import { useSQLiteContext } from 'expo-sqlite'
import { useCallback, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import Cargando from '../../components/Cargando'
import Encabezado from '../../components/Encabezado'
import ListaCompras from '../../components/ListaCompras'
import { todasLasCompras } from '../../db/compras'
import type { CompraResumen } from '../../db/tipos'
import { colors } from '../../theme'

export default function Compras() {
  const db = useSQLiteContext()
  const [compras, setCompras] = useState<CompraResumen[]>([])
  const [cargando, setCargando] = useState(true)

  useFocusEffect(
    useCallback(() => {
      todasLasCompras(db).then(lista => {
        setCompras(lista)
        setCargando(false)
      })
    }, [db])
  )

  if (cargando) return <Cargando />

  return (
    <View style={styles.raiz}>
      <Encabezado titulo="Compras" bajada={`${compras.length} compra(s) registrada(s)`} />
      <ListaCompras
        compras={compras}
        mostrarCliente
        vacioTitulo="Todavía no hay compras"
        vacioTexto="Cuando un cliente confirme una compra, aparecerá aquí con su detalle."
      />
    </View>
  )
}

const styles = StyleSheet.create({
  raiz: {
    flex: 1,
    backgroundColor: colors.fondo
  }
})
