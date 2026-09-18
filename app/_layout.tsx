import { Stack } from 'expo-router'
import { SQLiteProvider } from 'expo-sqlite'
import { StatusBar } from 'expo-status-bar'
import { Suspense } from 'react'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import Cargando from '../components/Cargando'
import { DATABASE_NAME, migrarBaseDeDatos } from '../db/esquema'
import { SesionProvider } from '../lib/sesion'

export default function RootLayout() {
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
