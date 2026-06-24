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
  const mobile = {
    active: false,
    joystickPointer: null,
    lookPointer: null,
    stickCenter: { x: 0, y: 0 },
    lastLook: { x: 0, y: 0 },
    moveRaf: null
  };

  function text(value, fallback) {
    const next = String(value || "").trim();
    return next || fallback || "";
  }

  function ensure() {
    if (document.getElementById("ax-gallery-ui")) return;
    installViewportRules();
    const style = document.createElement("style");
    style.textContent = `
      html, body {
        width: 100%;
        height: 100%;
        margin: 0;
        overflow: hidden;
        overscroll-behavior: none;
        touch-action: none;
      }
      #unity-container, #unity-canvas {
        width: 100vw !important;
        height: 100dvh !important;
        max-width: none !important;
        max-height: none !important;
      }
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
      .ax-mobile-controls {
        display: none;
      }
      .ax-joystick {
        position: absolute;
        left: 18px;
        bottom: 24px;
        width: 118px;
        height: 118px;
        border-radius: 999px;
        border: 1px solid rgba(255,255,255,0.25);
        background: rgba(18,20,22,0.34);
        pointer-events: auto;
        touch-action: none;
      }
      .ax-joystick-knob {
        position: absolute;
        left: 39px;
        top: 39px;
        width: 40px;
        height: 40px;
        border-radius: 999px;
        background: rgba(255,255,255,0.78);
        box-shadow: 0 4px 18px rgba(0,0,0,0.25);
      }
      .ax-look-pad {
        position: absolute;
        right: 0;
        top: 96px;
        bottom: 112px;
        width: 54vw;
        pointer-events: auto;
        touch-action: none;
      }
      .ax-floor-row {
        position: absolute;
        left: 150px;
        right: 14px;
        bottom: 26px;
        display: flex;
        gap: 7px;
        justify-content: flex-end;
        pointer-events: auto;
      }
      .ax-floor-row .ax-btn {
        min-width: 42px;
      }
      @media (max-width: 720px) {
        body.ax-mobile #unity-container {
          position: fixed !important;
          inset: 0 !important;
        }
        body.ax-mobile #unity-footer {
          display: none !important;
        }
        body.ax-mobile .ax-topbar {
          left: 10px;
          right: 10px;
          top: 10px;
        }
        body.ax-mobile .ax-button-row {
          position: fixed;
          left: 10px;
          right: 10px;
          bottom: 152px;
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 7px;
        }
        body.ax-mobile .ax-btn {
          min-height: 42px;
          padding: 8px 9px;
          border-radius: 8px;
          text-align: center;
          font-size: 14px;
        }
        .ax-topbar {
          align-items: stretch;
          flex-direction: column;
        }
        .ax-status {
          align-self: flex-start;
          max-width: calc(100vw - 20px);
          font-size: 12px;
        }
        body.ax-mobile .ax-side {
          left: 0;
          right: 0;
          bottom: 0;
          top: auto;
          width: auto;
          max-height: 58dvh;
          border-radius: 14px 14px 0 0;
          border-left: 0;
          border-right: 0;
          border-bottom: 0;
        }
        body.ax-mobile .ax-help {
          left: 0;
          right: 0;
          bottom: 0;
          width: auto;
          max-height: 52dvh;
          overflow: auto;
          border-radius: 14px 14px 0 0;
          border-left: 0;
          border-right: 0;
          border-bottom: 0;
        }
        body.ax-mobile .ax-mobile-controls {
          display: block;
        }
      }
      @media (orientation: landscape) and (max-height: 520px) {
        body.ax-mobile .ax-button-row {
          bottom: 12px;
          left: 150px;
          right: 10px;
        }
        body.ax-mobile .ax-side {
          max-height: 78dvh;
          width: min(420px, 46vw);
          left: auto;
          top: 10px;
          bottom: 10px;
          right: 10px;
          border-radius: 10px;
          border: 1px solid rgba(255,255,255,0.28);
        }
        .ax-floor-row {
          left: 150px;
          right: 10px;
          bottom: 62px;
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
          <button class="ax-btn" id="ax-open-list" type="button">목록</button>
          <button class="ax-btn" id="ax-open-map" type="button">지도</button>
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
        <p>PC: WASD 이동, Shift 달리기, 마우스 드래그로 시점 회전</p>
        <p>모바일: 왼쪽 원형 패드 이동, 오른쪽 화면 드래그로 시점 회전</p>
        <p>Tab 다음 작품 선택, Enter 선택 작품 앞으로 이동</p>
        <p>1/2/3 층 이동, M 미니맵, L 목록, I 작품 설명, F5 새로고침</p>
      </section>
      <div class="ax-mobile-controls" id="ax-mobile-controls">
        <div class="ax-look-pad" id="ax-look-pad" aria-label="시점 회전 영역"></div>
        <div class="ax-joystick" id="ax-joystick" aria-label="이동 조이스틱">
          <div class="ax-joystick-knob" id="ax-joystick-knob"></div>
        </div>
        <div class="ax-floor-row">
          <button class="ax-btn" data-floor="0" type="button">1F</button>
          <button class="ax-btn" data-floor="1" type="button">2F</button>
          <button class="ax-btn" data-floor="2" type="button">3F</button>
        </div>
      </div>
    `;
    document.body.appendChild(root);

    document.getElementById("ax-open-info").addEventListener("click", () => {
      setPanelVisible(true);
      sendHud("ShowArtworkInfoString", "");
    });
    document.getElementById("ax-open-list").addEventListener("click", () => {
      sendHud("ToggleArtworkListString", "");
    });
    document.getElementById("ax-open-map").addEventListener("click", () => {
      sendHud("ToggleMiniMapString", "");
    });
    document.getElementById("ax-close-info").addEventListener("click", () => setPanelVisible(false));
    document.getElementById("ax-toggle-help").addEventListener("click", () => {
      document.getElementById("ax-help").classList.toggle("open");
    });
    setupMobileControls();
    updateMobileMode();
    window.addEventListener("resize", updateMobileMode, { passive: true });
    window.addEventListener("orientationchange", updateMobileMode, { passive: true });
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

  function installViewportRules() {
    let viewport = document.querySelector("meta[name='viewport']");
    if (!viewport) {
      viewport = document.createElement("meta");
      viewport.setAttribute("name", "viewport");
      document.head.appendChild(viewport);
    }
    viewport.setAttribute(
      "content",
      "width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no"
    );
  }

  function isMobileViewport() {
    return window.matchMedia("(max-width: 760px)").matches ||
      window.matchMedia("(pointer: coarse)").matches ||
      navigator.maxTouchPoints > 0;
  }

  function updateMobileMode() {
    ensure();
    mobile.active = isMobileViewport();
    document.body.classList.toggle("ax-mobile", mobile.active);
    sendUnity("SetMobileTouchModeString", mobile.active ? "1" : "0");
    if (!mobile.active) sendUnity("SetMobileMoveInputString", "0,0");
  }

  function setupMobileControls() {
    const joystick = document.getElementById("ax-joystick");
    const knob = document.getElementById("ax-joystick-knob");
    const lookPad = document.getElementById("ax-look-pad");

    joystick.addEventListener("pointerdown", (event) => {
      if (!mobile.active) return;
      event.preventDefault();
      mobile.joystickPointer = event.pointerId;
      joystick.setPointerCapture(event.pointerId);
      const rect = joystick.getBoundingClientRect();
      mobile.stickCenter = {
        x: rect.left + rect.width * 0.5,
        y: rect.top + rect.height * 0.5
      };
      updateJoystick(event.clientX, event.clientY, knob);
    });
    joystick.addEventListener("pointermove", (event) => {
      if (event.pointerId !== mobile.joystickPointer) return;
      event.preventDefault();
      updateJoystick(event.clientX, event.clientY, knob);
    });
    ["pointerup", "pointercancel", "lostpointercapture"].forEach((name) => {
      joystick.addEventListener(name, () => resetJoystick(knob));
    });

    lookPad.addEventListener("pointerdown", (event) => {
      if (!mobile.active) return;
      event.preventDefault();
      mobile.lookPointer = event.pointerId;
      mobile.lastLook = { x: event.clientX, y: event.clientY };
      lookPad.setPointerCapture(event.pointerId);
    });
    lookPad.addEventListener("pointermove", (event) => {
      if (event.pointerId !== mobile.lookPointer) return;
      event.preventDefault();
      const dx = event.clientX - mobile.lastLook.x;
      const dy = event.clientY - mobile.lastLook.y;
      mobile.lastLook = { x: event.clientX, y: event.clientY };
      sendUnity("AddMobileLookDeltaString", `${dx.toFixed(3)},${dy.toFixed(3)}`);
    });
    ["pointerup", "pointercancel", "lostpointercapture"].forEach((name) => {
      lookPad.addEventListener(name, () => {
        mobile.lookPointer = null;
        sendUnity("StopMobileLookString", "");
      });
    });

    document.querySelectorAll("[data-floor]").forEach((button) => {
      button.addEventListener("click", () => {
        sendUnity("TeleportToFloorString", button.getAttribute("data-floor"));
      });
    });
  }

  function updateJoystick(clientX, clientY, knob) {
    const max = 44;
    const dx = clientX - mobile.stickCenter.x;
    const dy = clientY - mobile.stickCenter.y;
    const length = Math.min(max, Math.hypot(dx, dy));
    const angle = Math.atan2(dy, dx);
    const x = Math.cos(angle) * length;
    const y = Math.sin(angle) * length;
    knob.style.transform = `translate(${x}px, ${y}px)`;
    const moveX = x / max;
    const moveY = -y / max;
    sendUnity("SetMobileMoveInputString", `${moveX.toFixed(3)},${moveY.toFixed(3)}`);
  }

  function resetJoystick(knob) {
    mobile.joystickPointer = null;
    knob.style.transform = "translate(0, 0)";
    sendUnity("SetMobileMoveInputString", "0,0");
  }

  function sendUnity(method, value) {
    const instance = window.axUnityInstance || window.unityInstance || window.gameInstance;
    const receiver = window.AXGalleryUnityReceiver || "AX Gallery Player";
    if (!instance || typeof instance.SendMessage !== "function") return;
    try {
      instance.SendMessage(receiver, method, value);
    } catch (error) {
      console.warn("AXGallery SendMessage failed", method, error);
    }
  }

  function sendHud(method, value) {
    const instance = window.axUnityInstance || window.unityInstance || window.gameInstance;
    const receiver = window.AXGalleryHudReceiver || "HUD - Compact Visitor Controls";
    if (!instance || typeof instance.SendMessage !== "function") return;
    try {
      instance.SendMessage(receiver, method, value);
    } catch (error) {
      console.warn("AXGallery HUD SendMessage failed", method, error);
    }
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
    },
    syncMobileMode: updateMobileMode
  };

  document.addEventListener("DOMContentLoaded", () => {
    ensure();
    renderArtwork();
    renderRuntime();
  });
})();
