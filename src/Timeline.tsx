import { useState, useRef, useEffect } from "react";
import Task from "./Task";
import { Task as TaskType, DateRange, TimeSlot } from "./types";
import "./Timeline.css";

interface TimelineProps {
  name: string;
  tasks: TaskType[];
  person: string;
  range: DateRange;
  onTaskDurationChange?: (taskId: number, newEndDate: string) => void;
  onTaskStartTimeChange?: (taskId: number, newStartDate: string, newEndDate: string) => void;
  onTaskCreate?: (timelineId: number, newTask: Omit<TaskType, 'id'>) => void;
  onTaskDelete?: (timelineId: number, taskId: number) => void;
  timelineId: number;
  onDeleteTimeline?: () => void;
  onRenameTimeline?: () => void;
  groupName?: string;
}

const Timeline: React.FC<TimelineProps> = ({
  name,
  tasks,
  person,
  range,
  onTaskDurationChange,
  onTaskStartTimeChange,
  onTaskCreate,
  onTaskDelete,
  timelineId,
  groupName
}) => {
  const [creating, setCreating] = useState(false);
  const [dragStart, setDragStart] = useState<Date | null>(null);
  const [dragEnd, setDragEnd] = useState<Date | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  // Filter tasks by date range (if any part of the task is in range)
  const filteredTasks = tasks.filter((task) => {
    const taskStart = new Date(task.startDate);
    const taskEnd = new Date(task.endDate);
    return taskEnd >= range.start && taskStart < range.end;
  });

  // Generate time slots starting from 8 AM to midnight (08:00 to 23:45 in 15-minute increments)
  const getTimeSlots = (): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    for (let hour = 8; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        slots.push({ hour, minute });
      }
    }
    return slots;
  };

  const timeSlots = getTimeSlots();
  const SLOT_HEIGHT = 20; // pixels per 15-minute slot

  // Get the current visible day (use first day of range)
  const currentDay = new Date(range.start);

  const formatTime = (hour: number, minute: number): string => {
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  };

  const getDateTimeFromSlot = (slotIndex: number): Date | null => {
    const slot = timeSlots[slotIndex];
    if (!slot) return null;

    const date = new Date(currentDay);
    date.setHours(slot.hour, slot.minute, 0, 0);
    return date;
  };

  const handleTimelineMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.classList.contains('timeline-slot') || target.classList.contains('timeline-hour-label')) {
      const slotIndex = parseInt(target.dataset.slotIndex || '0');
      const datetime = getDateTimeFromSlot(slotIndex);
      if (datetime) {
        setDragStart(datetime);
        setDragEnd(datetime);
        setCreating(true);
        e.preventDefault();
      }
    }
  };

  const handleTimelineMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (creating && timelineRef.current) {
      const rect = timelineRef.current.getBoundingClientRect();
      const y = e.clientY - rect.top;
      const slotIndex = Math.floor(y / SLOT_HEIGHT);
      const datetime = getDateTimeFromSlot(slotIndex);
      if (datetime) {
        setDragEnd(datetime);
      }
    }
  };

  const handleTimelineMouseUp = () => {
    if (creating && dragStart && dragEnd) {
      const start = dragStart < dragEnd ? dragStart : dragEnd;
      const end = dragStart < dragEnd ? dragEnd : dragStart;

      // Add 15 minutes to end time to make it inclusive
      const endPlusSlot = new Date(end);
      endPlusSlot.setMinutes(endPlusSlot.getMinutes() + 15);

      const title = prompt("Enter meeting/task title:");
      if (title && title.trim()) {
        onTaskCreate && onTaskCreate(timelineId, {
          title: title.trim(),
          startDate: start.toISOString(),
          endDate: endPlusSlot.toISOString(),
          assignedTo: person,
          status: "pending"
        });
      }
    }
    setCreating(false);
    setDragStart(null);
    setDragEnd(null);
  };

  useEffect(() => {
    if (creating) {
      window.addEventListener('mouseup', handleTimelineMouseUp);
      return () => window.removeEventListener('mouseup', handleTimelineMouseUp);
    }
  }, [creating, dragStart, dragEnd]);

  const getSlotIndexFromDateTime = (datetime: Date): number => {
    const hour = datetime.getHours();
    const minute = datetime.getMinutes();
    const slotMinute = Math.floor(minute / 15) * 15;
    // Adjust for 8 AM start: hour 8 becomes slot 0
    return (hour - 8) * 4 + slotMinute / 15;
  };

  const getPreviewStyle = (): React.CSSProperties | null => {
    if (!creating || !dragStart || !dragEnd) return null;

    const startSlot = getSlotIndexFromDateTime(dragStart < dragEnd ? dragStart : dragEnd);
    const endSlot = getSlotIndexFromDateTime(dragStart < dragEnd ? dragEnd : dragStart);

    return {
      top: startSlot * SLOT_HEIGHT,
      height: (endSlot - startSlot + 1) * SLOT_HEIGHT
    };
  };

  return (
    <div className="timeline">
      <h3>{name}</h3>
      <div
        className="timeline-vertical"
        ref={timelineRef}
        onMouseDown={handleTimelineMouseDown}
        onMouseMove={handleTimelineMouseMove}
        style={{ minHeight: timeSlots.length * SLOT_HEIGHT }}
      >
        {/* Time slot grid background */}
        <div className="timeline-grid">
          {timeSlots.map((slot, index) => (
            <div
              key={index}
              className={`timeline-slot ${slot.minute === 0 ? 'hour-start' : ''}`}
              data-slot-index={index}
              style={{ height: SLOT_HEIGHT }}
              title={`${formatTime(slot.hour, slot.minute)} - Click and drag to create meeting`}
            >
              {slot.minute === 0 && (
                <span className="timeline-hour-label" data-slot-index={index}>
                  {formatTime(slot.hour, slot.minute)}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Preview of task being created */}
        {creating && dragStart && dragEnd && (
          <div
            className="task-preview"
            style={getPreviewStyle() || undefined}
          >
            Creating meeting...
          </div>
        )}

        {/* Existing tasks */}
        {filteredTasks.length === 0 && !creating ? (
          <div className="empty-message">
            No tasks in this range. Click and drag to create a meeting.
          </div>
        ) : (
          filteredTasks.map((task) => (
            <Task
              key={task.id}
              task={task}
              person={person}
              onDurationChange={onTaskDurationChange}
              onStartTimeChange={onTaskStartTimeChange}
              onDelete={onTaskDelete ? () => onTaskDelete(timelineId, task.id) : undefined}
              slotHeight={SLOT_HEIGHT}
              currentDay={currentDay}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default Timeline;
