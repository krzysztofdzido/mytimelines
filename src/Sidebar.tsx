import { Dispatch, SetStateAction, useState } from "react";
import { Timeline } from "./types";

interface SidebarProps {
	timelines: Timeline[];
	visibleTimelineIds: Set<number>;
	setVisibleTimelineIds: Dispatch<SetStateAction<Set<number>>>;
	sidebarWidth: number;
	isResizing: boolean;
	setIsResizing: Dispatch<SetStateAction<boolean>>;
	startDate: string;
	setStartDate: Dispatch<SetStateAction<string>>;
	goToToday: () => void;
	goToPreviousDay: () => void;
	goToNextDay: () => void;
	onAddTimeline: () => void;
	resetToDefaults: () => void;
	onReorderTimelines: (newOrder: Timeline[]) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
	timelines,
	visibleTimelineIds,
	setVisibleTimelineIds,
	sidebarWidth,
	setIsResizing,
	startDate,
	setStartDate,
	goToToday,
	goToPreviousDay,
	goToNextDay,
	onAddTimeline,
	resetToDefaults,
	onReorderTimelines,
}) => {
	const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
	const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

	const handleDragStart = (e: React.DragEvent, index: number) => {
		setDraggedIndex(index);
		e.dataTransfer.effectAllowed = "move";
		// Add a small delay to allow the drag image to be captured
		setTimeout(() => {
			(e.target as HTMLElement).style.opacity = "0.5";
		}, 0);
	};

	const handleDragEnd = (e: React.DragEvent) => {
		(e.target as HTMLElement).style.opacity = "1";
		setDraggedIndex(null);
		setDragOverIndex(null);
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

	const handleDrop = (e: React.DragEvent, dropIndex: number) => {
		e.preventDefault();

		if (draggedIndex === null || draggedIndex === dropIndex) {
			setDragOverIndex(null);
			return;
		}

		const newTimelines = [...timelines];
		const [draggedTimeline] = newTimelines.splice(draggedIndex, 1);
		newTimelines.splice(dropIndex, 0, draggedTimeline);

		onReorderTimelines(newTimelines);
		setDragOverIndex(null);
		setDraggedIndex(null);
	};

	const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>, timelineId: number) => {
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

			<h2 style={{ fontSize: "1.2em", margin: "0 0 1rem 0" }}>Timelines</h2>

			{/* Timeline List */}
			{timelines.map((timeline, index) => (
				<div
					key={timeline.id}
					draggable
					onDragStart={(e) => handleDragStart(e, index)}
					onDragEnd={handleDragEnd}
					onDragOver={(e) => handleDragOver(e, index)}
					onDragLeave={handleDragLeave}
					onDrop={(e) => handleDrop(e, index)}
					style={{
						marginBottom: "0.5rem",
						padding: "8px",
						background: dragOverIndex === index ? "#e3f2fd" : "white",
						border: dragOverIndex === index ? "2px dashed #2196F3" : "1px solid transparent",
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
							onChange={(e) => handleCheckboxChange(e, timeline.id)}
							style={{ cursor: "pointer" }}
							onClick={(e) => e.stopPropagation()}
						/>
						<span style={{ marginLeft: 8 }}>{timeline.name}</span>
					</label>
				</div>
			))}

			{/* Add Timeline Button */}
			<button
				onClick={onAddTimeline}
				style={{
					width: "100%",
					marginTop: "1rem",
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
