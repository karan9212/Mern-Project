// const mongoose = require('mongoose');
const UserActivity = require('../models/UserActivity'); // adjust path as needed

// Paste the dummy data above here
// const dummyData = [ /* paste the 10 userActivity docs here */ ];
const dummyData =
  [
    {
      userId: "IR USR NP 1",
      bookings: [
        {
          userName: "Ravi Kumar",
          mobile: "9876543210",
          address: "123 MG Road, Delhi",
          sellerCompany: "Flipkart",
          productPurchased: "Samsung Galaxy M13",
          dateOfPurchase: "01-08-2025 10:15:30",
          dateOfDelivery: "03-08-2025 12:00:00",
          dateOfReturn: "05-08-2025 09:30:00",
          deliveryReturnDiff: "02-00-21 21:30:00",
          minCost: 11000,
          additionalCost: 500,
          deliveryCost: 100,
          gstCost: 1980,
          totalCost: 13580
        }
      ],
      searches: [
        { productSearched: "Samsung Galaxy M13", dateOfSearch: "30-07-2025" },
        { productSearched: "Realme Buds Wireless", dateOfSearch: "29-07-2025" }
      ]
    },
    {
      userId: "IR USR PR 2",
      bookings: [
        {
          userName: "Sunita Mehta",
          mobile: "9123456780",
          address: "45 Gandhi Marg, Mumbai",
          sellerCompany: "Amazon",
          productPurchased: "HP Laptop 15s",
          dateOfPurchase: "25-07-2025 15:30:00",
          dateOfDelivery: "27-07-2025 17:45:00",
          dateOfReturn: "30-07-2025 10:15:00",
          deliveryReturnDiff: "02-16-16 15:30:00",
          minCost: 45000,
          additionalCost: 1200,
          deliveryCost: 300,
          gstCost: 8520,
          totalCost: 55020
        }
      ],
      searches: [
        { productSearched: "HP Laptop 15s", dateOfSearch: "24-07-2025" },
        { productSearched: "MacBook Pro", dateOfSearch: "23-07-2025" }
      ]
    },
    {
      userId: "IR USR NP 3",
      bookings: [],
      searches: [
        { productSearched: "Noise Smartwatch", dateOfSearch: "02-08-2025" },
        { productSearched: "Redmi 13C", dateOfSearch: "01-08-2025" }
      ]
    },
    {
      userId: "IR USR NP 4",
      bookings: [],
      searches: [
        { productSearched: "Air Conditioner", dateOfSearch: "28-07-2025" },
        { productSearched: "Window AC", dateOfSearch: "27-07-2025" }
      ]
    },
    {
      userId: "IR USR PR 5",
      bookings: [
        {
          userName: "Amit Shah",
          mobile: "9667788990",
          address: "102 Lotus Lane, Ahmedabad",
          sellerCompany: "Croma",
          productPurchased: "Sony Bravia 43\" TV",
          dateOfPurchase: "20-07-2025 11:20:00",
          dateOfDelivery: "23-07-2025 16:40:00",
          dateOfReturn: "25-07-2025 10:10:00",
          deliveryReturnDiff: "01-17-17 17:30:00",
          minCost: 36000,
          additionalCost: 0,
          deliveryCost: 500,
          gstCost: 6480,
          totalCost: 42980
        }
      ],
      searches: [
        { productSearched: "Sony TV 43", dateOfSearch: "18-07-2025" },
        { productSearched: "LG TV 43", dateOfSearch: "17-07-2025" }
      ]
    },
    {
      userId: "IR USR NP 6",
      bookings: [],
      searches: []
    },
    {
      userId: "IR USR NP 7",
      bookings: [],
      searches: [
        { productSearched: "iPhone 13", dateOfSearch: "29-07-2025" },
        { productSearched: "iPhone Case", dateOfSearch: "30-07-2025" }
      ]
    },
    {
      userId: "IR USR PR 8",
      bookings: [],
      searches: []
    },
    {
      userId: "IR USR NP 9",
      bookings: [],
      searches: []
    },
    {
      userId: "IR USR NP 10",
      bookings: [
        {
          userName: "Radhika Menon",
          mobile: "9301234567",
          address: "7 Lake View, Kochi",
          sellerCompany: "Reliance Digital",
          productPurchased: "Canon EOS 200D DSLR",
          dateOfPurchase: "15-07-2025 14:10:00",
          dateOfDelivery: "18-07-2025 09:00:00",
          dateOfReturn: "22-07-2025 16:30:00",
          deliveryReturnDiff: "04-07-00 07:30:00",
          minCost: 55000,
          additionalCost: 250,
          deliveryCost: 400,
          gstCost: 9900,
          totalCost: 65550
        }
      ],
      searches: [
        { productSearched: "Canon EOS 200D", dateOfSearch: "14-07-2025" },
        { productSearched: "Nikon D3500", dateOfSearch: "13-07-2025" }
      ]
    }
  ];

async function insertDummyUserActivity() {
  try {
    await UserActivity.insertMany(dummyData);
    console.log('Dummy data inserted successfully');
  } catch (err) {
    console.error('Failed to insert dummy data:', err.message);
  }
}

insertDummyUserActivity();
