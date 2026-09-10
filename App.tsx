import { StatusBar } from 'expo-status-bar'
import { useState } from 'react'
import { KeyboardAvoidingView, Platform, StyleSheet } from 'react-native'
import HomeScreen from './screens/HomeScreen'
import LoginScreen from './screens/LoginScreen'
import RegisterScreen from './screens/RegisterScreen'
import { colors } from './theme'
import type { Usuario } from './types'

type Pantalla = 'login' | 'registro'

export default function App() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [pantalla, setPantalla] = useState<Pantalla>('login')
  const [sesion, setSesion] = useState<Usuario | null>(null)

  const registrar = (usuario: Usuario) => {
    setUsuarios(prev => [...prev, usuario])
    setSesion(usuario)
  }

  const cerrarSesion = () => {
    setSesion(null)
    setPantalla('login')
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {sesion ? (
        <HomeScreen usuario={sesion} onCerrarSesion={cerrarSesion} />
      ) : pantalla === 'login' ? (
        <LoginScreen
          usuarios={usuarios}
          onLogin={setSesion}
          onIrARegistro={() => setPantalla('registro')}
        />
      ) : (
        <RegisterScreen
          usuarios={usuarios}
          onRegistrar={registrar}
          onIrALogin={() => setPantalla('login')}
        />
      )}
      <StatusBar style={sesion ? 'dark' : 'auto'} />
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.superficie
  }
})
