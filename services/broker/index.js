// Neural Creator Node.js Broker with 0G Integration
// This service handles 0G Storage, Compute, and social data management

const express = require('express');
const cors = require('cors');
const { ethers } = require('ethers');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
require('dotenv').config();

// 0G SDK Imports
const { ZGStorage } = require('@0glabs/0g-ts-sdk');
const { createZGComputeNetworkBroker } = require('@0glabs/0g-serving-broker');

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// 0G Configuration
const config = {
  rpcUrl: process.env.OG_RPC_URL || 'https://evmrpc-testnet.0g.ai',
  storageUrl: process.env.OG_STORAGE_URL || 'https://storage-testnet.0g.ai',
  computeUrl: process.env.OG_COMPUTE_URL || 'https://compute-testnet.0g.ai',
  privateKey: process.env.PRIVATE_KEY,
  contractAddresses: {
    platform: process.env.PLATFORM_CONTRACT_ADDRESS,
    traditionalNFT: process.env.TRADITIONAL_NFT_CONTRACT_ADDRESS,
    inft: process.env.INFT_CONTRACT_ADDRESS
  }
};

// In-memory feed index and interactions
const postsIndex = []; // newest first
const postMetrics = new Map(); // rootHash -> {likes, comments, views}
const postComments = new Map(); // rootHash -> [{id,user,content,createdAt}]
const idToRoot = new Map(); // postId -> rootHash

// Initialize providers and services
let provider, signer, storage, computeBroker;
let platformContract, traditionalNFTContract, inftContract;

async function initializeServices() {
  try {
    // Initialize Ethereum provider and signer
    provider = new ethers.JsonRpcProvider(config.rpcUrl);
    signer = new ethers.Wallet(config.privateKey, provider);
    
    console.log('🔗 Connected to 0G Chain:', await provider.getNetwork());
    console.log('👤 Signer address:', await signer.getAddress());

    // Initialize 0G Storage
    storage = new ZGStorage({
      rpcUrl: config.rpcUrl,
      storageUrl: config.storageUrl,
      signer: signer
    });

    // Initialize 0G Compute Broker
    computeBroker = createZGComputeNetworkBroker({
      signer: signer,
      brokerUrl: config.computeUrl
    });

    // Initialize contracts (contract ABIs would be imported)
    // platformContract = new ethers.Contract(config.contractAddresses.platform, platformABI, signer);

    console.log('✅ 0G Services initialized successfully');

    // Test storage connection
    await testStorageConnection();
    
    // Test compute broker
    await testComputeConnection();

  } catch (error) {
    console.error('❌ Failed to initialize services:', error);
    process.exit(1);
  }
}

async function testStorageConnection() {
  try {
    const testData = JSON.stringify({ test: 'Neural Creator initialization', timestamp: Date.now() });
    const result = await storage.upload(Buffer.from(testData));
    console.log('🗄️  Storage test successful. Root hash:', result.rootHash || result.root || result.hash);
  } catch (error) {
    console.error('Storage test failed:', error);
  }
}

async function testComputeConnection() {
  try {
    // Test compute broker initialization
    if (typeof computeBroker.initialize === 'function') {
      await computeBroker.initialize();
    }
    console.log('🔥 Compute broker initialized');
    
    // Add some credits for testing (implementation may differ)
    if (computeBroker?.ledger?.addLedger) {
      await computeBroker.ledger.addLedger(ethers.parseEther('0.1'));
      console.log('💰 Added compute credits');
    }
  } catch (error) {
    console.error('Compute test failed:', error);
  }
}

// Social Data Management Class
class SocialDataManager {
  constructor(storage) {
    this.storage = storage;
    this.cache = new Map(); // In-memory cache for frequently accessed data
  }

  // Store user profile
  async storeUserProfile(userAddress, profileData) {
    try {
      const data = {
        address: userAddress,
        ...profileData,
        updatedAt: Date.now()
      };

      const buffer = Buffer.from(JSON.stringify(data));
      const result = await this.storage.upload(buffer);
      
      // Cache the result
      this.cache.set(`profile_${userAddress}`, {
        data,
        rootHash: result.rootHash || result.root || result.hash,
        cachedAt: Date.now()
      });

      return {
        success: true,
        rootHash: result.rootHash || result.root || result.hash,
        size: buffer.length
      };
    } catch (error) {
      console.error('Failed to store user profile:', error);
      return { success: false, error: error.message };
    }
  }

