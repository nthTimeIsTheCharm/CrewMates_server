# Server Routes / Endpoints

## Authentication routes

| HTTP verb | URL              | Request body | Action                                        |
| --------- | ---------------- | ------------ | --------------------------------------------- |
| POST      | /api/auth/signup | JSON         | Create a new user in the database            |
| POST      | /api/auth/login  | JSON         | Verifies email and password and returns a JWT |
| GET       | /api/auth/verify | (empty)      | Used to verify JWT stored on the client       |

## User routes

| HTTP verb | URL            | Request body | Action                    |
| --------- | -------------- | ------------ | ------------------------- |
| GET       | /api/users/:id | (empty)      | Get user information      |
| PUT       | /api/users/:id | JSON         | Update user               |
| DELETE    | /api/users/:id | (empty)      | Delete user               |

## Task routes

| HTTP verb | URL            | Request body | Action                    |
| --------- | -------------- | ------------ | ------------------------- |
| POST      | /api/tasks/single-task     | JSON         | Create a new task in the current week        |
| --POST      | /api/tasks/whole-week     | JSON         | Create all the tasks for the next week         |
| GET       | /api/tasks/:id | (empty)      | Get task information      |
| PUT       | /api/tasks/:id | JSON         | Update task               |
| DELETE    | /api/tasks/:id | (empty)      | Delete task               |

## Group routes

| HTTP verb | URL             | Request body | Action                     |
| --------- | --------------- | ------------ | -------------------------- |
| POST      | /api/groups     | JSON         | Create a new group        |
| GET       | /api/groups/:id | (empty)      | Get group information      |
| PUT       | /api/groups/:id | JSON         | Update group               |
| DELETE    | /api/groups/:id | (empty)      | Delete group               |

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
    // this second object adds extra properties: `createdAt` and `updatedAt`
    timestamps: true,
  }
```

## Task Model

```
{
    name: { type: String, required: true },
    assignee: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    isDone: { type: Boolean, default: false },
    group: {
      type: Schema.Types.ObjectId,
      ref: "Group",
    },
    weekNumber: { type: Number, required: true },
  },
  {
    timestamps: true,
  }
```

## Group Model

```
{
  name: { type: String, required: true },
  members: {
    type: [Schema.Types.ObjectId],
    ref: "User" },
  recurringTasks: { type:[String], default: ["Takeout the trash", "Wash dishes"]},
  weekNumber: { type: Number, default: 0}
},
{
    timestamps: true,
}
```
