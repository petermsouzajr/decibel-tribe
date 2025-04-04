# Implemented User Features

This document lists the user-facing features currently implemented in the Decibel Tribe application.

## Core Features

- **Main Feed:** Users see a main content feed upon login.
  - **"For You" Feed:** Displays algorithmically recommended or trending content.
  - **"Following" Feed:** Displays content from users or topics the user follows.
- **Trends Sidebar:** A sidebar displaying trending topics or content.

## Posts

- **View Individual Posts:** Users can navigate to dedicated pages to view specific posts.
- **Display Author Information:** When viewing a post, information about the author (avatar, name, username, bio) is displayed, often in a sidebar.
- **Follow Author from Post:** Users can follow or unfollow the post's author directly from the post page.
- **Link Recognition:** URLs within post content or user bios are automatically converted into clickable links.
- **Authorization:** Viewing posts requires the user to be logged in.
- **Content Display:** Shows the text content of the post.
- **Media Attachments:** Supports image and video attachments.
  - Images can be viewed in a larger modal.
  - Videos have an embedded player.
- **Content Truncation/Expansion:** Long posts are shortened with a "Show More" / "Show Less" toggle.
- **Relative Timestamps:** Displays post creation time relative to the current time.
- **Links:** Provides links to the author's profile and the individual post page.
- **Interactions:**
  - **Like/Unlike:** Users can like posts, showing the count.
  - **Dislike/Undislike:** Users can dislike posts, showing the count.
  - **Comments:** Users can view comments associated with a post, showing the count.
  - **Bookmark/Unbookmark:** Users can save posts.
- **Post Author Options:** A menu (likely including edit/delete) is available on the user's own posts.
- **Follow Author (from feed):** Allows following the author directly from their post in a feed.
- **Create Posts:**
  - **Rich Text Editor:** Provides a basic editor for composing posts.
  - **Media Uploads:** Allows attaching multiple images and videos (drag & drop, paste, button).
  - **Attachment Previews:** Shows previews of media before posting, with an option to remove.
  - **Upload Progress:** Indicates the progress of media uploads.
  - **Post to Groups:** Users can optionally post to a specific group.

## User Profiles & Settings

- **View Profiles:** Users can view profiles of other users, showing:
  - Avatar, Display Name, Username, Bio, Join Date.
  - App-specific details like Instruments and Skills.
- **Follow/Unfollow:** Button to follow or unfollow users from their profile page.
- **Profile Editing (Own Profile):**
  - Edit basic profile information (likely through `EditProfileButton`).
  - Update email address.
  - Update/Set password (including prompting for initial password setup if needed).
  - View own email address.
  - View own calendar visibility setting.

## Authentication & Authorization

- **Standard Login:** Users can log in using their username/email and password.
- **Standard Signup:** Users can register with a username, email, and password.
- **Google Sign-In/Sign-Up:** Users can authenticate using their Google account.
- **Email Verification:**
  - Verification email sent upon standard signup.
  - Ability to resend the verification email.
- **Logout:** Users can log out of their session.
- **Authorization Checks:** Access to most pages/features requires the user to be logged in.

## Messaging (via Stream Chat)

- **Direct & Group Chats:** Users can engage in private one-on-one or group conversations.
- **Chat List:** A sidebar lists ongoing conversations, sorted by recent activity.
- **Chat Search:** Users can search their existing chat list.
- **Start New Chat:** Functionality to initiate new conversations.
  - **User Search:** Search for users by name/username to start a chat with.
  - **Multi-User Selection:** Select multiple users to create a group chat.

## Notifications

- **Notification Feed:** A dedicated page lists user notifications.
- **Infinite Scrolling:** Loads older notifications automatically.
- **Mark as Read:** Notifications are automatically marked as read when the page is viewed.
- **Notification Types:** Handles various events:
  - New follower.
  - Comment on own post.
  - Like on own post.
  - Dislike on own post.
  - New attendee for own event.
  - Cancellation of an event the user is involved with.
- **Content Links:** Notifications link to the relevant user profile, post, or event.
- **Context Snippets:** Shows post content for post-related notifications.
- **Follow Back Action:** Includes a button to follow the user who triggered the notification.

## Groups

- **Create Groups:** Users can create new groups with a name and optional description.
- **Group Discovery/List:** Users can see a list of groups they are members of.
- **Group Pages:** Each group has a dedicated page displaying:
  - Group name and description.
  - A feed of posts made specifically to that group (infinite scroll).
- **Membership Management:**
  - **Invites:** Users can be invited to groups.
  - **Accept Invite:** Invited users can accept the invitation to join.
  - **Add Members (Admin/Owner):** Admins/owners can invite/add users to the group.
  - **Leave Group:** Members can leave groups (unless they are the owner).
  - **Delete Group (Owner):** The group owner can delete the group.
- **Group Activity Feed:** A sidebar shows recent activity across the user's groups.

## Events & Calendar

- **Event Feeds:** Main events page shows tabbed feeds ("For You", "Following").
- **View Event Details:** Dedicated pages display full event information:
  - Creator, Title, Description, Location, URL, Date/Time, Performers.
  - Cancellation status.
  - Attendee count and Status/Visibility (creator only).
- **Calendar Integration:**
  - **Add/Remove from Calendar:** Users can add events to/remove events from their calendar (likely tracked internally).
  - **Calendar View Sidebar:** A calendar view is shown in the sidebar on the main events page.
- **Create/Edit Events:**
  - Form to create new events or edit existing ones.
  - Fields for all event details (title, date, time, location, description, performers, URL, visibility).
  - Option to add multiple performers.
  - Save as Draft / Publish options.
  - Set event visibility (Public/Private, defaults to user preference).
  - Mark event as Cancelled.
- **User Calendar Preference:** Fetches and respects user's default calendar visibility setting.

## Bookmarks

- **Bookmark Posts:** Users can save individual posts via a bookmark button.
- **View Bookmarks:** A dedicated page lists all posts bookmarked by the user (infinite scroll).
- **Remove Bookmarks:** Users can remove bookmarks (likely via the same button on the post).

## Search

- **Global Search Input:** (Implied, likely in the Navbar or header) Users can enter search queries.
- **Tabbed Search Results Page:** Displays results categorized into:
  - Users & Posts
  - Instruments & Skills (finds users with matching criteria)
  - Events
- **Infinite Scrolling:** Loads more search results as the user scrolls.
- **Displays Results:** Renders appropriate components (User profile snippets, Posts, Event details) for each result type.
