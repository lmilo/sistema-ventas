import { useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import Boton from '../components/Boton'
import Campo from '../components/Campo'
import LayoutAuth from '../components/LayoutAuth'
import { shared } from '../theme'
import type { Usuario } from '../types'

type Props = {
  usuarios: Usuario[]
  onLogin: (usuario: Usuario) => void
  onIrARegistro: () => void
}

export default function LoginScreen({ usuarios, onLogin, onIrARegistro }: Props) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const entrar = () => {
    const correo = email.trim().toLowerCase()

    if (!correo || !password) {
      setError('Ingresa tu correo y tu contraseña.')
      return
    }

    const usuario = usuarios.find(item => item.email === correo && item.password === password)

    if (!usuario) {
      setError('Correo o contraseña incorrectos.')
      return
    }

    setError('')
    setPassword('')
    onLogin(usuario)
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
          value={email}
          onChangeText={setEmail}
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

        {error !== '' && (
          <View style={shared.alerta}>
            <View style={shared.alertaPunto} />
            <Text style={shared.alertaTexto}>{error}</Text>
          </View>
        )}

        <Boton titulo="Entrar" onPress={entrar} />

        <View style={shared.pie}>
          <Text style={shared.pieTexto}>¿No tienes cuenta?</Text>
          <Pressable accessibilityRole="link" onPress={onIrARegistro}>
            <Text style={shared.enlace}>Regístrate</Text>
          </Pressable>
        </View>
      </View>
    </LayoutAuth>
  )
}
