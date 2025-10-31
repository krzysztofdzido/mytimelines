import React, { useState, useRef, useEffect } from "react";
import "./Task.css";

function daysBetween(start, end) {
  return Math.max(1, Math.round((new Date(end) - new Date(start)) / (1000 * 60 * 60 * 24)) + 1);
}

const Task = ({ task, person, onDurationChange, onDelete }) => {
  const isPending = task.assignedTo === person && task.status === "pending";
  const [dragging, setDragging] = useState(false);
  const cardRef = useRef();

  // Calculate duration in days
  const durationDays = daysBetween(task.startDate, task.endDate);
  const cardHeight = Math.max(60, durationDays * 40); // 40px per day, minimum 60px

  const handleMouseDown = (e) => {
    e.preventDefault();
    setDragging(true);
    document.body.style.userSelect = "none";
  };

  useEffect(() => {
    if (!dragging) return;

    const onMouseMove = (e) => {
      if (!cardRef.current) return;
      const cardRect = cardRef.current.getBoundingClientRect();
      const deltaPx = e.clientY - cardRect.bottom;
      const daysDelta = Math.round(deltaPx / 40);

      if (daysDelta !== 0) {
        const newEnd = new Date(task.endDate);
        newEnd.setDate(newEnd.getDate() + daysDelta);
        if (newEnd >= new Date(task.startDate)) {
          onDurationChange && onDurationChange(task.id, newEnd.toISOString().slice(0, 10));
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
  }, [dragging, onDurationChange, task.endDate, task.startDate, task.id]);

  return (
    <div
      className={`task${isPending ? " pending" : ""}`}
      ref={cardRef}
      style={{ height: cardHeight }}
    >
      <div className="task-header">
        <div className="task-title">{task.title}</div>
        {onDelete && (
          <button
            className="task-delete"
            onClick={() => onDelete(task.id)}
            title="Delete task"
          >
            ×
          </button>
        )}
      </div>
      <div className="task-dates">
        <div>{task.startDate}</div>
        <div>{task.endDate}</div>
        <div className="task-duration">{durationDays} day{durationDays !== 1 ? 's' : ''}</div>
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

