import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View
} from 'react-native'
import { useSQLiteContext } from 'expo-sqlite'
import {
  actualizarProducto,
  aumentarStock,
  cambiarEstadoProducto,
  crearProducto,
  listarProductos
} from '../../db/productos'
import type { Producto, ProductoInput } from '../../db/tipos'
import { colors, radios } from '../../theme'

type FormProducto = {
  nombre: string
  descripcion: string
  stock: string
  precioUnitario: string
  precioCompra: string
  imagenUri: string
}

const FORM_INICIAL: FormProducto = {
  nombre: '',
  descripcion: '',
  stock: '0',
  precioUnitario: '',
  precioCompra: '',
  imagenUri: ''
}

const monedaCOP = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0
})

export default function ProductosAdminScreen() {
  const db = useSQLiteContext()
  const [productos, setProductos] = useState<Producto[]>([])
  const [busqueda, setBusqueda] = useState('')
  const [incluirInactivos, setIncluirInactivos] = useState(false)
  const [cargando, setCargando] = useState(true)
  const [refrescando, setRefrescando] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [modalFormulario, setModalFormulario] = useState(false)
  const [modalStock, setModalStock] = useState(false)
  const [productoEditando, setProductoEditando] = useState<Producto | null>(null)
  const [productoStock, setProductoStock] = useState<Producto | null>(null)
  const [formulario, setFormulario] = useState<FormProducto>(FORM_INICIAL)
  const [stockExtra, setStockExtra] = useState('')

  const cargarProductos = useCallback(
    async (modoRefresco = false) => {
      if (modoRefresco) {
        setRefrescando(true)
      } else {
        setCargando(true)
      }

      try {
        const resultado = await listarProductos(db, {
          incluirInactivos,
          termino: busqueda
        })
        setProductos(resultado)
        setError('')
      } catch {
        setError('No se pudieron cargar los productos.')
      } finally {
        setCargando(false)
        setRefrescando(false)
      }
    },
    [busqueda, db, incluirInactivos]
  )

  useEffect(() => {
    cargarProductos()
  }, [cargarProductos])

  const resumen = useMemo(
    () => ({
      activos: productos.filter(producto => producto.activo).length,
      bajoStock: productos.filter(producto => producto.activo && producto.stock <= 5).length,
      valorInventario: productos.reduce(
        (total, producto) => total + producto.stock * producto.precioCompra,
        0
      )
    }),
    [productos]
  )

  const abrirNuevoProducto = () => {
    setProductoEditando(null)
    setFormulario(FORM_INICIAL)
    setError('')
    setModalFormulario(true)
  }

  const abrirEdicion = (producto: Producto) => {
    setProductoEditando(producto)
    setFormulario({
      nombre: producto.nombre,
      descripcion: producto.descripcion ?? '',
      stock: String(producto.stock),
      precioUnitario: String(producto.precioUnitario),
      precioCompra: String(producto.precioCompra),
      imagenUri: producto.imagenUri ?? ''
    })
    setError('')
    setModalFormulario(true)
  }

  const abrirStock = (producto: Producto) => {
    setProductoStock(producto)
    setStockExtra('')
    setError('')
    setModalStock(true)
  }

  const guardarProducto = async () => {
    const producto = parsearFormulario(formulario)

    if (!producto.ok) {
      setError(producto.error)
      return
    }

    setGuardando(true)
    try {
      if (productoEditando) {
        await actualizarProducto(db, productoEditando.id, producto.valor)
      } else {
        await crearProducto(db, producto.valor)
      }

      setModalFormulario(false)
      await cargarProductos()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el producto.')
    } finally {
      setGuardando(false)
    }
  }

  const guardarStock = async () => {
    const cantidad = Number(stockExtra)

    if (!productoStock || !Number.isInteger(cantidad) || cantidad <= 0) {
      setError('Ingresa una cantidad entera mayor que cero.')
      return
    }

    setGuardando(true)
    try {
      await aumentarStock(db, productoStock.id, cantidad)
      setModalStock(false)
      await cargarProductos()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo actualizar el stock.')
    } finally {
      setGuardando(false)
    }
  }

  const alternarEstado = async (producto: Producto) => {
    try {
      await cambiarEstadoProducto(db, producto.id, !producto.activo)
      await cargarProductos()
    } catch {
      setError('No se pudo cambiar el estado del producto.')
    }
  }

  return (
    <SafeAreaView style={styles.raiz}>
      <View style={styles.contenedor}>
        <View style={styles.encabezado}>
          <View style={styles.tituloGrupo}>
            <Text style={styles.sobretitulo}>Administrador</Text>
            <Text style={styles.titulo}>Productos</Text>
          </View>
          <BotonTexto texto="Nuevo" onPress={abrirNuevoProducto} />
        </View>

        <TextInput
          value={busqueda}
          onChangeText={setBusqueda}
          placeholder="Buscar producto"
          placeholderTextColor={colors.tintaTenue}
          style={styles.buscador}
        />

        <View style={styles.filtros}>
          <Text style={styles.filtroTexto}>Mostrar inactivos</Text>
          <Switch value={incluirInactivos} onValueChange={setIncluirInactivos} />
        </View>

        <View style={styles.indicadores}>
          <Indicador etiqueta="Activos" valor={String(resumen.activos)} />
          <Indicador etiqueta="Bajo stock" valor={String(resumen.bajoStock)} />
          <Indicador etiqueta="Inventario" valor={monedaCOP.format(resumen.valorInventario)} />
        </View>

        {error !== '' && (
          <View style={styles.alerta}>
            <Text style={styles.alertaTexto}>{error}</Text>
          </View>
        )}

        {cargando ? (
          <View style={styles.estado}>
            <ActivityIndicator color={colors.acento} />
            <Text style={styles.estadoTexto}>Cargando productos...</Text>
          </View>
        ) : (
          <FlatList
            data={productos}
            keyExtractor={producto => String(producto.id)}
            contentContainerStyle={productos.length === 0 ? styles.listaVacia : styles.lista}
            refreshControl={
              <RefreshControl refreshing={refrescando} onRefresh={() => cargarProductos(true)} />
            }
            ListEmptyComponent={
              <View style={styles.estado}>
                <Text style={styles.estadoTitulo}>No hay productos</Text>
                <Text style={styles.estadoTexto}>
                  Crea el primer producto para empezar a llenar el catalogo.
                </Text>
              </View>
            }
            renderItem={({ item }) => (
              <ProductoItem
                producto={item}
                onEditar={() => abrirEdicion(item)}
                onStock={() => abrirStock(item)}
                onEstado={() => alternarEstado(item)}
              />
            )}
          />
        )}
      </View>

      <Modal visible={modalFormulario} animationType="slide" onRequestClose={() => setModalFormulario(false)}>
        <SafeAreaView style={styles.modalRaiz}>
          <ScrollView contentContainerStyle={styles.modalContenido} keyboardShouldPersistTaps="handled">
            <View style={styles.modalEncabezado}>
              <Text style={styles.modalTitulo}>
                {productoEditando ? 'Editar producto' : 'Nuevo producto'}
              </Text>
              <BotonTexto texto="Cerrar" variante="secundario" onPress={() => setModalFormulario(false)} />
            </View>

            <CampoFormulario
              etiqueta="Nombre"
              valor={formulario.nombre}
              onChangeText={nombre => setFormulario(prev => ({ ...prev, nombre }))}
              placeholder="Camisa azul"
            />
            <CampoFormulario
              etiqueta="Descripcion"
              valor={formulario.descripcion}
              onChangeText={descripcion => setFormulario(prev => ({ ...prev, descripcion }))}
              placeholder="Detalle visible para el catalogo"
              multiline
            />
            <CampoFormulario
              etiqueta="Stock"
              valor={formulario.stock}
              onChangeText={stock => setFormulario(prev => ({ ...prev, stock }))}
              placeholder="0"
              keyboardType="number-pad"
            />
            <CampoFormulario
              etiqueta="Precio unitario"
              valor={formulario.precioUnitario}
              onChangeText={precioUnitario => setFormulario(prev => ({ ...prev, precioUnitario }))}
              placeholder="35000"
              keyboardType="decimal-pad"
            />
            <CampoFormulario
              etiqueta="Precio de compra"
              valor={formulario.precioCompra}
              onChangeText={precioCompra => setFormulario(prev => ({ ...prev, precioCompra }))}
              placeholder="22000"
              keyboardType="decimal-pad"
            />
            <CampoFormulario
              etiqueta="URI de imagen"
              valor={formulario.imagenUri}
              onChangeText={imagenUri => setFormulario(prev => ({ ...prev, imagenUri }))}
              placeholder="Se conectara al selector de imagenes"
              autoCapitalize="none"
            />

            <BotonTexto
              texto={guardando ? 'Guardando...' : 'Guardar'}
              onPress={guardarProducto}
              deshabilitado={guardando}
            />
          </ScrollView>
        </SafeAreaView>
      </Modal>

      <Modal visible={modalStock} transparent animationType="fade" onRequestClose={() => setModalStock(false)}>
        <View style={styles.stockFondo}>
          <View style={styles.stockPanel}>
            <Text style={styles.modalTitulo}>Subir stock</Text>
            <Text style={styles.stockProducto}>{productoStock?.nombre}</Text>
            <CampoFormulario
              etiqueta="Cantidad a agregar"
              valor={stockExtra}
              onChangeText={setStockExtra}
              placeholder="10"
              keyboardType="number-pad"
            />
            <View style={styles.stockAcciones}>
              <BotonTexto
                texto="Cancelar"
                variante="secundario"
                onPress={() => setModalStock(false)}
              />
              <BotonTexto
                texto={guardando ? 'Guardando...' : 'Agregar'}
                onPress={guardarStock}
                deshabilitado={guardando}
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

function ProductoItem({
  producto,
  onEditar,
  onStock,
  onEstado
}: {
  producto: Producto
  onEditar: () => void
  onStock: () => void
  onEstado: () => void
}) {
  const margen = producto.precioUnitario - producto.precioCompra

  return (
    <View style={[styles.tarjeta, !producto.activo && styles.tarjetaInactiva]}>
      <View style={styles.productoFila}>
        <View style={styles.productoInfo}>
          <Text style={styles.productoNombre}>{producto.nombre}</Text>
          <Text style={styles.productoDescripcion} numberOfLines={2}>
            {producto.descripcion || 'Sin descripcion'}
          </Text>
        </View>
        <View style={[styles.estadoPill, producto.activo ? styles.activoPill : styles.inactivoPill]}>
          <Text style={[styles.estadoPillTexto, !producto.activo && styles.inactivoPillTexto]}>
            {producto.activo ? 'Activo' : 'Inactivo'}
          </Text>
        </View>
      </View>

      <View style={styles.detalles}>
        <Dato etiqueta="Stock" valor={String(producto.stock)} destacado={producto.stock <= 5} />
        <Dato etiqueta="Venta" valor={monedaCOP.format(producto.precioUnitario)} />
        <Dato etiqueta="Compra" valor={monedaCOP.format(producto.precioCompra)} />
        <Dato etiqueta="Margen" valor={monedaCOP.format(margen)} destacado={margen < 0} />
      </View>

      <View style={styles.acciones}>
        <BotonTexto texto="Editar" variante="secundario" onPress={onEditar} />
        <BotonTexto texto="Stock" variante="secundario" onPress={onStock} />
        <BotonTexto texto={producto.activo ? 'Desactivar' : 'Activar'} onPress={onEstado} />
      </View>
    </View>
  )
}

function Indicador({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <View style={styles.indicador}>
      <Text style={styles.indicadorValor} numberOfLines={1}>
        {valor}
      </Text>
      <Text style={styles.indicadorTexto}>{etiqueta}</Text>
    </View>
  )
}

function Dato({
  etiqueta,
  valor,
  destacado = false
}: {
  etiqueta: string
  valor: string
  destacado?: boolean
}) {
  return (
    <View style={styles.dato}>
      <Text style={styles.datoEtiqueta}>{etiqueta}</Text>
      <Text style={[styles.datoValor, destacado && styles.datoDestacado]}>{valor}</Text>
    </View>
  )
}

function CampoFormulario({
  etiqueta,
  valor,
  onChangeText,
  ...props
}: {
  etiqueta: string
  valor: string
  onChangeText: (valor: string) => void
} & Omit<React.ComponentProps<typeof TextInput>, 'value' | 'onChangeText'>) {
  return (
    <View style={styles.campo}>
      <Text style={styles.campoEtiqueta}>{etiqueta}</Text>
      <TextInput
        value={valor}
        onChangeText={onChangeText}
        placeholderTextColor={colors.tintaTenue}
        style={[styles.campoInput, props.multiline && styles.campoArea]}
        {...props}
      />
    </View>
  )
}

function BotonTexto({
  texto,
  onPress,
  variante = 'primario',
  deshabilitado = false
}: {
  texto: string
  onPress: () => void
  variante?: 'primario' | 'secundario'
  deshabilitado?: boolean
}) {
  const primario = variante === 'primario'

  return (
    <Pressable
      accessibilityRole="button"
      disabled={deshabilitado}
      onPress={onPress}
      style={({ pressed }) => [
        styles.boton,
        primario ? styles.botonPrimario : styles.botonSecundario,
        pressed && styles.botonPresionado,
        deshabilitado && styles.botonDeshabilitado
      ]}
    >
      <Text style={[styles.botonTexto, primario ? styles.botonTextoPrimario : styles.botonTextoSecundario]}>
        {texto}
      </Text>
    </Pressable>
  )
}

function parsearFormulario(
  formulario: FormProducto
): { ok: true; valor: ProductoInput } | { ok: false; error: string } {
  const nombre = formulario.nombre.trim()
  const stock = Number(formulario.stock)
  const precioUnitario = Number(formulario.precioUnitario)
  const precioCompra = Number(formulario.precioCompra)

  if (!nombre) {
    return { ok: false, error: 'El nombre es obligatorio.' }
  }

  if (!Number.isInteger(stock) || stock < 0) {
    return { ok: false, error: 'El stock debe ser un entero igual o mayor que cero.' }
  }

  if (!Number.isFinite(precioUnitario) || precioUnitario < 0) {
    return { ok: false, error: 'El precio unitario debe ser igual o mayor que cero.' }
  }

  if (!Number.isFinite(precioCompra) || precioCompra < 0) {
    return { ok: false, error: 'El precio de compra debe ser igual o mayor que cero.' }
  }

  return {
    ok: true,
    valor: {
      nombre,
      descripcion: formulario.descripcion,
      stock,
      precioUnitario,
      precioCompra,
      imagenUri: formulario.imagenUri
    }
  }
}

const styles = StyleSheet.create({
  raiz: {
    flex: 1,
    backgroundColor: colors.fondo
  },
  contenedor: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20
  },
  encabezado: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 16
  },
  tituloGrupo: {
    flex: 1
  },
  sobretitulo: {
    color: colors.acento,
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase'
  },
  titulo: {
    color: colors.tinta,
    fontSize: 30,
    fontWeight: '700'
  },
  buscador: {
    borderWidth: 1,
    borderColor: colors.borde,
    borderRadius: radios.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 10,
    backgroundColor: colors.superficie,
    color: colors.tinta,
    fontSize: 15
  },
  filtros: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  filtroTexto: {
    color: colors.tintaSuave,
    fontSize: 14,
    fontWeight: '600'
  },
  indicadores: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14
  },
  indicador: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.borde,
    borderRadius: radios.md,
    padding: 12,
    backgroundColor: colors.superficie
  },
  indicadorValor: {
    color: colors.tinta,
    fontSize: 16,
    fontWeight: '700'
  },
  indicadorTexto: {
    marginTop: 3,
    color: colors.tintaSuave,
    fontSize: 12,
    fontWeight: '500'
  },
  alerta: {
    borderRadius: radios.md,
    padding: 12,
    marginBottom: 12,
    backgroundColor: colors.errorFondo
  },
  alertaTexto: {
    color: colors.error,
    fontWeight: '600'
  },
  lista: {
    gap: 12,
    paddingBottom: 24
  },
  listaVacia: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingBottom: 24
  },
  tarjeta: {
    borderWidth: 1,
    borderColor: colors.borde,
    borderRadius: radios.md,
    padding: 16,
    backgroundColor: colors.superficie
  },
  tarjetaInactiva: {
    opacity: 0.68
  },
  productoFila: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12
  },
  productoInfo: {
    flex: 1,
    gap: 4
  },
  productoNombre: {
    color: colors.tinta,
    fontSize: 17,
    fontWeight: '700'
  },
  productoDescripcion: {
    color: colors.tintaSuave,
    fontSize: 14,
    lineHeight: 19
  },
  estadoPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignSelf: 'flex-start'
  },
  activoPill: {
    backgroundColor: colors.acentoSuave
  },
  inactivoPill: {
    backgroundColor: colors.borde
  },
  estadoPillTexto: {
    color: colors.acento,
    fontSize: 12,
    fontWeight: '700'
  },
  inactivoPillTexto: {
    color: colors.tintaSuave
  },
  detalles: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 16
  },
  dato: {
    flex: 1,
    minWidth: '46%',
    gap: 2
  },
  datoEtiqueta: {
    color: colors.tintaTenue,
    fontSize: 12,
    fontWeight: '600'
  },
  datoValor: {
    color: colors.tinta,
    fontSize: 14,
    fontWeight: '700'
  },
  datoDestacado: {
    color: colors.error
  },
  acciones: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 16
  },
  estado: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 28
  },
  estadoTitulo: {
    color: colors.tinta,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center'
  },
  estadoTexto: {
    color: colors.tintaSuave,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center'
  },
  modalRaiz: {
    flex: 1,
    backgroundColor: colors.fondo
  },
  modalContenido: {
    padding: 20,
    gap: 14
  },
  modalEncabezado: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 4
  },
  modalTitulo: {
    flex: 1,
    color: colors.tinta,
    fontSize: 24,
    fontWeight: '700'
  },
  campo: {
    gap: 7
  },
  campoEtiqueta: {
    color: colors.tinta,
    fontSize: 13,
    fontWeight: '600'
  },
  campoInput: {
    borderWidth: 1,
    borderColor: colors.borde,
    borderRadius: radios.md,
    paddingHorizontal: 14,
    paddingVertical: 13,
    backgroundColor: colors.superficie,
    color: colors.tinta,
    fontSize: 15
  },
  campoArea: {
    minHeight: 88,
    textAlignVertical: 'top'
  },
  boton: {
    borderRadius: radios.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44
  },
  botonPrimario: {
    backgroundColor: colors.tinta
  },
  botonSecundario: {
    borderWidth: 1,
    borderColor: colors.borde,
    backgroundColor: colors.superficie
  },
  botonPresionado: {
    opacity: 0.82
  },
  botonDeshabilitado: {
    opacity: 0.55
  },
  botonTexto: {
    fontSize: 14,
    fontWeight: '700'
  },
  botonTextoPrimario: {
    color: '#ffffff'
  },
  botonTextoSecundario: {
    color: colors.tinta
  },
  stockFondo: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: 'rgba(15,23,42,0.35)'
  },
  stockPanel: {
    gap: 14,
    borderRadius: radios.lg,
    padding: 18,
    backgroundColor: colors.superficie
  },
  stockProducto: {
    color: colors.tintaSuave,
    fontSize: 15,
    fontWeight: '600'
  },
  stockAcciones: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10
  }
})
