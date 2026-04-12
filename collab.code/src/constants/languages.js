export const LANGUAGES = [
  {
    id: 'javascript',
    label: 'JavaScript',
    ext: 'js',
    color: '#F7DF1E',
    template: `// Welcome to Collab.Code ✨\n// Start coding in JavaScript\n\nfunction greet(name) {\n    return \`Hello, \${name}!\`;\n}\n\nconsole.log(greet("World"));\n`,
  },
  {
    id: 'typescript',
    label: 'TypeScript',
    ext: 'ts',
    color: '#3178C6',
    template: `// Welcome to Collab.Code ✨\n// Start coding in TypeScript\n\nfunction greet(name: string): string {\n    return \`Hello, \${name}!\`;\n}\n\nconsole.log(greet("World"));\n`,
  },
  {
    id: 'python',
    label: 'Python',
    ext: 'py',
    color: '#3776AB',
    template: `# Welcome to Collab.Code ✨\n# Start coding in Python\n\ndef greet(name):\n    return f"Hello, {name}!"\n\nprint(greet("World"))\n`,
  },
  {
    id: 'java',
    label: 'Java',
    ext: 'java',
    color: '#ED8B00',
    template: `// Welcome to Collab.Code ✨\n\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}\n`,
  },
  {
    id: 'cpp',
    label: 'C++',
    ext: 'cpp',
    color: '#00599C',
    template: `// Welcome to Collab.Code ✨\n\n#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello, World!" << endl;\n    return 0;\n}\n`,
  },
  {
    id: 'c',
    label: 'C',
    ext: 'c',
    color: '#A8B9CC',
    template: `/* Welcome to Collab.Code ✨ */\n\n#include <stdio.h>\n\nint main() {\n    printf("Hello, World!\\n");\n    return 0;\n}\n`,
  },
  {
    id: 'csharp',
    label: 'C#',
    ext: 'cs',
    color: '#512BD4',
    template: `// Welcome to Collab.Code ✨\n\nusing System;\n\nclass Program {\n    static void Main() {\n        Console.WriteLine("Hello, World!");\n    }\n}\n`,
  },
  {
    id: 'go',
    label: 'Go',
    ext: 'go',
    color: '#00ADD8',
    template: `// Welcome to Collab.Code ✨\n\npackage main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Hello, World!")\n}\n`,
  },
  {
    id: 'rust',
    label: 'Rust',
    ext: 'rs',
    color: '#CE422B',
    template: `// Welcome to Collab.Code ✨\n\nfn main() {\n    println!("Hello, World!");\n}\n`,
  },
  {
    id: 'ruby',
    label: 'Ruby',
    ext: 'rb',
    color: '#CC342D',
    template: `# Welcome to Collab.Code ✨\n\ndef greet(name)\n  "Hello, #{name}!"\nend\n\nputs greet("World")\n`,
  },
  {
    id: 'php',
    label: 'PHP',
    ext: 'php',
    color: '#777BB4',
    template: `<?php\n// Welcome to Collab.Code ✨\n\nfunction greet($name) {\n    return "Hello, $name!";\n}\n\necho greet("World");\n?>\n`,
  },
  {
    id: 'html',
    label: 'HTML',
    ext: 'html',
    color: '#E34F26',
    template: `<!DOCTYPE html>\n<html lang="en">\n<head>\n    <meta charset="UTF-8">\n    <title>Collab.Code</title>\n</head>\n<body>\n    <h1>Hello, World!</h1>\n</body>\n</html>\n`,
  },
  {
    id: 'css',
    label: 'CSS',
    ext: 'css',
    color: '#1572B6',
    template: `/* Welcome to Collab.Code ✨ */\n\nbody {\n    font-family: 'Inter', sans-serif;\n    background: #1e1e2e;\n    color: #cdd6f4;\n    margin: 0;\n    padding: 2rem;\n}\n`,
  },
  {
    id: 'json',
    label: 'JSON',
    ext: 'json',
    color: '#292929',
    template: `{\n    "name": "collab-code",\n    "version": "1.0.0",\n    "description": "Collaborative Code Editor"\n}\n`,
  },
  {
    id: 'markdown',
    label: 'Markdown',
    ext: 'md',
    color: '#083FA1',
    template: `# Welcome to Collab.Code ✨\n\nA **collaborative code editor** built with React and Monaco.\n\n## Features\n- 🎨 Multi-language support\n- 👥 Real-time collaboration\n- 🚀 Code execution\n`,
  },
  {
    id: 'sql',
    label: 'SQL',
    ext: 'sql',
    color: '#CC2927',
    template: `-- Welcome to Collab.Code ✨\n\nSELECT \n    users.name,\n    users.email\nFROM users\nWHERE users.active = true\nORDER BY users.created_at DESC\nLIMIT 10;\n`,
  },
  {
    id: 'plaintext',
    label: 'Plain Text',
    ext: 'txt',
    color: '#ABB2BF',
    template: `Welcome to Collab.Code ✨\nStart typing here...\n`,
  },
];

export const getLanguageById = (id) => LANGUAGES.find((l) => l.id === id);

export const getLanguageByExt = (ext) => {
  const lang = LANGUAGES.find((l) => l.ext === ext);
  return lang || LANGUAGES.find((l) => l.id === 'plaintext');
};

export const getExtFromFilename = (filename) => {
  const parts = filename.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
};

export const CURSOR_COLORS = [
  '#FF6B6B', '#4ECDC4', '#FFE66D', '#A8E6CF', '#FF8B94',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
];
