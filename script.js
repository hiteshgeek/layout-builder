const layoutContainer = document.getElementById("layoutContainer");
const addRowBtn = document.getElementById("addRowBtn");
const columnOptions = [1, 2, 3, 4, 6, 8];

function createRowControl(position = "top") {
  const control = document.createElement("div");
  control.classList.add("row-control", position);
  control.innerHTML = `<div class="btn">+</div>`;
  return control;
}

function createRow() {
  const wrapper = document.createElement("div");
  wrapper.classList.add("row-wrapper");

  const row = document.createElement("div");
  row.classList.add("row");

  const deleteBtn = document.createElement("button");
  deleteBtn.classList.add("delete-btn");
  deleteBtn.textContent = "×";
  row.appendChild(deleteBtn);

  const selector = document.createElement("div");
  selector.classList.add("column-selector");

  columnOptions.forEach((count) => {
    const option = document.createElement("div");
    option.classList.add("selector-option");

    const preview = document.createElement("div");
    preview.classList.add("selector-preview");

    for (let i = 0; i < count; i++) {
      const col = document.createElement("div");
      col.classList.add("selector-col");
      preview.appendChild(col);
    }

    const label = document.createElement("div");
    label.classList.add("selector-label");
    label.textContent = `${count} column${count > 1 ? "s" : ""}`;

    option.appendChild(preview);
    option.appendChild(label);

    option.addEventListener("click", () => {
      row.innerHTML = "";
      row.appendChild(deleteBtn);
      for (let i = 0; i < count; i++) {
        const col = document.createElement("div");
        col.classList.add("column");
        col.style.flex = `0 0 calc(${100 / count}% - 10px)`;
        col.textContent = "+";
        row.appendChild(col);
      }
      updateRowControls();
    });

    selector.appendChild(option);
  });

  row.appendChild(selector);
  wrapper.appendChild(row);

  deleteBtn.addEventListener("click", () => {
    wrapper.remove();
    updateRowControls();
  });

  return wrapper;
}

function updateRowControls() {
  document.querySelectorAll(".row-control").forEach((el) => el.remove());
  const rows = layoutContainer.querySelectorAll(".row-wrapper");

  if (rows.length === 0) return;

  rows.forEach((rowWrapper, index) => {
    // Add an ABOVE button for every row (always visible)
    const addAbove = createRowControl("top");
    addAbove.addEventListener("click", () => {
      layoutContainer.insertBefore(createRow(), rowWrapper);
      updateRowControls();
    });
    rowWrapper.appendChild(addAbove);

    // Add BELOW button only for the last row (only visible on hover via CSS)
    if (index === rows.length - 1) {
      const addBelow = createRowControl("bottom");
      addBelow.addEventListener("click", () => {
        layoutContainer.insertBefore(createRow(), addRowBtn);
        updateRowControls();
      });
      rowWrapper.appendChild(addBelow);
    }
  });
}

addRowBtn.addEventListener("click", () => {
  const newRow = createRow();
  layoutContainer.insertBefore(newRow, addRowBtn);
  updateRowControls();
});
