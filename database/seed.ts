import { db } from '../lib/drizzle';
import { skills } from './schema';

const defaultSkills = [
  { name: 'TypeScript', category: 'Language', description: 'Strict syntactical superset of JavaScript.' },
  { name: 'JavaScript', category: 'Language', description: 'High-level, dynamic programming language.' },
  { name: 'Python', category: 'Language', description: 'General-purpose programming language popular for AI/ML.' },
  { name: 'Rust', category: 'Language', description: 'Systems programming language focused on safety and speed.' },
  { name: 'Go', category: 'Language', description: 'Statically typed, compiled programming language designed at Google.' },
  
  { name: 'React', category: 'Frontend', description: 'A JavaScript library for building user interfaces.' },
  { name: 'Next.js', category: 'Frontend', description: 'The React Framework for the Web.' },
  { name: 'Tailwind CSS', category: 'Frontend', description: 'Utility-first CSS framework.' },
  { name: 'Vue.js', category: 'Frontend', description: 'Progressive JavaScript framework.' },
  
  { name: 'Node.js', category: 'Backend', description: 'JavaScript runtime built on Chrome V8 engine.' },
  { name: 'Express', category: 'Backend', description: 'Fast, unopinionated, minimalist web framework for Node.js.' },
  { name: 'FastAPI', category: 'Backend', description: 'Modern, fast web framework for building APIs with Python.' },
  
  { name: 'PostgreSQL', category: 'Database', description: 'Powerful, open-source object-relational database system.' },
  { name: 'MongoDB', category: 'Database', description: 'Source-available cross-platform document-oriented database.' },
  { name: 'Redis', category: 'Database', description: 'In-memory data structure store used as database, cache, and message broker.' },
  
  { name: 'Docker', category: 'DevOps', description: 'OS-level virtualization to deliver software in packages called containers.' },
  { name: 'Kubernetes', category: 'DevOps', description: 'Open-source container-orchestration system.' },
  { name: 'AWS', category: 'DevOps', description: 'Amazon Web Services cloud computing platform.' },
  { name: 'Vercel', category: 'DevOps', description: 'Cloud platform for static sites and Serverless Functions.' },
];

async function main() {
  console.log('🌱 Seeding skills...');
  try {
    for (const skill of defaultSkills) {
      await db.insert(skills).values(skill).onConflictDoNothing();
    }
    console.log('✅ Seeding completed successfully!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

main();
