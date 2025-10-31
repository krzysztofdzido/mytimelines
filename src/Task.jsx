import React, { useState, useRef, useEffect } from "react";
import "./Task.css";

const Task = ({ task, person, onDurationChange, onDelete, slotHeight }) => {
  const isPending = task.assignedTo === person && task.status === "pending";
  const [dragging, setDragging] = useState(false);
  const cardRef = useRef();

  const startDate = new Date(task.startDate);
  const endDate = new Date(task.endDate);

  // Calculate duration in minutes
  const durationMinutes = Math.round((endDate - startDate) / (1000 * 60));
  const durationHours = Math.floor(durationMinutes / 60);
  const durationMins = durationMinutes % 60;

  // Calculate position and height based on time (starting from 8 AM)
  const getSlotIndexFromDateTime = (datetime) => {
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

  const formatTime = (date) => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const formatDuration = () => {
    if (durationHours > 0 && durationMins > 0) {
      return `${durationHours}h ${durationMins}m`;
    } else if (durationHours > 0) {
      return `${durationHours}h`;
    } else {
      return `${durationMins}m`;
    }
  };

  const handleMouseDown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(true);
    document.body.style.userSelect = "none";
  };

  useEffect(() => {
    if (!dragging) return;

    const onMouseMove = (e) => {
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
      setDragging(false);
      document.body.style.userSelect = "";
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [dragging, onDurationChange, endDate, startDate, task.id, slotHeight]);

  return (
    <div
      className={`task${isPending ? " pending" : ""}`}
      ref={cardRef}
      style={{
        height: cardHeight,
        position: 'absolute',
        top: cardTop,
        left: 0,
        right: 0,
        zIndex: 10
      }}
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
        onMouseDown={handleMouseDown}
        title="Drag to change duration"
      />
    </div>
  );
};

export default Task;

