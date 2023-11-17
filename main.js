const draggableContainers = document.querySelectorAll(".container");

function moveAt(container, pageX, pageY) {
  container.style.left = pageX - shiftX + "px";
  container.style.top = pageY - shiftY + "px";
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
    moveAt(container, event.pageX, event.pageY);
  }


  function removeOnMouseMove() {
    document.removeEventListener("mousemove", onMouseMove);
    container.onmouseup = null;
  }


  /**
   * 가장 가까운 위치를 찾아줌(자기자신, 같은 부모에 있는 자식, 자식이 없는 부모, 자식이 한개 이상 있는 다른 부모의 자식)
   * 
   * @param {Node} container 
   * @param {e.clientY} y 
   * @returns 
   */
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

  container.addEventListener("dragstart", (e) => {
    if (e.target.classList.contains("draggable")) {
      e.target.classList.add("dragging");

      console.log("dragstart");
    }
  });

  container.addEventListener("dragover", (e) => {
    e.preventDefault();
    const afterElement = getDragAfterElement(container, e.clientY);
    const draggable = document.querySelector(".dragging");

    container.appendChild(draggable);
    container.insertBefore(draggable, afterElement);


    console.log("dragover");
  });

  container.addEventListener("dragend", (e) => {
    if (e.target.classList.contains("draggable")) {


      e.target.classList.remove("dragging");
      console.log("dragstart");

    }
  });
});
