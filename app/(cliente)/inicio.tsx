import { router, useFocusEffect } from 'expo-router'
import { useSQLiteContext } from 'expo-sqlite'
import { useCallback, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import Cargando from '../../components/Cargando'
import Encabezado from '../../components/Encabezado'
import Tarjeta from '../../components/Tarjeta'
import { obtenerClientePorLogin } from '../../db/clientes'
import { comprasDeCliente } from '../../db/compras'
import type { Cliente, CompraResumen } from '../../db/tipos'
import { pesos } from '../../lib/moneda'
import { useSesion } from '../../lib/sesion'
import { colors, radios } from '../../theme'

export default function InicioCliente() {
  const db = useSQLiteContext()
  const { cuenta } = useSesion()
  const [cliente, setCliente] = useState<Cliente | null>(null)
  const [compras, setCompras] = useState<CompraResumen[]>([])

  useFocusEffect(
    useCallback(() => {
      if (!cuenta) return
      obtenerClientePorLogin(db, cuenta.id).then(async fila => {
        setCliente(fila)
        if (fila) setCompras(await comprasDeCliente(db, fila.id))
      })
    }, [db, cuenta])
  )

  if (!cliente) return <Cargando />

  const gastado = compras.reduce((suma, compra) => suma + compra.total, 0)

  return (
    <View style={styles.raiz}>
      <Encabezado titulo={`Hola ${cliente.nombreCompleto.split(' ')[0]}`} bajada="Bienvenido al sistema" />

      <ScrollView contentContainerStyle={styles.contenido}>
        <View style={styles.tarjetas}>
          <View style={styles.tarjeta}>
            <Text style={styles.etiqueta}>Compras</Text>
            <Text style={styles.valor}>{compras.length}</Text>
          </View>
          <View style={[styles.tarjeta, styles.tarjetaDestacada]}>
            <Text style={styles.etiqueta}>Total gastado</Text>
            <Text style={[styles.valor, styles.valorDestacado]}>{pesos(gastado)}</Text>
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          style={styles.accion}
          onPress={() => router.push('/(cliente)/comprar')}
        >
          <Text style={styles.accionTitulo}>Hacer una compra</Text>
          <Text style={styles.accionTexto}>Revisa el catálogo y elige tus productos.</Text>
        </Pressable>

        {compras.length > 0 && (
          <Tarjeta style={styles.seccion}>
            <Text style={styles.seccionTitulo}>Última compra</Text>
            <View style={styles.fila}>
              <Text style={styles.filaNombre}>Compra #{compras[0].id}</Text>
              <Text style={styles.filaValor}>{pesos(compras[0].total)}</Text>
            </View>
          </Tarjeta>
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  raiz: {
    flex: 1,
    backgroundColor: colors.fondo
  },
  contenido: {
    padding: 16,
    gap: 16
  },
  tarjetas: {
    flexDirection: 'row',
    gap: 12
  },
  tarjeta: {
    flex: 1,
    gap: 6,
    backgroundColor: colors.superficie,
    borderWidth: 1,
    borderColor: colors.borde,
    borderRadius: radios.lg,
    padding: 16
  },
  tarjetaDestacada: {
    backgroundColor: colors.acentoSuave,
    borderColor: colors.acentoSuave
  },
  etiqueta: {
    fontWeight: '500',
    fontSize: 12,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: colors.tintaSuave
  },
  valor: {
    fontWeight: '700',
    fontSize: 22,
    letterSpacing: -0.6,
    color: colors.tinta
  },
  valorDestacado: {
    color: colors.acento
  },
  accion: {
    gap: 4,
    backgroundColor: colors.tinta,
    borderRadius: radios.lg,
    padding: 20
  },
  accionTitulo: {
    fontWeight: '600',
    fontSize: 17,
    color: '#ffffff'
  },
  accionTexto: {
    fontSize: 14,
    color: '#cbd5e1'
  },
  seccion: {
    gap: 10
  },
  seccionTitulo: {
    fontWeight: '600',
    fontSize: 16,
    color: colors.tinta
  },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  filaNombre: {
    fontSize: 14,
    color: colors.tintaSuave
  },
  filaValor: {
    fontWeight: '600',
    fontSize: 15,
    color: colors.tinta
  }
})
