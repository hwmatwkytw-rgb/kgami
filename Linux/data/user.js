// data/user
const mongoose = require("mongoose");
const log = require("../logger");

const userSchema = new mongoose.Schema({
  id: { type: String },
  diamond: { type: Number, default: 0 },
  money: { type: Number, default: 0 },
  gold: { type: Number, default: 0 },
  lastJobTime: { type: Number },
  lastJobDay: { type: String },
  status: {},
  character: {
    location: { type: String, default: 'الخرطوم' },
    type: { type: String },
    battle: {
      status: { type: Boolean, default: false },
      opponent: { type: String }
    },
    name: { type: String },
    level: { type: Number, default: 1 },
    rating: { type: Number, default: 0 },
    bar: { type: Array, default: [] },
    ATK: { type: Number },
    XATK: { type: Number },
    DEF: { type: Number },
    XDEF: { type: Number },
    HP: { type: Number },
    XHP: { type: Number },
    SPD: { type: Number },
    XSPD: { type: Number },
    IQ: { type: Number },
    XIQ: { type: Number },
    text: { type: String },
    skills: [{
      name: { type: String },
      dmg: {
        min: { type: Number },
        max: { type: Number }
      },
      description: { type: String },
      effect: { type: String },
      type: { type: String },
      limitUse: { type: Number }
    }],
    img: { type: String },
    
  },
  wolf: [{
    name: { type: String },
    HP: { type: Number },
    ATK: { type: Number },
    DEF: { type: Number },
    size: { type: Number },
    SPD: { type: Number },
    price: { type: Number },
    exp: { type: Number },
    image: { type: String }
  }],
  cave: {
    exp: { type: Number },
    weapon: [{
      category: { type: String },
      isUsed: {type: Boolean },
      name: { type: String },
      HP: { type: Number },
      ATK: { type: Number },
      DEF: { type: Number },
      SPD: { type: Number },
      hpBonus: { type: Number },
      dmgBonus: { type: Number },
      defBonus: { type: Number },
      spdBonus: { type: Number },
      ArmorPiercing: { type: Number },
      image: { type: String }
    }]
  }
});

const User = mongoose.model('User', userSchema);

async function saveUser(newUser) {
  try {
    const user = new User(newUser);
    await user.save();
    log.info('New user saved');
    return user;
  } catch (error) {
    log.error('Error saving ' + error);
    throw error;
  }
}

async function getUser(id) {
  try {
    const user = await User.findOne({ id });
    if (!user) log.warn(`User with ID ${id} not found`);
    return user;
  } catch (error) {
    log.error(error);
    return null;
  }
}

async function deleteUser(id) {
  try {
    const deletedUser = await User.findOneAndDelete({ id });
    if (!deletedUser) throw new Error(`User with ID ${id} not found`);
    log.info('User deleted successfully');
  } catch (error) {
    log.error('Error deleting user:' + error);
    throw error;
  }
}

async function updateUser(id, updatedData) {
  try {
    const user = await User.findOneAndUpdate({ id }, updatedData, { new: true });
    if (!user) throw new Error(`User with ID ${id} not found`);
    log.info(`User ${id} updated`);
    return user;
  } catch (error) {
    log.error('Error updating user:' + error);
    throw error;
  }
}

async function getAllUsers() {
  try {
    const users = await User.find();
    return users;
  } catch (error) {
    log.error('Error fetching all users: ' + error);
    throw error;
  }
}

module.exports = {
  getUser,
  updateUser,
  deleteUser,
  saveUser,
  getAllUsers
};
