const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const Atencion = require('./Atencion');
const Usuario = require('./Usuario');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Conexión a MongoDB (MongoDB Atlas en la nube)
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://katherinegonzalezs_db_user:258456katy@cluster0.alk7ylw.mongodb.net/frontel_db?retryWrites=true&w=majority';

mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ Conectado exitosamente a MongoDB Atlas'))
  .catch((err) => console.error('❌ Error al conectar a MongoDB Atlas:', err));

// --- RUTAS DE LA API ---

app.post('/api/login', async (req, res) => {
  try {
    const { admin_rut_ejecutivo, admin_pass_ejecutivo } = req.body;
    
    // Busca al usuario en la colección por RUT y Contraseña
    const usuario = await Usuario.findOne({ 
      admin_rut_ejecutivo, 
      admin_pass_ejecutivo 
    });

    if (usuario) {
      res.json({
        mensaje: 'Autenticación exitosa',
        nombre: usuario.admin_nombre_ejecutivo,
        rol: usuario.admin_rol_ejecutivo
      });
    } else {
      res.status(401).json({ mensaje: 'RUT o contraseña incorrectos' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Iniciar una atención
app.post('/api/atenciones', async (req, res) => {
  try {
    const nuevaAtencion = new Atencion(req.body);
    await nuevaAtencion.save();
    res.status(201).json({ mensaje: 'Atención guardada correctamente en MongoDB', atencion: nuevaAtencion });
  } catch (error) {
    console.error('Error al guardar atención:', error);
    res.status(500).json({ error: 'Error al registrar la atención' });
  }
});

// Obtener todas las atenciones (o filtradas por sucursal)
app.get('/api/atenciones', async (req, res) => {
  try {
    const { sede_id } = req.query;
    const filtro = sede_id ? { sede_id } : {};
    const atenciones = await Atencion.find(filtro).sort({ hora_inicio: -1 });
    res.json(atenciones);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Finalizar una atención (Cálculo automático de tiempo)
app.put('/api/atenciones/:id/finalizar', async (req, res) => {
  try {
    const atencion = await Atencion.findById(req.params.id);
    if (!atencion) return res.status(404).json({ mensaje: 'Atención no encontrada' });

    const horaFin = new Date();
    const duracionMs = horaFin - new Date(atencion.hora_inicio);
    const duracionMin = parseFloat((duracionMs / 60000).toFixed(2));

    atencion.hora_fin = horaFin;
    atencion.duracion_minutos = duracionMin;
    atencion.estado = 'Finalizado';
    atencion.resolucion = req.body.resolucion || 'Resuelto';

    const actualizada = await atencion.save();
    res.json(actualizada);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Ruta para que el Administrador registre nuevos Ejecutivos
app.post('/api/usuarios', async (req, res) => {
  try {
    const nuevoUsuario = new Usuario(req.body);
    const guardado = await nuevoUsuario.save();
    res.status(201).json(guardado);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Obtener todos los ejecutivos desde MongoDB
app.get('/api/usuarios', async (req, res) => {
  try {
    const usuarios = await Usuario.find();
    res.json(usuarios);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Ruta para eliminar un usuario por ID
app.delete('/api/usuarios/:id', async (req, res) => {
  try {
    await Usuario.findByIdAndDelete(req.params.id);
    res.json({ mensaje: 'Usuario eliminado con éxito' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar usuario' });
  }
});

// Ruta para editar un usuario por ID
app.put('/api/usuarios/:id', async (req, res) => {
  try {
    const usuarioActualizado = await Usuario.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(usuarioActualizado);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar usuario' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor ejecutándose en http://localhost:${PORT}`);
});