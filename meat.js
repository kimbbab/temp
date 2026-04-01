const myPageUrl = "https://kimbbab.github.io/temp/meat.html";

// 공개 페이지에는 anon key만 사용합니다. service_role 키는 절대 프론트엔드에 넣지 마세요.
const SUPABASE_URL = "https://dlmpnylvetkqqpkaravn.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsbXBueWx2ZXRrcXFwa2FyYXZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2MjM5NDAsImV4cCI6MjA4ODE5OTk0MH0.erzBzoxyoFYc6-1aQMxSEs84M0z_vqXbuoRaWrKM2dk";
const RESTAURANTS_TABLE = "restaurants";
const REFRESH_INTERVAL_MS = 15000;

const defaultRestaurants = [];
const palette = [
    "#ffb8b8",
    "#ffcccc",
    "#f8efba",
    "#c8d6e5",
    "#c7ecee",
    "#dff9fb",
    "#f6e58d",
    "#ffbe76",
    "#badc58",
    "#d1ccc0"
];

const urlParams = new URLSearchParams(window.location.search);
const sharedResult = urlParams.get("result");

const rouletteView = document.getElementById("roulette-view");
const sharedView = document.getElementById("shared-view");
const wheelCanvas = document.getElementById("wheel");
const ctx = wheelCanvas.getContext("2d");
const spinBtn = document.getElementById("spinBtn");
const resultText = document.getElementById("result-text");
const resultCard = document.getElementById("result-card");
const resultName = document.getElementById("result-name");
const resultDesc = document.getElementById("result-desc");
const copyBtn = document.getElementById("copyBtn");
const kakaoBtn = document.getElementById("kakaoBtn");
const restaurantCount = document.getElementById("restaurant-count");
const sharedRestaurantCount = document.getElementById("shared-restaurant-count");
const candidateList = document.getElementById("candidate-list");
const sharedList = document.getElementById("restaurant-list");
const restaurantForm = document.getElementById("restaurant-form");
const submitRestaurantBtn = document.getElementById("submitRestaurantBtn");
const refreshRestaurantsBtn = document.getElementById("refreshRestaurantsBtn");
const formMessage = document.getElementById("form-message");
const loadMessage = document.getElementById("load-message");
const configWarning = document.getElementById("config-warning");
const goHomeBtn = document.getElementById("go-home-btn");
const restaurantNameInput = document.getElementById("restaurant-name");

let restaurants = [];
let currentAngle = 0;
let isSpinning = false;
let spinFrameId = null;
let currentSelectedName = "";
let refreshTimer = null;

try {
    if (window.Kakao && !Kakao.isInitialized()) {
        Kakao.init("527014d7c9b229fbcbc75917689b6e2d");
    }
} catch (error) {
    console.warn("카카오 초기화 대기 중", error);
}

function hasBackendConfig() {
    return !SUPABASE_URL.includes("YOUR_PROJECT") && !SUPABASE_ANON_KEY.includes("YOUR_SUPABASE");
}

function normalizeRestaurant(record) {
    return {
        id: record.id || record.name,
        name: String(record.name || "").trim(),
        createdAt: record.created_at || ""
    };
}

function getRestaurantByName(name) {
    return restaurants.find((restaurant) => restaurant.name === name) || null;
}

function setMessage(element, text, type = "info") {
    element.textContent = text;
    element.className = "";
    if (type === "ok") {
        element.classList.add("message-ok");
    } else if (type === "error") {
        element.classList.add("message-error");
    } else {
        element.classList.add("message-info");
    }
}

function renderConfigState() {
    if (hasBackendConfig()) {
        configWarning.style.display = "none";
        return;
    }

    configWarning.style.display = "block";
    configWarning.innerHTML = "지금은 임시 모드입니다. Supabase URL과 anon key가 들어가면 모두가 같은 후보 목록을 공유합니다.";
}

function supabaseHeaders(extra = {}) {
    return {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json",
        ...extra
    };
}

