const profiles = {
  shoulder: {
    name: "어깨피자형",
    headline: "한 입마다 성격이 바뀌는 랜덤박스형 미식가",
    summary:
      "여럿이 먹어도 지루하지 않은 쪽이 맞습니다. 조각마다 분위기가 달라야 재미가 사는 타입이라 다양한 토핑이 한 판에 섞인 메뉴가 잘 맞습니다.",
    tags: ["다양성 과몰입", "파티 적합", "한 판에 여러 캐릭터"],
    toppings: ["🍍", "🍤", "🥓", "🌽", "🫒", "🍗", "🎃", "🧀"],
    orderText: "피자알볼로 어깨피자 / 도미노피자 베스트 콰트로 / 미스터피자 스페셜콰트로 추천",
    links: {
      official: "https://www.pizzaalvolo.co.kr/",
    },
    menus: [
      {
        brand: "피자알볼로",
        menu: "어깨피자",
        why: "여러 토핑이 한 판에서 계속 표정을 바꾸는 타입이라 조각마다 캐릭터가 다른 시그니처 메뉴가 잘 맞습니다.",
        link: "https://www.pizzaalvolo.co.kr/",
      },
      {
        brand: "도미노피자",
        menu: "베스트 콰트로",
        why: "한 판으로 다양한 맛을 고르는 재미를 살리기 좋습니다. 여럿이 먹을 때도 실패 확률이 낮습니다.",
        link: "https://web.dominos.co.kr/main",
      },
      {
        brand: "미스터피자",
        menu: "스페셜콰트로",
        why: "한 번에 네 가지 결을 맛보는 구성이라 산만할수록 더 즐거운 성향에 잘 맞습니다.",
        link: "https://www.mrpizza.co.kr/index.php",
      },
    ],
  },
  dream: {
    name: "꿈을피자형",
    headline: "달짠상큼 밸런스를 사랑하는 감성파",
    summary:
      "짭짤함만 밀어붙이는 것보다 달콤함과 상큼함이 한 번씩 치고 들어오는 조합이 잘 맞습니다. 고구마, 불고기, 과일 계열 토핑이 섞인 피자가 안정적으로 만족도를 줍니다.",
    tags: ["달짠 밸런스", "감성 토핑", "호불호 적음"],
    toppings: ["🍠", "🥩", "🍍", "🌿", "🧀", "🍒"],
    orderText: "피자알볼로 꿈을피자 / 피자헛 멜팅치즈 포테이토 / 파파존스 아이리쉬 포테이토 추천",
    links: {
      official: "https://www.pizzaalvolo.co.kr/",
    },
    menus: [
      {
        brand: "피자알볼로",
        menu: "꿈을피자",
        why: "달콤함과 상큼함이 교차하는 감성파 결과에 가장 직접적으로 맞는 대표 메뉴입니다.",
        link: "https://www.pizzaalvolo.co.kr/",
      },
      {
        brand: "피자헛",
        menu: "멜팅치즈 포테이토",
        why: "부드러운 감자와 치즈 쪽 만족감이 커서 과하게 세지 않은 달짠 밸런스를 원할 때 안정적입니다.",
        link: "https://www.pizzahut.co.kr/",
      },
      {
        brand: "파파존스",
        menu: "아이리쉬 포테이토",
        why: "포근하고 고소한 결이 강해서 극적인 자극보다 기분 좋은 위로를 찾는 쪽에 어울립니다.",
        link: "https://www.papajohns.co.kr/",
      },
    ],
  },
  fire: {
    name: "화르륵 핫피자형",
    headline: "텐션을 토핑으로 증폭시키는 직진형",
    summary:
      "순한 피자보다는 매콤하고 고기 존재감이 확실한 쪽이 맞습니다. 페퍼로니, 핫치킨, 할라피뇨, 치즈가 강하게 오는 메뉴가 만족도가 높습니다.",
    tags: ["매운맛 선호", "고기 집중", "야식 최적화"],
    toppings: ["🌶️", "🍗", "🥓", "🧀", "🔥", "🧅"],
    orderText: "피자알볼로 쉬림프n핫치킨피자 / 파파존스 스파이시 치킨 랜치 / 피자헛 LA BBQ불고기 추천",
    links: {
      official: "https://www.baemin.com/",
    },
    menus: [
      {
        brand: "피자알볼로",
        menu: "쉬림프n핫치킨피자",
        why: "새우와 핫치킨이 동시에 올라가는 강한 조합이라 직진형 결과에 가장 잘 맞습니다.",
        link: "https://www.pizzaalvolo.co.kr/",
      },
      {
        brand: "파파존스",
        menu: "스파이시 치킨 랜치",
        why: "매콤함과 랜치 풍미가 같이 와서 텐션 높은 날에 만족도가 좋습니다.",
        link: "https://www.papajohns.co.kr/",
      },
      {
        brand: "피자헛",
        menu: "LA BBQ불고기",
        why: "매운 쪽으로 완전히 치우치지 않으면서도 불향과 고기 존재감이 확실합니다.",
        link: "https://www.pizzahut.co.kr/",
      },
    ],
  },
  cheese: {
    name: "치즈멜트 클래식형",
    headline: "안정감과 위로를 최우선으로 두는 클래식파",
    summary:
      "모험보다 만족도가 중요합니다. 치즈 풍미와 부드러운 도우, 검증된 고기 토핑이 중심인 클래식 콤비네이션이 가장 잘 맞습니다.",
    tags: ["안정 추구", "클래식 취향", "혼밥 적합"],
    toppings: ["🧀", "🍄", "🥓", "🧅", "🍅"],
    orderText: "도미노피자 포테이토 / 파파존스 수퍼 파파스 / 피자헛 수퍼슈프림 추천",
    links: {
      official: "https://www.yogiyo.co.kr/",
    },
    menus: [
      {
        brand: "도미노피자",
        menu: "포테이토",
        why: "가장 무난하고 고소하게 만족시키는 축이라 실속형 클래식 취향과 잘 맞습니다.",
        link: "https://web.dominos.co.kr/main",
      },
      {
        brand: "파파존스",
        menu: "수퍼 파파스",
        why: "고기와 채소, 치즈가 정석적으로 균형을 이루는 대표 메뉴라 검증된 맛을 원할 때 강합니다.",
        link: "https://www.papajohns.co.kr/",
      },
      {
        brand: "피자헛",
        menu: "수퍼슈프림",
        why: "클래식 콤비네이션 계열의 안정감이 좋아 모험보다 확실한 만족을 원하는 쪽에 맞습니다.",
        link: "https://www.pizzahut.co.kr/",
      },
    ],
  },
  green: {
    name: "프레시 가든형",
    headline: "무겁기보다 상큼하게 끝나는 한 입을 찾는 타입",
    summary:
      "느끼함을 길게 끌고 가기보다 채소, 허브, 산뜻한 토핑이 살아 있어야 만족합니다. 루꼴라, 올리브, 버섯, 토마토가 들어간 피자가 잘 맞습니다.",
    tags: ["산뜻함 선호", "허브 취향", "가벼운 만족감"],
    toppings: ["🍅", "🫒", "🍄", "🌿", "🧀"],
    orderText: "피자알볼로 나폴리맛피자 / 파파존스 가든 스페셜 / 피자헛 갈릭버터쉬림프 추천",
    links: {
      official: "https://www.coupangeats.com/",
    },
    menus: [
      {
        brand: "피자알볼로",
        menu: "나폴리맛피자",
        why: "허브 느낌과 산뜻한 마무리가 살아 있는 최근 메뉴라 가벼운 취향 결과와 잘 맞습니다.",
        link: "https://www.pizzaalvolo.co.kr/",
      },
      {
        brand: "파파존스",
        menu: "가든 스페셜",
        why: "채소 쪽 존재감이 또렷해서 무겁지 않게 먹고 싶은 쪽에 어울립니다.",
        link: "https://www.papajohns.co.kr/",
      },
      {
        brand: "피자헛",
        menu: "갈릭버터쉬림프",
        why: "해산물과 버터 풍미가 있으면서도 지나치게 무겁지 않아 산뜻한 쪽 결과에 무난합니다.",
        link: "https://www.pizzahut.co.kr/",
      },
    ],
  },
};

