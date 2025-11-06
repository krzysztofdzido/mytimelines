import { Dispatch, SetStateAction, useState } from "react";
import { Timeline, TimelineGroup } from "./types";

interface SidebarProps {
	timelines: Timeline[];
	groups: TimelineGroup[];
	visibleTimelineIds: Set<number>;
	visibleGroupIds: Set<number>;
	setVisibleTimelineIds: Dispatch<SetStateAction<Set<number>>>;
	setVisibleGroupIds: Dispatch<SetStateAction<Set<number>>>;
	sidebarWidth: number;
	isResizing: boolean;
	setIsResizing: Dispatch<SetStateAction<boolean>>;
	startDate: string;
	setStartDate: Dispatch<SetStateAction<string>>;
	goToToday: () => void;
	goToPreviousDay: () => void;
	goToNextDay: () => void;
	onAddTimeline: () => void;
	onAddGroup: () => void;
	resetToDefaults: () => void;
	clearAll: () => void;
	exportToJSON: () => void;
	importFromJSON: () => void;
	onReorderTimelines: (newOrder: Timeline[]) => void;
	onReorderGroups: (newOrder: TimelineGroup[]) => void;
	onAssignToGroup: (timelineId: number, groupId: number | null) => void;
	onDeleteGroup: (groupId: number) => void;
	onRenameGroup: (groupId: number) => void;
	onToggleGroupExpanded: (groupId: number) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
	timelines,
	groups,
	visibleTimelineIds,
	visibleGroupIds,
	setVisibleTimelineIds,
	setVisibleGroupIds,
	sidebarWidth,
	setIsResizing,
	startDate,
	setStartDate,
	goToToday,
	goToPreviousDay,
	goToNextDay,
	onAddTimeline,
	onAddGroup,
	resetToDefaults,
	clearAll,
	exportToJSON,
	importFromJSON,
	onReorderTimelines,
	onReorderGroups,
	onAssignToGroup,
	onDeleteGroup,
	onRenameGroup,
	onToggleGroupExpanded,
}) => {
	const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
	const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
	const [draggedGroupId, setDraggedGroupId] = useState<number | null>(null);
	const [draggedTimelineId, setDraggedTimelineId] = useState<number | null>(null);
	const [dropTargetGroupId, setDropTargetGroupId] = useState<number | null>(null);
	const [draggedGroupIndex, setDraggedGroupIndex] = useState<number | null>(null);
	const [dragOverGroupIndex, setDragOverGroupIndex] = useState<number | null>(null);
	const [isDraggingGroup, setIsDraggingGroup] = useState(false);

	const handleDragStart = (e: React.DragEvent, index: number, timelineId: number, groupId?: number) => {
		setDraggedIndex(index);
		setDraggedTimelineId(timelineId);
		setDraggedGroupId(groupId ?? null);
		e.dataTransfer.effectAllowed = "move";
		setTimeout(() => {
			(e.target as HTMLElement).style.opacity = "0.5";
		}, 0);
	};

	const handleDragEnd = (e: React.DragEvent) => {
		(e.target as HTMLElement).style.opacity = "1";
		setDraggedIndex(null);
		setDragOverIndex(null);
		setDraggedGroupId(null);
		setDraggedTimelineId(null);
		setDropTargetGroupId(null);
	};

	const handleDragOver = (e: React.DragEvent, index: number) => {
		e.preventDefault();
		e.dataTransfer.dropEffect = "move";

		if (draggedIndex === null || draggedIndex === index) {
			return;
		}

		setDragOverIndex(index);
	};

	const handleDragLeave = () => {
		setDragOverIndex(null);
	};

	const handleGroupDragOver = (e: React.DragEvent, groupId: number | null) => {
		e.preventDefault();
		e.stopPropagation();
		e.dataTransfer.dropEffect = "move";
		setDropTargetGroupId(groupId);
	};

	const handleGroupDragLeave = (e: React.DragEvent) => {
		e.stopPropagation();
		setDropTargetGroupId(null);
	};

	const handleGroupDrop = (e: React.DragEvent, targetGroupId: number | null) => {
		e.preventDefault();
		e.stopPropagation();

		if (draggedTimelineId === null) {
			setDropTargetGroupId(null);
			return;
		}

		// Assign timeline to the target group
		onAssignToGroup(draggedTimelineId, targetGroupId);

		setDraggedIndex(null);
		setDragOverIndex(null);
		setDraggedGroupId(null);
		setDraggedTimelineId(null);
		setDropTargetGroupId(null);
	};

	const handleDrop = (e: React.DragEvent, dropIndex: number, dropGroupId?: number) => {
		e.preventDefault();

		if (draggedIndex === null || draggedIndex === dropIndex) {
			setDragOverIndex(null);
			return;
		}

		// Get timelines in the same group context
		const sourceGroupId = draggedGroupId ?? undefined;
		const targetGroupId = dropGroupId ?? undefined;

		const sourceTimelines = timelines.filter(t => t.groupId === sourceGroupId);
		const draggedTimeline = sourceTimelines[draggedIndex];

		if (!draggedTimeline) {
			setDragOverIndex(null);
			return;
		}

		// Create new timelines array with updated order and group
		const newTimelines = timelines.filter(t => t.id !== draggedTimeline.id);

		// Find insertion point
		const targetTimelines = timelines.filter(t => t.groupId === targetGroupId);
		const targetTimeline = targetTimelines[dropIndex];

		if (targetTimeline) {
			const insertIndex = newTimelines.findIndex(t => t.id === targetTimeline.id);
			newTimelines.splice(insertIndex, 0, { ...draggedTimeline, groupId: targetGroupId });
		} else {
			// Add to end
			newTimelines.push({ ...draggedTimeline, groupId: targetGroupId });
		}

		onReorderTimelines(newTimelines);
		setDragOverIndex(null);
		setDraggedIndex(null);
		setDraggedGroupId(null);
	};

	const handleTimelineCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>, timelineId: number) => {
		e.stopPropagation();
		setVisibleTimelineIds((prev) => {
			const newSet = new Set(prev);
			if (e.target.checked) {
				newSet.add(timelineId);
			} else {
				newSet.delete(timelineId);
			}
			return newSet;
		});
	};

	const handleGroupCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>, groupId: number) => {
		e.stopPropagation();
		const isChecked = e.target.checked;

		setVisibleGroupIds((prev) => {
			const newSet = new Set(prev);
			if (isChecked) {
				newSet.add(groupId);
			} else {
				newSet.delete(groupId);
			}
			return newSet;
		});

		// Also toggle all timelines in this group
		const groupTimelines = timelines.filter(t => t.groupId === groupId);
		setVisibleTimelineIds((prev) => {
			const newSet = new Set(prev);
			groupTimelines.forEach(t => {
				if (isChecked) {
					newSet.add(t.id);
				} else {
					newSet.delete(t.id);
				}
			});
			return newSet;
		});
	};

	// Group drag handlers
	const handleGroupDragStart = (e: React.DragEvent, index: number) => {
		setDraggedGroupIndex(index);
		setIsDraggingGroup(true);
		e.dataTransfer.effectAllowed = "move";
		// Set a custom drag image or handle
		setTimeout(() => {
			const target = e.currentTarget as HTMLElement;
			target.style.opacity = "0.5";
		}, 0);
	};

	const handleGroupDragEnd = (e: React.DragEvent) => {
		const target = e.currentTarget as HTMLElement;
		target.style.opacity = "1";
		setDraggedGroupIndex(null);
		setDragOverGroupIndex(null);
		setIsDraggingGroup(false);
	};

	const handleGroupDragOverForReorder = (e: React.DragEvent, index: number) => {
		if (!isDraggingGroup) return;
		e.preventDefault();
		e.stopPropagation();
		e.dataTransfer.dropEffect = "move";

		if (draggedGroupIndex === null || draggedGroupIndex === index) {
			return;
		}

		setDragOverGroupIndex(index);
	};

	const handleGroupDragLeaveForReorder = () => {
		setDragOverGroupIndex(null);
	};

	const handleGroupDropForReorder = (e: React.DragEvent, dropIndex: number) => {
		if (!isDraggingGroup || draggedGroupIndex === null) return;
		e.preventDefault();
		e.stopPropagation();

		if (draggedGroupIndex === dropIndex) {
			setDragOverGroupIndex(null);
			return;
		}

		const newGroups = [...groups];
		const [draggedGroup] = newGroups.splice(draggedGroupIndex, 1);
		newGroups.splice(dropIndex, 0, draggedGroup);

		onReorderGroups(newGroups);
		setDragOverGroupIndex(null);
		setDraggedGroupIndex(null);
		setIsDraggingGroup(false);
	};

	const ungroupedTimelines = timelines.filter(t => !t.groupId);

	return (
		<div
			style={{
				position: "fixed",
				left: 0,
				top: 0,
				width: `${sidebarWidth}px`,
				height: "100vh",
				padding: "1rem",
				background: "#f9f9f9",
				borderRight: "1px solid #ddd",
				boxShadow: "2px 0 4px rgba(0, 0, 0, 0.1)",
				overflowY: "auto",
				zIndex: 100,
			}}
		>
			{/* Date Navigation Controls */}
			<div style={{ marginBottom: "1.5rem", paddingBottom: "1rem", borderBottom: "1px solid #ddd" }}>
				<div style={{ display: "flex", gap: "4px", marginBottom: 8 }}>
					<button
						onClick={goToToday}
						style={{
							flex: 1,
							padding: "8px 12px",
							cursor: "pointer",
							background: "#2196F3",
							color: "white",
							border: "none",
							borderRadius: "4px",
							fontWeight: "500",
						}}
					>
						Today
					</button>
					<button
						onClick={resetToDefaults}
						style={{
							flex: 1,
							padding: "8px 12px",
							background: "#ff6b6b",
							color: "white",
							border: "none",
							borderRadius: "4px",
							cursor: "pointer",
							fontWeight: "500",
						}}
					>
						Reset
					</button>
				</div>
				<div style={{ display: "flex", gap: "4px", marginBottom: 8 }}>
					<button
						onClick={goToPreviousDay}
						style={{
							flex: 1,
							padding: "6px 8px",
							cursor: "pointer",
							background: "white",
							border: "1px solid #ccc",
							borderRadius: "4px",
						}}
					>
						← Prev
					</button>
					<button
						onClick={goToNextDay}
						style={{
							flex: 1,
							padding: "6px 8px",
							cursor: "pointer",
							background: "white",
							border: "1px solid #ccc",
							borderRadius: "4px",
						}}
					>
						Next →
					</button>
				</div>
				<input
					type="date"
					value={startDate}
					onChange={(e) => setStartDate(e.target.value)}
					style={{
						width: "100%",
						padding: "6px 8px",
						border: "1px solid #ccc",
						borderRadius: "4px",
						fontSize: "14px",
					}}
				/>
			</div>

			{/* Export/Import Controls */}
			<div style={{ marginBottom: "1.5rem", paddingBottom: "1rem", borderBottom: "1px solid #ddd" }}>
				<div style={{ display: "flex", gap: "4px", marginBottom: 8 }}>
					<button
						onClick={exportToJSON}
						style={{
							flex: 1,
							padding: "8px 12px",
							cursor: "pointer",
							background: "#4CAF50",
							color: "white",
							border: "none",
							borderRadius: "4px",
							fontWeight: "500",
							fontSize: "0.9em",
						}}
						title="Export all timelines to JSON file"
					>
						📥 Export
					</button>
					<button
						onClick={importFromJSON}
						style={{
							flex: 1,
							padding: "8px 12px",
							cursor: "pointer",
							background: "#FF9800",
							color: "white",
							border: "none",
							borderRadius: "4px",
							fontWeight: "500",
							fontSize: "0.9em",
						}}
						title="Import timelines from JSON file"
					>
						📤 Import
					</button>
				</div>
				<button
					onClick={clearAll}
					style={{
						width: "100%",
						padding: "8px 12px",
						cursor: "pointer",
						background: "#9E9E9E",
						color: "white",
						border: "none",
						borderRadius: "4px",
						fontWeight: "500",
						fontSize: "0.9em",
					}}
					title="Remove all timelines and groups"
				>
					🗑️ Clear All
				</button>
			</div>

			<h2 style={{ fontSize: "1.2em", margin: "0 0 1rem 0" }}>Timelines</h2>

			{/* Groups */}
			{groups.map((group) => {
				const groupTimelines = timelines.filter(t => t.groupId === group.id);
				const allGroupTimelinesVisible = groupTimelines.length > 0 &&
					groupTimelines.every(t => visibleTimelineIds.has(t.id));
				const isDropTarget = dropTargetGroupId === group.id;

				return (
					<div
						key={group.id}
						style={{ marginBottom: "1rem" }}
						onDragOver={(e) => handleGroupDragOver(e, group.id)}
						onDragLeave={handleGroupDragLeave}
						onDrop={(e) => handleGroupDrop(e, group.id)}
					>
						{/* Group Header */}
						<div
							style={{
								padding: "8px",
								background: isDropTarget ? "#c5cae9" : "#e8eaf6",
								borderRadius: "4px",
								marginBottom: "4px",
								display: "flex",
								alignItems: "center",
								justifyContent: "space-between",
								border: isDropTarget ? "2px dashed #5C6BC0" : "2px solid transparent",
								transition: "background 0.2s, border 0.2s",
							}}
							draggable
							onDragStart={(e) => handleGroupDragStart(e, groups.findIndex(g => g.id === group.id))}
							onDragEnd={handleGroupDragEnd}
							onDragOver={(e) => handleGroupDragOverForReorder(e, groups.findIndex(g => g.id === group.id))}
							onDragLeave={handleGroupDragLeaveForReorder}
							onDrop={(e) => handleGroupDropForReorder(e, groups.findIndex(g => g.id === group.id))}
						>
							<div style={{ display: "flex", alignItems: "center", flex: 1 }}>
								<span
									onClick={() => onToggleGroupExpanded(group.id)}
									style={{
										cursor: "pointer",
										marginRight: "8px",
										fontSize: "1.2em",
										userSelect: "none",
									}}
								>
									{group.isExpanded ? "▼" : "▶"}
								</span>
								<input
									type="checkbox"
									checked={allGroupTimelinesVisible}
									onChange={(e) => handleGroupCheckboxChange(e, group.id)}
									style={{ cursor: "pointer", marginRight: "8px" }}
									onClick={(e) => e.stopPropagation()}
								/>
								<span
									style={{ fontWeight: "600", flex: 1, cursor: "pointer" }}
									onClick={() => onToggleGroupExpanded(group.id)}
								>
									{group.name} ({groupTimelines.length})
								</span>
							</div>
							<div style={{ display: "flex", gap: "4px" }}>
								<button
									onClick={() => onRenameGroup(group.id)}
									style={{
										padding: "2px 6px",
										fontSize: "0.8em",
										cursor: "pointer",
										background: "white",
										border: "1px solid #ccc",
										borderRadius: "3px",
									}}
									title="Rename group"
								>
									✏️
								</button>
								<button
									onClick={() => onDeleteGroup(group.id)}
									style={{
										padding: "2px 6px",
										fontSize: "0.8em",
										cursor: "pointer",
										background: "#ffebee",
										border: "1px solid #ef5350",
										borderRadius: "3px",
									}}
									title="Delete group"
								>
									🗑️
								</button>
							</div>
						</div>

						{/* Group Timelines */}
						{group.isExpanded && (
							<div style={{ marginLeft: "1rem" }}>
								{groupTimelines.length === 0 && isDropTarget && (
									<div
										style={{
											padding: "1rem",
											textAlign: "center",
											color: "#999",
											fontStyle: "italic",
											background: "#f5f5f5",
											borderRadius: "4px",
											marginBottom: "0.5rem",
											border: "2px dashed #5C6BC0",
										}}
									>
										Drop timeline here
									</div>
								)}
								{groupTimelines.map((timeline, index) => (
									<div
										key={timeline.id}
										draggable
										onDragStart={(e) => handleDragStart(e, index, timeline.id, group.id)}
										onDragEnd={handleDragEnd}
										onDragOver={(e) => handleDragOver(e, index)}
										onDragLeave={handleDragLeave}
										onDrop={(e) => handleDrop(e, index, group.id)}
										style={{
											marginBottom: "0.5rem",
											padding: "8px",
											background: dragOverIndex === index && draggedGroupId === group.id ? "#e3f2fd" : "white",
											border: dragOverIndex === index && draggedGroupId === group.id ? "2px dashed #2196F3" : "1px solid #ddd",
											borderRadius: "4px",
											cursor: "move",
											transition: "background 0.2s, border 0.2s",
										}}
									>
										<label style={{ cursor: "move", display: "flex", alignItems: "center" }}>
											<span style={{ marginRight: "8px", color: "#999", fontSize: "1.2em" }}>⋮⋮</span>
											<input
												type="checkbox"
												checked={visibleTimelineIds.has(timeline.id)}
												onChange={(e) => handleTimelineCheckboxChange(e, timeline.id)}
												style={{ cursor: "pointer" }}
												onClick={(e) => e.stopPropagation()}
											/>
											<span style={{ marginLeft: 8 }}>{timeline.name}</span>
										</label>
									</div>
								))}
							</div>
						)}
					</div>
				);
			})}

			{/* Ungrouped Timelines */}
			<div
				style={{ marginTop: "1rem" }}
				onDragOver={(e) => handleGroupDragOver(e, null)}
				onDragLeave={handleGroupDragLeave}
				onDrop={(e) => handleGroupDrop(e, null)}
			>
				{groups.length > 0 && (
					<div
						style={{
							fontSize: "0.9em",
							color: "#666",
							marginBottom: "0.5rem",
							fontWeight: "500",
							padding: "8px",
							background: dropTargetGroupId === null && draggedTimelineId !== null ? "#e8f5e9" : "transparent",
							borderRadius: "4px",
							border: dropTargetGroupId === null && draggedTimelineId !== null ? "2px dashed #4CAF50" : "2px solid transparent",
							transition: "background 0.2s, border 0.2s",
						}}
					>
						Ungrouped {dropTargetGroupId === null && draggedTimelineId !== null && "(Drop here to ungroup)"}
					</div>
				)}
				{ungroupedTimelines.map((timeline, index) => (
					<div
						key={timeline.id}
						draggable
						onDragStart={(e) => handleDragStart(e, index, timeline.id)}
						onDragEnd={handleDragEnd}
						onDragOver={(e) => handleDragOver(e, index)}
						onDragLeave={handleDragLeave}
						onDrop={(e) => handleDrop(e, index)}
						style={{
							marginBottom: "0.5rem",
							padding: "8px",
							background: dragOverIndex === index && draggedGroupId === null ? "#e3f2fd" : "white",
							border: dragOverIndex === index && draggedGroupId === null ? "2px dashed #2196F3" : "1px solid transparent",
							borderRadius: "4px",
							cursor: "move",
							transition: "background 0.2s, border 0.2s",
						}}
					>
						<label style={{ cursor: "move", display: "flex", alignItems: "center" }}>
							<div style={{ display: "flex", alignItems: "center" }}>
								<span style={{ marginRight: "8px", color: "#999", fontSize: "1.2em" }}>⋮⋮</span>
								<input
									type="checkbox"
									checked={visibleTimelineIds.has(timeline.id)}
									onChange={(e) => handleTimelineCheckboxChange(e, timeline.id)}
									style={{ cursor: "pointer" }}
									onClick={(e) => e.stopPropagation()}
								/>
								<span style={{ marginLeft: 8 }}>{timeline.name}</span>
							</div>
						</label>
					</div>
				))}
			</div>

			{/* Add Buttons */}
			<div style={{ marginTop: "1rem", display: "flex", gap: "0.5rem", flexDirection: "column" }}>
				<button
					onClick={onAddTimeline}
					style={{
						width: "100%",
						padding: "8px 12px",
						background: "#4CAF50",
						color: "white",
						border: "none",
						borderRadius: "4px",
						cursor: "pointer",
						fontWeight: "500",
					}}
				>
					+ Add Timeline
				</button>
				<button
					onClick={onAddGroup}
					style={{
						width: "100%",
						padding: "8px 12px",
						background: "#5C6BC0",
						color: "white",
						border: "none",
						borderRadius: "4px",
						cursor: "pointer",
						fontWeight: "500",
					}}
				>
					+ Add Group
				</button>
			</div>

			{/* Resize Handle */}
			<div
				style={{
					position: "absolute",
					top: 0,
					right: 0,
					bottom: 0,
					width: "10px",
					cursor: "ew-resize",
					zIndex: 101,
				}}
				onMouseDown={(e) => {
					e.preventDefault();
					setIsResizing(true);
				}}
			/>
		</div>
	);
};

export default Sidebar;
