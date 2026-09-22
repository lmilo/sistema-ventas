import { router } from 'expo-router'
import { useSQLiteContext } from 'expo-sqlite'
import { useState } from 'react'
import { Text, View } from 'react-native'
import Boton from '../components/Boton'
import Aviso from '../components/Aviso'
import Campo from '../components/Campo'
import LayoutAuth from '../components/LayoutAuth'
import { crearCliente } from '../db/clientes'
import { useSesion } from '../lib/sesion'
import { shared, tipo } from '../theme'

const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const FECHA_VALIDA = /^\d{4}-\d{2}-\d{2}$/

/** HU-03: primer ingreso del cliente. No hay forma de saltarse esta pantalla:
 *  `app/index.tsx` redirige aqui mientras no exista la fila en cliente. */
export default function CompletarPerfil() {
  const db = useSQLiteContext()
  const { cuenta } = useSesion()
  const [nombre, setNombre] = useState('')
  const [nacimiento, setNacimiento] = useState('')
  const [correo, setCorreo] = useState(cuenta?.correo ?? '')
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)

  const guardar = async () => {
    if (!cuenta) return

    const nombreLimpio = nombre.trim()
    const correoLimpio = correo.trim().toLowerCase()

    if (!nombreLimpio || !nacimiento || !correoLimpio) {
      setError('Completa todos los campos.')
      return
    }
    if (nombreLimpio.length < 3) {
      setError('El nombre completo debe tener al menos 3 caracteres.')
      return
    }
    if (!FECHA_VALIDA.test(nacimiento) || Number.isNaN(Date.parse(nacimiento))) {
      setError('La fecha de nacimiento debe tener el formato AAAA-MM-DD.')
      return
    }
    if (new Date(nacimiento) > new Date()) {
      setError('La fecha de nacimiento no puede estar en el futuro.')
      return
    }
    if (!EMAIL_VALIDO.test(correoLimpio)) {
      setError('El correo no tiene un formato válido.')
      return
    }

    setGuardando(true)
    setError('')

    try {
      await crearCliente(db, cuenta.id, {
        nombreCompleto: nombreLimpio,
        fechaNacimiento: nacimiento,
        correo: correoLimpio
      })
      router.replace('/(cliente)/inicio')
    } catch (e) {
      setError(
        String(e).includes('UNIQUE')
          ? 'Ese correo ya está usado por otro cliente.'
          : 'No se pudieron guardar tus datos. Intenta de nuevo.'
      )
    } finally {
      setGuardando(false)
    }
  }

  return (
    <LayoutAuth>
      <View style={shared.formulario}>
        <View style={shared.encabezado}>
          <Text style={tipo.titular}>Completa tu perfil</Text>
          <Text style={tipo.cuerpo}>
            Necesitamos tus datos personales antes de que puedas comprar.
          </Text>
        </View>

        <Campo
          etiqueta="Nombre completo"
          value={nombre}
          onChangeText={setNombre}
          placeholder="Camilo Rincón"
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
          placeholder="camilo@correo.com"
          keyboardType="email-address"
        />

        <Aviso texto={error} />

        <Boton titulo={guardando ? 'Guardando…' : 'Guardar y continuar'} onPress={guardar} />
      </View>
    </LayoutAuth>
  )
}
