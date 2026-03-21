# OTP and User Creation Flow Security Analysis

## Executive Summary

This document provides an in-depth analysis of security issues, architectural problems, and patch work in the OTP and user creation flow of the NestJS backend. Multiple critical security vulnerabilities have been identified that require immediate attention.

---

## 1. User Entity - Phone Column Issues

### File: [`src/users/entities/user.entity.ts`](flutter-nest-househelp-master/src/users/entities/user.entity.ts:47)

#### Current State (Lines 46-47):
```typescript
@Column({ nullable: true })
phone: string;
```

### Issues Identified:

| Issue | Severity | Description |
|-------|----------|-------------|
| **No Unique Constraint** | 🔴 Critical | Phone column is NOT unique, allowing duplicate phone numbers |
| **Nullable Without Validation** | 🟡 Medium | Phone can be null without business logic validation |
| **No Index** | 🟡 Medium | No database index on phone column for performance |

### Security Impact:
- Multiple users can register with the same phone number
- OTP login may return incorrect user if duplicates exist
- Account takeover risk if phone numbers are recycled

### Root Fix Required:
```typescript
@Column({ 
  nullable: true, 
  unique: true,
  length: 20 
})
@Index()
phone: string;
```

**Migration Required:**
```sql
-- Step 1: Handle existing duplicates before adding constraint
DELETE FROM users 
WHERE id NOT IN (
  SELECT MIN(id) 
  FROM users 
  WHERE phone IS NOT NULL 
  GROUP BY phone
);

-- Step 2: Add unique constraint
ALTER TABLE users 
ADD CONSTRAINT UQ_user_phone UNIQUE (phone);

-- Step 3: Add index for performance
CREATE INDEX IDX_user_phone ON users(phone);
```

---

## 2. Firebase Auth Service - OTP Flow Issues

### File: [`src/auth/firebase-auth.service.ts`](flutter-nest-househelp-master/src/auth/firebase-auth.service.ts)

### Issue 2.1: Fake Email Pattern Workaround (Lines 86-87, 93)

#### Current Code:
```typescript
// Line 86-87: Check if user exists by email with fake pattern
user = await this.usersService.findOneByEmail(`${phone}@firebase.auth`);

// Line 93: Create user with fake email
email: `${phone}@firebase.auth`,
```

#### Problems:
1. **Domain Spoofing Risk**: Using `@firebase.auth` domain which doesn't exist
2. **Data Integrity Issue**: Fake emails pollute the email column
3. **Validation Bypass**: DTO validation allows this pattern but it's semantically wrong
4. **Future Migration Pain**: Hard to clean up fake emails later

#### Root Cause:
The system was designed with email as the primary identifier, but phone-based OTP was added later as a workaround rather than redesigning the auth model.

#### Proper Fix:
**Option A: Separate Auth Providers Table (Recommended)**
```typescript
// New entity: auth_providers
@Entity()
export class AuthProvider {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column({ type: 'enum', enum: ['email', 'phone', 'google', 'apple'] })
  provider: string;

  @Column()
  providerId: string; // phone number or email or sub

  @Column({ nullable: true })
  firebaseUid: string;
}
```

**Option B: Make Email Nullable with Auth Type**
```typescript
@Entity()
export class User {
  @Column({ nullable: true, unique: true })
  email: string;

  @Column({ nullable: true, unique: true })
  phone: string;

  @Column({ type: 'enum', enum: ['email', 'phone'] })
  authType: string;

  @Column({ nullable: true })
  firebaseUid: string;
}
```

---

### Issue 2.2: Firebase UID Used as Password (Line 94)

#### Current Code:
```typescript
password: firebaseUid, // Use Firebase UID as password
```

#### Problems:
1. **Security Risk**: Firebase UID is not a secret - it's exposed in client-side tokens
2. **No Hashing Consistency**: The UID is stored as-is, not hashed like regular passwords
3. **Bypass Risk**: If someone knows the Firebase UID, they can authenticate

#### Attack Scenario:
```javascript
// Attacker extracts Firebase UID from decoded token
const decodedToken = jwt.decode(idToken);
// Uses UID as password to potentially access other endpoints
```

#### Root Fix:
```typescript
// Generate a cryptographically secure random password
import { randomBytes } from 'crypto';

const generateSecurePassword = (): string => {
  return randomBytes(32).toString('hex');
};

// In create user:
const createUserDto = {
  email: `${phone}@firebase.auth`, // Temporary - see Issue 2.1 fix
  password: generateSecurePassword(), // Secure random password
  firstName: 'User',
  lastName: phone.replace('+', ''),
  phone: phone,
  role: UserRole.USER,
  firebaseUid: firebaseUid, // Store separately
};
```

