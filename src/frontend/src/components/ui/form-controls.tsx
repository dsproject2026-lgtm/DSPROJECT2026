import { useMemo, useState } from 'react';
import { Calendar, DateField, DatePicker, Label, ListBox, Select } from '@heroui/react';
import { parseDateTime, type DateValue } from '@internationalized/date';

type UiOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

interface UiSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: UiOption[];
  placeholder?: string;
  label?: string;
  isDisabled?: boolean;
  ariaLabel?: string;
  className?: string;
  isSearchable?: boolean;
  searchPlaceholder?: string;
}

function normalizeDateValue(value: string) {
  if (!value.trim()) return null;

  const withSeconds = value.length === 16 ? `${value}:00` : value;
  try {
    return parseDateTime(withSeconds);
  } catch {
    return null;
  }
}

function dateValueToLocalInput(value: DateValue | null) {
  if (!value) return '';

  const normalized = value
    .toString()
    .split('[')[0]
    .replace(/Z$/, '')
    .replace(/([+-]\d{2}:\d{2})$/, '');

  return normalized.slice(0, 16);
}

interface UiDateTimePickerProps {
  value: string;
  onChange: (value: string) => void;
  isDisabled?: boolean;
  ariaLabel?: string;
}

export function UiSelect({
  value,
  onChange,
  options,
  placeholder = 'Selecione',
  label,
  isDisabled,
  ariaLabel,
  className,
  isSearchable = true,
  searchPlaceholder = 'Pesquisar...',
}: UiSelectProps) {
  const [search, setSearch] = useState('');

  const filteredOptions = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return options;
    return options.filter((option) => option.label.toLowerCase().includes(query));
  }, [options, search]);

  return (
    <Select
      selectedKey={value || null}
      onSelectionChange={(key) => onChange(typeof key === 'string' ? key : key ? String(key) : '')}
      isDisabled={isDisabled}
      placeholder={placeholder}
      aria-label={ariaLabel}
      fullWidth
      className={className ?? 'w-full'}
    >
      {label ? <Label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-[#64748b]">{label}</Label> : null}
      <Select.Trigger className="min-h-11 rounded-sm border border-[#d1d5db] bg-white px-3 text-sm text-[#475569] !shadow-none ring-0">
        <Select.Value />
        <Select.Indicator />
      </Select.Trigger>
      <Select.Popover className="border border-[#d1d5db] !shadow-none">
        {isSearchable ? (
          <div className="border-b border-[#e5e7eb] p-2">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={searchPlaceholder}
              className="h-9 w-full rounded-md border border-[#d1d9e6] bg-white px-3 text-sm text-[#475569] outline-none focus:border-[#0b73c9]"
            />
          </div>
        ) : null}
        <ListBox>
          {filteredOptions.length === 0 ? (
            <ListBox.Item id="__no-results__" textValue="Sem resultados" isDisabled>
              Sem resultados
            </ListBox.Item>
          ) : (
            filteredOptions.map((option) => (
              <ListBox.Item key={option.value} id={option.value} textValue={option.label} isDisabled={option.disabled}>
                {option.label}
                <ListBox.ItemIndicator />
              </ListBox.Item>
            ))
          )}
        </ListBox>
      </Select.Popover>
    </Select>
  );
}

export function UiDateTimePicker({
  value,
  onChange,
  isDisabled,
  ariaLabel,
}: UiDateTimePickerProps) {
  return (
    <DatePicker
      value={normalizeDateValue(value)}
      onChange={(next) => onChange(dateValueToLocalInput(next))}
      granularity="minute"
      hourCycle={24}
      isDisabled={isDisabled}
      aria-label={ariaLabel}
      className="w-full"
    >
      <DateField.Group fullWidth className="w-full rounded-sm border border-[#d1d5db] bg-white !shadow-none ring-0">
        <DateField.Input>
          {(segment) => <DateField.Segment segment={segment} />}
        </DateField.Input>
        <DateField.Suffix>
          <DatePicker.Trigger className="!shadow-none ring-0">
            <DatePicker.TriggerIndicator />
          </DatePicker.Trigger>
        </DateField.Suffix>
      </DateField.Group>

      <DatePicker.Popover className="border border-[#d1d5db] !shadow-none">
        <Calendar aria-label={ariaLabel ?? 'Selecionar data'}>
          <Calendar.Header>
            <Calendar.YearPickerTrigger>
              <Calendar.YearPickerTriggerHeading />
              <Calendar.YearPickerTriggerIndicator />
            </Calendar.YearPickerTrigger>
            <Calendar.NavButton slot="previous" />
            <Calendar.NavButton slot="next" />
          </Calendar.Header>
          <Calendar.Grid>
            <Calendar.GridHeader>
              {(day) => <Calendar.HeaderCell>{day}</Calendar.HeaderCell>}
            </Calendar.GridHeader>
            <Calendar.GridBody>
              {(date) => <Calendar.Cell date={date} />}
            </Calendar.GridBody>
          </Calendar.Grid>
          <Calendar.YearPickerGrid>
            <Calendar.YearPickerGridBody>
              {({ year }) => <Calendar.YearPickerCell year={year} />}
            </Calendar.YearPickerGridBody>
          </Calendar.YearPickerGrid>
        </Calendar>
      </DatePicker.Popover>
    </DatePicker>
  );
}
