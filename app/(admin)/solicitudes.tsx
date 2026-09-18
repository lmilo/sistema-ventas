import { useFocusEffect } from 'expo-router'
import { useSQLiteContext } from 'expo-sqlite'
import { useCallback, useState } from 'react'
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native'
import Aviso from '../../components/Aviso'
import Cargando from '../../components/Cargando'
import Encabezado from '../../components/Encabezado'
import EstadoVacio from '../../components/EstadoVacio'
import Tarjeta from '../../components/Tarjeta'
import { aprobarCuenta, listarSolicitudes } from '../../db/login'
import type { RolUsuario, Solicitud } from '../../db/tipos'
import { fechaLegible } from '../../lib/moneda'
import { colors, radios } from '../../theme'

/** HU-02: el administrador ve las solicitudes pendientes, asigna rol y activa. */
export default function Solicitudes() {
  const db = useSQLiteContext()
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [aviso, setAviso] = useState('')

  const cargar = useCallback(async () => {
    setSolicitudes(await listarSolicitudes(db))
    setCargando(false)
  }, [db])

  useFocusEffect(
    useCallback(() => {
      cargar()
    }, [cargar])
  )

  const aprobar = async (solicitud: Solicitud, rol: RolUsuario) => {
    try {
      await aprobarCuenta(db, solicitud.id, rol)
      setAviso(`${solicitud.correo} activado como ${rol}.`)
      setError('')
      await cargar()
    } catch {
      setError('No se pudo activar la cuenta.')
    }
  }

  if (cargando) return <Cargando />

  return (
    <View style={styles.raiz}>
      <Encabezado
        titulo="Solicitudes"
        bajada={`${solicitudes.length} cuenta(s) esperando aprobación`}
      />

      <View style={styles.margen}>
        <Aviso texto={error} />
        <Aviso texto={aviso} tono="exito" />
      </View>

      <FlatList
        data={solicitudes}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={styles.lista}
        ListEmptyComponent={
          <EstadoVacio
            titulo="No hay solicitudes pendientes"
            texto="Cuando alguien se registre, aparecerá aquí para que le asignes un rol."
          />
        }
        renderItem={({ item }) => (
          <Tarjeta style={styles.tarjeta}>
            <View style={styles.datos}>
              <Text style={styles.correo}>{item.correo}</Text>
              <Text style={styles.fecha}>Solicitó el {fechaLegible(item.creadoEn)}</Text>
            </View>

            <View style={styles.acciones}>
              <Pressable
                accessibilityRole="button"
                style={[styles.boton, styles.botonCliente]}
                onPress={() => aprobar(item, 'cliente')}
              >
                <Text style={styles.botonClienteTexto}>Activar como cliente</Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                style={[styles.boton, styles.botonAdmin]}
                onPress={() => aprobar(item, 'administrador')}
              >
                <Text style={styles.botonAdminTexto}>Activar como admin</Text>
              </Pressable>
            </View>
          </Tarjeta>
        )}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  raiz: {
    flex: 1,
    backgroundColor: colors.fondo
  },
  margen: {
    marginHorizontal: 16,
    marginTop: 12
  },
  lista: {
    padding: 16,
    gap: 12
  },
  tarjeta: {
    gap: 14
  },
  datos: {
    gap: 3
  },
  correo: {
    fontWeight: '600',
    fontSize: 16,
    color: colors.tinta
  },
  fecha: {
    fontSize: 13,
    color: colors.tintaSuave
  },
  acciones: {
    flexDirection: 'row',
    gap: 10
  },
  boton: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: radios.md,
    alignItems: 'center'
  },
  botonCliente: {
    backgroundColor: colors.acentoSuave
  },
  botonClienteTexto: {
    fontWeight: '600',
    fontSize: 13,
    color: colors.acento
  },
  botonAdmin: {
    backgroundColor: colors.tinta
  },
  botonAdminTexto: {
    fontWeight: '600',
    fontSize: 13,
    color: '#ffffff'
  }
})
