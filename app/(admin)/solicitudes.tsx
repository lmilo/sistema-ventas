import { useFocusEffect } from 'expo-router'
import { useSQLiteContext } from 'expo-sqlite'
import { useCallback, useState } from 'react'
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native'
import Cargando from '../../components/Cargando'
import Encabezado from '../../components/Encabezado'
import { aprobarCuenta, listarSolicitudes } from '../../db/login'
import type { RolUsuario, Solicitud } from '../../db/tipos'
import { fechaLegible } from '../../lib/moneda'
import { colors, radios, shared } from '../../theme'

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

      {error !== '' && (
        <View style={[shared.alerta, styles.margen]}>
          <View style={shared.alertaPunto} />
          <Text style={shared.alertaTexto}>{error}</Text>
        </View>
      )}

      {aviso !== '' && (
        <View style={[styles.exito, styles.margen]}>
          <Text style={styles.exitoTexto}>{aviso}</Text>
        </View>
      )}

      <FlatList
        data={solicitudes}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={styles.lista}
        ListEmptyComponent={
          <View style={styles.vacio}>
            <Text style={styles.vacioTitulo}>No hay solicitudes pendientes</Text>
            <Text style={styles.vacioTexto}>
              Cuando alguien se registre, aparecerá aquí para que le asignes un rol.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.tarjeta}>
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
          </View>
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
    gap: 14,
    backgroundColor: colors.superficie,
    borderWidth: 1,
    borderColor: colors.borde,
    borderRadius: radios.lg,
    padding: 16
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
