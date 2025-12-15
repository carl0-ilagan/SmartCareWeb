# Smart Care System Architecture Blueprint

## System Overview

The SmartCare system is developed for patients and doctors in Holy Infant Savior Somos Hospital and Medical Center Inc. Bansud, Oriental Mindoro to provide accessible and real-time telehealth services. Users without an existing account must sign up and register through the SmartCare portal. Once registered, users can log in, access teleconsultation services, manage medical records, and receive health-related notifications and updates, enabling more efficient and accessible healthcare within the community.

---

## System Architecture

**Figure 5. System Architecture**

Figure 5 shows how the SmartCare system is structured. Basically, we have three types of users - patients, doctors, and admins. Each one has their own web interface where they can access the system. Patients and doctors use a Progressive Web App (PWA) that works on both mobile and desktop, while admins use a web application mainly for desktop.

For security, all users need to login using Google Authentication. This uses OAuth 2.0 which is a secure way to verify who the user is. After logging in, the system connects to Firebase which is our backend. Firebase handles authentication, stores all the data in Firestore (which is a NoSQL database), and manages file storage.

The cool part is how video calls work. When a doctor wants to have a video consultation with a patient, the system uses WebRTC. First, the doctor creates a room in Firestore. This acts as a signaling mechanism - it helps coordinate the connection between the doctor and patient. Once they're both connected, the video and audio data goes directly from one user to another (peer-to-peer) without going through our server. This makes the calls faster and reduces the load on our servers.

The architecture is divided into layers. The User Layer has the three types of users. Then there's the Web Interface Layer where users interact with the system. The Authentication Layer handles Google OAuth. The Internet/Network Layer ensures all communication is encrypted using HTTPS/TLS. The Backend Services Layer is Firebase which stores everything. Finally, the Real-time Communication Layer handles the WebRTC signaling and peer-to-peer connections.

---

## Activity Diagram

**Figure 6. Activity Diagram**

The activity diagram shows the overall flow of how the system works. It starts from when a user first registers or logs in, and shows all the different processes they can do in the system.

The diagram covers the main activities like user registration and authentication, appointment booking, video call process, prescription creation, and admin account approval. Each process shows the steps involved, decision points, and what happens at each stage.

For example, when a user registers, they fill out a form, submit it, the system validates the data, creates an account in Firebase, sets the status to pending, and notifies the admin. The admin then reviews and either approves or rejects the account. If approved, the user gets an email and can then login.

The activity diagram helps understand the complete flow of the system from a user's perspective and shows how different processes are connected to each other.

*Note: The complete Activity Diagram can be viewed and downloaded from the Architecture page at `/architecture`.*

---

## Use Case Diagram

**Figure 7. Use Case Diagram**

The use case diagram shows what each type of user can do in the system. We have three actors: Patient, Doctor, and Admin.

Patients can do things like login, manage their profile, send messages, make video calls, schedule appointments, view prescriptions, and access their medical records. Doctors can do similar things but they can also create prescriptions, manage appointments, generate reports, and access patient medical records. Admins have different functions - they manage users, monitor the system, generate reports, and handle system configurations.

The diagram shows all these use cases inside a system boundary labeled "Smart Care: A Real-time Telehealth Platform with E-prescription and Secured Data Sharing". This helps visualize what features are available to each type of user and how they interact with the system.

*Note: The Use Case Diagram can be viewed and downloaded from the Architecture page at `/architecture`.*

---

## Data Flow Diagram (DFD)

The DFD shows how data moves through the system. It includes inputs, outputs, processes, and data storage. The diagram helps visualize how different parts of the system interact to manage data efficiently.

### Context Diagram

**Figure 9. Context Diagram**

The Context Diagram shows the SmartCare system as one big process in the center, and around it are the external entities that interact with it. We used Yourdon style notation, so the system is shown as a circle and the external entities are shown as rectangles.

The external entities are Patients, Doctors, Administrators, and Google Authentication Service. The diagram shows what data flows between the system and these external entities. For example, patients send things like user requests, appointment bookings, and medical inquiries to the system. The system sends back things like authentication processes, notifications, and communication services.

This diagram gives a high-level view of how the system interacts with the outside world and what kind of information is exchanged.

*Note: The Context Diagram (Yourdon Style) can be viewed and downloaded from the Architecture page at `/architecture`.*

