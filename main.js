function random(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function debounce(callback, limit = 100) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      callback.apply(this, args);
    }, limit);
  };
}

let sticker = `<!-- <div class="container" style="position: absolute; top: 30px; left: 30px; background-color: #efefef;"> -->
<input type="text" placeholder="스티커 제목을 입력하세요." class="sticker-name" value={0}>
<div class="control">
  <button class="add-item">항목 추가</button>
  <button class="remove-sticker">스티커 삭제</button>
</div>
<!-- </div> -->`;

const stickerItem = `<!-- <div class="draggable" > -->
    <input type="text" name="content{0}" placeholder="내용을 입력하세요." class="content" value={1}>
    <div class="control">
      <button class="remove-item">삭제</button>
    </div>
    <!-- </div> -->
    `;

const board = document.querySelector(".board");
let stickerCount = 0; // 스티커 고유 ID
let stickerColorPallete = [
  "#3288bd",
  "#66c2a5",
  "#f46d43",
  "#fdae61",
  "#e6f598",
  "#abdda4",
  "#d53e4f",
  "#5e4fa2",
]; // 스티커 생성 색상
const localStorageStickersJsonName = "JsonStickers";

let stickersJson = {
  /*

Sticker1 : {
  styleTop: "-1px",
  styleLeft: "-1px",
  backgroundColor: "none",
  contents: []
},

Sticker2 : {
  styleTop: "-1px",
  styleLeft: "-1px",
  backgroundColor: "none",
  contents: []
}

, ...
*/
};

window.addEventListener("load", (event) => {
  // localStorage.removeItem(localStorageStickersJsonName);

  stickersJson = JSON.parse(localStorage.getItem(localStorageStickersJsonName));

  let lastStickerBackground = null;

  // LocalStorage에 저장된 Sticker를 화면에 그리기
  Object.entries(stickersJson ?? {}).forEach(([stickerGuid, stickerJson]) => {
    let sticker = generateStickerElement(
      stickerJson.stickerId,
      stickerJson.styleTop,
      stickerJson.styleLeft,
      stickerJson.styleBackgroundColor,
      stickerJson.stickerGuid
    );

    // 스티커 아이템 내용 가져와서 스티커에 '스티커 아이템' 채우기
    stickerJson.stickerContents.forEach((content) =>
      sticker.appendChild(generateStickerItemElement(null, content))
    );

    lastStickerBackground = stickerJson.styleBackgroundColor;

    // 보드에 저장된 스티커 그리기
    board.appendChild(sticker);
  });

  //  LocalStorage에 있는 스티커를 불러온 후에 마지막에 조회한 색상과 다른 스티커 색을 생성하게
  for (
    let i = 0;
    stickerColorPallete[0] !== rgbToHex(lastStickerBackground) &&
    i < stickerColorPallete.length;
    i++, stickerColorPallete.push(stickerColorPallete.shift())
  )
    stickerColorPallete.push(stickerColorPallete.shift());
});

