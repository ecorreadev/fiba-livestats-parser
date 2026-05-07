let jwt = null;
let currentParsedData = null;

// Login
async function login() {
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  const statusDiv = document.getElementById('statusMessage');
  
  if (!username || !password) {
    statusDiv.textContent = '❌ Usuario y contraseña requeridos';
    statusDiv.style.color = 'red';
    statusDiv.style.display = 'block';
    return;
  }

  statusDiv.style.display = 'block';
  statusDiv.style.color = 'green';
  statusDiv.textContent = '⏳ Autenticando...';

  try {
    const res = await fetch('https://aguada-stats-api.vercel.app/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    if (!res.ok) {
      const errorBody = await res.json().catch(() => null);
      throw new Error(errorBody?.error || 'Error en la autenticación');
    }

    const data = await res.json();
    jwt = data.jwt || data.token || data.accessToken || null;

    if (!jwt) {
      throw new Error('No se recibió JWT en la respuesta de login');
    }
    
    statusDiv.textContent = '✅ ¡Autenticación exitosa!';
    
    // Ocultar login y mostrar sección de partidos
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('partidos-section').style.display = 'block';
    document.getElementById('actionsGroup').style.display = 'flex';
    
    validateInputs();
  } catch (error) {
    statusDiv.textContent = '❌ Error: ' + error.message;
    statusDiv.style.color = 'red';
  }
}

// Validar que todos los inputs estén llenos
function validateInputs() {
  const requiredFields = [
    'url', 'torneo', 'liga', 'cancha', 'fecha', 'horario', 'fechaLiga', 'dia', 'mes'
  ];
  
  const allFilled = requiredFields.every(id => {
    const value = document.getElementById(id).value;
    return value && value.trim() !== '';
  });

  const playoffsChecked = document.getElementById('playoffs').checked;
  const playoffsFieldsFilled = !playoffsChecked || (
    document.getElementById('playoffsEtapa').value.trim() !== '' &&
    document.getElementById('posicionAguada').value.trim() !== '' &&
    document.getElementById('posicionAdversario').value.trim() !== ''
  );

  document.getElementById('processBtn').disabled = !(allFilled && playoffsFieldsFilled);
}

function togglePlayoffsFields() {
  const playoffsChecked = document.getElementById('playoffs').checked;
  const playoffsFields = document.getElementById('playoffsFields');

  playoffsFields.style.display = playoffsChecked ? 'block' : 'none';

  if (!playoffsChecked) {
    document.getElementById('playoffsEtapa').value = '';
    document.getElementById('posicionAguada').value = '';
    document.getElementById('posicionAdversario').value = '';
  }

  validateInputs();
}

function formatHorario(value) {
  if (!value) {
    return '';
  }

  const match = value.match(/^(\d{1,2}):(\d{2})/);
  if (!match) {
    return '';
  }

  const hours = String(Math.max(0, Math.min(23, Number(match[1])))).padStart(2, '0');
  const minutes = String(Math.max(0, Math.min(59, Number(match[2])))).padStart(2, '0');

  return `${hours}:${minutes}`;
}

async function run() {
  const url = document.getElementById('url').value;
  const statusDiv = document.getElementById('statusMessage');
  
  statusDiv.style.display = 'block';
  statusDiv.style.color = 'green';
  
  function updateStatus(message) {
    statusDiv.textContent = message;
  }
  
  const userData = {
    torneo: document.getElementById('torneo').value,
    liga: document.getElementById('liga').value,
    temporadaRegular: document.getElementById('temporadaRegular').checked,
    playoffs: document.getElementById('playoffs').checked,
    playoffsEtapa: document.getElementById('playoffs').checked ? document.getElementById('playoffsEtapa').value : null,
    posicionAguada: document.getElementById('playoffs').checked ? parseInt(document.getElementById('posicionAguada').value) : null,
    posicionAdversario: document.getElementById('playoffs').checked ? parseInt(document.getElementById('posicionAdversario').value) : null,
    superLiga: document.getElementById('superLiga').checked,
    liguilla: document.getElementById('liguilla').checked,
    reclasificatorio: document.getElementById('reclasificatorio').checked,
    fechaLiga: parseInt(document.getElementById('fechaLiga').value),
    fecha: document.getElementById('fecha').value,
    horario: formatHorario(document.getElementById('horario').value),
    dia: parseInt(document.getElementById('dia').value),
    mes: parseInt(document.getElementById('mes').value),
    cancha: document.getElementById('cancha').value
  };

  try {
    updateStatus('⏳ Iniciando proceso...');
    updateStatus('📡 Extrayendo ID del partido...');
    updateStatus('🌐 Conectando con FIBA LiveStats...');
    updateStatus('📥 Descargando datos del partido...');

    const res = await fetch('/api/parse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, userData })
    });

    updateStatus('🔄 Procesando información...');

    if (!res.ok) {
      const errorBody = await res.json().catch(() => null);
      throw new Error(errorBody?.error || 'Error en la respuesta del servidor');
    }

    const json = await res.json();
    currentParsedData = json;
    
    updateStatus('📊 Estructurando datos...');
    
    document.getElementById('out').value = JSON.stringify(json, null, 2);
    
    updateStatus('✅ ¡Procesamiento completado exitosamente!');
    
    document.getElementById('copyBtn').style.display = 'inline-block';
    if (jwt) {
      document.getElementById('ingresarPartidoBtn').style.display = 'inline-block';
    }
  } catch (error) {
    updateStatus('❌ Error: ' + error.message);
    statusDiv.style.color = 'red';
  }
}

