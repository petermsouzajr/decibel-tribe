import { StreamChat } from "stream-chat";

const streamServerClient = StreamChat.getInstance(
  process.env.NEXT_PUBLIC_STREAM_KEY!,
  process.env.STREAM_SECRET,
);

/**
 * Ensures a user exists in StreamChat. If the user is missing (StreamChat
 * error code 16 – "user does not exist"), they are upserted automatically.
 * This handles seed / migrated users who were never registered with StreamChat.
 */
export async function ensureStreamUser(user: {
  id: string;
  username: string;
  displayName: string;
}) {
  await streamServerClient.upsertUser({
    id: user.id,
    username: user.username,
    name: user.displayName,
  });
}

/**
 * Returns the total unread message count for a user.
 * If the user doesn't exist in StreamChat yet, they are auto-created and 0 is returned.
 */
export async function getUnreadCountSafe(user: {
  id: string;
  username: string;
  displayName: string;
}): Promise<number> {
  try {
    const { total_unread_count } = await streamServerClient.getUnreadCount(user.id);
    return total_unread_count;
  } catch (error: any) {
    if (error?.code === 16) {
      // User doesn't exist in StreamChat – sync them now so subsequent calls work.
      try {
        await ensureStreamUser(user);
      } catch (syncError) {
        console.error("Failed to sync user to StreamChat:", syncError);
      }
    } else {
      console.error("StreamChat getUnreadCount error:", error);
    }
    return 0;
  }
}

export default streamServerClient;
