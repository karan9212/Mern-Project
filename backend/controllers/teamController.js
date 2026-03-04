const Team = require('../models/Team');

const getNextEmployeeId = async () => {
  const lastTeam = await Team.findOne({ employeeId: /^IR\d+$/ })
    .sort({ _id: -1 })
    .select('employeeId');

  const lastNumber = lastTeam ? Number(String(lastTeam.employeeId).replace('IR', '')) || 0 : 0;
  const nextNumber = lastNumber + 1;
  return `IR${String(nextNumber).padStart(2, '0')}`;
};

const normalizeEmployeeType = (employeeTypeInput) => {
  const raw = Array.isArray(employeeTypeInput) ? employeeTypeInput : [employeeTypeInput];
  const cleaned = raw.filter(Boolean);
  return cleaned.length > 0 ? [...new Set(cleaned)] : ['team'];
};

const normalizeStatus = (input) => {
  if (typeof input === 'undefined' || input === null || input === '') return undefined;
  const value = String(input).trim();
  if (value === 'Working') return 'Active';
  if (value === 'Not Working') return 'Not Active';
  if (['Active', 'Not Active', 'Deleted'].includes(value)) return value;
  return undefined;
};

const withAge = (doc) => {
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

const mapPayload = (body) => {
  const recruitedVia = body.recruitedVia || (body.referralBy ? 'referral' : undefined);
  const mappedStatus = normalizeStatus(typeof body.status !== 'undefined' ? body.status : body.workingStatus);

  return {
    name: typeof body.name !== 'undefined' ? String(body.name).trim() : undefined,
    phoneNo: typeof body.phoneNo !== 'undefined' ? String(body.phoneNo).trim() : undefined,
    gender: body.gender,
    dateOfBirth: typeof body.dateOfBirth !== 'undefined' ? body.dateOfBirth : undefined,
    employeeType: typeof body.employeeType !== 'undefined' ? normalizeEmployeeType(body.employeeType) : undefined,
    department: body.department,
    position: body.position,
    address: typeof body.address !== 'undefined' ? String(body.address).trim() : undefined,
    education: Array.isArray(body.education) ? body.education : undefined,
    experience: typeof body.experience !== 'undefined' ? String(body.experience) : undefined,
    recruitedVia,
    referralBy: body.referralBy
      ? {
          name: String(body.referralBy.name || '').trim(),
          employeeId: String(body.referralBy.employeeId || '').trim()
        }
      : undefined,
    dateOfJoining: body.dateOfJoining,
    status: typeof mappedStatus !== 'undefined' ? mappedStatus : undefined,
    dateOfExit: typeof body.dateOfExit !== 'undefined' ? body.dateOfExit : undefined,
    aadhaarNumber: typeof body.aadhaarNumber !== 'undefined' ? String(body.aadhaarNumber).trim() : undefined,
    profileImage: typeof body.profileImage !== 'undefined' ? body.profileImage : undefined
  };
};

const getAllTeams = async (req, res) => {
  try {
    const { employeeType } = req.query;
    const filter = {};
    if (employeeType) filter.employeeType = employeeType;

    const users = await Team.find(filter)
      .select(
        'name phoneNo gender dateOfBirth employeeId employeeType department position address education experience recruitedVia referralBy dateOfJoining status dateOfExit aadhaarNumber profileImage'
      )
      .sort({ _id: -1 });

    const normalized = users.map((u) => withAge(u));
    res.status(200).json({ users: normalized });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const createTeamMember = async (req, res) => {
  try {
    const mapped = mapPayload(req.body);
    if (
      !mapped.name ||
      !mapped.phoneNo ||
      !mapped.aadhaarNumber ||
      !mapped.department ||
      !mapped.position ||
      !mapped.dateOfJoining
    ) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    const existing = await Team.findOne({ $or: [{ phoneNo: mapped.phoneNo }, { aadhaarNumber: mapped.aadhaarNumber }] });
    if (existing) {
      return res.status(400).json({ message: 'Employee with same phone number or Aadhaar already exists' });
    }

    const employeeId = await getNextEmployeeId();
    const user = new Team({
      name: mapped.name,
      phoneNo: mapped.phoneNo,
      gender: mapped.gender || 'other',
      dateOfBirth: mapped.dateOfBirth || null,
      employeeId,
      employeeType: mapped.employeeType || ['team'],
      department: mapped.department,
      position: mapped.position,
      address: mapped.address || '',
      education: mapped.education || [],
      experience: mapped.experience || '',
      recruitedVia: mapped.recruitedVia || 'self',
      referralBy: mapped.referralBy || { name: '', employeeId: '' },
      dateOfJoining: mapped.dateOfJoining,
      status: mapped.status || 'Not Active',
      dateOfExit: mapped.dateOfExit || null,
      aadhaarNumber: mapped.aadhaarNumber,
      profileImage: mapped.profileImage || ''
    });

    await user.save();
    res.status(201).json({ message: 'Employee created successfully', user: withAge(user) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

const updateTeamMember = async (req, res) => {
  const { employeeId } = req.params;

  try {
    const existingEmployee = await Team.findOne({ employeeId });
    if (!existingEmployee) return res.status(404).json({ message: 'Employee not found' });

    const mapped = mapPayload(req.body);
    const updatePayload = {};
    Object.keys(mapped).forEach((key) => {
      if (typeof mapped[key] !== 'undefined') updatePayload[key] = mapped[key];
    });

    if (Object.keys(updatePayload).length === 0) {
      return res.status(400).json({ message: 'No update fields provided' });
    }

    if (updatePayload.phoneNo || updatePayload.aadhaarNumber) {
      const duplicateQuery = { employeeId: { $ne: employeeId }, $or: [] };
      if (updatePayload.phoneNo) duplicateQuery.$or.push({ phoneNo: updatePayload.phoneNo });
      if (updatePayload.aadhaarNumber) duplicateQuery.$or.push({ aadhaarNumber: updatePayload.aadhaarNumber });

      const duplicate = await Team.findOne(duplicateQuery);
      if (duplicate) {
        return res.status(400).json({ message: 'Another employee already uses this phone number or Aadhaar' });
      }
    }

    const updatedEmployee = await Team.findOneAndUpdate(
      { employeeId },
      { $set: updatePayload },
      { new: true, runValidators: true }
    );
    res.status(200).json({ message: 'Employee updated successfully', user: withAge(updatedEmployee) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

module.exports = {
  getAllTeams,
  createTeamMember,
  updateTeamMember
};