---

### Issue 2.3: Empty Update Call - Dead Code (Line 103)

#### Current Code:
```typescript
} else {
  // Update user's Firebase UID
  await this.usersService.update(user.id, {} as any);
}
```

#### Problems:
1. **No-Op Update**: Empty object `{}` updates nothing
2. **Type Safety Violation**: `as any` bypasses TypeScript checks
3. **Wasted DB Call**: Unnecessary database round-trip
4. **Misleading Comment**: Comment says "Update Firebase UID" but doesn't

#### Root Fix:
```typescript
} else {
  // Check if we need to link Firebase UID
  if (!user.firebaseUid) {
    await this.usersService.update(user.id, { firebaseUid });
  }
  // Or simply remove this block if no update is needed
}
```

---

### Issue 2.4: Race Condition in User Creation (Lines 82-104)

#### Current Flow:
```typescript
// Line 82: Check by phone
let user = await this.usersService.findOneByPhone(phone);

if (!user) {
  // Line 86: Check by fake email
  user = await this.usersService.findOneByEmail(`${phone}@firebase.auth`);
}

if (!user) {
  // Lines 89-100: Create new user
  user = await this.usersService.create(createUserDto as any);
}
```

#### Problems:
1. **Time-of-Check to Time-of-Use (TOCTOU)**: Between check and create, another request could create the same user
2. **Duplicate Users**: Two concurrent OTP requests with same phone create duplicate accounts
3. **No Transaction**: No database transaction wrapping the check-create flow

#### Root Fix:
```typescript
async verifyPhoneAndLogin(phone: string, idToken: string): Promise<{ access_token: string; user: any }> {
  // ... token verification ...

  return this.usersRepository.manager.transaction(async (transactionalEntityManager) => {
    // Use transaction-scoped repository
    const userRepo = transactionalEntityManager.getRepository(User);
    
    // Try to find existing user with lock
    let user = await userRepo.findOne({
      where: [{ phone }, { email: `${phone}@firebase.auth` }],
      lock: { mode: 'pessimistic_write' },
    });

    if (!user) {
      // Create with conflict handling
      try {
        user = userRepo.create({
          email: `${phone}@firebase.auth`,
          password: await bcrypt.hash(generateSecurePassword(), 10),
          firstName: 'User',
          lastName: phone.replace('+', ''),
          phone,
          role: UserRole.USER,
          firebaseUid,
          publicId: uuidv4(),
        });
        await userRepo.save(user);
      } catch (error) {
        // Handle unique constraint violation from concurrent creation
        if (error.code === '23505') { // PostgreSQL unique violation
          user = await userRepo.findOne({
            where: [{ phone }, { email: `${phone}@firebase.auth` }],
          });
        } else {
          throw error;
        }
      }
    }

    return this.generateJwt(user);
  });
}
```

---

## 3. Users Service - Missing Validations

### File: [`src/users/users.service.ts`](flutter-nest-househelp-master/src/users/users.service.ts)

### Issue 3.1: No Duplicate Phone Check (Lines 17-27)

#### Current Code:
```typescript
async create(createUserDto: CreateUserDto): Promise<User> {
  const salt = await bcrypt.genSalt();
  const hashedPassword = await bcrypt.hash(createUserDto.password, salt);

  const user = this.usersRepository.create({
    ...createUserDto,
    password: hashedPassword,
    publicId: uuidv4(),
  });
  return this.usersRepository.save(user);
}
```

#### Problems:
1. **No Pre-Creation Check**: Doesn't check if phone already exists
2. **No Email Duplicate Check**: Doesn't check if email already exists
3. **Raw Error Exposure**: Database unique constraint errors bubble up as 500 errors
4. **No Transaction**: Partial failures leave orphaned data

#### Root Fix:
```typescript
async create(createUserDto: CreateUserDto): Promise<User> {
  // Check for existing email
  const existingEmail = await this.findOneByEmail(createUserDto.email);
  if (existingEmail) {
    throw new ConflictException('User with this email already exists');
  }

  // Check for existing phone
  if (createUserDto.phone) {
    const existingPhone = await this.findOneByPhone(createUserDto.phone);
    if (existingPhone) {
      throw new ConflictException('User with this phone number already exists');
    }
  }

  const salt = await bcrypt.genSalt();
  const hashedPassword = await bcrypt.hash(createUserDto.password, salt);

  const user = this.usersRepository.create({
    ...createUserDto,
    password: hashedPassword,
    publicId: uuidv4(),
  });

  try {
    return await this.usersRepository.save(user);
  } catch (error) {
    if (error.code === '23505') { // PostgreSQL unique violation
      throw new ConflictException('User already exists');
    }
    throw error;
  }
}
```

