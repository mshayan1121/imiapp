export type CurriculumLevel = 'qualification' | 'board' | 'subject' | 'topic' | 'subtopic' | 'course';

export interface CurriculumItem {
  id: string;
  name: string;
  created_at: string;
  level: CurriculumLevel;
  parentId?: string;
  children?: CurriculumItem[];
  has_course?: boolean;
}

export interface CurriculumTreeData {
  qualifications: CurriculumItem[];
  boards: CurriculumItem[];
  subjects: CurriculumItem[];
  topics: CurriculumItem[];
  subtopics: CurriculumItem[];
  courses: any[];
}
