/**
 * secondLook Skill Taxonomy
 *
 * Extensible skill ontology with categories, synonyms, aliases,
 * related skills, and evidence requirements.
 *
 * Rules:
 * - Related skills contribute partial credit to a broader category.
 * - Exact mandatory requirements remain distinguishable.
 * - A related skill does NOT receive full credit for a different required skill.
 * - No duplicate points for the same skill under multiple categories.
 * - Candidates are not penalized for missing irrelevant technologies.
 */

// ---------------------------------------------------------------
// Canonical skill entries: { id, name, aliases[], category, related[] }
// ---------------------------------------------------------------
const SKILLS = [
  // --- Web / Frontend ---
  { id: 'html',        name: 'HTML',           aliases: ['html5', 'hypertext markup'], category: 'frontend', related: ['css', 'javascript'] },
  { id: 'css',         name: 'CSS',            aliases: ['css3', 'cascading style sheets', 'stylesheets'], category: 'frontend', related: ['html', 'sass', 'tailwind'] },
  { id: 'sass',        name: 'Sass/SCSS',      aliases: ['scss', 'sass'], category: 'frontend', related: ['css'] },
  { id: 'tailwind',    name: 'Tailwind CSS',   aliases: ['tailwindcss'], category: 'frontend', related: ['css'] },
  { id: 'javascript',  name: 'JavaScript',     aliases: ['js', 'ecmascript', 'es6', 'es2015', 'vanilla js'], category: 'frontend', related: ['typescript', 'html', 'css'] },
  { id: 'typescript',  name: 'TypeScript',     aliases: ['ts'], category: 'frontend', related: ['javascript'] },
  { id: 'react',       name: 'React',          aliases: ['reactjs', 'react.js', 'react js'], category: 'frontend', related: ['javascript', 'redux', 'nextjs'] },
  { id: 'redux',       name: 'Redux',          aliases: ['react-redux', 'redux toolkit', 'rtk'], category: 'frontend', related: ['react'] },
  { id: 'nextjs',      name: 'Next.js',        aliases: ['next.js', 'nextjs', 'next js'], category: 'frontend', related: ['react', 'javascript'] },
  { id: 'angular',     name: 'Angular',        aliases: ['angularjs', 'angular.js', 'angular 2+'], category: 'frontend', related: ['typescript'] },
  { id: 'vue',         name: 'Vue.js',         aliases: ['vuejs', 'vue', 'vue 3'], category: 'frontend', related: ['javascript'] },
  { id: 'svelte',      name: 'Svelte',         aliases: ['sveltekit'], category: 'frontend', related: ['javascript'] },
  { id: 'jquery',      name: 'jQuery',         aliases: ['jquery'], category: 'frontend', related: ['javascript'] },
  { id: 'bootstrap',   name: 'Bootstrap',      aliases: ['bootstrap 5', 'bootstrap css'], category: 'frontend', related: ['css', 'html'] },
  { id: 'responsive',  name: 'Responsive Design', aliases: ['mobile-first', 'responsive web design', 'rwd', 'media queries'], category: 'frontend', related: ['css', 'html'] },

  // --- Backend ---
  { id: 'nodejs',      name: 'Node.js',        aliases: ['node', 'node.js', 'nodejs'], category: 'backend', related: ['express', 'javascript'] },
  { id: 'express',     name: 'Express.js',     aliases: ['expressjs', 'express', 'express.js'], category: 'backend', related: ['nodejs'] },
  { id: 'python',      name: 'Python',         aliases: ['python3', 'py'], category: 'backend', related: ['django', 'flask'] },
  { id: 'django',      name: 'Django',         aliases: ['django rest framework', 'drf'], category: 'backend', related: ['python'] },
  { id: 'flask',       name: 'Flask',          aliases: ['flask api'], category: 'backend', related: ['python'] },
  { id: 'fastapi',     name: 'FastAPI',        aliases: [], category: 'backend', related: ['python'] },
  { id: 'java',        name: 'Java',           aliases: ['java se', 'java ee', 'jdk'], category: 'backend', related: ['spring'] },
  { id: 'spring',      name: 'Spring Boot',    aliases: ['spring', 'spring framework', 'spring boot'], category: 'backend', related: ['java'] },
  { id: 'csharp',      name: 'C#',             aliases: ['c sharp', 'csharp', '.net', 'dotnet', 'asp.net'], category: 'backend', related: [] },
  { id: 'go',          name: 'Go',             aliases: ['golang'], category: 'backend', related: [] },
  { id: 'rust',        name: 'Rust',           aliases: ['rust-lang'], category: 'backend', related: [] },
  { id: 'php',         name: 'PHP',            aliases: ['php8', 'laravel'], category: 'backend', related: [] },
  { id: 'ruby',        name: 'Ruby',           aliases: ['ruby on rails', 'rails', 'ror'], category: 'backend', related: [] },
  { id: 'restapi',     name: 'REST APIs',      aliases: ['rest', 'restful', 'rest api', 'restful api', 'api development', 'web api', 'http api'], category: 'backend', related: ['nodejs', 'express'] },
  { id: 'graphql',     name: 'GraphQL',        aliases: ['gql', 'apollo graphql'], category: 'backend', related: ['restapi'] },
  { id: 'websocket',   name: 'WebSockets',     aliases: ['socket.io', 'ws', 'real-time'], category: 'backend', related: ['nodejs'] },
  { id: 'auth',        name: 'Authentication',  aliases: ['jwt', 'oauth', 'oauth2', 'session management', 'authorization', 'rbac', 'access control'], category: 'backend', related: [] },
  { id: 'microservices', name: 'Microservices', aliases: ['micro-services', 'service-oriented'], category: 'backend', related: ['docker', 'kubernetes'] },

  // --- Database ---
  { id: 'mongodb',     name: 'MongoDB',        aliases: ['mongo', 'mongoose', 'nosql'], category: 'database', related: ['nodejs'] },
  { id: 'sql',         name: 'SQL',            aliases: ['structured query language', 'relational database'], category: 'database', related: ['mysql', 'postgresql'] },
  { id: 'mysql',       name: 'MySQL',          aliases: ['mariadb'], category: 'database', related: ['sql'] },
  { id: 'postgresql',  name: 'PostgreSQL',     aliases: ['postgres', 'pg', 'psql'], category: 'database', related: ['sql'] },
  { id: 'redis',       name: 'Redis',          aliases: ['redis cache'], category: 'database', related: [] },
  { id: 'firebase',    name: 'Firebase',       aliases: ['firestore', 'firebase db'], category: 'database', related: [] },
  { id: 'dynamodb',    name: 'DynamoDB',       aliases: ['dynamo db', 'aws dynamodb'], category: 'database', related: ['aws'] },
  { id: 'elasticsearch', name: 'Elasticsearch', aliases: ['elastic', 'elk'], category: 'database', related: [] },
  { id: 'dbdesign',    name: 'Database Design', aliases: ['schema design', 'data modeling', 'erd', 'normalization', 'indexing', 'query optimization'], category: 'database', related: ['sql', 'mongodb'] },

  // --- DevOps / Cloud ---
  { id: 'git',         name: 'Git',            aliases: ['github', 'gitlab', 'bitbucket', 'version control', 'source control'], category: 'devops', related: [] },
  { id: 'docker',      name: 'Docker',         aliases: ['containers', 'containerization', 'dockerfile'], category: 'devops', related: ['kubernetes'] },
  { id: 'kubernetes',  name: 'Kubernetes',     aliases: ['k8s', 'kubectl', 'container orchestration'], category: 'devops', related: ['docker'] },
  { id: 'cicd',        name: 'CI/CD',          aliases: ['continuous integration', 'continuous deployment', 'continuous delivery', 'jenkins', 'github actions', 'gitlab ci', 'circleci', 'travis ci'], category: 'devops', related: ['git', 'docker'] },
  { id: 'aws',         name: 'AWS',            aliases: ['amazon web services', 'ec2', 's3', 'lambda', 'cloudfront', 'aws services'], category: 'devops', related: [] },
  { id: 'azure',       name: 'Azure',          aliases: ['microsoft azure', 'azure devops', 'azure cloud'], category: 'devops', related: [] },
  { id: 'gcp',         name: 'Google Cloud',   aliases: ['gcp', 'google cloud platform', 'cloud run'], category: 'devops', related: [] },
  { id: 'linux',       name: 'Linux',          aliases: ['ubuntu', 'centos', 'debian', 'shell scripting', 'bash'], category: 'devops', related: [] },
  { id: 'terraform',   name: 'Terraform',      aliases: ['iac', 'infrastructure as code'], category: 'devops', related: ['aws', 'azure', 'gcp'] },
  { id: 'nginx',       name: 'Nginx',          aliases: ['reverse proxy', 'load balancer'], category: 'devops', related: ['linux'] },
  { id: 'monitoring',  name: 'Monitoring',     aliases: ['prometheus', 'grafana', 'datadog', 'logging', 'observability', 'cloudwatch'], category: 'devops', related: [] },

  // --- Data Science / ML ---
  { id: 'numpy',       name: 'NumPy',          aliases: ['numpy'], category: 'datascience', related: ['python'] },
  { id: 'pandas',      name: 'pandas',         aliases: ['pandas'], category: 'datascience', related: ['python', 'numpy'] },
  { id: 'scikitlearn', name: 'scikit-learn',   aliases: ['sklearn', 'scikit learn'], category: 'datascience', related: ['python'] },
  { id: 'tensorflow',  name: 'TensorFlow',     aliases: ['tf', 'keras'], category: 'datascience', related: ['python'] },
  { id: 'pytorch',     name: 'PyTorch',        aliases: ['torch'], category: 'datascience', related: ['python'] },
  { id: 'ml',          name: 'Machine Learning', aliases: ['machine learning', 'ml', 'deep learning', 'neural networks', 'model training'], category: 'datascience', related: ['python', 'tensorflow', 'pytorch'] },
  { id: 'dataanalysis', name: 'Data Analysis',  aliases: ['data analytics', 'exploratory data analysis', 'eda', 'statistical analysis'], category: 'datascience', related: ['python', 'pandas', 'sql'] },
  { id: 'nlp',         name: 'NLP',            aliases: ['natural language processing', 'text mining', 'text analysis'], category: 'datascience', related: ['ml', 'python'] },
  { id: 'cv',          name: 'Computer Vision', aliases: ['image processing', 'opencv'], category: 'datascience', related: ['ml', 'python'] },

  // --- Mobile ---
  { id: 'reactnative', name: 'React Native',   aliases: ['react-native', 'rn'], category: 'mobile', related: ['react', 'javascript'] },
  { id: 'flutter',     name: 'Flutter',        aliases: ['dart'], category: 'mobile', related: [] },
  { id: 'swift',       name: 'Swift',          aliases: ['ios development', 'swiftui'], category: 'mobile', related: [] },
  { id: 'kotlin',      name: 'Kotlin',         aliases: ['android development', 'kotlin android'], category: 'mobile', related: ['java'] },

  // --- Testing ---
  { id: 'testing',     name: 'Testing',        aliases: ['unit testing', 'integration testing', 'test driven', 'tdd', 'bdd'], category: 'testing', related: [] },
  { id: 'jest',        name: 'Jest',           aliases: ['jest testing'], category: 'testing', related: ['javascript', 'react'] },
  { id: 'cypress',     name: 'Cypress',        aliases: ['cypress.io', 'e2e testing'], category: 'testing', related: ['javascript'] },
  { id: 'selenium',    name: 'Selenium',       aliases: ['selenium webdriver'], category: 'testing', related: [] },
  { id: 'pytest',      name: 'pytest',         aliases: ['py.test'], category: 'testing', related: ['python'] },

  // --- Soft Skills ---
  { id: 'leadership',  name: 'Leadership',     aliases: ['team lead', 'team management', 'mentoring'], category: 'soft', related: [] },
  { id: 'communication', name: 'Communication', aliases: ['written communication', 'verbal communication', 'presentation'], category: 'soft', related: [] },
  { id: 'problemsolving', name: 'Problem Solving', aliases: ['analytical thinking', 'critical thinking', 'debugging'], category: 'soft', related: [] },
  { id: 'agile',       name: 'Agile',          aliases: ['scrum', 'kanban', 'sprint', 'jira', 'agile methodology'], category: 'soft', related: [] },
  { id: 'collaboration', name: 'Collaboration', aliases: ['teamwork', 'cross-functional', 'pair programming'], category: 'soft', related: [] },

  // --- Tools ---
  { id: 'figma',       name: 'Figma',          aliases: ['figma design'], category: 'tools', related: [] },
  { id: 'vscode',      name: 'VS Code',        aliases: ['visual studio code'], category: 'tools', related: [] },
  { id: 'postman',     name: 'Postman',        aliases: ['api testing'], category: 'tools', related: ['restapi'] },
  { id: 'webpack',     name: 'Webpack',        aliases: ['bundler', 'module bundler'], category: 'tools', related: ['javascript'] },
  { id: 'vite',        name: 'Vite',           aliases: ['vite.js'], category: 'tools', related: ['javascript'] },
];

