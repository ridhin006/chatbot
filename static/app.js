// Initialize WebSocket connection
let ws = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

function connectWebSocket() {
    if (ws && ws.readyState === WebSocket.OPEN) {
        console.log('WebSocket already connected');
        return;
    }

    console.log('Connecting to WebSocket...');
    try {
        ws = new WebSocket(`ws://${window.location.host}/ws`);
        
        ws.onopen = () => {
            console.log('WebSocket connected successfully');
            reconnectAttempts = 0;
            clearError();
        };
        
        ws.onmessage = (event) => {
            console.log('Received message:', event.data);
            try {
                const data = JSON.parse(event.data);
                console.log('Parsed message data:', data);
                
                // Remove any loading indicators
                const loadingIndicators = document.querySelectorAll('.loading');
                loadingIndicators.forEach(indicator => indicator.remove());
                
                if (data.type === "fact") {
                    console.log('Received fact:', data.data);
                    const factContent = document.querySelector('.fact-content');
                    if (factContent) {
                        factContent.innerHTML = `
                            <div class="flex items-start gap-3">
                                <i class="fas fa-lightbulb text-yellow-400 text-xl flex-shrink-0 mt-1"></i>
                                <div class="flex-1">
                                    ${data.data}
                                </div>
                            </div>
                        `;
                    }
                }
                else if (data.type === "news") {
                    if (!data.data || data.data.length === 0) {
                        showError("No news articles found");
                        return;
                    }
                    displayNews(data.data);
                } else if (data.type === "error") {
                    showError(data.message || "An error occurred");
                } else if (data.type === "fake_news_result") {
                    displayFakeNewsResult(data.data);
                } else {
                    console.log('Unknown message type:', data.type);
                }
            } catch (error) {
                console.error('Error parsing message:', error);
                showError("Error processing server response");
            }
        };
        
        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            showError('Connection error occurred');
        };
        
        ws.onclose = () => {
            console.log('WebSocket disconnected');
            if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
                reconnectAttempts++;
                console.log(`Reconnecting... Attempt ${reconnectAttempts}`);
                setTimeout(connectWebSocket, 1000);
            } else {
                showError('Connection lost. Please refresh the page.');
            }
        };
    } catch (error) {
        console.error('Error creating WebSocket:', error);
        showError('Failed to connect to server');
    }
}

// Show error message
function showError(message) {
    console.error('Error:', message);
    const errorContainer = document.getElementById('errorContainer');
    if (errorContainer) {
        errorContainer.textContent = message;
        errorContainer.classList.remove('hidden');
    }
}

// Clear error messages
function clearError() {
    const errorContainer = document.getElementById('errorContainer');
    if (errorContainer) {
        errorContainer.textContent = '';
        errorContainer.classList.add('hidden');
    }
}

// Display news articles
function displayNews(newsData) {
    console.log('Displaying news articles:', newsData);
    const newsContainer = document.getElementById("newsContainer");
    if (!newsContainer) {
        console.error('News container not found');
        return;
    }

    // Clear existing content
    newsContainer.innerHTML = '';

    if (!newsData || newsData.length === 0) {
        showError("No news articles found for this category");
        return;
    }

    // Create and append news cards
    newsData.forEach(article => {
        try {
            const newsCard = document.createElement('div');
            newsCard.className = 'news-card bg-theme-surface p-4 rounded-lg shadow-md';

            const articleData = {
                title: article.title || 'No title',
                description: article.description || 'No description available',
                url: article.url || '#',
                source: article.source || 'Unknown source',
                image_url: article.image_url || ''
            };

            newsCard.innerHTML = `
                <div class="news-content">
                    <h3 class="news-title text-lg font-semibold mb-2">${articleData.title}</h3>
                    <p class="news-description text-sm mb-4">${articleData.description}</p>
                    <div class="news-meta flex justify-between items-center">
                        <span class="news-source text-sm text-theme-secondary">${articleData.source}</span>
                        <div class="news-actions space-x-2">
                            <a href="${articleData.url}" target="_blank" class="read-more text-theme-accent hover:underline">Read More</a>
                            <button onclick='saveArticle(${JSON.stringify(articleData)})' class="save-btn bg-theme-accent text-white px-3 py-1 rounded hover:bg-theme-accent-hover">Save</button>
                        </div>
                    </div>
                </div>
                ${articleData.image_url ? `
                    <div class="news-image-container mt-4">
                        <img src="${articleData.image_url}" alt="${articleData.title}" class="news-image w-full h-48 object-cover rounded" onerror="this.style.display='none'">
                    </div>
                ` : ''}
            `;
            newsContainer.appendChild(newsCard);
        } catch (error) {
            console.error('Error creating news card:', error);
        }
    });
}

