# 🍽️ Smart Mess Management System

A web-based system designed to simplify hostel and college mess operations through digital meal booking, online payment, QR-based meal redemption, and food-wastage tracking.

## 🚀 Features

- **User Authentication:** Registration, login, JWT authentication, and role-based authorization.
- **Menu Management:** Create and manage meal menus and their capacities.
- **Meal Booking:** Students can book available meals.
- **Payment Integration:** Razorpay integration with payment verification.
- **QR Code Redemption:** Generate QR codes for paid bookings and prevent duplicate meal redemption.
- **Admin Analytics:** Track revenue, booking statistics, meal demand, and menu capacity.
- **Food Wastage Tracking:** Record prepared, served, and wasted food and calculate wastage percentages.

## 🛠️ Tech Stack

- **Backend:** Node.js, Express.js
- **Database:** MongoDB, Mongoose
- **Authentication:** JSON Web Tokens (JWT)
- **Payment Gateway:** Razorpay
- **QR Code:** QR code generation and token-based redemption
- **API Testing:** Postman

## 🏗️ System Architecture


                 Client / Frontend
                        |
                        v
                  Express Routes
                        |
                        v
              Authentication Middleware
                   (JWT Verification)
                        |
                        v
              Role-Based Authorization
                        |
                        v
                 Controllers
                        |
          +-------------+-------------+
          |             |             |
          v             v             v
       Booking        Payment       Analytics
          |             |             |
          +-------------+-------------+
                        |
                        v
                Mongoose Models
                        |
                        v
                    MongoDB

The client sends HTTP requests to the backend. Express routes direct requests to the appropriate controllers. Middleware verifies user identity and permissions, controllers implement the business logic, and Mongoose interacts with MongoDB.

## 🔄 Main Workflow

1. **Register & Login:** Users register with their details and log in using their credentials. Passwords are hashed, and a JWT is generated after successful login.
2. **Browse Menu & Book:** Students view available meals and create bookings.
3. **Make Payment:** The backend creates a Razorpay order and verifies payment details before confirming the booking.
4. **Generate QR Code:** A unique token is generated for an eligible paid booking and returned as a QR code.
5. **Redeem Meal:** Authorized mess staff scan or submit the QR token. The backend validates the booking and marks it as redeemed, preventing duplicate redemption.
6. **View Analytics:** Admins can review revenue, booking statistics, meal demand, capacity, and food wastage.

## 🔐 Security

- Password hashing instead of storing plaintext passwords.
- JWT-based authentication for protected APIs.
- Role-based access control for students, staff, and admins.
- Server-side payment signature verification.
- Unique QR tokens and conditional database updates to prevent duplicate redemption.
- Environment variables for sensitive configuration and API secrets.

## 📊 Admin Analytics

The analytics module provides:

- Total and daily revenue.
- Revenue grouped by meal type.
- Booking counts by status.
- Booked and redeemed meal quantities.
- Menu capacity and remaining availability.
- Food wastage summaries and wastage percentages.

## ⚙️ Installation & Setup

### Prerequisites

- Node.js and npm
- MongoDB
- Razorpay test-mode account for payment testing

### Steps

1. Clone the repository:

   git clone <your-repository-url>
   cd <your-project-folder>
   ```

2. Install dependencies:

   npm install
   

3. Create a `.env` file in the backend project directory:

   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   RAZORPAY_KEY_ID=your_razorpay_key_id
   RAZORPAY_KEY_SECRET=your_razorpay_key_secret
   RAZORPAY_WEBHOOK_SECRET=your_webhook_secret

4. Start the server using your configured start script:

   npm start

   If you use Nodemon for development, run:

  
   npm run dev
   

> Configure the environment variables required by your actual implementation. Never commit your `.env` file or real API secrets to GitHub.

## 🎯 Project Objective

The goal of this project is to digitize mess operations, simplify meal booking and verification, improve payment tracking, monitor food demand, and reduce food wastage.

## 👨‍💻 Future Improvements

- Automated notifications for bookings and payments.
- Advanced reports and visual analytics.
- Improved deployment, logging, and automated testing.
- Food-demand forecasting to help reduce wastage.

---

**Note:** Update the setup instructions, frontend details, and feature list to match the functionality currently implemented in your repository.
