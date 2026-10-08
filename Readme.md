# VideoTube Backend

A REST API built with Node.js, Express, and MongoDB for a video-sharing platform with YouTube-style video features and Twitter-style posts.

## Features

- User registration, login, logout, token refresh, and profile management
- Video upload, browsing, search, view counts, and publish status
- Tweets, comments, and likes for videos, comments, and tweets
- Playlists and channel subscriptions
- Channel dashboard statistics and watch history
- Cloudinary uploads for user images, videos, and thumbnails

## Requirements

- Node.js and npm
- MongoDB, local or MongoDB Atlas
- A Cloudinary account for media uploads

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a `.env` file in the project root, using `.env.sample` as a template:

   ```env
   MONGODB_URI=mongodb://localhost:27017
   PORT=8000
   CORS_ORIGIN=http://localhost:5173

   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret

   ACCESS_TOKEN_SECRET=replace_with_a_long_random_secret
   ACCESS_TOKEN_EXPIRY=1d
   REFRESH_TOKEN_SECRET=replace_with_a_different_long_random_secret
   REFRESH_TOKEN_EXPIRY=10d
   ```

   The application connects to a database named `videotube`. For MongoDB Atlas, set `MONGODB_URI` to your cluster connection URI. Keep credentials private and do not commit your `.env` file.

3. Ensure the upload temp folder exists:

   ```text
   public/temp
   ```

4. Run the backend:

   ```bash
   npm run dev
   ```

   Or use `npm start` to run without nodemon. The default port is `8000`; confirm the terminal reports a successful MongoDB connection.

## Testing with Postman

Use `http://localhost:8000/api/v1` as the API base URL.

1. Send `GET /healthcheck`; a healthy server returns HTTP `200`.
2. Register with `POST /users/register`. Choose **Body → form-data** and provide text fields `fullName`, `email`, `username`, and `password`, plus an `avatar` file. `coverImage` is optional.
3. Log in with `POST /users/login` using **Body → raw → JSON**:

   ```json
   {
     "username": "your_username",
     "password": "your_password"
   }
   ```

4. Copy `data.accessToken` from the login response. For protected requests, choose **Authorization → Bearer Token** and paste the token. You may also use the HTTP-only login cookie.
5. To upload a video, send `POST /videos` with Bearer Token authentication and **Body → form-data**:

   | Key | Type | Required |
   | --- | --- | --- |
   | `title` | Text | Yes |
   | `description` | Text | Yes |
   | `videoFile` | File | Yes |
   | `thumbnail` | File | Yes |

   Do not set the multipart `Content-Type` header manually; Postman adds the required boundary. Both files are uploaded to Cloudinary, and the video record is saved to MongoDB.

## API Routes

All paths below are prefixed with `/api/v1`. **Login required** means provide a valid access token. **Owner only** means the signed-in user must own that resource.

### Health

| Method | Path | Access | Description |
| --- | --- | --- | --- |
| `GET` | `/healthcheck` | Public | Check API health |
| `GET` | `/` | Public | Server welcome response |

### Users

| Method | Path | Access | Description |
| --- | --- | --- | --- |
| `POST` | `/users/register` | Public | Register with avatar and optional cover image |
| `POST` | `/users/login` | Public | Log in with username or email and password |
| `POST` | `/users/logout` | Login required | Log out and clear tokens |
| `POST` | `/users/refresh-token` | Refresh token | Refresh access token |
| `POST` | `/users/change-password` | Login required | Change password |
| `GET` | `/users/current-user` | Login required | Get signed-in user |
| `PATCH` | `/users/update-account` | Login required | Update account name and email |
| `PATCH` | `/users/avatar` | Login required | Update avatar |
| `PATCH` | `/users/cover-image` | Login required | Update cover image |
| `GET` | `/users/c/:username` | Login required | Get channel profile and subscription counts |
| `GET` | `/users/history` | Login required | Get signed-in user's watch history |

