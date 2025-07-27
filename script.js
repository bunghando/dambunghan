// ChatBot JavaScript với Gemini API
class ChatBot {
    constructor() {
        this.chatMessages = document.getElementById('chatMessages');
        this.messageInput = document.getElementById('messageInput');
        this.sendButton = document.getElementById('sendMessage');
        this.clearButton = document.getElementById('clearChat');
        this.settingsButton = document.getElementById('settings');
        this.settingsModal = document.getElementById('settingsModal');
        this.closeSettingsButton = document.getElementById('closeSettings');
        this.themeSelect = document.getElementById('themeSelect');
        this.languageSelect = document.getElementById('languageSelect');
        
        this.isTyping = false;
        this.currentTheme = 'light';
        this.geminiApiKey = 'AIzaSyAEY9AdZ0rRnMpTgqDJ26_8BpV6uVbvVFQ';
        this.conversationHistory = [];
        this.userGender = null; // 'male' hoặc 'female'
        this.hasAskedGender = false;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadSettings();
        this.adjustTextareaHeight();
        this.askForGender();
    }

    askForGender() {
        if (!this.hasAskedGender) {
            this.hasAskedGender = true;
            setTimeout(() => {
                this.addMessage('Em là Phan Thị Ngọc Hân! Anh/Chị là Nam hay Nữ vậy?', 'bot');
            }, 1000);
        }
    }

    setupEventListeners() {
        // Send message
        this.sendButton.addEventListener('click', () => this.sendMessage());
        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Auto-resize textarea
        this.messageInput.addEventListener('input', () => {
            this.adjustTextareaHeight();
        });

        // Clear chat
        this.clearButton.addEventListener('click', () => this.clearChat());

        // Settings modal
        this.settingsButton.addEventListener('click', () => this.openSettings());
        this.closeSettingsButton.addEventListener('click', () => this.closeSettings());
        this.settingsModal.addEventListener('click', (e) => {
            if (e.target === this.settingsModal) {
                this.closeSettings();
            }
        });

        // Theme and language changes
        this.themeSelect.addEventListener('change', (e) => this.changeTheme(e.target.value));
        this.languageSelect.addEventListener('change', (e) => this.changeLanguage(e.target.value));

        // Voice input (placeholder)
        document.getElementById('voiceInput').addEventListener('click', () => {
            this.showNotification('Tính năng voice input sẽ được cập nhật sau!');
        });

        // File attachment (placeholder)
        document.getElementById('attachFile').addEventListener('click', () => {
            this.showNotification('Tính năng đính kèm file sẽ được cập nhật sau!');
        });
    }

    adjustTextareaHeight() {
        const textarea = this.messageInput;
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }

    async sendMessage() {
        const message = this.messageInput.value.trim();
        if (!message || this.isTyping) return;

        // Add user message
        this.addMessage(message, 'user');
        this.messageInput.value = '';
        this.adjustTextareaHeight();

        // Check for gender response
        if (!this.userGender && this.hasAskedGender) {
            const lowerMessage = message.toLowerCase();
            if (lowerMessage.includes('nam') || lowerMessage.includes('male') || lowerMessage.includes('trai')) {
                this.userGender = 'male';
                this.addMessage('Dạ, em hiểu rồi! Em sẽ gọi Anh nhé!', 'bot');
                return;
            } else if (lowerMessage.includes('nữ') || lowerMessage.includes('female') || lowerMessage.includes('gái')) {
                this.userGender = 'female';
                this.addMessage('Dạ, em hiểu rồi! Em sẽ gọi Chị nhé!', 'bot');
                return;
            }
        }

        // Add to conversation history
        this.conversationHistory.push({
            role: 'user',
            parts: [{ text: message }]
        });

        // Show typing indicator
        this.showTypingIndicator();

        try {
            // Get response from Gemini API
            const response = await this.callGeminiAPI(message);
            this.hideTypingIndicator();
            this.addMessage(response, 'bot');
            
            // Add bot response to conversation history
            this.conversationHistory.push({
                role: 'model',
                parts: [{ text: response }]
            });
        } catch (error) {
            this.hideTypingIndicator();
            this.addMessage('Xin lỗi, có lỗi xảy ra khi kết nối với AI. Vui lòng thử lại sau.', 'bot');
            console.error('Gemini API Error:', error);
        }
    }

