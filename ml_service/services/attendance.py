"""
Attendance Anomaly Detection Service
Detects anomalies in student attendance patterns
"""
from typing import List, Dict, Any
from datetime import datetime
import numpy as np
from collections import Counter


class AttendanceAnomalyDetector:
    def __init__(self):
        pass
    
    def detect_anomalies(self, records: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Detect anomalies in attendance records
        
        Args:
            records: List of attendance records with date and status (1=present, 0=absent)
            
        Returns:
            Dictionary with pattern, anomaly_days, and confidence
        """
        if not records:
            return {
                "pattern": "insufficient_data",
                "anomaly_days": [],
                "confidence": 0.0
            }
        
        # Parse dates and extract attendance status
        dates = []
        statuses = []
        
        for record in records:
            try:
                date_str = record.get("date", "")
                status = int(record.get("status", 0))
                dates.append(date_str)
                statuses.append(status)
            except (ValueError, KeyError):
                continue
        
        if not statuses:
            return {
                "pattern": "insufficient_data",
                "anomaly_days": [],
                "confidence": 0.0
            }
        
        # Calculate overall attendance percentage
        attendance_rate = sum(statuses) / len(statuses) if statuses else 0
        
        # Calculate moving average (window of 5)
        window_size = min(5, len(statuses))
        moving_averages = []
        anomaly_days = []
        
        for i in range(len(statuses)):
            start_idx = max(0, i - window_size + 1)
            window = statuses[start_idx:i+1]
            avg = sum(window) / len(window)
            moving_averages.append(avg)
            
            # Detect anomaly: if current status is 0 but recent average is high
            if i >= window_size - 1:
                if statuses[i] == 0 and avg > 0.7:
                    anomaly_days.append(dates[i])
        
        # Calculate z-scores for more sophisticated detection
        if len(statuses) > 5:
            mean_attendance = np.mean(statuses)
            std_attendance = np.std(statuses) if np.std(statuses) > 0 else 1
            
            for i, (date, status) in enumerate(zip(dates, statuses)):
                if i >= window_size - 1:
                    z_score = abs((status - mean_attendance) / std_attendance)
                    # If absent and z-score indicates anomaly
                    if status == 0 and z_score > 1.5 and date not in anomaly_days:
                        anomaly_days.append(date)
        
        # Determine pattern
        if attendance_rate >= 0.85:
            pattern = "regular"
            confidence = 0.9
        elif attendance_rate >= 0.70:
            pattern = "mostly_regular"
            confidence = 0.7
        elif attendance_rate >= 0.50:
            pattern = "inconsistent"
            confidence = 0.8
        else:
            pattern = "at-risk"
            confidence = 0.9
        
        # If many anomalies detected, mark as at-risk
        anomaly_ratio = len(anomaly_days) / len(dates) if dates else 0
        if anomaly_ratio > 0.2:
            pattern = "at-risk"
            confidence = 0.85
        
        return {
            "pattern": pattern,
            "anomaly_days": anomaly_days[:10],  # Limit to top 10
            "confidence": round(confidence, 2),
            "attendance_rate": round(attendance_rate * 100, 2),
            "total_days": len(dates),
            "present_days": sum(statuses),
            "absent_days": len(statuses) - sum(statuses)
        }