// Display fact
function displayFact(fact) {
    console.log('Displaying fact:', fact);
    // Remove typing indicator
    const typingIndicator = document.querySelector('.loading');
    if (typingIndicator) {
        typingIndicator.parentElement.remove();
    }
    
    // Display fact in chat
    addMessageToChat(`<div class="fact-message">
        <i class="fas fa-lightbulb text-yellow-400 mr-2"></i>
        ${fact}
    </div>`, false, 'bg-theme-surface');
}

// Load news for a category
function loadNews(category) {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
        showError('Not connected to server. Attempting to reconnect...');
        connectWebSocket();
        return;
    }

    try {
        console.log('Loading news for category:', category);
        clearError();

        // Show loading state
        const newsContainer = document.getElementById("newsContainer");
        if (newsContainer) {
            newsContainer.innerHTML = '<div class="loading">Loading news...</div>';
        }

        // Update active category
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.category === category);
        });

        // Send request
        const message = JSON.stringify({ type: 'news', category: category });
        console.log('Sending message:', message);
        ws.send(message);

    } catch (error) {
        console.error('Error loading news:', error);
        showError('Failed to load news. Please try again.');
    }
}

// Initialize when the page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('Page loaded, initializing...');
    
    // Initialize theme
    initializeTheme();
    
    // Theme toggle button
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
    
    // Connect WebSocket
    connectWebSocket();
    
    // Category buttons
    document.querySelectorAll('.category-btn').forEach(button => {
        button.addEventListener('click', () => {
            const category = button.dataset.category;
            console.log('Category clicked:', category);
            loadNews(category);
        });
    });
    
    console.log('Setting up fact button handler');
    const factButton = document.getElementById('getFact');
    if (factButton) {
        console.log('Found fact button, adding click listener');
        factButton.addEventListener('click', getFact);
    } else {
        console.error('Fact button not found in DOM');
    }
    
    // Send button
    const sendButton = document.getElementById('send-button');
    if (sendButton) {
        sendButton.addEventListener('click', handleUserInput);
    }
    
    // Enter key in input
    const userInput = document.getElementById('user-input');
    if (userInput) {
        userInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleUserInput();
            }
        });
    }
    
    updateSavedArticlesList();
});

// Article interaction functions
function estimateReadingTime(text) {
    const wordsPerMinute = 200;
    const words = text.trim().split(/\s+/).length;
    const minutes = Math.ceil(words / wordsPerMinute);
    return minutes;
}

function updateSavedArticlesList() {
    const savedArticlesContainer = document.getElementById('saved-articles');
    const noSavedArticles = document.getElementById('no-saved-articles');
    
    try {
        const savedArticles = JSON.parse(localStorage.getItem('savedArticles') || '[]');
        
        if (savedArticles.length === 0) {
            if (noSavedArticles) {
                noSavedArticles.style.display = 'block';
            }
            if (savedArticlesContainer) {
                savedArticlesContainer.innerHTML = '';
            }
            return;
        }
        
        if (noSavedArticles) {
            noSavedArticles.style.display = 'none';
        }
        
        if (savedArticlesContainer) {
            const articlesHTML = savedArticles.map(article => `
                <div class="saved-article">
                    <div class="title">${article.title}</div>
                    <div class="actions">
                        <a href="${article.url}" target="_blank" class="read-link">Read →</a>
                        <button onclick="removeArticle('${article.url}')" class="remove-btn">Remove</button>
                    </div>
                </div>
            `).join('');
            
            savedArticlesContainer.innerHTML = articlesHTML;
        }
    } catch (error) {
        console.error('Error updating saved articles list:', error);
        if (savedArticlesContainer) {
            savedArticlesContainer.innerHTML = '<div class="text-red-500">Error loading saved articles</div>';
        }
    }
}

function saveArticle(article) {
    try {
        // Get current saved articles
        const savedArticlesString = localStorage.getItem('savedArticles');
        let savedArticles = [];
        
        if (savedArticlesString) {
            savedArticles = JSON.parse(savedArticlesString);
            if (!Array.isArray(savedArticles)) {
                savedArticles = [];
            }
        }
        
        // Check if article is already saved
        const isDuplicate = savedArticles.some(saved => saved.url === article.url);
        
        if (!isDuplicate) {
            // Add new article to the beginning of the array
            savedArticles.unshift(article);
            
            // Save back to localStorage
            localStorage.setItem('savedArticles', JSON.stringify(savedArticles));
            
            // Update the UI
            updateSavedArticlesList();
            showToast('Article saved!');
        } else {
            showToast('Article already saved');
        }
    } catch (error) {
        console.error('Error saving article:', error);
        showToast('Failed to save article');
    }
}