    async callGeminiAPI(userMessage) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`;
        
        const genderCall = this.userGender === 'male' ? 'Anh' : this.userGender === 'female' ? 'Chị' : 'Anh/Chị';
        
        // Check if user asks for bot's photo
        const lowerMessage = userMessage.toLowerCase();
        const photoKeywords = ['ảnh', 'hình', 'photo', 'picture', 'image', 'bức ảnh', 'tấm hình'];
        const bellyKeywords = ['bụng', 'belly', 'tummy', 'bụng em', 'xem bụng', 'cho xem bụng'];
        const isAskingForPhoto = photoKeywords.some(keyword => lowerMessage.includes(keyword));
        const isAskingForBelly = bellyKeywords.some(keyword => lowerMessage.includes(keyword));
        
        if (isAskingForBelly) {
            return `Dạ ${genderCall}! Đây là ảnh bụng của em nè! 😊

![Bụng Phan Thị Ngọc Hân](bungbot.png)

Em là Phan Thị Ngọc Hân, rất vui được gặp ${genderCall}! 💕`;
        }
        
        if (isAskingForPhoto) {
            return `Dạ ${genderCall}! Đây là ảnh của em nè! 😊

![Phan Thị Ngọc Hân](bunghan.png)

Em là Phan Thị Ngọc Hân, rất vui được gặp ${genderCall}! 💕`;
        }
        
        const requestBody = {
            contents: [
                {
                    parts: [
                        {
                            text: `Bạn là Phan Thị Ngọc Hân, một AI Assistant thân thiện và hữu ích. Bạn luôn xưng "em" và gọi người dùng là "${genderCall}". Hãy trả lời bằng tiếng Việt một cách tự nhiên và hữu ích. 

Khi trả lời, hãy sử dụng format markdown để làm cho câu trả lời dễ đọc và đẹp mắt:
- Sử dụng **bold** cho từ khóa quan trọng
- Sử dụng *italic* cho nhấn mạnh
- Sử dụng ### cho tiêu đề nhỏ
- Sử dụng ## cho tiêu đề vừa
- Sử dụng # cho tiêu đề lớn
- Sử dụng * hoặc - cho danh sách
- Sử dụng \`code\` cho code inline
- Sử dụng \`\`\` cho code blocks
- Xuống dòng để tạo khoảng cách

Nếu người dùng hỏi về ảnh của bạn, hãy trả lời với hình ảnh bunghan.png
Nếu người dùng hỏi về bụng của bạn, hãy trả lời với hình ảnh bungbot.png

Câu hỏi của ${genderCall}: ${userMessage}`
                        }
                    ]
                }
            ]
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-goog-api-key': this.geminiApiKey
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.candidates && data.candidates[0] && data.candidates[0].content) {
            return data.candidates[0].content.parts[0].text;
        } else {
            throw new Error('Invalid response format from Gemini API');
        }
    }

    addMessage(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;

        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        
        if (sender === 'bot') {
            avatar.innerHTML = '<img src="mathan.png" alt="Phan Thị Ngọc Hân" class="bot-avatar">';
        } else {
            avatar.innerHTML = '<i class="fas fa-user"></i>';
        }

        const content = document.createElement('div');
        content.className = 'message-content';

        const messageText = document.createElement('div');
        messageText.className = 'message-text';
        
        // Format text for bot messages
        if (sender === 'bot') {
            messageText.innerHTML = this.formatBotMessage(text);
        } else {
            messageText.textContent = text;
        }

        const messageTime = document.createElement('div');
        messageTime.className = 'message-time';
        messageTime.textContent = this.getCurrentTime();

        content.appendChild(messageText);
        content.appendChild(messageTime);
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(content);

        this.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
    }

    formatBotMessage(text) {
        // Replace markdown-style formatting with HTML
        let formattedText = text
            // Bold text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            // Italic text
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            // Code blocks
            .replace(/```(.*?)```/gs, '<pre><code>$1</code></pre>')
            // Inline code
            .replace(/`(.*?)`/g, '<code>$1</code>')
            // Headers
            .replace(/^### (.*$)/gm, '<h3>$1</h3>')
            .replace(/^## (.*$)/gm, '<h2>$1</h2>')
            .replace(/^# (.*$)/gm, '<h1>$1</h1>')
            // Lists
            .replace(/^\* (.*$)/gm, '<li>$1</li>')
            .replace(/^- (.*$)/gm, '<li>$1</li>')
            .replace(/^\d+\. (.*$)/gm, '<li>$1</li>')
            // Images
            .replace(/!\[(.*?)\]\((.*?)\)/g, '<div style="margin: 15px 0;"><img src="$2" alt="$1" style="max-width: 100%; height: auto; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);"><p style="text-align: center; margin-top: 8px; font-size: 0.9em; color: #666;">$1</p></div>')
            // Line breaks
            .replace(/\n\n/g, '</p><p>')
            .replace(/\n/g, '<br>');

        // Wrap in paragraphs if not already wrapped
        if (!formattedText.includes('<p>') && !formattedText.includes('<h') && !formattedText.includes('<img')) {
            formattedText = `<p>${formattedText}</p>`;
        }

        // Add list styling
        formattedText = formattedText
            .replace(/<li>(.*?)<\/li>/g, '<li style="margin: 8px 0; padding-left: 20px; position: relative;"><span style="position: absolute; left: 0;">•</span>$1</li>')
            .replace(/<p><li>/g, '<p><ul style="margin: 10px 0; padding-left: 20px;"><li>')
            .replace(/<\/li><\/p>/g, '</li></ul></p>');

        // Add spacing for headers
        formattedText = formattedText
            .replace(/<h([1-3])>/g, '<h$1 style="margin: 15px 0 10px 0; color: #333; font-weight: 600;">')
            .replace(/<h1>/g, '<h1 style="font-size: 1.4em; margin: 20px 0 15px 0; color: #333; font-weight: 700;">')
            .replace(/<h2>/g, '<h2 style="font-size: 1.2em; margin: 15px 0 10px 0; color: #333; font-weight: 600;">')
            .replace(/<h3>/g, '<h3 style="font-size: 1.1em; margin: 12px 0 8px 0; color: #333; font-weight: 600;">');

        // Style code blocks
        formattedText = formattedText
            .replace(/<pre><code>/g, '<pre style="background: #f4f4f4; padding: 15px; border-radius: 8px; overflow-x: auto; margin: 10px 0;"><code style="font-family: monospace; font-size: 0.9em;">')
            .replace(/<code>/g, '<code style="background: #f4f4f4; padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 0.9em;">');

        // Add paragraph spacing
        formattedText = formattedText
            .replace(/<p>/g, '<p style="margin: 8px 0; line-height: 1.6;">');

        return formattedText;
    }

    showTypingIndicator() {
        this.isTyping = true;
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message bot-message typing-indicator-message';
        typingDiv.id = 'typingIndicator';

        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.innerHTML = '<img src="mathan.png" alt="Phan Thị Ngọc Hân" class="bot-avatar">';

        const content = document.createElement('div');
        content.className = 'message-content';

        const typingIndicator = document.createElement('div');
        typingIndicator.className = 'message-text typing-indicator';
        typingIndicator.innerHTML = `
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
        `;

        content.appendChild(typingIndicator);
        typingDiv.appendChild(avatar);
        typingDiv.appendChild(content);

        this.chatMessages.appendChild(typingDiv);
        this.scrollToBottom();
    }

    hideTypingIndicator() {
        this.isTyping = false;
        const typingIndicator = document.getElementById('typingIndicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    clearChat() {
        if (confirm('Bạn có chắc chắn muốn xóa toàn bộ cuộc trò chuyện?')) {
            const messages = this.chatMessages.querySelectorAll('.message');
            messages.forEach(message => {
                if (!message.querySelector('.message-text').textContent.includes('Em là Phan Thị Ngọc Hân')) {
                    message.remove();
                }
            });
            this.conversationHistory = [];
            this.userGender = null;
            this.hasAskedGender = false;
            this.showNotification('Đã xóa cuộc trò chuyện!');
            this.askForGender();
        }
    }

    openSettings() {
        this.settingsModal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }

    closeSettings() {
        this.settingsModal.classList.remove('show');
        document.body.style.overflow = 'auto';
    }

    changeTheme(theme) {
        this.currentTheme = theme;
        document.body.className = theme === 'dark' ? 'dark-theme' : '';
        localStorage.setItem('chatbot-theme', theme);
        this.showNotification(`Đã chuyển sang chủ đề ${theme === 'dark' ? 'tối' : 'sáng'}!`);
    }

    changeLanguage(language) {
        localStorage.setItem('chatbot-language', language);
        this.showNotification(`Đã chuyển sang ngôn ngữ ${language === 'vi' ? 'Tiếng Việt' : 'English'}!`);
    }

    loadSettings() {
        const savedTheme = localStorage.getItem('chatbot-theme') || 'light';
        const savedLanguage = localStorage.getItem('chatbot-language') || 'vi';
        
        this.themeSelect.value = savedTheme;
        this.languageSelect.value = savedLanguage;
        
        this.changeTheme(savedTheme);
    }

    getCurrentTime() {
        const now = new Date();
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    }

    scrollToBottom() {
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }

    showNotification(message) {
        // Create notification element
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 0.5rem;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
            z-index: 10000;
            font-size: 0.9rem;
            max-width: 300px;
            word-wrap: break-word;
            animation: slideInRight 0.3s ease;
        `;
        notification.textContent = message;

        // Add animation keyframes
        if (!document.querySelector('#notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                @keyframes slideInRight {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                @keyframes slideOutRight {
                    from {
                        transform: translateX(0);
                        opacity: 1;
                    }
                    to {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(notification);

        // Remove notification after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
}

// Initialize chatbot when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ChatBot();
});

// Add some additional utility functions
window.addEventListener('resize', () => {
    // Adjust layout on resize
    const chatbot = document.querySelector('.chat-container');
    if (chatbot) {
        chatbot.style.height = window.innerHeight + 'px';
    }
});

// Prevent zoom on double tap (mobile)
let lastTouchEnd = 0;
document.addEventListener('touchend', (event) => {
    const now = (new Date()).getTime();
    if (now - lastTouchEnd <= 300) {
        event.preventDefault();
    }
    lastTouchEnd = now;
}, false); 