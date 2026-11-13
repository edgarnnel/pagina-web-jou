# Guardar reservaciones en Google Sheets

Cada vez que alguien presione **"Enviar Reservación por WhatsApp"**, sus datos se guardarán como una fila nueva en una hoja de cálculo de Google, además de abrirse WhatsApp como siempre.

Tiempo estimado: 5–10 minutos.

---

## Paso 1 — Crear la hoja de cálculo

1. Inicia sesión en Google con la cuenta **nueva** del estudio.
2. Ve a <https://sheets.new> (crea una hoja en blanco).
3. Ponle nombre arriba a la izquierda, por ejemplo: **Reservaciones Jou Flores**.

> No hace falta crear columnas: el script crea la pestaña "Reservaciones" con sus encabezados la primera vez que llegue una reserva.

## Paso 2 — Pegar el código

1. En la hoja, menú **Extensiones → Apps Script**.
2. Se abre un editor con un archivo `Código.gs` que tiene un poco de código. **Borra todo** lo que haya.
3. Abre el archivo `Codigo.gs` de esta carpeta, copia **todo** su contenido y pégalo en el editor.
4. Presiona el ícono de guardar 💾 (o `Cmd + S`).
5. Arriba, cambia el nombre del proyecto de "Proyecto sin título" a **Receptor de reservaciones**.

## Paso 3 — Publicar como aplicación web

1. Botón azul **Implementar → Nueva implementación**.
2. Junto a "Seleccionar tipo", haz clic en el engranaje ⚙️ y elige **Aplicación web**.
3. Completa así:
   - **Descripción:** Reservaciones sitio web
   - **Ejecutar como:** **Yo** (tu correo nuevo)
   - **Quién tiene acceso:** **Cualquier usuario**
4. Presiona **Implementar**.
5. Google pedirá permisos:
   - **Autorizar acceso** → elige la cuenta nueva.
   - Si aparece "Google no verificó esta app": haz clic en **Configuración avanzada** → **Ir a Receptor de reservaciones (no seguro)** → **Permitir**.
     (Es normal: la app la creaste tú y solo escribe en tu propia hoja.)
6. Copia la **URL de la aplicación web**. Termina en `/exec` y se ve así:
   `https://script.google.com/macros/s/AKfycb.../exec`

**Comprobación:** pega esa URL en el navegador. Debe decir *"El receptor de reservaciones está funcionando."*

## Paso 4 — Conectar el sitio web

1. Abre `script.js` (en la carpeta principal del sitio).
2. En la línea 3 verás:
   ```js
   const URL_GOOGLE_SHEETS = '';
   ```
3. Pega tu URL entre las comillas:
   ```js
   const URL_GOOGLE_SHEETS = 'https://script.google.com/macros/s/AKfycb.../exec';
   ```
4. Guarda el archivo.

(O mándale la URL a Claude y lo hace por ti.)

## Paso 5 — Probar

1. Abre `index.html` en el navegador.
2. Llena el formulario de reservación y envíalo.
3. Revisa la hoja: debe aparecer la pestaña **Reservaciones** con una fila nueva.

La columna **Estado** empieza en "Pendiente"; puedes cambiarla a "Confirmada", "Cancelada", etc.

---

## Preguntas frecuentes

**¿Si cambio el código de `Codigo.gs` después?**
Hay que volver a publicar: **Implementar → Administrar implementaciones → ✏️ Editar → Versión: Nueva versión → Implementar**. Así la URL no cambia.

**¿Quién puede ver la hoja?**
Solo tú (y a quien compartas la hoja). "Cualquier usuario" en el paso 3 solo significa que el sitio web puede *enviar* datos, no leerlos.
La hoja contiene nombres y teléfonos de clientas: **no la compartas con enlace público**.

**¿Qué pasa si falla Google?**
WhatsApp se abre de todas formas; la reserva nunca se pierde por eso.

**¿Y el spam?**
El formulario tiene un campo oculto que solo los bots llenan; esas solicitudes se descartan automáticamente.
