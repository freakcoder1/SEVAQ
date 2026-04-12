import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as admin from 'firebase-admin';
import { UserRole } from '../users/entities/user.entity';
import { randomBytes } from 'crypto';

@Injectable()
export class FirebaseAuthService {
  private readonly logger = new Logger(FirebaseAuthService.name);
  private firebaseInitialized: boolean = false;

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {
    this.initializeFirebase();
  }

  private initializeFirebase() {
    // Check if Firebase is already initialized
    if (admin.apps.length > 0) {
      this.firebaseInitialized = true;
      this.logger.log('Firebase Admin SDK already initialized');
      return;
    }

    // Initialize Firebase Admin with service account from environment
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;

    if (
      serviceAccountJson &&
      serviceAccountJson !== 'your-firebase-project-id'
    ) {
      try {
        // Fix: replace escaped newlines in private key before parsing
        const fixedServiceAccountJson = serviceAccountJson.replace(/\\n/g, '\n');
        const serviceAccount = JSON.parse(fixedServiceAccountJson);
        
        // Fix: ensure private key has proper formatting
        // Proper private key sanitization for DER parsing
        if (serviceAccount.private_key) {
          // First normalize all line endings
          let privateKey = serviceAccount.private_key
            .replace(/\\n/g, '\n')
            .replace(/\\\\n/g, '\n')
            .replace(/\r\n/g, '\n')
            .replace(/\r/g, '\n');

          // Extract ONLY the content between valid PEM markers
          // This removes ANY characters before header or after footer
          const pemMatch = privateKey.match(/-----BEGIN PRIVATE KEY-----(.*?)-----END PRIVATE KEY-----/s);
          
          if (pemMatch) {
            // Reconstruct clean properly formatted private key
            privateKey = [
              '-----BEGIN PRIVATE KEY-----',
              pemMatch[1].trim(),
              '-----END PRIVATE KEY-----'
            ].join('\n');
          }

          serviceAccount.private_key = privateKey;
          
          // Debug logging for private key validation
          this.logger.debug(`Private key length: ${serviceAccount.private_key.length}`);
          this.logger.debug(`Key has proper footer: ${serviceAccount.private_key.includes('-----END PRIVATE KEY-----')}`);
          this.logger.debug(`Key ends with correct marker: ${serviceAccount.private_key.endsWith('-----END PRIVATE KEY-----')}`);
        }

        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
        this.firebaseInitialized = true;
        this.logger.log('✅ [Firebase Init] Firebase Admin SDK initialized successfully');
      } catch (error) {
        this.logger.warn(
          '⚠️  [Firebase Init] Failed to initialize Firebase Admin SDK, OTP login will not work',
          error.message,
        );
        this.firebaseInitialized = false;
      }
    } else {
      this.logger.warn(
        'Firebase service account not configured, OTP login will not work',
      );
      this.firebaseInitialized = false;
    }
  }

  /**
   * Generate a cryptographically secure random password
   * Used for phone-only auth users who don't need password login
   */
  private generateSecurePassword(): string {
    return randomBytes(32).toString('hex');
  }

  async verifyPhoneAndLogin(
    phone: string,
    idToken: string,
  ): Promise<{ access_token: string; user: any }> {
    this.logger.log(`Verifying phone login for: ${phone}`);

    // For development/testing: allow bypass with special token
    if (idToken === 'dev_test_token') {
      this.logger.log('Using dev test mode - bypassing Firebase verification');
      return this._handleDevLogin(phone);
    }

    // Bypass Firebase for development - always use fallback mode
    this.logger.warn('Development mode - using fallback without Firebase verification');
    return this._handleDevLogin(phone);
  }

  /**
   * Development fallback login - creates/updates user without Firebase verification
   */
  private async _handleDevLogin(phone: string): Promise<{ access_token: string; user: any }> {
    this.logger.log(`Dev login for phone: ${phone}`);

    try {
      // Normalize phone number: strip all non-numeric characters for consistent lookup
      const normalizedPhone = phone.replace(/[^0-9]/g, '');
      this.logger.log(`Normalized phone for lookup: ${normalizedPhone}`);
      
      // Find existing user by phone - try both original and normalized formats
      let user = await this.usersService.findOneByPhone(phone);
      
      // If not found, try with normalized phone number
      if (!user) {
        this.logger.log(`User not found with original phone, trying normalized: ${normalizedPhone}`);
        user = await this.usersService.findOneByPhone(`+${normalizedPhone}`);
      }

      if (!user) {
        // Create new user
        this.logger.log(`Creating new user with phone: ${phone}`);
        const securePassword = this.generateSecurePassword();
        const createUserDto = {
          email: `user_${phone.replace(/[^0-9]/g, '')}@phone.auth`,
          password: securePassword,
          firstName: 'Worker',
          lastName: phone.replace('+', ''),
          phone: phone,
          role: UserRole.USER,
        };
        user = await this.usersService.createWithTransaction(
          createUserDto as any,
          phone,
        );
      } else {
        // FIX: If user has default "User" name (e.g., "User 917870603149"), update it
        // This handles the case where users were created with old code
        const isDefaultName =
          user!.firstName === 'User' &&
          user!.lastName &&
          /^\d{10,15}$/.test(user!.lastName.replace(/\+/, ''));
        
        if (isDefaultName) {
          this.logger.log(`Updating default name for user: ${user!.publicId}`);
          await this.usersService.update(user!.publicId, {
            firstName: 'Worker',
            lastName: phone.replace('+', ''),
          } as any);
          // Update local user object for subsequent checks
          user!.firstName = 'Worker';
          user!.lastName = phone.replace('+', '');
        }
      }

      const needsProfileCompletion =
        user.firstName === 'User' ||
        (user.email && user.email.endsWith('@phone.auth'));

      const jwtResponse: any = this.generateJwt(user);
      jwtResponse.needsProfileCompletion = needsProfileCompletion;
      return jwtResponse;
    } catch (error) {
      this.logger.error(`Dev login failed: ${error.message}`);
      throw new UnauthorizedException('Login failed');
    }
  }

  async verifyIdToken(idToken: string): Promise<any> {
    if (!this.firebaseInitialized) {
      throw new UnauthorizedException('Firebase Auth not configured on server');
    }

    try {
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      return {
        uid: decodedToken.uid,
        phone: decodedToken.phone_number,
        email: decodedToken.email,
      };
    } catch (error) {
      this.logger.error(`ID token verification failed: ${error.message}`);
      throw new UnauthorizedException('Invalid ID token');
    }
  }

  async getUserByPhone(phone: string): Promise<any> {
    return this.usersService.findOneByPhone(phone);
  }

  private generateJwt(user: any): { access_token: string; user: any; needsProfileCompletion?: boolean } {
    // FIX: Use publicId (UUID) instead of id (numeric) for JWT subject
    // This ensures consistency with auth.service.ts and passes UUID validation in jwt.strategy.ts
    const payload = { email: user.email, sub: user.publicId, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.publicId, // Return publicId as the user id to frontend
        publicId: user.publicId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        role: user.role,
      },
    };
  }
}
