import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as admin from 'firebase-admin';
import { UserRole } from '../users/entities/user.entity';
import { randomBytes } from 'crypto';
import { RefreshToken } from './entities/refresh-token.entity';

@Injectable()
export class FirebaseAuthService {
  private readonly logger = new Logger(FirebaseAuthService.name);
  private firebaseInitialized: boolean = false;

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    @InjectRepository(RefreshToken)
    private refreshTokenRepository: Repository<RefreshToken>,
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
          
          // Add debug logging to identify private key structure issues
          this.logger.debug(`Private key length: ${serviceAccount.private_key.length}`);
          this.logger.debug(`Key ends with newline: ${serviceAccount.private_key.endsWith('\n')}`);
          this.logger.debug(`Has proper footer: ${serviceAccount.private_key.includes('-----END PRIVATE KEY-----')}`);
        }

        // Check if app already exists before initializing
        if (admin.apps.length === 0) {
          admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
          });
        }
        this.firebaseInitialized = true;
        this.logger.log('✅ [Firebase Init] Firebase Admin SDK initialized successfully');
      } catch (error: unknown) {
        const err = error as Error;
        this.logger.warn(
          '⚠️  [Firebase Init] Failed to initialize Firebase Admin SDK, OTP login will not work',
          err.message,
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

  /**
   * Generate all common phone number variations for lookup
   * Handles formats like: +919876543210, 919876543210, 9876543210
   */
  private generatePhoneVariations(phone: string): string[] {
    const digitsOnly = phone.replace(/[^0-9]/g, '');
    const variations = new Set<string>();
    
    // Add original phone
    variations.add(phone);
    
    // Add digits only
    variations.add(digitsOnly);
    
    // Extract last 10 digits (assuming Indian phone number)
    const last10Digits = digitsOnly.slice(-10);
    variations.add(last10Digits);
    
    // With +91 prefix
    variations.add(`+91${last10Digits}`);
    
    // With 91 prefix (no +)
    variations.add(`91${last10Digits}`);
    
    // With + and last 10 digits
    variations.add(`+${last10Digits}`);
    
    return Array.from(variations);
  }

  async verifyPhoneAndLogin(
    phone: string,
    idToken: string,
    firstName?: string,
    lastName?: string,
  ): Promise<{ access_token: string; user: any }> {
    this.logger.log(`Verifying phone login for: ${phone}`);

    // For development/testing: allow bypass with special token
    if (idToken === 'dev_test_token') {
      this.logger.log('Using dev test mode - bypassing Firebase verification');
      return this._handleDevLogin(phone);
    }

    // In production, verify Firebase ID token
    // Only bypass if explicitly in development mode AND Firebase is not initialized
    if (!this.firebaseInitialized) {
      this.logger.warn('Firebase not initialized - using fallback login for development');
      return this._handleDevLogin(phone, firstName, lastName);
    }

    // Production: Verify the Firebase ID token with timeout and retry logic
    try {
      this.logger.log(`Verifying Firebase ID token for phone: ${phone}`);
      
      const decodedToken = await this.verifyFirebaseTokenWithRetry(idToken, phone);
      
      // Verify the phone number matches
      if (decodedToken.phone_number !== phone) {
        this.logger.error(`Phone number mismatch: token has ${decodedToken.phone_number}, request has ${phone}`);
        throw new UnauthorizedException('Phone number mismatch. Please try logging in again.');
      }

      this.logger.log(`Firebase token verified for UID: ${decodedToken.uid}, Phone: ${decodedToken.phone_number}`);
    } catch (error: unknown) {
      const err = error as Error & { code?: string };
      this.logger.error(`Firebase token verification failed for ${phone}: ${err.message}`);
      
      // Return specific error messages based on error type
      if (err.message?.includes('timeout')) {
        this.logger.error(`Firebase API timeout for ${phone}`);
        throw new UnauthorizedException('Login service temporarily unavailable. Please try again in a few minutes.');
      }
      
      if (err.code === 'auth/id-token-expired') {
        this.logger.error(`Firebase token expired for ${phone}`);
        throw new UnauthorizedException('Session expired. Please login again.');
      }
      
      if (err.code === 'auth/invalid-id-token') {
        this.logger.error(`Invalid Firebase token for ${phone}`);
        throw new UnauthorizedException('Invalid login session. Please try logging in again.');
      }
      
      // Log the full error for debugging
      this.logger.error(`Full Firebase error: ${JSON.stringify({
        code: err.code,
        message: err.message,
        stack: err.stack?.split('\n').slice(0, 3).join('\n'),
      })}`);
      
      throw new UnauthorizedException('Login failed. Please try again.');
    }

    // Token is valid, proceed with login
    return this._handleDevLogin(phone, firstName, lastName);
  }

  /**
   * Verify Firebase ID token with retry logic for handling transient failures
   * Retries up to 3 times with exponential backoff
   */
  private async verifyFirebaseTokenWithRetry(idToken: string, phone: string, maxRetries: number = 3): Promise<admin.auth.DecodedIdToken> {
    const baseDelayMs = 1000; // 1 second base delay
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        this.logger.log(`Firebase token verification attempt ${attempt}/${maxRetries} for phone: ${phone}`);
        
        // Add timeout wrapper to prevent hanging requests
        const timeoutMs = 10000; // 10 seconds
        const timeoutPromise = new Promise<admin.auth.DecodedIdToken>((_, reject) => {
          setTimeout(() => reject(new Error('Firebase API timeout after 10s')), timeoutMs);
        });

        const decodedToken = await Promise.race([
          admin.auth().verifyIdToken(idToken),
          timeoutPromise,
        ]) as admin.auth.DecodedIdToken;

        this.logger.log(`Firebase token verified successfully on attempt ${attempt}`);
        return decodedToken;
        
      } catch (error: unknown) {
        const err = error as Error & { code?: string };
        
        // If this is the last attempt, throw the error
        if (attempt === maxRetries) {
          this.logger.error(`Firebase token verification failed after ${maxRetries} attempts for ${phone}: ${err.message}`);
          throw error;
        }
        
        // Check if error is retryable
        const isRetryable = 
          err.message?.includes('timeout') ||
          err.message?.includes('ETIMEDOUT') ||
          err.message?.includes('ECONNREFUSED') ||
          err.message?.includes('ENOTFOUND') ||
          err.code === 'auth/id-token-expired' || // Token might be valid now
          err.code === 'auth/invalid-id-token'; // Might be a temporary Firebase issue
        
        if (isRetryable) {
          const delayMs = baseDelayMs * Math.pow(2, attempt - 1); // Exponential backoff: 1s, 2s, 4s
          this.logger.warn(`Attempt ${attempt} failed for ${phone}: ${err.message}. Retrying in ${delayMs}ms...`);
          await new Promise(resolve => setTimeout(resolve, delayMs));
        } else {
          // Non-retryable error (like invalid token), throw immediately
          this.logger.error(`Non-retryable error for ${phone}: ${err.message}`);
          throw error;
        }
      }
    }
    
    // This should never be reached, but TypeScript needs it
    throw new Error('Unexpected end of retry logic');
  }

  /**
   * Development fallback login - creates/updates user without Firebase verification
   */
  private async _handleDevLogin(phone: string, firstName?: string, lastName?: string): Promise<{ access_token: string; user: any }> {
    this.logger.log(`Dev login for phone: ${phone}`);

    try {
      // Generate all possible phone number variations for lookup
      const phoneVariations = this.generatePhoneVariations(phone);
      this.logger.log(`Checking phone variations: ${JSON.stringify(phoneVariations)}`);
      
      let user = null;
      for (const variant of phoneVariations) {
        this.logger.log(`Trying phone variant: ${variant}`);
        user = await this.usersService.findOneByPhone(variant);
        if (user) {
          this.logger.log(`User found with phone variant: ${variant}`);
          break;
        }
      }

      if (!user) {
        // Create new user with consistent phone format
        const digitsOnly = phone.replace(/[^0-9]/g, '');
        const last10Digits = digitsOnly.slice(-10);
        const consistentPhone = `+91${last10Digits}`;
        
        this.logger.log(`Creating new user with normalized phone: ${consistentPhone}`);
        const securePassword = this.generateSecurePassword();
        
        // Sanitize incoming names
        const sanitizedFirstName = firstName?.trim() || '';
        const sanitizedLastName = lastName?.trim() || '';
        
        const createUserDto = {
          email: `user_${last10Digits}@phone.auth`,
          password: securePassword,
          firstName: sanitizedFirstName || 'User',
          lastName: sanitizedLastName || last10Digits,
          phone: consistentPhone,
          role: UserRole.USER,
        };
        user = await this.usersService.createWithTransaction(
          createUserDto as any,
          phone,
        );
        
        // ✅ FIX: Reload user from database after creation to get auto-generated publicId
        // TypeORM does not return generated UUID columns from insert operations
        this.logger.log(`Reloading newly created user to retrieve generated publicId`);
        const reloadedUser = await this.usersService.findOneByPhone(consistentPhone);
        
        if (!reloadedUser) {
          this.logger.error(`Failed to reload user after creation for phone: ${phone}`);
          throw new Error('User creation failed - could not retrieve created user');
        }
        
        user = reloadedUser;
        this.logger.log(`User reloaded successfully, publicId: ${user.publicId}`);
      } else {
        // Existing user - preserve their saved profile data
        // Never overwrite user entered names
      }

      const needsProfileCompletion =
        user.firstName === 'User' ||
        (user.email && user.email.endsWith('@phone.auth'));

      // Create plain object response - TypeORM entities have circular references that break Nest serialization
      const jwtResponse = this.generateJwt(user);

      // Create a refresh token for OTP login users (same as email/password login)
      const refreshToken = new RefreshToken();
      refreshToken.userId = user.id;
      refreshToken.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
      await this.refreshTokenRepository.save(refreshToken);

      // Return a clean serializable object, no TypeORM proxy entities
      const response: any = {
        access_token: jwtResponse.access_token,
        refresh_token: refreshToken.token,
        user: {
          id: user.id,
          publicId: user.publicId,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          email: user.email,
          role: user.role
        }
      };
      
      response.needsProfileCompletion = needsProfileCompletion;
      return response;
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(`Dev login failed: ${err.message}`);
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
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(`ID token verification failed: ${err.message}`);
      throw new UnauthorizedException('Invalid ID token');
    }
  }

  async getUserByPhone(phone: string): Promise<any> {
    return this.usersService.findOneByPhone(phone);
  }

  private generateJwt(user: any): { access_token: string; user: any; needsProfileCompletion?: boolean } {
    // FIX: Use publicId (UUID) instead of id (numeric) for JWT subject
    // This ensures consistency with auth.service.ts and passes UUID validation in jwt.strategy.ts
    
    // Validate required fields before generating token
    if (!user.publicId) {
      this.logger.error(`Cannot generate JWT: user.publicId is missing/undefined for user: ${user.id || user.phone}`);
      this.logger.error(`User object contents: ${JSON.stringify(user, Object.getOwnPropertyNames(user))}`);
      throw new Error('User public ID is required for token generation');
    }
    
    if (!user.email) {
      this.logger.error(`Cannot generate JWT: user.email is missing for user: ${user.publicId}`);
      throw new Error('User email is required for token generation');
    }
    
    if (!user.role) {
      this.logger.error(`Cannot generate JWT: user.role is missing for user: ${user.publicId}`);
      throw new Error('User role is required for token generation');
    }

    const payload = { email: user.email, sub: user.publicId, role: user.role };
    
    try {
      const accessToken = this.jwtService.sign(payload);
      
      return {
        access_token: accessToken,
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
    } catch (jwtError: unknown) {
      const err = jwtError as Error;
      this.logger.error(`JWT signing failed: ${err.message}`, err.stack);
      this.logger.error(`Failed payload: sub=${user.publicId}, email=${user.email}, role=${user.role}`);
      throw err;
    }
  }
}
