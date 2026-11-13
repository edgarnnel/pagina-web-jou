/**
 * Jou Flores Makeup Studio - Receptor de reservaciones
 *
 * Recibe los datos del formulario "Haz tu Reservación" del sitio web
 * y los guarda como una fila nueva en la hoja "Reservaciones".
 *
 * Pegar este código en: Hoja de cálculo > Extensiones > Apps Script
 */

const NOMBRE_HOJA = 'Reservaciones';
const ENCABEZADOS = ['Recibido', 'Nombre', 'Teléfono', 'Servicio', 'Personas', 'Fecha de cita', 'Hora preferida', 'Ciudad', 'Lugar', 'Detalles', 'Estado'];

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const p = (e && e.parameter) || {};

    // Campo trampa: los humanos no lo ven, los bots de spam sí lo llenan
    if (p.website) {
      return responder({ ok: true });
    }

    if (!p.nombre || !p.telefono || !p.servicio || !p.fecha) {
      return responder({ ok: false, error: 'Faltan datos' });
    }

    const hoja = obtenerHoja();
    hoja.appendRow([
      new Date(),
      limpiar(p.nombre, 80),
      limpiarTelefono(p.telefono),
      limpiar(p.servicio, 50),
      Math.min(Math.max(Number(p.cantidad) || 1, 1), 50),
      convertirFecha(p.fecha),
      limpiar(p.hora, 50),
      limpiar(p.ciudad, 50),
      limpiar(p.lugar, 50),
      limpiar(p.comentarios, 300),
      'Pendiente'
    ]);

    return responder({ ok: true });
  } catch (error) {
    return responder({ ok: false, error: String(error) });
  } finally {
    lock.releaseLock();
  }
}

// Permite comprobar que la aplicación web está publicada abriendo su URL en el navegador
function doGet() {
  return ContentService.createTextOutput('El receptor de reservaciones está funcionando.');
}

function obtenerHoja() {
  const libro = SpreadsheetApp.getActiveSpreadsheet();
  let hoja = libro.getSheetByName(NOMBRE_HOJA);

  if (!hoja) {
    hoja = libro.insertSheet(NOMBRE_HOJA);
    hoja.appendRow(ENCABEZADOS);
    hoja.setFrozenRows(1);
    hoja.getRange(1, 1, 1, ENCABEZADOS.length)
      .setFontWeight('bold')
      .setBackground('#9E5B68')
      .setFontColor('#FFFFFF');

    // Formatos por columna
    hoja.getRange('A:A').setNumberFormat('dd/mm/yyyy hh:mm');
    hoja.getRange('B:D').setNumberFormat('@'); // texto (evita que el teléfono se convierta en número)
    hoja.getRange('F:F').setNumberFormat('dd/mm/yyyy');
    hoja.getRange('G:K').setNumberFormat('@');
    hoja.setColumnWidths(1, ENCABEZADOS.length, 160);
    hoja.setColumnWidth(10, 300); // Detalles
  }

  return hoja;
}

// "2026-09-30" -> fecha real de Sheets (se puede ordenar y filtrar)
function convertirFecha(texto) {
  const partes = String(texto).split('-');
  if (partes.length !== 3) return limpiar(texto);
  return new Date(Number(partes[0]), Number(partes[1]) - 1, Number(partes[2]));
}

// Sanitiza cadenas: elimina caracteres de control y evita inyección de fórmulas (=, +, -, @)
function limpiar(valor, maximo) {
  let texto = String(valor || '').trim().slice(0, maximo || 200);
  // Eliminar caracteres de control invisibles o nulos
  texto = texto.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, '');
  if (/^[=+\-@]/.test(texto)) {
    texto = "'" + texto;
  }
  return texto;
}

// Sanitiza el teléfono permitiendo solo dígitos, guiones, espacios y signo +
function limpiarTelefono(valor) {
  const limpio = String(valor || '').replace(/[^\d+\- ()]/g, '').slice(0, 20).trim();
  if (/^[=+\-@]/.test(limpio)) {
    return "'" + limpio;
  }
  return limpio;
}

function responder(datos) {
  return ContentService
    .createTextOutput(JSON.stringify(datos))
    .setMimeType(ContentService.MimeType.JSON);
}
