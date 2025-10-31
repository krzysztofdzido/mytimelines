import React from "react";
import Task from "./Task";
import "./Timeline.css";

const Timeline = ({ name, tasks, person, range }) => {
  // Filter tasks by date range
  const filteredTasks = tasks.filter((task) => {
    const taskDate = new Date(task.date);
    return taskDate >= range.start && taskDate < range.end;
  });

  return (
    <div className="timeline">
      <h3>{name}</h3>
      <div className="timeline-vertical">
        {filteredTasks.length === 0 ? (
          <div style={{ color: '#aaa', fontStyle: 'italic' }}>No tasks in this range</div>
        ) : (
          filteredTasks.map((task) => (
            <Task key={task.id} task={task} person={person} />
          ))
        )}
      </div>
    </div>
  );
};

export default Timeline;
