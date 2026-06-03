/**
 * Universal Drag & Drop Utility
 * Standardized handling for file-based tools.
 */
export function setupDragAndDrop(container, onFiles) {
  const preventDefault = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    preventDefault(e);
    container.classList.remove('drag-active');
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      onFiles(Array.from(files));
    }
  };

  const handleDragEnter = (e) => {
    preventDefault(e);
    container.classList.add('drag-active');
  };

  const handleDragOver = (e) => {
    preventDefault(e);
    container.classList.add('drag-active');
  };

  const handleDragLeave = (e) => {
    preventDefault(e);
    container.classList.remove('drag-active');
  };

  container.addEventListener('dragenter', handleDragEnter);
  container.addEventListener('dragover', handleDragOver);
  container.addEventListener('dragleave', handleDragLeave);
  container.addEventListener('drop', handleDrop);

  return () => {
    container.removeEventListener('dragenter', handleDragEnter);
    container.removeEventListener('dragover', handleDragOver);
    container.removeEventListener('dragleave', handleDragLeave);
    container.removeEventListener('drop', handleDrop);
  };
}
