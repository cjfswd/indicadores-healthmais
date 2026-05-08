import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function InputField({ label, value, onChange, error, placeholder, type = "text", accept, maxLength }: any) {
  return (
    <div className="space-y-2 flex flex-col w-full">
      <div className="flex justify-between items-center">
        <Label>{label}</Label>
        {maxLength && type !== 'file' && <span className="text-[10px] text-muted-foreground">{String(value || '').length}/{maxLength}</span>}
      </div>
      <Input 
        type={type}
        accept={accept}
        maxLength={maxLength}
        value={type === 'file' ? undefined : (value || '')} 
        onChange={e => onChange(type === 'number' ? Number(e.target.value) : (type === 'file' ? e.target.files?.[0] : e.target.value))} 
        placeholder={placeholder} 
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

export function TextareaField({ label, value, onChange, error, placeholder, maxLength }: any) {
  return (
    <div className="space-y-2 flex flex-col w-full">
      <div className="flex justify-between items-center">
        <Label>{label}</Label>
        {maxLength && <span className="text-[10px] text-muted-foreground">{String(value || '').length}/{maxLength}</span>}
      </div>
      <textarea 
        className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        value={value || ''} 
        onChange={e => onChange(e.target.value)} 
        placeholder={placeholder}
        maxLength={maxLength} 
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

export function SelectField({ label, value, onChange, error, options, placeholder = "Selecione" }: any) {
  const selectedOption = options?.find((op: any) => {
    const val = typeof op === 'object' && op !== null && 'value' in op ? op.value : op;
    return String(val) === String(value);
  });
  const selectedLabel = selectedOption 
    ? (typeof selectedOption === 'object' && selectedOption !== null && 'label' in selectedOption ? selectedOption.label : selectedOption)
    : undefined;

  return (
    <div className="space-y-2 flex flex-col w-full">
      <Label>{label}</Label>
      <Select value={value || ''} onValueChange={onChange}>
        <SelectTrigger><SelectValue placeholder={placeholder}>{selectedLabel}</SelectValue></SelectTrigger>
        <SelectContent>
          {options?.map((op: any) => {
            const val = typeof op === 'object' && op !== null && 'value' in op ? op.value : op;
            const lbl = typeof op === 'object' && op !== null && 'label' in op ? op.label : op;
            return <SelectItem key={String(val)} value={String(val)}>{lbl}</SelectItem>;
          })}
        </SelectContent>
      </Select>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
