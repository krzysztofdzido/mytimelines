import React, { useState, useRef, useEffect } from "react";
import { Task as TaskType } from "./types";
import "./Task.css";

interface TaskProps {
  task: TaskType;
  person: string;
  onDurationChange?: (taskId: number, newEndDate: string) => void;
  onDelete?: (taskId: number) => void;
  onStartTimeChange?: (taskId: number, newStartDate: string, newEndDate: string) => void;
  slotHeight: number;
  currentDay: Date;
}

const Task: React.FC<TaskProps> = ({
  task,
  person,
  onDurationChange,
  onDelete,
  onStartTimeChange,
  slotHeight
}) => {
  const isPending = task.assignedTo === person && task.status === "pending";
  const [draggingResize, setDraggingResize] = useState(false);
  const [draggingMove, setDraggingMove] = useState(false);
  const [dragStartY, setDragStartY] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);

  const startDate = new Date(task.startDate);
  const endDate = new Date(task.endDate);

  // Calculate duration in minutes
  const durationMinutes = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60));
  const durationHours = Math.floor(durationMinutes / 60);
  const durationMins = durationMinutes % 60;

  // Calculate position and height based on time (starting from 8 AM)
  const getSlotIndexFromDateTime = (datetime: Date): number => {
    const hour = datetime.getHours();
    const minute = datetime.getMinutes();
    const slotMinute = Math.floor(minute / 15) * 15;
    // Adjust for 8 AM start: hour 8 becomes slot 0
    return (hour - 8) * 4 + slotMinute / 15;
  };

  const startSlot = getSlotIndexFromDateTime(startDate);
  const endSlot = getSlotIndexFromDateTime(endDate);
  const numSlots = endSlot - startSlot;

  const cardHeight = Math.max(40, numSlots * slotHeight);
  const cardTop = startSlot * slotHeight;

  const formatTime = (date: Date): string => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const formatDuration = (): string => {
    if (durationHours > 0 && durationMins > 0) {
      return `${durationHours}h ${durationMins}m`;
    } else if (durationHours > 0) {
      return `${durationHours}h`;
    } else {
      return `${durationMins}m`;
    }
  };

  // Handle dragging the resize handle (bottom)
  const handleResizeMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDraggingResize(true);
    document.body.style.userSelect = "none";
  };

  // Handle dragging the entire task card (move)
  const handleMoveMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // Don't start move if clicking delete button or resize handle
    const target = e.target as HTMLElement;
    if (target.classList.contains('task-delete') ||
        target.classList.contains('task-resize-handle')) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    setDraggingMove(true);
    setDragStartY(e.clientY);
    document.body.style.userSelect = "none";
    document.body.style.cursor = "grabbing";
  };

  // Effect for resize dragging
  useEffect(() => {
    if (!draggingResize) return;

    const onMouseMove = (e: MouseEvent) => {
      if (!cardRef.current) return;
      const cardRect = cardRef.current.getBoundingClientRect();
      const deltaPx = e.clientY - cardRect.bottom;
      const slotsDelta = Math.round(deltaPx / slotHeight);

      if (slotsDelta !== 0) {
        const newEnd = new Date(endDate);
        newEnd.setMinutes(newEnd.getMinutes() + (slotsDelta * 15));

        // Ensure end time is after start time (at least 15 minutes)
        if (newEnd > startDate) {
          onDurationChange && onDurationChange(task.id, newEnd.toISOString());
        }
      }
    };

    const onMouseUp = () => {
      setDraggingResize(false);
      document.body.style.userSelect = "";
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [draggingResize, onDurationChange, endDate, startDate, task.id, slotHeight]);

  // Effect for move dragging
  useEffect(() => {
    if (!draggingMove) return;

    const onMouseMove = (e: MouseEvent) => {
      const deltaPx = e.clientY - dragStartY;
      const slotsDelta = Math.round(deltaPx / slotHeight);

      if (slotsDelta !== 0) {
        const newStart = new Date(startDate);
        newStart.setMinutes(newStart.getMinutes() + (slotsDelta * 15));

        const newEnd = new Date(endDate);
        newEnd.setMinutes(newEnd.getMinutes() + (slotsDelta * 15));

        // Ensure times are within valid range (8 AM to midnight)
        if (newStart.getHours() >= 8 && newEnd.getHours() < 24) {
          onStartTimeChange && onStartTimeChange(task.id, newStart.toISOString(), newEnd.toISOString());
          setDragStartY(e.clientY);
        }
      }
    };

    const onMouseUp = () => {
      setDraggingMove(false);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [draggingMove, dragStartY, onStartTimeChange, startDate, endDate, task.id, slotHeight]);

  return (
    <div
      className={`task${isPending ? " pending" : ""}${draggingMove ? " dragging-move" : ""}`}
      ref={cardRef}
      style={{
        height: cardHeight,
        position: 'absolute',
        top: cardTop,
        left: 0,
        right: 0,
        zIndex: draggingMove ? 100 : 10,
        cursor: draggingMove ? 'grabbing' : 'grab'
      }}
      onMouseDown={handleMoveMouseDown}
    >
      <div className="task-header">
        <div className="task-title">{task.title}</div>
        {onDelete && (
          <button
            className="task-delete"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(task.id);
            }}
            title="Delete task"
          >
            ×
          </button>
        )}
      </div>
      <div className="task-dates">
        <div className="task-time-range">
          {formatTime(startDate)} - {formatTime(endDate)}
        </div>
        <div className="task-duration">{formatDuration()}</div>
      </div>
      <div className="task-meta">
        <span>Assigned: {task.assignedTo}</span>
        <span>Status: {task.status}</span>
      </div>
      <div
        className="task-resize-handle"
        onMouseDown={handleResizeMouseDown}
        title="Drag to change duration"
      />
    </div>
  );
};

export default Task;

