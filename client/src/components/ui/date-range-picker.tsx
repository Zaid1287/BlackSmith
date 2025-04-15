import * as React from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface DateRangePickerProps {
  date: DateRange | undefined;
  onChange: (date: DateRange | undefined) => void;
  disabled?: boolean;
  className?: string;
}

export function DateRangePicker({
  date,
  onChange,
  disabled = false,
  className,
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  // Helper functions for quick date ranges
  const selectLastWeek = () => {
    const today = new Date();
    const lastWeek = new Date(today);
    lastWeek.setDate(today.getDate() - 7);
    onChange({ from: lastWeek, to: today });
    setIsOpen(false);
  };

  const selectLastMonth = () => {
    const today = new Date();
    const lastMonth = new Date(today);
    lastMonth.setMonth(today.getMonth() - 1);
    onChange({ from: lastMonth, to: today });
    setIsOpen(false);
  };

  const selectLastThreeMonths = () => {
    const today = new Date();
    const threeMonthsAgo = new Date(today);
    threeMonthsAgo.setMonth(today.getMonth() - 3);
    onChange({ from: threeMonthsAgo, to: today });
    setIsOpen(false);
  };

  const clearDates = () => {
    onChange(undefined);
    setIsOpen(false);
  };

  // Function to format the display of selected date range
  const formatSelectedRange = () => {
    if (date?.from && date?.to) {
      return `${format(date.from, "MMM d, yyyy")} - ${format(date.to, "MMM d, yyyy")}`;
    }
    return "Select date range";
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          id="date-range"
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {formatSelectedRange()}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-3 border-b">
          <div className="grid grid-cols-2 gap-2 mb-2">
            <Button
              size="sm"
              variant="outline"
              className="text-xs"
              onClick={selectLastWeek}
            >
              Last 7 days
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-xs"
              onClick={selectLastMonth}
            >
              Last month
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-xs"
              onClick={selectLastThreeMonths}
            >
              Last 3 months
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-xs"
              onClick={clearDates}
            >
              Clear
            </Button>
          </div>
        </div>
        <Calendar
          mode="range"
          selected={date}
          onSelect={onChange as any}
          numberOfMonths={2}
          defaultMonth={date?.from}
        />
      </PopoverContent>
    </Popover>
  );
}