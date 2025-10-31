import React, { useState, useRef, useEffect } from "react";
import Task from "./Task";
import "./Timeline.css";

const Timeline = ({ name, tasks, person, range, onTaskDurationChange, onTaskCreate, onTaskDelete, timelineId }) => {
  const [creating, setCreating] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  const [dragEnd, setDragEnd] = useState(null);
  const timelineRef = useRef();

  // Filter tasks by date range (if any part of the task is in range)
  const filteredTasks = tasks.filter((task) => {
    const taskStart = new Date(task.startDate);
    const taskEnd = new Date(task.endDate);
    return taskEnd >= range.start && taskStart < range.end;
  });

  // Generate calendar grid days within the visible range
  const getDaysInRange = () => {
    const days = [];
    const current = new Date(range.start);
    while (current < range.end) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return days;
  };

  const days = getDaysInRange();

  const handleTimelineMouseDown = (e) => {
    if (e.target.classList.contains('timeline-day')) {
      const dayIndex = parseInt(e.target.dataset.dayIndex);
      const date = days[dayIndex];
      setDragStart(date);
      setDragEnd(date);
      setCreating(true);
      e.preventDefault();
    }
  };

  const handleTimelineMouseMove = (e) => {
    if (creating && timelineRef.current) {
      const rect = timelineRef.current.getBoundingClientRect();
      const y = e.clientY - rect.top;
      const dayIndex = Math.floor(y / 40); // 40px per day
      if (dayIndex >= 0 && dayIndex < days.length) {
        setDragEnd(days[dayIndex]);
      }
    }
  };

  const handleTimelineMouseUp = () => {
    if (creating && dragStart && dragEnd) {
      const start = dragStart < dragEnd ? dragStart : dragEnd;
      const end = dragStart < dragEnd ? dragEnd : dragStart;

      const title = prompt("Enter meeting/task title:");
      if (title && title.trim()) {
        onTaskCreate && onTaskCreate(timelineId, {
          title: title.trim(),
          startDate: start.toISOString().slice(0, 10),
          endDate: end.toISOString().slice(0, 10),
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

  return (
    <div className="timeline">
      <h3>{name}</h3>
      <div
        className="timeline-vertical"
        ref={timelineRef}
        onMouseDown={handleTimelineMouseDown}
        onMouseMove={handleTimelineMouseMove}
      >
        {/* Calendar grid background */}
        <div className="timeline-grid">
          {days.map((day, index) => (
            <div
              key={index}
              className="timeline-day"
              data-day-index={index}
              title={`${day.toLocaleDateString()} - Click and drag to create meeting`}
            >
              <span className="day-label">{day.getDate()}</span>
            </div>
          ))}
        </div>

        {/* Preview of task being created */}
        {creating && dragStart && dragEnd && (
          <div
            className="task-preview"
            style={{
              top: Math.min(days.indexOf(dragStart), days.indexOf(dragEnd)) * 40,
              height: (Math.abs(days.indexOf(dragEnd) - days.indexOf(dragStart)) + 1) * 40
            }}
          >
            Creating meeting...
          </div>
        )}

        {/* Existing tasks */}
        {filteredTasks.length === 0 && !creating ? (
          <div style={{ color: '#aaa', fontStyle: 'italic', padding: '1rem' }}>
            No tasks in this range. Click and drag to create a meeting.
          </div>
        ) : (
          filteredTasks.map((task) => (
            <Task
              key={task.id}
              task={task}
              person={person}
              onDurationChange={onTaskDurationChange}
              onDelete={onTaskDelete ? () => onTaskDelete(timelineId, task.id) : null}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default Timeline;
