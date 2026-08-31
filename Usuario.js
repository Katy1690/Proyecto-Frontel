const mongoose = require('mongoose');

const UsuarioSchema = new mongoose.Schema({
  admin_rut_ejecutivo: { type: String, required: true },
  admin_nombre_ejecutivo: { type: String, required: true },
  admin_pass_ejecutivo: { type: String, required: true },
  admin_rol_ejecutivo: { type: String, enum: ['ejecutivo', 'admin'], default: 'Ejecutivo' }
});

module.exports = mongoose.model('Usuario', UsuarioSchema);