## Technology Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: SQLite3
- **Authentication**: HMAC-SHA256 signature verification

## Project Structure

```
webhook-payment-system/
├── app.js                    # Main application file
├── database.js              # Database operations module
├── package.json             # Dependencies and scripts
├── README.md                # This file
├── DOCS.md                  # API documentation
├── mock_payloads/           # Test payload files
│   ├── payment_authorized.json
│   ├── payment_captured.json
│   └── payment_failed.json
└── payment_events.db        # SQLite database (automatically created on first run)
```

## Prerequisites

- Node.js (v14 or higher)
- npm (Node Package Manager)

## Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/harshyad/webhook-payment-system
   cd webhook-payment-system
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the server:**
   ```bash
   npm start
   ```

   The server will start on port 8000 by default. You can change this by setting the `PORT` environment variable:
   ```bash
   PORT=3000 npm start
   ```

## Quick Start

1. **Start the server:**
   ```bash
   npm start
   ```

2. **Test webhook endpoint:**
   ```bash
   # Send a payment authorized event
   curl -X POST http://localhost:8000/webhook/payments \
     -H "Content-Type: application/json" \
     -H "X-Razorpay-Signature: TEST_SIGNATURE" \
     -d @mock_payloads/payment_authorized.json

   # Send a payment captured event
   curl -X POST http://localhost:8000/webhook/payments \
     -H "Content-Type: application/json" \
     -H "X-Razorpay-Signature: TEST_SIGNATURE" \
     -d @mock_payloads/payment_captured.json
   ```

3. **Query payment events:**
   ```bash
   # Get events for payment ID pay_014
   curl http://localhost:8000/payments/pay_014/events
   ```

## Testing

### Manual Testing with curl

1. **Payment Authorized:**
   ```bash
   curl -X POST http://localhost:8000/webhook/payments \
     -H "Content-Type: application/json" \
     -H "X-Razorpay-Signature: TEST_SIGNATURE" \
     -d @mock_payloads/payment_authorized.json
   ```

2. **Payment Captured:**
   ```bash
   curl -X POST http://localhost:8000/webhook/payments \
     -H "Content-Type: application/json" \
     -H "X-Razorpay-Signature: TEST_SIGNATURE" \
     -d @mock_payloads/payment_captured.json
   ```

3. **Payment Failed:**
   ```bash
   curl -X POST http://localhost:8000/webhook/payments \
     -H "Content-Type: application/json" \
     -H "X-Razorpay-Signature: TEST_SIGNATURE" \
     -d @mock_payloads/payment_failed.json
   ```

### Test Edge Cases

1. **Invalid Signature:**
   ```bash
   curl -X POST http://localhost:8000/webhook/payments \
     -H "Content-Type: application/json" \
     -H "X-Razorpay-Signature: INVALID_SIGNATURE" \
     -d @mock_payloads/payment_authorized.json
   # Expected: 403 Forbidden
   ```

2. **Missing Signature:**
   ```bash
   curl -X POST http://localhost:8000/webhook/payments \
     -H "Content-Type: application/json" \
     -d @mock_payloads/payment_authorized.json
   # Expected: 403 Forbidden
   ```

3. **Invalid JSON:**
   ```bash
   curl -X POST http://localhost:8000/webhook/payments \
     -H "Content-Type: application/json" \
     -H "X-Razorpay-Signature: TEST_SIGNATURE" \
     -d '{"invalid": json}'
   # Expected: 400 Bad Request
   ```

4. **Duplicate Event:**
   ```bash
   # Send the same event twice
   curl -X POST http://localhost:8000/webhook/payments \
     -H "Content-Type: application/json" \
     -H "X-Razorpay-Signature: TEST_SIGNATURE" \
     -d @mock_payloads/payment_authorized.json
   # Expected: 200 OK with "Event already processed" message
   ```

## Configuration

The application uses the following configuration:

- **Port**: 8000 (configurable via `PORT` environment variable)
- **Shared Secret**: `test_secret` (hardcoded for testing)
- **Database**: SQLite file `payment_events.db`

## Database Schema

The SQLite database contains a single table `payment_events`:

```sql
CREATE TABLE payment_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  payment_id TEXT NOT NULL,
  payload TEXT NOT NULL,
  received_at TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## Security Features

- **Signature Verification**: All webhook requests must include a valid HMAC-SHA256 signature
- **Request Validation**: Comprehensive validation of JSON payloads and required fields
- **SQL Injection Protection**: Parameterized queries prevent SQL injection attacks
- **Error Handling**: Sensitive information is not exposed in error responses
