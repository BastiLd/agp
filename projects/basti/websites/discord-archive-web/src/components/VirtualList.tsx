import React, { useRef, useState, useEffect, useImperativeHandle, forwardRef } from 'react';

interface VirtualListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  estimatedItemHeight?: number;
  bufferSize?: number;
  onScrollToBottomRef?: (scrollFn: () => void) => void;
  channelId: string;
}

export interface VirtualListRef {
  scrollToIndex: (index: number) => void;
  scrollToBottom: () => void;
}

export const VirtualList = forwardRef(function VirtualList<T>(
  {
    items,
    renderItem,
    estimatedItemHeight = 72,
    bufferSize = 25,
    channelId,
  }: VirtualListProps<T>,
  ref: React.Ref<VirtualListRef>
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(600);
  const [isNearBottom, setIsNearBottom] = useState(true);

  // Measure container height
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerHeight(entry.contentRect.height);
      }
    });

    resizeObserver.observe(container);
    setContainerHeight(container.clientHeight);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Compute indices for rendering
  const totalCount = items.length;
  const visibleCount = Math.ceil(containerHeight / estimatedItemHeight);
  const triggerIndex = Math.floor(scrollTop / estimatedItemHeight);
  
  const startIndex = Math.max(0, triggerIndex - bufferSize);
  const endIndex = Math.min(totalCount, triggerIndex + visibleCount + bufferSize);

  // Spacers heights
  const topSpacerHeight = startIndex * estimatedItemHeight;
  const bottomSpacerHeight = Math.max(0, (totalCount - endIndex) * estimatedItemHeight);

  // Listen to scroll events
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    setScrollTop(target.scrollTop);

    // Check if user is near bottom (within 150px) to determine auto-scroll behavior
    const threshold = 150;
    const isAtBottom = target.scrollHeight - target.scrollTop - target.clientHeight < threshold;
    setIsNearBottom(isAtBottom);
  };

  // Scroll methods exposed to parent
  const scrollToBottom = () => {
    const container = containerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
      setScrollTop(container.scrollTop);
      setIsNearBottom(true);
    }
  };

  const scrollToIndex = (index: number) => {
    const container = containerRef.current;
    if (container && index >= 0 && index < totalCount) {
      // Position index in the middle of viewport
      const targetScroll = Math.max(0, index * estimatedItemHeight - containerHeight / 2);
      container.scrollTop = targetScroll;
      setScrollTop(targetScroll);
      
      // Flash highlight on the target item
      setTimeout(() => {
        const itemEl = container.querySelector(`[data-index="${index}"]`);
        if (itemEl) {
          itemEl.classList.add('highlight-flash');
          setTimeout(() => itemEl.classList.remove('highlight-flash'), 2000);
        }
      }, 50);
    }
  };

  useImperativeHandle(ref, () => ({
    scrollToIndex,
    scrollToBottom,
  }));

  // On channel change, scroll to the bottom
  useEffect(() => {
    // Wait for the render frame to execute scroll
    const timer = setTimeout(() => {
      scrollToBottom();
    }, 50);
    return () => clearTimeout(timer);
  }, [channelId]);

  // Also auto scroll to bottom if items array increases and user was already at bottom.
  // We intentionally do not depend on `isNearBottom` here, otherwise toggling the
  // sticky-bottom flag during user scrolling would re-snap the viewport.
  useEffect(() => {
    if (isNearBottom) {
      scrollToBottom();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length]);

  return (
    <div
      ref={containerRef}
      className="discord-chat-scroll-container"
      onScroll={handleScroll}
    >
      <div style={{ height: topSpacerHeight, width: '100%' }} />
      <div className="discord-messages-list">
        {items.slice(startIndex, endIndex).map((item, idx) => {
          const absoluteIndex = startIndex + idx;
          return (
            <div key={absoluteIndex} data-index={absoluteIndex}>
              {renderItem(item, absoluteIndex)}
            </div>
          );
        })}
      </div>
      <div style={{ height: bottomSpacerHeight, width: '100%' }} />
      
      {/* Floating Scroll to Bottom Indicator if scrolled up */}
      {!isNearBottom && (
        <button 
          className="discord-scroll-bottom-btn" 
          onClick={scrollToBottom}
          title="Nach unten scrollen"
        >
          ⬇️ Neueste Nachrichten anzeigen
        </button>
      )}
    </div>
  );
});
export default VirtualList;
