const nodemailer = require('nodemailer');
const catchAsync = require('./catchAsync');

exports.sendEmail = catchAsync(async (options) => {
  // Configure the transporter for Gmail
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: process.env.EMAIL_HOST,
    port: 587,
    secure: false, //// Use `true` for port 465, `false` for all other port
    auth: {
      user:process.env. EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

  // 2) Define the email options
  const mailOptions = {
    from: process.env.EMAIL_HOST,
    to: options.email,
    subject: options.subject,
    text: options.message,
    //html:options.message
  };
  transporter.verify((error, success) => {
    if (error) {
      //console.log(error);
    } else {
      // console.log('Server is ready to take our messages');
    }
  });
  return transporter.sendMail(mailOptions)
   
});

exports.sendWelcomeEmail = async (user, password) => {
  const subject = defaultVariables.subject;
  const email = user.email;
  const loginLink = process.env.NODE_ENV === 'development' 
    ? defaultVariables.localURL 
    : defaultVariables.remoteUrl;

  const message = `Hi ${user.fullName},
  
  Welcome to Our Platform! We're excited to have you on board.
  
  Here are your account details:
  - User Code/Name: ${user.userCode}
  - Email: ${email}
  - Password: ${password}
  
  Login here: ${loginLink}
  
  Please visit our platform to explore and start using our services.
  If you have any questions or need assistance, feel free to contact our support team.
  
  Best regards,
  The Bana Marketing Group Team`;

  await sendEmail({ email, subject, message });
};
