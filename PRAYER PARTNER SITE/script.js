// --- CONFIGURATION ---
const ADMIN_PASSWORD = "wireshark";

const inspirationData = [
    { verse: "Philippians 4:13 - 'I can do all things through Christ who strengthens me.'", note: "Whatever challenge you face today, remember you aren't doing it alone.", prayer: "Lord, give my partner the strength to overcome today's hurdles." },
    { verse: "Proverbs 3:5 - 'Trust in the Lord with all your heart.'", note: "Let go of the need to control everything. God has a plan.", prayer: "Father, help my prayer partner to rest in Your perfect wisdom today." },
    { verse: "Joshua 1:9 - 'Be strong and courageous... for the Lord is with you.'", note: "Fear is a liar. Step out in faith today!", prayer: "God, fill my partner with courage and a spirit of boldness." },
    { verse: "Psalm 23:1 - 'The Lord is my shepherd; I shall not want.'", note: "He provides everything we truly need in His perfect timing.", prayer: "Heavenly Father, provide for every need of my partner this week." },
    { verse: "Lamentations 3:22-23 - 'His mercies are new every morning.'", note: "Today is a fresh start. Leave yesterday's worries behind.", prayer: "Lord, let my partner feel Your fresh grace and mercy today." }
];

// --- STATE ---
let members = JSON.parse(localStorage.getItem('prayerMembers')) || [];
let currentPairs = JSON.parse(localStorage.getItem('prayerPairs')) || { month: null, data: [] };
let forcedInspirationIndex = localStorage.getItem('forcedInspIndex');

// DOM
const authInput = document.getElementById('adminPassword');
const showLoginBtn = document.getElementById('showLoginBtn');
const loginPanel = document.getElementById('loginPanel');
const loginBtn = document.getElementById('loginBtn');
const cancelLoginBtn = document.getElementById('cancelLoginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const adminSection = document.getElementById('adminSection');
const registrationForm = document.getElementById('registrationForm');
const regMessage = document.getElementById('regMessage');
const memberListDiv = document.getElementById('memberList');
const pairsDisplay = document.getElementById('pairsDisplay');
const generateBtn = document.getElementById('generateBtn');
const shuffleDailyBtn = document.getElementById('shuffleDailyBtn');

// --- INIT ---
document.addEventListener('DOMContentLoaded', () => {
    checkMonthlyAutomation();
    renderPublicPairs();
    renderAdminMembers();
    updateDailyInspiration();
    if (sessionStorage.getItem('isLoggedIn') === 'true') applyLoggedInUI();
});

// --- AUTH ---
showLoginBtn.addEventListener('click', () => { showLoginBtn.classList.add('hidden'); loginPanel.classList.remove('hidden'); authInput.focus(); });
cancelLoginBtn.addEventListener('click', () => { loginPanel.classList.add('hidden'); showLoginBtn.classList.remove('hidden'); authInput.value = ''; });

function applyLoggedInUI() {
    showLoginBtn.classList.add('hidden'); loginPanel.classList.add('hidden');
    logoutBtn.classList.remove('hidden'); adminSection.classList.remove('hidden');
}

function attemptLogin() {
    if (authInput.value === ADMIN_PASSWORD) {
        sessionStorage.setItem('isLoggedIn', 'true');
        applyLoggedInUI();
        authInput.value = '';
    } else alert("Invalid Password!");
}

loginBtn.addEventListener('click', attemptLogin);
authInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') attemptLogin(); });
logoutBtn.addEventListener('click', () => {
    sessionStorage.removeItem('isLoggedIn');
    adminSection.classList.add('hidden'); logoutBtn.classList.add('hidden');
    showLoginBtn.classList.remove('hidden');
});

// --- REGISTRATION (UPDATED WITH IN-PAGE MESSAGE) ---
registrationForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('firstName').value.trim();
    const occupation = document.getElementById('occupation').value;
    const gender = document.getElementById('gender').value;

    const alreadyRegistered = members.some(m => m.name.toLowerCase() === name.toLowerCase());

    if (alreadyRegistered) {
        showMessage(`"${name}" is already in the database.`, 'error');
        registrationForm.reset();
        return;
    }

    members.push({ id: Date.now(), name, occupation, gender });
    localStorage.setItem('prayerMembers', JSON.stringify(members));
    renderAdminMembers();
    registrationForm.reset();
    showMessage(`God bless you, ${name}! You are registered.`, 'success');
});

