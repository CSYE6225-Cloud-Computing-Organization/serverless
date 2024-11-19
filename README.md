# AWS Lambda Email Verification Function

This project contains an AWS Lambda function designed to send email verification links via SendGrid when triggered by an AWS SNS message.

## Overview

The function listens for SNS messages containing the recipient's user ID, email address, verification token, and timestamp. It constructs a verification link and sends it to the provided email address using SendGrid.

## Prerequisites

- AWS account
- SendGrid account
- Node.js installed on your local machine (to test locally)

## Setup

### Environment Variables

You need to set the following environment variables in your Lambda function:

- `SENDGRID_API_KEY`: Your SendGrid API key.
- `VERIFICATION_LINK_BASE`: The base URL for your verification link to which the token will be appended as a query parameter.
- `FROM_EMAIL`: The email address from which the verification email will be sent.

You can configure these variables in the AWS Lambda console or via the AWS CLI.

### IAM Permissions

The Lambda function requires permissions to access SNS and SendGrid. Ensure your Lambda execution role has the following permissions:

- `sns:Publish` (if the Lambda function needs to publish back to SNS)
- Internet access to call the SendGrid API (ensure it is not in a VPC or has VPC access configured properly)

### Deployment

1. Package your Lambda function code and dependencies into a ZIP file.
2. Create a new Lambda function in the AWS Management Console.
3. Upload the ZIP file as the function code.
4. Configure the trigger as an SNS topic.
5. Set the environment variables as mentioned above.

## Testing

To test the function, publish a sample SNS message with the following format:

```json
{
  "userId": "newUserId",
  "email": "example@example.com",
  "token": "your-verification-token",
  "timestamp": "2021-01-01T00:00:00.000Z"
}
