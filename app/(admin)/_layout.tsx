import { Tabs } from 'expo-router'
import { Guard } from '../../lib/guard'
import { colors } from '../../theme'

/** El menu vive aqui: aparece en todas las pantallas del administrador. */
export default function LayoutAdmin() {
  return (
    <Guard rol="administrador">
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
        <Tabs.Screen name="solicitudes" options={{ title: 'Solicitudes' }} />
        <Tabs.Screen name="productos" options={{ title: 'Productos' }} />
        <Tabs.Screen name="clientes" options={{ title: 'Clientes' }} />
        <Tabs.Screen name="compras" options={{ title: 'Compras' }} />
      </Tabs>
    </Guard>
  )
}
