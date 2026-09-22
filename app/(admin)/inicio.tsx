import Feather from '@expo/vector-icons/Feather'
import { router, useFocusEffect } from 'expo-router'
import { useSQLiteContext } from 'expo-sqlite'
import { useCallback, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import Cargando from '../../components/Cargando'
import Encabezado from '../../components/Encabezado'
import Tarjeta from '../../components/Tarjeta'
import { productosBajoStock, resumenTienda } from '../../db/reportes'
import type { Producto, ResumenTienda } from '../../db/tipos'
import { pesos } from '../../lib/moneda'
import { colors, espacio, fuentes, radios, tipo } from '../../theme'

type Icono = keyof typeof Feather.glyphMap

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

  const margen = resumen.ingresos > 0 ? Math.round((resumen.ganancia / resumen.ingresos) * 100) : 0

  const secundarios: { icono: Icono; valor: string; etiqueta: string }[] = [
    { icono: 'shopping-bag', valor: String(resumen.compras), etiqueta: 'compras' },
    { icono: 'users', valor: String(resumen.clientes), etiqueta: 'clientes' },
    { icono: 'alert-triangle', valor: String(resumen.productosBajoStock), etiqueta: 'bajo stock' }
  ]

  return (
    <View style={styles.raiz}>
      <Encabezado titulo="Resumen" bajada="Estado general de la tienda" />

      <ScrollView contentContainerStyle={styles.contenido}>
        <Tarjeta destacada style={styles.panel}>
          <Text style={tipo.sobretitulo}>Ingresos acumulados</Text>
          <Text style={tipo.cifraGrande}>{pesos(resumen.ingresos)}</Text>

          <View style={styles.filete} />

          <View style={styles.margen}>
            <View>
              <Text style={tipo.menudo}>Ganancia</Text>
              <Text style={styles.ganancia}>{pesos(resumen.ganancia)}</Text>
            </View>
            <View style={styles.insignia}>
              <Feather name="trending-up" size={13} color={colors.oliva} />
              <Text style={styles.insigniaTexto}>{margen}% de margen</Text>
            </View>
          </View>
        </Tarjeta>

        <View style={styles.secundarios}>
          {secundarios.map(dato => (
            <Tarjeta key={dato.etiqueta} style={styles.mini}>
              <Feather name={dato.icono} size={16} color={colors.piedra} />
              <Text style={styles.miniValor}>{dato.valor}</Text>
              <Text style={tipo.menudo}>{dato.etiqueta}</Text>
            </Tarjeta>
          ))}
        </View>

        <Tarjeta style={styles.seccion}>
          <View style={styles.seccionCabecera}>
            <Text style={tipo.subtitulo}>Stock bajo</Text>
            <Pressable
              accessibilityRole="link"
              onPress={() => router.push('/(admin)/productos')}
              style={({ pressed }) => [styles.verMas, pressed && styles.presionado]}
            >
              <Text style={styles.verMasTexto}>Productos</Text>
              <Feather name="arrow-right" size={14} color={colors.terracota} />
            </Pressable>
          </View>

          {bajos.length === 0 ? (
            <Text style={tipo.cuerpo}>Ningún producto por debajo de 5 unidades.</Text>
          ) : (
            bajos.map(producto => (
              <View key={producto.id} style={styles.fila}>
                <Text style={styles.filaNombre} numberOfLines={1}>
                  {producto.nombre}
                </Text>
                <View style={styles.barra}>
                  <View
                    style={[
                      styles.barraLlena,
                      {
                        width: `${Math.min(100, (producto.stock / 5) * 100)}%`,
                        backgroundColor: producto.stock === 0 ? colors.ladrillo : colors.terracota
                      }
                    ]}
                  />
                </View>
                <Text style={[styles.filaStock, producto.stock === 0 && styles.agotado]}>
                  {producto.stock === 0 ? 'Agotado' : producto.stock}
                </Text>
              </View>
            ))
          )}
        </Tarjeta>
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
    padding: espacio.xl,
    paddingTop: espacio.lg,
    gap: espacio.md
  },
  panel: {
    gap: espacio.sm,
    padding: espacio.xl
  },
  filete: {
    height: 1,
    backgroundColor: colors.bordeFuerte,
    marginVertical: espacio.md
  },
  margen: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between'
  },
  ganancia: {
    fontFamily: fuentes.displayFuerte,
    fontSize: 20,
    letterSpacing: -0.5,
    color: colors.oliva,
    fontVariant: ['tabular-nums']
  },
  insignia: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 5,
    paddingHorizontal: espacio.md,
    borderRadius: radios.pildora,
    backgroundColor: colors.olivaSuave
  },
  insigniaTexto: {
    fontFamily: fuentes.textoMedio,
    fontSize: 12,
    color: colors.oliva
  },
  secundarios: {
    flexDirection: 'row',
    gap: espacio.md
  },
  mini: {
    flex: 1,
    gap: 5,
    paddingVertical: espacio.lg
  },
  miniValor: {
    fontFamily: fuentes.displayFuerte,
    fontSize: 22,
    letterSpacing: -0.5,
    color: colors.tinta,
    fontVariant: ['tabular-nums']
  },
  seccion: {
    gap: espacio.md
  },
  seccionCabecera: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  verMas: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5
  },
  presionado: {
    opacity: 0.7
  },
  verMasTexto: {
    fontFamily: fuentes.textoFuerte,
    fontSize: 13,
    color: colors.terracota
  },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacio.md
  },
  filaNombre: {
    flex: 1,
    fontFamily: fuentes.texto,
    fontSize: 14,
    color: colors.tinta
  },
  barra: {
    width: 54,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    backgroundColor: colors.borde
  },
  barraLlena: {
    height: 4,
    borderRadius: 2
  },
  filaStock: {
    minWidth: 52,
    textAlign: 'right',
    fontFamily: fuentes.textoMedio,
    fontSize: 13,
    color: colors.piedra
  },
  agotado: {
    color: colors.ladrillo
  }
})
