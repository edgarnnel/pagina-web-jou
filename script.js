// URL de la aplicación web de Google Apps Script (ver google-apps-script/INSTRUCCIONES.md).
// Mientras esté vacía, las reservaciones solo se envían por WhatsApp.
const URL_GOOGLE_SHEETS = 'https://script.google.com/macros/s/AKfycbx5kSRFA7R9Toat2PAgxWvENBU-DcQZDX2UNq2fCW07XWvAJXFizSXQDrmgpuhpjk0h7Q/exec';

// Fotos de "Nuestros Trabajos" y de las tarjetas de servicios.
// Para agregar fotos: guárdalas en images/trabajos/ con el nombre del trabajo y un número seguido:
//   novia-1.jpg, novia-2.jpg…  social-1.jpg…  artistico-1.jpg…  masterclass-1.jpg…
// La galería las encuentra sola. Las fotos de estas listas son de ejemplo y solo se muestran
// mientras ese trabajo no tenga fotos numeradas.
const TRABAJOS = {
  novia: {
    titulo: 'Maquillaje de Novia',
    fotos: [
      'images/makeup_bridal_1790376876556.jpg'
    ]
  },
  social: {
    titulo: 'Maquillaje Social',
    fotos: [
      'images/makeup_social_1790376866896.jpg'
    ]
  },
  artistico: {
    titulo: 'Maquillaje Artístico',
    fotos: [
      'images/makeup_artistic_1790376885514.jpg'
    ]
  },
  masterclass: {
    titulo: 'Automaquillaje Masterclass',
    fotos: []
  }
};

