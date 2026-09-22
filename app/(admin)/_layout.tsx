import Feather from '@expo/vector-icons/Feather'
import { Tabs } from 'expo-router'
import { Guard } from '../../lib/guard'
import { colors, fuentes } from '../../theme'

type Icono = keyof typeof Feather.glyphMap

const PESTANAS: { nombre: string; titulo: string; icono: Icono }[] = [
  { nombre: 'inicio', titulo: 'Resumen', icono: 'bar-chart-2' },
  { nombre: 'solicitudes', titulo: 'Solicitudes', icono: 'user-plus' },
  { nombre: 'productos', titulo: 'Productos', icono: 'box' },
  { nombre: 'clientes', titulo: 'Clientes', icono: 'users' },
  { nombre: 'compras', titulo: 'Compras', icono: 'shopping-bag' }
]

/** El menu vive aqui: aparece en todas las pantallas del administrador. */
export default function LayoutAdmin() {
  return (
    <Guard rol="administrador">
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.terracota,
          tabBarInactiveTintColor: colors.piedraTenue,
          tabBarStyle: {
            backgroundColor: colors.superficie,
            borderTopColor: colors.borde,
            height: 62,
            paddingTop: 6,
            paddingBottom: 8
          },
          tabBarLabelStyle: { fontFamily: fuentes.textoMedio, fontSize: 10.5, letterSpacing: 0.2 }
        }}
      >
        {PESTANAS.map(pestana => (
          <Tabs.Screen
            key={pestana.nombre}
            name={pestana.nombre}
            options={{
              title: pestana.titulo,
              tabBarIcon: ({ color, focused }) => (
                <Feather name={pestana.icono} size={focused ? 21 : 19} color={color} />
              )
            }}
          />
        ))}
      </Tabs>
    </Guard>
  )
}
