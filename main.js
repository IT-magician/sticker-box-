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

  let element = null;
  let ghost = null;

  let x = 0;
  let y = 0;

  board.addEventListener("mousedown", (event) => {
    event.preventDefault();

    // 움직일 대상에 대한 전 처리
    if (WhoIam(event.target, "container")) {
      element = event.target;

      element.style.zIndex =
        findMaxZIndex(board.querySelectorAll(".container")) + 1;
      element.style.margin = 0;
    } else if (WhoIam(event.target, "draggable")) {
      element = event.target;

      ghost = element.cloneNode(true);
      ghost.classList.add("ghost");
      ghost.innerHTML += "ghost";
      event.target.after(ghost);

      element.style.zIndex =
        findMaxZIndex(board.querySelectorAll(".draggable")) + 1;
      element.style.margin = 0;
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

    console.log("board mousemove");
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
      if (WhoIam(element, "draggable")) resolve(element);
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
        console.log(Array.from(board.querySelectorAll(".container")), closest);
        console.log(closest.element);

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

  function WhoIam(element, className) {
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
    const parentA = nodeA.parentNode;
    const siblingA = nodeA.nextSibling === nodeB ? nodeA : nodeA.nextSibling;

    // Move `nodeA` to before the `nodeB`
    nodeB.parentNode.insertBefore(nodeA, nodeB);

    // Move `nodeB` to before the sibling of `nodeA`
    parentA.insertBefore(nodeB, siblingA);
  }
})();