document.addEventListener('DOMContentLoaded', function() {

  // 1. Observador de Intersección para animaciones al hacer scroll
  const opcionesObs = {
    threshold: 0.15,
    rootMargin: '0px 0px -50px 0px'
  };

  const observador = new IntersectionObserver(function(entradas, obs) {
    entradas.forEach(function(entrada) {
      if (entrada.isIntersecting) {
        entrada.target.classList.add('visible');
        obs.unobserve(entrada.target);
      }
    });
  }, opcionesObs);

  const elementosAnimar = document.querySelectorAll('.servicio-card, .galeria-item, .section-header, .reservacion-info, .reservacion-form-box, .contacto-content, .scroll-animate');
  elementosAnimar.forEach(function(el) {
    observador.observe(el);
  });

  // 2. Menú Hamburguesa Móvil
  const hamburgerBtn = document.getElementById('hamburger-btn');
  const navLinks = document.getElementById('nav-links');

  if (hamburgerBtn && navLinks) {
    hamburgerBtn.addEventListener('click', function() {
      const abierto = navLinks.classList.toggle('active');
      hamburgerBtn.setAttribute('aria-expanded', abierto);
      hamburgerBtn.setAttribute('aria-label', abierto ? 'Cerrar Menú' : 'Abrir Menú');
    });

    // Cerrar menú al hacer clic en un enlace
    document.querySelectorAll('.nav-links a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('active');
        hamburgerBtn.setAttribute('aria-expanded', 'false');
        hamburgerBtn.setAttribute('aria-label', 'Abrir Menú');
      });
    });
  }

  // 3. Poblar Selector de Cantidad de Personas
  const selectCantidad = document.getElementById('numero-servicios');
  if (selectCantidad) {
    for (let i = 1; i <= 15; i++) {
      const opcion = document.createElement('option');
      opcion.value = i;
      opcion.textContent = i === 1 ? '1 persona' : `${i} personas`;
      selectCantidad.appendChild(opcion);
    }
  }

  // 4. Actualización en tiempo real del Cuadro de Resumen de Cita
  const formReservacion = document.getElementById('form-reservacion');
  const inputFecha = document.getElementById('fecha');
  const selectServicio = document.getElementById('servicio');
  const selectHora = document.getElementById('hora');
  const prevServicio = document.getElementById('prev-servicio');
  const prevFecha = document.getElementById('prev-fecha');
  const prevCantidad = document.getElementById('prev-cantidad');
  const prevHora = document.getElementById('prev-hora');
  const prevLugar = document.getElementById('prev-lugar');

  function formatearFecha(valor) {
    const [year, month, day] = valor.split('-');
    return `${day}/${month}/${year}`;
  }

  function lugarElegido() {
    const opcion = document.querySelector('input[name="lugar"]:checked');
    return opcion ? opcion.value : 'En el estudio';
  }

  function actualizarResumen() {
    if (prevServicio) prevServicio.textContent = selectServicio.value || 'Por seleccionar';
    if (prevFecha) prevFecha.textContent = inputFecha.value ? formatearFecha(inputFecha.value) : 'Por seleccionar';
    if (prevCantidad) prevCantidad.textContent = selectCantidad.value ? `${selectCantidad.value} persona(s)` : '-';
    if (prevHora) prevHora.textContent = selectHora.value ? selectHora.value.split(' (')[0] : 'Por seleccionar';
    if (prevLugar) prevLugar.textContent = lugarElegido();
  }

  if (formReservacion) {
    formReservacion.addEventListener('change', actualizarResumen);
  }

  // Establecer fecha mínima como HOY (hora local, no UTC)
  if (inputFecha) {
    const ahora = new Date();
    const mes = String(ahora.getMonth() + 1).padStart(2, '0');
    const dia = String(ahora.getDate()).padStart(2, '0');
    inputFecha.min = `${ahora.getFullYear()}-${mes}-${dia}`;
  }

  // 5. Botones de "Reservar" en las tarjetas de servicios (Selección rápida e interacción)
  const btnsReservarServicio = document.querySelectorAll('.btn-reservar-servicio');
  btnsReservarServicio.forEach(btn => {
    btn.addEventListener('click', function(e) {
      const servicioNombre = this.getAttribute('data-servicio-name');
      if (selectServicio && servicioNombre) {
        selectServicio.value = servicioNombre;
        actualizarResumen();
      }

      // Scroll suave hacia la sección de reservaciones
      const reservacionesSec = document.getElementById('reservaciones');
      if (reservacionesSec) {
        reservacionesSec.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  // 6. Validación de Formulario y Envío a WhatsApp
  const inputTelefono = document.getElementById('telefono');
  const inputComentarios = document.getElementById('comentarios');
  const contadorComentarios = document.getElementById('contador-comentarios');
  const formExito = document.getElementById('form-exito');

  if (formReservacion) {
    // Teléfono: solo números, con guion automático (9999-9999)
    inputTelefono.addEventListener('input', function() {
      const digitos = this.value.replace(/\D/g, '').slice(0, 8);
      this.value = digitos.length > 4 ? `${digitos.slice(0, 4)}-${digitos.slice(4)}` : digitos;
    });

    // Contador de caracteres de los comentarios
    inputComentarios.addEventListener('input', function() {
      contadorComentarios.textContent = `${this.value.length} / ${this.maxLength}`;
    });

    // Reglas de cada campo obligatorio
    const reglas = {
      'nombre': valor => valor.trim().length >= 3,
      'telefono': valor => /^[2-9]\d{7}$/.test(valor.replace(/\D/g, '')),
      'servicio': valor => valor !== '',
      'numero-servicios': valor => valor !== '',
      'fecha': valor => valor !== '' && valor >= inputFecha.min,
      'hora': valor => valor !== '',
      'ciudad': valor => valor !== ''
    };

    function validarCampo(id) {
      const el = document.getElementById(id);
      const grupo = el.closest('.form-group');
      const esValido = reglas[id](el.value);
      grupo.classList.toggle('has-error', !esValido);
      el.setAttribute('aria-invalid', !esValido);
      return esValido;
    }

    // Validar al salir de un campo que ya se llenó, y quitar el error al corregirlo
    Object.keys(reglas).forEach(id => {
      const el = document.getElementById(id);
      el.addEventListener('blur', function() {
        if (this.value) validarCampo(id);
      });
      el.addEventListener('input', function() {
        const grupo = this.closest('.form-group');
        if (grupo.classList.contains('has-error')) validarCampo(id);
      });
      el.addEventListener('change', function() {
        const grupo = this.closest('.form-group');
        if (grupo.classList.contains('has-error')) validarCampo(id);
      });
    });

    formReservacion.addEventListener('submit', function(e) {
      e.preventDefault();

      const invalidos = Object.keys(reglas).filter(id => !validarCampo(id));
      if (invalidos.length) {
        const primero = document.getElementById(invalidos[0]);
        primero.scrollIntoView({ behavior: 'smooth', block: 'center' });
        primero.focus({ preventScroll: true });
        return;
      }

      const nombre = document.getElementById('nombre').value.trim();
      const telefono = inputTelefono.value;
      const servicio = selectServicio.value;
      const cantidad = selectCantidad.value;
      const fecha = inputFecha.value;
      const hora = selectHora.value;
      const ciudad = document.getElementById('ciudad').value;
      const lugar = lugarElegido();
      const comentarios = inputComentarios.value.trim();

      const textoMensaje = `¡Hola Jou! \u{1F338} Me encantaría agendar una cita contigo. Te comparto los detalles de mi solicitud:\n\n` +
        `\u{2728} *Mi nombre:* ${nombre}\n` +
        `\u{1F484} *Servicio:* ${servicio}\n` +
        `\u{1F465} *Personas:* ${cantidad}\n` +
        `\u{1F4C5} *Fecha:* ${formatearFecha(fecha)}\n` +
        `\u{23F0} *Horario deseado:* ${hora}\n` +
        `\u{1F4CD} *Lugar:* ${lugar} (${ciudad})\n` +
        (comentarios ? `\u{1F4DD} *Nota:* ${comentarios}\n` : '') +
        `\n¿Tienes disponibilidad para esta fecha? ¡Quedo atenta, muchas gracias! \u{1F495}`;

      const urlWhatsApp = `https://api.whatsapp.com/send?phone=50487800676&text=${encodeURIComponent(textoMensaje)}`;

      // Guardar copia en Google Sheets (sin esperar respuesta, para no bloquear WhatsApp)
      if (URL_GOOGLE_SHEETS) {
        const datos = new URLSearchParams({
          nombre: nombre,
          telefono: telefono,
          servicio: servicio,
          cantidad: cantidad,
          fecha: fecha,
          hora: hora,
          ciudad: ciudad,
          lugar: lugar,
          comentarios: comentarios,
          website: document.getElementById('website').value
        });
        fetch(URL_GOOGLE_SHEETS, {
          method: 'POST',
          mode: 'no-cors',
          keepalive: true,
          body: datos
        }).catch(function(error) {
          console.warn('No se pudo guardar la reservación en Google Sheets:', error);
        });
      }

      // Abrir WhatsApp en pestaña nueva de forma segura
      window.open(urlWhatsApp, '_blank', 'noopener,noreferrer');

      // Mostrar confirmación (con enlace por si el navegador bloqueó la pestaña nueva)
      document.getElementById('exito-nombre').textContent = nombre.split(' ')[0];
      document.getElementById('exito-whatsapp').href = urlWhatsApp;
      formReservacion.hidden = true;
      formExito.hidden = false;
    });

    // Volver a mostrar el formulario vacío
    document.getElementById('exito-nueva').addEventListener('click', function() {
      formReservacion.reset();
      formReservacion.querySelectorAll('.has-error').forEach(g => g.classList.remove('has-error'));
      contadorComentarios.textContent = `0 / ${inputComentarios.maxLength}`;
      actualizarResumen();
      formExito.hidden = true;
      formReservacion.hidden = false;
      formReservacion.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  // 7. Galería de trabajos (tarjetas de servicios y "Nuestros Trabajos Destacados")
  const modal = document.getElementById('gallery-modal');
  const closeModal = modal.querySelector('.close-modal');
  const modalTitle = document.getElementById('modal-title');
  const modalContador = document.getElementById('modal-contador');
  const modalGrid = document.getElementById('modal-gallery-grid');
  const visor = document.getElementById('visor');
  const visorImg = document.getElementById('visor-img');
  const visorTexto = document.getElementById('visor-texto');
  const visorAnterior = visor.querySelector('.visor-anterior');
  const visorSiguiente = visor.querySelector('.visor-siguiente');
  const visorCerrar = visor.querySelector('.visor-cerrar');

  let fotosActuales = [];
  let tituloActual = '';
  let indiceActual = 0;
  let elementoQueAbrio = null;

  // Busca las fotos numeradas de un trabajo (novia-1.jpg, novia-2.jpg…) hasta la primera que falte
  const MAX_FOTOS_POR_TRABAJO = 30;
  const fotosEncontradas = {};

  function existeImagen(ruta) {
    return new Promise(resolve => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = ruta;
    });
  }

  async function buscarFotos(clave) {
    if (!fotosEncontradas[clave]) {
      const rutas = Array.from({ length: MAX_FOTOS_POR_TRABAJO }, (_, i) => `images/trabajos/${clave}-${i + 1}.jpg`);
      const existen = await Promise.all(rutas.map(existeImagen));
      const primeraQueFalta = existen.indexOf(false);
      fotosEncontradas[clave] = primeraQueFalta === -1 ? rutas : rutas.slice(0, primeraQueFalta);
    }
    return fotosEncontradas[clave];
  }

  async function abrirTrabajos(clave, origen) {
    const trabajo = TRABAJOS[clave];
    if (!trabajo) return;

    elementoQueAbrio = origen;
    tituloActual = trabajo.titulo;
    modalTitle.textContent = trabajo.titulo;
    modalContador.textContent = 'Cargando fotos…';
    modalGrid.innerHTML = '';
    modal.classList.add('show');
    document.body.style.overflow = 'hidden'; // Prevenir scroll
    closeModal.focus();

    const encontradas = await buscarFotos(clave);
    // Si la ventana se cerró o se abrió otro trabajo mientras cargaba, no hacer nada
    if (!modal.classList.contains('show') || tituloActual !== trabajo.titulo) return;

    fotosActuales = encontradas.length ? encontradas : trabajo.fotos;
    const total = fotosActuales.length;
    modalContador.textContent = total === 1 ? '1 foto' : total > 1 ? `${total} fotos` : '';

    if (!total) {
      const aviso = document.createElement('p');
      aviso.className = 'modal-vacio';
      aviso.textContent = 'Muy pronto compartiremos fotos de este servicio.';
      modalGrid.appendChild(aviso);
    }

    fotosActuales.forEach((ruta, i) => {
      const boton = document.createElement('button');
      boton.type = 'button';
      boton.className = 'modal-foto';
      boton.setAttribute('aria-label', `Ver foto ${i + 1} de ${total}`);
      const img = document.createElement('img');
      img.src = ruta;
      img.alt = `${trabajo.titulo}, foto ${i + 1}`;
      boton.appendChild(img);
      boton.addEventListener('click', () => abrirVisor(i));
      modalGrid.appendChild(boton);
    });
  }

  function cerrarTrabajos() {
    cerrarVisor();
    modal.classList.remove('show');
    document.body.style.overflow = ''; // Restaurar scroll
    if (elementoQueAbrio) elementoQueAbrio.focus();
  }

  function mostrarFoto() {
    const total = fotosActuales.length;
    visorImg.src = fotosActuales[indiceActual];
    visorImg.alt = `${tituloActual}, foto ${indiceActual + 1}`;
    visorTexto.textContent = `${tituloActual} · ${indiceActual + 1} / ${total}`;
    visorAnterior.hidden = total < 2;
    visorSiguiente.hidden = total < 2;
  }

  function abrirVisor(indice) {
    indiceActual = indice;
    mostrarFoto();
    visor.hidden = false;
    visorCerrar.focus();
  }

  function cerrarVisor() {
    if (visor.hidden) return;
    visor.hidden = true;
    const miniatura = modalGrid.querySelectorAll('.modal-foto')[indiceActual];
    if (miniatura) miniatura.focus();
  }

  function moverVisor(paso) {
    const total = fotosActuales.length;
    indiceActual = (indiceActual + paso + total) % total;
    mostrarFoto();
  }

  // Tarjetas de servicios (sin contar el botón Reservar)
  document.querySelectorAll('.servicio-card').forEach(card => {
    card.style.cursor = 'pointer';
    card.addEventListener('click', function(e) {
      if (e.target.closest('.btn-reservar-servicio')) return;
      abrirTrabajos(this.dataset.trabajos, this);
    });
  });

  // Fotos de "Nuestros Trabajos Destacados" (clic, Enter o espacio)
  document.querySelectorAll('.galeria-item').forEach(item => {
    item.addEventListener('click', function() {
      abrirTrabajos(this.dataset.trabajos, this);
    });
    item.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        abrirTrabajos(this.dataset.trabajos, this);
      }
    });
  });

  closeModal.addEventListener('click', cerrarTrabajos);
  visorCerrar.addEventListener('click', cerrarVisor);
  visorAnterior.addEventListener('click', () => moverVisor(-1));
  visorSiguiente.addEventListener('click', () => moverVisor(1));

  // Cerrar al hacer clic fuera de la ventana o de la foto
  modal.addEventListener('click', function(e) {
    if (e.target === modal) cerrarTrabajos();
  });
  visor.addEventListener('click', function(e) {
    if (e.target === visor || e.target.classList.contains('visor-figura')) cerrarVisor();
  });

  // Teclado: Escape cierra, flechas cambian de foto
  document.addEventListener('keydown', function(e) {
    if (!visor.hidden) {
      if (e.key === 'Escape') cerrarVisor();
      if (e.key === 'ArrowLeft' && fotosActuales.length > 1) moverVisor(-1);
      if (e.key === 'ArrowRight' && fotosActuales.length > 1) moverVisor(1);
    } else if (e.key === 'Escape' && modal.classList.contains('show')) {
      cerrarTrabajos();
    }
  });

  // Celular: deslizar el dedo para cambiar de foto
  let inicioToque = null;
  visor.addEventListener('touchstart', e => { inicioToque = e.touches[0].clientX; }, { passive: true });
  visor.addEventListener('touchend', e => {
    if (inicioToque === null || fotosActuales.length < 2) return;
    const distancia = e.changedTouches[0].clientX - inicioToque;
    if (Math.abs(distancia) > 50) moverVisor(distancia < 0 ? 1 : -1);
    inicioToque = null;
  });

});