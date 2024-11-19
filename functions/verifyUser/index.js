const AWS = require('aws-sdk');
const sgMail = require('@sendgrid/mail');
require('dotenv').config();

// Configure SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

exports.handler = async (event) => {
  try {
    // Parse SNS message
    const snsMessage = JSON.parse(event.Records[0].Sns.Message);
    const { email, token } = snsMessage;

    // Check required environment variables
    if (!process.env.SENDGRID_API_KEY || !process.env.VERIFICATION_LINK_BASE || !process.env.FROM_EMAIL) {
      throw new Error("Missing required environment variables.");
    }

    // Construct the verification link
    const verificationLink = `${process.env.VERIFICATION_LINK_BASE}?token=${token}`;

    // Send the verification email
    await sendVerificationEmail(email, verificationLink);

    return { statusCode: 200, body: 'Verification email sent successfully.' };
  } catch (error) {
    console.error("Error in Lambda function:", error.message);
    return { statusCode: 500, body: 'Failed to send verification email.' };
  }
};

// Function to send verification email using SendGrid
const sendVerificationEmail = async (email, verificationLink) => {
  const msg = {
    to: email,
    from: process.env.FROM_EMAIL,
    subject: 'Verify your email address',
    text: `Click the following link to verify your email address: ${verificationLink}\n\nThis link will expire in 2 minutes.`,
  };

  try {
    await sgMail.send(msg);
    console.log('Email sent successfully to:', email);
  } catch (error) {
    console.error('Error sending email:', error.response ? error.response.body : error.message);
    throw new Error('Failed to send verification email via SendGrid.');
  }
};
