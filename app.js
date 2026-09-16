/**
 * EXPLORADOR DE CLIMA 🌤️
 * Semana 3 · Sesión 6 — fetch() en una página web dinámica
 *
 * API usada: OpenWeatherMap (requiere API key gratuita).
 * Documentación: https://openweathermap.org/current
 *
 * Lógica: fetch + async/await, manejo de estados, historial.
 */

const API_KEY = '9f0fc52b7782b6f4eb2b001d63a80053';
const URL_BASE = 'https://api.openweathermap.org/data/2.5/weather';

// --- Selección de elementos del DOM ---
const form         = document.querySelector('#form-busqueda');
const input        = document.querySelector('#input-ciudad');
const btnBuscar    = document.querySelector('#btn-buscar');
const btnReintentar = document.querySelector('#btn-reintentar');
const msgValidacion = document.querySelector('#msg-validacion');

const estadoInicial = document.querySelector('#estado-inicial');
const estadoCarga   = document.querySelector('#estado-carga');
const estadoError   = document.querySelector('#estado-error');
const textoError    = document.querySelector('#texto-error');
const tarjetaClima  = document.querySelector('#tarjeta-clima');

const historialContainer = document.querySelector('#historial-container');

// --- Estado global ---
let ultimaCiudadBuscada = '';
let historial = []; // últimas 5 búsquedas exitosas


// ─────────────────────────────────────────────────────────────
// FUNCIONES DE ESTADO (igual lógica que el ejemplo del profesor)
// ─────────────────────────────────────────────────────────────

function ocultarTodo() {
  estadoInicial.classList.add('oculto');
  estadoCarga.classList.add('oculto');
  estadoError.classList.add('oculto');
  tarjetaClima.classList.add('oculto');
}

function mostrarCargando() {
  ocultarTodo();
  estadoCarga.classList.remove('oculto');
  btnBuscar.disabled = true;
  btnBuscar.textContent = 'Buscando...';
}

function mostrarError(mensaje) {
  ocultarTodo();
  textoError.textContent = mensaje;
  estadoError.classList.remove('oculto');
  btnBuscar.disabled = false;
  btnBuscar.textContent = 'Buscar';
}

function mostrarClima(datos) {
  ocultarTodo();

  // Extraer datos del JSON de OpenWeatherMap
  const ciudad      = datos.name;
  const pais        = datos.sys.country;
  const temp        = Math.round(datos.main.temp);
  const sensacion   = Math.round(datos.main.feels_like);
  const humedad     = datos.main.humidity;
  const viento      = Math.round(datos.wind.speed * 3.6); // m/s → km/h
  const presion     = datos.main.pressure;
  const descripcion = datos.weather[0].description;
  const iconoCod    = datos.weather[0].icon;
  const iconoUrl    = `https://openweathermap.org/img/wn/${iconoCod}@2x.png`;

  const fechaHoy = new Date().toLocaleDateString('es-ES', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  // Inyectar HTML dinámicamente en la tarjeta
  tarjetaClima.innerHTML = `
    <div class="tarjeta-header">
      <img src="${iconoUrl}" alt="${descripcion}" />
      <div>
        <h2>${ciudad}</h2>
        <span class="pais-codigo">${pais}</span>
      </div>
    </div>

    <p class="temp-grande">${temp}°C</p>
    <p class="temp-descripcion">${descripcion}</p>

    <div class="datos-grid">
      <div class="dato-item">
        <span class="etiqueta">🌡️ Sensación térmica</span>
        <span class="valor">${sensacion}°C</span>
      </div>
      <div class="dato-item">
        <span class="etiqueta">💧 Humedad</span>
        <span class="valor">${humedad}%</span>
      </div>
      <div class="dato-item">
        <span class="etiqueta">💨 Viento</span>
        <span class="valor">${viento} km/h</span>
      </div>
      <div class="dato-item">
        <span class="etiqueta">📊 Presión</span>
        <span class="valor">${presion} hPa</span>
      </div>
    </div>

    <p class="fecha-clima">${fechaHoy}</p>
  `;

  tarjetaClima.classList.remove('oculto');
  btnBuscar.disabled = false;
  btnBuscar.textContent = 'Buscar';
}


// ─────────────────────────────────────────────────────────────
// FUNCIÓN PRINCIPAL: buscarDatos (fetch + async/await)
// ─────────────────────────────────────────────────────────────

async function buscarDatos(query) {
  const ciudad = query.trim();
  if (!ciudad) return;

  ultimaCiudadBuscada = ciudad;
  mostrarCargando();

  try {
    const url = `${URL_BASE}?q=${encodeURIComponent(ciudad)}&appid=${API_KEY}&units=metric&lang=es`;

    const respuesta = await fetch(url);

    // Verificar que la respuesta HTTP sea exitosa
    if (!respuesta.ok) {
      if (respuesta.status === 404) {
        throw new Error(`No se encontró la ciudad "${ciudad}". Revisa la ortografía.`);
      } else if (respuesta.status === 401) {
        throw new Error('API Key inválida. Verifica tu clave en app.js.');
      } else {
        throw new Error(`Error del servidor (${respuesta.status}). Intenta más tarde.`);
      }
    }

    // Convertir respuesta a JSON
    const datos = await respuesta.json();

    // Mostrar los datos y agregar al historial
    mostrarClima(datos);
    agregarAlHistorial(datos.name);
    console.log('Datos recibidos:', datos);

  } catch (error) {
    console.error('Error al buscar el clima:', error.message);
    mostrarError(error.message || 'Ocurrió un error inesperado. Intenta nuevamente.');
  }
}


// ─────────────────────────────────────────────────────────────
// HISTORIAL (últimas 5 búsquedas exitosas)
// ─────────────────────────────────────────────────────────────

function agregarAlHistorial(nombreCiudad) {
  // Eliminar si ya existe (evitar duplicados)
  historial = historial.filter(c => c.toLowerCase() !== nombreCiudad.toLowerCase());

  // Agregar al principio
  historial.unshift(nombreCiudad);

  // Máximo 5 elementos
  if (historial.length > 5) historial.pop();

  renderizarHistorial();
}

function renderizarHistorial() {
  historialContainer.innerHTML = '';

  if (historial.length === 0) {
    historialContainer.innerHTML = '<p class="historial-vacio">Aún no hay búsquedas exitosas.</p>';
    return;
  }

  historial.forEach(ciudad => {
    const pildora = document.createElement('button');
    pildora.className = 'pildora';
    pildora.type = 'button';
    pildora.textContent = ciudad;

    pildora.addEventListener('click', () => {
      input.value = ciudad;
      buscarDatos(ciudad);
    });

    historialContainer.appendChild(pildora);
  });
}


// ─────────────────────────────────────────────────────────────
// EVENT LISTENERS
// ─────────────────────────────────────────────────────────────

// Submit del formulario
form.addEventListener('submit', (evento) => {
  evento.preventDefault();
  const query = input.value.trim();

  // Validación: campo vacío
  if (!query) {
    msgValidacion.classList.remove('oculto');
    return;
  }

  msgValidacion.classList.add('oculto');
  buscarDatos(query);
});

// Ocultar mensaje de validación al escribir
input.addEventListener('input', () => {
  if (input.value.trim() !== '') {
    msgValidacion.classList.add('oculto');
  }
});

// Botón Reintentar
btnReintentar.addEventListener('click', () => {
  if (ultimaCiudadBuscada) {
    buscarDatos(ultimaCiudadBuscada);
  }
});

// Inicializar historial vacío al cargar
renderizarHistorial();
