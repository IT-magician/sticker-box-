const draggableContainers = document.querySelectorAll(".container");

function moveAt(container, pageX, pageY) {
  container.style.left = pageX - shiftX + "px";
  container.style.top = pageY - shiftY + "px";
}

function enterDroppable(container) {
  container.style.background = "pink";
}

function leaveDroppable(container) {
  container.style.background = "";
}

draggableContainers.forEach((container) => {
  let isMouseDownStatus = false;
  let shiftX = 0;
  let shiftY = 0;
  let draggabled = false;

  function moveAt(container, pageX, pageY) {
    container.style.left = pageX - shiftX + "px";
    container.style.top = pageY - shiftY + "px";
  }

  function onMouseMove(event) {
    // moveAt(container, event.pageX, event.pageY);
  }

  function getDragAfterElement(container, y) {
    const draggableElements = [
      ...container.querySelectorAll(".draggable:not(.dragging)"),
    ];

    return draggableElements.reduce(
      (closest, child) => {
        const box = child.getBoundingClientRect(); //해당 엘리먼트에 top값, height값 담겨져 있는 메소드를 호출해 box변수에 할당
        const offset = y - box.top - box.height / 2; //수직 좌표 - top값 - height값 / 2의 연산을 통해서 offset변수에 할당
        if (offset < 0 && offset > closest.offset) {
          // (예외 처리) 0 이하 와, 음의 무한대 사이에 조건
          return { offset: offset, element: child }; // Element를 리턴
        } else {
          return closest;
        }
      },
      { offset: Number.NEGATIVE_INFINITY }
    ).element;
  }

  // container.addEventListener("mousedown", (event) => {
  //   shiftX = event.clientX - container.getBoundingClientRect().left;
  //   shiftY = event.clientY - container.getBoundingClientRect().top;

  //   container.style.position = "absolute";
  //   container.style.zIndex = 1000;
  //   document.body.append(container);

  //   moveAt(container, event.pageX, event.pageY);

  //   document.addEventListener("mousemove", onMouseMove);
  // });

  function removeOnMouseMove() {
    document.removeEventListener("mousemove", onMouseMove);
    container.onmouseup = null;
  }
  // container.onmouseup = removeOnMouseMove;

  // container.addEventListener("mouseover", (e) => {
  //   // removeOnMouseMove();

  //   console.log("mouseover");
  // });

  // container.addEventListener("mouseup", (e) => {
  //   console.log("mouseup", isMouseDownStatus);
  //   isMouseDownStatus = false;

  //   removeOnMouseMove();
  // });

  container.addEventListener("dragstart", (e) => {
    if (e.target.classList.contains("draggable")) {
      e.target.classList.add("dragging");
    }
  });

  container.addEventListener("dragover", (e) => {
    if (e.target.classList.contains("draggable")) {
      e.preventDefault();
      const afterElement = getDragAfterElement(container, e.clientY);
      const draggable = document.querySelector(".dragging");

      console.log(draggable, afterElement);
      container.appendChild(draggable);
      container.insertBefore(draggable, afterElement);
    }

    console.log("dragover");
  });

  container.addEventListener("dragend", (e) => {
    if (e.target.classList.contains("draggable")) {
      e.target.classList.remove("dragging");

      removeOnMouseMove();
    }
  });
});
