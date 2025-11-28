# Data Files for Civil Engineering 2nd Year

## Files

1. **civil-2yr-total-classes.json** - Total classes completed for each subject (as of now)
2. **civil-2yr-attendance-template.json** - Template for student attendance data
3. **civil-2yr-attendance.json** - Actual student attendance data (create this file)

## How to Use

1. Copy `civil-2yr-attendance-template.json` to `civil-2yr-attendance.json`
2. Add all student records with their attendance data in the format:
   ```json
   {
     "hall_ticket": "247Z1A0401",
     "name": "MAMIDI PAVAN",
     "mobile": "1234567890",
     "attendance": {
       "AC": 16,
       "NAS": 12,
       "DLD": 14,
       "SS": 17,
       "PTSP": 16,
       "AC-Lab": 12,
       "DLD-Lab": 12,
       "BS-Lab": 8,
       "Col": 4,
       "LIB/SCM": 1,
       "SPORTS": 6,
       "DAA": 3
     }
   }
   ```

3. Run the import script:
   ```bash
   npm run import:civil-attendance
   ```

## Subject Code Mapping

- AC → 22EC301PC (Analog Circuits)
- NAS → 22EC302PC (Network Analysis and Synthesis)
- DLD → 22EC303PC (Digital Logic Design)
- SS → 22EC304PC (Signals and Systems)
- PTSP → 22EC305PC (Probability Theory and Stochastic Processes)
- AC-Lab → 22EC306PC (Analog Circuits Laboratory)
- DLD-Lab → 22EC307PC (Digital Logic Design Laboratory)
- BS-Lab → 22EC308PC (Basic Skills Laboratory)
- Col → 22MC309C (Co-curricular)
- LIB/SCM → ECE21LIB (Library/Self-Study/Co-curricular Module)
- SPORTS → ECE21SPOF (Sports and Physical Education)
- DAA → ECE21DAA (Design and Analysis of Algorithms)

