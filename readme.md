🩸 BloodConnect Backend
======================

📋 Overview
---------
This repository contains the backend code for BloodConnect, a comprehensive blood donation management system designed to connect blood donors with recipients in need. The backend provides RESTful APIs for user authentication, blood donation requests, donor management, and matching compatible donors with patients.

🌟 Features
---------
• User Authentication: Secure registration and login system using Supabase authentication
• User Management: Complete donor profile management with blood type tracking
• Request System: Create and manage blood donation requests with priority levels
• Donation Tracking: Record and monitor blood donations
• Matching Algorithm: Automatically match blood requests with compatible donors
• Statistics: Generate insights about donation patterns and blood availability
• Donation Centers: Information about blood donation facilities
• Contact System: Allow users to send inquiries and feedback
• Rate Limiting: Protect API endpoints from abuse

🛠️ Technology Stack
----------------
• Node.js with Express.js framework
• MongoDB for database storage
• Supabase for authentication
• Nodemailer for email notifications
• Mongoose for MongoDB object modeling
• CORS for cross-origin resource sharing
• dotenv for environment variable management

🔌 API Endpoints
-------------
### 🔐 Authentication
• POST /api/auth/register - Register a new user
• POST /api/auth/login - Login and get an access token

### 👥 Users
• GET /api/users/profile - Get the current user profile
• PUT /api/users/profile - Update user profile
• GET /api/users/donors - Get a list of donors
• GET /api/users/:id - Get user details by ID

### 🩸 Blood Requests
• POST /api/requests - Create a new blood request
• GET /api/requests - Retrieve all blood requests
• GET /api/requests/:id - Get details of a specific request
• PUT /api/requests/:id - Update an existing request

### 💉 Donations
• POST /api/donations - Record a new donation
• GET /api/donations - Retrieve donation history
• GET /api/donations/:id - Get details of a specific donation

### 🔄 Matching
• GET /api/match - Find compatible donors for a request

### 📊 Statistics
• GET /api/stats - Get system-wide statistics on donations and requests

### 🏥 Donation Centers
• GET /api/donation-centers - Get information about blood donation centers

### 📬 Contact
• POST /api/contact - Submit contact form or inquiry

### 🔍 Health Check
• GET /health - Check if the server is running

📁 Project Structure
-----------------
```
src/
├── controllers/     # Request handlers for each route
├── middleware/      # Express middleware (authentication, rate limiting)
├── models/         # MongoDB models (User, Request, Donation)
├── routes/         # API route definitions
├── utils/          # Utility functions (email sending, etc.)
├── seeders/        # Database seed scripts
└── server.js       # Main application entry point
```

⚙️ Getting Started
---------------
### Prerequisites
• Node.js (v14 or higher)
• MongoDB (local or Atlas)
• npm or yarn package manager

### 🚀 Installation
1. Clone the repository:
```bash
git clone https://github.com/tarun1sisodia/Tarun.git
cd bloodconnectbackend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
   • Create a .env file in the root directory
   • Add the required environment variables

4. Start the server & Frontend :
```bash
npm start.js
```

For development with auto-restart:
```bash
npm start.js
```

🌐 Deployment
-----------
The backend is configured to work with the frontend deployed at:
• https://tarun1sisodia.netlify.app
• https://tarun1sisodia.github.io/bloodconnectfrontend

🔒 Security Features
-----------------
• JWT-based authentication
• Rate limiting to prevent abuse
• CORS configuration for allowed origins
• Trust proxy settings for secure deployment

🤝 Contributing
------------
1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add some amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request