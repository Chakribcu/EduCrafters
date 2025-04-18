# EduCrafters - E-Learning Course Marketplace

Hello there! This is my final project for the Web Development course - an interactive E-Learning Course Marketplace built using the MERN stack. Working on this project was quite challenging but also super rewarding as I got to implement real-world features like authentication, payment processing, and content management.

## Demo Credentials ( If not working make sure to register and login )

I've created some test accounts you can use to explore the different user roles:

### Student Account
- Email: chakri@gmail.com
- Password: password

### Instructor Account
- Email: chakri-in@gmail.com
- Password: password

## Project Overview

EduCrafters is a comprehensive e-learning platform where instructors can create and publish courses while students can browse, enroll, and learn. The platform implements content restrictions where only enrolled students can access full course content, while non-enrolled users can only view course details and preview lessons.

## Features

- **Clerk Authentication**: Secure user authentication with session management
- **Role-Based Access Control**: Different interfaces for students and instructors
- **Course Management**: Create, edit, and delete courses with rich content
- **Content Restriction**: Only introduction videos and preview lessons are visible to non-enrolled students
- **Video Lessons**: Support for YouTube, Vimeo, and direct video uploads
- **Lesson Management**: Organize course content into sections and lessons
- **Enrollment System**: Students can enroll in courses (free or paid)
- **Stripe Payment Integration**: Process payments in GBP currency
- **User Dashboards**: Personalized dashboards for students and instructors
- **Progress Tracking**: Students can mark lessons as complete and track their progress
- **Analytics Dashboard**: Instructors can view detailed enrollment and revenue metrics
- **Responsive Design**: Works on mobile, tablet, and desktop devices
- **Toast Notifications**: Informative notifications with progress bars and auto-close functionality


## Technology Stack


- **Frontend**: React.js with Bootstrap 5 for styling
- **Backend**: Node.js with Express.js
- **Database**: MongoDB Atlas
- **Authentication**: Clerk Authentication (replaces JWT)
- **Payment Processing**: Stripe API
- **State Management**: React Context API
- **Routing**: React Router
- **HTTP Client**: Axios
- **Form Handling**: React Hook Form with validation
- **Icons**: Bootstrap Icons
- **Toast Notifications**: Custom implementation with progress bars



## Setting Up in Visual Studio Code

I spent quite a bit of time making sure this project works well in VS Code, so here's a detailed guide:



### Prerequisites

1. **Node.js and npm**: Make sure you have Node.js (v14.x or later) installed
2. **MongoDB Atlas Account**: You'll need a MongoDB database
3. **Clerk Account**: For authentication services
4. **Stripe Account**: For payment processing (if implementing payments)
5. **Visual Studio Code**: With the following extensions:

   - ESLint
   - Prettier
   - ES7+ React/Redux/React-Native snippets
   - MongoDB for VS Code


### Installation Steps



### Running the Application in VS Code

1. **Open the project in VS Code**

  install all Dependencies :

  npm install
  
2. **Start the development server**
   
   Open a new terminal in VS Code (Terminal > New Terminal) and run:
   
   npm run dev
   
   
   This will start both the backend server and frontend development server concurrently.

3. **Access the application**
   
   Open your browser and navigate to:
   - Frontend: http://localhost:5000
   - API server: http://localhost:5000/api




### Common Issues and Troubleshooting

During development, I ran into several issues. Here's how to fix them:

1. **MongoDB Connection Errors**

   - Check MongoDB URI in .env file
   If you get a connection error, try running:
  
   node server/scripts/testDbConnection.js


2. **Node.js Version Issues**

   - Check your Node.js version with `node -v`
   - The project works best with Node.js v14.x or later
   - If using nvm, run `nvm use 14` or `nvm use 16`

3. **Clerk Authentication Issues**
 

            
   - Verify Clerk API keys in the .env file
   - Check that you've configured Clerk with the correct settings
   - Make sure you're using the latest clerk-sdk-node package


4. **Module Not Found Errors**

   - If you see "Module not found" errors, try:
   

     npm install --legacy-peer-deps
     
   - Or clear npm cache and reinstall:
   

     npm cache clean --force
     npm install
     

5. **Port Already in Use**


   - If port 5000 is already in use, change it in the .env file
   - Kill the process using the port:
   

     # On Windows
     netstat -ano | findstr :5000
     taskkill /PID <PID> /F
     
     # On Mac/Linux
     lsof -i :5000
     kill -9 <PID>



## Development Process

I approached this project in stages:

1. First set up the basic MERN stack infrastructure
2. Implemented authentication using Clerk
3. Built the course creation and management system
4. Added student enrollment functionality
5. Implemented content restriction for non-enrolled students
6. Added payment processing with Stripe (in testing)
7. Created the analytics dashboard for instructors
8. Improved the UI with responsive design
9. Added toast notifications with progress bars
10. Extensive testing and bug fixing



## Future Improvements

There's still a lot I'd like to add to this project:

1. Add more payment options (PayPal, etc.)
2. Implement course reviews and ratings
3. Add a messaging system between students and instructors
4. Create a more advanced search and filtering system
5. Implement video streaming with advanced controls
6. Add social sharing features


This project was created by Chakridhar as the D2 assignment for the Web Development course. Please feel free to reach out with any questions or feedback!