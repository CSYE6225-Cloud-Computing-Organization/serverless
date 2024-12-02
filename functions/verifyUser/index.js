const AWS = require('aws-sdk');
const sgMail = require('@sendgrid/mail');

// Function to fetch secrets dynamically (optional if not using runtime secret fetching)
const getSecretValue = async (secretName) => {
  const secretsManager = new AWS.SecretsManager();
  const secret = await secretsManager.getSecretValue({ SecretId: secretName }).promise();
  return JSON.parse(secret.SecretString);
};

// Lambda handler
exports.handler = async (event) => {
  try {
    // Optionally fetch secrets dynamically if environment variables are not used
    if (!process.env.SENDGRID_API_KEY || !process.env.VERIFICATION_LINK_BASE || !process.env.FROM_EMAIL) {
      const secrets = await getSecretValue(process.env.SECRETS_MANAGER_ARN); // Pass ARN in environment variable
      process.env.SENDGRID_API_KEY = secrets.SENDGRID_API_KEY;
      process.env.VERIFICATION_LINK_BASE = secrets.VERIFICATION_LINK_BASE;
      process.env.FROM_EMAIL = secrets.FROM_EMAIL;
    }

    // Validate required environment variables
    const requiredEnvVars = ['SENDGRID_API_KEY', 'VERIFICATION_LINK_BASE', 'FROM_EMAIL'];
    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        throw new Error(`Missing required environment variable: ${envVar}`);
      }
    }

    // Configure SendGrid
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    // Parse SNS message
    const snsMessage = JSON.parse(event.Records[0].Sns.Message);
    const { email, token } = snsMessage;

    if (!email || !token) {
      throw new Error("Invalid SNS message. 'email' and 'token' are required.");
    }

    // Construct the verification link
    const verificationLink = `${process.env.VERIFICATION_LINK_BASE}?token=${token}`;

    // Send the verification email
    await sendVerificationEmail(email, verificationLink);

    return { statusCode: 200, body: JSON.stringify({ message: 'Verification email sent successfully.' }) };
  } catch (error) {
    console.error("Error in Lambda function:", error.message, error.stack);
    return { statusCode: 500, body: JSON.stringify({ message: 'Failed to send verification email.', error: error.message }) };
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
    console.log('Verification email sent successfully to:', email);
  } catch (error) {
    console.error('Error sending email via SendGrid:', error.response ? error.response.body : error.message);
    throw new Error('Failed to send verification email via SendGrid.');
  }
};

