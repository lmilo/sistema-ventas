import { Platform, StyleSheet, Text, View } from 'react-native'
import Boton from '../components/Boton'
import Logo from '../components/Logo'
import { colors, radios } from '../theme'
import type { Usuario } from '../types'

type Props = {
  usuario: Usuario
  onCerrarSesion: () => void
}

const iniciales = (nombre: string) =>
  nombre
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(parte => parte[0].toUpperCase())
    .join('')

export default function HomeScreen({ usuario, onCerrarSesion }: Props) {
  return (
    <View style={styles.raiz}>
      <View style={styles.barra}>
        <Logo tono="oscuro" />
        <View style={styles.accionBarra}>
          <Boton titulo="Cerrar sesión" variante="fantasma" onPress={onCerrarSesion} />
        </View>
      </View>

      <View style={styles.centro}>
        <View style={styles.contenido}>
          <View style={styles.avatar}>
            <Text style={styles.avatarTexto}>{iniciales(usuario.nombre)}</Text>
          </View>

          <View style={styles.saludo}>
            <Text style={styles.titulo}>Hola {usuario.nombre}</Text>
            <Text style={styles.bajada}>Bienvenido al sistema.</Text>
          </View>

          <View style={styles.credencial}>
            <Text style={styles.credencialEtiqueta}>Sesión activa</Text>
            <Text style={styles.credencialValor}>{usuario.email}</Text>
          </View>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  raiz: {
    flex: 1,
    backgroundColor: colors.fondo
  },
  barra: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'web' ? 20 : 52,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borde,
    backgroundColor: colors.superficie
  },
  accionBarra: {
    minWidth: 140
  },
  centro: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24
  },
  contenido: {
    alignItems: 'center',
    gap: 24,
    width: '100%',
    maxWidth: 420
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.acentoSuave,
    alignItems: 'center',
    justifyContent: 'center'
  },
  avatarTexto: {
    fontWeight: '600',
    fontSize: 26,
    letterSpacing: -0.5,
    color: colors.acento
  },
  saludo: {
    alignItems: 'center',
    gap: 8
  },
  titulo: {
    fontWeight: '700',
    fontSize: 32,
    letterSpacing: -0.8,
    color: colors.tinta,
    textAlign: 'center'
  },
  bajada: {
    fontWeight: '400',
    fontSize: 16,
    color: colors.tintaSuave,
    textAlign: 'center'
  },
  credencial: {
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.superficie,
    borderWidth: 1,
    borderColor: colors.borde,
    borderRadius: radios.lg,
    paddingVertical: 16,
    paddingHorizontal: 24,
    width: '100%'
  },
  credencialEtiqueta: {
    fontWeight: '500',
    fontSize: 12,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: colors.tintaTenue
  },
  credencialValor: {
    fontWeight: '500',
    fontSize: 15,
    color: colors.tinta
  }
})
