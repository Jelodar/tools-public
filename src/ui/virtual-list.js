/**
 * High-Performance Functional DOM Virtualizer
 * Renders only visible items to maintain 60fps with massive datasets.
 */
export function createVirtualList({
  container,
  items,
  itemHeight,
  renderItem,
  overscan = 5
}) {
  let scrollTop = 0;
  let viewportHeight = container.clientHeight;
  
  const totalHeight = items.length * itemHeight;
  const spacer = document.createElement('div');
  spacer.style.height = `${totalHeight}px`;
  spacer.style.position = 'relative';
  
  container.innerHTML = '';
  container.appendChild(spacer);
  
  const render = () => {
    const startIdx = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIdx = Math.min(items.length, Math.ceil((scrollTop + viewportHeight) / itemHeight) + overscan);
    
    // Clear previous items (except spacer)
    const existingItems = Array.from(container.children).filter(child => child !== spacer);
    existingItems.forEach(child => child.remove());
    
    const fragment = document.createDocumentFragment();
    
    for (let i = startIdx; i < endIdx; i++) {
      const itemEl = renderItem(items[i], i);
      itemEl.style.position = 'absolute';
      itemEl.style.top = `${i * itemHeight}px`;
      itemEl.style.width = '100%';
      itemEl.style.height = `${itemHeight}px`;
      fragment.appendChild(itemEl);
    }
    
    container.appendChild(fragment);
  };
  
  const handleScroll = (e) => {
    scrollTop = e.target.scrollTop;
    render();
  };
  
  container.addEventListener('scroll', handleScroll);
  
  // Initial render
  render();
  
  // Return cleanup function
  return () => {
    container.removeEventListener('scroll', handleScroll);
  };
}
