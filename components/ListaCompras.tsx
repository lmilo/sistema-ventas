import { useSQLiteContext } from 'expo-sqlite'
import { useState } from 'react'
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native'
import EstadoVacio from './EstadoVacio'
import { compraCompleta } from '../db/compras'
import { compartirFactura } from '../lib/factura'
import type { CompraCompleta, CompraResumen } from '../db/tipos'
import { fechaLegible, pesos } from '../lib/moneda'
import { colors, radios } from '../theme'

type Props = {
  compras: CompraResumen[]
  mostrarCliente?: boolean
  vacioTitulo: string
  vacioTexto: string
}

/** Listado de encabezados; al tocar uno se cargan sus detalles. Se comparte
 *  entre la vista del administrador y el historial del cliente. */
export default function ListaCompras({
  compras,
  mostrarCliente = false,
  vacioTitulo,
  vacioTexto
}: Props) {
  const db = useSQLiteContext()
  const [abierta, setAbierta] = useState<number | null>(null)
  const [detalle, setDetalle] = useState<CompraCompleta | null>(null)

  const alternar = async (id: number) => {
    if (abierta === id) {
      setAbierta(null)
      setDetalle(null)
      return
    }
    setAbierta(id)
    setDetalle(null)
    setDetalle(await compraCompleta(db, id))
  }

  return (
    <FlatList
      data={compras}
      keyExtractor={item => String(item.id)}
      contentContainerStyle={styles.lista}
      ListEmptyComponent={
        <EstadoVacio titulo={vacioTitulo} texto={vacioTexto} />
      }
      renderItem={({ item }) => {
        const expandida = abierta === item.id
        return (
          <View style={styles.tarjeta}>
            <Pressable
              accessibilityRole="button"
              style={styles.cabecera}
              onPress={() => alternar(item.id)}
            >
              <View style={styles.datos}>
                <Text style={styles.numero}>Compra #{item.id}</Text>
                {mostrarCliente ? <Text style={styles.cliente}>{item.nombreCliente}</Text> : null}
                <Text style={styles.fecha}>
                  {fechaLegible(item.fechaVenta)} · {item.items} producto(s)
                </Text>
              </View>

              <View style={styles.derecha}>
                <Text style={styles.total}>{pesos(item.total)}</Text>
                <Text style={styles.ver}>{expandida ? 'Ocultar' : 'Ver detalle'}</Text>
              </View>
            </Pressable>

            {expandida && (
              <View style={styles.detalles}>
                {detalle === null ? (
                  <Text style={styles.cargando}>Cargando detalle…</Text>
                ) : (
                  <>
                    {detalle.detalles.map(linea => (
                      <View key={linea.id} style={styles.linea}>
                        <Text style={styles.lineaNombre} numberOfLines={1}>
                          {linea.cantidad} × {linea.nombreProducto}
                        </Text>
                        <Text style={styles.lineaValor}>{pesos(linea.subtotal)}</Text>
                      </View>
                    ))}

                    <Pressable
                      accessibilityRole="button"
                      style={styles.factura}
                      onPress={() => compartirFactura(detalle).catch(() => undefined)}
                    >
                      <Text style={styles.facturaTexto}>Descargar factura en PDF</Text>
                    </Pressable>
                  </>
                )}
              </View>
            )}
          </View>
        )
      }}
    />
  )
}

const styles = StyleSheet.create({
  lista: {
    padding: 16,
    gap: 12
  },
  tarjeta: {
    backgroundColor: colors.superficie,
    borderWidth: 1,
    borderColor: colors.borde,
    borderRadius: radios.lg,
    overflow: 'hidden'
  },
  cabecera: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    padding: 16
  },
  datos: {
    flex: 1,
    gap: 3
  },
  numero: {
    fontWeight: '600',
    fontSize: 16,
    color: colors.tinta
  },
  cliente: {
    fontSize: 14,
    color: colors.tinta
  },
  fecha: {
    fontSize: 13,
    color: colors.tintaSuave
  },
  derecha: {
    alignItems: 'flex-end',
    gap: 3
  },
  total: {
    fontWeight: '700',
    fontSize: 17,
    color: colors.tinta
  },
  ver: {
    fontWeight: '600',
    fontSize: 12,
    color: colors.acento
  },
  detalles: {
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: colors.borde
  },
  linea: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    paddingTop: 8
  },
  lineaNombre: {
    flex: 1,
    fontSize: 14,
    color: colors.tintaSuave
  },
  lineaValor: {
    fontWeight: '500',
    fontSize: 14,
    color: colors.tinta
  },
  factura: {
    marginTop: 12,
    paddingVertical: 11,
    borderRadius: radios.md,
    alignItems: 'center',
    backgroundColor: colors.acentoSuave
  },
  facturaTexto: {
    fontWeight: '600',
    fontSize: 13,
    color: colors.acento
  },
  cargando: {
    paddingTop: 10,
    fontSize: 13,
    color: colors.tintaTenue
  }
})
