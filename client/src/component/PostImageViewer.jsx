import { ChevronLeft, ChevronRight, X } from "lucide-react";

const PostImageViewer = ({ images, index, onIndexChange, onClose }) => {
  if (!images[index]) return null;

  return (
    <div
      className="fixed inset-0 z-[220] bg-black/90 backdrop-blur-sm p-4 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Post image viewer"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <button type="button" onClick={onClose} aria-label="Close image viewer" className="fixed top-4 right-4 z-10 w-11 h-11 rounded-full bg-white/95 text-slate-700 grid place-items-center shadow">
        <X />
      </button>

      {images.length > 1 && (
        <button type="button" onClick={() => onIndexChange((index - 1 + images.length) % images.length)} aria-label="Previous image" className="fixed left-3 sm:left-6 z-10 w-11 h-11 rounded-full bg-white/95 text-slate-700 grid place-items-center shadow hover:scale-105 transition">
          <ChevronLeft />
        </button>
      )}

      <img src={images[index]} alt={`Post image ${index + 1}`} className="max-w-[92vw] max-h-[90vh] object-contain rounded-lg" onMouseDown={(event) => event.stopPropagation()} />

      {images.length > 1 && (
        <button type="button" onClick={() => onIndexChange((index + 1) % images.length)} aria-label="Next image" className="fixed right-3 sm:right-6 z-10 w-11 h-11 rounded-full bg-white/95 text-slate-700 grid place-items-center shadow hover:scale-105 transition">
          <ChevronRight />
        </button>
      )}
    </div>
  );
};

export default PostImageViewer;
