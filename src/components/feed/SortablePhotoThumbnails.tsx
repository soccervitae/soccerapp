import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface MediaItem {
  url: string;
  blob?: Blob;
  file?: File;
  isLocal: boolean;
}

interface SortablePhotoThumbnailsProps {
  items: MediaItem[];
  onReorder: (items: MediaItem[]) => void;
  currentIndex: number;
  onSelect: (index: number) => void;
  disabled?: boolean;
}

interface SortableItemProps {
  id: string;
  url: string;
  index: number;
  isActive: boolean;
  onSelect: () => void;
  disabled?: boolean;
}

const SortableItem = ({ id, url, index, isActive, onSelect, disabled }: SortableItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onSelect}
      className={`relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden cursor-grab active:cursor-grabbing transition-all ${
        isActive ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : "ring-1 ring-border"
      } ${isDragging ? "scale-105 shadow-lg" : ""}`}
    >
      <img
        src={url}
        alt={`Foto ${index + 1}`}
        className="w-full h-full object-cover pointer-events-none"
        draggable={false}
      />
      <div className="absolute bottom-0.5 right-0.5 w-5 h-5 bg-background/80 backdrop-blur-sm rounded-full flex items-center justify-center">
        <span className="text-[10px] font-medium text-foreground">{index + 1}</span>
      </div>
      {isDragging && (
        <div className="absolute inset-0 bg-primary/20 rounded-lg" />
      )}
    </div>
  );
};

export const SortablePhotoThumbnails = ({
  items,
  onReorder,
  currentIndex,
  onSelect,
  disabled = false,
}: SortablePhotoThumbnailsProps) => {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((_, i) => `item-${i}` === active.id);
      const newIndex = items.findIndex((_, i) => `item-${i}` === over.id);
      const newItems = arrayMove(items, oldIndex, newIndex);
      onReorder(newItems);
    }
  };

  if (items.length <= 1) return null;

  return (
    <div className="mt-3 p-3 bg-muted/50 rounded-lg">
      <div className="flex items-center gap-2 mb-2">
        <span className="material-symbols-outlined text-[16px] text-muted-foreground">drag_indicator</span>
        <span className="text-xs text-muted-foreground">Arraste para reordenar</span>
      </div>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={items.map((_, i) => `item-${i}`)}
          strategy={horizontalListSortingStrategy}
        >
          <div className="flex gap-2 overflow-x-auto pb-1">
            {items.map((item, index) => (
              <SortableItem
                key={`item-${index}`}
                id={`item-${index}`}
                url={item.url}
                index={index}
                isActive={index === currentIndex}
                onSelect={() => onSelect(index)}
                disabled={disabled}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
};
