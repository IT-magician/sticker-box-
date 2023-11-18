(() => {
  // (closure 사용하기 위함) immediately executing runction when javascript is run
  const board = document.querySelector(".board");
  let container = null;
  let startX = 0;
  let startY = 0;
  let shiftX;
  let shiftY;

  board.addEventListener("mousedown", (event) => {
    event.preventDefault();
    if (event.target.classList.contains("draggable")) {
      console.log(
        "mousedown",
        event.target,
        event.target.getBoundingClientRect(),
        event.target.getBoundingClientRect().left
      );
      // container = event.target;
      // shiftX = event.clientX - event.target.getBoundingClientRect().left;
      // shiftY = event.clientY - event.target.getBoundingClientRect().top;
      // event.target.style.position = "absolute";
      // event.target.style.zIndex = 1000;
      // event.target.closest(".container").append(event.target);
      // moveAt(event.pageX, event.pageY);
    }
    // else if (event.target.classList.contains("container")) {
    //   container = event.target;
    // }
  });

  board.addEventListener("mousemove", (event) => {
    if (!container) return;

    // console.log("mousemove");
  });

  board.addEventListener("mouseup", (event) => {
    // console.log("mouseup");
    container = null;
  });

  function Iam(target, className) {
    let closest = null;
    return target.classList.contains(className)
      ? target
      : (closest = target.closest(`.${className}`)).classList.contains(
          className
        )
      ? closest
      : null;
  }

  function onMouseDown(event, func, doStopPropagation = true) {
    event.preventDefault();
    if (doStopPropagation) event.stopPropagation();
    func();
  }

  function moveAt(container, pageX, pageY) {
    console.log(container);
    container.style.left = pageX - shiftX + "px";
    container.style.top = pageY - shiftY + "px";
  }

  function onMouseMove(event) {
    console.log("mousemove");
    debounce(moveAt(container, event.pageX, event.pageY), 16 /*60Hz*/);
  }

  function removeOnMouseMove() {
    console.log("mouseup");
    container.removeEventListener("mousemove", onMouseMove);
    container.onmouseup = null;
  }
})();
