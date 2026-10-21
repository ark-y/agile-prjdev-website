import { describe, it, expect } from 'vitest';
import { formatDayMonth, projectDateRange, formatProjectDates } from '../../src/utils/projectDates';
describe('project date calculations', () => {
 it('handles empty sprints', () => { expect(projectDateRange([])).toEqual({start:null,end:null}); expect(formatProjectDates({start:null,end:null})).toBe('No dates set'); });
 it('finds earliest start and latest end regardless of order', () => {
  expect(projectDateRange([{sprint_start_date:'2026-10-10',sprint_end_date:'2026-10-20'},{sprint_start_date:'2026-09-01',sprint_end_date:'2026-11-02'}])).toEqual({start:'2026-09-01',end:'2026-11-02'});
 });
 it('formats dates and missing dates', () => {expect(formatDayMonth('2026-10-20')).toBe('20/10');expect(formatDayMonth(null)).toBe('--/--');expect(formatProjectDates({start:'2026-10-01',end:'2026-10-20'})).toBe('01/10 – 20/10');});
});