async function loadRestaurants(options = {}) {
    const { silent = false } = options;

    if (!silent) {
        setMessage(loadMessage, "후보 목록을 불러오는 중입니다...", "info");
    }

    try {
        if (!hasBackendConfig()) {
            restaurants = defaultRestaurants.map(normalizeRestaurant);
        } else {
            const response = await fetch(
                `${SUPABASE_URL}/rest/v1/${RESTAURANTS_TABLE}?select=id,name,created_at&order=created_at.asc`,
                { headers: supabaseHeaders() }
            );

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || "후보 목록을 불러오지 못했습니다.");
            }

            const data = await response.json();
            restaurants = data.map(normalizeRestaurant).filter((restaurant) => restaurant.name);
        }

        updateCounters();
        renderCandidateList();
        renderSharedList(sharedResult);
        drawWheel();
        updateSpinAvailability();

        if (!silent) {
            setMessage(loadMessage, `후보 ${restaurants.length}곳을 불러왔습니다.`, "ok");
        }
    } catch (error) {
        console.error(error);
        restaurants = defaultRestaurants.map(normalizeRestaurant);
        updateCounters();
        renderCandidateList();
        renderSharedList(sharedResult);
        drawWheel();
        updateSpinAvailability();
        setMessage(loadMessage, "후보 목록을 불러오지 못했습니다.", "error");
    }
}

function updateCounters() {
    restaurantCount.textContent = `${restaurants.length}곳`;
    sharedRestaurantCount.textContent = `${restaurants.length}곳`;
}

function renderRestaurantCard(restaurant, options = {}) {
    const { highlight = false, showDelete = false } = options;
    const card = document.createElement("div");
    card.className = "list-item" + (highlight ? " highlight" : "");

    const title = document.createElement("h3");
    title.textContent = restaurant.name;
    card.appendChild(title);

    const meta = document.createElement("div");
    meta.className = "list-meta";

    const source = document.createElement("span");
    source.className = "badge";
    source.textContent = "후보";
    meta.appendChild(source);

    if (showDelete) {
        const deleteBtn = document.createElement("button");
        deleteBtn.type = "button";
        deleteBtn.className = "delete-btn";
        deleteBtn.textContent = "삭제";
        deleteBtn.addEventListener("click", () => deleteRestaurant(restaurant));
        meta.appendChild(deleteBtn);
    }

    card.appendChild(meta);
    return card;
}

function renderCandidateList() {
    candidateList.innerHTML = "";

    if (!restaurants.length) {
        const empty = document.createElement("div");
        empty.className = "list-item";
        const title = document.createElement("h3");
        title.textContent = "후보가 없습니다";
        empty.appendChild(title);
        candidateList.appendChild(empty);
        return;
    }

    restaurants.forEach((restaurant) => {
        candidateList.appendChild(renderRestaurantCard(restaurant, { showDelete: true }));
    });
}

function renderSharedList(highlightName) {
    sharedList.innerHTML = "";

    if (!restaurants.length) {
        const empty = document.createElement("div");
        empty.className = "list-item";
        const title = document.createElement("h3");
        title.textContent = "현재 후보가 없습니다";
        empty.appendChild(title);
        sharedList.appendChild(empty);
        return;
    }

    restaurants.forEach((restaurant) => {
        sharedList.appendChild(renderRestaurantCard(restaurant, { highlight: restaurant.name === highlightName }));
    });
}

