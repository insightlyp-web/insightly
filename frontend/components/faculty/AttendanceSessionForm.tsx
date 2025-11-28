// components/faculty/AttendanceSessionForm.tsx
"use client";

import { useState, useEffect } from "react";
import { Card } from "./Card";

interface Course {
  id: string;
  code: string;
  name: string;
  year?: number;
  academic_year?: string;
}

interface AttendanceSessionFormProps {
  courses: Course[];
  onSubmit: (data: { 
    course_id: string; 
    start_time: string; 
    end_time: string;
    location_required: boolean;
    faculty_lat?: number;
    faculty_lng?: number;
    allowed_radius?: number;
  }) => Promise<void>;
  loading?: boolean;
}

export function AttendanceSessionForm({ courses, onSubmit, loading }: AttendanceSessionFormProps) {
  // Helper to get current time in HH:MM format
  const getCurrentTime = () => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  // Helper to get time 1 hour from now
  const getOneHourLater = () => {
    const now = new Date();
    now.setHours(now.getHours() + 1);
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  // Helper to combine today's date with a time string
  const combineDateAndTime = (time: string): string => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}T${time}`;
  };

  const [formData, setFormData] = useState({
    course_id: "",
    start_time: getCurrentTime(),
    end_time: getOneHourLater(),
    location_required: false,
    allowed_radius: 50,
  });
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [error, setError] = useState("");
  const [locationError, setLocationError] = useState("");
  const [locationLoading, setLocationLoading] = useState(false);
  const [facultyLocation, setFacultyLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Validate end time is after start time
  useEffect(() => {
    if (formData.start_time && formData.end_time) {
      const [startHours, startMinutes] = formData.start_time.split(':').map(Number);
      const [endHours, endMinutes] = formData.end_time.split(':').map(Number);
      const startTotal = startHours * 60 + startMinutes;
      const endTotal = endHours * 60 + endMinutes;
      
      if (endTotal <= startTotal) {
        setError("End time must be after start time");
      } else {
        setError("");
      }
    }
  }, [formData.start_time, formData.end_time]);

  const handleStartNow = () => {
    const now = getCurrentTime();
    const oneHourLater = getOneHourLater();
    setFormData({
      ...formData,
      start_time: now,
      end_time: oneHourLater,
    });
    setError("");
  };

  const handleLocationToggle = async (enabled: boolean) => {
    // If disabling, do it immediately
    if (!enabled) {
      setFormData((prev) => ({ ...prev, location_required: false }));
      setFacultyLocation(null);
      setLocationError("");
      setLocationLoading(false);
      return;
    }

    // If enabling, update state immediately for responsive UI
    setFormData((prev) => ({ ...prev, location_required: true }));
    setLocationError("");

    // Fetch faculty location when enabled
    setLocationLoading(true);
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        });
      });

      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      setFacultyLocation({ lat, lng });
      setLocationError("");
    } catch (err: any) {
      console.error("Location error:", err);
      setLocationError("Failed to get location. Please enable location permissions.");
      // Revert the toggle if location fetch fails
      setFormData((prev) => ({ ...prev, location_required: false }));
      setFacultyLocation(null);
    } finally {
      setLocationLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.course_id || !formData.start_time || !formData.end_time) {
      setError("Please fill in all fields");
      return;
    }
    
    if (error) {
      return;
    }

    // Validate time
    const [startHours, startMinutes] = formData.start_time.split(':').map(Number);
    const [endHours, endMinutes] = formData.end_time.split(':').map(Number);
    const startTotal = startHours * 60 + startMinutes;
    const endTotal = endHours * 60 + endMinutes;
    
    if (endTotal <= startTotal) {
      setError("End time must be after start time");
      return;
    }

    // Validate location if required
    if (formData.location_required && !facultyLocation) {
      setLocationError("Please enable location access to use location verification");
      return;
    }

    setError("");
    setLocationError("");

    // Combine today's date with the selected times
    const startDateTime = combineDateAndTime(formData.start_time);
    const endDateTime = combineDateAndTime(formData.end_time);

    const submitData: any = {
      course_id: formData.course_id,
      start_time: startDateTime,
      end_time: endDateTime,
      location_required: formData.location_required,
    };

    if (formData.location_required && facultyLocation) {
      submitData.faculty_lat = facultyLocation.lat;
      submitData.faculty_lng = facultyLocation.lng;
      submitData.allowed_radius = formData.allowed_radius;
    }

    await onSubmit(submitData);
  };

  return (
    <Card>
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Create Attendance Session</h2>
        <p className="text-sm text-gray-500 mt-1">
          Students will scan the QR code to mark their attendance during the session time window.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Course <span className="text-red-500">*</span>
          </label>
          <select
            required
            value={formData.course_id}
            onChange={(e) => {
              const selected = courses.find(c => c.id === e.target.value);
              setSelectedCourse(selected || null);
              setFormData({ ...formData, course_id: e.target.value });
              setError("");
            }}
            className="block w-full rounded-md border-gray-200 bg-gray-50 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
            disabled={loading}
          >
            <option value="">Select a course...</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.code} - {course.name}
              </option>
            ))}
          </select>
          {selectedCourse && (selectedCourse.year || selectedCourse.academic_year) && (
            <div className="mt-2 text-sm text-gray-600">
              <span className="font-medium">Year:</span>{" "}
              {selectedCourse.year ? `Year ${selectedCourse.year}` : ""}
              {selectedCourse.year && selectedCourse.academic_year ? " • " : ""}
              {selectedCourse.academic_year ? `Academic Year: ${selectedCourse.academic_year}` : ""}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700">
                Start Time <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={handleStartNow}
                disabled={loading}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                Start Now
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 font-medium">
                {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}
              </span>
              <input
                type="time"
                required
                value={formData.start_time}
                onChange={(e) => {
                  setFormData({ ...formData, start_time: e.target.value });
                  setError("");
                }}
                className="block flex-1 rounded-md border-gray-200 bg-gray-50 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                disabled={loading}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">When students can start marking attendance</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Time <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 font-medium">
                {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}
              </span>
              <input
                type="time"
                required
                value={formData.end_time}
                onChange={(e) => {
                  setFormData({ ...formData, end_time: e.target.value });
                  setError("");
                }}
                className="block flex-1 rounded-md border-gray-200 bg-gray-50 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                disabled={loading}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">When attendance marking closes</p>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Require Location Verification
              </label>
              <p className="text-xs text-gray-500">
                When enabled, students must be within the specified radius to mark attendance
              </p>
            </div>
            <label
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                formData.location_required ? "bg-blue-600" : "bg-gray-200"
              } ${loading || (locationLoading && formData.location_required) ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <input
                type="checkbox"
                checked={formData.location_required}
                onChange={(e) => {
                  handleLocationToggle(e.target.checked);
                }}
                disabled={loading || (locationLoading && formData.location_required)}
                className="sr-only"
              />
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  formData.location_required ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </label>
          </div>

          {formData.location_required && (
            <div className="space-y-3 bg-gray-50 rounded-md p-4 border border-gray-200">
              {locationLoading && (
                <div className="text-sm text-blue-600">Getting your location...</div>
              )}
              
              {locationError && (
                <div className="rounded-md bg-red-50 p-3 border border-red-200">
                  <p className="text-sm text-red-800">{locationError}</p>
                </div>
              )}

              {facultyLocation && !locationError && (
                <div className="rounded-md bg-green-50 p-3 border border-green-200">
                  <p className="text-sm text-green-800">
                    ✓ Location captured: {facultyLocation.lat.toFixed(6)}, {facultyLocation.lng.toFixed(6)}
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Allowed Radius (meters) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="10"
                  max="1000"
                  step="10"
                  value={formData.allowed_radius}
                  onChange={(e) => {
                    const radius = parseInt(e.target.value) || 50;
                    setFormData({ ...formData, allowed_radius: radius });
                  }}
                  className="block w-full rounded-md border-gray-200 bg-white px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                  disabled={loading}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Students must be within this distance (in meters) to mark attendance
                </p>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-3 border border-red-200">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> After creating the session, a QR code will be generated. 
            Display it to students so they can scan and mark their attendance.
            {formData.location_required && " Location verification is enabled for this session."}
          </p>
        </div>

        <div className="flex space-x-3">
          <button
            type="submit"
            disabled={loading || !!error}
            className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Creating Session..." : "Create Session"}
          </button>
        </div>
      </form>
    </Card>
  );
}

