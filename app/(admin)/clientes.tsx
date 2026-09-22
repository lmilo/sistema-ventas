import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useSQLiteContext } from 'expo-sqlite'
import { buscarClientes, listarClientes } from '../../db/clientes'
import type { ClienteResumen } from '../../db/tipos'
import { colors, fuentes, radios } from '../../theme'

const monedaCOP = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0
})

const formatearFecha = (fecha: string | null) => {
  if (!fecha) {
    return 'Sin compras'
  }

  const fechaNormalizada = fecha.includes('T') ? fecha : fecha.replace(' ', 'T')
  const valor = new Date(fechaNormalizada)

  if (Number.isNaN(valor.getTime())) {
    return fecha
  }

  return new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(valor)
}

export default function ClientesAdminScreen() {
  const db = useSQLiteContext()
  const [clientes, setClientes] = useState<ClienteResumen[]>([])
  const [busqueda, setBusqueda] = useState('')
  const [cargando, setCargando] = useState(true)
  const [refrescando, setRefrescando] = useState(false)
  const [error, setError] = useState('')

  const cargarClientes = useCallback(
    async (modoRefresco = false) => {
      if (modoRefresco) {
        setRefrescando(true)
      } else {
        setCargando(true)
      }

      try {
        const termino = busqueda.trim()
        const resultado =
          termino.length > 0 ? await buscarClientes(db, termino) : await listarClientes(db)

        setClientes(resultado)
        setError('')
      } catch {
        setError('No se pudieron cargar los clientes.')
      } finally {
        setCargando(false)
        setRefrescando(false)
      }
    },
    [busqueda, db]
  )

  useEffect(() => {
    cargarClientes()
  }, [cargarClientes])

  const totalClientes = clientes.length
  const totalCompras = useMemo(
    () => clientes.reduce((total, cliente) => total + cliente.totalCompras, 0),
    [clientes]
  )

  return (
    <SafeAreaView style={styles.raiz}>
      <View style={styles.contenedor}>
        <View style={styles.encabezado}>
          <View>
            <Text style={styles.sobretitulo}>Administrador</Text>
            <Text style={styles.titulo}>Clientes</Text>
          </View>
          <View style={styles.resumen}>
            <Text style={styles.resumenValor}>{totalClientes}</Text>
            <Text style={styles.resumenEtiqueta}>registrados</Text>
          </View>
        </View>

        <TextInput
          value={busqueda}
          onChangeText={setBusqueda}
          placeholder="Buscar por nombre o correo"
          placeholderTextColor={colors.piedraTenue}
          autoCapitalize="none"
          keyboardType="email-address"
          style={styles.buscador}
        />

        <View style={styles.indicadores}>
          <View style={styles.indicador}>
            <Text style={styles.indicadorValor}>{totalCompras}</Text>
            <Text style={styles.indicadorTexto}>compras registradas</Text>
          </View>
          <View style={styles.indicador}>
            <Text style={styles.indicadorValor}>{monedaCOP.format(totalGastado(clientes))}</Text>
            <Text style={styles.indicadorTexto}>en ventas a clientes</Text>
          </View>
        </View>

        {error !== '' && (
          <View style={styles.alerta}>
            <Text style={styles.alertaTexto}>{error}</Text>
          </View>
        )}

        {cargando ? (
          <View style={styles.estado}>
            <ActivityIndicator color={colors.terracota} />
            <Text style={styles.estadoTexto}>Cargando clientes...</Text>
          </View>
        ) : (
          <FlatList
            data={clientes}
            keyExtractor={cliente => String(cliente.id)}
            contentContainerStyle={clientes.length === 0 ? styles.listaVacia : styles.lista}
            refreshControl={
              <RefreshControl refreshing={refrescando} onRefresh={() => cargarClientes(true)} />
            }
            ListEmptyComponent={
              <View style={styles.estado}>
                <Text style={styles.estadoTitulo}>No hay clientes para mostrar</Text>
                <Text style={styles.estadoTexto}>
                  Cuando los usuarios se registren como clientes apareceran aqui.
                </Text>
              </View>
            }
            renderItem={({ item }) => <ClienteItem cliente={item} />}
          />
        )}
      </View>
    </SafeAreaView>
  )
}

