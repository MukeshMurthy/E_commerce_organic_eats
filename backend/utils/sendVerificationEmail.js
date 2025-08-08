const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  }
});


const sendVerificationEmail = async (to, code) => {
  const mailOptions = {
    from: process.env.MAIL_USER,
    to,
    subject: 'Admin Verification Code',
    text: `Your admin verification code is: ${code}`
  };

  await transporter.sendMail(mailOptions);
};

module.exports = sendVerificationEmail;
