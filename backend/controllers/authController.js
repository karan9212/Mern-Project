const User = require('../models/User');
const Team = require('../models/Team');
const Aadhaar = require('../models/Aadhaar');
const Seller = require('../models/Seller');
const { DeliveryBoy } = require('../models/DeliveryBoy');
const sendMobileOTP = require('../utils/sendMobileOTP');

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

const otpStore = {};

const withAge = (doc) => {
  if (!doc) return doc;
  const plain = doc.toObject ? doc.toObject() : doc;
  if (!plain.dateOfBirth) return { ...plain, age: null };
  const dob = new Date(plain.dateOfBirth);
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const hasHadBirthday =
    now.getMonth() > dob.getMonth() || (now.getMonth() === dob.getMonth() && now.getDate() >= dob.getDate());
  if (!hasHadBirthday) age -= 1;
  return { ...plain, age };
};

const findByAnyId = async (id) => {
  const normalUser = await User.findOne({ userId: id });
  if (normalUser) return { modelType: 'user', entity: normalUser };

  const teamUser = await Team.findOne({ employeeId: id });
  if (teamUser) return { modelType: 'team', entity: teamUser };

  return { modelType: null, entity: null };
};

const getAadhaarByMobile = async (mobile) => {
  return Aadhaar.findOne({ mobile: String(mobile || '').trim() });
};

const getAadhaarByNumber = async (aadhaarNumber) => {
  return Aadhaar.findOne({ aadhaarNumber: String(aadhaarNumber || '').trim() });
};

const maskPhone = (phoneNo = '') => {
  const cleanPhone = String(phoneNo || '').trim();
  if (cleanPhone.length < 4) return cleanPhone;
  return `******${cleanPhone.slice(-4)}`;
};

const findSellerByLogin = async (sellerId, phoneNo) =>
  Seller.findOne({
    sellerId: String(sellerId || '').trim(),
    sellerContact: String(phoneNo || '').trim()
  });

const findDeliveryBoyByLogin = async (deliveryBoyId, phoneNo) =>
  DeliveryBoy.findOne({
    deliveryBoyId: String(deliveryBoyId || '').trim(),
    phoneNo: String(phoneNo || '').trim()
  });

const sendMobileOtp = async (req, res) => {
  const { mobile, phoneNo, loginAs = 'user', loginId } = req.body;
  const inputPhoneNo = String(phoneNo || mobile || '').trim();

  try {
    if (!/^\d{10}$/.test(inputPhoneNo)) {
      return res.status(400).json({ message: 'Valid 10-digit mobile number is required' });
    }

    // --- Validation logic for Seller/Delivery remains same ---
    if (loginAs === 'seller') {
      if (!loginId) return res.status(400).json({ message: 'Seller ID is required' });
      const seller = await findSellerByLogin(loginId, inputPhoneNo);
      if (!seller) return res.status(400).json({ message: 'Seller ID and phone number do not match' });
      if (seller.sellerStatus === 'deleted') return res.status(403).json({ message: 'This seller account is deleted' });
    }

    if (loginAs === 'delivery') {
      if (!loginId) return res.status(400).json({ message: 'Delivery ID is required' });
      const deliveryBoy = await findDeliveryBoyByLogin(loginId, inputPhoneNo);
      if (!deliveryBoy) return res.status(400).json({ message: 'Delivery ID and phone number do not match' });
      if (deliveryBoy.status === 'deleted') return res.status(403).json({ message: 'This delivery account is deleted' });
    }

    // --- MiniMoth Integration Start ---
    const otp = generateOTP();
    
    // Call the utility and check for success
    const isSent = await sendMobileOTP(inputPhoneNo, otp);

    if (isSent) {
      otpStore[inputPhoneNo] = otp; // Only store if message actually sent
      return res.json({ message: 'OTP sent to mobile number' });
    } else {
      return res.status(500).json({ message: 'Failed to deliver OTP via MiniMoth. Check balance/API Key.' });
    }
  } catch (error) {
    console.error("Controller Error:", error);
    res.status(500).json({ message: 'Failed to send OTP' });
  }
};

const verifyMobileOtp = (req, res) => {
  const { mobile, otp } = req.body;
  if (otpStore[mobile] === otp) {
    delete otpStore[mobile];
    res.json({ message: 'Mobile verified' });
  } else {
    res.status(400).json({ message: 'Invalid OTP' });
  }
};

