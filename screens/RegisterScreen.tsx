import { useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import Boton from '../components/Boton'
import Campo from '../components/Campo'
import LayoutAuth from '../components/LayoutAuth'
import { shared } from '../theme'
import type { Usuario } from '../types'

type Props = {
  usuarios: Usuario[]
  onRegistrar: (usuario: Usuario) => void
  onIrALogin: () => void
}

const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function RegisterScreen({ usuarios, onRegistrar, onIrALogin }: Props) {
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmacion, setConfirmacion] = useState('')
  const [error, setError] = useState('')

  const crearCuenta = () => {
    const nombreLimpio = nombre.trim()
    const correo = email.trim().toLowerCase()

    if (!nombreLimpio || !correo || !password || !confirmacion) {
      setError('Completa todos los campos.')
      return
    }

    if (!EMAIL_VALIDO.test(correo)) {
      setError('El correo no tiene un formato válido.')
      return
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }

    if (password !== confirmacion) {
      setError('Las contraseñas no coinciden.')
      return
    }

    if (usuarios.some(item => item.email === correo)) {
      setError('Ese correo ya está registrado.')
      return
    }

    setError('')
    onRegistrar({ nombre: nombreLimpio, email: correo, password })
  }

  return (
    <LayoutAuth>
      <View style={shared.formulario}>
        <View style={shared.encabezado}>
          <Text style={shared.titulo}>Crear cuenta</Text>
          <Text style={shared.subtitulo}>Solo toma un momento y ya estás dentro.</Text>
        </View>

        <Campo
          etiqueta="Nombre"
          value={nombre}
          onChangeText={setNombre}
          placeholder="Camilo Rincón"
          autoCapitalize="words"
        />

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
          placeholder="Mínimo 6 caracteres"
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

        {error !== '' && (
          <View style={shared.alerta}>
            <View style={shared.alertaPunto} />
            <Text style={shared.alertaTexto}>{error}</Text>
          </View>
        )}

        <Boton titulo="Registrarme" onPress={crearCuenta} />

        <View style={shared.pie}>
          <Text style={shared.pieTexto}>¿Ya tienes cuenta?</Text>
          <Pressable accessibilityRole="link" onPress={onIrALogin}>
            <Text style={shared.enlace}>Inicia sesión</Text>
          </Pressable>
        </View>
      </View>
    </LayoutAuth>
  )
}
