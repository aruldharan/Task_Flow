/**
 * Local types - replaces Supabase generated types
 * These match the Prisma schema but use snake_case field names to match the API responses.
 */

export type TaskStatus = "todo" | "in_progress" | "completed" | "archived";
export type TaskPriority = "low" | "medium" | "high" | "urgent";
export type RecurrenceType = "daily" | "weekly" | "monthly" | "yearly";
export type AppRole = "owner" | "admin" | "member" | "viewer";

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  project_id: string | null;
  parent_task_id: string | null;
  recurrence: RecurrenceType | null;
  position: number;
  pinned: boolean;
  assigned_to: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: string;
  task_id: string;
  user_id: string;
  message: string;
  created_at: string;
}

export interface Tag {
  id: string;
  name: string;
  color: string | null;
  user_id: string;
  created_at: string;
}

export interface TaskTag {
  task_id: string;
  tag_id: string;
}

export interface TimeLog {
  id: string;
  task_id: string;
  user_id: string;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
  created_at: string;
}

export interface TaskAttachment {
  id: string;
  task_id: string;
  user_id: string;
  file_name: string;
  file_size: number;
  file_type: string;
  storage_path: string;
  created_at: string;
}

export interface ActivityLogEntry {
  id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata: any;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string | null;
  read: boolean;
  created_at: string;
}

export interface Habit {
  id: string;
  name: string;
  color: string | null;
  icon: string | null;
  user_id: string;
  created_at: string;
}

export interface HabitCompletion {
  id: string;
  habit_id: string;
  user_id: string;
  completed_date: string;
  created_at: string;
}

export interface DailyNote {
  id: string;
  user_id: string;
  note_date: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface Goal {
  id: string;
  user_id: string;
  title: string;
  category: string | null;
  period: string;
  target_value: number;
  current_value: number;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

// ---- Compatibility helpers (for code that used Supabase generic types) ----

type TableMap = {
  tasks: Task;
  projects: Project;
  profiles: Profile;
  comments: Comment;
  tags: Tag;
  task_tags: TaskTag;
  time_logs: TimeLog;
  task_attachments: TaskAttachment;
  activity_log: ActivityLogEntry;
  notifications: Notification;
  habits: Habit;
  habit_completions: HabitCompletion;
  daily_notes: DailyNote;
  goals: Goal;
  user_roles: UserRole;
};

/** Compatibility: Tables<"tasks"> => Task, etc. */
export type Tables<T extends keyof TableMap> = TableMap[T];

/** Compatibility: TablesInsert<"tasks"> => Partial<Task> */
export type TablesInsert<T extends keyof TableMap> = Partial<TableMap[T]>;

/** Compatibility: TablesUpdate<"tasks"> => Partial<Task> */
export type TablesUpdate<T extends keyof TableMap> = Partial<TableMap[T]>;

/** Compatibility shim for Database type used in some components */
export type Database = {
  public: {
    Enums: {
      task_status: TaskStatus;
      task_priority: TaskPriority;
      recurrence_type: RecurrenceType;
      app_role: AppRole;
    };
  };
};

export const Constants = {
  public: {
    Enums: {
      app_role: ["owner", "admin", "member", "viewer"] as const,
      recurrence_type: ["daily", "weekly", "monthly", "yearly"] as const,
      task_priority: ["low", "medium", "high", "urgent"] as const,
      task_status: ["todo", "in_progress", "completed", "archived"] as const,
    },
  },
} as const;
