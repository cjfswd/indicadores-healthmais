import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DatePickerFieldProps {
  label?: string;
  value?: string;
  onChange: (date: string | undefined) => void;
  placeholder?: string;
}

export function DatePickerField({ label, value, onChange, placeholder = "Selecione a data" }: DatePickerFieldProps) {
  return (
    <div className="space-y-2 flex flex-col w-full">
      {label && <Label>{label}</Label>}
      <Popover>
        <PopoverTrigger render={
          <Button
            variant={"outline"}
            className={cn(
              "w-full justify-start text-left font-normal",
              !value && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value ? format(new Date(value + "T00:00:00"), "dd/MM/yyyy") : <span>{placeholder}</span>}
          </Button>
        } />
        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="single"
            selected={value ? new Date(value + "T00:00:00") : undefined}
            onSelect={(date) => {
              if (date) {
                onChange(date.toISOString().split('T')[0]);
              } else {
                onChange(undefined);
              }
            }}
            initialFocus
            locale={ptBR}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