async function ingresarPartido() {
  const statusDiv = document.getElementById('statusMessage');
  
  if (!currentParsedData) {
    statusDiv.textContent = '❌ No hay datos para enviar';
    statusDiv.style.color = 'red';
    return;
  }

  if (!jwt) {
    statusDiv.textContent = '❌ Debes autenticarte primero';
    statusDiv.style.color = 'red';
    return;
  }

  statusDiv.style.display = 'block';
  statusDiv.style.color = 'green';
  statusDiv.textContent = '⏳ Ingresando partido...';
  document.getElementById('ingresarPartidoBtn').disabled = true;

  try {
    // POST del partido
    const postRes = await fetch('https://aguada-stats-api.vercel.app/partidos', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwt}`
      },
      body: JSON.stringify(currentParsedData)
    });

    if (!postRes.ok) {
      const errorBody = await postRes.json().catch(() => null);
      throw new Error(errorBody?.error || `Error al ingresar partido (${postRes.status})`);
    }

    statusDiv.textContent = '✅ Partido ingresado. Obteniendo datos de jugadores...';

    // Extraer jugadores del partido
    let jugadores = [];
    if (currentParsedData.aguadaStats && Array.isArray(currentParsedData.aguadaStats)) {
      jugadores = currentParsedData.aguadaStats;
    }

    if (jugadores.length === 0) {
      statusDiv.textContent = '✅ ¡Partido ingresado exitosamente! (Sin jugadores para actualizar)';
      document.getElementById('ingresarPartidoBtn').disabled = false;
      return;
    }

    statusDiv.textContent = `⏳ Obteniendo datos de ${jugadores.length} jugadores...`;

    // GET de cada jugador desde la API de jugadores
    let jugadoresUpdate = [];
    for (let i = 0; i < jugadores.length; i++) {
      try {
        const playerRes = await fetch(`https://aguada-stats-jugadores-api.vercel.app/jugador/${encodeURIComponent(jugadores[i].jugador)}`);
        if (playerRes.ok) {
          const playerData = await playerRes.json();
          if (Array.isArray(playerData) && playerData.length > 0) {
            jugadoresUpdate.push({ index: i, playerData: playerData[0], stats: jugadores[i] });
          }
        }
      } catch (e) {
        console.warn(`Error obteniendo jugador ${jugadores[i].jugador}:`, e);
      }
    }

    statusDiv.textContent = `✅ Encontrados ${jugadoresUpdate.length} jugadores. Calculando nuevas estadísticas...`;

    // Determinar si Aguada ganó
    const ganado = (currentParsedData.ganado === true) || 
                   (currentParsedData.totalAguadaStats?.totalPuntos > currentParsedData.totalAdversarioStats?.totalPuntos);
    const liga = currentParsedData.liga || 'LFB';

    let updatedCount = 0;

    // Actualizar estadísticas de cada jugador
    for (let i = 0; i < jugadoresUpdate.length; i++) {
      const player = jugadoresUpdate[i].playerData;
      const stats = jugadoresUpdate[i].stats;
      
      try {
        statusDiv.textContent = `⏳ Actualizando: ${player.nombre} (${i + 1}/${jugadoresUpdate.length})`;

        const ganados = ganado ? 1 : 0;
        const perdidos = ganado ? 0 : 1;

        let torneoIndex = -1;
        if (player.torneos) {
          torneoIndex = player.torneos.findIndex(t => t.liga === liga);
        }

        if (torneoIndex === -1) {
          _createNewTorneo(player, stats, ganados, perdidos, liga);
        } else {
          _updateExistingTorneo(player, stats, ganados, perdidos, torneoIndex, liga);
        }

        updatedCount++;
      } catch (e) {
        console.error(`Error al actualizar jugador ${player.nombre}:`, e);
      }
    }

    statusDiv.textContent = `✅ ¡Partido ingresado y ${updatedCount} jugadores actualizados exitosamente!`;
    document.getElementById('ingresarPartidoBtn').disabled = false;
  } catch (error) {
    console.error('Error:', error);
    statusDiv.textContent = '❌ Error: ' + error.message;
    statusDiv.style.color = 'red';
    document.getElementById('ingresarPartidoBtn').disabled = false;
  }
}

