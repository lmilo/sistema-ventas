import { StyleSheet } from 'react-native'

export const colors = {
  fondo: '#f8fafc',
  superficie: '#ffffff',
  tinta: '#0f172a',
  tintaSuave: '#64748b',
  tintaTenue: '#94a3b8',
  borde: '#e2e8f0',
  bordeFoco: '#6366f1',
  acento: '#6366f1',
  acentoSuave: '#eef2ff',
  error: '#dc2626',
  errorFondo: '#fef2f2'
}

export const radios = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24
}

export const shared = StyleSheet.create({
  formulario: {
    width: '100%',
    maxWidth: 400,
    gap: 20
  },
  encabezado: {
    gap: 8,
    marginBottom: 4
  },
  titulo: {
    fontWeight: '700',
    fontSize: 30,
    letterSpacing: -0.6,
    color: colors.tinta
  },
  subtitulo: {
    fontWeight: '400',
    fontSize: 15,
    lineHeight: 22,
    color: colors.tintaSuave
  },
  alerta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.errorFondo,
    borderRadius: radios.md,
    paddingVertical: 12,
    paddingHorizontal: 14
  },
  alertaPunto: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.error
  },
  alertaTexto: {
    flex: 1,
    fontWeight: '500',
    fontSize: 14,
    color: colors.error
  },
  pie: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4
  },
  pieTexto: {
    fontWeight: '400',
    fontSize: 14,
    color: colors.tintaSuave
  },
  enlace: {
    fontWeight: '600',
    fontSize: 14,
    color: colors.acento
  }
})
