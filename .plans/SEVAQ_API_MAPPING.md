# SEVAQ API MAPPING

## AUTHENTICATION

### Login

Screen:
AUTH_01_Login

Endpoint:

POST /auth/send-otp

Request:

{
"phone": ""
}

Response:

{
"success": true,
"otpSent": true
}

---

### Verify OTP

Screen:
AUTH_02_OTP_Verification

Endpoint:

POST /auth/verify-otp

Request:

{
"phone": "",
"otp": ""
}

Response:

{
"token": "",
"user": {}
}

---

### Complete Profile

Screen:
AUTH_03_Profile_Setup

Endpoint:

POST /users/profile

Request:

{
"firstName": "",
"lastName": "",
"email": ""
}

Response:

{
"success": true
}

---

## COOKING SUBSCRIPTION

### Configuration

Screen:
COOK_02_Subscription_Configuration

Request:

{
"persons": 1,
"mealCoverage": "lunch"
}

Response:

{
"monthlyPrice": 5299
}

---

### Schedule

Screen:
COOK_03_Subscription_Schedule

Request:

{
"startDate": "",
"timeWindow": "morning"
}

Response:

{
"success": true
}

---

## CLEANING SUBSCRIPTION

### Configuration

Screen:
CLEAN_02_Subscription_Configuration

Request:

{
"apartmentSize": "2_bhk",
"coverage": "daily"
}

Response:

{
"monthlyPrice": 2999
}

---

### Schedule

Screen:
CLEAN_03_Subscription_Schedule

Request:

{
"startDate": "",
"timeWindow": "morning"
}

Response:

{
"success": true
}

---

## ONE-TIME BOOKINGS

### Create Request

Request:

{
"service": "",
"date": "",
"timeWindow": ""
}

Response:

{
"bookingId": "",
"status": "pending_assignment"
}

---

## BOOKINGS

### Active Bookings

GET /bookings/active

---

### Booking Details

GET /bookings/{id}

---

## PROFILE

### User Profile

GET /users/me

---

### Update Profile

PATCH /users/me

---

## PAYMENTS

### Create Payment

POST /payments/create

---

### Verify Payment

POST /payments/verify