// Helper: Crear nueva entrada de torneo
function _createNewTorneo(player, stats, ganados, perdidos, liga) {
  const nuevoTorneo = {
    liga: liga,
    partidos: 1,
    ganados: ganados,
    perdidos: perdidos,
    winPerc: (ganados / 1 * 100).toFixed(2) + '%',
    min: parseFloat(stats.minutos?.replace(':', ',') || 0),
    pts: stats.puntos || 0,
    rd: stats.rebotesDef || 0,
    ro: stats.rebotesOff || 0,
    rt: stats.rebotesTot || 0,
    ast: stats.asistencias || 0,
    stl: stats.robos || 0,
    bls: stats.tapas || 0,
    to: stats.perdidas || 0,
    fls: stats.fouls || 0,
    tch: stats.camposHechos || 0,
    tcl: stats.camposIntent || 0,
    tdh: stats.doblesHechos || 0,
    tdl: stats.doblesIntent || 0,
    tth: stats.triplesHechos || 0,
    ttl: stats.triplesIntent || 0,
    tlh: stats.libresHechos || 0,
    tll: stats.libresIntent || 0
  };

  if (!player.torneos) player.torneos = [];
  player.torneos.push(nuevoTorneo);

  const nuevoTorneoProm = {
    liga: liga,
    mpg: parseFloat(stats.minutos?.replace(':', ',') || 0),
    ppg: stats.puntos || 0,
    rdpg: stats.rebotesDef || 0,
    ropg: stats.rebotesOff || 0,
    rtpg: stats.rebotesTot || 0,
    apg: stats.asistencias || 0,
    spg: stats.robos || 0,
    bpg: stats.tapas || 0,
    topg: stats.perdidas || 0,
    fpg: stats.fouls || 0,
    tchpg: stats.camposHechos || 0,
    tclpg: stats.camposIntent || 0,
    tcperc: stats.camposIntent > 0 ? (stats.camposHechos / stats.camposIntent * 100).toFixed(2) + '%' : '0%',
    tdhpg: stats.doblesHechos || 0,
    tdlpg: stats.doblesIntent || 0,
    tdperc: stats.doblesIntent > 0 ? (stats.doblesHechos / stats.doblesIntent * 100).toFixed(2) + '%' : '0%',
    tthpg: stats.triplesHechos || 0,
    ttlpg: stats.triplesIntent || 0,
    ttperc: stats.triplesIntent > 0 ? (stats.triplesHechos / stats.triplesIntent * 100).toFixed(2) + '%' : '0%',
    tlhpg: stats.libresHechos || 0,
    tllpg: stats.libresIntent || 0,
    tlperc: stats.libresIntent > 0 ? (stats.libresHechos / stats.libresIntent * 100).toFixed(2) + '%' : '0%'
  };

  if (!player.torneosProm) player.torneosProm = [];
  player.torneosProm.push(nuevoTorneoProm);
}