function ClienteItem({ cliente }: { cliente: ClienteResumen }) {
  return (
    <View style={styles.tarjeta}>
      <View style={styles.filaPrincipal}>
        <View style={styles.identidad}>
          <Text style={styles.nombre}>{cliente.nombreCompleto}</Text>
          <Text style={styles.correo}>{cliente.correo}</Text>
        </View>
        <View style={styles.codigo}>
          <Text style={styles.codigoTexto}>#{cliente.id}</Text>
        </View>
      </View>

      <View style={styles.detalles}>
        <Dato etiqueta="Nacimiento" valor={cliente.fechaNacimiento} />
        <Dato etiqueta="Compras" valor={String(cliente.totalCompras)} />
        <Dato etiqueta="Total" valor={monedaCOP.format(cliente.totalGastado)} />
        <Dato etiqueta="Ultima compra" valor={formatearFecha(cliente.ultimaCompra)} />
      </View>
    </View>
  )
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <View style={styles.dato}>
      <Text style={styles.datoEtiqueta}>{etiqueta}</Text>
      <Text style={styles.datoValor}>{valor}</Text>
    </View>
  )
}

const totalGastado = (clientes: ClienteResumen[]) =>
  clientes.reduce((total, cliente) => total + cliente.totalGastado, 0)

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
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
    marginBottom: 18
  },
  sobretitulo: {
    fontSize: 13,
    fontFamily: fuentes.textoFuerte,
    color: colors.terracota,
    textTransform: 'uppercase'
  },
  titulo: {
    fontSize: 30,
    fontFamily: fuentes.textoFuerte,
    color: colors.tinta
  },
  resumen: {
    alignItems: 'flex-end'
  },
  resumenValor: {
    fontSize: 24,
    fontFamily: fuentes.textoFuerte,
    color: colors.tinta
  },
  resumenEtiqueta: {
    fontSize: 12,
    fontFamily: fuentes.textoMedio,
    color: colors.tintaSuave
  },
  buscador: {
    borderWidth: 1,
    borderColor: colors.borde,
    borderRadius: radios.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
    backgroundColor: colors.superficie,
    color: colors.tinta,
    fontFamily: fuentes.texto,
    fontSize: 15
  },
  indicadores: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14
  },
  indicador: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.borde,
    borderRadius: radios.md,
    padding: 14,
    backgroundColor: colors.superficie
  },
  indicadorValor: {
    fontSize: 18,
    fontFamily: fuentes.textoFuerte,
    color: colors.tinta
  },
  indicadorTexto: {
    marginTop: 4,
    fontSize: 12,
    fontFamily: fuentes.textoMedio,
    color: colors.tintaSuave
  },
  alerta: {
    borderRadius: radios.md,
    padding: 12,
    marginBottom: 12,
    backgroundColor: colors.ladrilloSuave
  },
  alertaTexto: {
    color: colors.ladrillo,
    fontFamily: fuentes.textoFuerte
  },
  lista: {
    paddingBottom: 24,
    gap: 12
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
  filaPrincipal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12
  },
  identidad: {
    flex: 1,
    gap: 4
  },
  nombre: {
    fontSize: 17,
    fontFamily: fuentes.textoFuerte,
    color: colors.tinta
  },
  correo: {
    fontSize: 14,
    fontFamily: fuentes.texto,
    color: colors.tintaSuave
  },
  codigo: {
    borderRadius: radios.sm,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: colors.terracotaSuave,
    alignSelf: 'flex-start'
  },
  codigoTexto: {
    color: colors.terracota,
    fontFamily: fuentes.textoFuerte
  },
  detalles: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 16
  },
  dato: {
    minWidth: '46%',
    flex: 1,
    gap: 2
  },
  datoEtiqueta: {
    fontSize: 12,
    fontFamily: fuentes.textoFuerte,
    color: colors.piedraTenue
  },
  datoValor: {
    fontSize: 14,
    fontFamily: fuentes.textoFuerte,
    color: colors.tinta
  },
  estado: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 28
  },
  estadoTitulo: {
    fontSize: 18,
    fontFamily: fuentes.textoFuerte,
    color: colors.tinta,
    textAlign: 'center'
  },
  estadoTexto: {
    fontFamily: fuentes.texto,
    fontSize: 14,
    lineHeight: 20,
    color: colors.tintaSuave,
    textAlign: 'center'
  }
})
