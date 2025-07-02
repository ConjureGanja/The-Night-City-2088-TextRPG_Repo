Security Policy for Night City Cyberpunk 2088 RPG
We take the security of our project seriously. We appreciate your efforts to responsibly disclose your findings, and we will make every effort to acknowledge your contributions.

Supported Versions
Only the latest major version of the game receives security updates. Please ensure you are running the most up-to-date version.

Version

Supported

1.x.x

:white_check_mark:

< 1.0

:x:

Reporting a Vulnerability
We are grateful for security researchers and users who report vulnerabilities to us. All reports are thoroughly investigated by our team.

How to Report
Please do not report security vulnerabilities through public GitHub issues.

Instead, please report them directly to us via one of the following methods:

Primary Method: Private Vulnerability Reporting

Use GitHub's private vulnerability reporting feature. This is the most secure and preferred way to reach us.

Alternate Method: Email

If you cannot use GitHub's private reporting, you can send an email to: [falexcem@gmail.com]

What to Include in Your Report
To help us resolve the issue as quickly as possible, please include the following in your report:

A clear description of the vulnerability.

The version of the project affected.

Detailed steps to reproduce the vulnerability, including any specific inputs, configurations, or scenarios.

The potential impact of the vulnerability (e.g., data exposure, denial of service, prompt injection).

Any proof-of-concept code or screenshots that demonstrate the issue.

Our Commitment
When you report a vulnerability, you can expect the following:

We will acknowledge receipt of your report within 48 hours.

We will provide an initial assessment and a planned course of action within 7 business days.

We will maintain an open line of communication with you throughout the process.

We will notify you when the vulnerability has been patched and, with your permission, credit you for your discovery.

Specific Security Considerations
🤖 AI-Related Vulnerabilities
This project uses the Google Gemini API to generate in-game text and images. This introduces unique security considerations:

Prompt Injection: We are aware of the potential for prompt injection attacks, where a user might craft input to manipulate the AI's output in unintended ways. We are actively working on sanitizing inputs and structuring prompts to minimize this risk. Please report any successful prompt injection attacks as a security vulnerability.

Inappropriate Content Generation: While we have safety filters in place, there is a small chance the AI may generate offensive, biased, or otherwise inappropriate content. If you encounter this, please report it to us so we can refine our prompts and safety settings.

🔑 API Key Security
Under no circumstances should API keys (e.g., your Gemini API key) be committed to this repository. The project is designed to load the API key from a secure location, such as an environment variable or a .env file that is included in .gitignore.

If you discover an API key or other sensitive credentials accidentally committed to the repository's history, please report it to us immediately through the private channels listed above.
