const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  message: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Note', noteSchema);