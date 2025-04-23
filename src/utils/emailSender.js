const nodemailer = require('nodemailer');

// Create reusable transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Send welcome email
const sendWelcomeEmail = async (user) => {
  try {
    await transporter.sendMail({
      from: `"BloodConnect" <${process.env.EMAIL_FROM}>`,
      to: user.email,
      subject: 'Welcome to BloodConnect',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #e53e3e;">Welcome to BloodConnect!</h2>
          <p>Hello ${user.name},</p>
          <p>Thank you for joining BloodConnect. Your registration is complete, and you can now start using our platform to connect with blood donors and recipients.</p>
          <p>Here's what you can do:</p>
          <ul>
            <li>Find blood donors in your area</li>
            <li>Create blood donation requests</li>
            <li>Volunteer to donate blood</li>
            <li>Track your donation history</li>
          </ul>
          <p>If you have any questions, feel free to reply to this email.</p>
          <p>Best regards,<br>The BloodConnect Team</p>
        </div>
      `
    });
    
    console.log(`Welcome email sent to ${user.email}`);
    return true;
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return false;
  }
};

// Send request confirmation email
const sendRequestConfirmationEmail = async (user, request) => {
  try {
    await transporter.sendMail({
      from: `"BloodConnect" <${process.env.EMAIL_FROM}>`,
      to: user.email,
      subject: 'Blood Request Confirmation',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #e53e3e;">Blood Request Confirmation</h2>
          <p>Hello ${user.name},</p>
          <p>Your blood request has been successfully created and is now active on our platform.</p>
          <p><strong>Request Details:</strong></p>
          <ul>
            <li>Patient: ${request.patient.name}</li>
            <li>Blood Type: ${request.patient.bloodType}</li>
            <li>Units Needed: ${request.unitsNeeded}</li>
            <li>Hospital: ${request.hospital.name}, ${request.hospital.city}</li>
            <li>Urgency: ${request.urgency}</li>
          </ul>
          <p>We will notify you when donors are matched with your request.</p>
          <p>Best regards,<br>The BloodConnect Team</p>
        </div>
      `
    });
    
    console.log(`Request confirmation email sent to ${user.email}`);
    return true;
  } catch (error) {
    console.error('Error sending request confirmation email:', error);
    return false;
  }
};

// Send donor match notification
const sendDonorMatchEmail = async (donor, request) => {
  try {
    await transporter.sendMail({
      from: `"BloodConnect" <${process.env.EMAIL_FROM}>`,
      to: donor.email,
      subject: 'Blood Donation Request Match',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #e53e3e;">Blood Donation Match Found</h2>
          <p>Hello ${donor.name},</p>
          <p>We've found a blood donation request that matches your blood type (${donor.bloodType}).</p>
          <p><strong>Request Details:</strong></p>
          <ul>
            <li>Blood Type Needed: ${request.patient.bloodType}</li>
            <li>Hospital: ${request.hospital.name}, ${request.hospital.city}</li>
            <li>Urgency: ${request.urgency}</li>
          </ul>
          <p>If you're available to donate, please log in to your account and confirm your participation.</p>
          <p>Your donation can save a life!</p>
          <p>Best regards,<br>The BloodConnect Team</p>
        </div>
      `
    });
    
    console.log(`Donor match email sent to ${donor.email}`);
    return true;
  } catch (error) {
    console.error('Error sending donor match email:', error);
    return false;
  }
};

// Send donation confirmation email
const sendDonationConfirmationEmail = async (donor, donation) => {
  try {
    await transporter.sendMail({
      from: `"BloodConnect" <${process.env.EMAIL_FROM}>`,
      to: donor.email,
      subject: 'Thank You for Your Blood Donation',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #e53e3e;">Thank You for Your Donation!</h2>
          <p>Hello ${donor.name},</p>
          <p>Thank you for your recent blood donation. Your generosity helps save lives!</p>
          <p><strong>Donation Details:</strong></p>
          <ul>
            <li>Date: ${new Date(donation.donationDate).toLocaleDateString()}</li>
            <li>Blood Type: ${donation.bloodType}</li>
            <li>Units: ${donation.units}</li>
            <li>Hospital: ${donation.hospital.name}, ${donation.hospital.city}</li>
          </ul>
          <p>Your donation count has been updated in your profile.</p>
          <p>Best regards,<br>The BloodConnect Team</p>
        </div>
      `
    });
    
    console.log(`Donation confirmation email sent to ${donor.email}`);
    return true;
  } catch (error) {
    console.error('Error sending donation confirmation email:', error);
    return false;
  }
};

module.exports = {
  sendWelcomeEmail,
  sendRequestConfirmationEmail,
  sendDonorMatchEmail,
  sendDonationConfirmationEmail
};
