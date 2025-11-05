document.addEventListener('DOMContentLoaded', () => {
  // Seleccionar elementos con verificación
  const openBtn = document.getElementById('open-chat');
  const chatbot = document.getElementById('chatbot');
  const closeBtn = document.getElementById('chat-close');
  const form = document.getElementById('chat-form');
  const input = document.getElementById('chat-input');
  const body = document.getElementById('chat-body');
  const nav = document.querySelector('.nav');
  const toggle = document.querySelector('.header-inner'); // Asumiendo que ::after es para hamburguesa

  if (!openBtn || !chatbot || !closeBtn || !form || !input || !body) {
    console.error('Elementos del chatbot no encontrados.');
    return;
  }

  // Establecer el año actual
  const currentYear = document.querySelector('.current-year');
  if (currentYear) {
    currentYear.textContent = new Date().getFullYear();
  }

  // Detectar página
  const pagina = document.body.dataset.page || 'inicio';

  // Respuestas por página y FAQ (sin precios)
  const respuestas = {
    inicio: {
      saludo: "¡Hola! Bienvenido a Ycay360. Ofrecemos:\n• Servicios Hogar\n• Soporte técnico\n• Pintura profesional\n\n¿Cuál te interesa?",
      default: "Perfecto. Un experto te ayudará por WhatsApp en minutos.\n\n¿Listo para chatear?",
      despedida: "¡Genial! Te redirigimos a WhatsApp...",
      ayuda: "Preguntas comunes:\n- Ubicación\n- Horario\n- Servicios\n- Contacto\n\n¿Qué quieres saber?"
    },
    servicios: {
      saludo: "¡Hola! Estás en **Servicios Hogar**.\n\nTe ofrecemos:\n• Drywall\n• Plomería\n• Electricidad\n• Remodelaciones\n\n¿Quieres que un experto te contacte?",
      default: "Entendido. Un especialista te escribirá por WhatsApp.\n\n¿Te parece bien?",
      despedida: "¡Perfecto! Abriendo WhatsApp...",
      ayuda: "FAQ para Servicios Hogar:\n- ¿Incluye materiales?\n- Tiempos de ejecución\n\nEscribe tu pregunta."
    },
    soporte: {
      saludo: "¡Hola! Estás en **Soporte TIC**.\n\nServicios:\n• Mantenimiento de PC\n• Redes WiFi\n• Soporte remoto o presencial\n• Recuperación de datos\n\n¿En qué necesitas ayuda?",
      default: "Claro. Un técnico te contactará por WhatsApp para resolverlo.\n\n¿Listo?",
      despedida: "¡Excelente! Te conectamos ahora...",
      ayuda: "FAQ para Soporte TIC:\n- Soporte remoto disponible?\n- Garantía en reparaciones\n\n¿Más detalles?"
    },
    pintura: {
      saludo: "¡Hola! Estás en **Pintura Profesional**.\n\nIncluye:\n• Preparación de superficies\n• Pinturas premium\n• Acabados perfectos\n• Garantías\n\n¿Quieres una cotización personalizada?",
      default: "Perfecto. Un pintor experto te escribirá por WhatsApp.\n\n¿Seguimos?",
      despedida: "¡Listo! Te redirigimos...",
      ayuda: "FAQ para Pintura:\n- Tipos de pintura\n- Preparación requerida\n\n¿Qué dudas tienes?"
    },
    faq: {
      ubicacion: "Estamos ubicados en Bello, Colombia. ¿Quieres que te demos más detalles por WhatsApp?",
      horario: "Nuestro horario es de lunes a viernes de 8:00 a.m. a 6:00 p.m., y sábados de 9:00 a.m. a 1:00 p.m. ¿Te ayudamos con algo más o quieres contactarnos por WhatsApp?",
      precio: "Los precios varían según el servicio y el proyecto. ¿Quieres una cotización detallada por WhatsApp?",
      servicios: "Ofrecemos servicios hogar (drywall, plomería, electricidad), soporte técnico (redes, PC, recuperación de datos), y pintura profesional con garantía. ¿Te interesa algún servicio en particular o quieres más detalles por WhatsApp?",
      contacto: "Puedes contactarnos por WhatsApp al +57 304 2096459 o por correo a contacto@ycay360.com. ¿Prefieres que te llamemos o seguimos por WhatsApp?"
    }
  };
  const r = respuestas[pagina];

  // Cargar conversación y estado desde sessionStorage
  let conversacion = [];
  let currentState = sessionStorage.getItem('chat_state') || 'inicio';
  try {
    conversacion = JSON.parse(sessionStorage.getItem('chatbot_conversation')) || [];
  } catch (error) {
    console.error('Error al cargar conversación:', error);
    sessionStorage.removeItem('chatbot_conversation');
    sessionStorage.removeItem('chat_state');
    currentState = 'inicio';
  }

  // Verificar si el saludo ya fue mostrado y si el chat fue cerrado previamente
  const greetingShown = sessionStorage.getItem('chatbot_greeting_shown');
  const chatClosed = localStorage.getItem('chatbot_closed') === 'true'; // Recordar cierre para no auto-abrir

  // Timers para inactividad
  let inactivityTimer;
  let resetTimer;

  // Función para resetear timers
  function resetInactivityTimers() {
    clearTimeout(inactivityTimer);
    clearTimeout(resetTimer);
    inactivityTimer = setTimeout(() => {
      if (currentState !== 'despedida' && chatbot.classList.contains('open')) {
        mostrarMensaje('¿Sigues ahí?', 'bot');
        currentState = 'esperando_respuesta_inactividad';
        sessionStorage.setItem('chat_state', currentState);
        resetTimer = setTimeout(resetChat, 60000); // 1 min para reset
      }
    }, 120000); // 2 min inactividad
  }

  // Función para resetear chat
  function resetChat() {
    if (!chatbot.classList.contains('open')) return;
    conversacion = [];
    body.innerHTML = '';
    currentState = 'inicio';
    sessionStorage.removeItem('chatbot_conversation');
    sessionStorage.removeItem('chatbot_greeting_shown');
    sessionStorage.setItem('chat_state', currentState);
    mostrarMensaje('Chat reiniciado por inactividad. ¡Hola de nuevo!', 'bot');
  }

  // Inicializar chatbot cerrado
  chatbot.classList.add('closed');
  openBtn.style.display = 'flex';

  // Auto-abrir solo si no fue cerrado previamente y después de 2s
  if (!chatClosed) {
    setTimeout(() => {
      chatbot.classList.remove('closed');
      chatbot.classList.add('open');
      openBtn.style.display = 'none';
      input.focus(); // Accesibilidad: focus en input
    }, 2000);
  }

  // Cerrar chatbot
  closeBtn.addEventListener('click', () => {
    chatbot.classList.add('closed');
    chatbot.classList.remove('open');
    openBtn.style.display = 'flex';
    currentState = 'inicio';
    sessionStorage.setItem('chat_state', currentState);
    localStorage.setItem('chatbot_closed', 'true'); // Recordar cierre
    clearTimeout(inactivityTimer);
    clearTimeout(resetTimer);
  });

  // Abrir chatbot
  openBtn.addEventListener('click', () => {
    chatbot.classList.remove('closed');
    chatbot.classList.add('open');
    openBtn.style.display = 'none';
    localStorage.removeItem('chatbot_closed'); // Olvidar cierre al abrir manualmente
    // Mostrar conversación previa
    body.innerHTML = '';
    conversacion.forEach(msg => mostrarMensaje(msg.text, msg.type));
    if (currentState === 'inicio' && !greetingShown) {
      mostrarMensaje(r.saludo, 'bot');
      sessionStorage.setItem('chatbot_greeting_shown', 'true');
      currentState = 'esperando_respuesta';
      sessionStorage.setItem('chat_state', currentState);
    }
    input.focus(); // Accesibilidad
    resetInactivityTimers();
  });

  // Máquina de estados (expandida con 'ayuda')
  const states = {
    inicio: (input, page) => {
      const r = respuestas[page];
      sessionStorage.setItem('chatbot_greeting_shown', 'true');
      currentState = 'esperando_respuesta';
      return r.saludo;
    },
    esperando_respuesta: (input, page) => {
      const r = respuestas[page];
      const msg = input.toLowerCase();
      let respuesta = r.default;
      let faqType = null;
      if (msg.includes('hola') || msg.includes('buenas') || msg.includes('saludos')) {
        respuesta = r.saludo;
      } else if (msg.includes('ayuda') || msg.includes('faq') || msg.includes('preguntas')) {
        respuesta = r.ayuda || respuestas.faq.servicios; // Expandido
      } else if (msg.includes('ubicación') || msg.includes('ubicacion') || msg.includes('dónde') || msg.includes('donde') || msg.includes('están') || msg.includes('estan')) {
        respuesta = respuestas.faq.ubicacion;
        faqType = 'ubicacion';
      } else if (msg.includes('horario') || msg.includes('hora') || msg.includes('abren')) {
        respuesta = respuestas.faq.horario;
        faqType = 'horario';
      } else if (msg.includes('precio') || msg.includes('costo') || msg.includes('cuánto') || msg.includes('cuanto')) {
        respuesta = respuestas.faq.precio;
        faqType = 'precio';
      } else if (msg.includes('servicio') || msg.includes('servicios') || msg.includes('qué hacen') || msg.includes('que hacen')) {
        respuesta = respuestas.faq.servicios;
        faqType = 'servicios';
      } else if (msg.includes('contacto') || msg.includes('contactar') || msg.includes('teléfono') || msg.includes('telefono')) {
        respuesta = respuestas.faq.contacto;
        faqType = 'contacto';
      } else if (msg.includes('m²') || msg.includes('metros')) {
        respuesta = "¡Gracias por compartir! Por favor, confirma los m² de tu espacio y te prepararemos una cotización personalizada.";
        faqType = 'cotizacion';
      } else if (msg.includes('sí') || msg.includes('si') || msg.includes('claro') || msg.includes('ok') || msg.includes('dale')) {
        respuesta = r.despedida;
        currentState = 'despedida';
        mostrarBotonWhatsApp(page);
        return respuesta;
      }
      if (faqType) {
        currentState = 'esperando_confirmacion';
      } else {
        currentState = 'esperando_respuesta';
      }
      sessionStorage.setItem('chat_state', currentState);
      sessionStorage.setItem('last_faq_type', faqType);
      return respuesta;
    },
    esperando_confirmacion: (input, page) => {
      const r = respuestas[page];
      const msg = input.toLowerCase();
      const lastFaqType = sessionStorage.getItem('last_faq_type');
      if (msg.includes('sí') || msg.includes('si') || msg.includes('claro') || msg.includes('ok') || msg.includes('dale')) {
        const respuesta = r.despedida;
        currentState = 'despedida';
        mostrarBotonWhatsApp(page, lastFaqType);
        sessionStorage.removeItem('last_faq_type');
        return respuesta;
      } else {
        currentState = 'esperando_respuesta';
        return states['esperando_respuesta'](input, page);
      }
    },
    esperando_respuesta_inactividad: (input, page) => {
      const msg = input.toLowerCase();
      if (msg.includes('si') || msg.includes('sí') || msg.includes('aqui') || msg.includes('aquí')) {
        currentState = 'esperando_respuesta';
        return '¡Genial! ¿En qué más te ayudo?';
      } else {
        resetChat();
        return '';
      }
    },
    despedida: (input, page) => {
      return '¡Gracias por chatear! Si necesitas más, abre el chat de nuevo.';
    }
  };

  // Enviar mensaje (con debounce y tecla Enter)
  let submitDebounce = false;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (submitDebounce || !input.value.trim()) return;
    submitDebounce = true;
    setTimeout(() => { submitDebounce = false; }, 500); // Debounce 500ms

    const userMsg = input.value.trim();
    mostrarMensaje(userMsg, 'user');
    input.value = '';

    // Mostrar "escribiendo..."
    const typing = document.createElement('div');
    typing.classList.add('bot-msg');
    typing.textContent = 'Escribiendo...';
    body.appendChild(typing);
    body.scrollTop = body.scrollHeight;

    // Procesar respuesta
    setTimeout(() => {
      body.removeChild(typing);
      if (!chatbot.classList.contains('open')) return;
      let respuesta = states[currentState](userMsg, pagina);
      if (respuesta) mostrarMensaje(respuesta, 'bot');
      sessionStorage.setItem('chat_state', currentState);
      resetInactivityTimers();
    }, 800);
  });

  // Tecla Enter para submit, Esc para cerrar
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      form.dispatchEvent(new Event('submit'));
    } else if (e.key === 'Escape') {
      closeBtn.click();
    }
  });

  // Navegación móvil mejorada (delegado)
  if (toggle && nav) {
    toggle.addEventListener('click', (e) => {
      if (e.target.tagName === 'DIV' && e.target.classList.contains('header-inner')) { // Mejor detección
        nav.classList.toggle('active');
      }
    });
  }

  // Mostrar mensaje (mejorado con accesibilidad)
  function mostrarMensaje(texto, tipo) {
    if (!chatbot.classList.contains('open')) return;
    const msg = document.createElement('div');
    msg.classList.add(tipo === 'bot' ? 'bot-msg' : 'user-msg');
    // Usar textContent y <br> para seguridad
    const lines = texto.split('\n');
    lines.forEach((line, i) => {
      if (i > 0) msg.appendChild(document.createElement('br'));
      msg.appendChild(document.createTextNode(line));
    });
    body.appendChild(msg);
    body.scrollTop = body.scrollHeight; // Scroll suave posible con CSS
    conversacion.push({ text: texto, type: tipo });
    sessionStorage.setItem('chatbot_conversation', JSON.stringify(conversacion));
    // Accesibilidad: announce new message
    msg.setAttribute('aria-live', 'polite');
  }

  // Botón WhatsApp
  function mostrarBotonWhatsApp(pagina, faqType = null) {
    const textos = {
      inicio: "Hola, vengo del chat de la página principal",
      servicios: "Hola, quiero cotizar servicios hogar",
      soporte: "Hola, necesito soporte técnico",
      pintura: "Hola, quiero cotizar pintura",
      ubicacion: "Hola, quiero más detalles sobre su ubicación en Bello",
      horario: "Hola, quiero más detalles sobre sus horarios",
      precio: "Hola, quiero una cotización detallada",
      servicios: "Hola, quiero más información sobre sus servicios",
      contacto: "Hola, quiero contactarlos",
      cotizacion: "Hola, quiero una cotización para un proyecto de pintura"
    };
    sessionStorage.removeItem('chatbot_conversation');
    sessionStorage.removeItem('chatbot_greeting_shown');
    sessionStorage.removeItem('chat_state');
    setTimeout(() => {
      if (!chatbot.classList.contains('open')) return;
      const btn = document.createElement('div');
      btn.innerHTML = `
        <a href="https://wa.me/573042096459?text=${encodeURIComponent(textos[faqType || pagina])}"
           target="_blank"
           class="btn-whatsapp-chat">
          Continuar en WhatsApp
        </a>
      `;
      body.appendChild(btn);
      body.scrollTop = body.scrollHeight;
      setTimeout(() => {
        if (chatbot.classList.contains('open')) {
          chatbot.classList.add('closed');
          chatbot.classList.remove('open');
          openBtn.style.display = 'flex';
        }
      }, 2000);
    }, 1000);
  }

  // Limpiar timers al unload (rendimiento)
  window.addEventListener('beforeunload', () => {
    clearTimeout(inactivityTimer);
    clearTimeout(resetTimer);
  });

  // Iniciar timers
  resetInactivityTimers();
});
