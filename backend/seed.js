const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

dotenv.config();

const User = require('./models/User');
const JobDescription = require('./models/JobDescription');

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('[Seed] Connected to MongoDB');

    // Check if recruiter already exists
    let recruiter = await User.findOne({ email: 'recruiter@techcorp.com' });
    if (!recruiter) {
      recruiter = await User.create({
        name: 'Priya Sharma',
        email: 'recruiter@techcorp.com',
        password: 'password123',
        role: 'recruiter'
      });
      console.log('[Seed] Created recruiter: recruiter@techcorp.com / password123');
    }

    let recruiter2 = await User.findOne({ email: 'hr@innovate.io' });
    if (!recruiter2) {
      recruiter2 = await User.create({
        name: 'Rajesh Kumar',
        email: 'hr@innovate.io',
        password: 'password123',
        role: 'recruiter'
      });
      console.log('[Seed] Created recruiter: hr@innovate.io / password123');
    }

    // Sample job descriptions (fuzzy data)
    const jobsToSeed = [
      {
        recruiterId: recruiter._id,
        title: 'Full-Stack Developer',
        company: 'TechCorp India',
        descriptionText: `We are looking for a Full-Stack Developer to join our product team.

Requirements:
- 2+ years experience with React.js, Node.js, and MongoDB
- Strong understanding of RESTful API design and microservices architecture
- Experience with TypeScript, Redux, and modern CSS (Tailwind/SCSS)
- Familiarity with Git, CI/CD pipelines, Docker, and AWS/GCP
- Knowledge of testing frameworks like Jest, Mocha, or Cypress
- Strong problem-solving skills and ability to work in agile teams

Nice to have:
- Experience with GraphQL, WebSockets, or real-time applications
- Contributions to open-source projects
- Familiarity with PostgreSQL or Redis

Location: Bangalore (Hybrid)
Salary: ₹8-15 LPA
`,
        extractedSkills: ['React', 'Node.js', 'MongoDB', 'TypeScript', 'Redux', 'REST APIs', 'Docker', 'AWS', 'Git', 'CI/CD', 'Jest', 'GraphQL']
      },
      {
        recruiterId: recruiter._id,
        title: 'Data Scientist',
        company: 'TechCorp India',
        descriptionText: `We're hiring a Data Scientist for our ML team.

Requirements:
- Proficiency in Python, Pandas, NumPy, and Scikit-learn
- Experience with deep learning frameworks (TensorFlow/PyTorch)
- Strong statistics and probability fundamentals
- Experience with SQL and data visualization tools (Matplotlib, Seaborn, Tableau)
- Familiarity with NLP, computer vision, or recommendation systems
- Experience with cloud ML services (AWS SageMaker, GCP Vertex AI)

Nice to have:
- Published research or Kaggle competition experience
- Experience with MLOps and model deployment
- Knowledge of Spark or big data tools

Location: Remote
Salary: ₹12-22 LPA
`,
        extractedSkills: ['Python', 'Pandas', 'NumPy', 'Scikit-learn', 'TensorFlow', 'PyTorch', 'SQL', 'NLP', 'Computer Vision', 'AWS', 'Statistics']
      },
      {
        recruiterId: recruiter._id,
        title: 'DevOps Engineer',
        company: 'TechCorp India',
        descriptionText: `Looking for a DevOps Engineer to manage our cloud infrastructure.

Requirements:
- Experience with AWS/Azure/GCP cloud platforms
- Strong knowledge of Docker, Kubernetes, and container orchestration
- Proficiency in CI/CD tools (Jenkins, GitHub Actions, GitLab CI)
- Infrastructure as Code experience (Terraform, CloudFormation)
- Linux system administration and shell scripting
- Monitoring and logging tools (Prometheus, Grafana, ELK stack)

Nice to have:
- Kubernetes CKA/CKAD certification
- Experience with service mesh (Istio)
- Security best practices (DevSecOps)

Location: Hyderabad (On-site)
Salary: ₹10-18 LPA
`,
        extractedSkills: ['AWS', 'Docker', 'Kubernetes', 'Jenkins', 'Terraform', 'Linux', 'CI/CD', 'Prometheus', 'Grafana', 'Shell Scripting']
      },
      {
        recruiterId: recruiter2._id,
        title: 'Frontend Engineer (React)',
        company: 'Innovate.io',
        descriptionText: `Join Innovate.io as a Frontend Engineer!

Requirements:
- 1-3 years experience building SPAs with React.js
- Deep knowledge of JavaScript/TypeScript, HTML5, CSS3
- Experience with state management (Redux, Zustand, or Context API)
- Responsive design and cross-browser compatibility
- Testing with React Testing Library, Jest
- Performance optimization and web accessibility (WCAG)

Nice to have:
- Experience with Next.js or Remix
- Animation libraries (Framer Motion, GSAP)
- Design system experience (Storybook)
- Mobile development with React Native

Location: Pune (Hybrid)
Salary: ₹6-12 LPA
`,
        extractedSkills: ['React', 'JavaScript', 'TypeScript', 'HTML', 'CSS', 'Redux', 'Jest', 'Next.js', 'Responsive Design', 'Web Accessibility']
      },
      {
        recruiterId: recruiter2._id,
        title: 'Backend Engineer (Java)',
        company: 'Innovate.io',
        descriptionText: `We need a Backend Engineer with strong Java skills.

Requirements:
- 2+ years experience with Java and Spring Boot framework
- Experience with microservices architecture and RESTful APIs
- Database design with MySQL, PostgreSQL, or MongoDB
- Message queues (Kafka, RabbitMQ)
- Understanding of SOLID principles and design patterns
- Unit and integration testing

Nice to have:
- Experience with cloud platforms (AWS/GCP)
- Knowledge of GraphQL
- Performance tuning and caching (Redis, Memcached)

Location: Chennai (Remote)
Salary: ₹9-16 LPA
`,
        extractedSkills: ['Java', 'Spring Boot', 'Microservices', 'REST APIs', 'MySQL', 'PostgreSQL', 'MongoDB', 'Kafka', 'Design Patterns', 'AWS']
      },
      {
        recruiterId: recruiter2._id,
        title: 'Mobile App Developer (Flutter)',
        company: 'Innovate.io',
        descriptionText: `Looking for a Flutter developer to build cross-platform mobile apps.

Requirements:
- Experience with Flutter and Dart programming language
- State management (Provider, Riverpod, or BLoC)
- REST API integration and local storage (Hive, SQLite)
- App deployment to Google Play Store and Apple App Store
- UI/UX implementation with custom widgets and animations
- Firebase integration (Auth, Firestore, Cloud Functions)

Nice to have:
- Native Android (Kotlin) or iOS (Swift) experience
- Experience with CI/CD for mobile apps
- Knowledge of performance profiling and optimization

Location: Bangalore (Hybrid)
Salary: ₹7-14 LPA
`,
        extractedSkills: ['Flutter', 'Dart', 'Firebase', 'REST APIs', 'Provider', 'BLoC', 'SQLite', 'Kotlin', 'Swift', 'UI/UX']
      }
    ];

    // Insert jobs (skip duplicates)
    for (const jobData of jobsToSeed) {
      const exists = await JobDescription.findOne({
        recruiterId: jobData.recruiterId,
        title: jobData.title
      });
      if (!exists) {
        await JobDescription.create(jobData);
        console.log(`[Seed] Created job: ${jobData.title} at ${jobData.company}`);
      } else {
        console.log(`[Seed] Job already exists: ${jobData.title} at ${jobData.company}`);
      }
    }

    // Create a sample candidate
    let candidate = await User.findOne({ email: 'candidate@gmail.com' });
    if (!candidate) {
      candidate = await User.create({
        name: 'Arun Verma',
        email: 'candidate@gmail.com',
        password: 'password123',
        role: 'candidate',
        profile: {
          college: 'IIT Delhi',
          degree: 'B.Tech Computer Science',
          cgpa: '8.5',
          linkedin: 'https://linkedin.com/in/arunverma',
          leetcode: 'https://leetcode.com/arunverma',
          skills: ['React', 'Node.js', 'Python', 'MongoDB', 'JavaScript', 'TypeScript'],
          projects: [
            {
              name: 'E-Commerce Platform',
              description: 'Built a full-stack e-commerce platform with React, Node.js, and Stripe integration',
              techStack: 'React, Node.js, MongoDB, Stripe',
              link: 'https://github.com/arunverma/ecommerce'
            }
          ]
        }
      });
      console.log('[Seed] Created candidate: candidate@gmail.com / password123');
    }

    console.log('\n[Seed] ✅ Seed data complete!');
    console.log('[Seed] Recruiter 1: recruiter@techcorp.com / password123');
    console.log('[Seed] Recruiter 2: hr@innovate.io / password123');
    console.log('[Seed] Candidate: candidate@gmail.com / password123');
    process.exit(0);
  } catch (error) {
    console.error('[Seed] Error:', error.message);
    process.exit(1);
  }
};

seedData();
