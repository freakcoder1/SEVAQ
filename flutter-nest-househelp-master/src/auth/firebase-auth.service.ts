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
        const serviceAccount = JSON.parse(serviceAccountJson);
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
        this.firebaseInitialized = true;
        this.logger.log('Firebase Admin SDK initialized successfully');
      } catch (error) {
        this.logger.warn(
          'Failed to initialize Firebase Admin SDK, OTP login will not work',
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

    if (!this.firebaseInitialized) {
      throw new UnauthorizedException('Firebase Auth not configured on server');
    }

    try {
      // Verify the Firebase ID token
      const decodedToken = await admin.auth().verifyIdToken(idToken);

      // Ensure the phone number matches
      if (decodedToken.phone_number !== phone) {
        this.logger.warn(
          `Phone number mismatch: expected ${phone}, got ${decodedToken.phone_number}`,
        );
        throw new UnauthorizedException('Phone number mismatch');
      }

      const firebaseUid = decodedToken.uid;
      this.logger.log(`Firebase UID: ${firebaseUid}`);

      // Find existing user by phone
      let user = await this.usersService.findOneByPhone(phone);

      if (!user) {
        // Create new user with phone-only auth
        this.logger.log(`Creating new user with phone: ${phone}`);

        // Generate a secure random password - not used for login but required by schema
        const securePassword = this.generateSecurePassword();

        const createUserDto = {
          email: `user_${firebaseUid}@phone.auth`,
          password: securePassword,
          firstName: 'User',
          lastName: phone.replace('+', ''),
          phone: phone,
          role: UserRole.USER,
        };

        // Use transaction-based creation to prevent race conditions
        user = await this.usersService.createWithTransaction(
          createUserDto as any,
          phone,
        );
      }

      // Generate JWT
      return this.generateJwt(user);
    } catch (error) {
      this.logger.error(`Phone verification failed: ${error.message}`);
      throw new UnauthorizedException('Invalid Firebase credentials');
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

  private generateJwt(user: any): { access_token: string; user: any } {
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
