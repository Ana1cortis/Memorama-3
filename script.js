const CONFIG_DEFECTO = {
  estilo: "color",
  tipoCaras: "emojis",
  imagen: { link: "", colorFondo: "#4a148c" },
  color: { fondo: "#4a148c", volteada: "#e0aaff", texto: "#ffffff", encontrada: "#2d6a4f" },
  textura: { tipo: "rayas", color: "#4a148c" },
  caras: [],
  parejas: 8,
  nivel: "facil",
  numJugadores: 2,
  nombres: ["Jugador 1", "Jugador 2"]
};

const NIVELES = { facil: 4, medio: 8, dificil: 12 };

const EMOJIS = ["🐶","🐱","🦊","🐼","🐸","🦄","🐙","🦋","🐢","🐬","🦁","🐯","🐮","🐷","🐵","🐔","🐧","🐦","🦉","🐺","🐝","🐞","🦀","🐠","🐳","🦈","🦒","🦓","🐘","🦏","🐪","🦘","🐿️","🦔","🦇","🐨","🦥","🦦","🦨","🦩","🐊","🐍","🦎","🐌","🦂","🐜","🪱","🐹","🦆","🦜"];

let config = JSON.parse(JSON.stringify(CONFIG_DEFECTO));
let primera = null, segunda = null, bloqueado = false;
let movimientos = 0, parejasEncontradas = 0, totalParejas = 8;
let cronometro = null, segundos = 0, iniciado = false;

let jugadores = [];
let turno = 0;

// ---- Estilos ----
function aplicarEstilos() {
  const r = document.documentElement.style;
  r.setProperty("--color-fondo", config.color.fondo);
  r.setProperty("--color-volteada", config.color.volteada);
  r.setProperty("--color-texto", config.color.texto);
  r.setProperty("--color-encontrada", config.color.encontrada);
  r.setProperty("--color-fondo-imagen", config.imagen.colorFondo);
  r.setProperty("--color-textura", config.textura.color);
  r.setProperty("--imagen-reverso", config.imagen.link ? `url("${config.imagen.link}")` : "none");
}

// ---- Config ----
function cargarConfig() {
  const guardada = localStorage.getItem("anma-config");
  if (guardada) {
    try { config = { ...CONFIG_DEFECTO, ...JSON.parse(guardada) }; }
    catch (e) { config = JSON.parse(JSON.stringify(CONFIG_DEFECTO)); }
  }
}

function seleccionarNivel(nivel) {
  config.nivel = nivel;
  document.querySelectorAll(".nivel").forEach(b => {
    b.classList.toggle("activo", b.dataset.nivel === nivel);
  });
  const texto = document.getElementById("texto-nivel");
  if (texto) {
    const p = NIVELES[nivel];
    texto.textContent = nivel.charAt(0).toUpperCase() + nivel.slice(1) +
      ": " + p + " parejas · " + (p * 2) + " cartas";
  }
}

function sincronizar() {
  document.getElementById("estilo-reverso").value = config.estilo;
  document.getElementById("link-imagen").value = config.imagen.link;
  document.getElementById("color-fondo-imagen").value = config.imagen.colorFondo;
  document.getElementById("color-fondo").value = config.color.fondo;
  document.getElementById("color-volteada").value = config.color.volteada;
  document.getElementById("color-texto").value = config.color.texto;
  document.getElementById("color-encontrada").value = config.color.encontrada;
  document.getElementById("textura").value = config.textura.tipo;
  document.getElementById("color-textura").value = config.textura.color;
  document.getElementById("tipo-caras").value = config.tipoCaras;
  document.getElementById("links-caras").value = config.caras.join("\n");
  document.getElementById("cantidad-parejas").value = config.parejas;
  document.getElementById("cantidad-jugadores").value = config.numJugadores;
  actualizarOpciones();
  actualizarOpcionesCaras();
  actualizarContadorParejas();
  actualizarContadorJugadores();
  seleccionarNivel(config.nivel);
}

function actualizarOpciones() {
  const e = document.getElementById("estilo-reverso").value;
  document.getElementById("opcion-imagen").classList.toggle("oculto", e !== "imagen");
  document.getElementById("opcion-color").classList.toggle("oculto", e !== "color");
  document.getElementById("opcion-textura").classList.toggle("oculto", e !== "textura");
}
function actualizarOpcionesCaras() {
  const t = document.getElementById("tipo-caras").value;
  document.getElementById("opcion-emojis").classList.toggle("oculto", t !== "emojis");
  document.getElementById("opcion-links").classList.toggle("oculto", t !== "imagenes");
}

function actualizarContadorParejas() {
  const n = parseInt(document.getElementById("cantidad-parejas").value);
  document.getElementById("valor-parejas").textContent = n;
  document.getElementById("valor-cartas").textContent = n * 2;
}

// ---- Jugadores ----
function actualizarContadorJugadores() {
  const n = parseInt(document.getElementById("cantidad-jugadores").value);
  document.getElementById("valor-jugadores").textContent = n;
  dibujarCamposNombres(n);
}

