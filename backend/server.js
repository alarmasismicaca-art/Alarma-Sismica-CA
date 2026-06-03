const path = require('path');
const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

const server = require('http').createServer(app);
const io = require('socket.io')(server, {
    cors: { origin: '*' }
});

let ultimoEstado = {
    wifi: 'CONECTADO',
    esp32: 'ONLINE',
    relay: 'ACTIVO',
    sirena: 'CONECTADO',
    firebase: 'CONECTADO',
    magnitud: 0,
    ubicacion: 'Bogotá, Colombia',
    _actualizado: Date.now(),
    _manual: false
};

const ubicaciones = [
    'Bogotá, Colombia',
    'Medellín, Colombia',
    'Cali, Colombia',
    'Bucaramanga, Colombia',
    'Cartagena, Colombia'
];

function emitirEstado(estado) {
    io.emit('estado', estado);
}

io.on('connection', socket => {
    socket.emit('estado', ultimoEstado);
});

app.post('/estado', (req, res) => {
    ultimoEstado = {
        ...req.body,
        _actualizado: Date.now(),
        _manual: true
    };
    emitirEstado(ultimoEstado);
    res.send('OK');
});

app.post('/activar', (req, res) => {
    emitirEstado({
        ...ultimoEstado,
        sirena: 'ACTIVA',
        _actualizado: Date.now(),
        _manual: false
    });
    res.send('OK');
});

app.post('/desactivar', (req, res) => {
    emitirEstado({
        ...ultimoEstado,
        sirena: 'INACTIVA',
        _actualizado: Date.now(),
        _manual: false
    });
    res.send('OK');
});

setInterval(() => {
    const ahora = Date.now();
    if (ahora - ultimoEstado._actualizado < 30000 && ultimoEstado._manual) {
        return;
    }

    const wifiOn = Math.random() > 0.15;
    const esp32On = Math.random() > 0.1;
    const relayOn = Math.random() > 0.15;
    const sirenaOn = Math.random() > 0.1;
    const firebaseOn = Math.random() > 0.08;
    const sismoActivo = Math.random() > 0.7;
    const magnitud = sismoActivo ? Number((Math.random() * 3 + 4.0).toFixed(1)) : 0;
    const ubicacion = sismoActivo ? ubicaciones[Math.floor(Math.random() * ubicaciones.length)] : 'Sin eventos';

    ultimoEstado = {
        wifi: wifiOn ? 'CONECTADO' : false,
        esp32: esp32On ? 'ONLINE' : false,
        relay: relayOn ? 'ACTIVO' : false,
        sirena: sirenaOn ? 'CONECTADO' : false,
        firebase: firebaseOn ? 'CONECTADO' : false,
        magnitud,
        ubicacion,
        _actualizado: ahora,
        _manual: false
    };

    emitirEstado(ultimoEstado);
}, 12000);

server.listen(3000, () => {
    console.log('Servidor iniciado en http://localhost:3000');
});