---

### Issue 3.2: No Phone Normalization

#### Problem:
Phone numbers are stored as-is without normalization:
- `+91-98765-43210`
- `+919876543210`
- `9876543210`
- `09876543210`

All could be the same number but stored differently.

#### Root Fix:
```typescript
import { parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js';

private normalizePhone(phone: string): string {
  try {
    const parsed = parsePhoneNumber(phone);
    if (!parsed || !parsed.isValid()) {
      throw new BadRequestException('Invalid phone number format');
    }
    return parsed.format('E.164'); // +919876543210
  } catch {
    throw new BadRequestException('Invalid phone number format');
  }
}

async create(createUserDto: CreateUserDto): Promise<User> {
  if (createUserDto.phone) {
    createUserDto.phone = this.normalizePhone(createUserDto.phone);
  }
  // ... rest of create logic
}

async findOneByPhone(phone: string): Promise<User | null> {
  const normalizedPhone = this.normalizePhone(phone);
  return this.usersRepository.findOneBy({ phone: normalizedPhone });
}
```

---

## 4. Auth Controller - Validation Gaps

### File: [`src/auth/auth.controller.ts`](flutter-nest-househelp-master/src/auth/auth.controller.ts)

### Issue 4.1: Missing Phone Format Validation (Lines 95-117)

#### Current Code:
```typescript
@Post('otp/verify-login')
async verifyOtpLogin(@Body() req: { phone: string; idToken: string }) {
  // Only checks if phone exists, not format
  if (!req.phone || !req.idToken) {
    throw new HttpException(
      'Phone number and ID token are required',
      HttpStatus.BAD_REQUEST,
    );
  }
  // ...
}
```

#### Problems:
1. **No Format Validation**: Accepts any string as phone number
2. **No Length Limits**: Could accept extremely long strings (DoS risk)
3. **No Country Code Validation**: Accepts invalid country codes
4. **Type Safety**: Using inline type instead of DTO

#### Root Fix:
```typescript
// Create new DTO: otp-login.dto.ts
export class OtpLoginDto {
  @IsNotEmpty({ message: 'Phone number is required' })
  @IsString({ message: 'Phone number must be a string' })
  @Matches(/^\+[1-9]\d{1,14}$/, {
    message: 'Phone number must be in E.164 format (e.g., +919876543210)',
  })
  @MaxLength(15, { message: 'Phone number is too long' })
  phone: string;

  @IsNotEmpty({ message: 'ID token is required' })
  @IsString({ message: 'ID token must be a string' })
  @MinLength(100, { message: 'Invalid ID token format' })
  idToken: string;
}

// In controller:
@Post('otp/verify-login')
async verifyOtpLogin(@Body() dto: OtpLoginDto) {
  const result = await this.firebaseAuthService.verifyPhoneAndLogin(
    dto.phone,
    dto.idToken,
  );
  return result;
}
```

---

### Issue 4.2: Missing Rate Limiting (All OTP Endpoints)

#### Current State:
No rate limiting on:
- `POST /auth/otp/verify-login`
- `POST /auth/otp/verify-token`
- `POST /auth/otp/get-user`

#### Security Impact:
- **Brute Force**: Unlimited OTP verification attempts
- **Firebase Costs**: Unlimited token verification = unlimited Firebase API calls
- **DoS**: Can overwhelm the server with verification requests

#### Root Fix:
```typescript
// app.module.ts - Global throttler configuration
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    ThrottlerModule.forRoot({
      throttlers: [
        {
          name: 'default',
          ttl: 60000, // 1 minute
          limit: 10, // 10 requests per minute
        },
        {
          name: 'otp',
          ttl: 60000,
          limit: 3, // 3 OTP attempts per minute
        },
      ],
    }),
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})

// Controller with specific rate limits
@Controller('auth')
export class AuthController {
  
  @Post('otp/verify-login')
  @Throttle({ otp: { ttl: 60000, limit: 3 } }) // 3 per minute
  async verifyOtpLogin(@Body() dto: OtpLoginDto) {
    // ...
  }
}
```

---

### Issue 4.3: Missing User Existence Check Before Creation

