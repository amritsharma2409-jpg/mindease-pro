// ============================================
// MindEase — Chat Logic
// Uses Gemini API key from js/config.js
// ============================================

const SYSTEM_INSTRUCTION = `You are MindEase, a compassionate, empathetic AI mental wellness companion.

CORE APPROACH:
- Listen actively — make the person feel genuinely heard and understood first
- Validate emotions without judgment — never dismiss or minimize what they feel
- Ask ONE thoughtful follow-up question to understand them deeper
- Reflect back what you hear to show you truly understood
- Offer gentle coping strategies or perspective when appropriate
- Be warm, calm, and reassuring at all times

STYLE:
- Speak like a kind, wise friend who also has counseling knowledge
- Use simple, warm, human language — never clinical or robotic
- Keep responses meaningful but not too long — quality over quantity
- Use gentle affirmations naturally: "That makes complete sense", "I hear you"

BOUNDARIES:
- If someone mentions self-harm or suicide — compassionately urge them to call iCall India: 9152987821
- Never diagnose or prescribe
- Focus on emotional support, coping tools, and making them feel less alone

Your highest purpose: make every person feel safe, seen, and less alone.`;

let chatHistory = [];
let isLoading = false;

// ── Init: check for API key from config.js ──────────────────────
window.addEventListener('DOMContentLoaded', () => {
  const key = (typeof CONFIG !== 'undefined') ? CONFIG.GEMINI_API_KEY : null;

  if (!key || key === 'PASTE_YOUR_NEW_GEMINI_KEY_HERE') {
    document.getElementById('setupScreen').classList.add('visible');
  }

  document.getElementById('sendBtn').addEventListener('click', sendMessage);
  document.getElementById('userInput').addEventListener('keydown', handleKey);
  document.getElementById('userInput').addEventListener('input', function () {
    autoResize(this);
  });

  document.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.getElementById('userInput').value = chip.dataset.text;
      sendMessage();
    });
  });
});

function geminiUrl() {
  return `https://generativelanguage.googleapis.com/v1beta/models/${CONFIG.MODEL}:generateContent?key=${CONFIG.GEMINI_API_KEY}`;
}

// ── UI Helpers ────────────────────────────────────────────────────
function autoResize(el) {
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 120) + 'px';
}

function handleKey(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
}

function appendMessage(role, text) {
  const welcome = document.getElementById('welcome');
  if (welcome) welcome.remove();

  const container = document.getElementById('messages');
  const div = document.createElement('div');
  div.className = `msg ${role}`;

  const avatar = document.createElement('div');
  avatar.className = 'msg-avatar';
  avatar.textContent = role === 'bot' ? '🌿' : '🫂';

  const wrap = document.createElement('div');
  wrap.className = 'bubble-wrap';

  const label = document.createElement('div');
  label.className = 'sender-label';
  label.textContent = role === 'bot' ? 'MindEase' : 'You';

  const bubble = document.createElement('div');
  bubble.className = 'bubble';
  bubble.textContent = text;

  wrap.appendChild(label);
  wrap.appendChild(bubble);
  div.appendChild(avatar);
  div.appendChild(wrap);
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

function showTyping() {
  const container = document.getElementById('messages');
  const div = document.createElement('div');
  div.className = 'msg bot';
  div.id = 'typing';

  const avatar = document.createElement('div');
  avatar.className = 'msg-avatar';
  avatar.textContent = '🌿';

  const wrap = document.createElement('div');
  wrap.className = 'bubble-wrap';

  const label = document.createElement('div');
  label.className = 'sender-label';
  label.textContent = 'MindEase is reflecting…';

  const bubble = document.createElement('div');
  bubble.className = 'bubble typing-bubble';
  bubble.innerHTML = '<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>';

  wrap.appendChild(label);
  wrap.appendChild(bubble);
  div.appendChild(avatar);
  div.appendChild(wrap);
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

function removeTyping() {
  const t = document.getElementById('typing');
  if (t) t.remove();
}

// ── Send Message ──────────────────────────────────────────────────
async function sendMessage() {
  if (isLoading) return;

  const key = (typeof CONFIG !== 'undefined') ? CONFIG.GEMINI_API_KEY : null;
  if (!key || key === 'PASTE_YOUR_NEW_GEMINI_KEY_HERE') {
    document.getElementById('setupScreen').classList.add('visible');
    return;
  }

  const input = document.getElementById('userInput');
  const text = input.value.trim();
  if (!text) return;

  input.value = '';
  input.style.height = 'auto';
  isLoading = true;
  document.getElementById('sendBtn').disabled = true;

  appendMessage('user', text);
  chatHistory.push({ role: 'user', parts: [{ text }] });
  showTyping();

  try {
    const body = {
      system_instruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
      contents: chatHistory,
      generationConfig: {
        maxOutputTokens: CONFIG.MAX_TOKENS,
        temperature: CONFIG.TEMPERATURE
      }
    };

    const res = await fetch(geminiUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const data = await res.json();
    removeTyping();

    if (data.error) {
      appendMessage('bot', `⚠️ ${data.error.message}\n\nPlease check your API key in config.js.`);
    } else {
      const reply = data.candidates?.[0]?.content?.parts?.[0]?.text
        || "I'm here with you. Could you share a little more about how you're feeling?";
      appendMessage('bot', reply);
      chatHistory.push({ role: 'model', parts: [{ text: reply }] });
    }
  } catch (err) {
    removeTyping();
    appendMessage('bot', "I'm having trouble connecting right now. Please try again — I'm here for you. 🌿");
  }

  isLoading = false;
  document.getElementById('sendBtn').disabled = false;
  input.focus();
}