  // Store social post
  async storePost(postData) {
    try {
      const data = {
        id: postData.id || Date.now().toString(),
        creator: postData.creator,
        content: postData.content,
        contentType: postData.contentType || 'text',
        mediaHashes: postData.mediaHashes || [], // References to media stored separately
        tags: postData.tags || [],
        mentions: postData.mentions || [],
        aiMetadata: postData.aiMetadata || null, // AI processing receipt
        createdAt: Date.now(),
        metrics: {
          likes: 0,
          comments: 0,
          reposts: 0,
          views: 0
        }
      };

      const buffer = Buffer.from(JSON.stringify(data));
      const result = await this.storage.upload(buffer);

      // Cache full post content by root
      const rootHash = result.rootHash || result.root || result.hash;
      this.cache.set(rootHash, { data, cachedAt: Date.now() });

      return {
        success: true,
        postId: data.id,
        rootHash,
        size: buffer.length
      };
    } catch (error) {
      console.error('Failed to store post:', error);
      return { success: false, error: error.message };
    }
  }

  // Store social interaction (like, comment, etc.)
  async storeInteraction(interactionData) {
    try {
      const data = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        type: interactionData.type, // 'like', 'comment', 'repost'
        user: interactionData.user,
        targetId: interactionData.targetId, // using rootHash for posts
        content: interactionData.content || null, // for comments
        createdAt: Date.now()
      };

      const buffer = Buffer.from(JSON.stringify(data));
      const result = await this.storage.upload(buffer);

      return {
        success: true,
        interactionId: data.id,
        rootHash: result.rootHash || result.root || result.hash,
        size: buffer.length,
        interaction: data
      };
    } catch (error) {
      console.error('Failed to store interaction:', error);
      return { success: false, error: error.message };
    }
  }

  // Retrieve data from storage
  async retrieveData(rootHash) {
    try {
      // Check cache first
      const cached = this.getCachedByHash(rootHash);
      if (cached && Date.now() - cached.cachedAt < 300000) { // 5 minute cache
        return { success: true, data: cached.data, fromCache: true };
      }

      const result = await this.storage.download(rootHash);
      const data = JSON.parse(result.toString());

      // Cache the result
      this.cache.set(rootHash, {
        data,
        cachedAt: Date.now()
      });

      return { success: true, data, fromCache: false };
    } catch (error) {
      console.error('Failed to retrieve data:', error);
      return { success: false, error: error.message };
    }
  }

  getCachedByHash(rootHash) {
    return this.cache.get(rootHash);
  }

  // Store media content (images, videos)
  async storeMediaContent(fileBuffer, metadata) {
    try {
      const mediaData = {
        ...metadata,
        size: fileBuffer.length,
        uploadedAt: Date.now()
      };

      // Store actual media content
      const mediaResult = await this.storage.upload(fileBuffer);
      
      // Store metadata separately
      const metadataBuffer = Buffer.from(JSON.stringify(mediaData));
      const metadataResult = await this.storage.upload(metadataBuffer);

      return {
        success: true,
        mediaHash: mediaResult.rootHash || mediaResult.root || mediaResult.hash,
        metadataHash: metadataResult.rootHash || metadataResult.root || metadataResult.hash,
        size: fileBuffer.length
      };
    } catch (error) {
      console.error('Failed to store media content:', error);
      return { success: false, error: error.message };
    }
  }
}

// AI Processing Service
class AIProcessingService {
  constructor(computeBroker) {
    this.computeBroker = computeBroker;
  }

