// Subpaths, no el indice: importar del indice empaqueta las veinte variantes
// de cada familia y suma varios MB al bundle.
import { DMSans_400Regular } from '@expo-google-fonts/dm-sans/400Regular'
import { DMSans_500Medium } from '@expo-google-fonts/dm-sans/500Medium'
import { DMSans_700Bold } from '@expo-google-fonts/dm-sans/700Bold'
import { Fraunces_600SemiBold } from '@expo-google-fonts/fraunces/600SemiBold'
import { Fraunces_700Bold } from '@expo-google-fonts/fraunces/700Bold'
import { useFonts } from 'expo-font'
import { Stack } from 'expo-router'
import { SQLiteProvider } from 'expo-sqlite'
import { StatusBar } from 'expo-status-bar'
import { Suspense } from 'react'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import Cargando from '../components/Cargando'
import { DATABASE_NAME, migrarBaseDeDatos } from '../db/esquema'
import { SesionProvider } from '../lib/sesion'

export default function RootLayout() {
  const [fuentesListas] = useFonts({
    Fraunces_600SemiBold,
    Fraunces_700Bold,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_700Bold
  })

  if (!fuentesListas) return <Cargando />

  return (
    <SafeAreaProvider>
      <Suspense fallback={<Cargando />}>
        <SQLiteProvider databaseName={DATABASE_NAME} onInit={migrarBaseDeDatos} useSuspense>
          <SesionProvider>
            <Stack screenOptions={{ headerShown: false }} />
            <StatusBar style="dark" />
          </SesionProvider>
        </SQLiteProvider>
      </Suspense>
    </SafeAreaProvider>
  )
}
