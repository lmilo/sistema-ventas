import * as Print from 'expo-print'
import { isAvailableAsync, shareAsync } from 'expo-sharing'
import type { CompraCompleta } from '../db/tipos'
import { fechaLegible, pesos } from './moneda'

const escapar = (texto: string) =>
  texto.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

function armarHtml(compra: CompraCompleta) {
  const filas = compra.detalles
    .map(
      linea => `
        <tr>
          <td>${escapar(linea.nombreProducto)}</td>
          <td class="num">${linea.cantidad}</td>
          <td class="num">${pesos(linea.precioUnitario)}</td>
          <td class="num">${pesos(linea.subtotal)}</td>
        </tr>`
    )
    .join('')

  return `
    <html>
      <head><meta charset="utf-8" /></head>
      <body style="font-family: -apple-system, Helvetica, sans-serif; color: #0f172a; padding: 32px;">
        <h1 style="margin: 0; font-size: 26px; letter-spacing: -0.5px;">Factura #${compra.encabezado.id}</h1>
        <p style="margin: 6px 0 24px; color: #64748b; font-size: 14px;">
          ${escapar(compra.encabezado.nombreCliente)}<br />
          ${fechaLegible(compra.encabezado.fechaVenta)}
        </p>

        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <thead>
            <tr style="text-align: left; border-bottom: 2px solid #e2e8f0;">
              <th style="padding: 8px 0;">Producto</th>
              <th style="padding: 8px 0; text-align: right;">Cant.</th>
              <th style="padding: 8px 0; text-align: right;">Unitario</th>
              <th style="padding: 8px 0; text-align: right;">Subtotal</th>
            </tr>
          </thead>
          <tbody>${filas}</tbody>
        </table>

        <p style="margin-top: 24px; text-align: right; font-size: 20px; font-weight: 700;">
          Total: ${pesos(compra.encabezado.total)}
        </p>

        <style>
          td { padding: 8px 0; border-bottom: 1px solid #f1f5f9; }
          .num { text-align: right; }
        </style>
      </body>
    </html>
  `
}

/** C8: genera el PDF y abre el menu de compartir del sistema. */
export async function compartirFactura(compra: CompraCompleta) {
  const { uri } = await Print.printToFileAsync({ html: armarHtml(compra) })

  if (!(await isAvailableAsync())) {
    throw new Error('Este dispositivo no permite compartir archivos.')
  }

  await shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' })
}