function dibujarCamposNombres(n) {
  const cont = document.getElementById("nombres-jugadores");
  const actuales = [...cont.querySelectorAll("input")].map(i => i.value);
  cont.innerHTML = "";
  for (let i = 0; i < n; i++) {
    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = "Nombre del jugador " + (i + 1);
    input.value = actuales[i] || (config.nombres[i] || "Jugador " + (i + 1));
    cont.appendChild(input);
  }
}

function aplicarJugadores() {
  const inputs = [...document.querySelectorAll("#nombres-jugadores input")];
  config.numJugadores = inputs.length;
  config.nombres = inputs.map((inp, i) => inp.value.trim() || "Jugador " + (i + 1));
  localStorage.setItem("anma-config", JSON.stringify(config));
  crearTablero();
}

function inicializarJugadores() {
  jugadores = [];
  for (let i = 0; i < config.numJugadores; i++) {
    jugadores.push({ nombre: config.nombres[i] || "Jugador " + (i + 1), puntos: 0 });
  }
  turno = 0;
}

// ---- Marcador y turno ----
function dibujarMarcador() {
  const cont = document.getElementById("marcador");
  cont.innerHTML = "";
  jugadores.forEach((j, i) => {
    const fila = document.createElement("div");
    fila.className = "fila-jugador" + (i === turno ? " activo" : "");
    fila.innerHTML = `<span class="nombre">${i === turno ? "👉 " : ""}${j.nombre}</span>
      <span class="puntos">${j.puntos} pts</span>`;
    cont.appendChild(fila);
  });
  actualizarAvisoTurno();
}

function actualizarAvisoTurno() {
  document.getElementById("nombre-turno").textContent = jugadores[turno].nombre;
}

function siguienteTurno() {
  turno = (turno + 1) % jugadores.length;
  dibujarMarcador();
}

// ---- Guardar ----
function guardarEstilo() {
  config.estilo = document.getElementById("estilo-reverso").value;
  if (config.estilo === "imagen") {
    config.imagen.link = document.getElementById("link-imagen").value;
    config.imagen.colorFondo = document.getElementById("color-fondo-imagen").value;
  } else if (config.estilo === "color") {
    config.color.fondo = document.getElementById("color-fondo").value;
    config.color.volteada = document.getElementById("color-volteada").value;
    config.color.texto = document.getElementById("color-texto").value;
    config.color.encontrada = document.getElementById("color-encontrada").value;
  } else if (config.estilo === "textura") {
    config.textura.tipo = document.getElementById("textura").value;
    config.textura.color = document.getElementById("color-textura").value;
  }
  localStorage.setItem("anma-config", JSON.stringify(config));
  aplicarEstilos();
  crearTablero();
}

function guardarCaras() {
  config.tipoCaras = document.getElementById("tipo-caras").value;
  if (config.tipoCaras === "imagenes") {
    config.caras = document.getElementById("links-caras").value.split("\n").map(l => l.trim()).filter(l => l !== "");
  } else {
    config.caras = [];
  }
  localStorage.setItem("anma-config", JSON.stringify(config));
  crearTablero();
}

// ---- Reverso ----
function aplicarReverso(frontal) {
  frontal.classList.remove("con-imagen", "textura-rayas", "textura-puntos", "textura-cuadros", "textura-ondas");
  if (config.estilo === "imagen") frontal.classList.add("con-imagen");
  else if (config.estilo === "textura") frontal.classList.add("textura-" + config.textura.tipo);
}

// ---- Cronómetro ----
function iniciarCronometro() {
  detenerCronometro();
  segundos = 0;
  actualizarCronometro();
  cronometro = setInterval(() => { segundos++; actualizarCronometro(); }, 1000);
}
function detenerCronometro() {
  if (cronometro) { clearInterval(cronometro); cronometro = null; }
}
function actualizarCronometro() {
  document.getElementById("cronometro").textContent = formatoTiempo();
}
function formatoTiempo() {
  const m = Math.floor(segundos / 60).toString().padStart(2, "0");
  const s = (segundos % 60).toString().padStart(2, "0");
  return m + ":" + s;
}