// 클로져로 전역변수를 지역변수처럼 사용하는 메서드
((stickerEvents) => {
  String.prototype.format = function () {
    let formatted = this;
    for (let i = 0; i < arguments.length; i++) {
      let regexp = new RegExp("\\{" + i + "\\}", "gi");
      formatted = formatted.replace(regexp, arguments[i]);
    }
    return formatted;
  };

  let element = null; // 움직일 대상(스티커, 스티커 항목)
  let ghost = null;

  let putNextTop = 30;
  let putNextLeft = 20;

  const ghostShadow = `<div class="shadow"></div>`; // 생략할래용... (이거 하면.. Z-inde때문에 CSS랑 싸워야할거같아서 패스!))

  let wasDraggedInputBox = false;
  let doPreventDefaultWhenInputboxMousedown = true;

  board.addEventListener("focusout", (event) => {
    if (event.target.tagName !== "INPUT[type=text]") return;

    // '.board'내에 있는 모든 입력상자는 포커스를 잃으면 drag를 가능하게 default로 설정해준다.
    if (event.target.classList.contains("no-grabbing")) {
      event.target.classList.remove("no-grabbing");
    }

    if (Iam(event.target.parentNode, "container")) {
      const container = event.target.closest(".container");
      const stickerGuid = container.dataset.stickerguid;

      stickersJson[stickerGuid].stickerId = container.querySelector(
        "input[type=text][class=sticker-name]"
      )?.value;
    } else if (Iam(event.target.parentNode, "draggable")) {
      // 스티커 항목의 인덱스 구하기
      const container = event.target.closest(".container");
      const index = Array.from(container.querySelectorAll(".draggable")).reduce(
        (index, draggableElement, idx) => {
          if (
            event.target ===
            draggableElement.querySelector("input[type=text][class=content]")
          )
            return idx;
          else return index;
        },
        -1
      );

      // 스티커 항목의 인덱스를 찾지 못하면 건너뛰기
      if (index === -1) return;

      const stickerGuid = container.dataset.stickerguid;
      if (
        stickersJson[stickerGuid].stickerContents[index] === event.target.value
      )
        return; // LocalStorage에 저장된 내용과 같지 않을 때만 동작하도록 필터링

      stickersJson[stickerGuid].stickerContents[index] = event.target.value;
    }

    // * 포커스 아웃이 되면, 전체 스티커를 탐색하지 말고, 업데이트 된 스티커 항목의 input 상자만 resave.

    saveStickersOnLocalStorage(false);
  });

  board.addEventListener("keyup", (event) => {
    if (event.target.tagName !== "INPUT") return;

    const container = event.target.closest(".container");
    const stickerGuid = container.dataset.stickerguid;
    const index = Array.from(container.querySelectorAll(".draggable")).reduce(
      (index, draggableElement, idx) => {
        if (
          event.target ===
          draggableElement.querySelector("input[type=text][class=content]")
        )
          return idx;
        else return index;
      },
      -1
    );

    // 스티커 항목의 인덱스를 찾지 못하면 건너뛰기
    if (index === -1) return;

    // key 설명 : https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key
    switch (event.key) {
      case "Enter":
        debounce(
          (function () {
            event.target.blur(); // input 상자의 저장을 focusout 이벤트에 AOP으로 처리
          })(),
          16 /*60Hz*/
        );
        break;
      case "Escape":
        debounce(
          (function () {
            event.target.value =
              stickersJson[stickerGuid].stickerContents[index];
            event.target.blur();
          })(),
          16 /*60Hz*/
        );
        break;
    }
  });

  board.addEventListener("mousedown", (event) => {
    if (Iam(event.target.parentNode, "control")) {
      if (Iam(event.target, "add-item")) {
        // 스티커 항목을 추가
        const container = event.target.closest(".container");
        const draggable = generateStickerItemElement();

        container.appendChild(draggable);
        saveStickersOnLocalStorage();

        // 요구사항 반영용('항목 삭제버튼에 대한 이벤트 핸들링을 해당 버튼에 등록하는 것이 아닌 항목에 등록하여 이벤트 위임방식으로 구현') - board.addEventListener("mouseup", onMouseUp)에 필터링해서 처리해도 됨
        draggable.addEventListener("click", (event) => {
          if (Iam(event.target.parentNode, "control")) {
            if (Iam(event.target, "remove-item")) {
              // 항목을 삭제
              event.target.closest(".draggable").remove();
              saveStickersOnLocalStorage();
            }
          }
        });
      } else if (event.target.id === "add-sticker") {
        // 스티커 추가
        board.appendChild(
          generateStickerElement(
            `Sticker${++stickerCount}`,
            `${putNextTop}px`,
            `${putNextLeft}px`,
            stickerColorPallete[0]
          )
        );

        putNextTop += 30;
        putNextLeft += 30;

        stickerColorPallete.push(stickerColorPallete.shift());
        saveStickersOnLocalStorage();
      } else if (Iam(event.target, "remove-sticker")) {
        // 스티커(컨테이너)를 삭제
        event.target.closest(".container").remove();
        saveStickersOnLocalStorage();
      }
    }

    if (event.target.tagName === "BUTTON") return;

    // if (event.target.tagName === "INPUT") return;

    // 움직일 대상에 대한 전 처리
    if (Iam(event.target, "draggable")) {
      element = event.target;

      ghost = element.cloneNode(true);
      ghost.classList.add("ghost");
      event.target.after(ghost);

      // element.style.zIndex =
      //   findMaxZIndex(board.querySelectorAll(".draggable")) + 1;
      element.style.margin = 0;
      event.preventDefault();
    } else if (event.target.closest(".container")) {
      element = event.target.closest(".container");

      element.style.zIndex =
        findMaxZIndex(board.querySelectorAll(".container")) + 1;
      element.style.margin = 0;
      event.preventDefault();
    }

    // 움직일 대상에 대한 처리
    if (element) {
      // 누른 마우스 위치값을 가져와 저장
      x = event.clientX;
      y = event.clientY;

      // 마우스 이동시 초기 위치와의 거리차 계산
      const dx = event.clientX - x;
      const dy = event.clientY - y;

      // 마우스 이동 거리 만큼 Element의 top, left 위치값에 반영
      element.style.top = `${element.offsetTop + dy}px`;
      element.style.left = `${element.offsetLeft + dx}px`;

      element.style.position = "absolute";
    }
  });

  board.addEventListener("mousemove", (event) => {
    if (element === null) return;

    debounce(onMouseMove(event), 16 /* 60Hz */);
  });

  board.addEventListener("mouseup", (event) => {
    if (element === null) return;

    // 스티커 항목이 대상이 되는 경우 처리해야할 사항들
    if (ghost) {
      element.removeAttribute("style");
      ghost.replaceWith(element);
    }

    if (Iam(element, "container")) {
      saveStickersOnLocalStorage();
    }

    if (event.target.tagName === "INPUT") {
      if (event.target.closest(".container")?.classList.contains("grabbing"))
        event.target.closest(".container")?.classList.remove("grabbing");
      else {
        event.target.focus();
        if (Iam(event.target.parentNode, "draggable")) event.target.select();
      }
    }

    element = ghost = null;

    wasDraggedInputBox = false;
  });

  function onMouseMove(event) {
    new Promise((resolve, reject) => {
      if (event.target.tagName === "INPUT") {
        if (
          event.target.closest(".container")?.classList.contains("grabbing") ===
          false
        )
          event.target.closest(".container")?.classList.add("grabbing");
      }

      // 마우스 이동시 초기 위치와의 거리차 계산
      const dx = event.clientX - x;
      const dy = event.clientY - y;

      // 마우스 이동 거리 만큼 Element의 top, left 위치값에 반영
      element.style.top = `${element.offsetTop + dy}px`;
      element.style.left = `${element.offsetLeft + dx}px`;

      // 기준 위치 값을 현재 마우스 위치로 update
      x = event.clientX;
      y = event.clientY;

      // draggable일 경우, 별도처리
      if (Iam(element, "draggable")) resolve(element);
    })
      .then((draggable) => {
        // draggableElement의 상자 중심을 기준으로 맨해튼 거리 측정해서 가장 가까운 container찾기
        let closest = { offset: Number.POSITIVE_INFINITY, element: null };
        for (let container of board.querySelectorAll(".container")) {
          const dx = getManhattnDistance(draggable, container);

          const manhattnDistance =
            dx.closestHorizonalLineDy + dx.closestVerticalLineDx;

          if (closest.offset > manhattnDistance)
            closest = { offset: manhattnDistance, element: container };
        }

        const closestContainer = closest.element;

        return [closestContainer, draggable];
      })
      .then(([closestContainer, draggable]) => {
        let closest = { offset: Number.POSITIVE_INFINITY, element: null };

        for (let child of closestContainer.querySelectorAll(".draggable")) {
          const dx = getManhattnDistance(draggable, child);

          const manhattnDistance = dx.closestVerticalLineDx;

          if (
            closest.offset > manhattnDistance &&
            Math.abs(closest.offset - manhattnDistance) > 5
          ) {
            closest = { offset: manhattnDistance, element: child };
          }
        }

        closestContainer.appendChild(ghost);
        swapChildren(ghost, closest.element);
      });
  }

  function findMaxZIndex(elements) {
    conainerZIndexMax = null;

    if (elements) {
      elements.forEach(
        (element) =>
          (conainerZIndexMax = Math.max(
            element.style.zIndex,
            conainerZIndexMax
          ))
      );
    }

    return conainerZIndexMax ?? 0;
  }

  function Iam(element, className) {
    return element.classList.contains(className);
  }

  function getManhattnDistance(baseElement, element) {
    const centerX =
      baseElement.getBoundingClientRect().left +
      baseElement.getBoundingClientRect().width / 2;
    const centerY =
      baseElement.getBoundingClientRect().top +
      baseElement.getBoundingClientRect().height / 2;

    // element의 센터
    const closestVerticalLineDx = Math.min(
      Math.abs(element.getBoundingClientRect().top - centerY),
      Math.abs(element.getBoundingClientRect().bottom - centerY)
    );

    const closestHorizonalLineDy = Math.min(
      Math.abs(element.getBoundingClientRect().left - centerX),
      Math.abs(element.getBoundingClientRect().right - centerX)
    );

    return { closestVerticalLineDx, closestHorizonalLineDy };
  }

  function swapChildren(nodeA, nodeB) {
    if (!nodeA || !nodeB) return;

    const parentA = nodeA.parentNode ?? nodeB.parentNode;
    const siblingA = nodeA.nextSibling === nodeB ? nodeA : nodeA.nextSibling;

    // Move `nodeA` to before the `nodeB`
    parentA.insertBefore(nodeA, nodeB);

    // Move `nodeB` to before the sibling of `nodeA`
    parentA.insertBefore(nodeB, siblingA);
  }

  function saveStickersOnLocalStorage(doAllRefreshJsonData = true) {
    if (doAllRefreshJsonData) {
      stickersJson = {};

      for (let containerElement of board.querySelectorAll(".container")) {
        const stickerGuid = containerElement.dataset.stickerguid;
        const stickerId = containerElement.querySelector(
          `input[type="text"].sticker-name`
        ).value;
        const styleTop = containerElement.style.top;
        const styleLeft = containerElement.style.left;
        const styleBackgroundColor = containerElement.style.backgroundColor;
        const stickerContents = Array.from(
          containerElement.querySelectorAll(".draggable input[type=text]")
        ).reduce((arr, inputBox) => {
          arr.push(inputBox.value);

          return arr;
        }, []);

        stickersJson[stickerGuid] = {
          stickerGuid,
          stickerId,
          styleTop,
          styleLeft,
          styleBackgroundColor,
          stickerContents,
        };
      }
    }

    localStorage.setItem(
      localStorageStickersJsonName,
      JSON.stringify(stickersJson)
    );
  }
})();

