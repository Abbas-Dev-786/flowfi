"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Clock } from "lucide-react";

interface SchedulePickerProps {
  value: number; // interval in seconds
  onChange: (interval: number) => void;
  disabled?: boolean;
}

const SCHEDULE_OPTIONS = [
  { label: "Every Hour", value: 3600 },
  { label: "Daily", value: 86400 },
  { label: "Weekly", value: 604800 },
  { label: "Bi-Weekly", value: 1209600 },
  { label: "Monthly", value: 2592000 },
];

export function SchedulePicker({
  value,
  onChange,
  disabled,
}: SchedulePickerProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <Clock className="w-4 h-4" />
        Select execution frequency
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        {SCHEDULE_OPTIONS.map((option) => (
          <Button
            key={option.value}
            type="button"
            variant="outline"
            className={cn(
              "h-auto py-3 flex flex-col items-center gap-1",
              value === option.value &&
                "border-purple-500 bg-purple-50 text-purple-700 font-medium"
            )}
            onClick={() => onChange(option.value)}
            disabled={disabled}
          >
            <span className="text-sm">{option.label}</span>
            <span className="text-xs text-gray-500">
              {option.value / 86400 < 1
                ? `${option.value / 3600}h`
                : `${option.value / 86400}d`}
            </span>
          </Button>
        ))}
      </div>
    </div>
  );
}