// ---- Tablero ----
function crearTablero() {
  detenerCronometro();
  iniciado = false;
  movimientos = 0;
  parejasEncontradas = 0;
  primera = null; segunda = null; bloqueado = false;
  document.getElementById("movimientos").textContent = "0";
  document.getElementById("cronometro").textContent = "00:00";

  totalParejas = parseInt(document.getElementById("cantidad-parejas").value);
  config.parejas = totalParejas;
  localStorage.setItem("anma-config", JSON.stringify(config));

  inicializarJugadores();
  dibujarMarcador();

  let caras;
  if (config.tipoCaras === "imagenes" && config.caras.length > 0) {
    caras = config.caras.slice(0, totalParejas);
    while (caras.length < totalParejas) caras.push("🐶");
  } else {
    caras = EMOJIS.slice(0, totalParejas);
  }

  const barajadas = [...caras, ...caras].sort(() => Math.random() - 0.5);
  const tablero = document.getElementById("tablero");
  tablero.innerHTML = "";
  tablero.classList.toggle("muchas", totalParejas > 8);

  barajadas.forEach((cara, indice) => {
    const div = document.createElement("div");
    div.className = "carta";
    div.dataset.cara = cara;

    const inner = document.createElement("div");
    inner.className = "carta-inner";

    const frontal = document.createElement("div");
    frontal.className = "cara-frontal";
    aplicarReverso(frontal);

    const trasera = document.createElement("div");
    trasera.className = "cara-trasera";

    const esImagen = typeof cara === "string" && cara.startsWith("http");
    if (esImagen) {
      const img = document.createElement("img");
      img.src = cara;
      img.alt = "cara";
      const error = document.createElement("span");
      error.className = "error";
      error.textContent = "🚫";
      error.style.display = "none";
      img.onerror = () => { img.style.display = "none"; error.style.display = "block"; };
      trasera.appendChild(img);
      trasera.appendChild(error);
    } else {
      trasera.textContent = cara;
      trasera.style.fontSize = totalParejas > 8 ? "1.2rem" : "2rem";
    }

    const numero = document.createElement("span");
    numero.className = "numero-carta";
    numero.textContent = Math.floor(indice / 2) + 1;
    trasera.appendChild(numero);

    inner.appendChild(frontal);
    inner.appendChild(trasera);
    div.appendChild(inner);
    div.addEventListener("click", voltearCarta);
    tablero.appendChild(div);
  });
}

// ---- Lógica ----
function voltearCarta() {
  if (bloqueado) return;
  if (this.classList.contains("volteada") || this.classList.contains("encontrada")) return;
  if (!iniciado) { iniciarCronometro(); iniciado = true; }
  this.classList.add("volteada");
  if (!primera) primera = this;
  else if (!segunda) {
    segunda = this;
    movimientos++;
    document.getElementById("movimientos").textContent = movimientos;
    comprobarPareja();
  }
}

function comprobarPareja() {
  bloqueado = true;
  if (primera.dataset.cara === segunda.dataset.cara) {
    primera.classList.add("encontrada");
    segunda.classList.add("encontrada");
    parejasEncontradas++;
    jugadores[turno].puntos++;
    dibujarMarcador();
    reiniciarTurno();
    if (parejasEncontradas === totalParejas) ganar();
  } else {
    setTimeout(() => {
      primera.classList.remove("volteada");
      segunda.classList.remove("volteada");
      reiniciarTurno();
      siguienteTurno();
    }, 700);
  }
}

function reiniciarTurno() { primera = null; segunda = null; bloqueado = false; }

// ---- Resultados ----
function ganar() {
  detenerCronometro();
  const tiempo = formatoTiempo();
  const max = Math.max(...jugadores.map(j => j.puntos));
  const ganadores = jugadores.filter(j => j.puntos === max);
  const titulo = ganadores.length > 1
    ? "🤝 ¡Empate!"
    : "🎉 ¡Ganó " + ganadores[0].nombre + "!";

  const filas = jugadores
    .map(j => `<div class="resultado-fila${j.puntos === max ? " ganador" : ""}">
        <span>${j.nombre}</span><span><b>${j.puntos} pts</b></span>
      </div>`)
    .join("");

  const div = document.createElement("div");
  div.id = "mensaje-victoria";
  div.innerHTML = `<h2>${titulo}</h2>
    <p>⏱️ Tiempo: <b>${tiempo}</b> · 🎯 Movimientos: <b>${movimientos}</b></p>
    ${filas}
    <button id="cerrar-victoria">Jugar de nuevo</button>`;
  document.body.appendChild(div);
  document.getElementById("cerrar-victoria").addEventListener("click", () => {
    div.remove();
    crearTablero();
  });
}

// ---- Eventos ----
document.getElementById("iniciar-juego").addEventListener("click", () => {
  document.getElementById("bienvenida").classList.add("oculto");
  document.getElementById("juego").classList.remove("oculto");
});
document.getElementById("reiniciar").addEventListener("click", crearTablero);
document.getElementById("guardar-estilo").addEventListener("click", guardarEstilo);
document.getElementById("guardar-caras").addEventListener("click", guardarCaras);
document.getElementById("aplicar-jugadores").addEventListener("click", aplicarJugadores);
document.getElementById("estilo-reverso").addEventListener("change", actualizarOpciones);
document.getElementById("tipo-caras").addEventListener("change", actualizarOpcionesCaras);
document.getElementById("cantidad-parejas").addEventListener("input", actualizarContadorParejas);
document.getElementById("cantidad-parejas").addEventListener("change", crearTablero);
document.getElementById("cantidad-jugadores").addEventListener("input", actualizarContadorJugadores);
document.querySelectorAll(".nivel").forEach(b => {
  b.addEventListener("click", () => {
    seleccionarNivel(b.dataset.nivel);
    document.getElementById("cantidad-parejas").value = NIVELES[b.dataset.nivel];
    actualizarContadorParejas();
    crearTablero();
  });
});

// ---- Init ----
cargarConfig();
sincronizar();
aplicarEstilos();
crearTablero();