const sendAadhaarOtp = async (req, res) => {
  const { aadhaar } = req.body;
  const user = await getAadhaarByNumber(aadhaar);

  if (!user) return res.status(400).json({ message: 'Invalid Aadhaar number' });

  try {
    const otp = generateOTP();
    const isSent = await sendMobileOTP(user.mobile, otp);

    if (isSent) {
      otpStore[aadhaar] = otp;
      return res.json({ message: 'OTP sent to Aadhaar linked mobile', mobile: user.mobile });
    } else {
      return res.status(500).json({ message: 'Failed to send Aadhaar OTP via MiniMoth' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to send Aadhaar OTP' });
  }
};

const verifyAadhaarOtp = (req, res) => {
  const { aadhaar, otp } = req.body;
  if (otpStore[aadhaar] === otp) {
    delete otpStore[aadhaar];
    res.json({ message: 'Aadhaar verified' });
  } else {
    res.status(400).json({ message: 'Invalid OTP' });
  }
};

const registerUser = async (req, res) => {
  const { name, mobile, phoneNo } = req.body;
  const inputPhoneNo = String(phoneNo || mobile || '').trim();

  try {
    if (!/^\d{10}$/.test(inputPhoneNo)) {
      return res.status(400).json({ message: 'Valid 10-digit mobile number is required' });
    }

    const aadhaarUser = await getAadhaarByMobile(inputPhoneNo);
    if (!aadhaarUser) {
      return res.status(400).json({ message: 'This mobile number is not linked with Aadhaar' });
    }

    const existingActiveOrInactive = await User.findOne({
      status: { $ne: 'Deleted' },
      $or: [{ aadhaarNumber: aadhaarUser.aadhaarNumber }, { phoneNo: aadhaarUser.mobile }]
    });
    if (existingActiveOrInactive) {
      return res.status(400).json({ message: 'User with same Aadhaar or phone number already exists' });
    }

    const userCount = await User.countDocuments();
    const userNumber = userCount + 1;
    const userCategory = 'NP';
    const userId = `IRUSR${userCategory}${userNumber}`;

    const user = new User({
      name: String(name || '').trim(),
      phoneNo: aadhaarUser.mobile,
      gender: 'other',
      dateOfBirth: null,
      userId,
      userCategory,
      isVerified: true,
      address: aadhaarUser.address || '',
      dateOfJoining: new Date(),
      noOfBookings: 0,
      status: 'Not Active',
      dateOfDeletion: null,
      aadhaarNumber: aadhaarUser.aadhaarNumber,
      profileImage: ''
    });
    await user.save();

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const loginUser = async (req, res) => {
  const { mobile, phoneNo, aadhaar, aadhaarNumber, loginAs = 'user', loginId } = req.body;
  const inputPhoneNo = String(phoneNo || mobile || '').trim();
  const inputAadhaar = String(aadhaarNumber || aadhaar || '').trim();

  try {
    if (['seller', 'delivery'].includes(loginAs) && (!loginId || !inputPhoneNo)) {
      return res.status(400).json({ message: 'Login ID and phone number are required' });
    }

    if (!['seller', 'delivery'].includes(loginAs) && !inputPhoneNo && !inputAadhaar) {
      return res.status(400).json({ message: 'Phone number or Aadhaar is required' });
    }

    if (loginAs === 'seller') {
      const seller = await findSellerByLogin(loginId, inputPhoneNo);
      if (!seller) return res.status(400).json({ message: 'Seller does not exist' });
      if (seller.sellerStatus === 'deleted') {
        return res.status(403).json({ message: 'This seller account is deleted' });
      }

      return res.status(200).json({
        message: 'Seller logged in successfully',
        loginAs,
        user: {
          name: seller.sellerName,
          userId: seller.sellerId,
          profileImage: ''
        }
      });
    }

    if (loginAs === 'delivery') {
      const deliveryBoy = await findDeliveryBoyByLogin(loginId, inputPhoneNo);
      if (!deliveryBoy) return res.status(400).json({ message: 'Delivery user does not exist' });
      if (deliveryBoy.status === 'deleted') {
        return res.status(403).json({ message: 'This delivery account is deleted' });
      }

      return res.status(200).json({
        message: 'Delivery user logged in successfully',
        loginAs,
        user: {
          name: deliveryBoy.deliveryBoyName,
          userId: deliveryBoy.deliveryBoyId,
          profileImage: deliveryBoy.profileImage || ''
        }
      });
    }

    const targetModel = loginAs === 'employee' ? Team : User;
    let user = null;
    if (loginAs === 'user') {
      const lookup = inputAadhaar ? { aadhaarNumber: inputAadhaar } : { phoneNo: inputPhoneNo };
      user = await User.findOne({ ...lookup, status: { $ne: 'Deleted' } }).sort({ _id: -1 });
      if (!user) {
        user = await User.findOne(lookup).sort({ _id: -1 });
      }
    } else {
      user = await targetModel.findOne(inputAadhaar ? { aadhaarNumber: inputAadhaar } : { phoneNo: inputPhoneNo });
    }
    if (!user) return res.status(400).json({ message: 'User does not exist' });

    if (loginAs === 'user' && user.status === 'Deleted') {
      return res.status(403).json({ message: 'This account is deleted' });
    }

    if (loginAs === 'user') {
      if (!user.aadhaarNumber) {
        const legacyAadhaar = user.get ? user.get('aadhaar') : undefined;
        const aadhaarFromInput = inputAadhaar || '';
        const aadhaarFromDb = await getAadhaarByMobile(user.phoneNo);
        const aadhaarFromData = aadhaarFromDb?.aadhaarNumber || '';
        const resolvedAadhaar = String(aadhaarFromInput || legacyAadhaar || aadhaarFromData).trim();

        if (resolvedAadhaar) {
          user.aadhaarNumber = resolvedAadhaar;
        } else {
          return res.status(400).json({ message: 'Aadhaar number missing for this account. Please contact admin.' });
        }
      }

      await User.findOneAndUpdate(
        { userId: user.userId },
        { $set: { status: 'Active', aadhaarNumber: user.aadhaarNumber } },
        { runValidators: true }
      );
    } else {
      await Team.findOneAndUpdate(
        { employeeId: user.employeeId },
        { $set: { status: 'Active' } },
        { runValidators: true }
      );
    }

    res.status(200).json({
      message: 'User logged in successfully',
      loginAs,
      user: {
        name: user.name,
        userId: user.userId || user.employeeId,
        profileImage: user.profileImage || ''
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const recoverPortalAccess = async (req, res) => {
  const { loginAs, companyEmail } = req.body;
  const cleanEmail = String(companyEmail || '').trim().toLowerCase();

  if (!['seller', 'delivery'].includes(loginAs)) {
    return res.status(400).json({ message: 'Recovery is available only for seller and delivery portals' });
  }

  try {
    const target = loginAs === 'seller' 
      ? await Seller.findOne({ companyEmail: cleanEmail }) 
      : await DeliveryBoy.findOne({ companyEmail: cleanEmail });

    if (!target) return res.status(404).json({ message: 'No account registered with this email' });

    const targetPhone = loginAs === 'seller' ? target.sellerContact : target.phoneNo;
    const targetLoginId = loginAs === 'seller' ? target.sellerId : target.deliveryBoyId;

    const otp = generateOTP();
    const isSent = await sendMobileOTP(targetPhone, otp);

    if (isSent) {
      otpStore[targetPhone] = otp;
      return res.status(200).json({
        message: 'Recovery OTP sent to the registered phone number',
        loginId: targetLoginId,
        maskedPhone: maskPhone(targetPhone),
        phoneNo: targetPhone
      });
    } else {
      return res.status(500).json({ message: 'MiniMoth failed to send recovery OTP' });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to start account recovery' });
  }
};

const getUserProfile = async (req, res) => {
  const { userId } = req.params;

  try {
    const { entity, modelType } = await findByAnyId(userId);
    if (!entity || !modelType) return res.status(404).json({ message: 'User not found' });

    res.status(200).json({
      user: {
        name: entity.name,
        userId: entity.userId || entity.employeeId,
        profileImage: entity.profileImage || '',
        loginAs: modelType === 'team' ? 'employee' : 'user',
        phoneNo: entity.phoneNo || '',
        gender: entity.gender || 'other',
        dateOfBirth: entity.dateOfBirth || null,
        address: entity.address || '',
        status: entity.status || 'Not Active',
        dateOfJoining: entity.dateOfJoining || null,
        department: modelType === 'team' ? entity.department || '' : '',
        position: modelType === 'team' ? entity.position || '' : '',
        employeeType: modelType === 'team' ? entity.employeeType || ['team'] : [],
        dateOfExit: modelType === 'team' ? entity.dateOfExit || null : null,
        education: modelType === 'team' ? entity.education || [] : [],
        documents: modelType === 'team' ? entity.documents || [] : [],
        userCategory: modelType === 'user' ? entity.userCategory || '' : '',
        noOfBookings: modelType === 'user' ? entity.noOfBookings || 0 : 0
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateProfileImage = async (req, res) => {
  const { userId, profileImage } = req.body;

  if (!userId || !profileImage) {
    return res.status(400).json({ message: 'userId and profileImage are required' });
  }

  try {
    const { modelType } = await findByAnyId(userId);
    if (!modelType) return res.status(404).json({ message: 'User not found' });

    const model = modelType === 'user' ? User : Team;
    const idKey = modelType === 'user' ? 'userId' : 'employeeId';

    const user = await model.findOneAndUpdate({ [idKey]: userId }, { $set: { profileImage } }, { new: true });

    res.status(200).json({
      message: 'Profile image updated successfully',
      user: {
        userId: user.userId || user.employeeId,
        profileImage: user.profileImage || ''
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteUserAccount = async (req, res) => {
  const { userId } = req.params;

  try {
    const normalUser = await User.findOne({ userId });
    if (normalUser) {
      normalUser.status = 'Deleted';
      normalUser.dateOfDeletion = new Date();
      await normalUser.save();
      return res.status(200).json({ message: 'Account deleted successfully' });
    }

    const teamMember = await Team.findOneAndDelete({ employeeId: userId });
    if (!teamMember) return res.status(404).json({ message: 'User not found' });

    res.status(200).json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const logoutUser = async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ message: 'userId is required' });
  }

  try {
    const updatedUser = await User.findOneAndUpdate(
      { userId },
      { $set: { status: 'Not Active' } },
      { new: true }
    );

    if (updatedUser) {
      return res.status(200).json({ message: 'User marked as Not Active' });
    }

    const updatedEmployee = await Team.findOneAndUpdate(
      { employeeId: userId },
      { $set: { status: 'Not Active' } },
      { new: true }
    );

    if (!updatedEmployee) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({ message: 'Employee marked as Not Active' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({})
      .select(
        'name phoneNo gender dateOfBirth userId userCategory isVerified address dateOfJoining noOfBookings status dateOfDeletion aadhaarNumber profileImage'
      )
      .sort({ _id: -1 });

    const normalizedUsers = users.map((u) => withAge(u));

    res.status(200).json({ users: normalizedUsers });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateUser = async (req, res) => {
  const { userId } = req.params;
  const {
    name,
    phoneNo,
    gender,
    dateOfBirth,
    userCategory,
    isVerified,
    address,
    dateOfJoining,
    noOfBookings,
    status,
    dateOfDeletion,
    aadhaarNumber,
    profileImage
  } = req.body;

  try {
    const existingUser = await User.findOne({ userId });
    if (!existingUser) return res.status(404).json({ message: 'User not found' });

    const updatePayload = {};
    if (typeof name !== 'undefined') updatePayload.name = String(name).trim();
    if (typeof phoneNo !== 'undefined') updatePayload.phoneNo = String(phoneNo).trim();
    if (typeof gender !== 'undefined') updatePayload.gender = gender;
    if (typeof dateOfBirth !== 'undefined') updatePayload.dateOfBirth = dateOfBirth || null;
    if (typeof userCategory !== 'undefined') updatePayload.userCategory = userCategory;
    if (typeof isVerified !== 'undefined') updatePayload.isVerified = Boolean(isVerified);
    if (typeof address !== 'undefined') updatePayload.address = String(address).trim();
    if (typeof dateOfJoining !== 'undefined') updatePayload.dateOfJoining = dateOfJoining || null;
    if (typeof noOfBookings !== 'undefined') updatePayload.noOfBookings = Number(noOfBookings) || 0;
    if (typeof status !== 'undefined') updatePayload.status = status;
    if (typeof dateOfDeletion !== 'undefined') updatePayload.dateOfDeletion = dateOfDeletion || null;
    if (typeof aadhaarNumber !== 'undefined') updatePayload.aadhaarNumber = String(aadhaarNumber).trim();
    if (typeof profileImage !== 'undefined') updatePayload.profileImage = profileImage || '';

    if (Object.keys(updatePayload).length === 0) {
      return res.status(400).json({ message: 'No update fields provided' });
    }

    if (updatePayload.phoneNo || updatePayload.aadhaarNumber) {
      const duplicateQuery = { userId: { $ne: userId }, $or: [] };
      if (updatePayload.phoneNo) duplicateQuery.$or.push({ phoneNo: updatePayload.phoneNo });
      if (updatePayload.aadhaarNumber) duplicateQuery.$or.push({ aadhaarNumber: updatePayload.aadhaarNumber });

      const duplicate = await User.findOne(duplicateQuery);
      if (duplicate) {
        return res.status(400).json({ message: 'Another user already uses this phone number or Aadhaar' });
      }
    }

    const updatedUser = await User.findOneAndUpdate(
      { userId },
      { $set: updatePayload },
      { new: true, runValidators: true }
    );
    res.status(200).json({ message: 'User updated successfully', user: withAge(updatedUser) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getAadhaarData = async (req, res) => {
  try {
    const records = await Aadhaar.find({})
      .select('name age gender dateOfBirth address aadhaarNumber mobile')
      .sort({ updatedAt: -1, _id: -1 });
    res.status(200).json({ records });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const upsertAadhaarData = async (req, res) => {
  const { name, age, gender, dateOfBirth, address, aadhaarNumber, mobile } = req.body;
  const cleanAadhaar = String(aadhaarNumber || '').trim();
  const cleanMobile = String(mobile || '').trim();
  const cleanGender = String(gender || 'other').trim().toLowerCase();
  const cleanDob = dateOfBirth ? new Date(dateOfBirth) : null;
  const hasAge = String(age ?? '').trim() !== '';
  const parsedAge = hasAge ? Number(age) : null;

  if (!name || !cleanAadhaar || !cleanMobile) {
    return res.status(400).json({ message: 'name, aadhaarNumber and mobile are required' });
  }

  if (!/^\d{12}$/.test(cleanAadhaar)) {
    return res.status(400).json({ message: 'Aadhaar number must be 12 digits' });
  }

  if (!/^\d{10}$/.test(cleanMobile)) {
    return res.status(400).json({ message: 'Mobile number must be 10 digits' });
  }

  if (!['male', 'female', 'other'].includes(cleanGender)) {
    return res.status(400).json({ message: 'Gender must be male, female or other' });
  }

  if (dateOfBirth && Number.isNaN(cleanDob.getTime())) {
    return res.status(400).json({ message: 'dateOfBirth must be a valid date' });
  }

  if (hasAge && (!Number.isFinite(parsedAge) || parsedAge < 0)) {
    return res.status(400).json({ message: 'Age must be a valid non-negative number' });
  }

  try {
    const existingByAadhaar = await Aadhaar.findOne({ aadhaarNumber: cleanAadhaar });
    const existingByMobile = await Aadhaar.findOne({ mobile: cleanMobile });

    if (existingByAadhaar && existingByMobile && String(existingByAadhaar._id) !== String(existingByMobile._id)) {
      return res.status(400).json({ message: 'Aadhaar and mobile belong to different records' });
    }

    const target = existingByAadhaar || existingByMobile;
    if (target) {
      target.name = String(name).trim();
      target.age = parsedAge;
      target.gender = cleanGender;
      target.dateOfBirth = cleanDob;
      target.address = String(address || '').trim();
      target.aadhaarNumber = cleanAadhaar;
      target.mobile = cleanMobile;
      await target.save();
      return res.status(200).json({ message: 'Aadhaar data updated successfully', record: target });
    }

    const created = await Aadhaar.create({
      name: String(name).trim(),
      age: parsedAge,
      gender: cleanGender,
      dateOfBirth: cleanDob,
      address: String(address || '').trim(),
      aadhaarNumber: cleanAadhaar,
      mobile: cleanMobile
    });
    return res.status(201).json({ message: 'Aadhaar data created successfully', record: created });
  } catch (error) {
    console.error(error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Aadhaar number or mobile already exists' });
    }
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  sendMobileOtp,
  verifyMobileOtp,
  sendAadhaarOtp,
  verifyAadhaarOtp,
  registerUser,
  loginUser,
  getUserProfile,
  updateProfileImage,
  deleteUserAccount,
  logoutUser,
  getAllUsers,
  updateUser,
  getAadhaarData,
  upsertAadhaarData,
  recoverPortalAccess
};
