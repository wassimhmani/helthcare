/**
 * Internal Chat System for Healthcare Application
 * Enables real-time messaging between users (doctors, secretaries)
 */

(function() {
  'use strict';

  const host = window.location.origin + '/helthcareSystem/';
  
  // Chat state
  let currentUser = null;
  let selectedContact = null;
  let messages = [];
  let contacts = [];
  let pollingInterval = null;
  let unreadCounts = {};

  // Initialize chat system
  function initChat() {
    const session = JSON.parse(localStorage.getItem('medconnect_session') || '{}');
    if (!session || !session.userId) {
      console.log('Chat: No session found, skipping initialization');
      return;
    }
    
    currentUser = session;
    loadContacts();
    startPolling();
    
    // Create chat UI if it doesn't exist
    if (!document.getElementById('chatWidget')) {
      createChatUI();
    }
  }

  // Create chat widget HTML
  function createChatUI() {
    const chatWidget = document.createElement('div');
    chatWidget.id = 'chatWidget';
    chatWidget.innerHTML = `
      <div id="chatToggle" class="chat-toggle">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
        </svg>
        <span id="chatUnreadBadge" class="chat-badge" style="display: none;">0</span>
      </div>
      <div id="chatContainer" class="chat-container" style="display: none;">
        <div class="chat-header">
          <div class="chat-header-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 8px;">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
            </svg>
            Messages
          </div>
          <button id="chatClose" class="chat-close">&times;</button>
        </div>
        <div class="chat-body">
          <div id="chatContacts" class="chat-contacts">
            <div class="chat-contacts-header">Contacts</div>
            <div id="contactsList" class="contacts-list"></div>
          </div>
          <div id="chatConversation" class="chat-conversation" style="display: none;">
            <div id="chatContactHeader" class="chat-contact-header"></div>
            <div id="chatMessages" class="chat-messages"></div>
            <div class="chat-input-area">
              <input type="text" id="chatInput" class="chat-input" placeholder="Type a message..." maxlength="1000">
              <button id="chatSendBtn" class="chat-send-btn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
              </button>
            </div>
          </div>
          <div id="chatEmpty" class="chat-empty">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="1.5">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
            </svg>
            <p>Select a contact to start chatting</p>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(chatWidget);
    
    // Add styles
    addChatStyles();
    
    // Event listeners
    document.getElementById('chatToggle').addEventListener('click', toggleChat);
    document.getElementById('chatClose').addEventListener('click', toggleChat);
    document.getElementById('chatSendBtn').addEventListener('click', sendMessage);
    document.getElementById('chatInput').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') sendMessage();
    });
  }

  // Add chat CSS styles
  function addChatStyles() {
    const styles = document.createElement('style');
    styles.textContent = `
      #chatWidget {
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 1000;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
      }
      
      .chat-toggle {
        width: 56px;
        height: 56px;
        border-radius: 50%;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
        transition: transform 0.2s, box-shadow 0.2s;
        position: relative;
      }
      
      .chat-toggle:hover {
        transform: scale(1.05);
        box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5);
      }
      
      .chat-badge {
        position: absolute;
        top: -2px;
        right: -2px;
        background: #ff4757;
        color: white;
        border-radius: 50%;
        width: 22px;
        height: 22px;
        font-size: 12px;
        font-weight: bold;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2px solid white;
      }
      
      .chat-container {
        position: absolute;
        bottom: 70px;
        right: 0;
        width: 360px;
        height: 500px;
        background: white;
        border-radius: 16px;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }
      
      .chat-header {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 16px 20px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .chat-header-title {
        display: flex;
        align-items: center;
        font-weight: 600;
        font-size: 16px;
      }
      
      .chat-close {
        background: none;
        border: none;
        color: white;
        font-size: 24px;
        cursor: pointer;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: background 0.2s;
      }
      
      .chat-close:hover {
        background: rgba(255, 255, 255, 0.2);
      }
      
      .chat-body {
        flex: 1;
        display: flex;
        overflow: hidden;
      }
      
      .chat-contacts {
        width: 120px;
        background: #f8f9fa;
        border-right: 1px solid #e9ecef;
        display: flex;
        flex-direction: column;
      }
      
      .chat-contacts-header {
        padding: 12px;
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        color: #6c757d;
        letter-spacing: 0.5px;
      }
      
      .contacts-list {
        flex: 1;
        overflow-y: auto;
      }
      
      .contact-item {
        padding: 12px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 8px;
        transition: background 0.2s;
        border-bottom: 1px solid #e9ecef;
      }
      
      .contact-item:hover {
        background: #e9ecef;
      }
      
      .contact-item.active {
        background: #667eea;
        color: white;
      }
      
      .contact-avatar {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        font-weight: 600;
        color: white;
        flex-shrink: 0;
      }
      
      .contact-info {
        flex: 1;
        min-width: 0;
      }
      
      .contact-name {
        font-size: 13px;
        font-weight: 500;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      
      .contact-role {
        font-size: 11px;
        opacity: 0.7;
      }
      
      .contact-unread {
        background: #ff4757;
        color: white;
        border-radius: 50%;
        min-width: 18px;
        height: 18px;
        font-size: 11px;
        font-weight: bold;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0 5px;
      }
      
      .chat-conversation {
        flex: 1;
        display: flex;
        flex-direction: column;
      }
      
      .chat-contact-header {
        padding: 12px 16px;
        border-bottom: 1px solid #e9ecef;
        font-weight: 600;
        font-size: 14px;
        background: #f8f9fa;
      }
      
      .chat-messages {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      
      .chat-message {
        max-width: 75%;
        padding: 10px 14px;
        border-radius: 16px;
        font-size: 14px;
        line-height: 1.4;
        word-wrap: break-word;
      }
      
      .chat-message.sent {
        align-self: flex-end;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border-bottom-right-radius: 4px;
      }
      
      .chat-message.received {
        align-self: flex-start;
        background: #f1f3f4;
        color: #333;
        border-bottom-left-radius: 4px;
      }
      
      .chat-message-time {
        font-size: 11px;
        opacity: 0.7;
        margin-top: 4px;
        text-align: right;
      }
      
      .chat-input-area {
        padding: 12px 16px;
        border-top: 1px solid #e9ecef;
        display: flex;
        gap: 10px;
        background: white;
      }
      
      .chat-input {
        flex: 1;
        border: 1px solid #e9ecef;
        border-radius: 24px;
        padding: 10px 16px;
        font-size: 14px;
        outline: none;
        transition: border-color 0.2s;
      }
      
      .chat-input:focus {
        border-color: #667eea;
      }
      
      .chat-send-btn {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.2s, box-shadow 0.2s;
      }
      
      .chat-send-btn:hover {
        transform: scale(1.05);
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
      }
      
      .chat-send-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        transform: none;
      }
      
      .chat-empty {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        color: #adb5bd;
        text-align: center;
        padding: 40px;
      }
      
      .chat-empty p {
        margin-top: 16px;
        font-size: 14px;
      }
      
      @media (max-width: 480px) {
        .chat-container {
          width: calc(100vw - 40px);
          height: 400px;
        }
      }
    `;
    document.head.appendChild(styles);
  }

  // Toggle chat visibility
  function toggleChat() {
    const container = document.getElementById('chatContainer');
    const isVisible = container.style.display !== 'none';
    container.style.display = isVisible ? 'none' : 'flex';
    
    if (!isVisible && selectedContact) {
      loadMessages(selectedContact.id);
      markMessagesAsRead(selectedContact.id);
    }
  }

  // Load contacts from system users
  function loadContacts() {
    const systemUsers = JSON.parse(localStorage.getItem('system_users') || '[]');
    contacts = systemUsers.filter(u => u.id !== currentUser.userId && u.status === 'active');
    renderContacts();
  }

  // Render contacts list
  function renderContacts() {
    const list = document.getElementById('contactsList');
    if (!list) return;
    
    list.innerHTML = contacts.map(contact => {
      const unread = unreadCounts[contact.id] || 0;
      const initials = contact.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
      const isActive = selectedContact && selectedContact.id === contact.id;
      
      return `
        <div class="contact-item ${isActive ? 'active' : ''}" data-id="${contact.id}">
          <div class="contact-avatar">${initials}</div>
          <div class="contact-info">
            <div class="contact-name">${contact.name}</div>
            <div class="contact-role">${contact.role}</div>
          </div>
          ${unread > 0 ? `<div class="contact-unread">${unread}</div>` : ''}
        </div>
      `;
    }).join('');
    
    // Add click handlers
    list.querySelectorAll('.contact-item').forEach(item => {
      item.addEventListener('click', () => selectContact(item.dataset.id));
    });
  }

  // Select a contact
  function selectContact(contactId) {
    selectedContact = contacts.find(c => c.id === contactId);
    if (!selectedContact) return;
    
    document.getElementById('chatContacts').style.display = 'none';
    document.getElementById('chatEmpty').style.display = 'none';
    document.getElementById('chatConversation').style.display = 'flex';
    
    document.getElementById('chatContactHeader').textContent = selectedContact.name;
    
    loadMessages(contactId);
    markMessagesAsRead(contactId);
    renderContacts(); // Update active state
  }

  // Load messages for a conversation
  async function loadMessages(contactId) {
    try {
      const response = await fetch(
        `${host}api/chat_get_messages.php?user1_id=${currentUser.userId}&user2_id=${contactId}&limit=50`
      );
      const result = await response.json();
      
      if (result.status === 'ok') {
        messages = result.messages;
        renderMessages();
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  }

  // Render messages
  function renderMessages() {
    const container = document.getElementById('chatMessages');
    if (!container) return;
    
    container.innerHTML = messages.map(msg => {
      const isSent = msg.sender_id === currentUser.userId;
      const time = new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      return `
        <div class="chat-message ${isSent ? 'sent' : 'received'}">
          <div>${escapeHtml(msg.message)}</div>
          <div class="chat-message-time">${time}</div>
        </div>
      `;
    }).join('');
    
    // Scroll to bottom
    container.scrollTop = container.scrollHeight;
  }

  // Send a message
  async function sendMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    
    if (!message || !selectedContact) return;
    
    const sendBtn = document.getElementById('chatSendBtn');
    sendBtn.disabled = true;
    
    try {
      const response = await fetch(`${host}api/chat_send.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender_id: currentUser.userId,
          receiver_id: selectedContact.id,
          message: message
        })
      });
      
      const result = await response.json();
      
      if (result.status === 'ok') {
        input.value = '';
        // Add message to local array and render
        messages.push({
          id: result.message_id,
          sender_id: currentUser.userId,
          receiver_id: selectedContact.id,
          message: message,
          is_read: false,
          created_at: new Date().toISOString()
        });
        renderMessages();
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      sendBtn.disabled = false;
    }
  }

  // Mark messages as read
  async function markMessagesAsRead(senderId) {
    try {
      await fetch(`${host}api/chat_mark_read.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiver_id: currentUser.userId,
          sender_id: senderId
        })
      });
      
      // Update unread counts
      delete unreadCounts[senderId];
      updateUnreadBadge();
      renderContacts();
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }

  // Get unread message counts
  async function getUnreadCounts() {
    try {
      const response = await fetch(
        `${host}api/chat_unread_count.php?user_id=${currentUser.userId}`
      );
      const result = await response.json();
      
      if (result.status === 'ok') {
        unreadCounts = result.by_sender;
        updateUnreadBadge();
        renderContacts();
      }
    } catch (error) {
      console.error('Error getting unread counts:', error);
    }
  }

  // Update unread badge on toggle button
  function updateUnreadBadge() {
    const badge = document.getElementById('chatUnreadBadge');
    if (!badge) return;
    
    const total = Object.values(unreadCounts).reduce((sum, count) => sum + count, 0);
    
    if (total > 0) {
      badge.textContent = total > 99 ? '99+' : total;
      badge.style.display = 'flex';
    } else {
      badge.style.display = 'none';
    }
  }

  // Start polling for new messages
  function startPolling() {
    // Initial check
    getUnreadCounts();
    
    // Poll every 5 seconds
    pollingInterval = setInterval(() => {
      if (currentUser) {
        getUnreadCounts();
        
        // If chat is open with a contact, refresh messages
        const container = document.getElementById('chatContainer');
        if (container && container.style.display !== 'none' && selectedContact) {
          loadMessages(selectedContact.id);
        }
      }
    }, 5000);
  }

  // Stop polling
  function stopPolling() {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      pollingInterval = null;
    }
  }

  // Escape HTML to prevent XSS
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Public API
  window.ChatSystem = {
    init: initChat,
    destroy: stopPolling,
    open: toggleChat
  };

  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initChat);
  } else {
    initChat();
  }
})();
