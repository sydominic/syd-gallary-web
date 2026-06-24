(function () {
  const state = {
    artwork: {
      title: "작품을 선택하세요",
      author: "",
      year: "",
      description: "Tab으로 작품을 선택하거나 작품 목록에서 이동하면 설명이 여기에 표시됩니다.",
      location: "",
      status: ""
    },
    runtime: {
      mode: "Online Supabase",
      loaded: 0,
      slots: 33,
      failed: 0
    }
  };

  function text(value, fallback) {
    const next = String(value || "").trim();
    return next || fallback || "";
  }

  function ensure() {
    if (document.getElementById("ax-gallery-ui")) return;
    const style = document.createElement("style");
    style.textContent = `
      #ax-gallery-ui {
        position: fixed;
        inset: 0;
        z-index: 20;
        pointer-events: none;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        color: #f7f2e8;
      }
      #ax-gallery-ui button, #ax-gallery-ui a {
        pointer-events: auto;
        font: inherit;
      }
      .ax-topbar {
        position: absolute;
        left: 14px;
        right: 14px;
        top: 12px;
        display: flex;
        gap: 8px;
        align-items: center;
        justify-content: space-between;
      }
      .ax-button-row {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }
      .ax-btn {
        min-height: 34px;
        padding: 7px 11px;
        border: 1px solid rgba(255,255,255,0.34);
        border-radius: 7px;
        color: #fff;
        background: rgba(18, 20, 22, 0.58);
        text-decoration: none;
        cursor: pointer;
        backdrop-filter: blur(5px);
      }
      .ax-btn:hover {
        background: rgba(42, 45, 49, 0.76);
      }
      .ax-status {
        padding: 7px 10px;
        border: 1px solid rgba(255,255,255,0.22);
        border-radius: 7px;
        background: rgba(18,20,22,0.50);
        font-size: 13px;
        backdrop-filter: blur(5px);
      }
      .ax-side {
        position: absolute;
        top: 58px;
        right: 14px;
        width: min(390px, calc(100vw - 28px));
        max-height: calc(100vh - 88px);
        display: none;
        grid-template-rows: auto 1fr;
        overflow: hidden;
        border: 1px solid rgba(255,255,255,0.28);
        border-radius: 9px;
        background: rgba(18,20,22,0.88);
        box-shadow: 0 18px 45px rgba(0,0,0,0.34);
        pointer-events: auto;
        backdrop-filter: blur(8px);
      }
      .ax-side.open {
        display: grid;
      }
      .ax-side-head {
        display: flex;
        gap: 10px;
        align-items: start;
        justify-content: space-between;
        padding: 15px 16px 11px;
        border-bottom: 1px solid rgba(255,255,255,0.16);
      }
      .ax-side-title {
        margin: 0;
        font-size: 20px;
        line-height: 1.25;
      }
      .ax-close {
        min-width: 34px;
        min-height: 30px;
        border: 1px solid rgba(255,255,255,0.25);
        border-radius: 6px;
        color: #fff;
        background: rgba(255,255,255,0.08);
        cursor: pointer;
      }
      .ax-side-body {
        overflow: auto;
        padding: 14px 16px 18px;
      }
      .ax-meta {
        display: grid;
        gap: 5px;
        margin-bottom: 13px;
        color: #d6d1c5;
        font-size: 14px;
      }
      .ax-desc {
        white-space: pre-wrap;
        overflow-wrap: anywhere;
        line-height: 1.62;
        color: #fff8eb;
        font-size: 15px;
      }
      .ax-help {
        position: absolute;
        left: 14px;
        bottom: 14px;
        width: min(430px, calc(100vw - 28px));
        display: none;
        padding: 13px 15px;
        border: 1px solid rgba(255,255,255,0.24);
        border-radius: 9px;
        background: rgba(18,20,22,0.82);
        pointer-events: auto;
        backdrop-filter: blur(8px);
      }
      .ax-help.open {
        display: block;
      }
      .ax-help h2 {
        margin: 0 0 8px;
        font-size: 17px;
      }
      .ax-help p {
        margin: 5px 0;
        color: #eee6d6;
        font-size: 14px;
      }
      @media (max-width: 720px) {
        .ax-topbar {
          align-items: stretch;
          flex-direction: column;
        }
        .ax-status {
          align-self: flex-start;
        }
        .ax-side {
          top: 112px;
          left: 10px;
          right: 10px;
          width: auto;
          max-height: calc(100vh - 128px);
        }
      }
    `;
    document.head.appendChild(style);

    const root = document.createElement("div");
    root.id = "ax-gallery-ui";
    root.innerHTML = `
      <div class="ax-topbar">
        <div class="ax-button-row">
          <button class="ax-btn" id="ax-open-info" type="button">작품 설명</button>
          <button class="ax-btn" id="ax-toggle-help" type="button">조작법</button>
          <a class="ax-btn" href="admin.html" target="_blank" rel="noreferrer">관리자</a>
        </div>
        <div class="ax-status" id="ax-runtime">온라인 전시 준비 중</div>
      </div>
      <aside class="ax-side" id="ax-side">
        <div class="ax-side-head">
          <h1 class="ax-side-title" id="ax-title">작품을 선택하세요</h1>
          <button class="ax-close" id="ax-close-info" type="button">닫기</button>
        </div>
        <div class="ax-side-body">
          <div class="ax-meta">
            <div id="ax-author"></div>
            <div id="ax-location"></div>
            <div id="ax-status-line"></div>
          </div>
          <div class="ax-desc" id="ax-desc"></div>
        </div>
      </aside>
      <section class="ax-help" id="ax-help">
        <h2>조작법</h2>
        <p>WASD 이동, Shift 달리기, 마우스 클릭 후 시점 회전</p>
        <p>Tab 다음 작품 선택, Enter 선택 작품 앞으로 이동</p>
        <p>1/2/3 층 이동, M 미니맵, L 목록, I 작품 설명, F5 새로고침</p>
      </section>
    `;
    document.body.appendChild(root);

    document.getElementById("ax-open-info").addEventListener("click", () => setPanelVisible(true));
    document.getElementById("ax-close-info").addEventListener("click", () => setPanelVisible(false));
    document.getElementById("ax-toggle-help").addEventListener("click", () => {
      document.getElementById("ax-help").classList.toggle("open");
    });
  }

  function renderArtwork() {
    ensure();
    document.getElementById("ax-title").textContent = text(state.artwork.title, "작품을 선택하세요");
    const author = text(state.artwork.author, "작가 미입력");
    const year = text(state.artwork.year, "");
    document.getElementById("ax-author").textContent = year ? `${author} / ${year}` : author;
    document.getElementById("ax-location").textContent = text(state.artwork.location, "");
    document.getElementById("ax-status-line").textContent = text(state.artwork.status, "");
    document.getElementById("ax-desc").textContent = text(
      state.artwork.description,
      "등록된 작품 설명이 없습니다."
    );
  }

  function renderRuntime() {
    ensure();
    document.getElementById("ax-runtime").textContent =
      `${text(state.runtime.mode, "온라인")} · 전시 ${state.runtime.loaded}/${state.runtime.slots} · 실패 ${state.runtime.failed}`;
  }

  function setPanelVisible(visible) {
    ensure();
    document.getElementById("ax-side").classList.toggle("open", !!visible);
  }

  window.AXGalleryUI = {
    setArtwork(next) {
      state.artwork = Object.assign({}, state.artwork, next || {});
      renderArtwork();
    },
    setPanelVisible,
    setRuntimeStatus(next) {
      state.runtime = Object.assign({}, state.runtime, next || {});
      renderRuntime();
    }
  };

  document.addEventListener("DOMContentLoaded", () => {
    ensure();
    renderArtwork();
    renderRuntime();
  });
})();
