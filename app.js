/* ==========================================================================
   EXPLORADOR DE CLIMA - LÓGICA DE LA APLICACIÓN (app.js)
   ========================================================================== */

/**
 * [RÚBRICA: API_KEY & CONFIGURACIÓN]
 * Definición de la clave de API para consumir OpenWeatherMap.
 * Reemplaza 'TU_API_KEY_AQUI' por tu API Key real generada en openweathermap.org
 */
const API_KEY = '9f0fc52b7782b6f4eb2b001d63a80053';
const API_URL = 'https://api.openweathermap.org/data/2.5/weather';

// --- Estado global de la aplicación ---
let ultimaBusqueda = '';
let historialBusquedas = [];

// --- Referencias a elementos del DOM ---
const searchForm = document.getElementById('search-form');
const searchInput = document.getElementById('search-input');
const validationMsg = document.getElementById('validation-msg');
const validationText = document.getElementById('validation-text');

const loadingState = document.getElementById('loading-state');
const errorState = document.getElementById('error-state');
const errorMessage = document.getElementById('error-message');
const retryBtn = document.getElementById('retry-btn');

const weatherResults = document.getElementById('weather-results');
const historyContainer = document.getElementById('history-container');


/* ==========================================================================
   1. VALIDACIÓN DE ENTRADA
   ========================================================================== */

/**
 * [RÚBRICA: VALIDACIÓN DE ENTRADA]
 * Valida que la búsqueda no esté vacía ni contenga solo espacios en blanco.
 * Muestra u oculta mensajes de advertencia dinámicamente en el DOM.
 * @param {string} query - Texto ingresado por el usuario.
 * @returns {boolean} - true si es válida, false en caso contrario.
 */
function validarEntrada(query) {
  const queryLimpia = query.trim();

  if (queryLimpia === '') {
    validationText.textContent = 'El campo de búsqueda no puede estar vacío.';
    validationMsg.classList.remove('hidden');
    return false;
  }

  // Ocultar mensaje de validación si la entrada es correcta
  validationMsg.classList.add('hidden');
  return true;
}


/* ==========================================================================
   2. MANEJO DE ESTADOS Y PETICIÓN HTTP (API)
   ========================================================================== */

/**
 * Cambia la visibilidad de los contenedores para reflejar el estado actual.
 * [RÚBRICA: MANEJO DE ESTADOS]
 * @param {'loading' | 'success' | 'error' | 'idle'} estado - Estado a activar.
 */
function cambiarEstadoUI(estado) {
  // Ocultar todos los contenedores primero
  loadingState.classList.add('hidden');
  errorState.classList.add('hidden');
  weatherResults.classList.add('hidden');

  switch (estado) {
    case 'loading':
      // Muestra el spinner de carga y oculta errores y resultados previa petición
      loadingState.classList.remove('hidden');
      break;
    case 'success':
      // Muestra la tarjeta con los resultados exitosos
      weatherResults.classList.remove('hidden');
      break;
    case 'error':
      // Muestra el contenedor de alerta de error
      errorState.classList.remove('hidden');
      break;
    case 'idle':
    default:
      // Estado inicial neutro
      break;
  }
}

/**
 * [RÚBRICA: CONSUMO DE API CON ASYNC/AWAIT & FETCH]
 * [RÚBRICA: MANEJO DE ERRORES CON TRY/CATCH]
 * Realiza la petición a la API de OpenWeatherMap y gestiona el flujo de trabajo.
 * @param {string} query - Nombre de la ciudad a buscar.
 */
async function buscarDatos(query) {
  const ciudad = query.trim();
  if (!ciudad) return;

  // Guardar la búsqueda como la última ejecutada para el botón 'Reintentar'
  ultimaBusqueda = ciudad;

  // 1. ESTADO DE CARGA: Mostrar cargando... y ocultar resultados/errores anteriores
  cambiarEstadoUI('loading');

  try {
    // [RÚBRICA: FETCH] Construcción de la URL de consulta con parámetros
    const url = `${API_URL}?q=${encodeURIComponent(ciudad)}&appid=${API_KEY}&units=metric&lang=es`;

    const respuesta = await fetch(url);

    // 2. VERIFICACIÓN DE RESPUESTA HTTP ok (código 200-299)
    if (!respuesta.ok) {
      if (respuesta.status === 404) {
        throw new Error(`La ciudad "${ciudad}" no fue encontrada. Revisa la ortografía e intenta nuevamente.`);
      } else if (respuesta.status === 401) {
        throw new Error('API Key inválida o no activada. Por favor coloca tu API Key de OpenWeatherMap en app.js.');
      } else {
        throw new Error(`Error en el servidor (${respuesta.status}). Inténtalo más tarde.`);
      }
    }

    // Convertir respuesta a JSON
    const datos = await respuesta.json();

    // 3. ÉXITO: Renderizar tarjeta de clima e historial
    renderizarClima(datos);
    agregarAlHistorial(datos.name);
    cambiarEstadoUI('success');

  } catch (error) {
    // [RÚBRICA: CATCH DE ERRORES]
    console.error('Error al obtener el clima:', error.message);

    // Ocultar carga y mostrar contenedor de error con el mensaje explicativo
    errorMessage.textContent = error.message;
    cambiarEstadoUI('error');
  }
}


