// ===== DOM =====
var articleList = document.getElementById("article-list");
var articleDetail = document.getElementById("article-detail");
var backBtn = document.getElementById("back-btn");
var navLinks = document.querySelectorAll(".nav-link");
var progressBar = document.getElementById("progress-bar");
var themeToggle = document.getElementById("theme-toggle");
var tagFilter = document.getElementById("tag-filter");
var articleCount = document.getElementById("article-count");

// ===== Theme =====
function initTheme() {
  themeToggle.addEventListener("click", function () {
    var current = document.documentElement.dataset.theme;
    var next = current === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    localStorage.setItem("theme", next);
  });
}

// ===== Utilities =====
function getTextLength(html) {
  var div = document.createElement("div");
  div.innerHTML = html;
  return (div.textContent || "").length;
}

function readingTime(html) {
  var chars = getTextLength(html);
  return Math.max(1, Math.ceil(chars / 400));
}

function fallbackCover(index) {
  var covers = [
    "img/gongga-golden.jpg",
    "img/tortie-cat.jpg",
    "img/qingyin-stream.jpg",
    "img/west-mountains.jpg"
  ];
  return covers[index % covers.length];
}

// ===== View transition =====
function showView(name) {
  var views = document.querySelectorAll(".view");
  for (var i = 0; i < views.length; i++) { views[i].classList.remove("active"); }
  document.getElementById("view-" + name).classList.add("active");
  window.scrollTo(0, 0);

  for (var j = 0; j < navLinks.length; j++) {
    navLinks[j].classList.remove("active");
    if (navLinks[j].dataset.view === name) navLinks[j].classList.add("active");
  }

  // Reading progress bar: show only on article view
  progressBar.style.display = name === "article" ? "block" : "none";
  if (name !== "article") {
    progressBar.style.width = "0%";
    window.removeEventListener("scroll", updateProgress);
  }
}

// ===== Reading progress =====
function updateProgress() {
  var scrollTop = window.scrollY;
  var docHeight = document.documentElement.scrollHeight - window.innerHeight;
  if (docHeight <= 0) return;
  progressBar.style.width = Math.min(100, (scrollTop / docHeight) * 100) + "%";
}

var progressTicking = false;
function onScroll() {
  if (!progressTicking) {
    requestAnimationFrame(function () {
      updateProgress();
      progressTicking = false;
    });
    progressTicking = true;
  }
}

// ===== Tag filter =====
var activeTag = null;

function renderTagFilter() {
  var tags = {};
  for (var i = 0; i < ARTICLES.length; i++) {
    var t = ARTICLES[i].tags;
    if (t) { for (var j = 0; j < t.length; j++) { tags[t[j]] = true; } }
  }
  var unique = Object.keys(tags);
  if (unique.length === 0) { tagFilter.style.display = "none"; return; }
  tagFilter.style.display = "flex";

  var html = '<button class="tag-pill active" data-tag="">全部</button>';
  for (var k = 0; k < unique.length; k++) {
    html += '<button class="tag-pill" data-tag="' + unique[k] + '">' + unique[k] + '</button>';
  }
  tagFilter.innerHTML = html;

  var pills = tagFilter.querySelectorAll(".tag-pill");
  for (var p = 0; p < pills.length; p++) {
    pills[p].addEventListener("click", function () {
      activeTag = this.dataset.tag || null;
      var all = tagFilter.querySelectorAll(".tag-pill");
      for (var q = 0; q < all.length; q++) { all[q].classList.remove("active"); }
      this.classList.add("active");
      filterCards();
    });
  }
}

function filterCards() {
  var cards = articleList.querySelectorAll(".article-card");
  var visible = 0;
  for (var i = 0; i < cards.length; i++) {
    var card = cards[i];
    if (!activeTag) {
      card.style.display = "";
      visible++;
      continue;
    }
    var cardTags = JSON.parse(card.dataset.tags || "[]");
    var shouldShow = cardTags.indexOf(activeTag) >= 0;
    card.style.display = shouldShow ? "" : "none";
    if (shouldShow) visible++;
  }
  if (articleCount) articleCount.textContent = visible + " 篇";
}

