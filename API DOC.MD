# MVet API Documentation

This document provides a summarized reference for the MVet API endpoints
## Base URL

```
Base_URL: https://api.gkmvet.com/
```

## Authentication

* `POST /users/signup` — User registration
* `POST /users/login` — User login
* `POST /users/forgetPassword` — Request password reset OTP
* `POST /users/verifyOTP` — Verify OTP
* `PATCH /users/resetPassword` — Reset password
* `PATCH /users/updatePassword` — Update password (Authenticated)
* `GET /users/getMe` — Get current user profile (Authenticated)
* `PATCH /users/updateMe` — Update own profile (Authenticated)
* `PATCH /users/resetPasswordByAdmin/:userId` — Admin resets user password
* `PUT /users/active-deactive/:userId` — Activate or deactivate user (Admin)

## Users Management (Admin only)

* `GET /users/` — Get all users
* `DELETE /users/` — Delete all users
* `GET /users/:userId` — Get user by ID
* `PATCH /users/:userId` — Update user profile
* `DELETE /users/:userId` — Delete user

## Animals

* `GET /animals/` — Get all animals
* `POST /animals/` — Create new animal
* `DELETE /animals/` — Delete all animals
* `GET /animals/:id` — Get animal by ID
* `PUT /animals/:id` — Update animal by ID
* `DELETE /animals/:id` — Delete animal by ID
* `GET /animals/owner/:ownerId` — Get animals by owner ID
* `GET /animals/statusByZone/count` — Get animal status ByZone

## Medical Visits

* `GET /medicalVisits/` — Get all medical visits
* `POST /medicalVisits/` — Create new medical visit
* `DELETE /medicalVisits/` — Delete all medical visits
* `GET /medicalVisits/:id` — Get visit by ID
* `PUT /medicalVisits/:id` — Update visit by ID
* `DELETE /medicalVisits/:id` — Delete visit by ID
* `GET /medicalVisits/animal/:animalId` — Get medical history by animal ID
* `GET /medicalVisits/physician/:physicianId` — Get visits by physician
* `GET /medicalVisits/activity/daily` — Get today's visits summary
* `GET /medicalVisits/activity/weekly` — Get this week's visits summary
* `GET /medicalVisits/appointments/patients` — Get appointed patients
* `GET /medicalVisits/patients/status` — Get patients' treatment status

## Notes

* All protected routes require valid JWT in the Authorization header.
* Use `multipart/form-data` for routes that support file uploads (e.g., signup, updateMe, updateVisit).

---
