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

(() => {
  const board = document.querySelector(".board");

  let stickerCount = 0;
  let nextPutTop = 30;
  let nextPutLeft = 0;
  let stickerColorPallete = [
    "#3288bd",
    "#66c2a5",
    "#f46d43",
    "#fdae61",
    "#e6f598",
    "#abdda4",
    "#d53e4f",
    "#5e4fa2",
  ];
  let sticker = `<div class="container" style="position: absolute; top: {0}px; left: {1}px; background-color: {2};">
                    <div class="sticker-name">{3}</div>
                    <div class="control">
                      <button class="add-item">항목 추가</button>
                      <button class="remove-sticker">스티커 삭제</button>
                    </div>
                  </div>`;

  const stickerItem = `
                        <input type="text" name="content" placeholder="내용을 입력하세요." class="content">
                        <div class="control">
                          <button class="remove-item">삭제</button>
                        </div>`;

  String.prototype.format = function () {
    var formatted = this;
    for (var i = 0; i < arguments.length; i++) {
      var regexp = new RegExp("\\{" + i + "\\}", "gi");
      formatted = formatted.replace(regexp, arguments[i]);
    }
    return formatted;
  };

  let element = null; // 움직일 대상(스티커, 스티커 항목)
  let ghost = null;

  const ghostShadow = `<div class="shadow"></div>`;

  board.addEventListener("mousedown", (event) => {
    console.log(event.target, event.target.tagName);
    if (Iam(event.target.parentNode, "control")) {
      if (Iam(event.target, "add-item")) {
        // 스티커 항목을 추가
        let draggable = document.createElement("div");
        draggable.innerHTML = stickerItem;
        draggable.setAttribute("class", "draggable");
        event.target.closest(".container").appendChild(draggable);

        // 요구사항 반영용('항목 삭제버튼에 대한 이벤트 핸들링을 해당 버튼에 등록하는 것이 아닌 항목에 등록하여 이벤트 위임방식으로 구현') - board.addEventListener("mouseup", onMouseUp)에 필터링해서 처리해도 됨
        draggable.addEventListener("click", (event) => {
          console.log("항목을 삭제해야합니다");
          if (Iam(event.target.parentNode, "control")) {
            if (Iam(event.target, "remove-item")) {
              console.log("항목을 삭제해야합니다");
              // 항목을 삭제
              event.target.closest(".draggable").remove();
            }
          }
        });
      } else if (event.target.id === "add-sticker") {
        // 스티커 추가
        nextPutTop += 30;
        nextPutLeft += 20;
        board.innerHTML += sticker.format(
          nextPutTop,
          nextPutLeft,
          stickerColorPallete[0],
          `Sticker${++stickerCount}`
        );

        stickerColorPallete.push(stickerColorPallete.shift());
      } else if (Iam(event.target, "remove-sticker")) {
        // 스티커(컨테이너)를 삭제
        event.target.closest(".container").remove();
      }
    }

    if (event.target.tagName === "INPUT" || event.target.tagName === "BUTTON")
      return;

    // 움직일 대상에 대한 전 처리
    if (Iam(event.target, "draggable")) {
      element = event.target;

      ghost = element.cloneNode(true);
      ghost.classList.add("ghost");
      event.target.after(ghost);

      element.style.zIndex =
        findMaxZIndex(board.querySelectorAll(".draggable")) + 1;
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

    element = ghost = null;
  });

  function onMouseMove(event) {
    new Promise((resolve, reject) => {
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
        // 각 element의 상자 중심을 기준으로 맨해튼 거리 측정해서 가장 가까운 container찾기
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

          if (closest.offset > manhattnDistance) {
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
})();
