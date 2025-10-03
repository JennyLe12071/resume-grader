// Mock fixtures that simulate real MuleSoft IDP output
// These match the exact contract that real MuleSoft IDP would return

export interface MockIdpExtraction {
  jobKey: string;
  itemId: string;
  extractionJson: string;
  extractionVersion: string;
  status: string;
  createdAt: string;
}

// Mock JD extraction data
export const mockIdpJD = {
  Job_Title: "Business Development Manager",
  Summary: "We are seeking a dynamic Business Development Manager to drive growth and expand our market presence in the life sciences industry. This role involves identifying new business opportunities, building strategic partnerships, and developing relationships with pharmaceutical, biotech, and diagnostics companies. The successful candidate will be responsible for achieving sales targets, preparing proposals, and representing our company's products and services to key clients.",
  FLSA_Status: "Exempt",
  Job_Location: "San Diego, CA",
  Employment_Type: "Full-time",
  Skills: {
    Skills: [
      "Microsoft Excel",
      "Word",
      "Outlook",
      "Business Development",
      "Sales Strategy",
      "Life Sciences"
    ]
  },
  Education: {
    Education: "BA/BS in science or business related field, plus 4 years commercial life science experience (microbiology, biology, chemistry or biochemistry preferred)"
  },
  Experience: {
    Required_Experience: [
      "At least 3 years sales or business development experience representing complex life science products and/or services to pharmaceutical, biotech and diagnostics companies"
    ]
  },
  Qualifications: {
    Qualifications_Required: [
      "Bachelor's degree in science or business related field",
      "3+ years of sales or business development experience in life sciences"
    ],
    Qualifications_Preferred: [
      "Advanced degree preferred",
      "Experience with pharmaceutical and biotech clients"
    ]
  },
  Responsibilities: {
    Responsibilities_Duties: [
      "Responsible for achieving regional sales targets on a quarterly basis in accordance with the annual corporate sales plan",
      "Help with the preparation of proposals in collaboration with your colleagues in operations",
      "Negotiate complex business arrangements",
      "Maintain and enhance the Company's value proposition and professional reputation by displaying the highest levels, of professionalism, competence, and personal integrity"
    ]
  },
  Work_Environment: {
    Work_Environment: [
      "Office environment with frequent travel to client sites",
      "Remote work flexibility available",
      "Occasional evening and weekend work required"
    ]
  },
  Certifications_Licenses: {
    Certifications: [
      "Valid driver's license required",
      "Professional certifications in life sciences preferred"
    ]
  }
};

export const mockIdpResume = {
  Full_Name: "Paul Sung",
  Email_Address: "pauldohyunsung@gmail.com",
  Phone_Number: "213-804-3732",
  city: "San Diego",
  state_or_region: "CA",
  country: "United States",
  skills_core: [
    "Drug Discovery",
    "Process Development",
    "Organic/Peptide Synthesis",
    "NMR",
    "Mass Spec.",
    "HPLC",
    "X-ray Crystallography",
    "Flash Chromatography",
    "High Throughput Screening",
    "Technical Writing"
  ],
  total_years_experience: "5+",
  tools_platforms: [
    "Excel",
    "PowerPoint"
  ],
  domains_experience: [
    "Life Sciences",
    "Pharmaceutical",
    "Biotech"
  ],
  certifications_licences: "not found",
  education_highest_level: "Ph.D.",
  Work_Experience: [
    {
      Company: "Polypeptide Laboratories",
      Job_Title: "Process Development Scientist",
      Employment_Dates: "2023 - present",
      Responsibilities: [
        "Exceeded benchmarks on purity and yield for all clients, leading to multiple client retentions as well as new clients added",
        "Wrote proposals and lead projects on synthesis of large-scale polypeptides"
      ]
    }
  ],
  Education: [
    {
      Degree: "Ph.D. Organic Chemistry",
      Institution: "University of Pennsylvania",
      Graduation_Year: "2019"
    }
  ]
};

