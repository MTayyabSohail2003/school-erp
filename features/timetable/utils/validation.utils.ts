import { type TimetableEntry } from '../schemas/timetable.schema';

export const timetableValidation = {
    /**
     * Checks if assigning a teacher to a specific period and day causes a conflict.
     * Conflict rule: A teacher cannot be assigned to two classes at the same time.
     */
    hasTeacherConflict: (newEntry: TimetableEntry, existingTimetable: TimetableEntry[]): boolean => {
        return existingTimetable.some(entry =>
            // Skip checking against itself if updating an existing record
            entry.id !== newEntry.id &&
            entry.teacher_id === newEntry.teacher_id &&
            entry.period_id === newEntry.period_id &&
            entry.day_of_week === newEntry.day_of_week &&
            entry.academic_year === newEntry.academic_year
        );
    },

    /**
     * Checks if assigning a period to a class causes a conflict.
     * Conflict rule: A class cannot have two teachers/subjects in the same period.
     */
    hasClassConflict: (newEntry: TimetableEntry, existingTimetable: TimetableEntry[]): boolean => {
        return existingTimetable.some(entry =>
            entry.id !== newEntry.id &&
            entry.class_id === newEntry.class_id &&
            entry.period_id === newEntry.period_id &&
            entry.day_of_week === newEntry.day_of_week &&
            entry.academic_year === newEntry.academic_year
        );
    }
};
