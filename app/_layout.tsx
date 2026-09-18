import { Slot } from 'expo-router'
import { SQLiteProvider } from 'expo-sqlite'
import { DATABASE_NAME, migrarBaseDeDatos } from '../db/esquema'

export default function RootLayout() {
  return (
    <SQLiteProvider databaseName={DATABASE_NAME} onInit={migrarBaseDeDatos}>
      <Slot />
    </SQLiteProvider>
  )
}
