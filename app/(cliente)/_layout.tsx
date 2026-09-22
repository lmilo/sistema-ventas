import { Tabs } from 'expo-router'
import { Guard } from '../../lib/guard'
import { colors } from '../../theme'

/** El menu vive aqui: aparece en todas las pantallas del cliente. */
export default function LayoutCliente() {
  return (
    <Guard rol="cliente">
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.acento,
          tabBarInactiveTintColor: colors.tintaTenue,
          tabBarStyle: { backgroundColor: colors.superficie, borderTopColor: colors.borde },
          tabBarLabelStyle: { fontSize: 11, fontWeight: '600' }
        }}
      >
        <Tabs.Screen name="inicio" options={{ title: 'Inicio' }} />
        <Tabs.Screen name="comprar" options={{ title: 'Comprar' }} />
        <Tabs.Screen name="mis-compras" options={{ title: 'Mis compras' }} />
        <Tabs.Screen name="perfil" options={{ title: 'Perfil' }} />
      </Tabs>
    </Guard>
  )
}
