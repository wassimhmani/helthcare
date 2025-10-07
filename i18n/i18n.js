(function(){
  const STORAGE_KEY = 'app_lang';
  const DEFAULT_LANG = 'en';
  const SUPPORTED = ['en','fr'];
  let current = DEFAULT_LANG;
  let dict = {};

  function getStoredLang(){
    try { return localStorage.getItem(STORAGE_KEY) || ''; } catch { return ''; }
  }
  function storeLang(lang){
    try { localStorage.setItem(STORAGE_KEY, lang); } catch {}
  }

  async function loadDictionary(lang){
    const res = await fetch(`i18n/${lang}.json`, { cache: 'no-cache' });
    if(!res.ok) throw new Error('Failed to load lang file');
    return await res.json();
  }

  function translateElement(el){
    const key = el.getAttribute('data-i18n');
    const attrMap = el.getAttribute('data-i18n-attr');
    if(key){
      const val = lookup(key);
      if(val !== null){
        if(el.tagName === 'INPUT' || el.tagName === 'TEXTAREA'){
          if(!attrMap || attrMap.includes('value')) el.value = val;
        } else {
          el.textContent = val;
        }
      }
    }
    if(attrMap){
      const pairs = attrMap.split(',').map(s=>s.trim()).filter(Boolean);
      for(const p of pairs){
        const [attr, attrKeyRaw] = p.split(':').map(s=>s.trim());
        const attrKey = attrKeyRaw || el.getAttribute('data-i18n');
        if(attr && attrKey){
          const v = lookup(attrKey);
          if(v !== null){
            el.setAttribute(attr, v);
          }
        }
      }
    }
  }

  function walkAndTranslate(root=document){
    const nodes = root.querySelectorAll('[data-i18n], [data-i18n-attr]');
    nodes.forEach(translateElement);
    // document title
    const titleKey = document.querySelector('title')?.getAttribute('data-i18n');
    if(titleKey){
      const v = lookup(titleKey);
      if(v !== null) document.title = v;
    }
  }

  function lookup(key){
    if(!key) return null;
    const parts = key.split('.');
    let cur = dict;
    for(const part of parts){
      if(cur && Object.prototype.hasOwnProperty.call(cur, part)){
        cur = cur[part];
      } else {
        return null;
      }
    }
    if(typeof cur === 'string') return cur;
    return null;
  }

  async function setLanguage(lang){
    if(!SUPPORTED.includes(lang)) lang = DEFAULT_LANG;
    if(lang === current && Object.keys(dict).length){
      document.documentElement.setAttribute('lang', lang);
      return;
    }
    const loaded = await loadDictionary(lang);
    dict = loaded || {};
    current = lang;
    document.documentElement.setAttribute('lang', lang);
    storeLang(lang);
    walkAndTranslate();
  }

  function detectInitial(){
    const stored = getStoredLang();
    if(stored && SUPPORTED.includes(stored)) return stored;
    const nav = (navigator.language || navigator.userLanguage || 'en').toLowerCase();
    if(nav.startsWith('fr')) return 'fr';
    return DEFAULT_LANG;
  }

  async function initI18n(opts={}){
    const initLang = opts.lang || detectInitial();
    await setLanguage(initLang);
    // bind switchers
    document.querySelectorAll('[data-i18n-switcher]')
      .forEach(el => {
        el.value = current;
        el.addEventListener('change', e => {
          setLanguage(e.target.value);
        });
      });
  }

  function t(key, fallback){
    const v = lookup(key);
    return v === null ? (fallback ?? key) : v;
  }

  // expose
  window.I18n = { setLanguage, initI18n, t };
  window.t = t;
})();
