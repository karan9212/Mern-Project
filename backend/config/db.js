const mongoose = require('mongoose');
const { SELLER_STATUS_VALUES, normalizeSellerStatus } = require('../utils/sellerStatus');

const createNormalizedEducationEntry = (entry = {}) => {
  const educationType = entry?.educationType === 'school' ? 'school' : 'college';

  return {
    educationType,
    collegeName: educationType === 'college' ? String(entry?.collegeName || '').trim() : '',
    eduDepartment: educationType === 'college' ? String(entry?.eduDepartment || '').trim() : '',
    courseName: educationType === 'college' ? String(entry?.courseName || '').trim() : '',
    fromDate: entry?.fromDate || '',
    currentlyPursuing: educationType === 'college' ? Boolean(entry?.currentlyPursuing) : false,
    toDate:
      educationType === 'school'
        ? (entry?.toDate || '')
        : (entry?.currentlyPursuing ? '' : (entry?.toDate || '')),
    certificate:
      educationType === 'school' || !entry?.currentlyPursuing
        ? (entry?.certificate || '')
        : '',
    certificateName:
      educationType === 'school' || !entry?.currentlyPursuing
        ? (entry?.certificateName || '')
        : '',
    schoolName: educationType === 'school' ? String(entry?.schoolName || '').trim() : '',
    schoolAddress: educationType === 'school' ? String(entry?.schoolAddress || '').trim() : '',
    schoolClass: educationType === 'school' ? String(entry?.schoolClass || '').trim() : '',
    boardName: educationType === 'school' ? String(entry?.boardName || '').trim() : ''
  };
};

const normalizeEducationArray = (education) => {
  if (!Array.isArray(education) || education.length === 0) return [];
  return education
    .filter((entry) => entry && typeof entry === 'object' && !Array.isArray(entry))
    .map((entry) => createNormalizedEducationEntry(entry));
};

