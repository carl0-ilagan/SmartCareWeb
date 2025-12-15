# Smart Care System - Diagrams Documentation

## Table of Contents
1. [Diagram 0 - Context Diagram (DFD Level 0)](#diagram-0)
2. [Data Flow Diagram (DFD Level 1)](#dfd-level-1)
3. [Activity Diagrams](#activity-diagrams)
   - [User Registration & Authentication](#activity-user-auth)
   - [Appointment Booking Process](#activity-appointment)
   - [Video Call Process](#activity-video-call)
   - [Prescription Creation Process](#activity-prescription)
   - [Admin Account Approval Process](#activity-admin-approval)

---

## System Architecture Blueprint {#system-architecture}

This diagram illustrates the high-level system architecture showing how all components are formed and interact.

```mermaid
graph TB
    subgraph "User Layer"
        Patient[👤 Patient]
        Doctor[👤 Doctor]
        Admin[👤 Admin]
    end
    
    subgraph "Web Interface Layer"
        PatientUI[📱 Patient Web Interface<br/>Mobile/Desktop]
        DoctorUI[📱 Doctor Web Interface<br/>Mobile/Desktop]
        AdminUI[💻 Admin Web Interface<br/>Desktop]
    end
    
    subgraph "Authentication Layer"
        GoogleAuth[🔐 Google Authentication<br/>OAuth 2.0]
    end
    
    subgraph "Internet/Network Layer"
        Internet[🌐 Internet<br/>HTTPS/TLS]
    end
    
    subgraph "Backend Services Layer"
        Firebase[🔥 Firebase Platform<br/>Platform Auth & Firestore]
    end
    
    subgraph "Real-time Communication Layer"
        Signalling[📡 Signalling<br/>Session Coordination]
        WebRTC[☁️ WebRTC Network<br/>Peer-to-Peer Communication]
    end
    
    %% User to Interface Connections
    Patient <-->|"User Interaction"| PatientUI
    Doctor <-->|"User Interaction"| DoctorUI
    Admin <-->|"User Interaction"| AdminUI
    
    %% Interface to Authentication
    PatientUI <-->|"Authenticate"| GoogleAuth
    DoctorUI <-->|"Authenticate"| GoogleAuth
    AdminUI <-->|"Authenticate"| GoogleAuth
    
    %% Authentication to Internet
    GoogleAuth <-->|"OAuth Flow"| Internet
    
    %% Internet to Firebase
    Internet <-->|"API Calls<br/>Real-time Sync"| Firebase
    
    %% Firebase to Signalling
    Firebase <-->|"Signalling Data<br/>Session Management"| Signalling
    
    %% Signalling to WebRTC
    Signalling <-->|"ICE Candidates<br/>SDP Exchange"| WebRTC
    
    %% WebRTC to Interfaces (for video/voice)
    WebRTC <-->|"Media Streams<br/>Video/Audio"| PatientUI
    WebRTC <-->|"Media Streams<br/>Video/Audio"| DoctorUI
    
    %% Styling
    classDef userLayer fill:#e1f5ff,stroke:#01579b,stroke-width:2px
    classDef interfaceLayer fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    classDef authLayer fill:#fff3e0,stroke:#e65100,stroke-width:2px
    classDef networkLayer fill:#e8f5e9,stroke:#1b5e20,stroke-width:2px
    classDef backendLayer fill:#fff9c4,stroke:#f57f17,stroke-width:2px
    classDef commLayer fill:#fce4ec,stroke:#880e4f,stroke-width:2px
    
    class Patient,Doctor,Admin userLayer
    class PatientUI,DoctorUI,AdminUI interfaceLayer
    class GoogleAuth authLayer
    class Internet networkLayer
    class Firebase backendLayer
    class Signalling,WebRTC commLayer
```

**Architecture Layers:**
1. **User Layer**: Patients, Doctors, and Admins interact with the system
2. **Web Interface Layer**: Platform-specific interfaces (PWA for mobile, web for desktop)
3. **Authentication Layer**: Google OAuth 2.0 for secure authentication
4. **Internet/Network Layer**: Encrypted HTTPS/TLS communication
5. **Backend Services Layer**: Firebase (Auth, Firestore) for data management
6. **Real-time Communication Layer**: Signalling via Firebase, WebRTC for peer-to-peer media

**Key Interactions:**
- Users authenticate through Google OAuth
- All data flows through encrypted Internet connections
- Firebase serves as the central backend
- WebRTC enables direct peer-to-peer video/audio communication
- Signalling coordinates WebRTC connections via Firebase

For detailed architecture documentation, see [SYSTEM_ARCHITECTURE_BLUEPRINT.md](./SYSTEM_ARCHITECTURE_BLUEPRINT.md)

---

## Diagram 0 - Context Diagram (DFD Level 0) {#diagram-0}

This diagram shows the Smart Care system and its interactions with external entities.

```mermaid
graph TB
    Patient[Patient]
    Doctor[Doctor]
    Admin[Admin]
    System[Smart Care System]
    Firebase[(Firebase<br/>Auth & Firestore)]
    GmailAPI[Gmail API]
    SMTP[SMTP Server]
    MapsAPI[Google Maps API]
    
    Patient -->|Register/Login| System
    Patient -->|Book Appointments| System
    Patient -->|Send Messages| System
    Patient -->|Upload Records| System
    Patient -->|View Prescriptions| System
    Patient -->|Join Video Calls| System
    Patient -->|Submit Feedback| System
    
    Doctor -->|Register/Login| System
    Doctor -->|Manage Availability| System
    Doctor -->|Create Prescriptions| System
    Doctor -->|Send Messages| System
    Doctor -->|Create Video Rooms| System
    Doctor -->|View Patient Records| System
    
    Admin -->|Login| System
    Admin -->|Approve/Reject Accounts| System
    Admin -->|Manage Content| System
    Admin -->|View Analytics| System
    Admin -->|Reply to Messages| System
    
    System -->|Authenticate Users| Firebase
    System -->|Store/Retrieve Data| Firebase
    System -->|Fetch Emails| GmailAPI
    System -->|Send Emails| SMTP
    System -->|Display Map| MapsAPI
    
    System -->|Appointment Notifications| Patient
    System -->|Prescription Notifications| Patient
    System -->|Message Notifications| Patient
    System -->|Appointment Notifications| Doctor
    System -->|Message Notifications| Doctor
    System -->|System Alerts| Admin
```

---

## DFD Level 1 - Data Flow Diagram {#dfd-level-1}

This diagram shows the main processes and data stores within the Smart Care system.

```mermaid
graph TB
    %% External Entities
    Patient[Patient]
    Doctor[Doctor]
    Admin[Admin]
    GmailAPI[Gmail API]
    SMTP[SMTP Server]
    
    %% Processes
    P1[1.0<br/>User<br/>Authentication]
    P2[2.0<br/>Appointment<br/>Management]
    P3[3.0<br/>Communication<br/>Management]
    P4[4.0<br/>Prescription<br/>Management]
    P5[5.0<br/>Record<br/>Management]
    P6[6.0<br/>Admin<br/>Management]
    P7[7.0<br/>Notification<br/>Service]
    
    %% Data Stores
    D1[(D1: Users)]
    D2[(D2: Appointments)]
    D3[(D3: Messages)]
    D4[(D4: Prescriptions)]
    D5[(D5: Medical Records)]
    D6[(D6: System Logs)]
    D7[(D7: Feedback)]
    D8[(D8: Landing Content)]
    
    %% Patient Flows
    Patient -->|Login Credentials| P1
    Patient -->|Appointment Request| P2
    Patient -->|Message| P3
    Patient -->|Record Upload| P5
    Patient -->|Feedback| D7
    
    %% Doctor Flows
    Doctor -->|Login Credentials| P1
    Doctor -->|Availability| P2
    Doctor -->|Message| P3
    Doctor -->|Prescription Data| P4
    Doctor -->|Video Room Create| P3
    
    %% Admin Flows
    Admin -->|Login Credentials| P1
    Admin -->|Approval Decision| P6
    Admin -->|Content Update| P6
    Admin -->|Reply Message| P3
    
    %% Process to Data Store
    P1 <-->|User Data| D1
    P2 <-->|Appointment Data| D2
    P3 <-->|Message Data| D3
    P4 <-->|Prescription Data| D4
    P5 <-->|Record Data| D5
    P6 <-->|System Data| D6
    P6 <-->|Content Data| D8
    P7 <-->|Log Data| D6
    
    %% Process to Process
    P1 -->|User Status| P2
    P1 -->|User Status| P3
    P1 -->|User Status| P4
    P2 -->|Appointment Info| P7
    P3 -->|Message Info| P7
    P4 -->|Prescription Info| P7
    P6 -->|Approval Status| P1
    
    %% External System Flows
    P3 -->|Fetch Emails| GmailAPI
    GmailAPI -->|Email Data| P3
    P7 -->|Send Email| SMTP
    P3 -->|Send Email| SMTP
    
    %% Outputs
    P1 -->|Auth Status| Patient
    P1 -->|Auth Status| Doctor
    P1 -->|Auth Status| Admin
    P2 -->|Appointment Confirmation| Patient
    P2 -->|Appointment Notification| Doctor
    P3 -->|Message| Patient
    P3 -->|Message| Doctor
    P4 -->|Prescription| Patient
    P5 -->|Record Access| Doctor
    P6 -->|Approval Status| Patient
    P6 -->|Approval Status| Doctor
    P7 -->|Notification| Patient
    P7 -->|Notification| Doctor
    P7 -->|Notification| Admin
```

---

## Activity Diagrams {#activity-diagrams}

### User Registration & Authentication Activity Diagram {#activity-user-auth}

```mermaid
flowchart TD
    Start([User Starts Registration]) --> FillForm[Fill Registration Form]
    FillForm --> Submit[Submit Registration]
    Submit --> Validate{Validate Data}
    Validate -->|Invalid| ShowError[Show Error Message]
    ShowError --> FillForm
    Validate -->|Valid| CreateAccount[Create Account in Firebase]
    CreateAccount --> SetPending[Set Status: Pending]
    SetPending --> NotifyAdmin[Notify Admin]
    NotifyAdmin --> WaitApproval{Wait for Admin Approval}
    WaitApproval -->|Pending| WaitApproval
    WaitApproval -->|Approved| SendApprovalEmail[Send Approval Email]
    WaitApproval -->|Rejected| SendRejectionEmail[Send Rejection Email]
    SendApprovalEmail --> LoginPage[Redirect to Login]
    SendRejectionEmail --> EndReject([Account Rejected])
    
    LoginPage --> EnterCredentials[Enter Login Credentials]
    EnterCredentials --> CheckDevice{New Device?}
    CheckDevice -->|Yes| DeviceAuth[Device Authentication Required]
    CheckDevice -->|No| Authenticate[Authenticate with Firebase]
    DeviceAuth --> SendDeviceEmail[Send Device Approval Email]
    SendDeviceEmail --> WaitDevice{Wait Device Approval}
    WaitDevice -->|Pending| WaitDevice
    WaitDevice -->|Approved| Authenticate
    WaitDevice -->|Denied| EndDenied([Login Denied])
    
    Authenticate --> CheckRole{Check User Role}
    CheckRole -->|Patient| PatientDashboard[Patient Dashboard]
    CheckRole -->|Doctor| DoctorDashboard[Doctor Dashboard]
    CheckRole -->|Admin| AdminDashboard[Admin Dashboard]
    
    PatientDashboard --> End([User Logged In])
    DoctorDashboard --> End
    AdminDashboard --> End
```

### Appointment Booking Process Activity Diagram {#activity-appointment}

```mermaid
flowchart TD
    Start([Patient Starts Booking]) --> SelectDoctor[Select Doctor]
    SelectDoctor --> ViewAvailability[View Doctor Availability]
    ViewAvailability --> SelectDate[Select Date & Time]
    SelectDate --> SelectType{Appointment Type?}
    SelectType -->|Online| SetOnline[Set Type: Online]
    SelectType -->|In-Person| SetInPerson[Set Type: In-Person]
    
    SetOnline --> FillDetails[Fill Appointment Details]
    SetInPerson --> FillDetails
    FillDetails --> SubmitBooking[Submit Booking Request]
    SubmitBooking --> CreateAppointment[Create Appointment Record]
    CreateAppointment --> SetStatusPending[Set Status: Pending]
    SetStatusPending --> NotifyDoctor[Notify Doctor]
    NotifyDoctor --> WaitApproval{Doctor Reviews}
    
    WaitApproval -->|Approve| SetApproved[Set Status: Approved]
    WaitApproval -->|Reject| SetRejected[Set Status: Rejected]
    WaitApproval -->|Pending| WaitApproval
    
    SetApproved --> SendConfirmation[Send Confirmation to Patient]
    SetRejected --> SendRejection[Send Rejection to Patient]
    
    SendConfirmation --> ReminderCheck{Time for Reminder?}
    ReminderCheck -->|Yes| SendReminder[Send Appointment Reminder]
    ReminderCheck -->|No| WaitAppointment
    SendReminder --> WaitAppointment{Appointment Time}
    
    WaitAppointment --> AppointmentDay[Appointment Day]
    AppointmentDay --> CheckType{Appointment Type?}
    CheckType -->|Online| StartVideoCall[Start Video Call]
    CheckType -->|In-Person| MarkCompleted[Mark as Completed]
    
    StartVideoCall --> ConductCall[Conduct Video Consultation]
    ConductCall --> EndCall[End Call]
    EndCall --> MarkCompleted
    MarkCompleted --> End([Appointment Completed])
    
    SendRejection --> EndReject([Booking Rejected])
```

### Video Call Process Activity Diagram {#activity-video-call}

```mermaid
flowchart TD
    Start([Doctor Initiates Call]) --> CreateRoom[Create Video Room]
    CreateRoom --> SetRoomStatus[Set Room Status: Active]
    SetRoomStatus --> InvitePatient[Invite Patient to Room]
    InvitePatient --> SendNotification[Send Notification to Patient]
    SendNotification --> PatientReceives{Patient Receives?}
    PatientReceives -->|No| WaitPatient[Wait for Patient]
    WaitPatient --> PatientReceives
    PatientReceives -->|Yes| PatientJoins[Patient Joins Room]
    
    PatientJoins --> WebRTCSetup[WebRTC Connection Setup]
    WebRTCSetup --> ExchangeSignals[Exchange ICE Candidates & SDP]
    ExchangeSignals --> EstablishConnection{Connection Established?}
    EstablishConnection -->|No| RetryConnection[Retry Connection]
    RetryConnection --> ExchangeSignals
    EstablishConnection -->|Yes| MediaStream[Start Media Stream]
    
    MediaStream --> VideoActive[Video Call Active]
    VideoActive --> Controls{User Actions}
    
    Controls -->|Mute/Unmute| ToggleAudio[Toggle Audio]
    Controls -->|Camera On/Off| ToggleVideo[Toggle Video]
    Controls -->|Screen Share| StartScreenShare[Start Screen Sharing]
    Controls -->|End Call| EndCall[End Call]
    
    ToggleAudio --> VideoActive
    ToggleVideo --> VideoActive
    StartScreenShare --> VideoActive
    
    EndCall --> UpdateRoomStatus[Update Room Status: Ended]
    UpdateRoomStatus --> RedirectDoctor[Redirect Doctor to Dashboard]
    UpdateRoomStatus --> RedirectPatient[Redirect Patient to Dashboard]
    RedirectDoctor --> SaveCallLog[Save Call Log]
    RedirectPatient --> SaveCallLog
    SaveCallLog --> End([Call Ended])
```

### Prescription Creation Process Activity Diagram {#activity-prescription}

```mermaid
flowchart TD
    Start([Doctor Starts Prescription]) --> SelectPatient[Select Patient]
    SelectPatient --> ViewHistory[View Patient Medical History]
    ViewHistory --> CreatePrescription[Create New Prescription]
    CreatePrescription --> AddMedication[Add Medication Details]
    AddMedication --> MedicationDetails{More Medications?}
    MedicationDetails -->|Yes| AddMedication
    MedicationDetails -->|No| AddInstructions[Add Instructions]
    
    AddInstructions --> ReviewPrescription[Review Prescription]
    ReviewPrescription --> DigitalSign[Apply Digital Signature]
    DigitalSign --> ValidatePrescription{Validate Prescription}
    ValidatePrescription -->|Invalid| ReviewPrescription
    ValidatePrescription -->|Valid| SavePrescription[Save Prescription to Database]
    
    SavePrescription --> SetStatus[Set Status: Active]
    SetStatus --> NotifyPatient[Notify Patient]
    NotifyPatient --> SendEmail[Send Email Notification]
    SendEmail --> UpdateHistory[Update Patient Prescription History]
    UpdateHistory --> End([Prescription Created])
```

### Admin Account Approval Process Activity Diagram {#activity-admin-approval}

```mermaid
flowchart TD
    Start([Admin Logs In]) --> ViewPending[View Pending Accounts]
    ViewPending --> SelectAccount[Select Account to Review]
    SelectAccount --> ViewDetails[View Account Details]
    ViewDetails --> ReviewInfo{Review Information}
    
    ReviewInfo --> CheckDocuments[Check Submitted Documents]
    CheckDocuments --> VerifyData{Verify Data}
    VerifyData -->|Incomplete| RequestMore[Request More Information]
    RequestMore --> NotifyUser[Notify User]
    NotifyUser --> ViewPending
    
    VerifyData -->|Complete| MakeDecision{Approve or Reject?}
    MakeDecision -->|Approve| ApproveAccount[Approve Account]
    MakeDecision -->|Reject| RejectAccount[Reject Account]
    
    ApproveAccount --> UpdateStatus[Update Status: Approved]
    UpdateStatus --> ActivateAccount[Activate User Account]
    ActivateAccount --> SendApprovalEmail[Send Approval Email]
    SendApprovalEmail --> LogAction[Log Approval Action]
    LogAction --> UpdateMetrics[Update System Metrics]
    UpdateMetrics --> EndApprove([Account Approved])
    
    RejectAccount --> UpdateStatusReject[Update Status: Rejected]
    UpdateStatusReject --> SendRejectionEmail[Send Rejection Email]
    SendRejectionEmail --> LogRejection[Log Rejection Action]
    LogRejection --> UpdateMetrics
    UpdateMetrics --> EndReject([Account Rejected])
```

---

## Additional DFD Details

### Data Store Descriptions

- **D1: Users** - Stores user accounts, profiles, roles, and authentication data
- **D2: Appointments** - Stores appointment bookings, schedules, and status
- **D3: Messages** - Stores chat messages, conversations, and read receipts
- **D4: Prescriptions** - Stores e-prescriptions, medications, and signatures
- **D5: Medical Records** - Stores patient medical documents and records
- **D6: System Logs** - Stores system activity logs, metrics, and audit trails
- **D7: Feedback** - Stores user feedback and testimonials
- **D8: Landing Content** - Stores landing page content, branding, and configurations

### Process Descriptions

- **1.0 User Authentication** - Handles user login, registration, device authentication, and session management
- **2.0 Appointment Management** - Manages appointment booking, scheduling, availability, and status updates
- **3.0 Communication Management** - Handles messaging, video calls, Gmail integration, and notifications
- **4.0 Prescription Management** - Manages e-prescription creation, digital signatures, and delivery
- **5.0 Record Management** - Handles medical record uploads, sharing, and access control
- **6.0 Admin Management** - Manages account approvals, content management, analytics, and system administration
- **7.0 Notification Service** - Sends notifications via email, in-app, and push notifications

---

## Notes

- All diagrams use standard UML/DFD notation
- External entities are shown as rectangles
- Processes are shown as rounded rectangles or circles
- Data stores are shown as open rectangles
- Data flows are shown as arrows with labels
- Activity diagrams show decision points as diamonds
- Start/End nodes are shown as rounded rectangles with double borders

---

**Generated:** 2025  
**System:** Smart Care Telehealth Platform  
**For:** Holy Infant Saviour Somos Hospital and Medical Center Inc.
