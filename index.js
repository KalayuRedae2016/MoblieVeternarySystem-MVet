const express = require('express');
const path = require('path');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const hpp = require('hpp');
const morgan = require("morgan");
const AppError = require('./Utils/appError');
const globalErrorHandler = require('./Controllers/errorController');

const userRouter = require('./Routes/userRoutes');
const animalRouter = require("./Routes/animalRoutes");
const medicalVisitRouter = require('./Routes/medicalVisitsRoutes');

const app = express();
// const listEndpoints = require('express-list-endpoints');

// Enable trust proxy
app.enable('trust proxy');

// Set view engine
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// Log basic request info
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  console.log('Headers:', req.headers);
  console.log('Query:', req.query);
  next();
});

// Use morgan to log request details
app.use(morgan(':method :url :status :res[content-length] - :response-time ms'));

// Home Routes
app.get("/", (req, res) => {
  res.send(`
    <div style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
      <h1 style="color:rgb(16, 223, 137);">🌟Welcome to <strong>Mobile Veterinary Services App</strong>🌟</h1>
      <h2 style="color:rgb(16, 223, 154);">Please Use Mobile App to Access the Services!</h2>
    </div>
  `);
});

app.get("/mvet", (req, res) => {
  res.send(`
    <div style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
      <h1 style="color:rgb(16, 223, 85);">🌟Welcome to <strong>Mobile Veterinary Services App</strong>🌟</h1>
      <h2 style="color:rgb(16, 223, 154);">Please Use Mobile App to Access the Services!</h2>
    </div>
  `);
});

// CORS configuration
let corsOptions;
if (process.env.NODE_ENV === 'production') {
  corsOptions = {
    origin: ['http://gkmvet.com', 'https://gkmvet.com','http://api.gkmvet.com', 'https://api.gkmvet.com', null],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  };
} else {
  corsOptions = {
    origin: '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  };
}
app.use(cors(corsOptions));

// Security
app.use(helmet());
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.',
  keyGenerator: req => req.ip,
  skip: req => false,
});
app.use(limiter);

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Prevent HTTP parameter pollution
app.use(hpp({ whitelist: ['id'] }));

// Track request time
app.use((req, res, next) => {
  req.requestTime = new Date().toLocaleString();
  next();
});

// Log request body and files (for API debugging)
app.use((req, res, next) => {
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    console.log('🔍 Body:', req.body);
  }
  if (req.files) {
    console.log('📎 Files:', req.files);
  }
  next();
});

// Routers
app.use('/api/mvet/users', userRouter);
app.use('/api/mvet/animals', animalRouter);
app.use('/api/mvet/medicalVisits', medicalVisitRouter);

// Catch undefined routes
// app.all('*', (req, res, next) => {
//   next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
// });

// Global error handler
app.use(globalErrorHandler);

module.exports = app;
