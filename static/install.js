/**
 * Autoassistentti — One-time install script
 * Dealers paste this once into WPCode sitewide footer:
 * <script src="https://your-domain/install.js?dealer=salonautoliike"></script>
 *
 * This script automatically:
 * 1. Injects the chatbot bubble on every page
 * 2. Injects the finance calculator under every car listing
 * 3. Handles test drive bookings with email notifications
 */

(function() {
  'use strict';

  // ── Get dealer key from script URL ──────────────────
  var scripts = document.querySelectorAll('script[src*="install.js"]');
  var dealerKey = '';
  for (var i = 0; i < scripts.length; i++) {
    var src = scripts[i].src;
    var match = src.match(/[?&]dealer=([^&]+)/);
    if (match) { dealerKey = match[1]; break; }
  }

  if (!dealerKey) {
    console.warn('Autoassistentti: dealer key missing from script URL');
    return;
  }

  // ── Base URL (same origin as this script) ──────────
  var BASE_URL = (function() {
    var s = document.querySelector('script[src*="install.js"]');
    if (!s) return '';
    var url = new URL(s.src);
    return url.origin;
  })();

  // ── Load dealer config from server ─────────────────
  fetch(BASE_URL + '/api/dealer/' + dealerKey)
    .then(function(r) { return r.json(); })
    .then(function(config) {
      if (!config || config.error) {
        console.warn('Autoassistentti: dealer not found:', dealerKey);
        return;
      }
      injectChatbot(config);
      injectCalculators(config);
    })
    .catch(function(e) {
      console.warn('Autoassistentti: failed to load config', e);
    });

  // ══════════════════════════════════════════════════
  // 1. CHATBOT INJECTION
  // ══════════════════════════════════════════════════
  function injectChatbot(config) {
    // Inject Google Fonts
    var link = document.createElement('link');
    link.rel  = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,700;1,600&family=Outfit:wght@400;500;600&display=swap';
    document.head.appendChild(link);

    // Inject styles
    var style = document.createElement('style');
    style.textContent = `
      #aa-bubble {
        position: fixed; bottom: 24px; right: 24px;
        width: 56px; height: 56px;
        background: #111; border-radius: 50%;
        cursor: pointer; display: flex; align-items: center; justify-content: center;
        box-shadow: 0 4px 20px rgba(0,0,0,0.2);
        z-index: 99999; border: none;
        transition: transform 0.2s, box-shadow 0.2s;
        animation: aaBubblePop 0.4s cubic-bezier(0.34,1.56,0.64,1) both;
      }
      @keyframes aaBubblePop { from { transform:scale(0); opacity:0; } to { transform:scale(1); opacity:1; } }
      #aa-bubble:hover { transform: scale(1.08); box-shadow: 0 8px 28px rgba(0,0,0,0.25); }
      #aa-notif {
        position: absolute; top: 0; right: 0;
        width: 16px; height: 16px; background: #e53e3e;
        border-radius: 50%; border: 2px solid #fff;
        animation: aaNotifPop 0.3s 1.5s cubic-bezier(0.34,1.56,0.64,1) both;
      }
      @keyframes aaNotifPop { from { transform:scale(0); } to { transform:scale(1); } }
      #aa-window {
        position: fixed; bottom: 92px; right: 24px;
        width: 360px; max-height: 560px;
        background: #fff; border: 1px solid #e8e8e4; border-radius: 20px;
        display: flex; flex-direction: column; overflow: hidden;
        box-shadow: 0 8px 40px rgba(0,0,0,0.12);
        z-index: 99998;
        transform: scale(0.92) translateY(16px);
        transform-origin: bottom right;
        opacity: 0; pointer-events: none;
        transition: transform 0.3s cubic-bezier(0.34,1.56,0.64,1), opacity 0.2s;
      }
      #aa-window.aa-open { transform: scale(1) translateY(0); opacity: 1; pointer-events: all; }
      #aa-header { background: #111; padding: 16px 18px; display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
      .aa-av { width: 36px; height: 36px; background: #fff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0; }
      .aa-agent-name { font-family: 'Fraunces', serif; font-size: 14px; font-weight: 700; color: #fff; }
      .aa-status { display: flex; align-items: center; gap: 5px; font-size: 11px; color: rgba(255,255,255,0.45); margin-top: 1px; }
      .aa-dot { width: 6px; height: 6px; background: #68d391; border-radius: 50%; animation: aaPulse 2s ease infinite; }
      @keyframes aaPulse { 0%,100%{opacity:1;} 50%{opacity:0.4;} }
      #aa-close { background: rgba(255,255,255,0.1); border: none; width: 28px; height: 28px; border-radius: 50%; cursor: pointer; color: rgba(255,255,255,0.6); display: flex; align-items: center; justify-content: center; font-size: 14px; margin-left: auto; transition: background 0.15s; }
      #aa-close:hover { background: rgba(255,255,255,0.2); color: #fff; }
      #aa-messages { flex: 1; overflow-y: auto; padding: 16px 14px; display: flex; flex-direction: column; gap: 10px; scroll-behavior: smooth; }
      #aa-messages::-webkit-scrollbar { width: 3px; }
      #aa-messages::-webkit-scrollbar-thumb { background: #e8e8e4; border-radius: 2px; }
      .aa-msg { display: flex; gap: 7px; animation: aaMsgIn 0.25s ease both; }
      @keyframes aaMsgIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
      .aa-msg.aa-user { flex-direction: row-reverse; }
      .aa-mav { width: 26px; height: 26px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; flex-shrink: 0; margin-top: auto; font-weight: 600; }
      .aa-msg.aa-bot .aa-mav { background: #f0f0ec; color: #666; }
      .aa-msg.aa-user .aa-mav { background: #111; color: #fff; }
      .aa-bubble-msg { max-width: 76%; padding: 9px 13px; border-radius: 14px; font-family: 'Outfit', sans-serif; font-size: 13.5px; line-height: 1.55; word-break: break-word; }
      .aa-msg.aa-bot .aa-bubble-msg { background: #f7f7f5; color: #222; border-bottom-left-radius: 4px; border: 1px solid #efefeb; }
      .aa-msg.aa-user .aa-bubble-msg { background: #111; color: #fff; border-bottom-right-radius: 4px; }
      .aa-typing .aa-bubble-msg { padding: 12px 14px; }
      .aa-dots { display: flex; gap: 4px; align-items: center; }
      .aa-dot-t { width: 6px; height: 6px; background: #bbb; border-radius: 50%; animation: aaBounce 1.2s ease infinite; }
      .aa-dot-t:nth-child(2){animation-delay:0.18s;} .aa-dot-t:nth-child(3){animation-delay:0.36s;}
      @keyframes aaBounce { 0%,60%,100%{transform:translateY(0);background:#ccc;} 30%{transform:translateY(-5px);background:#888;} }
      #aa-qr { padding: 4px 14px 10px; display: flex; flex-wrap: wrap; gap: 6px; flex-shrink: 0; }
      .aa-qr-btn { background: #fff; border: 1px solid #e0e0dc; color: #333; padding: 6px 12px; border-radius: 100px; font-size: 12px; font-family: 'Outfit', sans-serif; cursor: pointer; transition: all 0.15s; white-space: nowrap; }
      .aa-qr-btn:hover { background: #111; border-color: #111; color: #fff; }
      #aa-input-area { padding: 10px 12px 14px; display: flex; gap: 8px; border-top: 1px solid #f0f0ec; background: #fff; flex-shrink: 0; }
      #aa-input { flex: 1; background: #f7f7f5; border: 1px solid #e8e8e4; border-radius: 10px; padding: 9px 13px; font-family: 'Outfit', sans-serif; font-size: 13px; color: #222; outline: none; resize: none; transition: border-color 0.15s; }
      #aa-input:focus { border-color: #bbb; }
      #aa-send { width: 36px; height: 36px; background: #111; border: none; border-radius: 9px; cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0; align-self: flex-end; transition: background 0.15s, transform 0.15s; }
      #aa-send:hover { background: #333; transform: translateY(-1px); }
      #aa-send:disabled { opacity: 0.3; cursor: not-allowed; transform: none; }
      .aa-powered { text-align: center; font-size: 10px; color: #ccc; padding: 6px 0 10px; flex-shrink: 0; font-family: 'Outfit', sans-serif; }

      /* Booking form inside chat */
      .aa-booking-form { background: #f7f7f5; border: 1px solid #e8e8e4; border-radius: 12px; padding: 14px; margin-top: 4px; }
      .aa-bf-title { font-size: 12px; font-weight: 600; color: #111; margin-bottom: 10px; }
      .aa-bf-input { width: 100%; background: #fff; border: 1px solid #e8e8e4; border-radius: 8px; padding: 8px 10px; font-family: 'Outfit', sans-serif; font-size: 12px; color: #222; outline: none; margin-bottom: 7px; }
      .aa-bf-btn { width: 100%; background: #111; border: none; border-radius: 8px; padding: 9px; font-family: 'Outfit', sans-serif; font-size: 12px; font-weight: 600; color: #fff; cursor: pointer; transition: background 0.15s; }
      .aa-bf-btn:hover { background: #333; }

      @media (max-width: 420px) {
        #aa-window { width: calc(100vw - 20px); right: 10px; bottom: 84px; max-height: 70vh; }
        #aa-bubble { right: 16px; bottom: 16px; }
      }
    `;
    document.head.appendChild(style);

    // Build HTML
    var bubble = document.createElement('button');
    bubble.id = 'aa-bubble';
    bubble.setAttribute('aria-label', 'Avaa chat');
    bubble.innerHTML = `
      <div id="aa-notif"></div>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    `;

    var win = document.createElement('div');
    win.id = 'aa-window';
    win.innerHTML = `
      <div id="aa-header">
        <div class="aa-av">🚗</div>
        <div>
          <div class="aa-agent-name">${config.name}</div>
          <div class="aa-status"><div class="aa-dot"></div>Verkossa nyt</div>
        </div>
        <button id="aa-close" aria-label="Sulje">✕</button>
      </div>
      <div id="aa-messages"></div>
      <div id="aa-qr"></div>
      <div id="aa-input-area">
        <textarea id="aa-input" rows="1" placeholder="Kirjoita viesti..."></textarea>
        <button id="aa-send" aria-label="Lähetä">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"/>
            <polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </button>
      </div>
      <div class="aa-powered">Powered by <strong style="color:#111;">Autoassistentti</strong></div>
    `;

    document.body.appendChild(bubble);
    document.body.appendChild(win);

    // State
    var isOpen = false, isTyping = false, greeted = false;
    var history = [];

    var SYSTEM = `Olet ${config.name}:n asiakaspalveluassistentti. Olet ystävällinen ja asiantunteva. Vastaat aina suomeksi. Pidä viestit lyhyinä (max 3 lausetta).

Tietosi:
- Nimi: ${config.name}
- Osoite: ${config.address || 'ei ilmoitettu'}
- Puhelin: ${config.phone || 'ei ilmoitettu'}
- Sähköposti: ${config.email || 'ei ilmoitettu'}
- Aukioloajat: ${config.hours || 'ei ilmoitettu'}
${config.extra ? '- Lisätiedot: ' + config.extra : ''}

Jos asiakas haluaa varata koeajon, pyydä heidän nimensä, puhelinnumeronsa ja toivottu aika. Kerro myös että he voivat varata osoitteesta: ${BASE_URL}/varaa-koeajo.html?dealer=${dealerKey}`;

    function toggle() {
      isOpen = !isOpen;
      win.classList.toggle('aa-open', isOpen);
      var notif = document.getElementById('aa-notif');
      if (notif) notif.style.display = 'none';
      if (isOpen && !greeted) {
        greeted = true;
        setTimeout(function() {
          addMsg('bot', config.greeting || ('Hei! 👋 Tervetuloa ' + config.name + ':een. Miten voin auttaa?'));
          showQR(['Näytä autot', 'Varaa koeajo', 'Rahoitus', 'Aukioloajat']);
        }, 400);
      }
      if (isOpen) setTimeout(function() { document.getElementById('aa-input').focus(); }, 350);
    }

    bubble.addEventListener('click', toggle);
    document.getElementById('aa-close').addEventListener('click', toggle);

    document.getElementById('aa-send').addEventListener('click', sendMsg);
    document.getElementById('aa-input').addEventListener('keydown', function(e) {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMsg(); }
    });

    function addMsg(role, text) {
      var msgs = document.getElementById('aa-messages');
      var div = document.createElement('div');
      div.className = 'aa-msg aa-' + role;
      var av = document.createElement('div'); av.className = 'aa-mav'; av.textContent = role === 'bot' ? '🚗' : 'S';
      var bub = document.createElement('div'); bub.className = 'aa-bubble-msg'; bub.textContent = text;
      div.appendChild(av); div.appendChild(bub);
      msgs.appendChild(div);
      msgs.scrollTop = msgs.scrollHeight;
    }

    function showTyping() {
      var msgs = document.getElementById('aa-messages');
      var div = document.createElement('div'); div.className = 'aa-msg aa-bot aa-typing'; div.id = 'aa-typing';
      var av = document.createElement('div'); av.className = 'aa-mav'; av.textContent = '🚗';
      var bub = document.createElement('div'); bub.className = 'aa-bubble-msg';
      bub.innerHTML = '<div class="aa-dots"><div class="aa-dot-t"></div><div class="aa-dot-t"></div><div class="aa-dot-t"></div></div>';
      div.appendChild(av); div.appendChild(bub);
      msgs.appendChild(div); msgs.scrollTop = msgs.scrollHeight;
    }

    function removeTyping() { var el = document.getElementById('aa-typing'); if (el) el.remove(); }

    function showQR(opts) {
      var qr = document.getElementById('aa-qr'); qr.innerHTML = '';
      opts.forEach(function(o) {
        var btn = document.createElement('button'); btn.className = 'aa-qr-btn'; btn.textContent = o;
        btn.onclick = function() { qr.innerHTML = ''; sendText(o); };
        qr.appendChild(btn);
      });
    }

    function sendMsg() {
      var input = document.getElementById('aa-input');
      var text = input.value.trim();
      if (!text || isTyping) return;
      input.value = ''; input.style.height = '';
      sendText(text);
    }

    function sendText(text) {
      document.getElementById('aa-qr').innerHTML = '';
      addMsg('user', text);
      history.push({ role: 'user', content: text });

      // Check for booking intent
      var lower = text.toLowerCase();
      if (lower.includes('koeajo') || lower.includes('varaa') || lower.includes('booking')) {
        addMsg('bot', 'Voit varata koeajon helposti täältä 👉');
        var msgs = document.getElementById('aa-messages');
        var linkDiv = document.createElement('div');
        linkDiv.className = 'aa-msg aa-bot';
        linkDiv.innerHTML = `<div class="aa-mav">🚗</div><div class="aa-bubble-msg" style="padding:0; overflow:hidden;">
          <a href="${BASE_URL}/varaa-koeajo.html?dealer=${dealerKey}" target="_blank"
            style="display:block; padding:10px 13px; background:#111; color:#fff; text-decoration:none; font-size:13px; font-weight:600; font-family:'Outfit',sans-serif; border-radius:14px; border-bottom-left-radius:4px;">
            📅 Varaa koeajo →
          </a>
        </div>`;
        msgs.appendChild(linkDiv);
        msgs.scrollTop = msgs.scrollHeight;
        history.push({ role: 'assistant', content: 'Voit varata koeajon helposti verkossa.' });
        return;
      }

      getReply();
    }

    function getReply() {
      isTyping = true;
      document.getElementById('aa-send').disabled = true;
      showTyping();

      fetch(BASE_URL + '/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history, system: SYSTEM, max_tokens: 300 })
      })
      .then(function(r) { return r.json(); })
      .then(function(data) {
        removeTyping(); isTyping = false;
        document.getElementById('aa-send').disabled = false;
        var reply = data.content && data.content[0] ? data.content[0].text : 'Pahoittelen, jokin meni pieleen. Soita: ' + (config.phone || '');
        history.push({ role: 'assistant', content: reply });
        addMsg('bot', reply);
        var lw = reply.toLowerCase();
        if (lw.includes('koeajo')) showQR(['Varaa koeajo', 'Katson ensin']);
        else if (lw.includes('rahoitus')) showQR(['Kerro lisää', 'Laske kuukausierä']);
      })
      .catch(function() {
        removeTyping(); isTyping = false;
        document.getElementById('aa-send').disabled = false;
        addMsg('bot', 'Tekninen ongelma. Soita: ' + (config.phone || ''));
      });
    }
  }

  // ══════════════════════════════════════════════════
  // 2. FINANCE CALCULATOR AUTO-INJECTION
  // ══════════════════════════════════════════════════
  function injectCalculators(config) {
    // Try to find car price on the page using common patterns
    // Works with most WordPress car listing plugins and themes

    function tryInject() {
      // Common price selectors used by WordPress car themes/plugins
      var priceSelectors = [
        '.price', '.car-price', '.vehicle-price', '.listing-price',
        '[class*="price"]', '[class*="Price"]',
        '.amount', '.woocommerce-Price-amount',
        'h2.price', 'span.price', 'div.price', 'p.price'
      ];

      var priceEl = null;
      for (var i = 0; i < priceSelectors.length; i++) {
        var el = document.querySelector(priceSelectors[i]);
        if (el && el.textContent.match(/[\d\s]+/)) { priceEl = el; break; }
      }

      // Extract price number
      var price = 0;
      if (priceEl) {
        var priceText = priceEl.textContent.replace(/[^\d]/g, '');
        price = parseInt(priceText) || 0;
      }

      // Get car name from page title or h1
      var carName = '';
      var h1 = document.querySelector('h1');
      if (h1) carName = h1.textContent.trim().split('\n')[0].trim();
      if (!carName) carName = document.title.split('|')[0].trim();

      // Only inject if we found a reasonable price OR if it's a single car page
      var isSinglePage = (
        document.querySelector('.single-car') ||
        document.querySelector('.single-vehicle') ||
        document.querySelector('.car-single') ||
        document.querySelector('[class*="single"]') ||
        window.location.pathname.includes('/auto/') ||
        window.location.pathname.includes('/car/') ||
        window.location.pathname.includes('/vehicle/')
      );

      if (price < 500 && !isSinglePage) return; // Don't inject on listing pages

      // Find injection point — after the price or after main content
      var insertAfter = priceEl ||
        document.querySelector('.car-details') ||
        document.querySelector('.vehicle-details') ||
        document.querySelector('.entry-content') ||
        document.querySelector('article') ||
        document.querySelector('main');

      if (!insertAfter) return;

      // Don't inject twice
      if (document.getElementById('aa-calculator')) return;

      var wrapper = document.createElement('div');
      wrapper.id = 'aa-calculator';
      wrapper.style.cssText = 'margin: 24px 0; max-width: 480px;';

      var params = '?dealer=' + dealerKey;
      if (price > 0) params += '&price=' + price;
      if (carName) params += '&car=' + encodeURIComponent(carName);

      var iframe = document.createElement('iframe');
      iframe.src = BASE_URL + '/rahoituslaskin.html' + params;
      iframe.style.cssText = 'width:100%; height:560px; border:none; border-radius:20px;';
      iframe.setAttribute('scrolling', 'no');

      wrapper.appendChild(iframe);

      // Insert after the target element
      insertAfter.parentNode.insertBefore(wrapper, insertAfter.nextSibling);
    }

    // Try immediately and after DOM settles
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', tryInject);
    } else {
      tryInject();
    }
    setTimeout(tryInject, 1500); // Second attempt after dynamic content loads
  }

})();
