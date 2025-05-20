SmartCV Analyzer - Project Setup and Running Instructions

Overview
---------------------------------------------------------------------------
SmartCV Analyzer is a web application built with Spring Boot for the backend and HTML/JavaScript for the frontend. It allows users to register, log in, and apply for jobs by uploading CVs, with features like CV text extraction and job matching.

Prerequisites
--------------------------------------------------------------------------------------------------------------
1. Java 17 or later
2. Maven 3.6.0 or later
3. MySQL 8.0 or later
4. A modern web browser (e.g., Chrome, Firefox)


You can watch these videos on how to install the prerequisites:

----> https://www.youtube.com/watch?v=Br98iO1K1SA


----> https://www.youtube.com/watch?v=R6MoDMASwag



Setup Instructions
------------------
1. Unzip the project folder in your local machine using:

   - Navigate to the project directory:
     
     cd smartcvanalyzer
     

2. Configure the Database
   - Ensure MySQL is running on your system.
   - Create a database named `smartcv_db`:
 
     mysql -u root -p
     CREATE DATABASE smartcv_db;
     
   - Update the database configuration in `src/main/resources/application.properties`:
     
     spring.datasource.url=jdbc:mysql://localhost:3306/smartcv_db
     spring.datasource.username=root
     spring.datasource.password=your_password
     spring.jpa.hibernate.ddl-auto=update
     ```

3. Build the Project (open your cmd inside the project)
   - Use Maven to build the project:
  
     mvn clean install
     

4. Populate Initial Data (Optional)
   - To test the application, you can add a default admin user to the database:
   
     INSERT INTO users (username, email, password) VALUES ('admin', 'admin@example.com', '$2a$10$WqK8zV5zXj9e1m5fJ5Yh5eXqK8zV5zXj9e1m5fJ5Yh5eXqK8zV5z');
     INSERT INTO user_roles (user_id, roles) VALUES ((SELECT id FROM users WHERE username = 'admin'), 'ROLE_ADMIN');
   
   - The password above is the BCrypt-encoded version of `admin123`.
---------------------------------------------------------
Running the Application
-----------------------------------------------------------
1. Start the Spring Boot application:
 
   mvn spring-boot:run
  
2. Open a web browser and navigate to:
   
   http://localhost:8080/index.html
   
3. Sign up a new user via `http://localhost:8080/signup.html`.

-----------------------------------
Troubleshooting
---------------------------------
- If the application fails to start, check the server logs in the console for errors.
- Ensure the database is running and the credentials in `application.properties` are correct.
- If you encounter login issues, verify the user exists in the `users` table and the password is correctly encoded.

-----------------------
Additional Notes
--------------------------
- The application uses Basic Auth for API requests after login. Ensure your browser supports Basic Auth prompts for protected endpoints.
- To debug, check the server logs for detailed error messages, especially in the `AuthController` class.
