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
    menuOpen: false,
    landscapeMode: false,
    pwaHintDismissed: false,
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
    try {
      mobile.pwaHintDismissed = localStorage.getItem("axGalleryPwaHintDismissed") === "1";
    } catch (error) {
      mobile.pwaHintDismissed = false;
    }
    installViewportRules();
    const style = document.createElement("style");
    style.textContent = `
      :root {
        --ax-bg: rgba(22, 21, 18, 0.92);
        --ax-bg-strong: rgba(17, 16, 14, 0.96);
        --ax-label: rgba(247, 241, 224, 0.94);
        --ax-label-dark: #171511;
        --ax-border: rgba(214, 180, 104, 0.34);
        --ax-border-strong: rgba(214, 180, 104, 0.64);
        --ax-text: #fff8e8;
        --ax-muted: #d8ccb5;
        --ax-primary: rgba(55, 89, 112, 0.92);
        --ax-danger: rgba(90, 52, 43, 0.9);
        --ax-gold: #d6b468;
        --ax-radius: 12px;
        --ax-sheet-radius: 18px;
        --ax-touch: 48px;
      }
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
        color: var(--ax-text);
      }
      #ax-gallery-ui button, #ax-gallery-ui a {
        pointer-events: auto;
        font: inherit;
      }
      .ax-mobile-backdrop {
        display: none;
      }
      .ax-pwa-tip {
        position: absolute;
        left: 14px;
        right: 14px;
        bottom: 88px;
        max-width: 520px;
        padding: 14px 16px;
        border: 1px solid var(--ax-border-strong);
        border-radius: var(--ax-radius);
        background: rgba(17, 16, 14, 0.94);
        color: var(--ax-text);
        pointer-events: auto;
        box-shadow: 0 14px 34px rgba(0,0,0,0.34);
        backdrop-filter: blur(8px);
        display: none;
      }
      .ax-pwa-tip.open {
        display: block;
      }
      .ax-pwa-tip strong {
        display: block;
        margin-bottom: 6px;
        font-size: 15px;
      }
      .ax-pwa-tip p {
        margin: 0 0 10px;
        color: var(--ax-muted);
        font-size: 13px;
        line-height: 1.45;
      }
      .ax-pwa-tip-actions {
        display: flex;
        gap: 8px;
        justify-content: flex-end;
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
      .ax-sheet-head {
        display: none;
      }
      .ax-sheet-title {
        margin: 0;
        font-size: 17px;
        font-weight: 700;
        letter-spacing: 0.02em;
      }
      .ax-btn {
        min-height: 34px;
        padding: 7px 11px;
        border: 1px solid var(--ax-border-strong);
        border-radius: 7px;
        color: var(--ax-text);
        background: linear-gradient(180deg, rgba(38, 35, 29, 0.88), rgba(18, 17, 15, 0.84));
        text-decoration: none;
        cursor: pointer;
        backdrop-filter: blur(5px);
        box-shadow: inset 0 1px 0 rgba(255,255,255,0.12), 0 6px 18px rgba(0,0,0,0.18);
      }
      .ax-btn.primary {
        background: linear-gradient(180deg, rgba(69, 105, 130, 0.96), var(--ax-primary));
        border-color: rgba(255,255,255,0.48);
      }
      .ax-btn.danger {
        background: linear-gradient(180deg, rgba(112, 67, 55, 0.96), var(--ax-danger));
      }
      .ax-btn:hover {
        background: linear-gradient(180deg, rgba(58, 54, 45, 0.96), rgba(29, 27, 23, 0.92));
      }
      .ax-status {
        padding: 7px 10px;
        border: 1px solid var(--ax-border);
        border-radius: 7px;
        background: rgba(18,20,22,0.50);
        font-size: 13px;
        backdrop-filter: blur(5px);
      }
      .ax-art-label {
        position: relative;
      }
      .ax-art-label::before {
        content: attr(data-label);
        display: block;
        margin-bottom: 3px;
        color: var(--ax-gold);
        font-size: 10px;
        font-weight: 750;
        letter-spacing: 0.08em;
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
        border: 1px solid var(--ax-border);
        border-radius: 9px;
        background: var(--ax-bg);
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
        border-bottom: 1px solid var(--ax-border);
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
        color: var(--ax-text);
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
        color: var(--ax-muted);
        font-size: 14px;
      }
      .ax-desc {
        white-space: pre-wrap;
        overflow-wrap: anywhere;
        line-height: 1.62;
        color: var(--ax-text);
        font-size: 15px;
      }
      .ax-help {
        position: absolute;
        left: 14px;
        bottom: 14px;
        width: min(430px, calc(100vw - 28px));
        display: none;
        padding: 13px 15px;
        border: 1px solid var(--ax-border);
        border-radius: 9px;
        background: var(--ax-bg);
        pointer-events: auto;
        backdrop-filter: blur(8px);
      }
      .ax-help-head {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        align-items: center;
        margin-bottom: 8px;
      }
      .ax-help.open {
        display: block;
      }
      .ax-help h2 {
        margin: 0;
        font-size: 17px;
      }
      .ax-help p {
        margin: 5px 0;
        color: var(--ax-muted);
        font-size: 14px;
      }
      .ax-mobile-controls {
        display: none;
      }
      .ax-mobile-menu-toggle,
      .ax-mobile-fullscreen {
        display: none;
      }
      .ax-joystick {
        position: absolute;
        left: 18px;
        bottom: 24px;
        width: 118px;
        height: 118px;
        border-radius: 999px;
        border: 2px solid rgba(214, 180, 104, 0.44);
        background:
          radial-gradient(circle at center, rgba(214,180,104,0.12) 0 28%, transparent 29%),
          conic-gradient(from 45deg, rgba(214,180,104,0.18), rgba(255,255,255,0.06), rgba(214,180,104,0.18), rgba(255,255,255,0.06), rgba(214,180,104,0.18)),
          rgba(17,16,14,0.38);
        pointer-events: auto;
        touch-action: none;
        box-shadow: inset 0 0 0 1px rgba(255,255,255,0.08), 0 10px 24px rgba(0,0,0,0.28);
      }
      .ax-joystick-knob {
        position: absolute;
        left: 39px;
        top: 39px;
        width: 40px;
        height: 40px;
        border-radius: 999px;
        border: 1px solid rgba(23,21,17,0.46);
        background: var(--ax-label);
        box-shadow: 0 4px 18px rgba(0,0,0,0.25);
      }
      .ax-look-pad {
        position: absolute;
        right: 0;
        top: 76px;
        bottom: 112px;
        width: 46vw;
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
      .ax-floor-row .ax-btn {
        border-color: rgba(214,180,104,0.62);
      }
      body.ax-mobile {
        position: fixed;
        inset: 0;
        width: 100%;
        height: 100dvh;
        background: #000;
      }
      body.ax-mobile #unity-container {
        position: fixed !important;
        inset: 0 !important;
      }
      body.ax-mobile #unity-footer {
        display: none !important;
      }
      body.ax-mobile .ax-mobile-controls {
        display: block;
      }
      body.ax-mobile .ax-button-row {
        position: fixed;
        left: 0;
        right: 0;
        bottom: 0;
        width: auto;
        max-height: min(68dvh, 420px);
        overflow: auto;
        padding: 14px 16px calc(16px + env(safe-area-inset-bottom));
        border: 1px solid var(--ax-border);
        border-bottom: 0;
        border-radius: var(--ax-sheet-radius) var(--ax-sheet-radius) 0 0;
        background:
          linear-gradient(180deg, rgba(42, 38, 30, 0.98), var(--ax-bg-strong)),
          var(--ax-bg-strong);
        display: grid;
        grid-template-columns: 1fr;
        gap: 10px;
        opacity: 1;
        transform: translateY(110%);
        pointer-events: none;
        transition: opacity 0.16s ease, transform 0.16s ease;
        backdrop-filter: blur(8px);
        box-shadow: 0 18px 45px rgba(0,0,0,0.45);
        z-index: 8;
      }
      body.ax-mobile.ax-menu-open .ax-button-row {
        opacity: 1;
        transform: translateY(0);
        pointer-events: auto;
      }
      body.ax-mobile .ax-sheet-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding-bottom: 8px;
        border-bottom: 1px solid rgba(214,180,104,0.24);
      }
      body.ax-mobile .ax-btn {
        min-height: var(--ax-touch);
        padding: 10px 12px;
        border-radius: var(--ax-radius);
        text-align: left;
        font-size: 15px;
        font-weight: 650;
      }
      body.ax-mobile .ax-mobile-fullscreen {
        position: fixed;
        right: 10px;
        top: 10px;
        display: block;
        z-index: 4;
      }
      body.ax-mobile.ax-landscape-mode .ax-mobile-fullscreen {
        opacity: 0.72;
      }
      body.ax-mobile .ax-mobile-menu-toggle {
        position: fixed;
        right: 14px;
        bottom: 16px;
        display: grid;
        place-items: center;
        width: 56px;
        height: 56px;
        border-radius: 16px;
        font-size: 0;
        z-index: 9;
      }
      body.ax-mobile .ax-mobile-menu-toggle::before {
        content: "";
        width: 26px;
        height: 18px;
        border-top: 3px solid var(--ax-gold);
        border-bottom: 3px solid var(--ax-gold);
        box-shadow: 0 7px 0 var(--ax-gold);
      }
      body.ax-mobile .ax-mobile-backdrop {
        position: fixed;
        inset: 0;
        display: none;
        background: rgba(0,0,0,0.38);
        pointer-events: auto;
        z-index: 7;
      }
      body.ax-mobile.ax-menu-open .ax-mobile-backdrop {
        display: block;
      }
      body.ax-mobile .ax-side {
        left: 0;
        right: 0;
        bottom: 0;
        top: auto;
        width: auto;
        max-height: 68dvh;
        border-radius: var(--ax-sheet-radius) var(--ax-sheet-radius) 0 0;
        border-left: 0;
        border-right: 0;
        border-bottom: 0;
        z-index: 8;
      }
      body.ax-mobile .ax-help {
        left: 0;
        right: 0;
        bottom: 0;
        width: auto;
        max-height: 62dvh;
        overflow: auto;
        border-radius: var(--ax-sheet-radius) var(--ax-sheet-radius) 0 0;
        border-left: 0;
        border-right: 0;
        border-bottom: 0;
        z-index: 8;
      }
      body.ax-mobile .ax-look-pad {
        right: 0;
        top: 68px;
        bottom: 92px;
        width: 42vw;
        z-index: 1;
      }
      body.ax-mobile.ax-menu-open .ax-look-pad,
      body.ax-mobile.ax-panel-open .ax-look-pad,
      body.ax-mobile.ax-help-open .ax-look-pad,
      body.ax-mobile.ax-pwa-open .ax-look-pad {
        pointer-events: none;
      }
      body.ax-mobile .ax-joystick {
        left: 16px;
        bottom: 18px;
        width: 124px;
        height: 124px;
        z-index: 3;
      }
      body.ax-mobile .ax-floor-row {
        left: 154px;
        right: 82px;
        bottom: 18px;
        justify-content: center;
        z-index: 3;
      }
      @media (orientation: portrait) {
        body.ax-mobile.ax-landscape-mode #unity-container,
        body.ax-mobile.ax-landscape-mode #ax-gallery-ui {
          position: fixed !important;
          left: 0 !important;
          top: 100dvh !important;
          width: 100dvh !important;
          height: 100vw !important;
          transform: rotate(-90deg);
          transform-origin: top left;
        }
        body.ax-mobile.ax-landscape-mode #unity-canvas {
          width: 100dvh !important;
          height: 100vw !important;
        }
      }
      @media (max-width: 720px) {
        body.ax-mobile {
          position: fixed;
          inset: 0;
          width: 100%;
          height: 100dvh;
        }
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
          align-items: flex-end;
        }
        body.ax-mobile .ax-button-row {
        position: fixed;
          left: 0;
          right: 0;
          bottom: 0;
          width: auto;
          max-height: min(68dvh, 420px);
          overflow: auto;
          padding: 14px 16px calc(16px + env(safe-area-inset-bottom));
          border: 1px solid var(--ax-border);
          border-bottom: 0;
          border-radius: var(--ax-sheet-radius) var(--ax-sheet-radius) 0 0;
          background:
            linear-gradient(180deg, rgba(42, 38, 30, 0.98), var(--ax-bg-strong)),
            var(--ax-bg-strong);
          display: grid;
          grid-template-columns: 1fr;
          gap: 10px;
          opacity: 1;
          transform: translateY(110%);
          pointer-events: none;
          transition: opacity 0.16s ease, transform 0.16s ease;
          backdrop-filter: blur(8px);
          z-index: 8;
        }
        body.ax-mobile.ax-menu-open .ax-button-row {
          opacity: 1;
          transform: translateY(0);
          pointer-events: auto;
        }
        body.ax-mobile .ax-btn {
          min-height: var(--ax-touch);
          padding: 10px 12px;
          border-radius: var(--ax-radius);
          text-align: left;
          font-size: 15px;
          font-weight: 650;
        }
        .ax-topbar {
          align-items: stretch;
          flex-direction: column;
        }
        .ax-status {
          align-self: flex-start;
          max-width: min(52vw, 360px);
          font-size: 12px;
          opacity: 0.82;
        }
        body.ax-mobile .ax-mobile-fullscreen {
          position: fixed;
          right: 10px;
          top: 10px;
          display: block;
          z-index: 4;
        }
        body.ax-mobile .ax-mobile-menu-toggle {
          position: fixed;
          right: 14px;
          bottom: 16px;
          display: grid;
          place-items: center;
          width: 56px;
          height: 56px;
          border-radius: 16px;
          font-size: 0;
          z-index: 9;
        }
        body.ax-mobile .ax-side {
          left: 0;
          right: 0;
          bottom: 0;
          top: auto;
          width: auto;
          max-height: 68dvh;
          border-radius: var(--ax-sheet-radius) var(--ax-sheet-radius) 0 0;
          border-left: 0;
          border-right: 0;
          border-bottom: 0;
          z-index: 8;
        }
        body.ax-mobile .ax-help {
          left: 0;
          right: 0;
          bottom: 0;
          width: auto;
          max-height: 62dvh;
          overflow: auto;
          border-radius: var(--ax-sheet-radius) var(--ax-sheet-radius) 0 0;
          border-left: 0;
          border-right: 0;
          border-bottom: 0;
          z-index: 8;
        }
        body.ax-mobile .ax-mobile-controls {
          display: block;
        }
        body.ax-mobile .ax-look-pad {
          right: 0;
          top: 68px;
          bottom: 92px;
          width: 42vw;
          z-index: 1;
        }
        body.ax-mobile.ax-menu-open .ax-look-pad,
        body.ax-mobile.ax-panel-open .ax-look-pad,
        body.ax-mobile.ax-help-open .ax-look-pad,
        body.ax-mobile.ax-pwa-open .ax-look-pad {
          pointer-events: none;
        }
        body.ax-mobile .ax-joystick {
          left: 16px;
          bottom: 18px;
          width: 124px;
          height: 124px;
          z-index: 3;
        }
        body.ax-mobile .ax-floor-row {
          left: 154px;
          right: 82px;
          bottom: 18px;
          justify-content: center;
          z-index: 3;
        }
      }
      @media (orientation: landscape) and (max-height: 520px) {
        body.ax-mobile .ax-status {
          display: none;
        }
        body.ax-mobile .ax-button-row {
          left: 0;
          right: 0;
          bottom: 0;
          width: auto;
          max-height: min(76dvh, 360px);
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
        body.ax-mobile .ax-look-pad {
          top: 42px;
          right: 0;
          bottom: 82px;
          width: 38vw;
        }
        body.ax-mobile .ax-joystick {
          left: 18px;
          bottom: 16px;
          width: 116px;
          height: 116px;
        }
        body.ax-mobile .ax-floor-row {
          left: 150px;
          right: 356px;
          bottom: 16px;
        }
        body.ax-mobile .ax-mobile-fullscreen {
          top: 8px;
          right: 8px;
        }
        body.ax-mobile .ax-mobile-menu-toggle {
          right: 14px;
          bottom: 14px;
        }
      }
    `;
    document.head.appendChild(style);

    const root = document.createElement("div");
    root.id = "ax-gallery-ui";
    root.innerHTML = `
      <div class="ax-topbar">
        <div class="ax-button-row">
          <div class="ax-sheet-head">
            <h2 class="ax-sheet-title">메뉴</h2>
            <button class="ax-close" id="ax-close-menu" type="button">닫기</button>
          </div>
          <button class="ax-btn ax-art-label" id="ax-open-info" type="button" data-label="CAPTION">작품 설명</button>
          <button class="ax-btn ax-art-label" id="ax-next-artwork" type="button" data-label="NEXT">다음 작품</button>
          <button class="ax-btn ax-art-label" id="ax-go-selected" type="button" data-label="MOVE">선택 작품 앞으로</button>
          <button class="ax-btn ax-art-label" id="ax-toggle-tour" type="button" data-label="TOUR">투어 시작/정지</button>
          <button class="ax-btn ax-art-label" id="ax-open-list" type="button" data-label="CATALOG">작품 목록</button>
          <button class="ax-btn ax-art-label" id="ax-open-map" type="button" data-label="FLOOR PLAN">전시장 지도</button>
          <button class="ax-btn ax-art-label" id="ax-toggle-help" type="button" data-label="GUIDE">조작 안내</button>
          <a class="ax-btn ax-art-label" href="admin.html" target="_blank" rel="noreferrer" data-label="CURATOR">관리자</a>
        </div>
        <div class="ax-status" id="ax-runtime">온라인 전시 준비 중</div>
        <button class="ax-btn primary ax-mobile-fullscreen ax-art-label" id="ax-fullscreen" type="button" data-label="VIEW MODE">가로 전체화면</button>
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
        <div class="ax-help-head">
          <h2>조작법</h2>
          <button class="ax-close" id="ax-close-help" type="button">닫기</button>
        </div>
        <p>모바일: 왼쪽 원형 패드로 이동</p>
        <p>모바일: 오른쪽 화면을 드래그해서 시점 회전</p>
        <p>위로 스와이프하면 위를 보고, 아래로 스와이프하면 아래를 봅니다.</p>
        <p>우하단 三 버튼으로 메뉴 열기/닫기</p>
        <p>PC: WASD 이동, Shift 달리기, 마우스 드래그로 시점 회전</p>
      </section>
      <section class="ax-pwa-tip" id="ax-pwa-tip">
        <strong>iPhone Safari 전체화면 안내</strong>
        <p>Safari 탭 안에서는 주소창과 탭바를 사이트가 강제로 숨길 수 없습니다. 공유 버튼을 누른 뒤 홈 화면에 추가하고, 홈 화면 아이콘으로 실행하면 앱처럼 더 넓게 열립니다.</p>
        <div class="ax-pwa-tip-actions">
          <button class="ax-btn" id="ax-close-pwa-tip" type="button">닫기</button>
        </div>
      </section>
      <div class="ax-mobile-controls" id="ax-mobile-controls">
        <button class="ax-mobile-backdrop" id="ax-mobile-backdrop" type="button" aria-label="메뉴 닫기"></button>
        <div class="ax-look-pad" id="ax-look-pad" aria-label="시점 회전 영역"></div>
        <div class="ax-joystick" id="ax-joystick" aria-label="이동 조이스틱">
          <div class="ax-joystick-knob" id="ax-joystick-knob"></div>
        </div>
        <div class="ax-floor-row">
          <button class="ax-btn" data-floor="0" type="button">1F</button>
          <button class="ax-btn" data-floor="1" type="button">2F</button>
          <button class="ax-btn" data-floor="2" type="button">3F</button>
        </div>
        <button class="ax-btn ax-mobile-menu-toggle" id="ax-mobile-menu" type="button" aria-label="메뉴 열기">三</button>
      </div>
    `;
    document.body.appendChild(root);

    document.getElementById("ax-open-info").addEventListener("click", () => {
      setPanelVisible(true);
      sendHud("ShowArtworkInfoString", "");
    });
    document.getElementById("ax-next-artwork").addEventListener("click", () => {
      setMobileMenuOpen(false);
      sendHud("GoToNextTourArtworkString", "");
    });
    document.getElementById("ax-go-selected").addEventListener("click", () => {
      setMobileMenuOpen(false);
      sendHud("GoToSelectedArtworkString", "");
    });
    document.getElementById("ax-toggle-tour").addEventListener("click", () => {
      setMobileMenuOpen(false);
      sendHud("ToggleGuidedTourString", "");
    });
    document.getElementById("ax-open-list").addEventListener("click", () => {
      setMobileMenuOpen(false);
      sendHud("ToggleArtworkListString", "");
    });
    document.getElementById("ax-open-map").addEventListener("click", () => {
      setMobileMenuOpen(false);
      sendHud("ToggleMiniMapString", "");
    });
    document.getElementById("ax-close-info").addEventListener("click", () => setPanelVisible(false));
    document.getElementById("ax-close-menu").addEventListener("click", () => {
      closeMobileOverlays();
    });
    document.getElementById("ax-toggle-help").addEventListener("click", () => {
      setMobileMenuOpen(false);
      setHelpVisible(true);
    });
    document.getElementById("ax-close-help").addEventListener("click", () => setHelpVisible(false));
    document.getElementById("ax-close-pwa-tip").addEventListener("click", () => setPwaTipVisible(false, true));
    document.getElementById("ax-mobile-menu").addEventListener("click", () => {
      if (isBlockingOverlayOpen()) {
        closeMobileOverlays();
        return;
      }
      setMobileMenuOpen(!mobile.menuOpen);
    });
    document.getElementById("ax-mobile-backdrop").addEventListener("click", closeMobileOverlays);
    document.getElementById("ax-fullscreen").addEventListener("click", requestFullscreen);
    setupMobileControls();
    updateMobileMode();
    maybeShowInitialPwaHint();
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
    document.body.classList.toggle("ax-panel-open", !!visible);
    if (visible) setMobileMenuOpen(false);
  }

  function setHelpVisible(visible) {
    ensure();
    document.getElementById("ax-help").classList.toggle("open", !!visible);
    document.body.classList.toggle("ax-help-open", !!visible);
    if (visible) setMobileMenuOpen(false);
  }

  function setPwaTipVisible(visible, rememberDismissed) {
    ensure();
    const next = !!visible;
    document.getElementById("ax-pwa-tip").classList.toggle("open", next);
    document.body.classList.toggle("ax-pwa-open", next);
    if (next) {
      setMobileMenuOpen(false);
      setPanelVisible(false);
      setHelpVisible(false);
    }
    if (rememberDismissed) {
      mobile.pwaHintDismissed = true;
      try {
        localStorage.setItem("axGalleryPwaHintDismissed", "1");
      } catch (error) {
        console.warn("AXGallery PWA hint storage failed", error);
      }
    }
  }

  function setMobileMenuOpen(open) {
    mobile.menuOpen = !!open;
    document.body.classList.toggle("ax-menu-open", mobile.menuOpen);
    if (!mobile.menuOpen) sendUnity("StopMobileLookString", "");
  }

  function closeMobileOverlays() {
    setMobileMenuOpen(false);
    setPanelVisible(false);
    setHelpVisible(false);
    setPwaTipVisible(false, false);
    sendUnity("StopMobileLookString", "");
  }

  function requestFullscreen() {
    setLandscapeMode(true);
    if (isIosSafari() && !isStandaloneApp()) {
      setPwaTipVisible(true, false);
    }
    const target = document.getElementById("unity-container") || document.documentElement;
    const method =
      target.requestFullscreen ||
      target.webkitRequestFullscreen ||
      target.msRequestFullscreen;
    if (method) {
      try {
        const result = method.call(target);
        if (result && typeof result.then === "function") {
          result.then(lockLandscape).catch((error) => {
            console.warn("AXGallery fullscreen failed", error);
            showFullscreenFallback();
            lockLandscape();
          });
        } else {
          lockLandscape();
        }
      } catch (error) {
        console.warn("AXGallery fullscreen failed", error);
        showFullscreenFallback();
        lockLandscape();
      }
    } else {
      showFullscreenFallback();
      lockLandscape();
    }
  }

  function showFullscreenFallback() {
    if (isIosSafari() && !isStandaloneApp() && !mobile.pwaHintDismissed) {
      setPwaTipVisible(true, false);
    }
  }

  function setLandscapeMode(enabled) {
    mobile.landscapeMode = !!enabled;
    document.body.classList.toggle("ax-landscape-mode", mobile.landscapeMode);
    const button = document.getElementById("ax-fullscreen");
    if (button) button.textContent = mobile.landscapeMode ? "가로 모드" : "가로 전체화면";
    setTimeout(() => {
      window.dispatchEvent(new Event("resize"));
    }, 80);
  }

  function lockLandscape() {
    const orientation = screen.orientation || screen.mozOrientation || screen.msOrientation;
    if (!orientation || typeof orientation.lock !== "function") return;
    try {
      const result = orientation.lock("landscape");
      if (result && typeof result.catch === "function") {
        result.catch((error) => console.warn("AXGallery orientation lock failed", error));
      }
    } catch (error) {
      console.warn("AXGallery orientation lock failed", error);
    }
  }

  function isIosSafari() {
    const ua = navigator.userAgent || "";
    const isiOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const webkit = /WebKit/i.test(ua);
    const excluded = /CriOS|FxiOS|EdgiOS|OPiOS/i.test(ua);
    return isiOS && webkit && !excluded;
  }

  function isStandaloneApp() {
    return window.navigator.standalone === true ||
      window.matchMedia("(display-mode: standalone)").matches ||
      window.matchMedia("(display-mode: fullscreen)").matches;
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
    if (!mobile.active) {
      setMobileMenuOpen(false);
      sendUnity("SetMobileMoveInputString", "0,0");
    }
  }

  function maybeShowInitialPwaHint() {
    if (!mobile.active || mobile.pwaHintDismissed || isStandaloneApp() || !isIosSafari()) return;
    setTimeout(() => {
      if (!mobile.pwaHintDismissed && !isStandaloneApp()) {
        setPwaTipVisible(true, false);
      }
    }, 1200);
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
      if (mobile.menuOpen || isBlockingOverlayOpen()) return;
      event.preventDefault();
      mobile.lookPointer = event.pointerId;
      mobile.lastLook = { x: event.clientX, y: event.clientY };
      lookPad.setPointerCapture(event.pointerId);
    });
    lookPad.addEventListener("pointermove", (event) => {
      if (event.pointerId !== mobile.lookPointer) return;
      if (mobile.menuOpen || isBlockingOverlayOpen()) {
        mobile.lookPointer = null;
        sendUnity("StopMobileLookString", "");
        return;
      }
      event.preventDefault();
      const dx = event.clientX - mobile.lastLook.x;
      const dy = event.clientY - mobile.lastLook.y;
      mobile.lastLook = { x: event.clientX, y: event.clientY };
      sendUnity("AddMobileLookDeltaString", `${dx.toFixed(3)},${(-dy).toFixed(3)}`);
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

  function isBlockingOverlayOpen() {
    return document.getElementById("ax-side").classList.contains("open") ||
      document.getElementById("ax-help").classList.contains("open");
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