function showMessage(text, type) {
    regMessage.innerText = text;
    regMessage.className = `message-area msg-${type}`;
    regMessage.classList.remove('hidden');
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        regMessage.classList.add('hidden');
    }, 5000);
}

// --- DAILY WORD ---
function updateDailyInspiration() {
    let index;
    if (forcedInspirationIndex !== null) index = parseInt(forcedInspirationIndex);
    else {
        const today = new Date();
        const dateSeed = today.getFullYear() + today.getMonth() + today.getDate();
        index = dateSeed % inspirationData.length;
    }
    const data = inspirationData[index];
    document.getElementById('bibleVerse').innerText = data.verse;
    document.getElementById('encouragementNote').innerText = data.note;
    document.getElementById('prayerContent').innerText = data.prayer;
}

shuffleDailyBtn.addEventListener('click', () => {
    const newIdx = Math.floor(Math.random() * inspirationData.length);
    localStorage.setItem('forcedInspIndex', newIdx);
    forcedInspirationIndex = newIdx;
    updateDailyInspiration();
    alert("Daily inspiration reshuffled!");
});

// --- ADMIN LIST ---
window.removeMember = function(id) {
    if(confirm("Remove this member permanently?")) {
        members = members.filter(m => m.id !== id);
        localStorage.setItem('prayerMembers', JSON.stringify(members));
        renderAdminMembers();
    }
};

function renderAdminMembers() {
    document.getElementById('memberCount').innerText = members.length;
    memberListDiv.innerHTML = members.map(m => `
        <div class="member-tag">
            <span><strong>${m.name}</strong></span>
            <button class="remove-btn" onclick="removeMember(${m.id})">✕</button>
        </div>
    `).join('');
}

// --- PAIRING ---
function generatePairs() {
    if (members.length < 2) return alert("At least 2 members needed.");
    let shuffled = [...members].sort(() => 0.5 - Math.random());
    let pairs = [];
    while (shuffled.length > 0) {
        if (shuffled.length === 3) pairs.push(shuffled.splice(0, 3));
        else pairs.push(shuffled.splice(0, 2));
    }
    const now = new Date();
    currentPairs = { month: `${now.getMonth()}-${now.getFullYear()}`, timestamp: now.toLocaleString(), data: pairs };
    localStorage.setItem('prayerPairs', JSON.stringify(currentPairs));
    localStorage.removeItem('forcedInspIndex');
    forcedInspirationIndex = null;
    updateDailyInspiration();
    renderPublicPairs();
}

function renderPublicPairs() {
    if (!currentPairs.data || currentPairs.data.length === 0) {
        pairsDisplay.innerHTML = `<p style="color:#888; text-align:center;">Admin has not published pairs yet.</p>`;
        return;
    }
    pairsDisplay.innerHTML = currentPairs.data.map(group => `
        <div class="pair-item">${group.map(p => `${p.occupation} ${p.name}`).join(' ↔ ')}</div>
    `).join('');
    document.getElementById('lastUpdated').innerText = `Last Updated: ${currentPairs.timestamp}`;
}

function checkMonthlyAutomation() {
    const today = new Date();
    const key = `${today.getMonth()}-${today.getFullYear()}`;
    if (today.getDate() >= 3 && currentPairs.month !== key) generatePairs();
}

generateBtn.addEventListener('click', generatePairs);