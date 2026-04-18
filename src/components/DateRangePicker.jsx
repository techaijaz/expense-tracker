/* eslint-disable react/prop-types */
'use client';

import * as React from 'react';
import { addDays, format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
//import { DateRange } from 'react-day-picker';

import { cn } from '@/utils/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

export function DateRangePicker({ className, value, onChange }) {
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
                  {format(value.from, 'LLL dd, y')} -{' '}
                  {format(value.to, 'LLL dd, y')}
                </>
              ) : (
                format(value.from, 'LLL dd, y')
              )
            ) : (
              <span>Pick a date range</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto p-0 z-[100]"
          align="start"
          style={{
            backgroundColor: 'var(--bg3)',
            border: '1px solid var(--border)',
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
