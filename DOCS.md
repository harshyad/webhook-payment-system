# API Documentation

## Webhook Payment System API

This system exposes endpoints for receiving payment status updates via webhooks and querying recorded payment status events.

### Base URL

All endpoints are based on the following URL:

```
http://localhost:8000
```

### Endpoints

#### 1. Webhook Receiver Endpoint

**POST** `/webhook/payments`

- **Description**: Receive payment status updates via webhook.

- **Headers**:

  - `Content-Type: application/json`
  - `X-Razorpay-Signature: <signature>` (required)

- **Body**: A JSON object representing the payment status event.

- **Responses**:
  - `200 OK`: Webhook processed successfully
  - `400 Bad Request`: Invalid JSON or missing required fields
  - `403 Forbidden`: Missing or invalid signature
  - `500 Internal Server Error`: Server error

- **Example**:

  ```
  POST /webhook/payments
  {
    "event": "payment.authorized",
    "payload": {
      "payment": {
        "entity": {
          "id": "pay_014",
          "status": "authorized",
          "amount": 5000,
          "currency": "INR"
        }
      }
    },
    "created_at": 1751889865,
    "id": "evt_auth_014"
  }
  ```

#### 2. Payment Event Query Endpoint

**GET** `/payments/{payment_id}/events`

- **Description**: Retrieve all events related to a specific payment ID.

- **Parameters**:

  - `payment_id` (string, path parameter): The ID of the payment whose events are to be retrieved.

- **Responses**:
  - `200 OK`: An array of events sorted by `received_at`
  - `500 Internal Server Error`: Server error

- **Example**:

  ```
  GET /payments/pay_014/events
  ```

  ```json
  [
    {
        "event_type": "payment.authorized",
        "received_at": "2025-07-29T10:11:34.230Z"
    },
    {
        "event_type": "payment.captured",
        "received_at": "2025-07-29T10:12:21.370Z"
    },
    {
        "event_type": "payment.failed",
        "received_at": "2025-07-29T10:12:58.444Z"
    }
  ]
  ```

### Testing with Mock Payloads

See the [README.md](README.md) for details on testing the webhook receiver with mock payloads using `curl` commands.