export const mockIdpResumes = [
  {
    Full_Name: "Sarah Martinez",
    Email_Address: "sarah.martinez@email.com",
    Phone_Number: "617-234-5678",
    city: "Boston",
    state_or_region: "MA",
    country: "United States",
    skills_core: [
      "Business Development",
      "Sales Strategy",
      "Life Sciences",
      "Pharmaceutical Sales",
      "Client Relations",
      "Market Analysis",
      "Proposal Writing",
      "Negotiation",
      "Account Management",
      "Strategic Planning"
    ],
    total_years_experience: "6",
    tools_platforms: [
      "Microsoft Excel",
      "PowerPoint",
      "CRM Systems",
      "Salesforce"
    ],
    domains_experience: [
      "Life Sciences",
      "Pharmaceutical", 
      "Biotech"
    ],
    certifications_licences: "not found",
    education_highest_level: "Master's",
    Work_Experience: [
      {
        Company: "BioTech Solutions",
        Job_Title: "Business Development Manager",
        Employment_Dates: "2020 - present",
        Responsibilities: [
          "Led business development for life science products and services",
          "Generated $5M+ in annual revenue through strategic partnerships",
          "Developed and maintained relationships with pharmaceutical and biotech clients",
          "Exceeded quarterly sales targets by 25%"
        ]
      }
    ],
    Education: [
      {
        Degree: "Master of Science in Biology",
        Institution: "Harvard University",
        Graduation_Year: "2018"
      }
    ]
  },
  {
    Full_Name: "Michael Chen",
    Email_Address: "michael.chen@email.com",
    Phone_Number: "415-987-6543",
    city: "San Francisco",
    state_or_region: "CA",
    country: "United States",
    skills_core: [
      "Technical Sales",
      "Product Management",
      "Biotechnology",
      "Scientific Writing",
      "Customer Support",
      "Market Research",
      "Training",
      "Problem Solving",
      "Team Leadership",
      "Project Management"
    ],
    total_years_experience: "4",
    tools_platforms: [
      "Microsoft Office",
      "JIRA",
      "Confluence",
      "Google Analytics"
    ],
    domains_experience: [
      "Biotechnology",
      "Technical Sales",
      "Product Management"
    ],
    certifications_licences: "PMP Certification",
    education_highest_level: "Bachelor's",
    Work_Experience: [
      {
        Company: "GeneTech Corp",
        Job_Title: "Technical Sales Specialist",
        Employment_Dates: "2021 - present",
        Responsibilities: [
          "Provided technical expertise to support sales of biotech products",
          "Conducted product demonstrations and training sessions",
          "Collaborated with R&D team to address customer technical requirements",
          "Achieved 110% of annual sales quota"
        ]
      }
    ],
    Education: [
      {
        Degree: "Bachelor of Science in Biochemistry",
        Institution: "UC Berkeley",
        Graduation_Year: "2020"
      }
    ]
  },
  {
    Full_Name: "Jennifer Williams",
    Email_Address: "jennifer.williams@email.com",
    Phone_Number: "858-555-0123",
    city: "San Diego",
    state_or_region: "CA",
    country: "United States",
    skills_core: [
      "Sales Management",
      "Business Strategy",
      "Client Relationship Management",
      "Revenue Growth",
      "Team Building",
      "Market Expansion",
      "Contract Negotiation",
      "Performance Analysis",
      "Strategic Planning",
      "Leadership"
    ],
    total_years_experience: "8",
    tools_platforms: [
      "Salesforce",
      "HubSpot",
      "Microsoft Excel",
      "Tableau"
    ],
    domains_experience: [
      "Life Sciences",
      "Pharmaceutical",
      "Business Development"
    ],
    certifications_licences: "Certified Sales Professional (CSP)",
    education_highest_level: "Master's",
    Work_Experience: [
      {
        Company: "LifeScience Partners",
        Job_Title: "Senior Business Development Manager",
        Employment_Dates: "2019 - present",
        Responsibilities: [
          "Managed portfolio of pharmaceutical and biotech clients",
          "Led team of 5 business development representatives",
          "Developed strategic partnerships resulting in 40% revenue increase",
          "Implemented new CRM system improving team efficiency by 30%"
        ]
      }
    ],
    Education: [
      {
        Degree: "Master of Business Administration (MBA)",
        Institution: "Stanford Graduate School of Business",
        Graduation_Year: "2016"
      }
    ]
  },
  {
    Full_Name: "David Rodriguez",
    Email_Address: "david.rodriguez@email.com",
    Phone_Number: "512-444-7890",
    city: "Austin",
    state_or_region: "TX",
    country: "United States",
    skills_core: [
      "Account Management",
      "Business Development",
      "Sales Operations",
      "Customer Success",
      "Data Analysis",
      "Process Improvement",
      "Relationship Building",
      "Presentation Skills",
      "Market Analysis",
      "Strategic Thinking"
    ],
    total_years_experience: "3",
    tools_platforms: [
      "Microsoft Office Suite",
      "Salesforce",
      "LinkedIn Sales Navigator",
      "Zoom"
    ],
    domains_experience: [
      "Business Development",
      "Sales Operations",
      "Account Management"
    ],
    certifications_licences: "not found",
    education_highest_level: "Bachelor's",
    Work_Experience: [
      {
        Company: "BioMed Solutions",
        Job_Title: "Business Development Associate",
        Employment_Dates: "2022 - present",
        Responsibilities: [
          "Supported senior business development team in client acquisition",
          "Conducted market research and competitive analysis",
          "Prepared proposals and presentations for potential clients",
          "Maintained CRM database and generated sales reports"
        ]
      }
    ],
    Education: [
      {
        Degree: "Bachelor of Science in Marketing",
        Institution: "University of Texas at Austin",
        Graduation_Year: "2021"
      }
    ]
  }
];