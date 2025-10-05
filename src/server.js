require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
//This commit is directly done on github using web. need to install helmet package npm i helmet.
const helmet = require('helmet');

// Import routes
const authRoutes = require('./routes/authRoutes');
const usersRoutes = require('./routes/usersRoutes');
const requestsRoutes = require('./routes/requestsRoutes');
const donationRoutes = require('./routes/donationRoutes');
const matchRoutes = require('./routes/matchRoutes');
const statsRoutes = require('./routes/statsRoutes');
const contactRoutes = require('./routes/contactRoutes');
const donationCenterRoutes = require('./routes/donationCenterRoutes');

// Import middleware
const { apiLimiter } = require('./middleware/rateLimit');

// Initialize Express app
const app = express();
app.use(helmet()); //it just basics but far better than nothing.
// Add this line right after initializing the app
app.set('trust proxy', 1);


// Middleware
app.use(express.json());
// app.use(cors({
//   origin: ['https://tarun9105.github.io', 'https://tarun9105.github.io/ProjectUI/'],
//   credentials: true
// }));
app.use(cors({
  origin: ['https://tarun1sisodia.netlify.app', 'https://tarun1sisodia.github.io/bloodconnectfrontend'],
  credentials: true
}));

// Apply rate limiting to all requests
app.use('/api', apiLimiter);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/requests', requestsRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/match', matchRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/donation-centers', donationCenterRoutes);

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// For production environment
if (process.env.NODE_ENV === 'production') {
  // Instead of serving static files, redirect non-API requests to GitHub Pages
  app.get('*', (req, res) => {
    // Only redirect requests that aren't for the API or health check
    if (!req.path.startsWith('/api/') && req.path !== '/health') {
      // const githubPagesUrl = process.env.FRONTEND_URL || 'https://tarun9105.github.io/ProjectUI/'|| 'https://tarun9105.github.io';
      const githubPagesUrl = process.env.FRONTEND_URL || 'https://tarun1sisodia.github.io/bloodconnectfrontend/'|| 'https://tarun1sisodia.github.io';
      // Remove trailing slash if it exists to avoid double slashes
      const baseUrl = githubPagesUrl.endsWith('/') ? githubPagesUrl.slice(0, -1) : githubPagesUrl;
      res.redirect(`${baseUrl}${req.path}`);
    } else {
      // This will trigger the 404 handler for API routes that don't exist
      res.status(404).json({ message: 'API endpoint not found' });
    }
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => {
    console.log('Connected to MongoDB');
    
    // Start server
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

module.exports = app;