/* ==========================================================================
   3. RENDERIZADO DINÁMICO DEL DOM
   ========================================================================== */

/**
 * [RÚBRICA: RENDERIZADO DINÁMICO]
 * Construye la tarjeta de resultados usando elementos del DOM y la inyecta en el contenedor.
 * @param {Object} datos - Objeto JSON retornado por OpenWeatherMap.
 */
function renderizarClima(datos) {
  // Limpiar contenedor de resultados previos
  weatherResults.innerHTML = '';

  const { name, main, weather, wind, sys } = datos;
  const descripcion = weather[0].description;
  const iconoCodigo = weather[0].icon;
  const iconoUrl = `https://openweathermap.org/img/wn/${iconoCodigo}@2x.png`;
  const fechaHoy = new Date().toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Crear tarjeta contenedora con document.createElement
  const card = document.createElement('div');
  card.className = 'weather-card';

  // Inyectar la estructura con los datos formateados
  card.innerHTML = `
    <div class="weather-header">
      <div class="city-info">
        <h2>${name} <span class="country">${sys.country}</span></h2>
        <p class="weather-date">${fechaHoy}</p>
      </div>
    </div>

    <div class="temp-container">
      <div class="temp-main">
        <span class="temp-value">${Math.round(main.temp)}</span>
        <span class="temp-unit">°C</span>
      </div>
      <div class="weather-condition">
        <img src="${iconoUrl}" alt="${descripcion}" class="weather-icon">
        <span class="condition-text">${descripcion}</span>
      </div>
    </div>

    <div class="weather-details-grid">
      <div class="detail-item">
        <i class="fa-solid fa-temperature-three-quarters"></i>
        <div class="detail-info">
          <span class="detail-label">Sensación térmica</span>
          <span class="detail-value">${Math.round(main.feels_like)}°C</span>
        </div>
      </div>
      <div class="detail-item">
        <i class="fa-solid fa-droplet"></i>
        <div class="detail-info">
          <span class="detail-label">Humedad</span>
          <span class="detail-value">${main.humidity}%</span>
        </div>
      </div>
      <div class="detail-item">
        <i class="fa-solid fa-wind"></i>
        <div class="detail-info">
          <span class="detail-label">Viento</span>
          <span class="detail-value">${Math.round(wind.speed * 3.6)} km/h</span>
        </div>
      </div>
      <div class="detail-item">
        <i class="fa-solid fa-gauge"></i>
        <div class="detail-info">
          <span class="detail-label">Presión</span>
          <span class="detail-value">${main.pressure} hPa</span>
        </div>
      </div>
    </div>
  `;

  // Inyectar en el DOM
  weatherResults.appendChild(card);
}


/* ==========================================================================
   4. HISTORIAL DE BÚSQUEDAS (EXTRA & ACCESOS RÁPIDOS)
   ========================================================================== */

/**
 * [RÚBRICA: HISTORIAL]
 * Agrega una ciudad exitosa al arreglo (manteniendo máximo las últimas 5).
 * @param {string} nombreCiudad - Nombre oficial de la ciudad retornada por la API.
 */
function agregarAlHistorial(nombreCiudad) {
  // Evitar duplicados (elimina si ya existía para ponerla al principio)
  historialBusquedas = historialBusquedas.filter(
    item => item.toLowerCase() !== nombreCiudad.toLowerCase()
  );

  // Agregar al inicio
  historialBusquedas.unshift(nombreCiudad);

  // Mantener máximo 5 elementos
  if (historialBusquedas.length > 5) {
    historialBusquedas.pop();
  }

  renderizarHistorial();
}

/**
 * [RÚBRICA: HISTORIAL - RENDERIZADO EN DOM]
 * Genera dinámicamente botones estilo "píldora" para cada ítem del historial.
 */
function renderizarHistorial() {
  historyContainer.innerHTML = '';

  if (historialBusquedas.length === 0) {
    historyContainer.innerHTML = '<p class="empty-history">Aún no has realizado búsquedas exitosas</p>';
    return;
  }

  historialBusquedas.forEach(ciudad => {
    const pill = document.createElement('button');
    pill.className = 'history-pill';
    pill.type = 'button';
    pill.innerHTML = `<i class="fa-solid fa-city"></i> ${ciudad}`;

    // Al hacer clic en la píldora, buscar esa ciudad automáticamente
    pill.addEventListener('click', () => {
      searchInput.value = ciudad;
      validarEntrada(ciudad);
      buscarDatos(ciudad);
    });

    historyContainer.appendChild(pill);
  });
}


/* ==========================================================================
   5. EVENT LISTENERS & INICIALIZACIÓN
   ========================================================================== */

// Evento Submit del Formulario
searchForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const query = searchInput.value;

  if (validarEntrada(query)) {
    buscarDatos(query);
  }
});

// Evento Input para ocultar el mensaje de validación al escribir
searchInput.addEventListener('input', () => {
  if (searchInput.value.trim() !== '') {
    validationMsg.classList.add('hidden');
  }
});

// [RÚBRICA: BOTÓN REINTENTAR]
// Vuelve a ejecutar la última búsqueda al hacer clic en 'Reintentar'
retryBtn.addEventListener('click', () => {
  if (ultimaBusqueda) {
    buscarDatos(ultimaBusqueda);
  }
});

// Inicialización de la UI
renderizarHistorial();
