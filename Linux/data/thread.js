const mongoose = require('mongoose');
const log = require('../logger'); // تأكد من أن المسار صحيح لملف logger


const groupSchema = new mongoose.Schema({
  id: String,
  emoji: String,
  name: String,
  img: String,
  
  // حقل الحالة والمجدول (المعدل)
  status: {
    on: {type: Boolean, default: true},
    // تخزين أوقات الصلاة كأرقام (Timestamps) لتسهيل المقارنة والحفظ
    prayerTimes: {
      type: Object, 
      default: { date: '' } // مثال: { date: 'Sat Dec 06 2025', Fajr: 1672502400000, ... }
    },
    // تسجيل حالة إرسال كل صلاة لضمان عدم التكرار في اليوم الواحد
    lastPrayerSend: { 
      type: Object, 
      default: {} // مثال: { Fajr: false, Dhuhr: false, ... }
    },
    lastPrayerDate: {type: String, default: ''}, // يمكن الاحتفاظ به أو إزالته إذا كان lastPrayerSend كافياً
    lastAthkarDate: {type: String, default: ''},
    lastAyatSend: {type: Number, default: 0}
  },

  // حقول الحماية الشاملة (المضافة بناءً على طلبك السابق)
  Protection: {type: Boolean, default: false},
  AutoSetNickName: {type: Boolean, default: false},
  anti: {
    type: Object,
    default: {
      nameBox: false,       // حماية اسم المجموعة 
      nicknameBox: false,   // حماية كنى الأعضاء
      icon: false,          // حماية أيقونة المجموعة
      approvalMode: false,  // حماية وضع الموافقة
    }
  },
  oldNicknames: { type: Object, default: {} },
  approvalMode: { type: Boolean, default: false },
  
  // ... باقي الحقول الأصلية
  messageCount: { type: Number, default: 0 },
  members: { type: Array, default: [] },
  admins: { type: Array, default: [] },
  banned: { type: Boolean, default: false },
  
});

// نموذج المجموعة
const Group = mongoose.model('Group', groupSchema);


async function saveGroup(newGroup) {
  try {
    const exists = await Group.findOne({ id: newGroup.id });
    if (exists) {
      log.warn(`Group with ID ${newGroup.id} already exists.`);
      return exists;
    }
    const group = new Group(newGroup);
    await group.save();
    log.info(`New group saved successfully with ID ${newGroup.id}`);
    return group;
  } catch (error) {
    log.error(`Error saving new group with ID ${newGroup.id}:` + error);
    throw error;
  }
}


async function getGroup(id) {
  try {
    const group = await Group.findOne({ id })
    if (!group) {
      log.warn(`Group with ID ${id} not found`);
      return null
    }
    return group;
  } catch (error) {
    log.error(`Error fetching group data for ID ${id}:` + error);
    return null;
  }
}


async function deleteGroup(id) {
  try {
    const deletedGroup = await Group.findOneAndDelete({ id });
    if (!deletedGroup) {
      throw new Error(`Group with ID ${id} not found`);
    }
    log.info(`Group with ID ${id} deleted successfully`);
  } catch (error) {
    log.error(`Error deleting group with ID ${id}:` + error);
    throw error;
  }
}


async function updateGroup(id, updatedData) {
  try {
    // استخدام { new: true } لإرجاع الوثيقة المحدثة بعد التعديل
    // نستخدم findOneAndUpdate لتحديث الحقول (بما في ذلك الحقول المتداخلة مثل status.prayerTimes)
    const group = await Group.findOneAndUpdate({ id }, updatedData, { new: true });
    if (!group) {
      throw new Error(`Group with ID ${id} not found`);
    }
    log.info(`Group with ID ${id} updated successfully`);
    return group;
  } catch (error) {
    log.error(`Error updating group with ID ${id}:` + error);
    throw error;
  }
}


async function getAllGroups() {
  try {
    // تم إضافة هذه الدالة لدعم الجدولة العامة
    const groups = await Group.find(); 
    return groups;
  } catch (error) {
    log.error('Error fetching all Groups: ' + error);
    throw error;
  }
}


module.exports = {
  saveGroup,
  getGroup,
  deleteGroup,
  updateGroup,
  getAllGroups
}

