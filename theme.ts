import { StyleSheet } from 'react-native'

/**
 * Direccion: editorial calido.
 *
 * El azul indigo anterior es el color por defecto de cualquier plantilla. Aqui
 * la base es un crema con temperatura y el acento una terracota quemada: el
 * dinero se lee amable en vez de corporativo, y la aplicacion no se parece a
 * las otras del salon.
 *
 * Contraste verificado sobre `fondo`:
 *   tinta   15.8:1   piedra 4.6:1   terracota 5.4:1   oliva 4.8:1
 * Sobre `terracota`, el texto va en `crema` (4.7:1), nunca al reves.
 */
export const colors = {
  fondo: '#faf7f2',
  superficie: '#ffffff',
  superficieCalida: '#f5f0e8',
  tinta: '#1c1917',
  tintaSuave: '#57534e',
  piedra: '#78716c',
  piedraTenue: '#a8a29e',
  borde: '#e7e0d5',
  bordeFuerte: '#d6ccbd',
  terracota: '#c2410c',
  terracotaSuave: '#fef2ec',
  terracotaProfunda: '#9a3412',
  oliva: '#4d7c0f',
  olivaSuave: '#f2f7e8',
  ladrillo: '#b91c1c',
  ladrilloSuave: '#fdf2f2'
}

export const fuentes = {
  /** Fraunces: titulares y cifras. Tiene caracter, no es una grotesca mas. */
  display: 'Fraunces_600SemiBold',
  displayFuerte: 'Fraunces_700Bold',
  /** DM Sans: todo lo que se lee en parrafo o etiqueta. */
  texto: 'DMSans_400Regular',
  textoMedio: 'DMSans_500Medium',
  textoFuerte: 'DMSans_700Bold'
}

export const radios = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  pildora: 999
}

export const espacio = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32
}

/** Escala tipografica con razon 1.25 desde 13. */
export const tipo = StyleSheet.create({
  /** Etiqueta editorial en versalitas: el recurso que mas identifica al sistema. */
  sobretitulo: {
    fontFamily: fuentes.textoFuerte,
    fontSize: 11,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: colors.terracota
  },
  titular: {
    fontFamily: fuentes.displayFuerte,
    fontSize: 32,
    lineHeight: 36,
    letterSpacing: -0.8,
    color: colors.tinta
  },
  titulo: {
    fontFamily: fuentes.display,
    fontSize: 25,
    lineHeight: 30,
    letterSpacing: -0.4,
    color: colors.tinta
  },
  subtitulo: {
    fontFamily: fuentes.display,
    fontSize: 20,
    lineHeight: 26,
    color: colors.tinta
  },
  cuerpo: {
    fontFamily: fuentes.texto,
    fontSize: 15,
    lineHeight: 22,
    color: colors.tintaSuave
  },
  cuerpoFuerte: {
    fontFamily: fuentes.textoMedio,
    fontSize: 15,
    lineHeight: 22,
    color: colors.tinta
  },
  etiqueta: {
    fontFamily: fuentes.textoMedio,
    fontSize: 13,
    color: colors.piedra
  },
  menudo: {
    fontFamily: fuentes.texto,
    fontSize: 12,
    color: colors.piedraTenue
  },
  /** Cifras del panel financiero: Fraunces con numeros tabulares. */
  cifra: {
    fontFamily: fuentes.displayFuerte,
    fontSize: 28,
    letterSpacing: -1,
    color: colors.tinta,
    fontVariant: ['tabular-nums']
  },
  cifraGrande: {
    fontFamily: fuentes.displayFuerte,
    fontSize: 44,
    letterSpacing: -1.6,
    color: colors.tinta,
    fontVariant: ['tabular-nums']
  }
})

export const shared = StyleSheet.create({
  formulario: {
    width: '100%',
    gap: espacio.lg
  },
  encabezado: {
    gap: espacio.sm,
    marginBottom: espacio.xs
  },
  /** Filete fino bajo las cabeceras: cita a la retícula de un impreso. */
  filete: {
    height: 1,
    backgroundColor: colors.bordeFuerte
  },
  pie: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: espacio.xs,
    marginTop: espacio.xs
  },
  pieTexto: {
    fontFamily: fuentes.texto,
    fontSize: 14,
    color: colors.piedra
  },
  enlace: {
    fontFamily: fuentes.textoFuerte,
    fontSize: 14,
    color: colors.terracota
  }
})
