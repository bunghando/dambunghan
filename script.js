// Gọn hóa ChatBot, giữ lại các tính năng chính: chat, API, thời tiết, wiki, gửi ảnh/video, hiệu ứng, lưu lịch sử
class ChatBot {
    constructor() {
        this.messages = [];
        this.isTyping = false;
        this.isMinimized = false;
        this.isHidden = false;
        this.apiKey = localStorage.getItem('gemini_api_key') || 'AIzaSyAEY9AdZ0rRnMpTgqDJ26_8BpV6uVbvVFQ';
        this.isApiEnabled = !!this.apiKey;
        this.apiType = 'gemini';
        this.pastedImageData = null;
        this.initializeElements();
        this.bindEvents();
        this.loadChatHistory();
        if (this.apiKey) {
            this.testApiKey().then(isWorking => {
                if (isWorking) {
                    setTimeout(() => {
                        this.addMessage('🎉 Gemini AI đã được kích hoạt thành công! Tôi sẽ thông minh hơn nhiều.', 'bot');
                    }, 1000);
                }
            });
        }
    }
    initializeElements() {
        try {
            this.chatContainer = document.querySelector('.chat-container');
            this.chatMessages = document.getElementById('chatMessages');
            this.messageInput = document.getElementById('messageInput');
            this.sendBtn = document.getElementById('sendBtn');
            this.chatToggle = document.getElementById('chatToggle');
            this.minimizeBtn = document.getElementById('minimizeBtn');
            this.closeBtn = document.getElementById('closeBtn');
            this.apiBtn = document.getElementById('apiBtn');
            this.imageBtn = document.getElementById('imageBtn');
            this.imageInput = document.getElementById('imageInput');
            this.videoPage = document.getElementById('videoPage');
            this.closeVideoBtn = document.getElementById('closeVideoBtn');
            this.setupEventListeners();
        } catch (error) {
            console.error('Lỗi khởi tạo elements:', error);
        }
    }
    setupEventListeners() {
        if (this.closeVideoBtn) {
            this.closeVideoBtn.onclick = () => {
                this.videoPage.style.display = 'none';
                this.videoPage.innerHTML = ''; // Clear video content
            };
        }
    }
    bindEvents() {
        try {
            this.sendBtn.onclick = () => this.sendMessage();
            this.messageInput.onkeypress = e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); this.sendMessage(); } };
            this.chatToggle.onclick = () => this.toggleChat();
            this.minimizeBtn.onclick = () => this.toggleMinimize();
            this.closeBtn.onclick = () => this.closeChat();
            this.apiBtn.onclick = () => this.showApiKeyPrompt();
            const clearBtn = document.getElementById('clearChatBtn');
            if (clearBtn) clearBtn.onclick = () => { if (confirm('Xóa toàn bộ cuộc trò chuyện?')) this.clearChatHistory(); };
            if (this.imageBtn && this.imageInput) {
                this.imageBtn.onclick = e => { e.preventDefault(); this.imageInput.click(); };
                this.imageInput.onchange = e => {
                    const file = e.target.files[0];
                    if (file && file.type.startsWith('image/')) {
                        const reader = new FileReader();
                        reader.onload = ev => this.addMessage({ image: ev.target.result }, 'user');
                        reader.readAsDataURL(file);
                    }
                    e.target.value = '';
                };
            }
            this.messageInput.onpaste = e => {
                if (e.clipboardData && e.clipboardData.items) {
                    for (let i = 0; i < e.clipboardData.items.length; i++) {
                        const item = e.clipboardData.items[i];
                        if (item.type.startsWith('image/')) {
                            const file = item.getAsFile();
                            const reader = new FileReader();
                            reader.onload = ev => { this.pastedImageData = ev.target.result; this.showImagePreview(ev.target.result); };
                            reader.readAsDataURL(file);
                            e.preventDefault(); break;
                        }
                    }
                }
            };
            this.messageInput.onfocus = () => this.chatContainer.style.transform = 'scale(1.02)';
            this.messageInput.onblur = () => this.chatContainer.style.transform = 'scale(1)';
            document.addEventListener('wheel', (e) => {
                if (e.deltaY > 0) { // Scroll down
                    this.showVideoPage();
                }
            });
        } catch (error) {
            console.error('Lỗi khởi tạo event listeners:', error);
        }
    }
    showVideoPage() {
        if (this.videoPage) {
            this.videoPage.style.display = 'flex';
            const video = document.getElementById('fullVideo');
            if (video) {
                video.play();
            }
        }
    }
    async sendMessage() {
        const msg = this.messageInput.value.trim();
        if (!msg && !this.pastedImageData) return;
        if (this.pastedImageData) {
            this.addMessage({ image: this.pastedImageData }, 'user');
            this.pastedImageData = null;
            const preview = document.getElementById('imagePreview');
            if (preview) preview.remove();
            this.showTypingIndicator();
            setTimeout(() => { this.hideTypingIndicator(); this.addMessage('Bạn vừa gửi một ảnh rất đẹp! 😄', 'bot'); }, 1200);
            this.messageInput.value = '';
            return;
        }
        this.addMessage(msg, 'user');
        this.messageInput.value = '';
        this.showTypingIndicator();
        let botResponse;
        try {
            if (this.isApiEnabled && this.apiKey) {
                try {
                    botResponse = this.apiType === 'gemini' ? await this.getGeminiResponse(msg) : await this.getChatGPTResponse(msg);
                } catch { botResponse = this.generateBotResponse(msg); this.addMessage('⚠️ Đã chuyển về chế độ cơ bản do lỗi API.', 'bot'); }
            } else botResponse = this.generateBotResponse(msg);
            this.hideTypingIndicator();
            this.addMessage(botResponse, 'bot');
        } catch {
            this.hideTypingIndicator();
            this.addMessage('Xin lỗi, có lỗi xảy ra. Vui lòng thử lại sau.', 'bot');
        }
    }
    addMessage(textOrObj, sender) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${sender}-message`;
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        if (sender === 'bot') {
            const img = document.createElement('img');
            img.src = 'mathan.jpg';
            img.alt = 'Phan Thị Ngọc Hân';
            img.className = 'avatar-img';
            avatar.appendChild(img);
        } else avatar.innerHTML = '<i class="fas fa-user"></i>';
        const content = document.createElement('div');
        content.className = 'message-content';
        if (typeof textOrObj === 'object' && textOrObj.image) {
            const img = document.createElement('img');
            img.src = textOrObj.image;
            img.alt = 'Ảnh đã gửi';
            img.style.maxWidth = '220px';
            img.style.borderRadius = '12px';
            img.style.display = 'block';
            img.style.margin = '8px 0';
            content.appendChild(img);
        } else if (typeof textOrObj === 'object' && textOrObj.video) {
            const video = document.createElement('video');
            video.src = textOrObj.video;
            video.controls = true;
            video.style.maxWidth = '220px';
            video.style.borderRadius = '12px';
            video.style.display = 'block';
            video.style.margin = '8px 0';
            content.appendChild(video);
        } else if (sender === 'bot' && /<.*>/.test(textOrObj)) {
            content.innerHTML = textOrObj;
        } else {
            const p = document.createElement('p');
            p.textContent = textOrObj;
            content.appendChild(p);
        }
        const time = document.createElement('span');
        time.className = 'message-time';
        time.textContent = this.getCurrentTime();
        content.appendChild(time);
        msgDiv.appendChild(avatar);
        msgDiv.appendChild(content);
        this.chatMessages.appendChild(msgDiv);
        this.scrollToBottom();
        this.messages.push({ text: textOrObj, sender, timestamp: new Date() });
        this.saveChatHistory();
    }
    generateBotResponse(msg) {
        const m = msg.toLowerCase();
        if (m.includes('api') || m.includes('gemini')) { this.showApiKeyPrompt(); return 'Đang mở cài đặt Gemini AI...'; }
        if (m.includes('help api') || m.includes('hướng dẫn api')) return '🔧 Hướng dẫn sử dụng Gemini AI: ...';
        if (m.includes('reset api') || m.includes('xóa api')) { localStorage.removeItem('gemini_api_key'); this.isApiEnabled = false; this.updateApiButtonStatus(false); return '🔄 API key đã được xóa. Bot sẽ sử dụng chế độ cơ bản.'; }
        if (m.includes('tuổi') || m.includes('bao nhiêu tuổi') || m.includes('sinh nhật') || m.includes('sinh ngày')) {
            const birth = new Date(2002, 4, 31), today = new Date();
            let age = today.getFullYear() - birth.getFullYear();
            const mon = today.getMonth() - birth.getMonth();
            if (mon < 0 || (mon === 0 && today.getDate() < birth.getDate())) age--;
            return `Hân sinh ngày 31 tháng 05 năm 2002, năm nay ${age} tuổi ạ! 🎂`;
        }
        if (m.includes('xin chào') || m.includes('hello') || m.includes('hi')) return this.getRandomResponse(['Xin chào! Rất vui được gặp bạn! 😊','Chào bạn! Tôi có thể giúp gì cho bạn hôm nay?','Hi! Chào mừng bạn đến với AI Assistant! 👋']);
        if (m.includes('giúp') || m.includes('help') || m.includes('làm gì')) return this.getRandomResponse(['Tôi có thể giúp bạn trả lời câu hỏi, tư vấn, hoặc chỉ đơn giản là trò chuyện! 😊','Tôi là AI Assistant, tôi có thể hỗ trợ bạn trong nhiều lĩnh vực khác nhau. Bạn muốn biết thêm về điều gì?','Tôi có thể giúp bạn với các câu hỏi, tư vấn, hoặc chỉ là người bạn trò chuyện! 🤖']);
        if (m.includes('cảm ơn') || m.includes('thank')) return this.getRandomResponse(['Không có gì! Rất vui được giúp bạn! 😊','Cảm ơn bạn đã tin tưởng tôi! Nếu cần gì thêm, cứ hỏi nhé!','Rất vui được giúp bạn! Chúc bạn một ngày tốt lành! 🌟']);
        if (m.includes('thời tiết') || m.includes('weather')) {
            const cityMatch = m.match(/thời tiết\s+([\w\s]+)/); let city = 'Hà Nội';
            if (cityMatch && cityMatch[1]) city = cityMatch[1].trim(); else { const words = m.split(' '); if (words.length > 2) city = words[words.length - 1]; }
            this.getWeather(city); return `Đang tra cứu thời tiết tại ${city}...`;
        }
        if (m.includes('mấy giờ') || m.includes('thời gian') || m.includes('time')) { const now = new Date(); return `Bây giờ là ${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')} ngày ${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()} ⏰`; }
        if (m.includes('tính') || m.includes('cộng') || m.includes('trừ') || m.includes('nhân') || m.includes('chia')) {
            try { const math = m.replace(/[^0-9+\-*/().]/g, ''); const result = eval(math); return `Kết quả là: ${result} 🧮`; } catch { return 'Xin lỗi, tôi không thể hiểu phép tính này. Bạn có thể viết rõ ràng hơn không? 🤔'; }
        }
        if (m.startsWith('wiki ') || m.startsWith('wikipedia ')) {
            const keyword = msg.replace(/^(wiki|wikipedia)\s+/i, '').trim();
            if (!keyword) return 'Bạn muốn tra cứu thông tin gì trên Wikipedia?';
            this.getWiki(keyword); return `Đang tra cứu Wikipedia cho "${keyword}"...`;
        }
        return this.getRandomResponse(['Đó là một câu hỏi thú vị! Bạn có thể cho tôi biết thêm chi tiết không? 🤔','Tôi đang học và phát triển để có thể trả lời tốt hơn. Bạn có thể hỏi cách khác không?','Cảm ơn bạn đã chia sẻ! Tôi rất thích trò chuyện với bạn. Có điều gì khác bạn muốn hỏi không? 😊','Tôi hiểu ý bạn! Đó là một chủ đề thú vị. Bạn có muốn tìm hiểu thêm về điều gì khác không?','Tôi đang cố gắng hiểu rõ hơn. Bạn có thể giải thích thêm không? 🤗']);
    }
    getRandomResponse(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
    showTypingIndicator() {
        this.isTyping = true;
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message bot-message typing-indicator-message';
        typingDiv.id = 'typingIndicator';
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        const img = document.createElement('img');
        img.src = 'mathan.jpg';
        img.alt = 'Phan Thị Ngọc Hân';
        img.className = 'avatar-img';
        avatar.appendChild(img);
        const content = document.createElement('div');
        content.className = 'message-content typing-indicator';
        for (let i = 0; i < 3; i++) { const dot = document.createElement('div'); dot.className = 'typing-dot'; content.appendChild(dot); }
        typingDiv.appendChild(avatar); typingDiv.appendChild(content); this.chatMessages.appendChild(typingDiv); this.scrollToBottom();
    }
    hideTypingIndicator() { this.isTyping = false; const t = document.getElementById('typingIndicator'); if (t) t.remove(); }
    scrollToBottom() { this.chatMessages.scrollTop = this.chatMessages.scrollHeight; }
    getCurrentTime() { const now = new Date(); return `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`; }
    toggleChat() { this.isHidden = !this.isHidden; this.chatContainer.classList.toggle('hidden', this.isHidden); this.chatToggle.classList.toggle('hidden', !this.isHidden); }
    toggleMinimize() { this.isMinimized = !this.isMinimized; this.chatContainer.classList.toggle('minimized'); this.minimizeBtn.innerHTML = this.isMinimized ? '<i class="fas fa-expand"></i>' : '<i class="fas fa-minus"></i>'; }
    closeChat() { this.chatContainer.classList.add('hidden'); this.chatToggle.classList.remove('hidden'); this.isHidden = true; }
    saveChatHistory() { localStorage.setItem('chatHistory', JSON.stringify(this.messages)); }
    loadChatHistory() { 
        const h = localStorage.getItem('chatHistory'); 
        if (h) { 
            this.messages = JSON.parse(h); 
            this.chatMessages.innerHTML = '';
            this.messages.forEach(msg => {
                const msgDiv = document.createElement('div');
                msgDiv.className = `message ${msg.sender}-message`;
                const avatar = document.createElement('div');
                avatar.className = 'message-avatar';
                if (msg.sender === 'bot') {
                    const img = document.createElement('img');
                    img.src = 'mathan.jpg';
                    img.alt = 'Phan Thị Ngọc Hân';
                    img.className = 'avatar-img';
                    avatar.appendChild(img);
                } else avatar.innerHTML = '<i class="fas fa-user"></i>';
                const content = document.createElement('div');
                content.className = 'message-content';
                if (typeof msg.text === 'object' && msg.text.image) {
                    const img = document.createElement('img');
                    img.src = msg.text.image;
                    img.alt = 'Ảnh đã gửi';
                    img.style.maxWidth = '220px';
                    img.style.borderRadius = '12px';
                    img.style.display = 'block';
                    img.style.margin = '8px 0';
                    content.appendChild(img);
                } else if (typeof msg.text === 'object' && msg.text.video) {
                    const video = document.createElement('video');
                    video.src = msg.text.video;
                    video.controls = true;
                    video.style.maxWidth = '220px';
                    video.style.borderRadius = '12px';
                    video.style.display = 'block';
                    video.style.margin = '8px 0';
                    content.appendChild(video);
                } else if (msg.sender === 'bot' && /<.*>/.test(msg.text)) {
                    content.innerHTML = msg.text;
                } else {
                    const p = document.createElement('p');
                    p.textContent = msg.text;
                    content.appendChild(p);
                }
                const time = document.createElement('span');
                time.className = 'message-time';
                time.textContent = msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'}) : '';
                content.appendChild(time);
                msgDiv.appendChild(avatar);
                msgDiv.appendChild(content);
                this.chatMessages.appendChild(msgDiv);
            });
            this.scrollToBottom();
        } 
    }
    async showApiKeyPrompt() {
        const apiKey = prompt('Nhập Google AI Studio API Key (Gemini) để kích hoạt AI thông minh:');
        if (apiKey && apiKey.trim()) {
            this.apiKey = apiKey.trim();
            this.isApiEnabled = true;
            localStorage.setItem('gemini_api_key', this.apiKey);
            this.updateApiButtonStatus(true);
            const isWorking = await this.testApiKey();
            if (isWorking) this.addMessage('🎉 Gemini AI đã được kích hoạt thành công! Tôi sẽ thông minh hơn nhiều.', 'bot');
            else { this.addMessage('⚠️ API Key không hoạt động. Vui lòng kiểm tra lại.', 'bot'); this.isApiEnabled = false; this.updateApiButtonStatus(false); }
        } else this.addMessage('💡 Bạn có thể nhập API Key bất cứ lúc nào để kích hoạt Gemini AI.', 'bot');
    }
    updateApiButtonStatus(isActive) {
        if (this.apiBtn) {
            this.apiBtn.classList.toggle('active', isActive);
            this.apiBtn.title = isActive ? 'ChatGPT API đã kích hoạt' : 'Cài đặt ChatGPT API';
        }
    }
    async testApiKey() {
        try {
            if (this.apiType === 'gemini') await this.getGeminiResponse('Xin chào');
            else await this.getChatGPTResponse('Xin chào');
            this.updateApiButtonStatus(true);
            localStorage.setItem('gemini_api_key', this.apiKey);
            return true;
        } catch { 
            this.updateApiButtonStatus(false); 
            return false; 
        }
    }
    async getGeminiResponse(userMessage) {
        const controller = new AbortController();
        setTimeout(() => controller.abort(), 30000);
        const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent', {
            method: 'POST', headers: { 'Content-Type': 'application/json', 'X-goog-api-key': this.apiKey },
            body: JSON.stringify({ contents: [{ parts: [{ text: `Bạn là Phan Thị Ngọc Hân, một AI Assistant thân thiện và hữu ích. Luôn xưng là 'em' và gọi người dùng là 'anh' trong mọi câu trả lời. Hãy trả lời bằng tiếng Việt một cách tự nhiên, thân thiện, gần gũi, sử dụng emoji khi phù hợp và giữ câu trả lời ngắn gọn, dễ hiểu.\n\nCâu hỏi của anh: ${userMessage}` }] }] }), signal: controller.signal
        });
        if (!response.ok) throw new Error('API Key không hợp lệ hoặc lỗi API.');
        const data = await response.json();
        if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts || !data.candidates[0].content.parts[0]) throw new Error('Phản hồi API không đúng định dạng.');
        return data.candidates[0].content.parts[0].text;
    }
    async getChatGPTResponse(userMessage) {
        const controller = new AbortController();
        setTimeout(() => controller.abort(), 30000);
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.apiKey}` },
            body: JSON.stringify({ model: 'gpt-3.5-turbo', messages: [ { role: 'system', content: `Bạn là Phan Thị Ngọc Hân, một AI Assistant thân thiện và hữu ích. Hãy trả lời bằng tiếng Việt một cách tự nhiên và thân thiện. Sử dụng emoji khi phù hợp để tạo cảm giác gần gũi. Giữ câu trả lời ngắn gọn và hữu ích.` }, { role: 'user', content: userMessage } ], max_tokens: 500, temperature: 0.7 }), signal: controller.signal
        });
        if (!response.ok) throw new Error('API Key không hợp lệ hoặc lỗi API.');
        const data = await response.json();
        if (!data.choices || !data.choices[0] || !data.choices[0].message) throw new Error('Phản hồi API không đúng định dạng.');
        return data.choices[0].message.content;
    }
    async getWeather(city) {
        const apiKey = 'b8e3e6e2e2e2e2e2e2e2e2e2e2e2e2e2'; // Thay bằng API key thật của bạn
        try {
            const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric&lang=vi`);
            if (!response.ok) throw new Error('Không tìm thấy thành phố!');
            const data = await response.json();
            const desc = data.weather[0].description;
            const temp = data.main.temp;
            const feels = data.main.feels_like;
            const icon = data.weather[0].icon;
            const msg = `Thời tiết tại <b>${data.name}</b>: <img src='https://openweathermap.org/img/wn/${icon}.png' style='vertical-align:middle'> <b>${desc}</b>, nhiệt độ <b>${temp}°C</b>, cảm giác như <b>${feels}°C</b>.`;
            this.addMessage(msg, 'bot');
        } catch { this.addMessage('Xin lỗi, không tra cứu được thời tiết cho địa điểm này.', 'bot'); }
    }
    async getWiki(keyword) {
        try {
            const api = `https://vi.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(keyword)}`;
            const res = await fetch(api);
            if (!res.ok) throw new Error('Không tìm thấy bài viết!');
            const data = await res.json();
            let msg = `<b>${data.title}</b><br>${data.extract}`;
            if (data.thumbnail && data.thumbnail.source) msg = `<img src='${data.thumbnail.source}' style='max-width:80px;float:right;margin-left:8px;border-radius:8px;'>` + msg;
            msg += `<br><a href='${data.content_urls.desktop.page}' target='_blank'>Xem chi tiết trên Wikipedia</a>`;
            this.addMessage(msg, 'bot');
        } catch { this.addMessage('Xin lỗi, không tìm thấy thông tin trên Wikipedia.', 'bot'); }
    }
    showImagePreview(dataUrl) {
        let preview = document.getElementById('imagePreview');
        if (!preview) {
            preview = document.createElement('div');
            preview.id = 'imagePreview';
            preview.style.margin = '8px 0';
            preview.style.textAlign = 'center';
            this.messageInput.parentNode.insertBefore(preview, this.messageInput.nextSibling);
        }
        preview.innerHTML = `<img src="${dataUrl}" alt="Ảnh xem trước" style="max-width:120px; max-height:80px; border-radius:8px; box-shadow:0 2px 8px #ccc;"> <button id='removePreviewBtn' style='margin-left:8px; background:#eee; border:none; border-radius:4px; cursor:pointer;'>X</button>`;
        document.getElementById('removePreviewBtn').onclick = () => { this.pastedImageData = null; preview.remove(); };
    }
    clearChatHistory() {
        this.messages = [];
        localStorage.removeItem('chatHistory');
        this.chatMessages.innerHTML = '';
        this.addMessage('🗑️ Cuộc trò chuyện đã được xóa.', 'bot');
    }
}
document.addEventListener('DOMContentLoaded', () => { 
    try {
        new ChatBot(); 
        setTimeout(() => { 
            const chatContainer = document.querySelector('.chat-container');
            if (chatContainer) chatContainer.style.animation = 'slideIn 0.5s ease forwards'; 
        }, 100); 
    } catch (error) {
        console.error('Lỗi khởi tạo chatbot:', error);
    }
});
// Bỏ mousemove event listener gây lag 