### Videos

| Method | Path | Access | Description |
| --- | --- | --- | --- |
| `GET` | `/videos` | Public | Browse published videos; supports `page`, `limit`, `query`, `userId`, `sortBy`, `sortType` |
| `POST` | `/videos` | Login required | Upload video and thumbnail |
| `GET` | `/videos/:videoId` | Public | Get a published video; increments views and records history for signed-in users |
| `PATCH` | `/videos/:videoId` | Owner only | Update title, description, or thumbnail |
| `DELETE` | `/videos/:videoId` | Owner only | Delete video record |
| `PATCH` | `/videos/toggle/publish/:videoId` | Owner only | Toggle published status |

### Tweets

| Method | Path | Access | Description |
| --- | --- | --- | --- |
| `POST` | `/tweets` | Login required | Create a post |
| `GET` | `/tweets/user/:userId` | Public | List a user's posts; supports `page` and `limit` |
| `PATCH` | `/tweets/:tweetId` | Owner only | Edit a post |
| `DELETE` | `/tweets/:tweetId` | Owner only | Delete a post |

### Comments

| Method | Path | Access | Description |
| --- | --- | --- | --- |
| `GET` | `/comments/:videoId` | Public | List comments on a published video; supports `page` and `limit` |
| `POST` | `/comments/:videoId` | Login required | Add a comment |
| `PATCH` | `/comments/c/:commentId` | Owner only | Edit a comment |
| `DELETE` | `/comments/c/:commentId` | Owner only | Delete a comment |

### Likes

| Method | Path | Access | Description |
| --- | --- | --- | --- |
| `POST` | `/likes/toggle` | Login required | Toggle a like; JSON must contain exactly one of `videoId`, `commentId`, or `tweetId` |
| `GET` | `/likes/videos` | Login required | List signed-in user's liked published videos |
| `GET` | `/likes/videos/:videoId` | Public | Get like count and (if signed in) the user's like status |

### Playlists

| Method | Path | Access | Description |
| --- | --- | --- | --- |
| `POST` | `/playlists` | Login required | Create playlist |
| `GET` | `/playlists/user/:userId` | Login required | List a user's playlists |
| `GET` | `/playlists/:playlistId` | Owner only | Get playlist and its videos |
| `PATCH` | `/playlists/:playlistId` | Owner only | Update playlist |
| `DELETE` | `/playlists/:playlistId` | Owner only | Delete playlist |
| `POST` | `/playlists/:playlistId/videos/:videoId` | Owner only | Add a published video |
| `DELETE` | `/playlists/:playlistId/videos/:videoId` | Owner only | Remove a video |

### Subscriptions

| Method | Path | Access | Description |
| --- | --- | --- | --- |
| `POST` | `/subscriptions/c/:channelId` | Login required | Subscribe or unsubscribe |
| `GET` | `/subscriptions/c/:channelId` | Public | List channel subscribers |
| `GET` | `/subscriptions/u/:subscriberId` | Public | List channels a user follows |

### Dashboard

| Method | Path | Access | Description |
| --- | --- | --- | --- |
| `GET` | `/dashboard/stats` | Login required | Get video, view, and subscriber counts for signed-in channel |
| `GET` | `/dashboard/videos` | Login required | List signed-in channel's videos; supports `page` and `limit` |

## Errors and Troubleshooting

- Errors are returned as JSON with `success: false` and a `message`.
- Unknown routes return HTTP `404`. Invalid input usually returns `400`; protected endpoints require a valid access token.
- If media upload fails, check Cloudinary settings in `.env`, then review the API response and server terminal.
- If the server cannot connect, check MongoDB is running/reachable and verify `MONGODB_URI`.
- Use small media files when testing uploads.
- `npm test` is currently a placeholder; no automated test suite is configured yet.

## ER Diagram

[Open the project ER diagrams](https://app.eraser.io/workspace/AlCd7QxkSsLyqoyFvmyD?origin=share)