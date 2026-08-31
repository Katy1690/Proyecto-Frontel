const mongoose = require('mongoose');

const AtencionSchema = new mongoose.Schema({
  rut_cliente: { type: String, required: true },
  num_cliente: { type: String, default: 'No especificado' },
  cronometro: { type: Date, default: Date.now },
  motivo_final: { type: String, enum: ['pago', 'convenio', 'reclamo', 'comercial', 'tecnico', 'otros'], default: 'pago' },
  estado_final: {type: String, enum: ['concluido', 'derivado'], default: 'concluido' }
});

module.exports = mongoose.model('Atencion', AtencionSchema);