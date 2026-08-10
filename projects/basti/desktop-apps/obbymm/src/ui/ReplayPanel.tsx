import { useEffect, useRef } from 'react';
import { Play, Square, RotateCcw } from 'lucide-react';
import { useEventStore } from '../commands/eventStore';

export function ReplayPanel() {
  const events = useEventStore(state => state.events);
  const undoStack = useEventStore(state => state.undoStack);
  const redoStack = useEventStore(state => state.redoStack);
  const undo = useEventStore(state => state.undo);
  const redo = useEventStore(state => state.redo);
  const isReplaying = useEventStore(state => state.isReplaying);
  const replayIndex = useEventStore(state => state.replayIndex);
  const startReplay = useEventStore(state => state.startReplay);
  const stopReplay = useEventStore(state => state.stopReplay);

  const eventListRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to current replay event
  useEffect(() => {
    if (!isReplaying || !eventListRef.current) return;
    const rows = eventListRef.current.querySelectorAll('.event-row');
    const activeRow = rows[replayIndex - 1];
    if (activeRow) {
      activeRow.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [isReplaying, replayIndex]);

  const progress = events.length > 0 ? Math.round((replayIndex / events.length) * 100) : 0;

  return (
    <div className="replay-panel">
      <div className="replay-actions">
        <button 
          className="btn" 
          onClick={undo} 
          disabled={undoStack.length === 0 || isReplaying}
          title="Undo"
        >
          <RotateCcw size={13} strokeWidth={2} />
          Undo
        </button>
        <button 
          className="btn" 
          onClick={redo} 
          disabled={redoStack.length === 0 || isReplaying}
          title="Redo"
        >
          <RotateCcw size={13} strokeWidth={2} style={{ transform: 'scaleX(-1)' }} />
          Redo
        </button>

        {isReplaying ? (
          <button className="btn btn-stop" type="button" onClick={stopReplay} title="Stop replay">
            <Square size={12} strokeWidth={2.5} />
            Stop
          </button>
        ) : (
          <button
            className="btn btn-replay"
            type="button"
            onClick={startReplay}
            disabled={events.length === 0}
            title="Replay timeline"
          >
            <Play size={13} strokeWidth={2.2} />
            Replay
          </button>
        )}
      </div>

      {isReplaying && (
        <div className="replay-progress">
          <div className="replay-progress-bar" style={{ width: `${progress}%` }} />
          <span className="replay-progress-label">
            {replayIndex} / {events.length}
          </span>
        </div>
      )}
      
      <div className="event-list" ref={eventListRef}>
        {events.length === 0 && <div className="muted">No events yet.</div>}
        {events.map((ev, idx) => (
          <div
            key={ev.eventId}
            className={`event-row ${isReplaying && idx === replayIndex - 1 ? 'is-active-replay' : ''} ${isReplaying && idx >= replayIndex ? 'is-pending' : ''}`}
          >
            <span>{new Date(ev.timestamp).toLocaleTimeString()}</span>
            <strong>{ev.type}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}
