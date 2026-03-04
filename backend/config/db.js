const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected');

    // Cleanup legacy unique indexes that are no longer part of current schema.
    // These indexes can cause duplicate-key errors on null values during insert.
    const usersCollection = mongoose.connection.db.collection('users');
    const indexes = await usersCollection.indexes();
    const indexNames = indexes.map((idx) => idx.name);

    if (indexNames.includes('email_1')) {
      await usersCollection.dropIndex('email_1');
      console.log('Dropped legacy index: users.email_1');
    }

    if (indexNames.includes('mobile_1')) {
      await usersCollection.dropIndex('mobile_1');
      console.log('Dropped legacy index: users.mobile_1');
    }

    if (indexNames.includes('phoneNo_1')) {
      await usersCollection.dropIndex('phoneNo_1');
      console.log('Dropped legacy index: users.phoneNo_1');
    }

    if (indexNames.includes('aadhaarNumber_1')) {
      await usersCollection.dropIndex('aadhaarNumber_1');
      console.log('Dropped legacy index: users.aadhaarNumber_1');
    }

    const uniquePhoneOrAadhaarIndexes = indexes.filter(
      (idx) => idx.unique && (idx.key?.phoneNo === 1 || idx.key?.aadhaarNumber === 1)
    );

    for (const idx of uniquePhoneOrAadhaarIndexes) {
      if (indexNames.includes(idx.name)) {
        await usersCollection.dropIndex(idx.name);
        console.log(`Dropped conflicting unique index: users.${idx.name}`);
      }
    }

    // Migrate legacy user keys to current schema keys.
    const legacyUsers = await usersCollection
      .find({
        $or: [
          { aadhaarNumber: { $exists: false } },
          { dateOfBirth: { $exists: false }, dob: { $exists: true } }
        ]
      })
      .toArray();

    if (legacyUsers.length > 0) {
      const userBulkOps = legacyUsers.map((doc) => {
        const next = {};

        if (!doc.aadhaarNumber && doc.aadhaar) next.aadhaarNumber = doc.aadhaar;
        if (!doc.dateOfBirth && doc.dob) next.dateOfBirth = doc.dob;
        if (!doc.dateOfJoining) next.dateOfJoining = new Date();
        if (typeof doc.noOfBookings === 'undefined') next.noOfBookings = 0;
        if (!doc.status) next.status = 'Not Active';

        if (Object.keys(next).length === 0) return null;
        return {
          updateOne: {
            filter: { _id: doc._id },
            update: { $set: next, $unset: { aadhaar: '', dob: '' } }
          }
        };
      }).filter(Boolean);

      if (userBulkOps.length > 0) {
        await usersCollection.bulkWrite(userBulkOps);
        console.log(`Migrated ${userBulkOps.length} user records to new schema keys`);
      }
    }

    const teamsCollection = mongoose.connection.db.collection('teams');
    const legacyTeams = await teamsCollection
      .find({
        $or: [
          { employeeId: { $exists: false }, teamId: { $exists: true } },
          { aadhaarNumber: { $exists: false }, aadhaar: { $exists: true } },
          { dateOfBirth: { $exists: false }, dob: { $exists: true } },
          { employeeType: { $exists: false }, userType: { $exists: true } },
          { workingStatus: { $exists: false }, isCurrentlyWorking: { $exists: true } },
          { status: { $exists: false }, workingStatus: { $exists: true } }
        ]
      })
      .toArray();

    if (legacyTeams.length > 0) {
      const teamBulkOps = legacyTeams.map((doc) => {
        const next = {};

        if (!doc.employeeId && doc.teamId) next.employeeId = doc.teamId;
        if (!doc.aadhaarNumber && doc.aadhaar) next.aadhaarNumber = doc.aadhaar;
        if (!doc.dateOfBirth && doc.dob) next.dateOfBirth = doc.dob;
        if (!doc.employeeType && Array.isArray(doc.userType)) next.employeeType = doc.userType;
        if (!doc.workingStatus && typeof doc.isCurrentlyWorking === 'boolean') {
          next.workingStatus = doc.isCurrentlyWorking ? 'Working' : 'Not Working';
        }
        if (!doc.status && doc.workingStatus) {
          next.status = doc.workingStatus === 'Working' ? 'Active' : 'Not Active';
        }
        if (typeof doc.education === 'undefined') next.education = [];
        if (typeof doc.recruitedVia === 'undefined') next.recruitedVia = 'self';

        if (Object.keys(next).length === 0) return null;
        return {
          updateOne: {
            filter: { _id: doc._id },
            update: {
              $set: next,
              $unset: {
                teamId: '',
                aadhaar: '',
                dob: '',
                userType: '',
                isCurrentlyWorking: '',
                workingStatus: ''
              }
            }
          }
        };
      }).filter(Boolean);

      if (teamBulkOps.length > 0) {
        await teamsCollection.bulkWrite(teamBulkOps);
        console.log(`Migrated ${teamBulkOps.length} employee records to new schema keys`);
      }
    }

    const aadhaarCollection = mongoose.connection.db.collection('aadhaarData');
    await aadhaarCollection.updateMany(
      { $or: [{ gender: { $exists: false } }, { dateOfBirth: { $exists: false } }] },
      { $set: { gender: 'other', dateOfBirth: null } }
    );
    const aadhaarCount = await aadhaarCollection.countDocuments();
    if (aadhaarCount === 0) {
      await aadhaarCollection.insertMany([
        { name: 'Seema Sinha', age: 52, gender: 'female', dateOfBirth: null, address: '123 MG Road, Delhi', aadhaarNumber: '123456789012', mobile: '9811359005' },
        { name: 'Sunita Mehta', age: 28, gender: 'female', dateOfBirth: null, address: '45 Gandhi Marg, Mumbai', aadhaarNumber: '234567890123', mobile: '9123456780' },
        { name: 'Anil Singh', age: 41, gender: 'male', dateOfBirth: null, address: '78 Tagore Lane, Kolkata', aadhaarNumber: '345678901234', mobile: '9988776655' },
        { name: 'Karan Sinha', age: 27, gender: 'male', dateOfBirth: null, address: '47 Rana Pratap Bagh, Delhi', aadhaarNumber: '456789012345', mobile: '7982273061' },
        { name: 'Vikram Chauhan', age: 38, gender: 'male', dateOfBirth: null, address: '11 Sector 21, Chandigarh', aadhaarNumber: '567890123456', mobile: '8765432109' },
        { name: 'Priya Nair', age: 26, gender: 'female', dateOfBirth: null, address: '9 Beach Road, Chennai', aadhaarNumber: '678901234567', mobile: '9823456781' },
        { name: 'Anshika Sharma', age: 22, gender: 'female', dateOfBirth: null, address: '24 Main Road, Meerut', aadhaarNumber: '789012345678', mobile: '8218267196' },
        { name: 'Anita Deshmukh', age: 30, gender: 'female', dateOfBirth: null, address: '32 Park Avenue, Nashik', aadhaarNumber: '890123456789', mobile: '9012345678' },
        { name: 'Amit Shah', age: 27, gender: 'male', dateOfBirth: null, address: '102 Lotus Lane, Ahmedabad', aadhaarNumber: '901234567890', mobile: '9667788990' },
        { name: 'Sonia Tiwari', age: 26, gender: 'female', dateOfBirth: null, address: '7 Lake View, Kochi', aadhaarNumber: '012345678901', mobile: '8700995515' }
      ]);
      console.log('Seeded aadhaarData collection with default records');
    }
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