function removeArticle(url) {
    try {
        // Get current saved articles
        const savedArticlesString = localStorage.getItem('savedArticles');
        let savedArticles = [];
        
        if (savedArticlesString) {
            savedArticles = JSON.parse(savedArticlesString);
            if (!Array.isArray(savedArticles)) {
                savedArticles = [];
            }
        }
        
        // Filter out the article to remove
        savedArticles = savedArticles.filter(article => article.url !== url);
        
        // Save back to localStorage
        localStorage.setItem('savedArticles', JSON.stringify(savedArticles));
        
        // Update the UI
        updateSavedArticlesList();
        showToast('Article removed');
    } catch (error) {
        console.error('Error removing article:', error);
        showToast('Failed to remove article');
    }
}

function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 2000);
    }, 100);
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showToast('Link copied to clipboard!');
    }).catch(() => {
        showToast('Failed to copy link');
    });
}

function shareArticle(platform, article) {
    const text = encodeURIComponent(article.title);
    const url = encodeURIComponent(article.url);
    let shareUrl = '';
    
    switch(platform) {
        case 'twitter':
            shareUrl = `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
            break;
        case 'facebook':
            shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
            break;
        case 'linkedin':
            shareUrl = `https://www.linkedin.com/shareArticle?mini=true&url=${url}&title=${text}`;
            break;
    }
    
    window.open(shareUrl, '_blank', 'width=600,height=400');
}

function toggleReaction(articleId, type) {
    const key = `reaction_${articleId}`;
    const currentReaction = localStorage.getItem(key);
    const reactionBtn = document.querySelector(`#${type}_${articleId}`);
    const oppositeBtn = document.querySelector(`#${type === 'like' ? 'dislike' : 'like'}_${articleId}`);
    
    if (currentReaction === type) {
        localStorage.removeItem(key);
        reactionBtn.classList.remove('active');
    } else {
        localStorage.setItem(key, type);
        reactionBtn.classList.add('active');
        oppositeBtn?.classList.remove('active');
    }
}

// Theme handling
function initializeTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(savedTheme);
}

function setTheme(theme) {
    const body = document.body;
    const lightIcon = document.querySelector('.theme-light-icon');
    const darkIcon = document.querySelector('.theme-dark-icon');
    
    body.classList.remove('theme-light', 'theme-dark');
    body.classList.add(`theme-${theme}`);
    
    // Toggle icons
    if (theme === 'light') {
        lightIcon.classList.add('hidden');
        darkIcon.classList.remove('hidden');
    } else {
        lightIcon.classList.remove('hidden');
        darkIcon.classList.add('hidden');
    }
    
    localStorage.setItem('theme', theme);
}

function toggleTheme() {
    const currentTheme = document.body.classList.contains('theme-light') ? 'dark' : 'light';
    setTheme(currentTheme);
}

// Debounce function to prevent multiple rapid calls
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Track loading state
let isLoading = false;

// Track current request type
let currentRequestType = null;

async function fetchNews(category) {
    if (isLoading) return; // Prevent multiple simultaneous requests
    
    try {
        isLoading = true;
        currentRequestType = 'news';
        showLoadingState();
        clearError(); // Clear any existing errors
        
        const response = await fetch(`/api/news/${category}`);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        
        const news = await response.json();
        if (Array.isArray(news) && news.length > 0) {
            displayNewsInChat(news);
        } else {
            showError('No news found for this category. Please try another category.');
        }
    } catch (error) {
        console.error('Error fetching news:', error);
        if (currentRequestType === 'news') {
            showError('Failed to load news. Please try again.');
        }
    } finally {
        isLoading = false;
        hideLoadingState();
    }
}

function getFact() {
    console.log('getFact function called');
    
    if (!ws) {
        console.error('WebSocket is null');
        showError('Not connected to server');
        connectWebSocket();
        return;
    }
    
    if (ws.readyState !== WebSocket.OPEN) {
        console.error('WebSocket not open, current state:', ws.readyState);
        showError('Not connected to server. Attempting to reconnect...');
        connectWebSocket();
        return;
    }

    console.log('Getting fact...');
    
    try {
        // Show loading indicator in fact container
        const factContent = document.querySelector('.fact-content');
        if (factContent) {
            factContent.innerHTML = '<div class="loading">Getting an interesting fact...</div>';
        }

        // Send fact request
        const request = {
            type: 'fact_request'
        };
        console.log('Sending fact request:', request);
        ws.send(JSON.stringify(request));
    } catch (error) {
        console.error('Error sending fact request:', error);
        showError('Failed to request fact');
    }
}

// Loading state management
function showLoadingState() {
    const buttons = document.querySelectorAll('.category-btn');
    buttons.forEach(btn => {
        btn.disabled = true;
        btn.classList.add('opacity-50');
    });
    
    const chatMessages = document.getElementById('chat-messages');
    const loadingMsg = document.createElement('div');
    loadingMsg.id = 'loading-message';
    loadingMsg.className = 'bot-message';
    loadingMsg.innerHTML = '<div class="loading"></div><div class="text-sm mt-2">Loading news...</div>';
    chatMessages.appendChild(loadingMsg);
}

