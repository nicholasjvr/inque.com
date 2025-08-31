// Tools Filter System for Vibe-coders Platform
// This module handles filtering and categorization of development tools

class ToolsFilterManager {
  constructor() {
    this.currentCategory = 'ai-ides';
    this.tools = new Map();
    this.categories = ['ai-ides', 'design', 'productivity', 'templates'];
    
    console.log("[TOOLS FILTER] Tools Filter Manager initialized");
  }

  async init() {
    try {
      this.loadToolsData();
      this.setupFilterButtons();
      this.setupSearchFunctionality();
      this.setupToolCards();
      
      console.log("[TOOLS FILTER] Tools filter system ready");
    } catch (error) {
      console.error("[TOOLS FILTER] Failed to initialize tools filter", error);
    }
  }

  loadToolsData() {
    // Define tools data structure
    this.tools = new Map([
      ['cursor', {
        name: 'Cursor',
        category: 'ai-ides',
        description: 'AI-powered code editor with GPT-4 integration for intelligent code completion and assistance.',
        icon: '⚡',
        rating: 4.8,
        url: 'https://cursor.sh',
        tags: ['AI', 'Code Editor', 'GPT-4', 'Popular'],
        features: ['Code Completion', 'AI Chat', 'Refactoring', 'Debugging']
      }],
      ['bolt', {
        name: 'Bolt',
        category: 'ai-ides',
        description: 'Lightning-fast AI development environment for building full-stack apps in minutes.',
        icon: '🚀',
        rating: 4.6,
        url: 'https://bolt.dev',
        tags: ['AI', 'Full Stack', 'Fast', 'Hot'],
        features: ['Rapid Development', 'AI Assistance', 'Full Stack', 'Deployment']
      }],
      ['claude-code', {
        name: 'Claude Code',
        category: 'ai-ides',
        description: 'Anthropic\'s AI coding assistant that understands your codebase and helps you build better software.',
        icon: '🤖',
        rating: 4.7,
        url: 'https://claude.ai',
        tags: ['AI', 'Coding Assistant', 'Anthropic', 'Trending'],
        features: ['Code Understanding', 'Refactoring', 'Documentation', 'Testing']
      }],
      ['figma', {
        name: 'Figma',
        category: 'design',
        description: 'Collaborative design tool for creating interfaces, prototypes, and design systems.',
        icon: '🎨',
        rating: 4.9,
        url: 'https://figma.com',
        tags: ['Design', 'Collaboration', 'Prototyping', 'Essential'],
        features: ['Design System', 'Prototyping', 'Collaboration', 'Developer Handoff']
      }],
      ['canva', {
        name: 'Canva',
        category: 'design',
        description: 'Easy-to-use design tool for creating graphics, presentations, and marketing materials.',
        icon: '📐',
        rating: 4.5,
        url: 'https://canva.com',
        tags: ['Design', 'Graphics', 'Easy', 'Popular'],
        features: ['Templates', 'Graphics', 'Presentations', 'Marketing']
      }],
      ['notion', {
        name: 'Notion',
        category: 'productivity',
        description: 'All-in-one workspace for notes, docs, and project management with powerful databases.',
        icon: '📝',
        rating: 4.8,
        url: 'https://notion.so',
        tags: ['Productivity', 'Notes', 'Database', 'Powerful'],
        features: ['Notes', 'Databases', 'Project Management', 'Collaboration']
      }],
      ['perplexity', {
        name: 'Perplexity',
        category: 'productivity',
        description: 'AI-powered search engine that provides comprehensive answers with sources.',
        icon: '🔍',
        rating: 4.6,
        url: 'https://perplexity.ai',
        tags: ['AI', 'Search', 'Research', 'AI-Powered'],
        features: ['AI Search', 'Sources', 'Research', 'Answers']
      }],
      ['react-boilerplate', {
        name: 'React Boilerplate',
        category: 'templates',
        description: 'Production-ready React application template with modern tooling and best practices.',
        icon: '📦',
        rating: 4.7,
        url: 'https://github.com/react-boilerplate/react-boilerplate',
        tags: ['React', 'Template', 'Production', 'Downloads: 2.3K'],
        features: ['React', 'TypeScript', 'Testing', 'CI/CD']
      }],
      ['nextjs-starter', {
        name: 'Next.js Starter',
        category: 'templates',
        description: 'Full-stack Next.js application with authentication, database, and deployment ready.',
        icon: '🚀',
        rating: 4.6,
        url: 'https://github.com/vercel/nextjs-starter',
        tags: ['Next.js', 'Full Stack', 'Auth', 'Downloads: 1.8K'],
        features: ['Next.js', 'Authentication', 'Database', 'Deployment']
      }]
    ]);

    console.log("[TOOLS FILTER] Tools data loaded", { count: this.tools.size });
  }