### Diagram 0

**Figure 10. Diagram 0 (DFD Level 0)**

Diagram 0 is more detailed than the Context Diagram. It shows the Smart Care system and all the different data flows between the system and external entities like patients, doctors, admins, Firebase, Gmail API, SMTP server, and Google Maps API.

The diagram shows what data comes into the system from each external entity and what data goes out. For example, patients send registration/login data, appointment requests, messages, record uploads, and feedback. The system sends back appointment notifications, prescription notifications, and message notifications.

This gives a clearer picture of all the interactions happening in the system at a high level.

*Note: Diagram 0 (DFD Level 0) can be viewed and downloaded from the Architecture page at `/architecture`.*

### DFD Level 1

**Figure 11. DFD Level 1 - Data Flow Diagram**

DFD Level 1 breaks down the system into its main processes. We have 7 main processes: User Authentication, Appointment Management, Communication Management, Prescription Management, Record Management, Admin Management, and Notification Service.

The diagram also shows the data stores where information is kept: Users, Appointments, Messages, Prescriptions, Medical Records, and System Logs.

The diagram shows how data flows from external entities (patients, doctors, admins) to the processes, how processes interact with data stores, how processes communicate with each other, and how data flows back to the external entities.

For example, when a patient wants to book an appointment, they send an appointment request to the Appointment Management process. This process then stores the data in the Appointments data store and sends appointment information to the Notification Service, which then notifies the patient and doctor.

*Note: DFD Level 1 can be viewed and downloaded from the Architecture page at `/architecture`.*

---

## Database Schema

**Figure 12. Database Schema (NoSQL - Firebase Firestore)**

Since we're using Firebase Firestore which is a NoSQL database, the database structure is different from traditional SQL databases. Instead of tables with relationships, we have collections that contain documents.

The main collections in our system are:

**Core Collections:**
- **users** - Stores all user information including patients, doctors, and admins. Each document has fields like id, email, name, role, status, phoneNumber, address, profileImage, and timestamps.
- **appointments** - Stores appointment data with fields like id, patientId, doctorId, date, time, type (online or in-person), status, reason, notes, and timestamps.
- **prescriptions** - Stores prescription information with fields like id, patientId, doctorId, appointmentId, medications array, instructions, signature, status, and expiration dates.
- **medicalRecords** - Stores medical records with fields like id, patientId, doctorId, title, description, files array, sharedWith array, type, and timestamps.

**Communication Collections:**
- **conversations** - Stores conversation data with participants, last message info, and unread status.
- **messages** - This is a subcollection under conversations. Each conversation can have multiple messages with fields like senderId, content, type (text, image, voice, file), attachments, read status, and timestamps.
- **calls** - Stores video/voice call data with callerId, receiverId, appointmentId, type, status, and timestamps.
- **candidates** - This is a subcollection under calls. It stores WebRTC candidate data for establishing connections.

**System Collections:**
- **notifications** - Stores system notifications for users.
- **logs** - Stores system activity logs.
- **sessions** - Tracks user sessions with device information and trust status.
- **suspiciousLogins** - Records suspicious login attempts for security.

**Content & Management Collections:**
- **testimonials** - Stores user feedback and testimonials.
- **contact_messages** - Stores messages from the contact form on the landing page.
- **availability** - Stores doctor availability schedules.
- **accessLogs** - Tracks who accessed medical records.
- **accessRequests** - Manages requests to access medical records.
- **roles** - Defines user roles and permissions.
- **reports** - Stores generated system reports.
- **system_metrics** - Tracks system performance metrics.

Unlike SQL databases, NoSQL doesn't have foreign keys or joins. Instead, we use string references. For example, an appointment document has a `patientId` field that contains the user ID, but there's no formal relationship. We just query the users collection using that ID when we need the patient information.

The database schema supports role-based access control (RBAC) where different user roles (patient, doctor, admin) have different permissions. This is enforced through Firestore security rules. The schema also supports real-time updates - when data changes in Firestore, all connected clients get updated automatically through listeners.

*Note: The Database Schema diagram can be viewed and downloaded from the Architecture page at `/architecture`.*

---

**Document Version**: 1.0  
**Last Updated**: 2025  
**System**: Smart Care Telehealth Platform  
**For**: Holy Infant Saviour Somos Hospital and Medical Center Inc.
