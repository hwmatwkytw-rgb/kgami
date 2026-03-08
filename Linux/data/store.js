const mongoose = require('mongoose');
const log = require('../logger');

const storeSchema = new mongoose.Schema({
  name: String,
  type: String,
  count: Number,
  info: String,
  prize: Number,
  owner: String
});

const Store = mongoose.model('Store', storeSchema);

async function getItem(name) {
  try {
    const ware = await Store.findOne({ name });
    if (!ware) {
      log.warn(`item with name ${name} is not defined`);
    }
    return ware;
  } catch (e) {
    log.error(e);
    return null;
  }
}

async function saveItem(newWare) {
  try {
    const ware = new Store(newWare);
    await ware.save();
    log.success('New item added to the store!');
  } catch (e) {
    log.error(e);
  }
}

async function deleteIteam(name) {
  try {
    const deletedWare = await Store.findOneAndDelete({ name });
    if (!deletedWare) {
      log.error('Error in deleting item!');
    }
  } catch (e) {
    logger.error(e);
  }
}

async function updateItem(name, update) {
  try {
    const ware = await Store.findOneAndUpdate({ name }, update, { new: true });
    if (!ware) {
      throw new Error(`item with name ${name} not found`);
    }
    log.success('Ware updated successfully');
    return ware;
  } catch (error) {
    log.error('Error updating item: ' + error);
    throw error;
  }
}

async function getAllItems() {
  try {
    const ware = await Store.find();
    return ware;
  } catch (e) {
    log.error(e);
    return [];
  }
}

module.exports = {
  getItem,
  saveItem,
  deleteItem,
  updateItem,
  getAllItems 
};
