import { useEventStore } from './eventStore';

export function undoLastCommand(): void {
  useEventStore.getState().undo();
}

export function redoLastCommand(): void {
  useEventStore.getState().redo();
}
