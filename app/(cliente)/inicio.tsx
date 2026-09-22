import Feather from '@expo/vector-icons/Feather'
import { router, useFocusEffect } from 'expo-router'
import { useSQLiteContext } from 'expo-sqlite'
import { useCallback, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import Cargando from '../../components/Cargando'
import Encabezado from '../../components/Encabezado'
import Tarjeta from '../../components/Tarjeta'
import { obtenerClientePorLogin } from '../../db/clientes'
import { comprasDeCliente } from '../../db/compras'
import type { Cliente, CompraResumen } from '../../db/tipos'
import { fechaLegible, pesos } from '../../lib/moneda'
import { useSesion } from '../../lib/sesion'
import { colors, espacio, fuentes, radios, tipo } from '../../theme'

export default function InicioCliente() {
  const db = useSQLiteContext()
  const { cuenta } = useSesion()
  const [cliente, setCliente] = useState<Cliente | null>(null)
  const [compras, setCompras] = useState<CompraResumen[]>([])

  useFocusEffect(
    useCallback(() => {
      if (!cuenta) return
      obtenerClientePorLogin(db, cuenta.id).then(async fila => {
        setCliente(fila)
        if (fila) setCompras(await comprasDeCliente(db, fila.id))
      })
    }, [db, cuenta])
  )

  if (!cliente) return <Cargando />

  const gastado = compras.reduce((suma, compra) => suma + compra.total, 0)
  const nombre = cliente.nombreCompleto.split(' ')[0]

  return (
    <View style={styles.raiz}>
      <Encabezado titulo={`Hola, ${nombre}`} bajada="Bienvenido al sistema" />

      <ScrollView contentContainerStyle={styles.contenido}>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/(cliente)/comprar')}
          style={({ pressed }) => [styles.accion, pressed && styles.presionado]}
        >
          <View style={styles.accionTextos}>
            <Text style={styles.accionSobre}>Empezar</Text>
            <Text style={styles.accionTitulo}>Hacer una compra</Text>
            <Text style={styles.accionTexto}>Revisa el catálogo y elige tus productos.</Text>
          </View>
          <View style={styles.accionIcono}>
            <Feather name="arrow-up-right" size={20} color={colors.terracota} />
          </View>
        </Pressable>

        <View style={styles.cifras}>
          <Tarjeta style={styles.cifra}>
            <Text style={tipo.menudo}>Compras</Text>
            <Text style={styles.cifraValor}>{compras.length}</Text>
          </Tarjeta>
          <Tarjeta destacada style={styles.cifra}>
            <Text style={tipo.menudo}>Total gastado</Text>
            <Text style={styles.cifraValor}>{pesos(gastado)}</Text>
          </Tarjeta>
        </View>

        {compras.length > 0 && (
          <Tarjeta style={styles.seccion}>
            <Text style={tipo.sobretitulo}>Última compra</Text>
            <View style={styles.ultima}>
              <View style={styles.ultimaTextos}>
                <Text style={tipo.cuerpoFuerte}>Compra #{compras[0].id}</Text>
                <Text style={tipo.menudo}>{fechaLegible(compras[0].fechaVenta)}</Text>
              </View>
              <Text style={styles.ultimaValor}>{pesos(compras[0].total)}</Text>
            </View>

            <Pressable
              accessibilityRole="link"
              onPress={() => router.push('/(cliente)/mis-compras')}
              style={({ pressed }) => [styles.verTodas, pressed && styles.presionado]}
            >
              <Text style={styles.verTodasTexto}>Ver todas mis compras</Text>
              <Feather name="arrow-right" size={14} color={colors.terracota} />
            </Pressable>
          </Tarjeta>
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  raiz: {
    flex: 1,
    backgroundColor: colors.fondo
  },
  contenido: {
    padding: espacio.xl,
    paddingTop: espacio.lg,
    gap: espacio.md
  },
  accion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacio.lg,
    backgroundColor: colors.tinta,
    borderRadius: radios.lg,
    padding: espacio.xl
  },
  presionado: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }]
  },
  accionTextos: {
    flex: 1,
    gap: 3
  },
  accionSobre: {
    fontFamily: fuentes.textoFuerte,
    fontSize: 11,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: '#e7a07a'
  },
  accionTitulo: {
    fontFamily: fuentes.displayFuerte,
    fontSize: 22,
    letterSpacing: -0.4,
    color: '#fff7ed'
  },
  accionTexto: {
    fontFamily: fuentes.texto,
    fontSize: 13.5,
    color: '#c7c0b8'
  },
  accionIcono: {
    width: 42,
    height: 42,
    borderRadius: radios.pildora,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff7ed'
  },
  cifras: {
    flexDirection: 'row',
    gap: espacio.md
  },
  cifra: {
    flex: 1,
    gap: 4
  },
  cifraValor: {
    fontFamily: fuentes.displayFuerte,
    fontSize: 21,
    letterSpacing: -0.5,
    color: colors.tinta,
    fontVariant: ['tabular-nums']
  },
  seccion: {
    gap: espacio.md
  },
  ultima: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: espacio.md
  },
  ultimaTextos: {
    flex: 1,
    gap: 2
  },
  ultimaValor: {
    fontFamily: fuentes.displayFuerte,
    fontSize: 17,
    color: colors.tinta,
    fontVariant: ['tabular-nums']
  },
  verTodas: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: espacio.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borde
  },
  verTodasTexto: {
    fontFamily: fuentes.textoFuerte,
    fontSize: 13,
    color: colors.terracota
  }
})