function drawWheelPlaceholder(message) {
    ctx.clearRect(0, 0, wheelCanvas.width, wheelCanvas.height);
    ctx.beginPath();
    ctx.fillStyle = "#f1f5f9";
    ctx.arc(wheelCanvas.width / 2, wheelCanvas.height / 2, wheelCanvas.width / 2 - 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#64748b";
    ctx.font = "bold 20px 'Malgun Gothic'";
    const lines = message.split("\n");
    lines.forEach((line, index) => {
        const width = ctx.measureText(line).width;
        ctx.fillText(line, wheelCanvas.width / 2 - width / 2, wheelCanvas.height / 2 + index * 28 - 14);
    });
}

function drawWheel() {
    if (!restaurants.length) {
        drawWheelPlaceholder("후보가 없습니다\n후보를 추가해주세요");
        return;
    }

    const arc = Math.PI * 2 / restaurants.length;
    ctx.clearRect(0, 0, wheelCanvas.width, wheelCanvas.height);

    restaurants.forEach((restaurant, index) => {
        const angle = currentAngle + index * arc;
        ctx.beginPath();
        ctx.fillStyle = palette[index % palette.length];
        ctx.moveTo(wheelCanvas.width / 2, wheelCanvas.height / 2);
        ctx.arc(wheelCanvas.width / 2, wheelCanvas.height / 2, wheelCanvas.width / 2, angle, angle + arc, false);
        ctx.fill();

        ctx.save();
        ctx.fillStyle = "#2f3542";
        ctx.font = "bold 18px 'Malgun Gothic'";
        ctx.translate(
            wheelCanvas.width / 2 + Math.cos(angle + arc / 2) * 100,
            wheelCanvas.height / 2 + Math.sin(angle + arc / 2) * 100
        );
        ctx.rotate(angle + arc / 2 + Math.PI / 2);
        const title = restaurant.name.length > 8 ? restaurant.name.slice(0, 8) + "…" : restaurant.name;
        ctx.fillText(title, -ctx.measureText(title).width / 2, 0);
        ctx.restore();
    });
}

function updateSpinAvailability() {
    const disabled = restaurants.length < 2;
    spinBtn.disabled = disabled || isSpinning;
    if (disabled) {
        resultText.textContent = "후보가 2곳 이상 있어야 룰렛을 돌릴 수 있어요.";
    } else if (!currentSelectedName && !isSpinning) {
        resultText.textContent = "";
    }
}

function clearResult() {
    currentSelectedName = "";
    resultText.textContent = restaurants.length < 2 ? "후보가 2곳 이상 있어야 룰렛을 돌릴 수 있어요." : "";
    resultName.textContent = "";
    resultCard.style.display = "none";
    resultCard.style.opacity = 0;
}

function validateRestaurantName(name) {
    if (!name || name.length < 2) {
        throw new Error("식당 이름은 2글자 이상 입력해주세요.");
    }
}

async function addRestaurant(event) {
    event.preventDefault();
    const name = restaurantNameInput.value.trim();

    try {
        validateRestaurantName(name);

        const duplicate = restaurants.some((restaurant) => restaurant.name.toLowerCase() === name.toLowerCase());
        if (duplicate) {
            throw new Error("같은 이름의 후보가 이미 있습니다.");
        }

        if (!hasBackendConfig()) {
            throw new Error("Supabase 설정값이 아직 적용되지 않았습니다.");
        }

        submitRestaurantBtn.disabled = true;
        setMessage(formMessage, "후보를 저장하는 중입니다...", "info");

        const response = await fetch(`${SUPABASE_URL}/rest/v1/${RESTAURANTS_TABLE}`, {
            method: "POST",
            headers: supabaseHeaders({
                "Prefer": "return=representation"
            }),
            body: JSON.stringify([{ name }])
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || "후보를 저장하지 못했습니다.");
        }

        restaurantForm.reset();
        setMessage(formMessage, `"${name}" 후보를 추가했습니다.`, "ok");
        await loadRestaurants({ silent: true });
    } catch (error) {
        console.error(error);
        setMessage(formMessage, error.message || "후보 저장 중 오류가 발생했습니다.", "error");
    } finally {
        submitRestaurantBtn.disabled = false;
    }
}

async function deleteRestaurant(restaurant) {
    if (!confirm(`"${restaurant.name}" 후보를 삭제할까요?`)) {
        return;
    }

    try {
        setMessage(formMessage, `"${restaurant.name}" 후보를 삭제하는 중입니다...`, "info");

        const response = await fetch(
            `${SUPABASE_URL}/rest/v1/${RESTAURANTS_TABLE}?id=eq.${encodeURIComponent(restaurant.id)}`,
            {
                method: "DELETE",
                headers: supabaseHeaders({
                    "Prefer": "return=minimal"
                })
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || "후보를 삭제하지 못했습니다.");
        }

        if (currentSelectedName === restaurant.name) {
            clearResult();
        }

        setMessage(formMessage, `"${restaurant.name}" 후보를 삭제했습니다.`, "ok");
        await loadRestaurants({ silent: true });
    } catch (error) {
        console.error(error);
        setMessage(formMessage, error.message || "후보 삭제 중 오류가 발생했습니다.", "error");
    }
}

function showRouletteView() {
    rouletteView.style.display = "flex";
    sharedView.style.display = "none";
}

function showSharedView() {
    rouletteView.style.display = "none";
    sharedView.style.display = "flex";
}

function getCurrentShareLink() {
    return `${myPageUrl}?result=${encodeURIComponent(currentSelectedName)}`;
}

function spin() {
    if (isSpinning || restaurants.length < 2) {
        return;
    }

    isSpinning = true;
    updateSpinAvailability();
    resultText.textContent = "두구두구두구... 🥁";
    resultCard.style.opacity = 0;
    setTimeout(() => {
        resultCard.style.display = "none";
    }, 250);

    const arc = Math.PI * 2 / restaurants.length;
    const spinAngleStart = Math.random() * 10 + 20;
    let spinTime = 0;
    const spinTimeTotal = Math.random() * 3000 + 4000;

    function rotateWheel() {
        spinTime += 30;
        if (spinTime >= spinTimeTotal) {
            stopRotateWheel(arc);
            return;
        }

        const spinAngle = spinAngleStart - easeOut(spinTime, 0, spinAngleStart, spinTimeTotal);
        currentAngle += spinAngle * Math.PI / 180;
        drawWheel();
        spinFrameId = requestAnimationFrame(rotateWheel);
    }

    rotateWheel();
}

function stopRotateWheel(arc) {
    cancelAnimationFrame(spinFrameId);

    const degrees = currentAngle * 180 / Math.PI;
    const arcDegrees = arc * 180 / Math.PI;
    const normalized = (360 - (degrees % 360) + 360) % 360;
    const index = Math.floor(normalized / arcDegrees) % restaurants.length;
    const selectedRestaurant = restaurants[index];

    currentSelectedName = selectedRestaurant.name;
    resultText.innerHTML = `🎉 <b>${selectedRestaurant.name}</b> 당첨! 🎉`;
    resultName.textContent = selectedRestaurant.name;
    resultCard.style.display = "block";
    setTimeout(() => {
        resultCard.style.opacity = 1;
    }, 50);

    isSpinning = false;
    updateSpinAvailability();
}

function easeOut(t, b, c, d) {
    const ts = (t /= d) * t;
    const tc = ts * t;
    return b + c * (tc + -3 * ts + 3 * t);
}

function handleCopyShare() {
    if (!currentSelectedName) {
        return;
    }

    const shareLink = getCurrentShareLink();
    const textToShare = `[오늘의 식당: ${currentSelectedName}]\n\n친구들과 현재 후보 목록 보기 👇\n${shareLink}`;
    navigator.clipboard.writeText(textToShare).then(() => {
        alert("결과가 복사되었습니다!");
    });
}

function handleKakaoShare() {
    if (!currentSelectedName || !window.Kakao || !Kakao.Share) {
        return;
    }

    const imageUrl = "https://images.unsplash.com/photo-1544025162-d76694265947?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80";
    const shareLink = getCurrentShareLink();

    Kakao.Share.sendDefault({
        objectType: "feed",
        content: {
            title: `오늘의 식당 당첨: ${currentSelectedName} 🎉`,
            description: "친구들과 식당 후보 목록을 함께 확인해보세요.",
            imageUrl,
            link: {
                mobileWebUrl: shareLink,
                webUrl: shareLink
            }
        },
        buttons: [
            {
                title: "후보 목록 보기",
                link: {
                    mobileWebUrl: shareLink,
                    webUrl: shareLink
                }
            }
        ]
    });
}

function setupPolling() {
    if (!hasBackendConfig()) {
        return;
    }

    refreshTimer = setInterval(() => {
        if (!isSpinning) {
            loadRestaurants({ silent: true });
        }
    }, REFRESH_INTERVAL_MS);
}

async function initialize() {
    renderConfigState();
    await loadRestaurants();

    if (sharedResult) {
        showSharedView();
    } else {
        showRouletteView();
    }

    restaurantForm.addEventListener("submit", addRestaurant);
    refreshRestaurantsBtn.addEventListener("click", () => loadRestaurants());
    spinBtn.addEventListener("click", spin);
    copyBtn.addEventListener("click", handleCopyShare);
    kakaoBtn.addEventListener("click", handleKakaoShare);
    goHomeBtn.addEventListener("click", () => {
        location.href = myPageUrl;
    });

    setupPolling();
}

initialize();
