import React from "react";
import "./Task.css";

const Task = ({ task, person }) => {
  const isPending = task.assignedTo === person && task.status === "pending";
  return (
    <div className={`task${isPending ? " pending" : ""}`}>
      <div className="task-title">{task.title}</div>
      <div className="task-meta">
        <span>Assigned: {task.assignedTo}</span>
        <span>Status: {task.status}</span>
        <span>Date: {task.date}</span>
      </div>
    </div>
  );
};

export default Task;

