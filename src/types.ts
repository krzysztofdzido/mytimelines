export interface Task {
  id: number;
  title: string;
  assignedTo: string;
  status: "pending" | "completed";
  startDate: string;
  endDate: string;
}

export interface Timeline {
  id: number;
  name: string;
  tasks: Task[];
  groupId?: number; // Optional group ID
}

export interface TimelineGroup {
  id: number;
  name: string;
  isExpanded: boolean;
}

export type RangeOption = "day" | "week" | "month" | "year";

export interface DateRange {
  start: Date;
  end: Date;
}

export interface TimeSlot {
  hour: number;
  minute: number;
}
