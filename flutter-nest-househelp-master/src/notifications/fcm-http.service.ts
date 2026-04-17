import { Injectable, Logger } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import axios from 'axios';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Worker } from '../workers/entities/worker.entity';

@Injectable()
export class FcmHttpService {
  private readonly logger = new Logger(FcmHttpService.name);
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Worker)
    private workersRepository: Repository<Worker>,
  ) {}

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
              notification_priority: 'PRIORITY_MAX',
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
      this.logger.log(`FCM response details: ${JSON.stringify(response.data)}`);
      return true;
    } catch (error: any) {
      this.logger.error(`Failed to send FCM notification: ${error.message}`);
      this.logger.error(`FCM Error Response Status: ${error.response?.status}`);
      this.logger.error(`FCM Error Response Data: ${JSON.stringify(error.response?.data)}`);
      this.logger.error(`FCM Error Details:`, error.response?.data?.error);

      // Handle invalid token errors - automatically clean up stale tokens
      const errorStatus = error.response?.data?.error?.status;
      const errorMessage = error.response?.data?.error?.message || '';
      
      // Extract FCM specific error code from details
      let fcmErrorCode = null;
      const errorDetails = error.response?.data?.error?.details;
      if (Array.isArray(errorDetails)) {
        const fcmError = errorDetails.find(d => d['@type'] === 'type.googleapis.com/google.firebase.fcm.v1.FcmError');
        if (fcmError) {
          fcmErrorCode = fcmError.errorCode;
        }
      }

      this.logger.debug(`FCM Error Status: ${errorStatus}, FCM Error Code: ${fcmErrorCode}, Message: ${errorMessage}`);

      // Check for all invalid / unregistered token cases
      const isInvalidToken =
        // V1 API errors
        fcmErrorCode === 'UNREGISTERED' ||
        fcmErrorCode === 'INVALID_ARGUMENT' ||
        // Legacy error messages
        errorMessage.includes('InvalidRegistration') ||
        errorMessage.includes('NotRegistered') ||
        errorMessage.includes('Requested entity was not found') ||
        errorMessage.includes('InvalidApnsToken') ||
        errorMessage.includes('token is not registered');

      if (isInvalidToken) {
        this.logger.warn(`⚠️ Invalid / UNREGISTERED FCM token detected, removing from database: ${token.substring(0, 30)}...`);
        
        // Clear token from both user and worker tables
        const userResult = await this.usersRepository.update({ fcmToken: token }, { fcmToken: '' });
        const workerResult = await this.workersRepository.update({ fcmToken: token }, { fcmToken: '' });
        
        this.logger.log(`✅ Removed invalid FCM token - Users affected: ${userResult.affected}, Workers affected: ${workerResult.affected}`);
        
        if (userResult.affected === 0 && workerResult.affected === 0) {
          this.logger.warn(`⚠️ Token was not found in database - may have already been removed or whitespace mismatch`);
        }
      }

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

    // For jsonwebtoken v9+, pass key must be PEM string with proper headers/footers intact
    // Buffer wrapping causes key validation issues in v9+, use raw string directly
    const assertion = jwt.sign(claim, serviceAccount.private_key, { algorithm: 'RS256' });

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
      } catch (e2: any) {
        this.logger.error(`Failed to parse service account JSON: ${e2.message}`);
        throw e2;
      }
    }

    // Clean private key - ensure proper PEM format for RS256
    if (serviceAccount.private_key) {
      // Handle any level of newline escaping
      let key = serviceAccount.private_key;
      while (key.includes('\\n')) {
        key = key.replace(/\\n/g, '\n');
      }
      
      // Ensure the key starts and ends properly with correct line breaks
      key = key.trim();
      
      // Normalize line endings to just \n (Unix-style)
      key = key.replace(/\r\n/g, '\n');
      
      // ONLY add BEGIN/END markers if they are NOT already present
      if (!key.includes('-----BEGIN PRIVATE KEY-----')) {
        key = `-----BEGIN PRIVATE KEY-----\n${key}\n-----END PRIVATE KEY-----`;
      }
      
      serviceAccount.private_key = key;
    }

    this.logger.log(`✅ Private key formatted successfully, length: ${serviceAccount.private_key?.length || 0}`);
    return serviceAccount;
  }
}