function hideLoadingState() {
    const buttons = document.querySelectorAll('.category-btn');
    buttons.forEach(btn => {
        btn.disabled = false;
        btn.classList.remove('opacity-50');
    });
    
    const loadingMsg = document.getElementById('loading-message');
    if (loadingMsg) {
        loadingMsg.remove();
    }
}

function displayNewsInChat(news) {
    const chatMessages = document.getElementById('chat-messages');
    
    // Clear previous news articles
    const existingMessages = chatMessages.querySelectorAll('.news-card');
    existingMessages.forEach(msg => msg.remove());
    
    if (!Array.isArray(news) || news.length === 0) {
        addMessageToChat('No news articles found for this category.');
        return;
    }
    
    news.forEach(article => {
        const readingTime = estimateReadingTime(article.description || '');
        const messageDiv = document.createElement('div');
        messageDiv.className = 'news-card bot-message';
        
        messageDiv.innerHTML = `
            <div class="news-content">
                <h3 class="text-lg font-semibold mb-2">${article.title}</h3>
                <p class="mb-2">${article.description || 'No description available'}</p>
                <div class="flex items-center justify-between text-sm">
                    <span>${readingTime} min read</span>
                    <div class="space-x-2">
                        <button onclick="saveArticle({
                            title: '${article.title.replace(/'/g, "\\'")}',
                            url: '${article.url}',
                            description: '${(article.description || '').replace(/'/g, "\\'")}'
                        })" class="save-btn">
                            Save
                        </button>
                        <a href="${article.url}" target="_blank" class="read-more-btn">
                            Read More
                        </a>
                    </div>
                </div>
            </div>
        `;
        
        chatMessages.appendChild(messageDiv);
    });
    
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function displayFactInChat(fact) {
    if (!fact) return;
    
    // Display in fact container
    const factContainer = document.getElementById('factContainer');
    const factContent = factContainer.querySelector('.fact-content');
    
    if (factContent) {
        factContent.textContent = fact;
        factContainer.classList.remove('hidden');
    }
    
    // Display in chat
    addMessageToChat(`Did you know? ${fact}`, false, 'fact-message');
}

function addMessageToChat(message, isUser = false, className = '') {
    console.log('Adding message to chat:', { message, isUser, className });
    
    const chatMessages = document.getElementById('chat-messages');
    if (!chatMessages) {
        console.error('Chat messages container not found');
        return;
    }
    
    // Create message container
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user-message' : 'bot-message'} ${className}`;
    messageDiv.innerHTML = message;
    
    // Add message to chat
    chatMessages.appendChild(messageDiv);
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
    console.log('Scrolled to bottom:', chatMessages.scrollHeight);
}

function displayFakeNewsResult(result) {
    const className = result.prediction.toLowerCase() === 'real' ? 'text-green-400' : 'text-red-400';
    const message = `
        <div>
            <p class="font-bold ${className} mb-2">Prediction: ${result.prediction}</p>
            <p>Confidence: ${(result.confidence * 100).toFixed(1)}%</p>
            <p class="text-sm mt-2">${result.message}</p>
        </div>
    `;
    addMessageToChat(message);
}

function displayDebateResponse(response) {
    addMessageToChat(response);
}

function handleUserInput() {
    const input = document.getElementById('user-input');
    const text = input.value.trim();
    
    if (!text) return;
    
    // Add user message to chat
    addMessageToChat(text, true);
    
    // Clear input
    input.value = '';
    
    // Show typing indicator
    const typingIndicator = '<div class="loading"></div>';
    addMessageToChat(typingIndicator);
    
    // Check if it's a "Do you know" query
    if (text.toLowerCase().includes('do you know')) {
        console.log('Sending fact request:', text);
        ws.send(JSON.stringify({
            type: 'fact_request',
            text: text
        }));
    } else {
        // Send message to server for fake news check
        console.log('Sending fake news check:', text);
        ws.send(JSON.stringify({
            type: 'fake_news_check',
            text: text
        }));
    }
}

function lazyLoadImages() {
    const images = document.querySelectorAll('.news-image');
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                observer.unobserve(img);
            }
        });
    });
    
    images.forEach(img => {
        img.dataset.src = img.src;
        img.src = '/static/images/placeholder.jpg';
        imageObserver.observe(img);
    });
}

// Debounced event handlers
const debouncedFetchNews = debounce(fetchNews, 300);
const debouncedSaveArticle = debounce(saveArticle, 300);
const debouncedRemoveArticle = debounce(removeArticle, 300);
