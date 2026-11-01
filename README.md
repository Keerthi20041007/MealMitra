#  MealMitra – Food Donation Management Platform

MealMitra is a web-based food donation management platform designed to reduce food wastage by connecting food donors with NGOs. It provides a centralized platform where donors can share surplus food, NGOs can discover and manage available donations, and administrators can monitor platform activities.

The main aim of MealMitra is to make food donation and collection easier, more organized, and more accessible.

##  Key Features

###  Donor Module
- User registration and login.
- Submit food donation details.
- Provide food quantity, description, and pickup information.
- View and track submitted donations.
- Monitor donation status.

###  NGO Module
- NGO registration and login.
- View available food donations.
- Accept suitable donations.
- Manage accepted donations and collection activities.
- View donor pickup locations using embedded Google Maps.

###  Admin Module
- Administrative dashboard.
- Manage and monitor platform users.
- Monitor donation activities.
- View platform information and records.

*The features listed above should be checked against the final working version before publication.*

##  Technology Stack

| Area | Technology |
|---|---|
| Frontend | Angular |
| Programming language (frontend) | TypeScript |
| Backend | Node.js |
| Backend framework | Express.js |
| Database | MongoDB |
| API communication | REST APIs |
| Map integration | Google Maps Embed |
| Package management | npm |

##  Project Architecture

MealMitra follows a client-server architecture.

1. **Frontend:** Angular provides the user interface for donors, NGOs, and administrators.
2. **Backend:** Node.js and Express.js handle API requests, authentication, validation, and application logic.
3. **Database:** MongoDB stores user details, donation information, and related records.
4. **Map Integration:** Google Maps embedding displays donor pickup locations using latitude and longitude coordinates.

##  Application Workflow

1. Users register and log in to the platform.
2. Donors submit food donation details.
3. The backend validates the submitted information and stores it in MongoDB.
4. NGOs retrieve and view available donations.
5. An NGO can accept a suitable donation.
6. The donation status is updated through the backend.
7. Donors and NGOs can view the updated donation information.

##  Project Structure

The project is organized into separate frontend and backend applications.

```text
MealMitra/
│
├── frontend/
│   └── Angular application
│
├── backend/
│   └── Node.js and Express application
│
├── .env
├── .gitignore
└── README.md
```

*This is a simplified overview. The actual folder and file structure may contain additional directories.*

##  Installation and Setup

### Prerequisites

Install the following before running the project:

- Node.js
- npm
- Angular CLI
- MongoDB
- Git

### 1. Clone the repository

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
```

```bash
cd MealMitra
```

### 2. Set up the backend

```bash
cd backend
npm install
```

Create or configure the environment file using the variables required by your backend:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/mealmitra
JWT_SECRET=your_secure_secret_key
```

Make sure the variable names match the ones used in your backend code. Do not publish real passwords, secrets, or private credentials.

Start the backend using the script configured in `backend/package.json`. For example:

```bash
npm run dev
```

### 3. Set up the frontend

Open another terminal:

```bash
cd frontend
npm install
```

Run the Angular application:

```bash
npx ng serve
```

### 4. Open the application

Frontend:

```text
http://localhost:4200
```

Backend:

```text
http://localhost:5000
```

Make sure MongoDB is running and the backend is connected to the database before testing the application.

## 🗄️ Database

MealMitra uses MongoDB to store application data, including:

- User information
- Donor and NGO details
- Food donation records
- Donation status and collection information

The database name used in the local configuration is `mealmitra`.

## 🔐 Security

- User authentication.
- Password hashing.
- Token-based authentication.
- Backend-side request validation and authorization.

*Security features should be verified against the current backend implementation.*

## 🗺️ Map Integration

MealMitra uses Google Maps embedding to display food pickup locations. Latitude and longitude coordinates are used to generate the map location, helping NGOs identify where donated food needs to be collected.

## 🚀 Future Enhancements

- Automated donor and NGO matching.
- Real-time notifications.
- Location-based donation recommendations.
- Collection route optimization.
- Donation statistics and analytics.

## 🎯 Project Objective

MealMitra aims to bridge the gap between surplus food and people in need by making food donation easier to coordinate through technology.

## 👩‍💻 Contributors

Developed as an academic group project by MCA students at St. Aloysius (Deemed to be University), Mangalore.

## 📄 License

This project is currently intended for academic and educational purposes. A license can be added when the project is ready for open-source distribution.