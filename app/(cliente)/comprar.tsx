import { useFocusEffect } from 'expo-router'
import { useSQLiteContext } from 'expo-sqlite'
import { useCallback, useMemo, useState } from 'react'
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import Boton from '../../components/Boton'
import Cargando from '../../components/Cargando'
import Encabezado from '../../components/Encabezado'
import { obtenerClientePorLogin } from '../../db/clientes'
import { crearCompra } from '../../db/compras'
import { listarProductos } from '../../db/productos'
import type { ItemCompra, Producto } from '../../db/tipos'
import { pesos } from '../../lib/moneda'
import { useSesion } from '../../lib/sesion'
import { colors, radios, shared } from '../../theme'

export default function Comprar() {
  const db = useSQLiteContext()
  const { cuenta } = useSesion()
  const [productos, setProductos] = useState<Producto[]>([])
  const [idCliente, setIdCliente] = useState<number | null>(null)
  const [cantidades, setCantidades] = useState<Record<number, number>>({})
  const [busqueda, setBusqueda] = useState('')
  const [error, setError] = useState('')
  const [aviso, setAviso] = useState('')
  const [cargando, setCargando] = useState(true)
  const [confirmando, setConfirmando] = useState(false)

  const cargar = useCallback(async () => {
    if (!cuenta) return
    const [lista, cliente] = await Promise.all([
      listarProductos(db),
      obtenerClientePorLogin(db, cuenta.id)
    ])
    setProductos(lista)
    setIdCliente(cliente?.id ?? null)
    setCargando(false)
  }, [db, cuenta])

  useFocusEffect(
    useCallback(() => {
      cargar()
    }, [cargar])
  )

  const disponibles = useMemo(() => {
    const termino = busqueda.trim().toLowerCase()
    // HU-05: solo se pueden seleccionar productos con stock mayor a cero.
    return productos
      .filter(p => p.stock > 0)
      .filter(p => (termino ? p.nombre.toLowerCase().includes(termino) : true))
  }, [productos, busqueda])

  const items: ItemCompra[] = useMemo(
    () =>
      productos
        .filter(p => (cantidades[p.id] ?? 0) > 0)
        .map(p => ({
          idProducto: p.id,
          nombre: p.nombre,
          cantidad: cantidades[p.id],
          precioUnitario: p.precioUnitario,
          precioCompra: p.precioCompra
        })),
    [productos, cantidades]
  )

  const total = items.reduce((suma, item) => suma + item.precioUnitario * item.cantidad, 0)

  const ajustar = (producto: Producto, delta: number) => {
    setAviso('')
    setCantidades(previo => {
      const actual = previo[producto.id] ?? 0
      const siguiente = actual + delta

      if (siguiente <= 0) {
        const copia = { ...previo }
        delete copia[producto.id]
        return copia
      }
      // HU-05: nunca por encima del stock existente.
      if (siguiente > producto.stock) {
        setError(`Solo hay ${producto.stock} unidad(es) de "${producto.nombre}".`)
        return previo
      }

      setError('')
      return { ...previo, [producto.id]: siguiente }
    })
  }

  const confirmar = async () => {
    if (!idCliente) {
      setError('Debes completar tus datos personales antes de comprar.')
      return
    }
    if (items.length === 0) {
      setError('Selecciona al menos un producto.')
      return
    }

    setConfirmando(true)
    setError('')

    try {
      const idCompra = await crearCompra(db, idCliente, items)
      setCantidades({})
      setAviso(`Compra #${idCompra} registrada por ${pesos(total)}.`)
      await cargar()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo registrar la compra.')
    } finally {
      setConfirmando(false)
    }
  }

  if (cargando) return <Cargando />

  // HU-03: no se permite comprar sin productos registrados.
  if (productos.length === 0) {
    return (
      <View style={styles.raiz}>
        <Encabezado titulo="Comprar" />
        <View style={styles.vacio}>
          <Text style={styles.vacioTitulo}>Todavía no hay productos</Text>
          <Text style={styles.vacioTexto}>
            Un administrador debe registrar productos antes de que puedas comprar.
          </Text>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.raiz}>
      <Encabezado titulo="Comprar" bajada={`${disponibles.length} producto(s) disponible(s)`} />

      <TextInput
        style={styles.buscador}
        value={busqueda}
        onChangeText={setBusqueda}
        placeholder="Buscar producto"
        placeholderTextColor={colors.tintaTenue}
        autoCapitalize="none"
      />

      <FlatList
        data={disponibles}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={styles.lista}
        ListEmptyComponent={
          <View style={styles.vacio}>
            <Text style={styles.vacioTitulo}>Sin resultados</Text>
            <Text style={styles.vacioTexto}>Ningún producto con stock coincide con la búsqueda.</Text>
          </View>
        }
        renderItem={({ item }) => {
          const cantidad = cantidades[item.id] ?? 0
          return (
            <View style={styles.fila}>
              <View style={styles.datos}>
                <Text style={styles.nombre}>{item.nombre}</Text>
                {item.descripcion ? (
                  <Text style={styles.descripcion} numberOfLines={2}>
                    {item.descripcion}
                  </Text>
                ) : null}
                <Text style={styles.precio}>
                  {pesos(item.precioUnitario)} · {item.stock} disponible(s)
                </Text>
              </View>

              <View style={styles.contador}>
                <Pressable
                  accessibilityRole="button"
                  style={[styles.paso, cantidad === 0 && styles.pasoInactivo]}
                  onPress={() => ajustar(item, -1)}
                >
                  <Text style={styles.pasoTexto}>−</Text>
                </Pressable>

                <Text style={styles.cantidad}>{cantidad}</Text>

                <Pressable
                  accessibilityRole="button"
                  style={[styles.paso, cantidad >= item.stock && styles.pasoInactivo]}
                  onPress={() => ajustar(item, 1)}
                >
                  <Text style={styles.pasoTexto}>+</Text>
                </Pressable>
              </View>
            </View>
          )
        }}
      />

      <View style={styles.resumen}>
        {error !== '' && (
          <View style={shared.alerta}>
            <View style={shared.alertaPunto} />
            <Text style={shared.alertaTexto}>{error}</Text>
          </View>
        )}

        {aviso !== '' && (
          <View style={styles.exito}>
            <Text style={styles.exitoTexto}>{aviso}</Text>
          </View>
        )}

        <View style={styles.totales}>
          <Text style={styles.totalEtiqueta}>
            {items.length} producto(s) · {items.reduce((s, i) => s + i.cantidad, 0)} unidad(es)
          </Text>
          <Text style={styles.totalValor}>{pesos(total)}</Text>
        </View>

        <Boton
          titulo={confirmando ? 'Registrando…' : 'Confirmar compra'}
          onPress={confirmar}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  raiz: {
    flex: 1,
    backgroundColor: colors.fondo
  },
  buscador: {
    margin: 16,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: colors.borde,
    borderRadius: radios.md,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 15,
    color: colors.tinta,
    backgroundColor: colors.superficie
  },
  lista: {
    padding: 16,
    gap: 12
  },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.superficie,
    borderWidth: 1,
    borderColor: colors.borde,
    borderRadius: radios.lg,
    padding: 16
  },
  datos: {
    flex: 1,
    gap: 4
  },
  nombre: {
    fontWeight: '600',
    fontSize: 16,
    color: colors.tinta
  },
  descripcion: {
    fontSize: 13,
    color: colors.tintaSuave
  },
  precio: {
    fontWeight: '500',
    fontSize: 13,
    color: colors.acento
  },
  contador: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  paso: {
    width: 34,
    height: 34,
    borderRadius: radios.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.acentoSuave
  },
  pasoInactivo: {
    opacity: 0.4
  },
  pasoTexto: {
    fontWeight: '700',
    fontSize: 18,
    color: colors.acento
  },
  cantidad: {
    minWidth: 22,
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 16,
    color: colors.tinta
  },
  resumen: {
    gap: 12,
    padding: 16,
    backgroundColor: colors.superficie,
    borderTopWidth: 1,
    borderTopColor: colors.borde
  },
  totales: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  totalEtiqueta: {
    fontSize: 13,
    color: colors.tintaSuave
  },
  totalValor: {
    fontWeight: '700',
    fontSize: 22,
    letterSpacing: -0.5,
    color: colors.tinta
  },
  vacio: {
    alignItems: 'center',
    gap: 6,
    padding: 32
  },
  vacioTitulo: {
    fontWeight: '600',
    fontSize: 16,
    color: colors.tinta
  },
  vacioTexto: {
    fontSize: 14,
    textAlign: 'center',
    color: colors.tintaSuave
  },
  exito: {
    backgroundColor: '#ecfdf5',
    borderRadius: radios.md,
    paddingVertical: 10,
    paddingHorizontal: 14
  },
  exitoTexto: {
    fontWeight: '500',
    fontSize: 14,
    color: '#047857'
  }
})
