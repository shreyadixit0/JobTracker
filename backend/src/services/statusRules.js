export class StatusRulesService {
  constructor() {
    this.statusPatterns = {
      INTERVIEW: [
        /interview.*scheduled/i,
        /invitation.*interview/i,
        /interview.*invitation/i,
        /assessment.*scheduled/i,
        /phone.*screen/i,
        /video.*interview/i,
        /technical.*interview/i,
        /next.*step.*interview/i
      ],
      OFFER: [
        /offer/i,
        /pleased.*offer/i,
        /extended.*offer/i,
        /congratulations/i,
        /welcome.*team/i
      ],
      REJECTED: [
        /unfortunately/i,
        /regret.*inform/i,
        /not.*moving.*forward/i,
        /decided.*pursue/i,
        /thank.*you.*interest.*however/i,
        /position.*filled/i,
        /no.*longer.*considering/i
      ],
      HIRED: [
        /welcome.*aboard/i,
        /onboarding/i,
        /background.*check.*cleared/i,
        /start.*date/i,
        /first.*day/i
      ],
      PENDING: [
        /application.*received/i,
        /thanks.*applying/i,
        /received.*your.*application/i,
        /application.*under.*review/i,
        /reviewing.*application/i
      ]
    };

    this.companyDomainMap = {
      'lever.co': 'LEVER',
      'greenhouse.io': 'GREENHOUSE',
      'workday.com': 'WORKDAY',
      'myworkday.com': 'WORKDAY',
      'indeed.com': 'INDEED',
      'linkedin.com': 'LINKEDIN',
      'naukri.com': 'NAUKRI',
      'glassdoor.com': 'GLASSDOOR'
    };
  }

  parseEmailContent(email) {
    const result = {
      status: null,
      company: null,
      position: null,
      portal: null,
      externalRef: null,
      dateApplied: null
    };

    // Parse status from subject and snippet
    result.status = this.extractStatus(email.subject + ' ' + (email.snippet || ''));

    // Parse portal from sender domain
    result.portal = this.extractPortal(email.from);

    // Extract company name
    result.company = this.extractCompany(email.subject, email.snippet, email.from);

    // Extract position
    result.position = this.extractPosition(email.subject, email.snippet);

    // Extract external reference (application ID, etc.)
    result.externalRef = this.extractExternalRef(email.subject, email.snippet);

    // Extract application date (if "application received" type email)
    if (result.status === 'PENDING' || result.status === 'APPLIED') {
      result.dateApplied = email.timestamp;
    }

    return result;
  }

  extractStatus(text) {
    for (const [status, patterns] of Object.entries(this.statusPatterns)) {
      for (const pattern of patterns) {
        if (pattern.test(text)) {
          return status;
        }
      }
    }
    
    // Default status if keywords found but no specific pattern matched
    if (/job|position|application|career/i.test(text)) {
      return 'APPLIED';
    }
    
    return null;
  }

  extractPortal(fromAddress) {
    const domain = fromAddress.split('@')[1]?.toLowerCase();
    
    for (const [domainPattern, portal] of Object.entries(this.companyDomainMap)) {
      if (domain?.includes(domainPattern)) {
        return portal;
      }
    }
    
    return 'OTHER';
  }

  extractCompany(subject, snippet, fromAddress) {
    const text = `${subject} ${snippet || ''}`;
    
    // Try to extract from structured emails
    const companyMatch = text.match(/company:\s*([^\\n,]+)/i);
    if (companyMatch) {
      return companyMatch[1].trim();
    }

    // Extract from domain for common job sites
    const domain = fromAddress.split('@')[1]?.toLowerCase();
    
    // For greenhouse.io emails, company is often in subdomain
    if (domain?.includes('greenhouse.io')) {
      const subdomain = fromAddress.split('@')[1]?.split('.')[0];
      if (subdomain && subdomain !== 'greenhouse') {
        return this.titleCase(subdomain);
      }
    }

    // For lever.co emails
    if (domain?.includes('lever.co')) {
      const leverMatch = fromAddress.match(/jobs@([^.]+)\\.lever\\.co/);
      if (leverMatch) {
        return this.titleCase(leverMatch[1]);
      }
    }

    // Extract company name from subject line patterns
    const subjectCompanyPatterns = [
      /application.*at\s+([^\\n,]+)/i,
      /position.*at\s+([^\\n,]+)/i,
      /opportunity.*at\s+([^\\n,]+)/i,
      /([A-Z][a-zA-Z\s&]+)\s+(?:team|opportunity|position)/i
    ];

    for (const pattern of subjectCompanyPatterns) {
      const match = subject.match(pattern);
      if (match && match[1].length > 2 && match[1].length < 50) {
        return match[1].trim();
      }
    }

    return null;
  }

  extractPosition(subject, snippet) {
    const text = `${subject} ${snippet || ''}`;
    
    // Try structured extraction
    const positionMatch = text.match(/position:\s*([^\\n,]+)/i);
    if (positionMatch) {
      return positionMatch[1].trim();
    }

    // Common job title patterns
    const titlePatterns = [
      /(?:for|as)\s+(software\s+(?:engineer|developer|architect))/i,
      /(?:for|as)\s+(frontend\s+(?:engineer|developer))/i,
      /(?:for|as)\s+(backend\s+(?:engineer|developer))/i,
      /(?:for|as)\s+(full\s*stack\s+(?:engineer|developer))/i,
      /(?:for|as)\s+(data\s+(?:scientist|engineer|analyst))/i,
      /(?:for|as)\s+(product\s+manager)/i,
      /(?:for|as)\s+(senior\s+[^\\n,]+)/i,
      /(?:for|as)\s+(junior\s+[^\\n,]+)/i,
      /role:\s*([^\\n,]+)/i
    ];

    for (const pattern of titlePatterns) {
      const match = text.match(pattern);
      if (match && match[1].length > 2 && match[1].length < 100) {
        return match[1].trim();
      }
    }

    return null;
  }

  extractExternalRef(subject, snippet) {
    const text = `${subject} ${snippet || ''}`;
    
    // Common application ID patterns
    const refPatterns = [
      /application\s+(?:id|#):\s*([A-Za-z0-9-_]+)/i,
      /reference\s+(?:id|#):\s*([A-Za-z0-9-_]+)/i,
      /job\s+(?:id|#):\s*([A-Za-z0-9-_]+)/i,
      /#([A-Za-z0-9-_]{6,})/,
      /id:\s*([A-Za-z0-9-_]{6,})/i
    ];

    for (const pattern of refPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    return null;
  }

  titleCase(str) {
    return str.replace(/\\w\\S*/g, (txt) => 
      txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    );
  }

  // Method to check if email is job-related
  isJobRelatedEmail(subject, fromAddress, snippet) {
    const jobKeywords = [
      'application', 'interview', 'position', 'job', 'career', 
      'opportunity', 'hiring', 'recruitment', 'offer', 'candidate'
    ];

    const text = `${subject} ${snippet || ''}`.toLowerCase();
    const hasJobKeywords = jobKeywords.some(keyword => text.includes(keyword));

    // Check if from a known job portal
    const isFromJobPortal = Object.keys(this.companyDomainMap).some(domain => 
      fromAddress.toLowerCase().includes(domain)
    );

    // Check for common job-related domains
    const jobDomains = [
      'noreply', 'jobs', 'careers', 'hr', 'recruiting', 'talent', 'hiring'
    ];
    const isFromJobDomain = jobDomains.some(domain => 
      fromAddress.toLowerCase().includes(domain)
    );

    return hasJobKeywords || isFromJobPortal || isFromJobDomain;
  }
}