// ---------------------------------------------------------------
// Category metadata
// ---------------------------------------------------------------
const CATEGORIES = {
  frontend:    { name: 'Frontend Development',  weight: 1.0 },
  backend:     { name: 'Backend Development',   weight: 1.0 },
  database:    { name: 'Database',              weight: 1.0 },
  devops:      { name: 'DevOps & Cloud',        weight: 0.8 },
  datascience: { name: 'Data Science & ML',     weight: 1.0 },
  mobile:      { name: 'Mobile Development',    weight: 1.0 },
  testing:     { name: 'Testing & QA',          weight: 0.7 },
  soft:        { name: 'Soft Skills',           weight: 0.5 },
  tools:       { name: 'Tools',                 weight: 0.3 },
};

// ---------------------------------------------------------------
// Broader role-to-category mapping for contextual matching
// ---------------------------------------------------------------
const ROLE_CATEGORIES = {
  'web developer':        ['frontend', 'backend', 'database', 'devops'],
  'web development':      ['frontend', 'backend', 'database', 'devops'],
  'frontend developer':   ['frontend'],
  'frontend engineer':    ['frontend'],
  'backend developer':    ['backend', 'database'],
  'backend engineer':     ['backend', 'database'],
  'full-stack developer': ['frontend', 'backend', 'database', 'devops'],
  'full stack developer': ['frontend', 'backend', 'database', 'devops'],
  'fullstack developer':  ['frontend', 'backend', 'database', 'devops'],
  'software engineer':    ['frontend', 'backend', 'database', 'devops', 'testing'],
  'data scientist':       ['datascience', 'database'],
  'data analyst':         ['datascience', 'database'],
  'data engineer':        ['datascience', 'database', 'devops'],
  'ml engineer':          ['datascience', 'backend'],
  'devops engineer':      ['devops', 'backend'],
  'cloud engineer':       ['devops'],
  'mobile developer':     ['mobile', 'frontend'],
  'ios developer':        ['mobile'],
  'android developer':    ['mobile'],
  'qa engineer':          ['testing'],
  'test engineer':        ['testing'],
};

