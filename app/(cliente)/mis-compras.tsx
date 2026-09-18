import { useFocusEffect } from 'expo-router'
import { useSQLiteContext } from 'expo-sqlite'
import { useCallback, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import Cargando from '../../components/Cargando'
import Encabezado from '../../components/Encabezado'
import ListaCompras from '../../components/ListaCompras'
import { obtenerClientePorLogin } from '../../db/clientes'
import { comprasDeCliente } from '../../db/compras'
import type { CompraResumen } from '../../db/tipos'
import { useSesion } from '../../lib/sesion'
import { colors } from '../../theme'

/** HU-04: solo se muestran los datos del cliente autenticado. */
export default function MisCompras() {
  const db = useSQLiteContext()
  const { cuenta } = useSesion()
  const [compras, setCompras] = useState<CompraResumen[]>([])
  const [cargando, setCargando] = useState(true)

  useFocusEffect(
    useCallback(() => {
      if (!cuenta) return
      obtenerClientePorLogin(db, cuenta.id)
        .then(cliente => (cliente ? comprasDeCliente(db, cliente.id) : []))
        .then(lista => {
          setCompras(lista)
          setCargando(false)
        })
    }, [db, cuenta])
  )

  if (cargando) return <Cargando />

  return (
    <View style={styles.raiz}>
      <Encabezado titulo="Mis compras" bajada={`${compras.length} compra(s)`} />
      <ListaCompras
        compras={compras}
        vacioTitulo="Aún no has comprado nada"
        vacioTexto="Ve a la pestaña Comprar para hacer tu primer pedido."
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
