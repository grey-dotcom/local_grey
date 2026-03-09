# TaskSnapper

This is a Next.js application for visually tracking tasks.

## Troubleshooting AI Feature: `PERMISSION_DENIED` Error

You are seeing this message because you are encountering a `PERMISSION_DENIED` error when the application tries to use its AI features. Our recent debugging has confirmed that **the application code is working correctly**, but there is a problem with the Google Generative AI API Key you are using.

This error means one of two things:
1.  The API Key itself is incorrect, invalid, or has been revoked.
2.  The Google Cloud project associated with your API key does **not** have the **"Generative Language API"** enabled.

### **How to Fix This Permanently**

Please follow these steps in your Google Cloud Console to generate a new, valid API key.

1.  **Go to the Google Cloud Console:**
    *   Navigate to [https://console.cloud.google.com/](https://console.cloud.google.com/).

2.  **Enable the "Generative Language API":**
    *   In the search bar at the top, type **"Generative Language API"** and select it.
    *   Click the **"Enable"** button if it is not already enabled. This is a critical step.

3.  **Create New API Credentials:**
    *   In the search bar, type **"APIs & Services"** and go to that page.
    *   From the left menu, select **"Credentials"**.
    *   Click **"+ CREATE CREDENTIALS"** at the top of the page and select **"API key"**.
    *   A new API key will be generated. **Copy this new key immediately.**
    *   (Optional but recommended) Click "EDIT API KEY" to give your key a descriptive name (e.g., "TaskSnapper Key") and apply security restrictions if needed.

4.  **Provide the New Key:**
    *   Come back to this chat and provide me with the **newly copied API key**. I will replace the old one in the project's `.env` file.

5.  **Restart the Server:**
    *   After I confirm the key is replaced, you **MUST** restart your development server. In your terminal, press `Ctrl + C` to stop it, then run `npm run dev` to start it again.

Following these steps will ensure you have a valid key with the correct permissions, which will resolve the error.
