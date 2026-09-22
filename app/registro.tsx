import { router } from 'expo-router'
import { useSQLiteContext } from 'expo-sqlite'
import { useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import Boton from '../components/Boton'
import Aviso from '../components/Aviso'
import Campo from '../components/Campo'
import LayoutAuth from '../components/LayoutAuth'
import { correoRegistrado, crearCuentaPendiente } from '../db/login'
import { shared, tipo } from '../theme'

const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** HU-01 pide contrasena segura, no solo larga. */
function revisarPassword(password: string) {
  if (password.length < 8) return 'La contraseña debe tener al menos 8 caracteres.'
  if (!/[a-z]/.test(password)) return 'La contraseña debe incluir al menos una minúscula.'
  if (!/[A-Z]/.test(password)) return 'La contraseña debe incluir al menos una mayúscula.'
  if (!/\d/.test(password)) return 'La contraseña debe incluir al menos un número.'
  return ''
}

export default function Registro() {
  const db = useSQLiteContext()
  const [correo, setCorreo] = useState('')
  const [password, setPassword] = useState('')
  const [confirmacion, setConfirmacion] = useState('')
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [enviado, setEnviado] = useState(false)

  const crearCuenta = async () => {
    const correoLimpio = correo.trim().toLowerCase()

    if (!correoLimpio || !password || !confirmacion) {
      setError('Completa todos los campos.')
      return
    }
    if (!EMAIL_VALIDO.test(correoLimpio)) {
      setError('El correo no tiene un formato válido.')
      return
    }
    const fallaPassword = revisarPassword(password)
    if (fallaPassword) {
      setError(fallaPassword)
      return
    }
    if (password !== confirmacion) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setGuardando(true)
    setError('')

    try {
      if (await correoRegistrado(db, correoLimpio)) {
        setError('Ese correo ya está registrado.')
        return
      }

      await crearCuentaPendiente(db, correoLimpio, password)
      setEnviado(true)
    } catch (e) {
      setError(
        String(e).includes('UNIQUE')
          ? 'Ese correo ya está registrado.'
          : 'No se pudo crear la cuenta. Intenta de nuevo.'
      )
    } finally {
      setGuardando(false)
    }
  }

  if (enviado) {
    return (
      <LayoutAuth>
        <View style={shared.formulario}>
          <View style={shared.encabezado}>
            <Text style={tipo.titular}>Solicitud enviada</Text>
            <Text style={tipo.cuerpo}>
              Tu cuenta quedó registrada y está pendiente de aprobación. Un administrador debe
              activarla y asignarte un rol antes de que puedas iniciar sesión.
            </Text>
          </View>

          <Boton titulo="Volver al inicio de sesión" onPress={() => router.replace('/login')} />
        </View>
      </LayoutAuth>
    )
  }

  return (
    <LayoutAuth>
      <View style={shared.formulario}>
        <View style={shared.encabezado}>
          <Text style={tipo.titular}>Crear cuenta</Text>
          <Text style={tipo.cuerpo}>
            Un administrador revisará tu solicitud antes de darte acceso.
          </Text>
        </View>

        <Campo
          etiqueta="Correo"
          value={correo}
          onChangeText={setCorreo}
          placeholder="camilo@correo.com"
          keyboardType="email-address"
          autoComplete="email"
        />

        <Campo
          etiqueta="Contraseña"
          value={password}
          onChangeText={setPassword}
          placeholder="8 caracteres, mayúscula, minúscula y número"
          secureTextEntry
        />

        <Campo
          etiqueta="Confirmar contraseña"
          value={confirmacion}
          onChangeText={setConfirmacion}
          placeholder="Repite la contraseña"
          secureTextEntry
          onSubmitEditing={crearCuenta}
          returnKeyType="go"
        />

        <Aviso texto={error} />

        <Boton titulo={guardando ? 'Enviando…' : 'Solicitar acceso'} onPress={crearCuenta} />

        <View style={shared.pie}>
          <Text style={shared.pieTexto}>¿Ya tienes cuenta?</Text>
          <Pressable accessibilityRole="link" onPress={() => router.replace('/login')}>
            <Text style={shared.enlace}>Inicia sesión</Text>
          </Pressable>
        </View>
      </View>
    </LayoutAuth>
  )
}
