const express = require('express');
const path = require('path');
const cors = require('cors');
const bodyparser = require('body-parser');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const hpp = require('hpp');
const morgan=require("morgan")
const AppError = require('./Utils/appError');
const globalErrorHandler = require('./Controllers/errorController');

const userRouter = require('./Routes/userRoutes');

const app = express(); //start Express app

const listEndpoints = require('express-list-endpoints');
console.log(listEndpoints(app));

app.get("/", (req, res) => {
  res.send(`
    <div style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
      <h1 style="color:rgb(223, 16, 212);">🌟Welcome to <strong>Mobile Veternary Services</strong>🌟</h1>
      <h2 style="color:rgb(223, 16, 212);">Stay tuned for incredible changes ahead!</strong></h2>
    </div>
  `);
});

app.get("/mvet", (req, res) => {
  res.send(`
    <div style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
      <h1 style="color:rgb(223, 16, 212);">🌟Welcome to <strong>Mobile Veternary Services</strong>🌟</h1>
      <h2 style="color:rgb(223, 16, 212);">Stay tuned for incredible changes ahead!</strong></h2>
    </div>
  `);
});


app.enable('trust proxy'); //Set trust proxy correctly based on whether your application is behind a proxy.

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// #1 Global Middlwares
// Implement CORS
// Postman usually sets null as the origin unless specified otherwise. 
// This may cause your server to reject requests if null is not included in the origin list.
let corsOptions;
if (process.env.NODE_ENV === 'production') {
  corsOptions = {
    origin: ['http://49.13.235.6','http://banapvs.com','https://banapvs.com','https://49.13.235.6',null], // Allowed origin for production
    credentials: true, // Enable credentials like cookies
    methods: ['GET', 'POST', 'PUT', 'PATCH','DELETE','OPTIONS'], // Add allowed methods
  };
} else {
  corsOptions = {
    origin: '*', // Allow all origins for development
    credentials: true, // Enable credentials like cookies
    methods: ['GET', 'POST', 'PUT', 'PATCH','DELETE','OPTIONS'], // Add allowed methods
  };
}

// Apply CORS middleware
app.use(cors(corsOptions));

// Serving static files
app.use(express.static(path.join(__dirname, 'public')));

// Security HTTP Headers
app.use(helmet());
app.use(compression());

// Development logging
if (process.env.NODE_ENV === 'development') {
  //app.use(morgan('dev'));
  app.use(morgan("combined"))
}

//Limit requests from Same API (Configure rate limiting in express-rate-limit to use the correct IP source.)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  skip: (req, res) => {
    return true; // Always skip rate limiting, effectively making it infinite
  },
  keyGenerator: (req) => {
    return req.ip; // Use req.ip if not behind a proxy
  },
  handler: (req, res, next, options) => {
    res.status(options.statusCode).json({
      message: options.message,
    });
  },
});
app.use(limiter); // Apply rate limiter to all routes

//Body parser, reading data from body into req.body
// app.use(bodyparser.json());no need to add
// // app.use(logmiddlware); // Apply log middleware to all routes
//app.use(bodyparser.urlencoded({ extended: true }));
app.use(express.json()); // built-in middleware
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Prevent parameter pollution
app.use(
  hpp({
    whitelist: ['id'],
  })
);

// Test Middleware
app.use((req, res, next) => {
  req.requesttime = new Date().toLocaleString();
  next();
});


//  #2 Routers
app.use('/api/mvet/users',userRouter);


// Catch-all route handler for undefined routes
//  app.all('*', (req, res, next) => {
//     next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
// });

// Global error handling middleware
// app.use(globalErrorHandler);

module.exports = app;
