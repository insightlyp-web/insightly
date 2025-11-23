// app/faculty/marks/assessments/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card } from "@/components/faculty/Card";
import { Table } from "@/components/faculty/Table";
import apiClient from "@/lib/axios";

interface Student {
  id: string;
  full_name: string;
  email: string;
  marks_obtained?: number | string;
}

interface Assessment {
  id: string;
  title: string;
  type: string;
  course_code: string;
  course_name: string;
  max_marks: number;
  weightage: number;
  due_date: string;
}

export default function AssessmentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const assessmentId = params.id as string;
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [marks, setMarks] = useState<{ [key: string]: number }>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (assessmentId) {
      fetchData();
    }
  }, [assessmentId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [assessmentRes, marksRes] = await Promise.all([
        apiClient.get(`/faculty/marks/assessments`).then(res => {
          const assessment = res.data.assessments?.find((a: Assessment) => a.id === assessmentId);
          return { data: { assessment } };
        }),
        apiClient.get(`/faculty/marks/assessments/${assessmentId}/marks`).catch(() => ({ 
          data: { students: [], marks: [] } 
        })),
      ]);

      setAssessment(assessmentRes.data.assessment || null);
      
      // Set students and existing marks
      const studentsList = marksRes.data.students || [];
      setStudents(studentsList);
      
      const marksData = marksRes.data.marks || [];
      const marksMap: { [key: string]: number } = {};
      marksData.forEach((m: any) => {
        if (m.marks_obtained !== null && m.marks_obtained !== undefined) {
          marksMap[m.student_id] = parseFloat(m.marks_obtained) || 0;
        }
      });
      setMarks(marksMap);
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to fetch data",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMarkChange = (studentId: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setMarks({ ...marks, [studentId]: numValue });
  };

  const handleSaveMarks = async () => {
    try {
      setSaving(true);
      setMessage(null);

      const marksArray = Object.entries(marks).map(([student_id, marks_obtained]) => ({
        student_id,
        marks_obtained,
      }));

      await apiClient.post(`/faculty/marks/assessments/${assessmentId}/marks`, {
        marks: marksArray,
      });

      setMessage({
        type: "success",
        text: "Marks saved successfully!",
      });
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to save marks",
      });
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    { header: "Student Name", accessor: "full_name" },
    { header: "Email", accessor: "email" },
    {
      header: "Marks Obtained",
      accessor: "id",
      render: (value: string) => (
        <input
          type="number"
          min="0"
          max={assessment?.max_marks || 100}
          step="0.01"
          value={marks[value] || ""}
          onChange={(e) => handleMarkChange(value, e.target.value)}
          className="w-24 rounded-md border-gray-200 bg-gray-50 px-2 py-1 text-sm focus:border-blue-500 focus:ring-blue-500"
          placeholder="0"
        />
      ),
    },
    {
      header: "Max Marks",
      accessor: "max_marks",
      render: () => assessment?.max_marks || 100,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <button
          onClick={() => router.back()}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium mb-2"
        >
          ← Back to Assessments
        </button>
        <h1 className="text-2xl font-bold text-gray-900">
          {assessment ? assessment.title : "Assessment Details"}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Add or update marks for students
        </p>
      </div>

      {message && (
        <div
          className={`rounded-md p-4 ${
            message.type === "success"
              ? "bg-green-50 text-green-800"
              : "bg-red-50 text-red-800"
          }`}
        >
          {message.text}
        </div>
      )}

      {assessment && (
        <Card>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Course</p>
              <p className="text-sm font-semibold text-gray-900">
                {assessment.course_code} - {assessment.course_name}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Type</p>
              <p className="text-sm font-semibold text-gray-900">
                {assessment.type.replace('_', ' ').toUpperCase()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Max Marks</p>
              <p className="text-sm font-semibold text-gray-900">{assessment.max_marks}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Weightage</p>
              <p className="text-sm font-semibold text-gray-900">{assessment.weightage}%</p>
            </div>
          </div>
        </Card>
      )}

      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Student Marks ({students.length})
          </h2>
          <button
            onClick={handleSaveMarks}
            disabled={saving}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save All Marks"}
          </button>
        </div>
        <Table columns={columns} data={students} loading={loading} />
      </div>
    </div>
  );
}

