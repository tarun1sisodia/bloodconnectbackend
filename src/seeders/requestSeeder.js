const mongoose = require('mongoose');
const Request = require('../models/Request');
const User = require('../models/User');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect('mongodb+srv://tarun:gDkgiwfm9948Y3s8@bloodconnect.67ngkj1.mongodb.net/?retryWrites=true&w=majority&appName=bloodConnect'
)
    .then(() => console.log('MongoDB connected for seeding'))
    .catch(err => console.error('MongoDB connection error:', err));

// Sample blood request data
// Update your sample requests to include the missing required fields
const sampleRequests = [
    {
        patient: {
            name: 'John Doe',
            bloodType: 'A+',
            age: 45,
            gender: 'male'  // Add the required gender field
        },
        hospital: {
            name: 'City Hospital',
            city: 'New Delhi',
            state: 'Delhi',
            address: '123 Main Street, New Delhi'  // Add the required address field
        },
        unitsNeeded: 2,
        urgency: 'high',
        status: 'pending',
        description: 'Urgent need for surgery scheduled tomorrow morning'
    },
    {
        patient: {
            name: 'Priya Sharma',
            bloodType: 'O-',
            age: 28,
            gender: 'female'  // Add the required gender field
        },
        hospital: {
            name: 'Apollo Hospital',
            city: 'Mumbai',
            state: 'Maharashtra',
            address: '456 Hospital Road, Mumbai'  // Add the required address field
        },
        unitsNeeded: 3,
        urgency: 'critical',
        status: 'pending',
        description: 'Accident victim needs immediate blood transfusion'
    },
    {
        patient: {
            name: 'Rajesh Kumar',
            bloodType: 'B+',
            age: 62,
            gender: 'male'  // Add the required gender field
        },
        hospital: {
            name: 'AIIMS',
            city: 'Delhi',
            state: 'Delhi',
            address: 'AIIMS Campus, Ansari Nagar, New Delhi'  // Add the required address field
        },
        unitsNeeded: 1,
        urgency: 'medium',
        status: 'pending',
        description: 'Scheduled for heart surgery next week'
    },
    {
        patient: {
            name: 'Ananya Patel',
            bloodType: 'AB+',
            age: 35,
            gender: 'female'  // Add the required gender field
        },
        hospital: {
            name: 'Fortis Hospital',
            city: 'Bangalore',
            state: 'Karnataka',
            address: '154 Richmond Road, Bangalore'  // Add the required address field
        },
        unitsNeeded: 2,
        urgency: 'high',
        status: 'in-progress',
        description: 'Cancer patient needs blood for chemotherapy treatment'
    },
    {
        patient: {
            name: 'Vikram Singh',
            bloodType: 'O+',
            age: 50,
            gender: 'male'  // Add the required gender field
        },
        hospital: {
            name: 'Max Hospital',
            city: 'Chandigarh',
            state: 'Punjab',
            address: '789 Hospital Avenue, Chandigarh'  // Add the required address field
        },
        unitsNeeded: 2,
        urgency: 'low',
        status: 'pending',
        description: 'Scheduled for knee replacement surgery'
    }
];


// Function to seed the database
async function seedDatabase() {
    try {
        // First, find a user to assign as requester
        // If no user exists, you might want to create one first
        const user = await User.findOne();

        if (!user) {
            console.error('No users found in the database. Please create a user first.');
            process.exit(1);
        }

        // Clear existing requests
        // await Request.deleteMany({});
        // console.log('Cleared existing requests');

        // Add requester to each request
        const requestsWithRequester = sampleRequests.map(request => ({
            ...request,
            requester: user._id
        }));

        // Insert sample requests
        const insertedRequests = await Request.insertMany(requestsWithRequester);
        console.log(`${insertedRequests.length} sample requests inserted successfully`);

        // Close the connection
        mongoose.connection.close();
        console.log('Database connection closed');
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
}

// Run the seeder
seedDatabase();