  // Generate text content (captions, descriptions, etc.)
  async generateText(prompt, options = {}) {
    try {
      const jobRequest = {
        task: 'text_generation',
        model: options.model || 'llama-3.3-70b-instruct',
        input: {
          prompt: prompt,
          max_tokens: options.maxTokens || 500,
          temperature: options.temperature || 0.7,
          top_p: options.topP || 0.9
        }
      };

      const job = await this.computeBroker.createJob(jobRequest);
      const result = await job.getResult();

      return {
        success: true,
        text: result.output || result.text,
        modelUsed: jobRequest.model,
        tokensUsed: result.tokens_used,
        cost: result.cost,
        receipt: result.receipt // Verification receipt
      };
    } catch (error) {
      console.error('AI text generation failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Content optimization and analysis
  async analyzeContent(content, contentType = 'text') {
    try {
      const prompt = `Analyze this ${contentType} content for engagement potential, sentiment, and suggest improvements: "${content}"`;
      
      const jobRequest = {
        task: 'text_analysis',
        model: 'deepseek-r1-70b',
        input: {
          prompt: prompt,
          content: content,
          analysis_type: ['sentiment', 'engagement', 'optimization']
        }
      };

      const job = await this.computeBroker.createJob(jobRequest);
      const result = await job.getResult();

      return {
        success: true,
        analysis: result.output || result.analysis,
        sentiment: result.sentiment,
        engagementScore: result.engagement_score,
        suggestions: result.suggestions,
        receipt: result.receipt
      };
    } catch (error) {
      console.error('Content analysis failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Find collaboration suggestions
  async findCollaborationMatches(creatorProfile, preferences = {}) {
    try {
      const prompt = `Based on this creator profile: ${JSON.stringify(creatorProfile)}, suggest potential collaboration matches with similar creators. Preferences: ${JSON.stringify(preferences)}`;

      const jobRequest = {
        task: 'recommendation',
        model: 'llama-3.3-70b-instruct',
        input: {
          prompt: prompt,
          profile: creatorProfile,
          preferences: preferences,
          match_criteria: ['style_similarity', 'audience_overlap', 'complementary_skills']
        }
      };

      const job = await this.computeBroker.createJob(jobRequest);
      const result = await job.getResult();

      return {
        success: true,
        matches: result.matches,
        reasoning: result.reasoning,
        confidence: result.confidence,
        receipt: result.receipt
      };
    } catch (error) {
      console.error('Collaboration matching failed:', error);
      return { success: false, error: error.message };
    }
  }
}

// Initialize services
const socialDataManager = new SocialDataManager(null); // Will be initialized after storage
let aiProcessingService;

// API Routes

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: Date.now(),
    services: {
      storage: !!storage,
      compute: !!computeBroker,
      contracts: !!platformContract
    }
  });
});

// User profile management
app.post('/api/users/profile', async (req, res) => {
  try {
    const { userAddress, profileData } = req.body;
    
    if (!userAddress || !profileData) {
      return res.status(400).json({ error: 'Missing userAddress or profileData' });
    }

    const result = await socialDataManager.storeUserProfile(userAddress, profileData);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Profile stored successfully',
        rootHash: result.rootHash,
        storageSize: result.size
      });
    } else {
      res.status(500).json({ error: result.error });
    }
  } catch (error) {
    console.error('Profile storage error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user profile
app.get('/api/users/profile/:address', async (req, res) => {
  try {
    const { address } = req.params;
    
    // In a real implementation, you'd have a mapping of addresses to root hashes
    // For now, we'll simulate this
    const cached = socialDataManager.cache.get(`profile_${address}`);
    
    if (cached) {
      res.json({
        success: true,
        profile: cached.data,
        fromCache: true
      });
    } else {
      res.status(404).json({ error: 'Profile not found' });
    }
  } catch (error) {
    console.error('Profile retrieval error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create social post
app.post('/api/posts', async (req, res) => {
  try {
    const { creator, content, contentType, mediaFiles, tags, aiEnhance } = req.body;
    
    if (!creator || !content) {
      return res.status(400).json({ error: 'Missing creator or content' });
    }

    let processedContent = content;
    let aiMetadata = null;

    // AI enhancement if requested
    if (aiEnhance && aiProcessingService) {
      const enhancement = await aiProcessingService.analyzeContent(content, contentType);
      if (enhancement.success) {
        aiMetadata = {
          originalContent: content,
          analysis: enhancement.analysis,
          sentiment: enhancement.sentiment,
          engagementScore: enhancement.engagementScore,
          suggestions: enhancement.suggestions,
          receipt: enhancement.receipt
        };
      }
    }

    // Handle media files if present
    let mediaHashes = [];
    if (mediaFiles && mediaFiles.length > 0) {
      for (const mediaFile of mediaFiles) {
        const mediaBuffer = Buffer.from(mediaFile.data, 'base64');
        const mediaResult = await socialDataManager.storeMediaContent(mediaBuffer, {
          filename: mediaFile.filename,
          mimeType: mediaFile.mimeType,
          creator: creator
        });
        
        if (mediaResult.success) {
          mediaHashes.push({
            mediaHash: mediaResult.mediaHash,
            metadataHash: mediaResult.metadataHash,
            filename: mediaFile.filename,
            mimeType: mediaFile.mimeType
          });
        }
      }
    }

    const postData = {
      creator,
      content: processedContent,
      contentType,
      mediaHashes,
      tags: tags || [],
      aiMetadata
    };

    const result = await socialDataManager.storePost(postData);
    
    if (result.success) {
      // Update in-memory index
      idToRoot.set(result.postId, result.rootHash);
      postMetrics.set(result.rootHash, { likes: 0, comments: 0, views: 0 });
      postComments.set(result.rootHash, []);
      postsIndex.unshift({
        postId: result.postId,
        rootHash: result.rootHash,
        creator,
        createdAt: Date.now(),
        excerpt: processedContent.slice(0, 180),
        media: mediaHashes
      });
      // cap feed size
      if (postsIndex.length > 500) postsIndex.length = 500;

      res.json({
        success: true,
        message: 'Post created successfully',
        postId: result.postId,
        rootHash: result.rootHash,
        storageSize: result.size,
        aiEnhancement: aiMetadata ? true : false
      });
    } else {
      res.status(500).json({ error: result.error });
    }
  } catch (error) {
    console.error('Post creation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get post
app.get('/api/posts/:rootHash', async (req, res) => {
  try {
    const { rootHash } = req.params;
    const result = await socialDataManager.retrieveData(rootHash);
    
    if (result.success) {
      res.json({
        success: true,
        post: result.data,
        metrics: postMetrics.get(rootHash) || { likes: 0, comments: 0, views: 0 },
        comments: postComments.get(rootHash) || [],
        fromCache: result.fromCache
      });
    } else {
      res.status(404).json({ error: 'Post not found' });
    }
  } catch (error) {
    console.error('Post retrieval error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Feed endpoint (simple in-memory index)
app.get('/api/feed', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit || '20', 10), 50);
    const offset = Math.max(parseInt(req.query.offset || '0', 10), 0);

    const slice = postsIndex.slice(offset, offset + limit);
    const items = await Promise.all(slice.map(async (p) => {
      // Try cached full content
      const cached = socialDataManager.getCachedByHash(p.rootHash);
      const content = cached?.data || null;
      return {
        ...p,
        content,
        metrics: postMetrics.get(p.rootHash) || { likes: 0, comments: 0, views: 0 }
      };
    }));

    res.json({ success: true, items, total: postsIndex.length });
  } catch (error) {
    console.error('Feed error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get comments for a post
app.get('/api/posts/:rootHash/comments', (req, res) => {
  const { rootHash } = req.params;
  res.json({
    success: true,
    comments: postComments.get(rootHash) || []
  });
});

// Social interactions (like, comment)
app.post('/api/interactions', async (req, res) => {
  try {
    const { type, user, targetId, content } = req.body;
    
    if (!type || !user || !targetId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (type === 'comment' && !content) {
      return res.status(400).json({ error: 'Comment content required' });
    }

    const interactionData = { type, user, targetId, content };
    const result = await socialDataManager.storeInteraction(interactionData);
    
    if (result.success) {
      // Update in-memory metrics
      const m = postMetrics.get(targetId) || { likes: 0, comments: 0, views: 0 };
      if (type === 'like') {
        m.likes += 1;
        postMetrics.set(targetId, m);
      } else if (type === 'comment') {
        m.comments += 1;
        postMetrics.set(targetId, m);
        const list = postComments.get(targetId) || [];
        list.unshift({
          id: result.interactionId,
          user,
          content,
          createdAt: Date.now()
        });
        postComments.set(targetId, list.slice(0, 200)); // cap
      }

      res.json({
        success: true,
        message: 'Interaction stored successfully',
        interactionId: result.interactionId,
        rootHash: result.rootHash,
        metrics: postMetrics.get(targetId)
      });
    } else {
      res.status(500).json({ error: result.error });
    }
  } catch (error) {
    console.error('Interaction storage error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// AI text generation endpoint
app.post('/api/ai/generate-text', async (req, res) => {
  try {
    const { prompt, options } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt required' });
    }

    if (!aiProcessingService) {
      return res.status(503).json({ error: 'AI service not available' });
    }

    const result = await aiProcessingService.generateText(prompt, options);
    
    if (result.success) {
      res.json({
        success: true,
        text: result.text,
        metadata: {
          model: result.modelUsed,
          tokensUsed: result.tokensUsed,
          cost: result.cost,
          receipt: result.receipt
        }
      });
    } else {
      res.status(500).json({ error: result.error });
    }
  } catch (error) {
    console.error('AI text generation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Content analysis endpoint
app.post('/api/ai/analyze-content', async (req, res) => {
  try {
    const { content, contentType } = req.body;
    
    if (!content) {
      return res.status(400).json({ error: 'Content required' });
    }

    if (!aiProcessingService) {
      return res.status(503).json({ error: 'AI service not available' });
    }

    const result = await aiProcessingService.analyzeContent(content, contentType);
    
    if (result.success) {
      res.json({
        success: true,
        analysis: result.analysis,
        sentiment: result.sentiment,
        engagementScore: result.engagementScore,
        suggestions: result.suggestions,
        receipt: result.receipt
      });
    } else {
      res.status(500).json({ error: result.error });
    }
  } catch (error) {
    console.error('Content analysis error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Collaboration matching endpoint
app.post('/api/ai/find-collaborators', async (req, res) => {
  try {
    const { creatorProfile, preferences } = req.body;
    
    if (!creatorProfile) {
      return res.status(400).json({ error: 'Creator profile required' });
    }

    if (!aiProcessingService) {
      return res.status(503).json({ error: 'AI service not available' });
    }

    const result = await aiProcessingService.findCollaborationMatches(creatorProfile, preferences);
    
    if (result.success) {
      res.json({
        success: true,
        matches: result.matches,
        reasoning: result.reasoning,
        confidence: result.confidence,
        receipt: result.receipt
      });
    } else {
      res.status(500).json({ error: result.error });
    }
  } catch (error) {
    console.error('Collaboration matching error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Cost analysis endpoint
app.get('/api/analytics/costs', async (req, res) => {
  try {
    // This would calculate actual costs based on usage
    const costAnalysis = {
      storage: {
        totalUploads: socialDataManager.cache.size,
        estimatedCost: calculateStorageCost(),
        pricePerGB: 10, // $10 per TB = $0.01 per GB
      },
      compute: {
        totalRequests: 0, // Would track this
        estimatedCost: 0,
        averageCostPerRequest: 0.01
      },
      comparison: {
        traditionalDB: calculateTraditionalDBCost(),
        ogStorage: calculateStorageCost(),
        recommendation: getRecommendation()
      }
    };

    res.json({
      success: true,
      costAnalysis
    });
  } catch (error) {
    console.error('Cost analysis error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Helper functions for cost calculation
function calculateStorageCost() {
  // Estimate based on typical social media post sizes
  const avgPostSize = 2000; // 2KB per post
  const avgMediaSize = 500000; // 500KB per media file
  const postsCount = 1000; // Example
  const mediaCount = 200; // Example
  
  const totalSize = (postsCount * avgPostSize + mediaCount * avgMediaSize) / (1024 * 1024 * 1024); // Convert to GB
  return totalSize * 0.01; // $0.01 per GB
}

function calculateTraditionalDBCost() {
  // Rough estimate for traditional database hosting
  return 50; // $50/month for medium-scale social app
}

function getRecommendation() {
  const ogCost = calculateStorageCost();
  const traditionalCost = calculateTraditionalDBCost();
  
  if (ogCost < traditionalCost * 0.1) {
    return "0G Storage is highly cost-effective for your use case";
  } else if (ogCost < traditionalCost * 0.5) {
    return "0G Storage offers good value with added decentralization benefits";
  } else {
    return "Consider hybrid approach: 0G DA for high-frequency data, Storage for archival";
  }
}

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// Initialize and start server
async function startServer() {
  try {
    await initializeServices();
    
    // Initialize social data manager with storage
    socialDataManager.storage = storage;
    
    // Initialize AI processing service
    aiProcessingService = new AIProcessingService(computeBroker);
    
    const PORT = process.env.PORT || 3001;
    app.listen(PORT, () => {
      console.log(`🚀 Neural Creator Broker running on port ${PORT}`);
      console.log(`📊 API endpoints:`);
      console.log(`   - Health: GET /health`);
      console.log(`   - Profiles: POST/GET /api/users/profile`);
      console.log(`   - Posts: POST/GET /api/posts`);
      console.log(`   - Feed: GET /api/feed`);
      console.log(`   - Comments: GET /api/posts/:rootHash/comments`);
      console.log(`   - Interactions: POST /api/interactions`);
      console.log(`   - AI Generate: POST /api/ai/generate-text`);
      console.log(`   - AI Analyze: POST /api/ai/analyze-content`);
      console.log(`   - Cost Analysis: GET /api/analytics/costs`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

module.exports = app;