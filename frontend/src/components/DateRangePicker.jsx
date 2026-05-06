/* eslint-disable react/prop-types */
'use client';

import * as React from 'react';
import { CalendarIcon } from 'lucide-react';
//import { DateRange } from 'react-day-picker';

import { cn } from '@/utils/utils';
import useFormat from '@/hooks/useFormat';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

export function DateRangePicker({ className, value, onChange }) {
  const { formatDate } = useFormat();
  return (
    <div className={cn('grid gap-2', className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={'outline'}
            className={cn(
              'w-full h-[40px] justify-start text-left font-normal px-3 rounded-[var(--r2)] border-none text-[var(--text)] hover:bg-surface-container-high transition-colors',
              !value && 'text-[var(--text3)]',
            )}
            style={{
              backgroundColor: 'var(--bg4)',
              color: !value?.from ? 'var(--text3)' : 'var(--text)',
            }}
          >
            <span
              className="material-symbols-outlined mr-2 text-lg"
              style={{ fontSize: '16px' }}
            >
              event
            </span>
            {value?.from ? (
              value.to ? (
                <>
                  {formatDate(value.from)} -{' '}
                  {formatDate(value.to)}
                </>
              ) : (
                formatDate(value.from)
              )
            ) : (
              <span>Pick a date range</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto p-0 z-[100] bg-[var(--bg2)] border-[var(--border)]"
          align="start"
          style={{
            zIndex: 9999,
          }}
        >
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={value?.from}
            selected={value}
            onSelect={onChange}
            numberOfMonths={1}
            style={{ color: 'var(--text)' }}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
