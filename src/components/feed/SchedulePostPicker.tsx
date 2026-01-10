import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar as CalendarIcon, Clock, X } from "lucide-react";
import { format, addMinutes, setHours, setMinutes, isBefore, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";

interface SchedulePostPickerProps {
  scheduledDate: Date | null;
  onScheduleChange: (date: Date | null) => void;
  onClose: () => void;
}

export const SchedulePostPicker = ({
  scheduledDate,
  onScheduleChange,
  onClose,
}: SchedulePostPickerProps) => {
  const [isScheduled, setIsScheduled] = useState(!!scheduledDate);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    scheduledDate || undefined
  );
  const [selectedHour, setSelectedHour] = useState(
    scheduledDate ? format(scheduledDate, "HH") : "12"
  );
  const [selectedMinute, setSelectedMinute] = useState(
    scheduledDate ? format(scheduledDate, "mm") : "00"
  );

  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, "0"));
  const minutes = ["00", "15", "30", "45"];

  const handleConfirm = () => {
    if (isScheduled && selectedDate) {
      const scheduledDateTime = setMinutes(
        setHours(selectedDate, parseInt(selectedHour)),
        parseInt(selectedMinute)
      );
      
      // Validate that the date is in the future
      if (isBefore(scheduledDateTime, new Date())) {
        return; // Don't allow past dates
      }
      
      onScheduleChange(scheduledDateTime);
    } else {
      onScheduleChange(null);
    }
    onClose();
  };

  const handleToggleSchedule = (enabled: boolean) => {
    setIsScheduled(enabled);
    if (enabled && !selectedDate) {
      // Default to tomorrow at noon
      const tomorrow = addMinutes(startOfDay(new Date()), 24 * 60 + 12 * 60);
      setSelectedDate(tomorrow);
    }
  };

  const isDateDisabled = (date: Date) => {
    return isBefore(date, startOfDay(new Date()));
  };

  const getScheduledDateTime = () => {
    if (!selectedDate) return null;
    return setMinutes(
      setHours(selectedDate, parseInt(selectedHour)),
      parseInt(selectedMinute)
    );
  };

  const isValidSchedule = () => {
    if (!isScheduled) return true;
    const dateTime = getScheduledDateTime();
    return dateTime && !isBefore(dateTime, new Date());
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-5 h-5" />
        </Button>
        <h2 className="text-lg font-semibold">Agendar Post</h2>
        <Button 
          variant="ghost" 
          onClick={handleConfirm}
          disabled={!isValidSchedule()}
          className="text-primary font-semibold"
        >
          Confirmar
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Toggle Schedule */}
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <CalendarIcon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-medium">Agendar publicação</p>
              <p className="text-sm text-muted-foreground">
                Escolha quando o post será publicado
              </p>
            </div>
          </div>
          <Switch
            checked={isScheduled}
            onCheckedChange={handleToggleSchedule}
          />
        </div>

        {isScheduled && (
          <>
            {/* Calendar */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Data</Label>
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
                Horário
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
                  O post será publicado em:
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
          </>
        )}
      </div>
    </div>
  );
};