function generateGuid() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }

  return (
    s4() +
    s4() +
    "-" +
    s4() +
    "-" +
    s4() +
    "-" +
    s4() +
    "-" +
    s4() +
    s4() +
    s4()
  );
}

function generateStickerElement(
  stickerId,
  top,
  left,
  stickerColor,
  guid = null
) {
  let stickerElement = document.createElement("div");

  // element innerHTML 지정
  stickerElement.innerHTML = sticker.format(stickerId);

  stickerElement.setAttribute("data-stickerGuid", guid ?? generateGuid()); // 사용자가 sticker-name을 변경해도 json에 접근할 수 있게 하기 위함.

  // 클래스 지정
  stickerElement.setAttribute("class", "container");

  // css 설정
  stickerElement.style.position = "absolute";
  stickerElement.style.top = top;
  stickerElement.style.left = left;
  stickerElement.style.backgroundColor = stickerColor;

  return stickerElement;
}

function generateStickerItemElement(
  stickerItemId = null,
  stickerItemContent = null
) {
  let draggable = document.createElement("div");

  // element innerHTML 지정
  draggable.innerHTML = stickerItem.format(
    stickerItemId ?? "",
    stickerItemContent ?? ""
  );

  // 클래스 지정
  draggable.setAttribute("class", "draggable");

  return draggable;
}

function rgbToHex(rgb) {
  let rgbRegex =
    /^rgb\(\s*(-?\d+)(%?)\s*,\s*(-?\d+)(%?)\s*,\s*(-?\d+)(%?)\s*\)$/;
  let result,
    r,
    g,
    b,
    hex = "";
  if ((result = rgbRegex.exec(rgb))) {
    r = componentFromStr(result[1], result[2]);
    g = componentFromStr(result[3], result[4]);
    b = componentFromStr(result[5], result[6]);

    hex = "#" + (0x1000000 + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  function componentFromStr(numStr, percent) {
    let num = Math.max(0, parseInt(numStr, 10));
    return percent
      ? Math.floor((255 * Math.min(100, num)) / 100)
      : Math.min(255, num);
  }

  return hex;
}
