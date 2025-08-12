#!/usr/bin/env node

/**
 * GitHub Issue Creator
 * Creates GitHub issues for critical problems found by AI analysis
 */

import { Octokit } from '@octokit/rest';

class IssueCreator {
  constructor() {
    this.octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN
    });
    
    this.repo = {
      owner: 'nicholasjvr',
      repo: 'nicholasjvr.github.io'
    };
    
    console.log("[ISSUE CREATOR] GitHub issue creator initialized");
  }

  async createIssues(analysisResults) {
    try {
      console.log("[ISSUE CREATOR] Creating GitHub issues for critical problems");
      
      const issues = this.parseAnalysisResults(analysisResults);
      
      for (const issue of issues) {
        await this.createIssue(issue);
      }
      
      console.log(`[ISSUE CREATOR] Created ${issues.length} issues successfully`);
      
    } catch (error) {
      console.error("[ISSUE CREATOR] Error creating issues:", error);
    }
  }

  parseAnalysisResults(results) {
    const issues = [];
    
    // Parse security issues
    if (results.security && results.security.length > 0) {
      for (const securityIssue of results.security) {
        if (securityIssue.severity === 'high' || securityIssue.severity === 'critical') {
          issues.push({
            title: `🚨 Security: ${securityIssue.type} vulnerability in ${securityIssue.file}`,
            body: this.formatSecurityIssueBody(securityIssue),
            labels: ['security', 'high-priority', 'ai-detected']
          });
        }
      }
    }
    
    // Parse code quality issues
    if (results.codeQuality && results.codeQuality.length > 0) {
      for (const qualityIssue of results.codeQuality) {
        if (qualityIssue.severity === 'high' || qualityIssue.severity === 'critical') {
          issues.push({
            title: `🔧 Code Quality: ${qualityIssue.type} issue in ${qualityIssue.file}`,
            body: this.formatQualityIssueBody(qualityIssue),
            labels: ['code-quality', 'high-priority', 'ai-detected']
          });
        }
      }
    }
    
    return issues;
  }

  formatSecurityIssueBody(issue) {
    return `## Security Issue Detected

**File:** \`${issue.file}\`
**Type:** ${issue.type}
**Severity:** ${issue.severity}
**Description:** ${issue.message}

### Details
${issue.details || 'No additional details provided'}

### Recommendations
${issue.suggestion || 'Review and secure this code section'}

### AI Analysis
This issue was automatically detected by our AI-powered security scanner.

---
*Issue created by AI Agent Integration System*
`;
  }

  formatQualityIssueBody(issue) {
    return `## Code Quality Issue Detected

**File:** \`${issue.file}\`
**Type:** ${issue.type}
**Severity:** ${issue.severity}
**Description:** ${issue.message}

### Details
${issue.details || 'No additional details provided'}

### Recommendations
${issue.suggestion || 'Review and improve this code section'}

### AI Analysis
This issue was automatically detected by our AI-powered code analyzer.

---
*Issue created by AI Agent Integration System*
`;
  }

  async createIssue(issueData) {
    try {
      const response = await this.octokit.issues.create({
        ...this.repo,
        title: issueData.title,
        body: issueData.body,
        labels: issueData.labels
      });
      
      console.log(`[ISSUE CREATOR] Created issue #${response.data.number}: ${issueData.title}`);
      return response.data;
      
    } catch (error) {
      console.error(`[ISSUE CREATOR] Failed to create issue: ${issueData.title}`, error);
      throw error;
    }
  }
}

// Run issue creation if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const creator = new IssueCreator();
  
  // For testing, create a sample issue
  const sampleResults = {
    security: [{
      file: 'test.js',
      type: 'xss',
      severity: 'high',
      message: 'Potential XSS vulnerability',
      details: 'User input not properly sanitized',
      suggestion: 'Implement input validation and sanitization'
    }]
  };
  
  creator.createIssues(sampleResults);
}

export default IssueCreator;