const formatDateKey = (value = new Date()) => {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const normalizeEmployeeRole = (employeeType) => {
  const validRoles = ['team', 'subAdmin', 'admin'];
  const rawRoles = Array.isArray(employeeType) ? employeeType : [employeeType];
  const filteredRoles = [...new Set(rawRoles.filter((role) => validRoles.includes(role)))];
  const normalizedRoles = ['team'];

  if (filteredRoles.includes('admin')) {
    normalizedRoles.push('admin');
    return normalizedRoles;
  }

  if (filteredRoles.includes('subAdmin')) {
    normalizedRoles.push('subAdmin');
  }

  return normalizedRoles;
};

const runDatabaseMaintenance = async () => {
  // Cleanup legacy unique indexes that are no longer part of current schema.
  // These indexes can cause duplicate-key errors on null values during insert.
  const usersCollection = mongoose.connection.db.collection('users');
    await usersCollection.updateMany(
      {},
      {
        $unset: {
          userType: '',
          dateOfExit: '',
          department: '',
          isCurrentlyWorking: '',
          position: ''
        }
      }
    );
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
    const teamIndexes = await teamsCollection.indexes();
    const teamIndexNames = teamIndexes.map((idx) => idx.name);

    if (teamIndexNames.includes('teamId_1')) {
      await teamsCollection.dropIndex('teamId_1');
      console.log('Dropped legacy index: teams.teamId_1');
    }

    const conflictingTeamIndexes = teamIndexes.filter(
      (idx) => idx.unique && (idx.key?.teamId === 1 || idx.key?.aadhaar === 1)
    );

    for (const idx of conflictingTeamIndexes) {
      if (teamIndexNames.includes(idx.name)) {
        await teamsCollection.dropIndex(idx.name);
        console.log(`Dropped conflicting unique index: teams.${idx.name}`);
      }
    }

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
        if (!doc.employeeType && Array.isArray(doc.userType)) {
          next.employeeType = normalizeEmployeeRole(doc.userType);
        } else if (doc.employeeType) {
          const normalizedRole = normalizeEmployeeRole(doc.employeeType);
          if (JSON.stringify(normalizedRole) !== JSON.stringify(doc.employeeType)) {
            next.employeeType = normalizedRole;
          }
        }
        if (!doc.workingStatus && typeof doc.isCurrentlyWorking === 'boolean') {
          next.workingStatus = doc.isCurrentlyWorking ? 'Working' : 'Not Working';
        }
        if (!doc.status && doc.workingStatus) {
          next.status = doc.workingStatus === 'Working' ? 'Active' : 'Not Active';
        }
        if (typeof doc.education === 'undefined') {
          next.education = [];
        } else {
          const normalizedEducation = normalizeEducationArray(doc.education);
          if (JSON.stringify(normalizedEducation) !== JSON.stringify(doc.education)) {
            next.education = normalizedEducation;
          }
        }
        if (typeof doc.recruitedVia === 'undefined') next.recruitedVia = 'self';
        if (typeof doc.documents === 'undefined') next.documents = [];

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

    const teamsWithLegacyEducation = await teamsCollection
      .find({ education: { $type: 'array', $ne: [] } })
      .project({ education: 1 })
      .toArray();

    if (teamsWithLegacyEducation.length > 0) {
      const educationBulkOps = teamsWithLegacyEducation
        .map((doc) => {
          const normalizedEducation = normalizeEducationArray(doc.education);
          if (JSON.stringify(normalizedEducation) === JSON.stringify(doc.education)) return null;

          return {
            updateOne: {
              filter: { _id: doc._id },
              update: { $set: { education: normalizedEducation } }
            }
          };
        })
        .filter(Boolean);

      if (educationBulkOps.length > 0) {
        await teamsCollection.bulkWrite(educationBulkOps);
        console.log(`Normalized education for ${educationBulkOps.length} employee records`);
      }
    }

    await teamsCollection.updateMany(
      { documents: { $exists: false } },
      { $set: { documents: [] } }
    );

    const adminEmployeesCount = await teamsCollection.countDocuments({ employeeType: 'admin' });
    if (adminEmployeesCount === 0) {
      const firstEmployee = await teamsCollection.findOne({}, { sort: { _id: 1 } });
      if (firstEmployee) {
        await teamsCollection.updateOne({ _id: firstEmployee._id }, { $set: { employeeType: ['team', 'admin'] } });
        console.log(`Promoted first employee ${firstEmployee.employeeId || firstEmployee._id} to admin`);
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

    const productsCollection = mongoose.connection.db.collection('products');
    const productCount = await productsCollection.countDocuments();
    if (productCount < 100) {
      const categories = ['Electronics', 'Home', 'Fitness', 'Office', 'Automotive'];
      const subcategories = ['Accessories', 'Premium', 'Essentials', 'Compact', 'Pro'];
      const brands = ['NovaTech', 'UrbanNest', 'FitCore', 'WorkMate', 'DriveX'];
      const colors = ['Black', 'White', 'Blue', 'Red', 'Green', 'Gray'];
      const statuses = ['active', 'inactive', 'discontinued'];
      const existingIds = await productsCollection.distinct('productid');
      const existingIdSet = new Set(existingIds.map((id) => String(id)));
      const productsToInsert = [];

      for (let i = 1; i <= 100; i += 1) {
        const productid = `PRD${String(i).padStart(4, '0')}`;
        if (existingIdSet.has(productid)) continue;

        const category = categories[(i - 1) % categories.length];
        const subcategory = subcategories[(i - 1) % subcategories.length];
        const brand = brands[(i - 1) % brands.length];
        const color = colors[(i - 1) % colors.length];
        const status = statuses[(i - 1) % statuses.length];

        productsToInsert.push({
          productName: `${brand} ${category} Item ${i}`,
          hsnCode: `${100000 + i}`,
          productid,
          category,
          subcategory,
          brand,
          description: `Seeded product ${i} for ${category} category.`,
          productImages: [`https://picsum.photos/seed/product-${i}/600/600`],
          tags: [category.toLowerCase(), subcategory.toLowerCase(), brand.toLowerCase()],
          status,
          sellingPrice: Number((99 + i * 7.5).toFixed(2)),
          height: Number((8 + (i % 12) * 1.1).toFixed(2)),
          width: Number((5 + (i % 10) * 0.9).toFixed(2)),
          weight: Number((0.5 + (i % 15) * 0.18).toFixed(2)),
          color
        });
      }

      if (productsToInsert.length > 0) {
        await productsCollection.insertMany(productsToInsert);
        console.log(`Seeded ${productsToInsert.length} products in products collection`);
      }
    }

    const sellersCollection = mongoose.connection.db.collection('sellers');
    const sellerStatusDocs = await sellersCollection
      .find({}, { projection: { _id: 1, sellerId: 1, companyEmail: 1, sellerStatus: 1, sellerLocationCordinates: 1 } })
      .toArray();
    const sellerNormalizationOps = sellerStatusDocs.reduce((ops, seller) => {
      const normalizedStatus = normalizeSellerStatus(seller.sellerStatus);
      const lat = Number(seller.sellerLocationCordinates?.lat ?? 28.6139);
      const lng = Number(seller.sellerLocationCordinates?.lng ?? 77.209);
      const hasNumericCoords = Number.isFinite(lat) && Number.isFinite(lng);
      const needsStatusUpdate = normalizedStatus !== seller.sellerStatus;
      const needsCoordUpdate =
        seller.sellerLocationCordinates?.lat !== lat || seller.sellerLocationCordinates?.lng !== lng;
      const nextCompanyEmail =
        seller.companyEmail || `${String(seller.sellerId || 'seller').toLowerCase()}@helpwiser.in`;

      if (!needsStatusUpdate && !needsCoordUpdate && seller.companyEmail) {
        return ops;
      }

      ops.push({
        updateOne: {
          filter: { _id: seller._id },
          update: {
            $set: {
              companyEmail: nextCompanyEmail,
              sellerStatus: normalizedStatus,
              ...(hasNumericCoords ? { sellerLocationCordinates: { lat, lng } } : {})
            }
          }
        }
      });
      return ops;
    }, []);

    if (sellerNormalizationOps.length > 0) {
      await sellersCollection.bulkWrite(sellerNormalizationOps);
    }

    const sellerCount = await sellersCollection.countDocuments();
    if (sellerCount < 50) {
      const products = await productsCollection
        .find({}, { projection: { productName: 1, category: 1 } })
        .toArray();
      const categoryPool = [...new Set(products.map((p) => p.category).filter(Boolean))];
      const productNamePool = products.map((p) => p.productName).filter(Boolean);

      const sellersToInsert = [];
      const existingSellerIds = await sellersCollection.distinct('sellerId');
      const existingSellerIdSet = new Set(existingSellerIds.map((id) => String(id)));

      for (let i = 1; i <= 50; i += 1) {
        const sellerId = `SLR${String(i).padStart(4, '0')}`;
        if (existingSellerIdSet.has(sellerId)) continue;

        const categoryA = categoryPool[(i - 1) % categoryPool.length] || 'Electronics';
        const categoryB = categoryPool[i % categoryPool.length] || 'Home';
        const productA = productNamePool[(i * 2) % productNamePool.length] || 'Sample Product A';
        const productB = productNamePool[(i * 2 + 1) % productNamePool.length] || 'Sample Product B';
        const lat = Number((28.45 + (i % 20) * 0.02).toFixed(6));
        const lng = Number((76.9 + (i % 20) * 0.02).toFixed(6));
        const statuses = SELLER_STATUS_VALUES;

        sellersToInsert.push({
          sellerName: `Delhi Seller ${i}`,
          sellerId,
          companyEmail: `${sellerId.toLowerCase()}@helpwiser.in`,
          sellerCategory: [...new Set([categoryA, categoryB])],
          sellerDescription: `Seeded seller ${i} handling ${categoryA} and ${categoryB}.`,
          sellerStatus: statuses[(i - 1) % statuses.length],
          sellerAddress: `${10 + i}, Block ${String.fromCharCode(65 + (i % 10))}, Delhi`,
          sellerContact: `98${String(10000000 + i).slice(0, 8)}`,
          sellerGstIn: `07ABCDE${String(1000 + i)}F1Z${i % 10}`,
          sellerProducts: [...new Set([productA, productB])],
          sellerLocationCordinates: { lat, lng }
        });
      }

      if (sellersToInsert.length > 0) {
        await sellersCollection.insertMany(sellersToInsert);
        console.log(`Seeded ${sellersToInsert.length} sellers in sellers collection`);
      }
    }

    const deliveryBoysCollection = mongoose.connection.db.collection('deliveryBoys');
    await deliveryBoysCollection.updateMany(
      { companyEmail: { $exists: false } },
      [
        {
          $set: {
            companyEmail: {
              $concat: [{ $toLower: '$deliveryBoyId' }, '@helpwiser.in']
            }
          }
        }
      ]
    );

    const deliveryBoyCount = await deliveryBoysCollection.countDocuments();
    if (deliveryBoyCount === 0) {
      await deliveryBoysCollection.insertMany([
        {
          deliveryBoyName: 'Arjun Kumar',
          deliveryBoyId: 'DLV001',
          phoneNo: '9891001001',
          companyEmail: 'dlv001@helpwiser.in',
          status: 'active',
          address: 'Rohini, Delhi',
          profileImage: ''
        },
        {
          deliveryBoyName: 'Ravi Malik',
          deliveryBoyId: 'DLV002',
          phoneNo: '9891001002',
          companyEmail: 'dlv002@helpwiser.in',
          status: 'active',
          address: 'Dwarka, Delhi',
          profileImage: ''
        },
        {
          deliveryBoyName: 'Sonu Verma',
          deliveryBoyId: 'DLV003',
          phoneNo: '9891001003',
          companyEmail: 'dlv003@helpwiser.in',
          status: 'active',
          address: 'Pitampura, Delhi',
          profileImage: ''
        },
        {
          deliveryBoyName: 'Nitin Yadav',
          deliveryBoyId: 'DLV004',
          phoneNo: '9891001004',
          companyEmail: 'dlv004@helpwiser.in',
          status: 'active',
          address: 'Laxmi Nagar, Delhi',
          profileImage: ''
        },
        {
          deliveryBoyName: 'Harsh Tyagi',
          deliveryBoyId: 'DLV005',
          phoneNo: '9891001005',
          companyEmail: 'dlv005@helpwiser.in',
          status: 'inactive',
          address: 'Mayur Vihar, Delhi',
          profileImage: ''
        }
      ]);
      console.log('Seeded deliveryBoys collection with default records');
    }

    const rentalOrdersCollection = mongoose.connection.db.collection('rentalOrders');
    const rentalCheckoutSessionsCollection = mongoose.connection.db.collection('rentalCheckoutSessions');
    const userActivityCollection = mongoose.connection.db.collection('userActivity');
    const activeUsers = await usersCollection
      .find({ status: { $ne: 'Deleted' } }, { projection: { userId: 1, name: 1, phoneNo: 1, address: 1 } })
      .sort({ userId: 1 })
      .toArray();
    const activeProducts = await productsCollection
      .find({ status: 'active' }, { projection: { productid: 1, productName: 1, category: 1, brand: 1, sellingPrice: 1, productImages: 1 } })
      .limit(20)
      .toArray();
    const activeSellers = await sellersCollection
      .find({ sellerStatus: 'active' }, { projection: { sellerId: 1, sellerName: 1, sellerContact: 1, sellerAddress: 1, sellerProducts: 1 } })
      .limit(20)
      .toArray();

    if (activeUsers.length > 0 && activeProducts.length > 0 && activeSellers.length > 0) {
      const seededOrders = [];
      const deliveryBoys = [
        { deliveryBoyId: 'DLV001', name: 'Arjun Kumar', phoneNo: '9891001001' },
        { deliveryBoyId: 'DLV002', name: 'Ravi Malik', phoneNo: '9891001002' },
        { deliveryBoyId: 'DLV003', name: 'Sonu Verma', phoneNo: '9891001003' }
      ];

      for (let userIndex = 0; userIndex < activeUsers.length; userIndex += 1) {
        const user = activeUsers[userIndex];
        const existingPaidOrders = await rentalOrdersCollection.countDocuments({ userId: user.userId, paymentStatus: 'paid' });
        if (existingPaidOrders > 0) {
          continue;
        }

        const ordersForUser = 3 + (userIndex % 3);

        for (let orderIndex = 0; orderIndex < ordersForUser; orderIndex += 1) {
          const product = activeProducts[(userIndex * 2 + orderIndex) % activeProducts.length];
          const matchedSeller =
            activeSellers.find((seller) => Array.isArray(seller.sellerProducts) && seller.sellerProducts.includes(product.productName)) ||
            activeSellers[(userIndex + orderIndex) % activeSellers.length];
          const rentalDays = 2 + ((userIndex + orderIndex) % 5);
          const quantity = 1 + ((userIndex + orderIndex) % 2);
          const createdAt = new Date();
          createdAt.setDate(createdAt.getDate() - (userIndex * 4 + orderIndex * 3 + 2));
          createdAt.setHours(10 + (orderIndex % 5), 15, 0, 0);

          const rentalStartDate = new Date(createdAt);
          rentalStartDate.setDate(rentalStartDate.getDate() + 1);
          const rentalEndDate = new Date(rentalStartDate);
          rentalEndDate.setDate(rentalEndDate.getDate() + rentalDays - 1);

          const subtotal = Number(((product.sellingPrice || 0) * quantity * rentalDays).toFixed(2));
          const deliveryFee = 99;
          const gstAmount = Number((subtotal * 0.18).toFixed(2));
          const totalAmount = Number((subtotal + deliveryFee + gstAmount).toFixed(2));
          const seededFlow = [
            { orderStatus: 'created', trackingStatus: 'order_placed' },
            { orderStatus: 'confirmed', trackingStatus: 'seller_confirmed' },
            { orderStatus: 'confirmed', trackingStatus: 'getting_ready' },
            { orderStatus: 'running', trackingStatus: 'packed' },
            { orderStatus: 'running', trackingStatus: 'delivered' }
          ][orderIndex % 5];
          const orderStatus = seededFlow.orderStatus;
          const trackingStatus = seededFlow.trackingStatus;
          const orderReference = `RNT-${user.userId}-${String(orderIndex + 1).padStart(2, '0')}-${createdAt.getTime()}`;
          const assignedDeliveryBoy = deliveryBoys[(userIndex + orderIndex) % deliveryBoys.length];
          const estimatedDeliveryAt = new Date(rentalStartDate);
          estimatedDeliveryAt.setHours(estimatedDeliveryAt.getHours() + 6);

          seededOrders.push({
            orderReference,
            orderGroupReference: orderReference,
            userId: user.userId,
            userName: user.name || 'User',
            phoneNo: user.phoneNo || '',
            deliveryAddress: user.address || `Sample delivery address for ${user.name || user.userId}`,
            productid: product.productid,
            productName: product.productName,
            category: product.category || '',
            brand: product.brand || '',
            productImage: Array.isArray(product.productImages) ? product.productImages[0] || '' : '',
            sellerId: matchedSeller.sellerId,
            sellerName: matchedSeller.sellerName || '',
            sellerContact: matchedSeller.sellerContact || '',
            sellerAddress: matchedSeller.sellerAddress || '',
            quantity,
            rentalDays,
            rentalStartDate,
            rentalEndDate,
            pricing: {
              unitPrice: product.sellingPrice || 0,
              subtotal,
              deliveryFee,
              gstAmount,
              totalAmount
            },
            paymentGateway: 'razorpay',
            paymentStatus: 'paid',
            orderStatus,
            trackingStatus,
            assignedDeliveryBoy,
            estimatedDeliveryAt,
            razorpay: {
              orderId: `order_seed_${userIndex + 1}_${orderIndex + 1}`,
              paymentId: `pay_seed_${userIndex + 1}_${orderIndex + 1}`,
              signature: `seed_signature_${userIndex + 1}_${orderIndex + 1}`
            },
            createdAt,
            updatedAt: createdAt
          });
        }
      }

      if (seededOrders.length > 0) {
        await rentalOrdersCollection.insertMany(seededOrders);
        console.log(`Seeded ${seededOrders.length} rental orders in rentalOrders collection`);
      }
    }

    const existingRentalOrders = await rentalOrdersCollection
      .find({}, { projection: { _id: 1, orderReference: 1, orderGroupReference: 1, orderStatus: 1, trackingStatus: 1, assignedDeliveryBoy: 1, estimatedDeliveryAt: 1, rentalStartDate: 1 } })
      .toArray();

    const rentalOrderOps = existingRentalOrders
      .map((order, index) => {
        const next = {};
        if (!order.orderGroupReference) next.orderGroupReference = order.orderReference;
        if (!order.trackingStatus) {
          next.trackingStatus =
            order.orderStatus === 'completed' ? 'delivered' :
            order.orderStatus === 'confirmed' ? 'seller_confirmed' :
            order.orderStatus === 'cancelled' ? 'cancelled' :
            'order_placed';
        }
        if (!order.assignedDeliveryBoy?.deliveryBoyId) {
          next.assignedDeliveryBoy = [
            { deliveryBoyId: 'DLV001', name: 'Arjun Kumar', phoneNo: '9891001001' },
            { deliveryBoyId: 'DLV002', name: 'Ravi Malik', phoneNo: '9891001002' },
            { deliveryBoyId: 'DLV003', name: 'Sonu Verma', phoneNo: '9891001003' }
          ][index % 3];
        }
        if (!order.estimatedDeliveryAt && order.rentalStartDate) {
          const estimatedDeliveryAt = new Date(order.rentalStartDate);
          estimatedDeliveryAt.setHours(estimatedDeliveryAt.getHours() + 6);
          next.estimatedDeliveryAt = estimatedDeliveryAt;
        }

        if (Object.keys(next).length === 0) return null;

        return {
          updateOne: {
            filter: { _id: order._id },
            update: { $set: next }
          }
        };
      })
      .filter(Boolean);

    if (rentalOrderOps.length > 0) {
      await rentalOrdersCollection.bulkWrite(rentalOrderOps);
      console.log(`Normalized ${rentalOrderOps.length} rental orders with tracking metadata`);
    }

    await rentalCheckoutSessionsCollection.deleteMany({ paymentStatus: 'failed' });

    const seededPaidOrders = await rentalOrdersCollection
      .find({ paymentStatus: 'paid' }, { projection: { userId: 1, userName: 1, phoneNo: 1, deliveryAddress: 1, sellerName: 1, productName: 1, rentalDays: 1, rentalStartDate: 1, rentalEndDate: 1, pricing: 1, createdAt: 1 } })
      .sort({ createdAt: -1 })
      .toArray();

    if (activeUsers.length > 0 && activeProducts.length > 0) {
      const activityOps = [];

      for (const user of activeUsers) {
        const existingActivity = await userActivityCollection.findOne({ userId: user.userId });
        const userOrders = seededPaidOrders.filter((order) => order.userId === user.userId);
        const bookings = userOrders.slice(0, 5).map((order) => ({
          userName: order.userName || user.name || 'User',
          mobile: order.phoneNo || user.phoneNo || '',
          address: order.deliveryAddress || user.address || '',
          sellerCompany: order.sellerName || '',
          productPurchased: order.productName || '',
          dateOfPurchase: order.createdAt ? new Date(order.createdAt).toISOString() : new Date().toISOString(),
          dateOfDelivery: order.rentalStartDate ? new Date(order.rentalStartDate).toLocaleDateString('en-IN') : '',
          dateOfReturn: order.rentalEndDate ? new Date(order.rentalEndDate).toLocaleDateString('en-IN') : '',
          deliveryReturnDiff: `${order.rentalDays || 0} day(s)`,
          minCost: Number(order.pricing?.subtotal || 0),
          additionalCost: 0,
          deliveryCost: Number(order.pricing?.deliveryFee || 0),
          gstCost: Number(order.pricing?.gstAmount || 0),
          totalCost: Number(order.pricing?.totalAmount || 0)
        }));

        const searchTerms = [];
        const searchSeedCount = 8 + (user.userId.charCodeAt(user.userId.length - 1) % 4);
        for (let index = 0; index < searchSeedCount; index += 1) {
          const product = activeProducts[(index + user.userId.length) % activeProducts.length];
          searchTerms.push({
            productSearched: index % 3 === 0 ? product.category : product.productName,
            dateOfSearch: formatDateKey(new Date(Date.now() - index * 86400000))
          });
        }

        if (!existingActivity) {
          activityOps.push({
            insertOne: {
              document: {
                userId: user.userId,
                bookings,
                searches: searchTerms
              }
            }
          });
        } else {
          const update = {};
          if (!Array.isArray(existingActivity.bookings) || existingActivity.bookings.length === 0) {
            update.bookings = bookings;
          }
          if (!Array.isArray(existingActivity.searches) || existingActivity.searches.length === 0) {
            update.searches = searchTerms;
          }

          if (Object.keys(update).length > 0) {
            activityOps.push({
              updateOne: {
                filter: { _id: existingActivity._id },
                update: { $set: update }
              }
            });
          }
        }
      }

      if (activityOps.length > 0) {
        await userActivityCollection.bulkWrite(activityOps);
        console.log(`Seeded or completed userActivity for ${activityOps.length} user records`);
      }
    }

    const paidOrderCounts = await rentalOrdersCollection.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $group: { _id: '$userId', count: { $sum: 1 } } }
    ]).toArray();

    if (paidOrderCounts.length > 0) {
      await Promise.all(
        paidOrderCounts.map((item) =>
          usersCollection.updateOne(
            { userId: item._id },
            { $set: { noOfBookings: item.count } }
          )
        )
      );
    }

    const productSalesCollection = mongoose.connection.db.collection('productSales');
    const productSalesCount = await productSalesCollection.countDocuments();
    if (productSalesCount === 0) {
      const products = await productsCollection
        .find({}, { projection: { productid: 1, productName: 1, category: 1, sellingPrice: 1 } })
        .limit(30)
        .toArray();
      const sellers = await sellersCollection
        .find({}, { projection: { sellerId: 1, sellerName: 1 } })
        .limit(20)
        .toArray();

      const salesToInsert = [];
      for (let dayOffset = 29; dayOffset >= 0; dayOffset -= 1) {
        const baseDate = new Date();
        baseDate.setHours(11, 0, 0, 0);
        baseDate.setDate(baseDate.getDate() - dayOffset);
        const entriesForDay = 4 + (dayOffset % 5);

        for (let index = 0; index < entriesForDay; index += 1) {
          const product = products[(dayOffset * 3 + index) % products.length];
          const seller = sellers[(dayOffset + index) % Math.max(sellers.length, 1)] || {};
          const quantitySold = 6 + ((dayOffset + index * 2) % 18);
          const soldOn = new Date(baseDate);
          soldOn.setHours(9 + ((index * 2) % 8), (index * 11) % 60, 0, 0);

          salesToInsert.push({
            productid: String(product?.productid || `PRD${String(index + 1).padStart(4, '0')}`),
            productName: String(product?.productName || `Product ${index + 1}`),
            category: String(product?.category || ''),
            sellerId: String(seller?.sellerId || ''),
            sellerName: String(seller?.sellerName || ''),
            soldOn,
            dateKey: formatDateKey(soldOn),
            quantitySold,
            revenue: Number(((product?.sellingPrice || 500) * quantitySold).toFixed(2))
          });
        }
      }

      if (salesToInsert.length > 0) {
        await productSalesCollection.insertMany(salesToInsert);
        console.log(`Seeded ${salesToInsert.length} product sales in productSales collection`);
      }
    }

    const announcementsCollection = mongoose.connection.db.collection('announcements');
    const announcementCount = await announcementsCollection.countDocuments();
    if (announcementCount === 0) {
      await announcementsCollection.insertMany([
        {
          title: 'Monthly Compliance Window',
          message: 'Please complete your compliance acknowledgements before the 25th of this month.',
          audience: 'employee',
          priority: 'high',
          publishDate: new Date(),
          active: true
        },
        {
          title: 'Training Calendar Updated',
          message: 'The latest L&D sessions for product, sales and HR processes are now available.',
          audience: 'employee',
          priority: 'normal',
          publishDate: new Date(),
          active: true
        },
        {
          title: 'Office Operations Notice',
          message: 'Hybrid seating allocation for the next two weeks has been published by administration.',
          audience: 'all',
          priority: 'low',
          publishDate: new Date(),
          active: true
        }
      ]);
      console.log('Seeded announcements collection with default records');
    }
};

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      family: 4,
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10
    });

    console.log('✅ MongoDB Connected');

    mongoose.connection.on('error', (error) => {
      console.error(`MongoDB connection error: ${error.message}`);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected');
    });

    try {
      await runDatabaseMaintenance();
    } catch (maintenanceError) {
      console.error(`MongoDB maintenance failed: ${maintenanceError.message}`);
    }

  } catch (error) {
    console.error(`MongoDB initial connection failed: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
