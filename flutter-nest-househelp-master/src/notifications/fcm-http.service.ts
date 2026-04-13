import { Injectable, Logger } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import axios from 'axios';

@Injectable()
export class FcmHttpService {
  private readonly logger = new Logger(FcmHttpService.name);
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  async sendNotification(token: string, title: string, body: string, data?: Record<string, string>) {
    try {
      const accessToken = await this.getAccessToken();
      
      const payload = {
        message: {
          token,
          notification: {
            title,
            body
          },
          data: data || {},
          android: {
            priority: 'high',
            notification: {
              channel_id: 'default',
              priority: 'max',
              sound: 'default'
            }
          },
          apns: {
            payload: {
              aps: {
                sound: 'default',
                contentAvailable: true
              }
            }
          }
        }
      };

      const response = await axios.post(
        'https://fcm.googleapis.com/v1/projects/sevaq-6fcc4/messages:send',
        payload,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      this.logger.log(`FCM notification sent successfully: ${response.data.name}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send FCM notification: ${error.message}`, error.response?.data);
      return false;
    }
  }

  private async getAccessToken(): Promise<string> {
    // Return cached token if still valid
    if (this.accessToken && Date.now() < this.tokenExpiry - 60000) {
      return this.accessToken as string;
    }

    const serviceAccount = this.getServiceAccount();
    
    // Generate JWT assertion for Google OAuth2
    const now = Math.floor(Date.now() / 1000);
    const claim = {
      iss: serviceAccount.client_email,
      scope: 'https://www.googleapis.com/auth/firebase.messaging',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now
    };

    const assertion = jwt.sign(claim, Buffer.from(serviceAccount.private_key), { algorithm: 'RS256' });

    // Exchange JWT for access token
    const response = await axios.post('https://oauth2.googleapis.com/token', new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: assertion
    }), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout: 10000
    });

    this.accessToken = response.data.access_token;
    this.tokenExpiry = Date.now() + (response.data.expires_in * 1000);
    
    this.logger.log('✅ FCM access token obtained successfully');
    return this.accessToken as string;
  }

  private getServiceAccount() {
    const serviceAccountRaw = process.env.FIREBASE_SERVICE_ACCOUNT || '';
    let serviceAccount;
    
    try {
      serviceAccount = JSON.parse(serviceAccountRaw);
    } catch (e) {
      // Fallback: try to fix escaped newlines before parsing
      try {
        serviceAccount = JSON.parse(serviceAccountRaw.replace(/\\n/g, '\n'));
      } catch (e2) {
        this.logger.error(`Failed to parse service account JSON: ${e2.message}`);
        throw e2;
      }
    }

    // Clean private key - only fix escaped newlines, jsonwebtoken handles proper parsing
    if (serviceAccount.private_key) {
      serviceAccount.private_key = serviceAccount.private_key
        .replace(/\\\\n/g, '\n')
        .replace(/\\n/g, '\n');
    }

    this.logger.log(`✅ Private key formatted successfully, length: ${serviceAccount.private_key?.length || 0}`);
    return serviceAccount;
  }
}