// Helper: Actualizar entrada de torneo existente
function _updateExistingTorneo(player, stats, ganados, perdidos, torneoIndex, liga) {
  const torneo = player.torneos[torneoIndex];
  const nuevosPartidos = torneo.partidos + 1;

  torneo.partidos = nuevosPartidos;
  torneo.ganados = torneo.ganados + ganados;
  torneo.perdidos = torneo.perdidos + perdidos;
  torneo.winPerc = ((torneo.ganados / nuevosPartidos) * 100).toFixed(2) + '%';
  torneo.min = (parseFloat(torneo.min || 0) + parseFloat(stats.minutos?.replace(':', ',') || 0)).toFixed(1);
  torneo.pts = (torneo.pts || 0) + (stats.puntos || 0);
  torneo.rd = (torneo.rd || 0) + (stats.rebotesDef || 0);
  torneo.ro = (torneo.ro || 0) + (stats.rebotesOff || 0);
  torneo.rt = (torneo.rt || 0) + (stats.rebotesTot || 0);
  torneo.ast = (torneo.ast || 0) + (stats.asistencias || 0);
  torneo.stl = (torneo.stl || 0) + (stats.robos || 0);
  torneo.bls = (torneo.bls || 0) + (stats.tapas || 0);
  torneo.to = (torneo.to || 0) + (stats.perdidas || 0);
  torneo.fls = (torneo.fls || 0) + (stats.fouls || 0);
  torneo.tch = (torneo.tch || 0) + (stats.camposHechos || 0);
  torneo.tcl = (torneo.tcl || 0) + (stats.camposIntent || 0);
  torneo.tdh = (torneo.tdh || 0) + (stats.doblesHechos || 0);
  torneo.tdl = (torneo.tdl || 0) + (stats.doblesIntent || 0);
  torneo.tth = (torneo.tth || 0) + (stats.triplesHechos || 0);
  torneo.ttl = (torneo.ttl || 0) + (stats.triplesIntent || 0);
  torneo.tlh = (torneo.tlh || 0) + (stats.libresHechos || 0);
  torneo.tll = (torneo.tll || 0) + (stats.libresIntent || 0);

  // Actualizar promedios
  const torneosProm = player.torneosProm || [];
  if (torneosProm[torneoIndex]) {
    torneosProm[torneoIndex].mpg = (torneo.min / nuevosPartidos).toFixed(2);
    torneosProm[torneoIndex].ppg = (torneo.pts / nuevosPartidos).toFixed(2);
    torneosProm[torneoIndex].rdpg = (torneo.rd / nuevosPartidos).toFixed(2);
    torneosProm[torneoIndex].ropg = (torneo.ro / nuevosPartidos).toFixed(2);
    torneosProm[torneoIndex].rtpg = (torneo.rt / nuevosPartidos).toFixed(2);
    torneosProm[torneoIndex].apg = (torneo.ast / nuevosPartidos).toFixed(2);
    torneosProm[torneoIndex].spg = (torneo.stl / nuevosPartidos).toFixed(2);
    torneosProm[torneoIndex].bpg = (torneo.bls / nuevosPartidos).toFixed(2);
    torneosProm[torneoIndex].topg = (torneo.to / nuevosPartidos).toFixed(2);
    torneosProm[torneoIndex].fpg = (torneo.fls / nuevosPartidos).toFixed(2);
    torneosProm[torneoIndex].tcperc = torneo.tcl > 0 ? (torneo.tch / torneo.tcl * 100).toFixed(2) + '%' : '0%';
    torneosProm[torneoIndex].tdperc = torneo.tdl > 0 ? (torneo.tdh / torneo.tdl * 100).toFixed(2) + '%' : '0%';
    torneosProm[torneoIndex].ttperc = torneo.ttl > 0 ? (torneo.tth / torneo.ttl * 100).toFixed(2) + '%' : '0%';
    torneosProm[torneoIndex].tlperc = torneo.tll > 0 ? (torneo.tlh / torneo.tll * 100).toFixed(2) + '%' : '0%';
  }
}

function copyToClipboard() {
  const textarea = document.getElementById('out');
  textarea.select();
  document.execCommand('copy');
  alert('Resultado copiado al portapapeles');
}

// Inicializar event listeners cuando el DOM esté cargado
document.addEventListener('DOMContentLoaded', function() {
  const inputIds = ['url', 'torneo', 'liga', 'cancha', 'fecha', 'horario', 'fechaLiga', 'dia', 'mes', 'playoffsEtapa', 'posicionAguada', 'posicionAdversario'];
  inputIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', validateInputs);
    }
  });

  const playoffsCheckbox = document.getElementById('playoffs');
  if (playoffsCheckbox) {
    playoffsCheckbox.addEventListener('change', togglePlayoffsFields);
  }

  togglePlayoffsFields();
});