const scoreTable = {
  energy: {
    calm: { cheese: 2, dream: 1, green: 1 },
    spark: { dream: 2, shoulder: 1, green: 1 },
    wild: { fire: 3, shoulder: 2 },
  },
  flavor: {
    savory: { cheese: 2, fire: 2 },
    balanced: { shoulder: 1, green: 1, dream: 2 },
    sweet: { dream: 3, shoulder: 1 },
  },
  adventure: {
    safe: { cheese: 2, dream: 1 },
    medium: { dream: 1, green: 2, shoulder: 1 },
    max: { shoulder: 3, fire: 1 },
  },
  social: {
    solo: { cheese: 2, fire: 1 },
    duo: { dream: 2, green: 1 },
    party: { shoulder: 3, fire: 1 },
  },
  texture: {
    soft: { cheese: 2, dream: 1 },
    crisp: { green: 2, fire: 1, shoulder: 1 },
    loaded: { shoulder: 2, fire: 2, dream: 1 },
  },
  finish: {
    comfort: { cheese: 2, dream: 1 },
    spicy: { fire: 3, shoulder: 1 },
    fresh: { green: 3, dream: 1 },
  },
};

const form = document.getElementById("quizForm");
const pizzaSurface = document.getElementById("pizzaSurface");
const burstLayer = document.getElementById("burstLayer");
const resultCopy = document.getElementById("resultCopy");
const recommendTags = document.getElementById("recommendTags");
const brandMenuList = document.getElementById("brandMenuList");
const handoffText = document.getElementById("handoffText");
const resultCard = document.getElementById("resultCard");
const replayEffects = document.getElementById("replayEffects");
const surpriseMe = document.getElementById("surpriseMe");
const copyOrder = document.getElementById("copyOrder");
const officialLink = document.getElementById("openOfficial");
const deliveryButtons = [...document.querySelectorAll(".delivery-button")];

