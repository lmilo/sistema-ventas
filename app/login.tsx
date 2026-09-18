import { router } from 'expo-router'
import { useSQLiteContext } from 'expo-sqlite'
import { useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import Boton from '../components/Boton'
import Aviso from '../components/Aviso'
import Campo from '../components/Campo'
import LayoutAuth from '../components/LayoutAuth'
import { autenticar } from '../db/login'
import { useSesion } from '../lib/sesion'
import { shared } from '../theme'

const MENSAJES = {
  credenciales: 'Correo o contraseña incorrectos.',
  pendiente: 'Tu cuenta está pendiente de aprobación. Un administrador debe activarla antes de que puedas entrar.',
  inactivo: 'Tu cuenta fue desactivada. Comunícate con un administrador.'
}

export default function Login() {
  const db = useSQLiteContext()
  const { iniciar } = useSesion()
  const [correo, setCorreo] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [verificando, setVerificando] = useState(false)

  const entrar = async () => {
    if (!correo.trim() || !password) {
      setError('Ingresa tu correo y tu contraseña.')
      return
    }

    setVerificando(true)
    setError('')

    try {
      const resultado = await autenticar(db, correo, password)

      if (!resultado.ok) {
        setError(
          resultado.motivo === 'bloqueado'
            ? `Demasiados intentos fallidos. Espera ${resultado.minutos} minuto(s).`
            : MENSAJES[resultado.motivo]
        )
        return
      }

      setPassword('')
      await iniciar(resultado.cuenta)
      router.replace('/')
    } catch {
      setError('No se pudo verificar la cuenta. Intenta de nuevo.')
    } finally {
      setVerificando(false)
    }
  }

  return (
    <LayoutAuth>
      <View style={shared.formulario}>
        <View style={shared.encabezado}>
          <Text style={shared.titulo}>Iniciar sesión</Text>
          <Text style={shared.subtitulo}>Entra con la cuenta que registraste.</Text>
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
          placeholder="Tu contraseña"
          secureTextEntry
          onSubmitEditing={entrar}
          returnKeyType="go"
        />

        <Aviso texto={error} />

        <Boton titulo={verificando ? 'Verificando…' : 'Entrar'} onPress={entrar} />

        <View style={shared.pie}>
          <Text style={shared.pieTexto}>¿No tienes cuenta?</Text>
          <Pressable accessibilityRole="link" onPress={() => router.push('/registro')}>
            <Text style={shared.enlace}>Regístrate</Text>
          </Pressable>
        </View>
      </View>
    </LayoutAuth>
  )
}
