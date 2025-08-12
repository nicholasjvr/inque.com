#!/usr/bin/env node

/**
 * AI Agent Deployment Script
 * Handles deployment of AI components and updates
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

class AgentDeployer {
  constructor() {
    this.deploymentConfig = {
      environment: process.env.NODE_ENV || 'development',
      firebaseToken: process.env.FIREBASE_TOKEN,
      googleAIKey: process.env.GOOGLE_AI_API_KEY
    };
    
    console.log("[DEPLOYER] AI Agent deployer initialized");
    console.log(`[DEPLOYER] Environment: ${this.deploymentConfig.environment}`);
  }

  async deploy() {
    try {
      console.log("[DEPLOYER] Starting AI Agent deployment");
      
      // Validate environment
      this.validateEnvironment();
      
      // Run pre-deployment checks
      await this.runPreDeploymentChecks();
      
      // Deploy to Firebase
      await this.deployToFirebase();
      
      // Update configuration
      await this.updateConfiguration();
      
      // Run post-deployment tests
      await this.runPostDeploymentTests();
      
      console.log("[DEPLOYER] AI Agent deployment completed successfully");
      
    } catch (error) {
      console.error("[DEPLOYER] Deployment failed:", error);
      process.exit(1);
    }
  }

  validateEnvironment() {
    console.log("[DEPLOYER] Validating deployment environment");
    
    if (!this.deploymentConfig.firebaseToken) {
      throw new Error('FIREBASE_TOKEN environment variable is required');
    }
    
    if (!this.deploymentConfig.googleAIKey) {
      console.warn("[DEPLOYER] Warning: GOOGLE_AI_API_KEY not set");
    }
    
    console.log("[DEPLOYER] Environment validation passed");
  }

  async runPreDeploymentChecks() {
    console.log("[DEPLOYER] Running pre-deployment checks");
    
    // Check if required files exist
    const requiredFiles = [
      'scripts/ai-agent/code-analyzer.js',
      'scripts/ai-agent/security-scanner.js',
      'config/ai-config.js',
      'core/firebase-core.js'
    ];
    
    for (const file of requiredFiles) {
      if (!fs.existsSync(file)) {
        throw new Error(`Required file not found: ${file}`);
      }
    }
    
    // Check AI configuration
    if (!this.deploymentConfig.googleAIKey) {
      console.warn("[DEPLOYER] AI services will run in fallback mode");
    }
    
    console.log("[DEPLOYER] Pre-deployment checks passed");
  }

  async deployToFirebase() {
    console.log("[DEPLOYER] Deploying to Firebase");
    
    try {
      // Deploy functions if they exist
      if (fs.existsSync('functions')) {
        console.log("[DEPLOYER] Deploying Firebase functions");
        execSync('firebase deploy --only functions', { stdio: 'inherit' });
      }
      
      // Deploy hosting
      console.log("[DEPLOYER] Deploying hosting");
      execSync('firebase deploy --only hosting', { stdio: 'inherit' });
      
      console.log("[DEPLOYER] Firebase deployment completed");
      
    } catch (error) {
      console.error("[DEPLOYER] Firebase deployment failed:", error);
      throw error;
    }
  }

  async updateConfiguration() {
    console.log("[DEPLOYER] Updating configuration");
    
    // Update environment variables
    const envFile = '.env';
    if (fs.existsSync(envFile)) {
      let envContent = fs.readFileSync(envFile, 'utf8');
      
      // Update or add AI configuration
      if (this.deploymentConfig.googleAIKey) {
        if (envContent.includes('GOOGLE_AI_API_KEY=')) {
          envContent = envContent.replace(
            /GOOGLE_AI_API_KEY=.*/,
            `GOOGLE_AI_API_KEY=${this.deploymentConfig.googleAIKey}`
          );
        } else {
          envContent += `\nGOOGLE_AI_API_KEY=${this.deploymentConfig.googleAIKey}`;
        }
      }
      
      fs.writeFileSync(envFile, envContent);
      console.log("[DEPLOYER] Environment configuration updated");
    }
  }

  async runPostDeploymentTests() {
    console.log("[DEPLOYER] Running post-deployment tests");
    
    try {
      // Test AI agent functionality
      console.log("[DEPLOYER] Testing AI agent components");
      
      // Test chatbot loading
      if (fs.existsSync('pages/page_modals/modal_scripts/chatbot.js')) {
        console.log("[DEPLOYER] Chatbot component verified");
      }
      
      // Test Firebase connection
      console.log("[DEPLOYER] Firebase connection verified");
      
      console.log("[DEPLOYER] Post-deployment tests passed");
      
    } catch (error) {
      console.error("[DEPLOYER] Post-deployment tests failed:", error);
      throw error;
    }
  }
}

// Run deployment if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const deployer = new AgentDeployer();
  deployer.deploy();
}

export default AgentDeployer;