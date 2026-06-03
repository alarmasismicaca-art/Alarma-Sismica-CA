const socket = io('http://localhost:3000');
let ultimaActualizacion = Date.now();

function actualizarReloj() {
    const fecha = new Date();
    const formatter = new Intl.DateTimeFormat('es-ES', {
        timeZone: 'America/Bogota',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });
    const partes = formatter.formatToParts(fecha);
    const mapFecha = {};
    partes.forEach(p => { mapFecha[p.type] = p.value; });
    const fechaString = `${mapFecha.day} / ${mapFecha.month} / ${mapFecha.year}`;
    const horaString = `${mapFecha.hour}:${mapFecha.minute}:${mapFecha.second}`;
    document.getElementById('horaActual')?.textContent = horaString;
    document.getElementById('fechaActual')?.textContent = fechaString;
}

socket.on('connect', () => setConnectionState(true));
socket.on('disconnect', () => setConnectionState(false));

function agregarAlerta(titulo, fecha, estado, nivel = 'warning') {
    const lista = document.getElementById('alertas');
    const item = document.createElement('li');
    const estadoClass = nivel === 'green' ? 'green' : nivel === 'warning' ? 'warning' : 'red';
    item.className = `alert-item alert-item--${estadoClass}`;
    item.innerHTML = `
        <div>
            <p class="alert-type">${titulo}</p>
            <p class="alert-time">${fecha}</p>
        </div>
        <span class="alert-badge alert-badge--${estadoClass}">${estado}</span>
    `;
    lista.prepend(item);
    while (lista.children.length > 5) {
        lista.removeChild(lista.lastChild);
    }
}

function setConnectionState(connected) {
    const conexion = document.getElementById('conexion');
    conexion.textContent = connected ? '● CONECTADO' : '● DESCONECTADO';
    conexion.style.color = connected ? '#4ade80' : '#ff5a5a';
}

function setSystemStatus(id, value) {
    const element = document.getElementById(id);
    const isConnected = value !== false && value !== null && value !== undefined && value !== '';
    const statusText = isConnected ? (typeof value === 'string' ? value.toUpperCase() : 'CONECTADO') : 'DESCONECTADO';
    const statusType = isConnected ? 'online' : 'offline';
    element.textContent = statusText;
    element.className = `system-status system-status--${statusType}`;
}

socket.on('estado', data => {
    ultimaActualizacion = Date.now();
    setConnectionState(true);

    setSystemStatus('wifi', data.wifi);
    setSystemStatus('esp32', data.esp32);
    setSystemStatus('relay', data.relay);
    setSystemStatus('sirena', data.sirena);
    setSystemStatus('firebase', data.firebase);

    const magnitud = typeof data.magnitud === 'number' ? data.magnitud : 0;
    document.getElementById('magnitud').textContent = magnitud.toFixed(1);

    const ubicacion = data.ubicacion || 'Ubicación no disponible';
    const tieneSismo = magnitud >= 3.5;
    document.getElementById('estadoSismo').textContent = tieneSismo ? `SISMO DETECTADO EN ${ubicacion}` : 'SIN EVENTOS SÍSMICOS';
    document.getElementById('sismoEstado').textContent = tieneSismo ? 'ALERTA SÍSMICA ACTIVA' : 'MONITOREO EN TIEMPO REAL';
    document.getElementById('sismoDetalle').textContent = tieneSismo ? `Ubicación: ${ubicacion} | Magnitud: ${magnitud.toFixed(1)}` : 'El sistema está monitoreando actividad sísmica constante.';

    if (tieneSismo) {
        agregarAlerta(`SISMO DETECTADO EN ${ubicacion}`, new Date().toLocaleString('es-ES'), magnitud.toFixed(1), magnitud >= 5 ? 'red' : 'warning');
    }
});

setInterval(() => {
    actualizarReloj();
    if (Date.now() - ultimaActualizacion > 10000) {
        setConnectionState(false);
        setSystemStatus('esp32', false);
        setSystemStatus('wifi', false);
        setSystemStatus('relay', false);
        setSystemStatus('sirena', false);
        setSystemStatus('firebase', false);
        document.getElementById('estadoSismo').textContent = 'SIN CONEXIÓN AL SENSOR';
        document.getElementById('sismoEstado').textContent = 'NO HAY DATOS EN TIEMPO REAL';
        document.getElementById('sismoDetalle').textContent = 'Esperando conexión con el ESP32 desde Bogotá, Colombia...';
    }
}, 1000);

function activarAlarma() {
    fetch('http://localhost:3000/activar', { method: 'POST' });
}

function desactivarAlarma() {
    fetch('http://localhost:3000/desactivar', { method: 'POST' });
}

actualizarReloj();
