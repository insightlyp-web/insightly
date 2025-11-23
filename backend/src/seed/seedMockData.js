// src/seed/seedMockData.js
import { query } from "../config/db.js";

async function seed() {
  try {
    console.log("Seeding mock data...");

    const hodId = "10000000-0000-0000-0000-000000000001";
    const facId = "10000000-0000-0000-0000-000000000002";
    const stu1 = "10000000-0000-0000-0000-000000000010";
    const stu2 = "10000000-0000-0000-0000-000000000011";

    await query(
      `INSERT INTO campus360_dev.profiles (id, full_name, email, role, department, phone)
       VALUES
       ($1,'Dr Ramesh','hod.cse@example.com','hod','CSE','9999000001'),
       ($2,'Prof Ravi','ravi.cse@example.com','faculty','CSE','9999000002'),
       ($3,'Student One','s1@example.com','student','CSE','9999000010'),
       ($4,'Student Two','s2@example.com','student','CSE','9999000011')
       ON CONFLICT (email) DO NOTHING`,
      [hodId, facId, stu1, stu2]
    );

    const courseRes = await query(
      `INSERT INTO campus360_dev.courses (code, name, department, year, faculty_id)
       VALUES ('CSE101', 'Intro to Programming', 'CSE', 1, $1)
       RETURNING id`,
      [facId]
    );
    const courseId = courseRes.rows[0].id;

    await query(
      `INSERT INTO campus360_dev.enrollments (student_id, course_id)
       VALUES ($1, $2), ($3, $2)
       ON CONFLICT DO NOTHING`,
      [stu1, courseId, stu2]
    );

    const sessionRes = await query(
      `INSERT INTO campus360_dev.attendance_sessions (faculty_id, course_id, session_code, start_time, end_time)
       VALUES ($1, $2, 'S1CODE', now() - interval '1 day', now() + interval '1 day')
       RETURNING id`,
      [facId, courseId]
    );
    const sessionId = sessionRes.rows[0].id;

    await query(
      `INSERT INTO campus360_dev.attendance_records (session_id, student_id)
       VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [sessionId, stu1]
    );

    const postRes = await query(
      `INSERT INTO campus360_dev.placement_posts (created_by, title, company_name, job_type, package, required_skills, deadline, description)
       VALUES ($1,'Intern - Frontend','Acme Corp','internship','10 LPA', ARRAY['React','HTML'], now() + interval '30 days', 'Looking for interns')
       RETURNING id`,
      [facId]
    );
    const postId = postRes.rows[0].id;

    await query(
      `INSERT INTO campus360_dev.placement_applications (post_id, student_id, resume_url, status, applied_at)
       VALUES ($1, $2, 'https://example.com/resume1.pdf', 'shortlisted', now()),
              ($1, $3, 'https://example.com/resume2.pdf', 'applied', now())
       ON CONFLICT DO NOTHING`,
      [postId, stu1, stu2]
    );

    console.log("Seed complete.");
    process.exit(0);
  } catch (err) {
    console.error("Seed error", err);
    process.exit(1);
  }
}

seed();
