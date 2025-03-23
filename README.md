# Overview
Crew Mates is an application that assigns chores to you and your household members on a weekly basis. 

This repository contains the backend of the application. For details on using the app, visit the [front-end repository](https://github.com/Violinistapirata/final_project_client).

# Server Routes / Endpoints

## Authentication routes

| HTTP verb | URL              | Request body | Action                                        |
| --------- | ---------------- | ------------ | --------------------------------------------- |
| POST      | /api/auth/signup | JSON         | Create a new user in the database            |
| POST      | /api/auth/login  | JSON         | Verifies email and password and returns a JWT |
| GET       | /api/auth/verify | (empty)      | Used to verify JWT stored on the client       |

## Group routes

| HTTP verb | URL             | Request body | Action                     |
| --------- | --------------- | ------------ | -------------------------- |
| POST      | /api/groups     | JSON         | Create a new group         |
| GET       | /api/groups/:id | (empty)      | Get group information      |
| PUT       | /api/groups/:id | JSON         | Update group               |
| PUT       | api/groups/join/:id | JSON | Adds a user to a group and the group to the user 
| DELETE    | /api/groups/:id | (empty)      | Delete group               |

## Task routes

| HTTP verb | URL                           | Request body               | Action                    |
| --------- | ----------------------------- | -------------------------- | ------------------------- |
| POST      | /api/tasks/one-off-task        | JSON                       | Create a new task in an existing week|
| PUT       | /api/tasks/:id                | JSON                       | Update a task (done/not done)|
| DELETE    | /api/tasks/:id                | (empty)                    | Delete task            | 

## User routes

| HTTP verb | URL            | Request body | Action                    |
| --------- | -------------- | ------------ | ------------------------- |
| GET       | /api/users/:id | (empty)      | Get user information      |
| PUT       | /api/users/:id | JSON         | Update user               |
| PUT       | /api/users/remove-group/:id | JSON |Removes group from user
| DELETE    | /api/users/:id | (empty)      | Delete user               |

## Week routes

| HTTP verb | URL                               | Request body     | Action                     |
| --------- | --------------------------------- | ---------------- | -------------------------- |
| POST      | /api/week/:groupId/:currentDate   | JSON             | Create all the tasks for a new week|
| GET       | /api/week/:groupId/:currentDate   | (empty)          | Get all the tasks for the current week (if any) |

# Models

## User Model

```
{
    email: {
      type: String,
      required: [true, "Email is required."],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required."],
    },
    name: {
      type: String,
      required: [true, "Name is required."],
    },

    group: {
      type: Schema.Types.ObjectId,
      ref: "Group" },
  },
  {
    timestamps: true,
  }
```

## Task Model

```
{
    name: { type: String, required: true },
    assigneeId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    assigneeName: {
      type: String,
      required: true,
    },
    isDone: { type: Boolean, default: false },
    group: {
      type: Schema.Types.ObjectId,
      ref: "Group",
      required: true,
    },
    weekNumber: { type: Number, required: true },
  },
  {
    timestamps: true,
  }
```

## Group Model

```
const groupSchema = new Schema(
  {
    name: { type: String, required: true },
    members: {
      type: [Schema.Types.ObjectId],
      ref: "User",
    },
    recurringTasks: { type: [String] },
    weekNumber: { type: Number, default: 0 },
    weekEndDate: { type: Date, default: null },
  },
  { 
    timestamps: true,
  }
);
```