// ---------------------------------------------------------------
// Build lookup indexes (computed once at module load time)
// ---------------------------------------------------------------
const _skillById = new Map();
const _aliasToId = new Map();

for (const skill of SKILLS) {
  _skillById.set(skill.id, skill);

  // Index the canonical name
  _aliasToId.set(skill.name.toLowerCase(), skill.id);
  _aliasToId.set(skill.id, skill.id);

  // Index all aliases
  for (const alias of skill.aliases) {
    _aliasToId.set(alias.toLowerCase(), skill.id);
  }
}

// ---------------------------------------------------------------
// Public API
// ---------------------------------------------------------------

/**
 * Normalize a skill string to its canonical ID.
 * Returns the canonical ID or null if not found.
 */
function normalizeSkill(raw) {
  if (!raw) return null;
  const cleaned = raw.toLowerCase().trim().replace(/[^\w\s.#+\-/]/g, '');

  // Direct lookup
  if (_aliasToId.has(cleaned)) return _aliasToId.get(cleaned);

  // Substring match for multi-word skills
  for (const [alias, id] of _aliasToId.entries()) {
    if (cleaned.includes(alias) || alias.includes(cleaned)) {
      return id;
    }
  }

  return null;
}

/**
 * Get the canonical skill entry by ID.
 */
function getSkill(id) {
  return _skillById.get(id) || null;
}

/**
 * Get all skills in a category.
 */
function getSkillsByCategory(category) {
  return SKILLS.filter(s => s.category === category);
}

/**
 * Get related skill IDs for a given skill ID.
 * Returns direct relations only (not transitive).
 */
function getRelatedSkills(skillId) {
  const skill = _skillById.get(skillId);
  return skill ? skill.related : [];
}

/**
 * Check if skillA and skillB are related (directly).
 */
function areRelated(skillIdA, skillIdB) {
  const a = _skillById.get(skillIdA);
  const b = _skillById.get(skillIdB);
  if (!a || !b) return false;
  return a.related.includes(skillIdB) || b.related.includes(skillIdA);
}

/**
 * Check if skillA and skillB are in the same category.
 */
function sameCategory(skillIdA, skillIdB) {
  const a = _skillById.get(skillIdA);
  const b = _skillById.get(skillIdB);
  if (!a || !b) return false;
  return a.category === b.category;
}

/**
 * Extract recognized skill IDs from a text string.
 * Returns an array of { id, name, matchType } objects.
 * matchType: 'exact' | 'alias'
 */
function extractSkillsFromText(text) {
  if (!text) return [];
  const lower = text.toLowerCase();
  const found = new Map(); // id -> { id, name, matchType }

  for (const skill of SKILLS) {
    // Check canonical name
    if (lower.includes(skill.name.toLowerCase())) {
      if (!found.has(skill.id)) {
        found.set(skill.id, { id: skill.id, name: skill.name, matchType: 'exact' });
      }
      continue;
    }

    // Check aliases
    for (const alias of skill.aliases) {
      if (lower.includes(alias.toLowerCase())) {
        if (!found.has(skill.id)) {
          found.set(skill.id, { id: skill.id, name: skill.name, matchType: 'alias' });
        }
        break;
      }
    }
  }

  return Array.from(found.values());
}

/**
 * Determine relevant categories for a job description text.
 * Uses role-keyword matching and detected skills.
 */
function inferJobCategories(jobDescriptionText) {
  if (!jobDescriptionText) return Object.keys(CATEGORIES);
  const lower = jobDescriptionText.toLowerCase();

  // Check for role-based category mapping
  for (const [role, cats] of Object.entries(ROLE_CATEGORIES)) {
    if (lower.includes(role)) {
      return [...new Set(cats)];
    }
  }

  // Fall back to detecting categories from mentioned skills
  const detectedSkills = extractSkillsFromText(jobDescriptionText);
  const cats = new Set();
  for (const ds of detectedSkills) {
    const skill = _skillById.get(ds.id);
    if (skill) cats.add(skill.category);
  }

  return cats.size > 0 ? Array.from(cats) : Object.keys(CATEGORIES);
}

module.exports = {
  SKILLS,
  CATEGORIES,
  ROLE_CATEGORIES,
  normalizeSkill,
  getSkill,
  getSkillsByCategory,
  getRelatedSkills,
  areRelated,
  sameCategory,
  extractSkillsFromText,
  inferJobCategories,
};
