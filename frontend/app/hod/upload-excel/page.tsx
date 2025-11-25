// app/hod/upload-excel/page.tsx
"use client";

import { useState } from "react";
import { UploadCard } from "@/components/hod/UploadCard";
import { PreviewTable } from "@/components/hod/PreviewTable";
import { Card } from "@/components/hod/Card";
import apiClient from "@/lib/axios";

interface PreviewData {
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

export default function UploadExcelPage() {
  const [uploading, setUploading] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [fullData, setFullData] = useState<any>(null);
  const [confirming, setConfirming] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [confirmResult, setConfirmResult] = useState<any>(null);

  const handleUpload = async (file: File) => {
    try {
      setUploading(true);
      setMessage(null);
      setPreviewData(null);
      setFullData(null);
      setConfirmResult(null);

      const formData = new FormData();
      formData.append("file", file);

      const response = await apiClient.post("/hod/upload-excel", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data.success && response.data.preview) {
        setPreviewData(response.data.preview);
        setFullData(response.data.full_data);
        setMessage({
          type: "success",
          text: "Excel file parsed successfully! Please review the data below and click Confirm to save.",
        });
      } else {
        setMessage({
          type: "error",
          text: response.data.message || "Failed to parse Excel file",
        });
      }
    } catch (error: any) {
      console.error("Upload error:", error);
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to upload Excel file",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleConfirm = async () => {
    if (!fullData) {
      setMessage({
        type: "error",
        text: "No data to confirm. Please upload a file first.",
      });
      return;
    }

    try {
      setConfirming(true);
      setMessage(null);
      setConfirmResult(null);

      const response = await apiClient.post("/hod/confirm-upload", {
        full_data: fullData,
      });

      setConfirmResult(response.data);
      setMessage({
        type: "success",
        text: "Data saved successfully!",
      });

      // Clear preview after successful save
      setTimeout(() => {
        setPreviewData(null);
        setFullData(null);
        setConfirmResult(null);
      }, 5000);
    } catch (error: any) {
      console.error("Confirm error:", error);
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to save data",
      });
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Upload Excel Attendance</h1>
        <p className="mt-1 text-sm text-gray-500">
          Upload Excel file to import students, faculty, courses, and attendance data
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

      {!previewData && (
        <UploadCard
          title="Upload Excel File"
          description="Upload an Excel file (.xlsx or .xls) containing attendance data. The file should include metadata (Program, Branch, Year, Semester), subjects, faculty, and student attendance records."
          onUpload={handleUpload}
          loading={uploading}
        />
      )}

      {previewData && (
        <>
          <PreviewTable
            metadata={previewData.metadata}
            subjects={previewData.subjects}
            faculty={previewData.faculty}
            students={previewData.students}
            summary={previewData.summary}
          />

          {confirmResult && (
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Save Results</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Students Added</p>
                  <p className="text-2xl font-bold text-green-600">{confirmResult.students_added}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Students Updated</p>
                  <p className="text-2xl font-bold text-blue-600">{confirmResult.students_updated}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Faculty Added</p>
                  <p className="text-2xl font-bold text-green-600">{confirmResult.faculty_added}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Courses Added</p>
                  <p className="text-2xl font-bold text-green-600">{confirmResult.courses_added}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Attendance Records</p>
                  <p className="text-2xl font-bold text-indigo-600">{confirmResult.attendance_records_added}</p>
                </div>
              </div>
            </Card>
          )}

          {!confirmResult && (
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Ready to Save</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Review the data above and click Confirm to save to database
                  </p>
                </div>
                <button
                  onClick={handleConfirm}
                  disabled={confirming}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {confirming ? "Saving..." : "Confirm & Save"}
                </button>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

