<p align="center">
  <img src="public/assets/images/Logo.svg" alt="Circle Age Logo" width="400"/>
</p>

# CircleAge

**CircleAge** is developed as part of the Backend Development Module Group Assignment at Ngee Ann Polytechnic.

# The Team

- **Ooi Jing Shun**
- **Rafe Chan Rui An**
- **Ranen Sim Rui An**
- **Serene Ker**
- **Shawntrice Yip**

### **IMPORTANT**

#### **How to Run the Project**

1. **Install dependencies**  
   Run the following command in the project root directory to install all required packages:  
   `npm install`

2. **Start the backend server**  
   Use the command below to start the server:  
   `node app.js`

3. **Access the backend**  
   Once the server is running, open your browser and go to:  
   `http://localhost:3000`

> ⚠️ **Note:**  
> Credentials (e.g., database credentials, JWT secrets, API keys) are **not included** in this repository.  
> Please ensure you configure your own `.env` or `config` files with the necessary environment variables before running the server.

- For lecturers marking the project, these credentials are already provided in the folder submitted through the school portal.
- Thus, no additional configuration is required on your part; the project should run automatically with the provided setup.

### Github Repo Link

https://github.com/fisherman-23/BED2025Apr_P03_T2

### Figma Wireframe

[Placeholder]

## Overview of Idea

CircleAge is a senior-friendly web platform designed to promote healthy, independent, and socially connected aging. Tailored for seniors, CircleAge empowers users to manage health routines, join social groups and events, plan safe physical activities, navigate public facilities and transport, and stay connected through a befriender messaging system. Built using Node.js, Express, and MSSQL, CircleAge combines accessibility with robust functionality to support seniors in navigating daily life confidently.

## Key Features

The website consists of 5 specialized modules.

### Module 1: Medication & Appointment Manager

| Feature                              | Description                                                                                                                                                                                                                                                                                                                                                                          |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Medication CRUD Management           | Comprehensive medication tracking system allowing elderly users to add, view, update, and delete medications with dosage amounts, timing schedules, and special instructions. Features validation for required fields and displays immediate confirmation messages.                                                                                                                  |
| Automated SMS Reminder System        | Intelligent reminder system that sends SMS notifications at prescribed medication times using Twilio API integration. Includes 15-minute pre-reminders, escalating alerts for missed doses every 30 minutes up to 2 hours, and direct "mark as taken" functionality from SMS responses.                                                                                              |
| Appointment Booking Integration      | Caregiver-assisted appointment management connecting seniors with healthcare providers through doctor database searches by specialty and location. Features real-time availability checking, OneMap API integration for clinic directions, and automated email confirmations to both elderly users and caregivers.                                                                   |
| Emergency Contact Alert System       | Multi-tier safety system allowing users to designate primary and secondary emergency contacts with customizable alert preferences (immediate, 1-hour, 2-hour delays). Automatically triggers SMS/email escalation when medication adherence issues are detected, with integration to medication tracking for pattern analysis.                                                       |
| Real-time Health Analytics Dashboard | Interactive health monitoring dashboard using Chart.js visualizations designed specifically for seniors with large, clear fonts. Features medication compliance tracking with color-coded indicators (green/yellow/red), daily/weekly/monthly trend analysis, and simple warning messages for concerning patterns. Includes printable reports for doctor visits.                     |
| Caregiver Monitoring Portal          | Comprehensive real-time dashboard enabling family caregivers to monitor elderly family member's medication adherence remotely. Displays live compliance metrics, generates automated alerts for missed medications exceeding 2-hour thresholds, provides detailed medication history logs, and creates weekly adherence reports with PDF generation for healthcare provider sharing. |

### Module 2: Community Events & Meetings

| Feature | Description |
| ------- | ----------- |
| Group Management | Create and join public and private community groups with group pictures, descriptions, and member management. Easy group discovery and joining. |
| Invite System | Share group invite links or tokens for easy group joining. Secure token-based system prevents duplicate memberships. |
| Announcements | Group owners can post announcements with images. Members can view and interact with group updates and news. |
| Comment System | Comment on announcements with edit/delete permissions. Real-time comment loading and user authentication. |
| Video Meetings | Daily.co integration for group video calls. Host controls, participant management, QR code sharing for easy joining. |
| Event Coordination | Create and manage group meetings with persistent room links and participant tracking. Database storage for meeting history. |

### Module 3: Facility & Transport Navigator







| Feature | Description |
| ------- | ----------- |

### Module 4: Senior Fitness Coach

| Feature | Description |
| ------- | ----------- |

### Module 5: Messaging & Buddy System

| Feature          | Description                                                                                                                                 |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Friend System    | Allows users to add friends through sharing of public UUID, share link or QR Code. Users can accept, reject, or withdraw requests.          |
| Profile Matching | Suggests potential friends or connections based on shared characteristics, like common interests and hobbies.                               |
| Chat System      | Allows users to start and manage real-time one-on-one conversations with their friends. With support for message deletion & timestamp data. |
| Smart Reply      | Utilizes LLM to generate a potential reply based on the context of the conversation, enhancing user engagement and responsiveness.          |

## Technology Stack

| Component                | Description                                                                                                                                                                |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Jest**                 | Jest is utilized for unit testing of controller and model functions.                                                                                                       |
| **Swagger**              | Swagger is used for API documentation for our API routes, helping to provide detailed information.                                                                         |
| **Gemini Flash 2.0**     | Gemini LLM API is used for generating potential replies based on the context of the conversation in the chat module. The latest 3 messages are joined and sent to the API. |
| **Daily.co API**          | Daily.co video conferencing API integration for real-time video meetings within community groups. Provides room creation, participant management, host controls, and secure meeting tokens for seamless virtual gatherings designed for seniors. |
| **Axios HTTP Client**     | Axios is used for making HTTP requests to external APIs including Daily.co for video meetings and Google APIs for various integrations. Provides promise-based HTTP client with request/response interceptors and automatic JSON parsing. |
| **Joi Validation**        | Joi schema validation library used for robust input validation across community events, group creation, and announcement posting. Ensures data integrity with custom error messages and comprehensive validation rules for enhanced security. |
| **JSON Web Tokens (JWT)** | JWT implementation for secure user authentication and session management across all community features. Provides stateless authentication with configurable expiration times and refresh token support for enhanced security. |
| **Toastify.js**           | Toastify.js notification library used for user-friendly success and error messages throughout the community events interface. Provides accessible toast notifications with customizable styling optimized for senior users. |
| **Tailwind CDN**         | Tailwind CSS is included via CDN to quickly apply utility-first styles for responsive and modern UI design.                                                                |
| **qrcodejs CDN**         | qrcodejs is included via CDN to generate QR codes dynamically on the client side.                                                                                          |
| **Express.js**           | Express.js is the Node.js web framework used to handle routing, middleware, and server-side logic.                                                                         |
| **Microsoft SQL Server** | MSSQL is the database system used to store and retrieve structured data for the application.                                                                               |