#### Current Flow:
The controller delegates user existence check to the service, but there's no explicit check before calling `verifyPhoneAndLogin`.

#### Root Fix:
The fix should be in the service layer (see Issue 2.4), but the controller should also handle the case properly:

```typescript
@Post('otp/verify-login')
async verifyOtpLogin(@Body() dto: OtpLoginDto) {
  this.logger.log(`OTP login request received - Phone: ${dto.phone}`);

  try {
    const result = await this.firebaseAuthService.verifyPhoneAndLogin(
      dto.phone,
      dto.idToken,
    );
    
    // Log whether this was a new user or existing
    const isNewUser = result.user.createdAt > new Date(Date.now() - 5000); // Within last 5 seconds
    this.logger.log(
      `OTP login successful for phone: ${dto.phone}, New user: ${isNewUser}`
    );
    
    return {
      ...result,
      isNewUser,
    };
  } catch (error) {
    this.logger.error(`OTP login failed: ${error.message}`);
    
    if (error instanceof ConflictException) {
      throw new HttpException(
        'User already exists with different credentials',
        HttpStatus.CONFLICT,
      );
    }
    
    throw new HttpException(
      'Authentication failed',
      HttpStatus.UNAUTHORIZED,
    );
  }
}
```

---

## 5. JWT Strategy - ID Migration Patch Work

### File: [`src/auth/jwt.strategy.ts`](flutter-nest-househelp-master/src/auth/jwt.strategy.ts)

### Issue 5.1: Dual ID Format Support (Lines 52-60)

#### Current Code:
```typescript
// Validate that the userId is either a valid UUID or a numeric string
const isNumeric = /^\d+$/.test(userId);
const isUUID = validate(userId);

if (!isNumeric && !isUUID) {
  console.log(
    '🔍 DEBUG: JWT Strategy validation failed - invalid ID format',
  );
  throw new Error('Invalid user ID format: Expected numeric or UUID');
}
```

#### Problems:
1. **Technical Debt**: Supporting both formats indicates incomplete migration
2. **Security Risk**: Numeric IDs are predictable (sequential)
3. **Inconsistency**: Different tokens may have different formats
4. **Debug Code in Production**: Console.log statements should be removed

#### Root Cause:
The system migrated from numeric IDs to UUIDs but kept backward compatibility instead of forcing a clean migration.

#### Root Fix:
**Step 1: Force UUID Only (After Migration Complete)**
```typescript
async validate(payload: any) {
  const userId = payload.sub?.toString();

  if (!userId || !validate(userId)) {
    throw new UnauthorizedException('Invalid token: User ID must be UUID');
  }

  // Verify user exists in database
  const user = await this.usersService.findOneByPublicId(userId);
  if (!user) {
    throw new UnauthorizedException('User not found');
  }

  return { 
    userId, 
    email: payload.email, 
    role: payload.role,
    // Include additional security context
    iat: payload.iat,
    exp: payload.exp,
  };
}
```

**Step 2: Token Refresh Migration Strategy**
```typescript
// In auth.service.ts - During login, ensure all new tokens use UUID
async login(user: any) {
  // Always use publicId (UUID) in token
  const payload = { 
    email: user.email, 
    sub: user.publicId, // Always UUID
    role: user.role 
  };
  
  return {
    access_token: this.jwtService.sign(payload),
    user: {
      id: user.publicId, // Return UUID to client
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    },
  };
}
```

---

### Issue 5.2: Loose Payload Validation (Lines 28-47)

#### Current Code:
```typescript
async validate(payload: any) {
  console.log(
    '🔍 DEBUG: JWT Strategy validate called with payload:',
    JSON.stringify(payload, null, 2),
  );

  // Extract user ID from payload - support both numeric and UUID formats
  // IMPORTANT: Handle case where payload.sub might be missing or invalid
  let userId: string;

  if (payload.sub) {
    userId = payload.sub.toString();
  } else if (payload.userId) {
    userId = payload.userId.toString();
  } else {
    console.log(
      '🔍 DEBUG: JWT Strategy validation failed - no user ID in payload',
    );
    throw new Error('Invalid token: Missing user ID');
  }
```

#### Problems:
1. **Accepts Multiple Payload Formats**: `sub` OR `userId` - indicates inconsistency
2. **No Schema Validation**: `payload: any` accepts any structure
3. **Debug Code**: Console.log in production code
4. **No Expiration Check**: Relies on JWT library but doesn't explicitly validate
5. **No Issuer/Audience Check**: Tokens from any source would be accepted

