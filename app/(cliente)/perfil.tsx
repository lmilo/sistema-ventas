import { useSQLiteContext } from 'expo-sqlite'
import { useCallback, useEffect, useState } from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import Boton from '../../components/Boton'
import Campo from '../../components/Campo'
import Cargando from '../../components/Cargando'
import Encabezado from '../../components/Encabezado'
import { actualizarCliente, obtenerClientePorLogin } from '../../db/clientes'
import type { Cliente } from '../../db/tipos'
import { useSesion } from '../../lib/sesion'
import { colors, radios, shared } from '../../theme'

const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const FECHA_VALIDA = /^\d{4}-\d{2}-\d{2}$/

/** HU-04: solo se muestran los datos del cliente autenticado. */
export default function Perfil() {
  const db = useSQLiteContext()
  const { cuenta } = useSesion()
  const [cliente, setCliente] = useState<Cliente | null>(null)
  const [nombre, setNombre] = useState('')
  const [nacimiento, setNacimiento] = useState('')
  const [correo, setCorreo] = useState('')
  const [error, setError] = useState('')
  const [aviso, setAviso] = useState('')
  const [guardando, setGuardando] = useState(false)

  const cargar = useCallback(async () => {
    if (!cuenta) return
    const fila = await obtenerClientePorLogin(db, cuenta.id)
    if (!fila) return
    setCliente(fila)
    setNombre(fila.nombreCompleto)
    setNacimiento(fila.fechaNacimiento)
    setCorreo(fila.correo)
  }, [db, cuenta])

  useEffect(() => {
    cargar()
  }, [cargar])

  const guardar = async () => {
    if (!cliente) return

    const nombreLimpio = nombre.trim()
    const correoLimpio = correo.trim().toLowerCase()

    if (!nombreLimpio || !nacimiento || !correoLimpio) {
      setError('Completa todos los campos.')
      setAviso('')
      return
    }
    if (!FECHA_VALIDA.test(nacimiento) || Number.isNaN(Date.parse(nacimiento))) {
      setError('La fecha de nacimiento debe tener el formato AAAA-MM-DD.')
      setAviso('')
      return
    }
    if (!EMAIL_VALIDO.test(correoLimpio)) {
      setError('El correo no tiene un formato válido.')
      setAviso('')
      return
    }

    setGuardando(true)
    setError('')

    try {
      await actualizarCliente(db, cliente.id, {
        nombreCompleto: nombreLimpio,
        fechaNacimiento: nacimiento,
        correo: correoLimpio
      })
      setAviso('Datos actualizados.')
      await cargar()
    } catch (e) {
      setError(
        String(e).includes('UNIQUE')
          ? 'Ese correo ya está usado por otro cliente.'
          : 'No se pudieron guardar los cambios.'
      )
    } finally {
      setGuardando(false)
    }
  }

  if (!cliente) return <Cargando />

  return (
    <View style={styles.raiz}>
      <Encabezado titulo="Mi perfil" bajada="Consulta y actualiza tus datos" />

      <ScrollView contentContainerStyle={styles.contenido} keyboardShouldPersistTaps="handled">
        <View style={styles.tarjeta}>
          <Campo
            etiqueta="Nombre completo"
            value={nombre}
            onChangeText={setNombre}
            autoCapitalize="words"
          />

          <Campo
            etiqueta="Fecha de nacimiento"
            value={nacimiento}
            onChangeText={setNacimiento}
            placeholder="1999-05-21"
            keyboardType="numbers-and-punctuation"
            maxLength={10}
          />

          <Campo
            etiqueta="Correo"
            value={correo}
            onChangeText={setCorreo}
            keyboardType="email-address"
          />

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

          <Boton titulo={guardando ? 'Guardando…' : 'Guardar cambios'} onPress={guardar} />
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
    padding: 20
  },
  tarjeta: {
    gap: 18,
    backgroundColor: colors.superficie,
    borderWidth: 1,
    borderColor: colors.borde,
    borderRadius: radios.lg,
    padding: 20
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
