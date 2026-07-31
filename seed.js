const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  // 1. Get or Create Department
  let { data: dept } = await supabase.from('departments').select('id').eq('name', 'Mechanical Engineering').single();
  if (!dept) {
    const { data: newDept } = await supabase.from('departments').insert([{ name: 'Mechanical Engineering' }]).select('id').single();
    dept = newDept;
    console.log('Created Mechanical Engineering dept', dept.id);
  } else {
    console.log('Found Mechanical Engineering dept', dept.id);
  }

  // 2. Parse CSV
  const csvContent = fs.readFileSync('mechanical_engineering_syllabus.csv', 'utf8');
  const lines = csvContent.split('\n').map(l => l.trim()).filter(l => l);
  const rows = lines.slice(1);

  for (const row of rows) {
    const cols = row.split(',');
    const semesterNameRaw = cols[0];
    const subjectCode = cols[3];
    const subjectName = cols[4];

    if (!semesterNameRaw || !subjectName) continue;
    
    // 3. Get or Create Semester
    let { data: sem } = await supabase.from('semesters').select('id').eq('name', semesterNameRaw).eq('department_id', dept.id).single();
    if (!sem) {
      const { data: newSem } = await supabase.from('semesters').insert([{ name: semesterNameRaw, department_id: dept.id }]).select('id').single();
      sem = newSem;
      console.log('Created semester', semesterNameRaw);
    }
    
    // 4. Create Subject if not exists
    let { data: sub } = await supabase.from('subjects').select('id').eq('code', subjectCode).eq('semester_id', sem.id).single();
    if (!sub) {
      const { data: newSub, error } = await supabase.from('subjects').insert([{ name: subjectName, code: subjectCode, semester_id: sem.id }]).select('id').single();
      if (error) {
        console.error(`Error inserting subject ${subjectCode}:`, error.message);
      } else {
        console.log(`Inserted subject ${subjectCode} - ${subjectName}`);
      }
    } else {
      console.log(`Subject ${subjectCode} already exists in ${semesterNameRaw}`);
    }
  }
  
  console.log('Done importing CSV!');
}

run();
