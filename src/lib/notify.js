import { base44 } from "@/api/base44Client";

// Fire-and-forget user notification.
export async function notify(userId, title, description, type = "general", actionUrl = "") {
  if (!userId) return;
  try {
    await base44.entities.Notification.create({
      user_id: userId,
      title,
      description: description || "",
      type,
      action_url: actionUrl,
    });
  } catch (e) {
    /* ignore */
  }
}

// Fire-and-forget admin notification.
export async function adminNotify(type, title, description, targetType = "", targetId = "") {
  try {
    await base44.entities.AdminNotification.create({
      type,
      title,
      description: description || "",
      target_type: targetType,
      target_id: targetId,
      status: "pending",
    });
  } catch (e) {
    /* ignore */
  }
}