// ===== Article list =====
function renderArticleList() {
  if (ARTICLES.length === 0) {
    articleList.innerHTML = '<div class="empty-hint">还没有文章。</div>';
    if (articleCount) articleCount.textContent = "0 篇";
    return;
  }

  // Sort by date descending
  var sorted = ARTICLES.slice().sort(function (a, b) {
    return a.date < b.date ? 1 : -1;
  });

  var html = "";
  for (var i = 0; i < sorted.length; i++) {
    var a = sorted[i];
    var cover = a.cover || fallbackCover(i);
    var coverHtml = '<div class="card-cover"><img src="' + cover + '" alt="" loading="lazy"></div>';
    var tagsHtml = a.tags
      ? '<div class="card-tags">' + a.tags.map(function (t) { return '<span class="card-tag">' + t + '</span>'; }).join("") + '</div>'
      : "";
    var time = readingTime(a.content);
    var tagsData = a.tags ? JSON.stringify(a.tags) : "[]";

    html +=
      '<div class="article-card' + (i === 0 ? ' featured' : '') + '" data-id="' + a.id + '" data-tags=\'' + tagsData + '\' style="--card-index:' + i + '">' +
        coverHtml +
        '<div class="card-body">' +
          '<div class="card-date">' + a.date + ' · ' + time + ' min read</div>' +
          '<div class="card-title">' + a.title + '</div>' +
          '<div class="card-excerpt">' + a.excerpt + '</div>' +
          tagsHtml +
        '</div>' +
      '</div>';
  }
  articleList.innerHTML = html;
  if (articleCount) articleCount.textContent = sorted.length + " 篇";

  var cards = articleList.querySelectorAll(".article-card");
  for (var j = 0; j < cards.length; j++) {
    cards[j].addEventListener("click", function () {
      window.location.hash = "article/" + this.dataset.id;
    });
  }
}

// ===== Article detail =====
var currentArticleId = null;

function showArticle(id) {
  if (currentArticleId === id) return;
  var article = ARTICLES.find(function (a) { return a.id === id; });
  if (!article) { showView("home"); return; }

  currentArticleId = id;
  showView("article");
  window.addEventListener("scroll", onScroll, { passive: true });
  updateProgress();

  var time = readingTime(article.content);

  setTimeout(function () {
    var coverHtml = article.cover
      ? '<div class="article-cover"><img src="' + article.cover + '" alt="' + article.title + '" loading="lazy" decoding="async"></div>'
      : "";
    var tagsHtml = article.tags
      ? '<div class="article-tags">' + article.tags.map(function (t) { return '<span class="article-tag">' + t + '</span>'; }).join("") + '</div>'
      : "";

    // Inject lazy loading into content images
    var content = article.content.replace(/<img /g, '<img loading="lazy" decoding="async" ');

    articleDetail.innerHTML =
      coverHtml +
      '<div class="article-header">' +
        '<div class="article-meta"><span>' + article.date + '</span><span class="dot"></span><span>' + time + ' min read</span></div>' +
        '<h1 class="article-title">' + article.title + '</h1>' +
        tagsHtml +
      '</div>' +
      '<div class="article-body">' + content + '</div>';
  }, 50);
}

// ===== Lightbox (delegated) =====
var lightboxReady = false;
function initLightbox() {
  if (lightboxReady) return;
  var lb = document.createElement("div");
  lb.id = "lightbox";
  lb.className = "lightbox";
  lb.innerHTML = '<button class="lightbox-close" type="button" aria-label="关闭图片预览">&times;</button><img src="" alt="">';
  document.body.appendChild(lb);
  function closeLightbox() {
    lb.classList.remove("active");
    document.body.classList.remove("lightbox-open");
  }
  lb.addEventListener("click", closeLightbox);
  lb.querySelector(".lightbox-close").addEventListener("click", closeLightbox);
  lb.querySelector("img").addEventListener("click", function (e) { e.stopPropagation(); });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeLightbox();
  });

  articleDetail.addEventListener("click", function (e) {
    var img = e.target.closest("img");
    if (!img) return;
    if (!img.closest(".article-body") && !img.closest(".article-cover")) return;
    lb.querySelector("img").src = img.src;
    lb.querySelector("img").alt = img.alt || "";
    lb.classList.add("active");
    document.body.classList.add("lightbox-open");
  });

  articleDetail.addEventListener("error", function (e) {
    if (e.target.tagName !== "IMG") return;
    e.target.style.display = "none";
    var caption = e.target.parentElement && e.target.parentElement.nextElementSibling;
    if (caption && caption.classList.contains("figure-caption")) {
      caption.style.display = "none";
    }
  }, true);

  lightboxReady = true;
}

// ===== Navigation =====
for (var n = 0; n < navLinks.length; n++) {
  navLinks[n].addEventListener("click", function (e) {
    e.preventDefault();
    window.location.hash = this.dataset.view === "home" ? "" : this.dataset.view;
  });
}

backBtn.addEventListener("click", function () {
  window.location.hash = "";
});

// ===== Router =====
function handleRoute() {
  var hash = window.location.hash.slice(1);
  if (hash.indexOf("article/") === 0) {
    showArticle(hash.split("/")[1]);
    initLightbox();
  } else if (hash === "about") {
    showView("about");
    currentArticleId = null;
  } else {
    showView("home");
    currentArticleId = null;
  }
}

window.addEventListener("hashchange", handleRoute);

// ===== Init =====
initTheme();
renderTagFilter();
renderArticleList();
if (window.location.hash) {
  handleRoute();
}