#### Root Fix:
```typescript
import { JwtPayload } from 'jsonwebtoken';

interface CustomJwtPayload extends JwtPayload {
  sub: string;        // User ID (UUID only)
  email: string;      // User email
  role: string;       // User role
  type: 'access';     // Token type
  iat: number;        // Issued at
  exp: number;        // Expiration
  iss: string;        // Issuer
  aud: string;        // Audience
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    const secret = configService.get<string>('JWT_SECRET');
    const issuer = configService.get<string>('JWT_ISSUER', 'sevaq-app');
    const audience = configService.get<string>('JWT_AUDIENCE', 'sevaq-api');
    
    if (!secret) {
      throw new Error('Missing required environment variable: JWT_SECRET');
    }
    
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
      issuer,
      audience,
    });
  }

  async validate(payload: CustomJwtPayload): Promise<AuthenticatedUser> {
    // Validate required fields
    if (!payload.sub || !validate(payload.sub)) {
      throw new UnauthorizedException('Invalid token: Missing or invalid user ID');
    }

    if (!payload.email || !payload.role) {
      throw new UnauthorizedException('Invalid token: Missing required claims');
    }

    // Verify user still exists and is active
    const user = await this.usersService.findOneByPublicId(payload.sub);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (user.isBlocked) {
      throw new UnauthorizedException('User account is blocked');
    }

    // Return clean, validated user object
    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  }
}
```

---

## 6. Summary of Critical Issues

### 🔴 Critical (Fix Immediately)

| Issue | Location | Impact |
|-------|----------|--------|
| Phone not unique | `user.entity.ts:47` | Duplicate accounts, account takeover |
| Firebase UID as password | `firebase-auth.service.ts:94` | Credential exposure, bypass risk |
| Race condition in user creation | `firebase-auth.service.ts:82-104` | Duplicate users, data corruption |
| No rate limiting | `auth.controller.ts` | Brute force, DoS, Firebase cost abuse |

### 🟡 High (Fix Soon)

| Issue | Location | Impact |
|-------|----------|--------|
| Fake email pattern | `firebase-auth.service.ts:86-93` | Data integrity, migration issues |
| No phone normalization | `users.service.ts` | Duplicate phone variations |
| No duplicate checks | `users.service.ts:17-27` | Poor error handling, 500 errors |
| Dual ID format support | `jwt.strategy.ts:52-60` | Security debt, predictable IDs |
| Loose JWT validation | `jwt.strategy.ts:28-47` | Token forgery risk |

### 🟢 Medium (Fix When Possible)

| Issue | Location | Impact |
|-------|----------|--------|
| Empty update call | `firebase-auth.service.ts:103` | Wasted DB call |
| Debug code in production | `jwt.strategy.ts` | Log pollution |
| No phone index | `user.entity.ts:47` | Query performance |

---

## 7. Implementation Priority

### Phase 1: Security Hotfixes (Immediate)
1. Add unique constraint to phone column
2. Generate secure random passwords for OTP users
3. Add rate limiting to OTP endpoints
4. Fix race condition with transactions

### Phase 2: Data Integrity (1-2 weeks)
1. Implement phone normalization
2. Add duplicate checks in users service
3. Clean up fake email addresses
4. Remove debug console.log statements

### Phase 3: Architecture Improvements (1 month)
1. Implement separate auth providers table
2. Remove dual ID format support
3. Add strict JWT payload validation
4. Add comprehensive audit logging

---

## 8. Testing Recommendations

### Unit Tests
```typescript
describe('FirebaseAuthService', () => {
  it('should not create duplicate users on concurrent requests', async () => {
    // Test race condition fix
  });

  it('should reject invalid phone formats', async () => {
    // Test phone validation
  });

  it('should generate secure random passwords', async () => {
    // Test password generation
  });
});
```

### Integration Tests
```typescript
describe('OTP Flow', () => {
  it('should enforce rate limiting', async () => {
    // Make 4 requests, 4th should be rejected
  });

  it('should normalize phone numbers', async () => {
    // Test various formats map to same user
  });

  it('should reject tokens with numeric IDs', async () => {
    // Test JWT strategy enforces UUID only
  });
});
```

### Security Tests
```typescript
describe('Security', () => {
  it('should not allow account takeover with recycled phone', async () => {
    // Test unique phone constraint
  });

  it('should not expose Firebase UID as password', async () => {
    // Verify password is hashed and random
  });
});
```

---

*Document generated: 2026-02-02*
*Classification: Internal - Security Sensitive*