const draggableContainers = document.querySelectorAll(".container");

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

document.querySelectorAll(".draggable").forEach((element) => {
  // 마우스의 위치값 저장
  let x = 0;
  let y = 0;

  let ghost = null;

  // 마우스 누른 순간 이벤트
  const mouseDownHandler = function (event) {
    ghost = element.cloneNode(true);
    ghost.classList.add("ghost");
    ghost.innerHTML += "ghost";
    element.after(ghost);

    // 누른 마우스 위치값을 가져와 저장
    x = event.clientX;
    y = event.clientY;

    // 마우스 이동시 초기 위치와의 거리차 계산
    const dx = event.clientX - x;
    const dy = event.clientY - y;

    // 마우스 이동 거리 만큼 Element의 top, left 위치값에 반영
    element.style.top = `${element.offsetTop + dy}px`;
    element.style.left = `${element.offsetLeft + dx}px`;

    console.log(
      "mouseDownHandler",
      event.clientX,
      element.offsetTop,
      dx,
      event.clientY,
      element.offsetLeft,
      dy
    );

    event.target.style.position = "absolute";

    // 마우스 이동 및 해제 이벤트를 등록
    document.addEventListener("mousemove", mouseMoveHandler);
    document.addEventListener("mouseup", mouseUpHandler);
  };

  const mouseMoveHandler = function (event) {
    // return;
    // 마우스 이동시 초기 위치와의 거리차 계산
    const dx = event.clientX - x;
    const dy = event.clientY - y;

    // 마우스 이동 거리 만큼 Element의 top, left 위치값에 반영
    element.style.top = `${element.offsetTop + dy}px`;
    element.style.left = `${element.offsetLeft + dx}px`;

    console.log(
      "mouseMoveHandler",
      event.clientX,
      element.offsetTop,
      dx,
      event.clientY,
      element.offsetLeft,
      dy
    );

    // 기준 위치 값을 현재 마우스 위치로 update
    x = event.clientX;
    y = event.clientY;
  };

  const mouseUpHandler = function () {
    // 마우스가 해제되면 이벤트도 같이 해제
    document.removeEventListener("mousemove", mouseMoveHandler);
    document.removeEventListener("mouseup", mouseUpHandler);

    ghost.remove();
    element.removeAttribute("style");
  };

  element.addEventListener("mousedown", mouseDownHandler);
});
