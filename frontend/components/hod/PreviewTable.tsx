// components/hod/PreviewTable.tsx
"use client";

import { Card } from "./Card";
import { Table } from "./Table";

interface PreviewTableProps {
  metadata: {
    program?: string;
    branch?: string;
    semester?: number;
    year?: number;
    fromDate?: string;
    toDate?: string;
  };
  subjects: Array<{
    subject_code: string;
    short_code: string;
    subject_type: string;
    elective_group?: string;
    faculty_name?: string;
    year?: number;
    academic_year?: string;
    semester?: number;
  }>;
  faculty: Array<{
    name: string;
    subject_count: number;
  }>;
  students: Array<{
    name: string;
    hall_ticket?: string;
    mobile?: string;
    subject_count: number;
  }>;
  summary: {
    total_subjects: number;
    total_faculty: number;
    total_students: number;
  };
}

export function PreviewTable({ metadata, subjects, faculty, students, summary }: PreviewTableProps) {
  const subjectColumns = [
    { header: "Subject Code", accessor: "subject_code" },
    { 
      header: "Subject Name", 
      accessor: "subject_name",
      render: (value: string, row: any) => value || row.short_code || row.subject_code || "-"
    },
    { header: "Type", accessor: "subject_type" },
    { header: "Year", accessor: "year", render: (value: number) => value ? `Year ${value}` : "-" },
    { header: "Academic Year", accessor: "academic_year", render: (value: string) => value || "-" },
    { header: "Semester", accessor: "semester", render: (value: number) => value ? (value === 1 ? 'I' : value === 2 ? 'II' : value) : "-" },
    { header: "Elective Group", accessor: "elective_group", render: (value: string) => value || "-" },
    { header: "Faculty", accessor: "faculty_name", render: (value: string) => value || "-" },
  ];

  const facultyColumns = [
    { header: "Name", accessor: "name" },
    { header: "Subjects", accessor: "subject_count" },
  ];

  const studentColumns = [
    { header: "Hall Ticket", accessor: "hall_ticket", render: (value: string) => value || "-" },
    { header: "Name", accessor: "name" },
    { header: "Mobile", accessor: "mobile", render: (value: string) => value || "-" },
    { header: "Subjects", accessor: "subject_count" },
  ];

  return (
    <div className="space-y-6">
      {/* Metadata Card */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Metadata</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {metadata.program && (
            <div>
              <p className="text-xs text-gray-500">Program</p>
              <p className="text-sm font-medium text-gray-900">{metadata.program}</p>
            </div>
          )}
          {metadata.branch && (
            <div>
              <p className="text-xs text-gray-500">Branch</p>
              <p className="text-sm font-medium text-gray-900">{metadata.branch}</p>
            </div>
          )}
          {metadata.semester && (
            <div>
              <p className="text-xs text-gray-500">Semester</p>
              <p className="text-sm font-medium text-gray-900">{metadata.semester}</p>
            </div>
          )}
          {metadata.year && (
            <div>
              <p className="text-xs text-gray-500">Year</p>
              <p className="text-sm font-medium text-gray-900">{metadata.year}</p>
            </div>
          )}
          {metadata.fromDate && (
            <div>
              <p className="text-xs text-gray-500">From Date</p>
              <p className="text-sm font-medium text-gray-900">{metadata.fromDate}</p>
            </div>
          )}
          {metadata.toDate && (
            <div>
              <p className="text-xs text-gray-500">To Date</p>
              <p className="text-sm font-medium text-gray-900">{metadata.toDate}</p>
            </div>
          )}
        </div>
      </Card>

      {/* Summary Card */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Summary</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-indigo-600">{summary.total_subjects}</p>
            <p className="text-sm text-gray-500">Subjects</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-indigo-600">{summary.total_faculty}</p>
            <p className="text-sm text-gray-500">Faculty</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-indigo-600">{summary.total_students}</p>
            <p className="text-sm text-gray-500">Students</p>
          </div>
        </div>
      </Card>

      {/* Subjects Table */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Subjects ({subjects.length})
        </h3>
        <Table columns={subjectColumns} data={subjects} />
      </div>

      {/* Faculty Table */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Faculty ({faculty.length})
        </h3>
        <Table columns={facultyColumns} data={faculty} />
      </div>

      {/* Students Table (Limited to first 20 for preview) */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Students ({students.length})
          {students.length > 20 && (
            <span className="text-sm font-normal text-gray-500 ml-2">
              (Showing first 20)
            </span>
          )}
        </h3>
        <Table columns={studentColumns} data={students.slice(0, 20)} />
      </div>
    </div>
  );
}

