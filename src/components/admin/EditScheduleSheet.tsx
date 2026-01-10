import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Clock, Image, Video } from "lucide-react";
import { format, setHours, setMinutes, isBefore, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useUpdateScheduledPost, ScheduledPost } from "@/hooks/useScheduledPosts";

interface EditScheduleSheetProps {
  post: ScheduledPost;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EditScheduleSheet = ({
  post,
  open,
  onOpenChange,
}: EditScheduleSheetProps) => {
  const currentScheduledDate = new Date(post.scheduled_at);
  
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(currentScheduledDate);
  const [selectedHour, setSelectedHour] = useState(format(currentScheduledDate, "HH"));
  const [selectedMinute, setSelectedMinute] = useState(format(currentScheduledDate, "mm"));

  const updateSchedule = useUpdateScheduledPost();

  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, "0"));
  const minutes = ["00", "15", "30", "45"];

  const getScheduledDateTime = () => {
    if (!selectedDate) return null;
    return setMinutes(
      setHours(selectedDate, parseInt(selectedHour)),
      parseInt(selectedMinute)
    );
  };

  const isValidSchedule = () => {
    const dateTime = getScheduledDateTime();
    return dateTime && !isBefore(dateTime, new Date());
  };

  const handleSave = () => {
    const dateTime = getScheduledDateTime();
    if (dateTime && isValidSchedule()) {
      updateSchedule.mutate(
        { postId: post.id, scheduledAt: dateTime },
        { onSuccess: () => onOpenChange(false) }
      );
    }
  };

  const isDateDisabled = (date: Date) => {
    return isBefore(date, startOfDay(new Date()));
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl">
        <SheetHeader className="pb-4">
          <SheetTitle>Editar Agendamento</SheetTitle>
        </SheetHeader>

        <div className="space-y-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Post Preview */}
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
            {post.media_url && (
              <div className="w-16 h-16 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                {post.media_type === 'video' ? (
                  <video 
                    src={post.media_url.startsWith('[') ? JSON.parse(post.media_url)[0] : post.media_url}
                    className="w-full h-full object-cover"
                    muted
                  />
                ) : (
                  <img 
                    src={post.media_url.startsWith('[') ? JSON.parse(post.media_url)[0] : post.media_url}
                    alt="" 
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {post.content || 'Post sem legenda'}
              </p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                {post.media_type === 'video' ? (
                  <Video className="w-3 h-3" />
                ) : (
                  <Image className="w-3 h-3" />
                )}
                <span>Agendado para {format(currentScheduledDate, "dd/MM/yyyy HH:mm")}</span>
              </div>
            </div>
          </div>

          {/* Calendar */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Nova data</Label>
            <div className="flex justify-center">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={isDateDisabled}
                locale={ptBR}
                className="rounded-xl border border-border"
              />
            </div>
          </div>

          {/* Time Picker */}
          <div className="space-y-3">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Novo horário
            </Label>
            <div className="flex items-center gap-3">
              <Select value={selectedHour} onValueChange={setSelectedHour}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Hora" />
                </SelectTrigger>
                <SelectContent>
                  {hours.map((hour) => (
                    <SelectItem key={hour} value={hour}>
                      {hour}h
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-xl font-medium">:</span>
              <Select value={selectedMinute} onValueChange={setSelectedMinute}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Minuto" />
                </SelectTrigger>
                <SelectContent>
                  {minutes.map((minute) => (
                    <SelectItem key={minute} value={minute}>
                      {minute}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Preview */}
          {selectedDate && (
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl">
              <p className="text-sm text-muted-foreground mb-1">
                Nova data de publicação:
              </p>
              <p className="text-lg font-semibold text-primary">
                {format(
                  getScheduledDateTime() || new Date(),
                  "EEEE, d 'de' MMMM 'de' yyyy 'às' HH:mm",
                  { locale: ptBR }
                )}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              className="flex-1"
              onClick={handleSave}
              disabled={!isValidSchedule() || updateSchedule.isPending}
            >
              {updateSchedule.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
