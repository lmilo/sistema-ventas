import { useFocusEffect, router } from 'expo-router'
import { useSQLiteContext } from 'expo-sqlite'
import { useCallback, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import Cargando from '../../components/Cargando'
import Encabezado from '../../components/Encabezado'
import { productosBajoStock, resumenTienda } from '../../db/reportes'
import type { Producto, ResumenTienda } from '../../db/tipos'
import { pesos } from '../../lib/moneda'
import { colors, radios } from '../../theme'

/** C8: resumen financiero de la tienda. */
export default function InicioAdmin() {
  const db = useSQLiteContext()
  const [resumen, setResumen] = useState<ResumenTienda | null>(null)
  const [bajos, setBajos] = useState<Producto[]>([])

  useFocusEffect(
    useCallback(() => {
      Promise.all([resumenTienda(db), productosBajoStock(db)]).then(([datos, lista]) => {
        setResumen(datos)
        setBajos(lista)
      })
    }, [db])
  )

  if (!resumen) return <Cargando />

  const tarjetas = [
    { etiqueta: 'Ingresos', valor: pesos(resumen.ingresos), destacado: true },
    { etiqueta: 'Ganancia', valor: pesos(resumen.ganancia), destacado: true },
    { etiqueta: 'Compras', valor: String(resumen.compras) },
    { etiqueta: 'Clientes', valor: String(resumen.clientes) }
  ]

  return (
    <View style={styles.raiz}>
      <Encabezado titulo="Resumen" bajada="Estado general de la tienda" />

      <ScrollView contentContainerStyle={styles.contenido}>
        <View style={styles.tarjetas}>
          {tarjetas.map(tarjeta => (
            <View
              key={tarjeta.etiqueta}
              style={[styles.tarjeta, tarjeta.destacado && styles.tarjetaDestacada]}
            >
              <Text style={styles.etiqueta}>{tarjeta.etiqueta}</Text>
              <Text style={[styles.valor, tarjeta.destacado && styles.valorDestacado]}>
                {tarjeta.valor}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.seccion}>
          <View style={styles.seccionCabecera}>
            <Text style={styles.seccionTitulo}>Stock bajo</Text>
            <Pressable accessibilityRole="link" onPress={() => router.push('/(admin)/productos')}>
              <Text style={styles.enlace}>Ver productos</Text>
            </Pressable>
          </View>

          {bajos.length === 0 ? (
            <Text style={styles.sinDatos}>Ningún producto por debajo de 5 unidades.</Text>
          ) : (
            bajos.map(producto => (
              <View key={producto.id} style={styles.fila}>
                <Text style={styles.filaNombre} numberOfLines={1}>
                  {producto.nombre}
                </Text>
                <Text style={[styles.filaStock, producto.stock === 0 && styles.filaAgotado]}>
                  {producto.stock === 0 ? 'Agotado' : `${producto.stock} restantes`}
                </Text>
              </View>
            ))
          )}
        </View>
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
    flexWrap: 'wrap',
    gap: 12
  },
  tarjeta: {
    flexGrow: 1,
    minWidth: 150,
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
  seccion: {
    gap: 10,
    backgroundColor: colors.superficie,
    borderWidth: 1,
    borderColor: colors.borde,
    borderRadius: radios.lg,
    padding: 16
  },
  seccionCabecera: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  seccionTitulo: {
    fontWeight: '600',
    fontSize: 16,
    color: colors.tinta
  },
  enlace: {
    fontWeight: '600',
    fontSize: 13,
    color: colors.acento
  },
  sinDatos: {
    fontSize: 14,
    color: colors.tintaSuave
  },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.borde
  },
  filaNombre: {
    flex: 1,
    fontSize: 14,
    color: colors.tinta
  },
  filaStock: {
    fontWeight: '600',
    fontSize: 13,
    color: colors.tintaSuave
  },
  filaAgotado: {
    color: colors.error
  }
})