  setupFilterButtons() {
    const filterButtons = document.querySelectorAll('.tool-category');
    
    filterButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        const category = button.dataset.category;
        this.filterByCategory(category);
        
        // Update active state
        filterButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        
        this.currentCategory = category;
        console.log(`[TOOLS FILTER] Filtered to category: ${category}`);
      });
    });

    console.log("[TOOLS FILTER] Filter buttons configured");
  }

  setupSearchFunctionality() {
    // Add search input if it doesn't exist
    const toolsSection = document.getElementById('tools-section');
    if (toolsSection && !document.getElementById('toolsSearch')) {
      const searchContainer = document.createElement('div');
      searchContainer.style.cssText = 'margin-bottom: 24px; text-align: center;';
      searchContainer.innerHTML = `
        <input 
          type="text" 
          id="toolsSearch" 
          class="neo-input" 
          placeholder="Search tools..." 
          style="width: 100%; max-width: 400px;"
        >
      `;
      
      toolsSection.querySelector('.neo-section > div').insertBefore(
        searchContainer, 
        toolsSection.querySelector('.neo-section > div').firstChild
      );

      // Setup search functionality
      const searchInput = document.getElementById('toolsSearch');
      searchInput.addEventListener('input', (e) => {
        this.searchTools(e.target.value);
      });
    }
  }

  setupToolCards() {
    // Update tool cards with enhanced functionality
    const toolCards = document.querySelectorAll('.tool-card');
    
    toolCards.forEach(card => {
      const toolId = this.getToolIdFromCard(card);
      if (toolId && this.tools.has(toolId)) {
        this.enhanceToolCard(card, this.tools.get(toolId));
      }
    });
  }

  getToolIdFromCard(card) {
    // Extract tool ID from card data or class
    const toolName = card.querySelector('h3')?.textContent?.toLowerCase();
    if (toolName) {
      return toolName.replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    }
    return null;
  }

  enhanceToolCard(card, toolData) {
    // Add tool data attributes
    card.dataset.toolId = toolData.name.toLowerCase().replace(/\s+/g, '-');
    card.dataset.categories = toolData.category;
    card.dataset.tags = toolData.tags.join(' ');
    
    // Add rating display
    const ratingElement = card.querySelector('.rating');
    if (!ratingElement && toolData.rating) {
      const ratingContainer = document.createElement('div');
      ratingContainer.className = 'tool-rating';
      ratingContainer.innerHTML = `
        <span style="color: var(--accent-neon);">⭐ ${toolData.rating}/5</span>
      `;
      card.appendChild(ratingContainer);
    }
    
    // Add features list
    if (toolData.features && !card.querySelector('.tool-features')) {
      const featuresContainer = document.createElement('div');
      featuresContainer.className = 'tool-features';
      featuresContainer.style.cssText = 'margin-top: 12px; font-size: 0.8rem; color: var(--text-secondary);';
      featuresContainer.innerHTML = `
        <strong>Features:</strong> ${toolData.features.slice(0, 3).join(', ')}${toolData.features.length > 3 ? '...' : ''}
      `;
      card.appendChild(featuresContainer);
    }
  }

  filterByCategory(category) {
    const toolCards = document.querySelectorAll('.tool-card');
    
    toolCards.forEach(card => {
      const cardCategories = card.dataset.categories?.split(' ') || [];
      if (cardCategories.includes(category)) {
        card.style.display = 'block';
        card.style.animation = 'fadeIn 0.3s ease-in';
      } else {
        card.style.display = 'none';
      }
    });
    
    // Update category title
    this.updateCategoryTitle(category);
  }

  searchTools(query) {
    const toolCards = document.querySelectorAll('.tool-card');
    const searchTerm = query.toLowerCase();
    
    toolCards.forEach(card => {
      const toolName = card.querySelector('h3')?.textContent?.toLowerCase() || '';
      const toolDesc = card.querySelector('p')?.textContent?.toLowerCase() || '';
      const toolTags = card.dataset.tags?.toLowerCase() || '';
      
      const matches = toolName.includes(searchTerm) || 
                     toolDesc.includes(searchTerm) || 
                     toolTags.includes(searchTerm);
      
      if (matches) {
        card.style.display = 'block';
        card.style.animation = 'fadeIn 0.3s ease-in';
      } else {
        card.style.display = 'none';
      }
    });
    
    console.log(`[TOOLS FILTER] Search results for: "${query}"`);
  }

  updateCategoryTitle(category) {
    const categoryTitles = {
      'ai-ides': 'AI IDEs',
      'design': 'Design Tools',
      'productivity': 'Productivity Tools',
      'templates': 'Templates & Boilerplates'
    };
    
    const titleElement = document.querySelector('#tools-section h2');
    if (titleElement) {
      titleElement.innerHTML = `🛠️ ${categoryTitles[category] || 'TOOLS'}`;
    }
  }

  // Public methods
  getToolsByCategory(category) {
    return Array.from(this.tools.values()).filter(tool => tool.category === category);
  }

  getToolByName(name) {
    return Array.from(this.tools.values()).find(tool => 
      tool.name.toLowerCase() === name.toLowerCase()
    );
  }

  addTool(toolData) {
    const toolId = toolData.name.toLowerCase().replace(/\s+/g, '-');
    this.tools.set(toolId, toolData);
    console.log(`[TOOLS FILTER] Added tool: ${toolData.name}`);
  }

  removeTool(toolName) {
    const toolId = toolName.toLowerCase().replace(/\s+/g, '-');
    this.tools.delete(toolId);
    console.log(`[TOOLS FILTER] Removed tool: ${toolName}`);
  }

  getCurrentCategory() {
    return this.currentCategory;
  }

  getToolsCount() {
    return this.tools.size;
  }
}

// Create and export singleton instance
const toolsFilterManager = new ToolsFilterManager();

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  toolsFilterManager.init();
});

export default toolsFilterManager;
