import Feather from '@expo/vector-icons/Feather'
import { useSQLiteContext } from 'expo-sqlite'
import { useState } from 'react'
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native'
import EstadoVacio from './EstadoVacio'
import { compraCompleta } from '../db/compras'
import type { CompraCompleta, CompraResumen } from '../db/tipos'
import { compartirFactura } from '../lib/factura'
import { fechaLegible, pesos } from '../lib/moneda'
import { colors, espacio, fuentes, radios, tipo } from '../theme'

type Props = {
  compras: CompraResumen[]
  mostrarCliente?: boolean
  vacioTitulo: string
  vacioTexto: string
}

export default function ListaCompras({
  compras,
  mostrarCliente = false,
  vacioTitulo,
  vacioTexto
}: Props) {
  const db = useSQLiteContext()
  const [abierta, setAbierta] = useState<number | null>(null)
  const [detalle, setDetalle] = useState<CompraCompleta | null>(null)
  const [generando, setGenerando] = useState(false)
  const [fallo, setFallo] = useState('')

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

  const descargar = async (compra: CompraCompleta) => {
    setGenerando(true)
    setFallo('')
    try {
      await compartirFactura(compra)
    } catch (e) {
      setFallo(e instanceof Error ? e.message : 'No se pudo generar el PDF.')
    } finally {
      setGenerando(false)
    }
  }

  return (
    <FlatList
      data={compras}
      keyExtractor={item => String(item.id)}
      contentContainerStyle={styles.lista}
      ListEmptyComponent={
        <EstadoVacio titulo={vacioTitulo} texto={vacioTexto} icono="shopping-bag" />
      }
      renderItem={({ item }) => {
        const expandida = abierta === item.id
        return (
          <View style={[styles.tarjeta, expandida && styles.tarjetaAbierta]}>
            <Pressable
              accessibilityRole="button"
              style={({ pressed }) => [styles.cabecera, pressed && styles.presionada]}
              onPress={() => alternar(item.id)}
            >
              <View style={styles.folio}>
                <Text style={styles.folioNumero}>{String(item.id).padStart(2, '0')}</Text>
              </View>

              <View style={styles.datos}>
                <Text style={tipo.cuerpoFuerte} numberOfLines={1}>
                  {mostrarCliente ? item.nombreCliente : `Compra #${item.id}`}
                </Text>
                <Text style={tipo.menudo}>
                  {fechaLegible(item.fechaVenta)} · {item.items} producto(s)
                </Text>
              </View>

              <View style={styles.derecha}>
                <Text style={styles.total}>{pesos(item.total)}</Text>
                <Feather
                  name={expandida ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color={colors.piedraTenue}
                />
              </View>
            </Pressable>

            {expandida && (
              <View style={styles.detalles}>
                {detalle === null ? (
                  <Text style={tipo.menudo}>Cargando detalle…</Text>
                ) : (
                  <>
                    {detalle.detalles.map(linea => (
                      <View key={linea.id} style={styles.linea}>
                        <Text style={styles.cantidad}>{linea.cantidad}×</Text>
                        <Text style={styles.lineaNombre} numberOfLines={1}>
                          {linea.nombreProducto}
                        </Text>
                        <Text style={styles.lineaValor}>{pesos(linea.subtotal)}</Text>
                      </View>
                    ))}

                    {fallo !== '' ? <Text style={styles.fallo}>{fallo}</Text> : null}

                    <Pressable
                      accessibilityRole="button"
                      disabled={generando}
                      style={({ pressed }) => [styles.factura, pressed && styles.presionada]}
                      onPress={() => descargar(detalle)}
                    >
                      <Feather name="download" size={15} color={colors.terracota} />
                      <Text style={styles.facturaTexto}>
                        {generando ? 'Generando PDF…' : 'Descargar factura'}
                      </Text>
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
    padding: espacio.xl,
    paddingTop: espacio.lg,
    gap: espacio.md
  },
  tarjeta: {
    backgroundColor: colors.superficie,
    borderWidth: 1,
    borderColor: colors.borde,
    borderRadius: radios.lg,
    overflow: 'hidden'
  },
  tarjetaAbierta: {
    borderColor: colors.bordeFuerte
  },
  cabecera: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacio.md,
    padding: espacio.lg
  },
  presionada: {
    opacity: 0.85
  },
  folio: {
    width: 38,
    height: 38,
    borderRadius: radios.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.terracotaSuave
  },
  folioNumero: {
    fontFamily: fuentes.displayFuerte,
    fontSize: 15,
    color: colors.terracota
  },
  datos: {
    flex: 1,
    gap: 2
  },
  derecha: {
    alignItems: 'flex-end',
    gap: 3
  },
  total: {
    fontFamily: fuentes.displayFuerte,
    fontSize: 16,
    letterSpacing: -0.3,
    color: colors.tinta,
    fontVariant: ['tabular-nums']
  },
  detalles: {
    gap: espacio.sm,
    paddingHorizontal: espacio.lg,
    paddingBottom: espacio.lg,
    borderTopWidth: 1,
    borderTopColor: colors.borde,
    paddingTop: espacio.md
  },
  linea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacio.md
  },
  cantidad: {
    fontFamily: fuentes.textoFuerte,
    fontSize: 13,
    color: colors.terracota,
    minWidth: 26
  },
  lineaNombre: {
    flex: 1,
    fontFamily: fuentes.texto,
    fontSize: 14,
    color: colors.tintaSuave
  },
  lineaValor: {
    fontFamily: fuentes.textoMedio,
    fontSize: 14,
    color: colors.tinta,
    fontVariant: ['tabular-nums']
  },
  fallo: {
    fontFamily: fuentes.textoMedio,
    fontSize: 13,
    color: colors.ladrillo
  },
  factura: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: espacio.sm,
    marginTop: espacio.sm,
    paddingVertical: 11,
    borderRadius: radios.md,
    backgroundColor: colors.terracotaSuave
  },
  facturaTexto: {
    fontFamily: fuentes.textoFuerte,
    fontSize: 13.5,
    color: colors.terracota
  }
})