let currentProfileKey = null;

function collectAnswers() {
  const formData = new FormData(form);
  return Object.fromEntries(formData.entries());
}

function pickProfile(answers) {
  const scores = {
    shoulder: 0,
    dream: 0,
    fire: 0,
    cheese: 0,
    green: 0,
  };

  Object.entries(answers).forEach(([question, value]) => {
    const entry = scoreTable[question]?.[value];
    if (!entry) {
      return;
    }

    Object.entries(entry).forEach(([profileKey, points]) => {
      scores[profileKey] += points;
    });
  });

  return Object.entries(scores).sort((left, right) => right[1] - left[1])[0][0];
}

function renderProfile(profileKey) {
  const profile = profiles[profileKey];
  currentProfileKey = profileKey;

  resultCopy.innerHTML = `
    <p class="result-title">${profile.name}</p>
    <p class="result-body"><strong>${profile.headline}</strong><br>${profile.summary}</p>
  `;

  recommendTags.innerHTML = "";
  profile.tags.forEach((tag) => {
    const pill = document.createElement("span");
    pill.textContent = tag;
    recommendTags.appendChild(pill);
  });

  renderBrandMenus(profile.menus);
  handoffText.value = profile.orderText;
  officialLink.href = profile.links.official;
  fireToppingShow(profile.toppings);

  if (window.matchMedia("(max-width: 980px)").matches) {
    resultCard.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function renderBrandMenus(menus) {
  brandMenuList.innerHTML = "";

  menus.forEach((item) => {
    const card = document.createElement("article");
    card.className = "brand-menu-card";
    card.innerHTML = `
      <div class="brand-menu-top">
        <span class="brand-name">${item.brand}</span>
        <a class="menu-link" href="${item.link}" target="_blank" rel="noreferrer">주문 페이지</a>
      </div>
      <p class="menu-name">${item.menu}</p>
      <p class="menu-why">${item.why}</p>
    `;
    brandMenuList.appendChild(card);
  });
}

function fireToppingShow(toppings) {
  pizzaSurface.querySelectorAll(".topping").forEach((node) => node.remove());
  burstLayer.replaceChildren();

  const positions = [
    { x: 25, y: 28 }, { x: 48, y: 22 }, { x: 69, y: 28 }, { x: 33, y: 48 },
    { x: 54, y: 44 }, { x: 71, y: 49 }, { x: 42, y: 68 }, { x: 61, y: 66 },
  ];

  toppings.forEach((item, index) => {
    const target = positions[index % positions.length];
    const toppingNode = document.createElement("div");
    toppingNode.className = "topping";
    toppingNode.textContent = item;
    toppingNode.style.left = `${target.x}%`;
    toppingNode.style.top = `${target.y}%`;
    toppingNode.style.animationDelay = `${index * 90}ms`;
    toppingNode.style.setProperty("--start-x", `${(index % 2 === 0 ? -140 : 140) + (index * 9)}px`);
    toppingNode.style.setProperty("--start-y", `${-180 + index * 22}px`);
    pizzaSurface.appendChild(toppingNode);

    const burstDelay = 180 + index * 90;
    window.setTimeout(() => createBurst(target.x, target.y), burstDelay);
  });
}

function createBurst(x, y) {
  const colors = ["#d9472f", "#ffd972", "#2f6b3e", "#ff8d4f", "#fff7eb"];

  for (let index = 0; index < 10; index += 1) {
    const confetti = document.createElement("span");
    const angle = `${index * 36}deg`;
    const distance = 18 + Math.random() * 52;
    const radians = (index * 36 * Math.PI) / 180;
    confetti.className = "burst";
    confetti.style.left = `${x}%`;
    confetti.style.top = `${y}%`;
    confetti.style.background = colors[index % colors.length];
    confetti.style.animationDelay = `${index * 18}ms`;
    confetti.style.setProperty("--angle", angle);
    confetti.style.setProperty("--travel-x", `${Math.cos(radians) * distance}px`);
    confetti.style.setProperty("--travel-y", `${Math.sin(radians) * distance}px`);
    burstLayer.appendChild(confetti);

    window.setTimeout(() => confetti.remove(), 900);
  }
}

function randomizeForm() {
  form.querySelectorAll("fieldset").forEach((fieldset) => {
    const options = [...fieldset.querySelectorAll("input[type='radio']")];
    const picked = options[Math.floor(Math.random() * options.length)];
    picked.checked = true;
  });
}

async function copyHandoffText(options = {}) {
  const { silent = false } = options;

  try {
    await navigator.clipboard.writeText(handoffText.value);
    if (!silent) {
      showToast("주문 문구를 복사했습니다.");
    }
  } catch {
    handoffText.select();
    document.execCommand("copy");
    if (!silent) {
      showToast("주문 문구를 복사했습니다.");
    }
  }
}

function showToast(message) {
  document.querySelectorAll(".toast").forEach((toast) => toast.remove());
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  document.body.appendChild(toast);
  window.setTimeout(() => toast.remove(), 1800);
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const answers = collectAnswers();
  const profileKey = pickProfile(answers);
  renderProfile(profileKey);
});

surpriseMe.addEventListener("click", () => {
  randomizeForm();
  const answers = collectAnswers();
  renderProfile(pickProfile(answers));
});

replayEffects.addEventListener("click", () => {
  if (!currentProfileKey) {
    showToast("먼저 피자를 한 번 뽑아주세요.");
    return;
  }

  fireToppingShow(profiles[currentProfileKey].toppings);
});

copyOrder.addEventListener("click", copyHandoffText);

deliveryButtons.forEach((button) => {
  button.addEventListener("click", () => {
    if (!currentProfileKey) {
      return;
    }

    copyHandoffText({ silent: true });
    showToast("주문 문구를 복사하고 배달 페이지를 엽니다.");
  });
});
