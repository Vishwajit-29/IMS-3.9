# IMS - Inventory Management System

<p align="center">
  <img src="https://img.shields.io/badge/React-18.2.0-61DAFB?style=for-the-badge&logo=react" alt="React" />
  <img src="https://img.shields.io/badge/Spring_Boot-3.4.4-6DB33F?style=for-the-badge&logo=spring-boot" alt="Spring Boot" />
  <img src="https://img.shields.io/badge/MongoDB-5.0-47A248?style=for-the-badge&logo=mongodb" alt="MongoDB" />
  <img src="https://img.shields.io/badge/Docker-Supported-2496ED?style=for-the-badge&logo=docker" alt="Docker" />
</p>

IMS is a comprehensive Inventory Management System designed to help businesses efficiently track and manage their inventory. The application provides a user-friendly interface for managing products, tracking sales, and analyzing business performance.

## Table of Contents

- [Features](#features)
- [Technology Stack](#technology-stack)
- [Running with Docker](#running-with-docker)
- [Running Manually](#running-manually)
- [Architecture](#architecture)
- [Troubleshooting](#troubleshooting)

## Features

### User Authentication
- Secure login with JWT authentication
- Role-based access control

### Inventory Management
- Add, update, and remove inventory items
- Categorize items for better organization
- Set minimum stock levels for automatic low stock alerts
- Track stock quantities in real-time
- Add product images and descriptions

### Sales Management
- Record sales transactions
- View sales history by product
- Track revenue and popular items

### Category Management
- Create and manage product categories
- Filter products by category

### Dashboard and Analytics
- Visual representation of sales data with charts
- View low stock alerts
- Monitor top-selling products
- Track inventory value

### Price Management
- Update prices individually or in bulk
- Track price history

## Technology Stack

### Frontend
- React 18.2.0
- React Router for navigation
- Chart.js for data visualization
- Axios for API communication
- React Toastify for notifications
- CSS for styling

### Backend
- Spring Boot 3.4.4
- Spring Security for authentication
- Spring Data MongoDB for database operations
- JWT for secure token-based authentication

### Database
- MongoDB 5.0

## Running with Docker

Docker provides a consistent and isolated environment for running the application across different platforms.

### Prerequisites

- [Docker](https://www.docker.com/get-started) and Docker Compose installed

### Steps

1. **Clone the repository**

```bash
git clone <repository-url>
cd ims-inventory-management
```

2. **Run with Docker Compose**

```bash
docker-compose up -d
```

This command will:
- Build containers for frontend, backend, and MongoDB
- Configure the necessary network connections
- Start all services

3. **Access the application**

Open your browser and navigate to:
```
http://localhost:3000
```

### Stopping the Application

```bash
docker-compose down
```

To remove volumes (database data) when stopping:
```bash
docker-compose down -v
```

## Running Manually

For development or if you prefer to run components individually:

### Prerequisites

- Node.js 14+ and npm
- Java 17 JDK
- Maven 3.6+
- MongoDB 5.0+

### Steps

1. **Start MongoDB**

Ensure MongoDB is running on the default port (27017)

2. **Start the Backend**

```bash
cd backend
mvn clean install
mvn spring-boot:run
```

The backend will start on http://localhost:8080

3. **Start the Frontend**

```bash
cd frontend
npm install
npm start
```

The frontend will start on http://localhost:3000

## Architecture

The application follows a modern three-tier architecture:

1. **Presentation Layer (Frontend)**
   - React single-page application
   - Communicates with the backend via REST API

2. **Application Layer (Backend)**
   - Spring Boot REST API
   - Handles business logic, authentication, and data processing

3. **Data Layer**
   - MongoDB database
   - Stores inventory data, user information, and sales records

## Troubleshooting

### Docker Issues

If containers fail to start:

```bash
# Check container status
docker-compose ps

# View logs
docker-compose logs frontend
docker-compose logs backend
docker-compose logs mongodb
```

### Connection Issues

- Ensure all services are running on the same network
- Check if MongoDB is accessible from the backend
- Verify that the backend API is accessible from the frontend

### Manual Setup Issues

- Ensure correct versions of Node.js, Java, and MongoDB are installed
- Check application logs for specific error messages
- Verify that all dependencies are installed correctly
