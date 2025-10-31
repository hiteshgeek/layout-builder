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

  // Drag and drop for rows
  const rowDragHandle = document.createElement("div");
  rowDragHandle.className = "row-drag-handle";
  rowDragHandle.title = "Drag to reorder row";
  rowDragHandle.setAttribute("draggable", "true");
  // Use vertical dots SVG for better UI
  rowDragHandle.innerHTML = `<svg width="24" height="36" viewBox="0 0 24 36" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:block;margin:auto;">
    <circle cx="7" cy="9" r="2" fill="#888"/>
    <circle cx="17" cy="9" r="2" fill="#888"/>
    <circle cx="7" cy="18" r="2" fill="#888"/>
    <circle cx="17" cy="18" r="2" fill="#888"/>
    <circle cx="7" cy="27" r="2" fill="#888"/>
    <circle cx="17" cy="27" r="2" fill="#888"/>
  </svg>`;
  // All styles handled by CSS
  rowDragHandle.addEventListener("dragstart", (e) => {
    wrapper.classList.add("dragging-row");
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", "row");
    window._draggedRow = wrapper;
  });
  rowDragHandle.addEventListener("dragend", () => {
    wrapper.classList.remove("dragging-row");
    window._draggedRow = null;
    document
      .querySelectorAll(".row-wrapper")
      .forEach((w) => w.classList.remove("row-drop-target"));
  });
  wrapper.addEventListener("dragover", (e) => {
    e.preventDefault();
    if (window._draggedRow && window._draggedRow !== wrapper) {
      wrapper.classList.add("row-drop-target");
    }
  });
  wrapper.addEventListener("dragleave", () => {
    wrapper.classList.remove("row-drop-target");
  });
  wrapper.addEventListener("drop", (e) => {
    e.preventDefault();
    wrapper.classList.remove("row-drop-target");
    if (window._draggedRow && window._draggedRow !== wrapper) {
      const parent = wrapper.parentNode;
      parent.insertBefore(window._draggedRow, wrapper.nextSibling);
      updateRowControls();
    }
  });

  // Delete button
  const deleteBtn = document.createElement("button");
  deleteBtn.classList.add("delete-btn");
  deleteBtn.textContent = "×";
  deleteBtn.addEventListener("click", () => {
    wrapper.remove();
    updateRowControls();
  });

  const row = document.createElement("div");
  row.classList.add("row");

  function showColumnSelector() {
    row.innerHTML = "";
    row.appendChild(rowDragHandle);
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
        setColumns(count);
      });
      selector.appendChild(option);
    });
    row.appendChild(selector);
  }

  function setColumns(count) {
    row.innerHTML = "";
    row.appendChild(rowDragHandle);
    row.appendChild(deleteBtn);
    for (let i = 0; i < count; i++) {
      const col = document.createElement("div");
      col.classList.add("column");
      col.style.flex = `0 0 calc(${100 / count}% - 10px)`;
      col.textContent = "+";
      // Add column drag handle
      const colDragHandle = document.createElement("div");
      colDragHandle.className = "col-drag-handle";
      colDragHandle.title = "Drag to reorder column";
      colDragHandle.setAttribute("draggable", "true");
      colDragHandle.innerHTML = "&#x2630;";
      colDragHandle.addEventListener("dragstart", (e) => {
        col.classList.add("dragging-col");
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", "col");
        row._draggedCol = col;
      });
      colDragHandle.addEventListener("dragend", () => {
        col.classList.remove("dragging-col");
        row._draggedCol = null;
        row
          .querySelectorAll(".column")
          .forEach((c) => c.classList.remove("col-drop-target"));
      });
      col.addEventListener("dragover", (e) => {
        e.preventDefault();
        if (row._draggedCol && row._draggedCol !== col) {
          col.classList.add("col-drop-target");
        }
      });
      col.addEventListener("dragleave", () => {
        col.classList.remove("col-drop-target");
      });
      col.addEventListener("drop", (e) => {
        e.preventDefault();
        col.classList.remove("col-drop-target");
        if (row._draggedCol && row._draggedCol !== col) {
          row.insertBefore(row._draggedCol, col.nextSibling);
        }
      });
      col.appendChild(colDragHandle);
      row.appendChild(col);
    }
    // Add change layout button
    const changeBtn = document.createElement("button");
    changeBtn.className = "change-layout-btn";
    changeBtn.style.position = "absolute";
    changeBtn.style.left = "-11px";
    changeBtn.style.top = "-11px";
    changeBtn.style.height = "24px";
    changeBtn.style.borderRadius = "20px";
    changeBtn.style.background = "white";
    changeBtn.style.color = "#007bff";
    changeBtn.style.border = "2px solid #007bff";
    changeBtn.style.display = "flex";
    changeBtn.style.alignItems = "center";
    changeBtn.style.justifyContent = "center";
    changeBtn.style.fontWeight = "bold";
    changeBtn.style.fontSize = "14px";
    changeBtn.style.zIndex = "9";
    changeBtn.style.cursor = "pointer";
    changeBtn.style.padding = "0 10px";
    // Icon
    const icon = document.createElement("span");
    icon.textContent = "⟳";
    icon.style.marginRight = "6px";
    // Text
    const text = document.createElement("span");
    text.textContent = "Change layout";
    changeBtn.appendChild(icon);
    changeBtn.appendChild(text);
    changeBtn.addEventListener("mouseenter", () => {
      changeBtn.style.background = "#007bff";
      changeBtn.style.color = "white";
    });
    changeBtn.addEventListener("mouseleave", () => {
      changeBtn.style.background = "white";
      changeBtn.style.color = "#007bff";
    });
    changeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      showColumnSelector();
    });
    row.appendChild(changeBtn);
    updateRowControls();
  }

  showColumnSelector();
  wrapper.appendChild(row);
  return wrapper;
}

function updateRowControls() {
  document.querySelectorAll(".row-control").forEach((el) => el.remove());
  const rows = layoutContainer.querySelectorAll(".row-wrapper");

  // Show addRowBtn only if there are no rows
  if (rows.length === 0) {
    if (!layoutContainer.contains(addRowBtn)) {
      layoutContainer.appendChild(addRowBtn);
    }
    return;
  } else {
    if (layoutContainer.contains(addRowBtn)) {
      layoutContainer.removeChild(addRowBtn);
    }
  }

  rows.forEach((rowWrapper, index) => {
    // Add an ABOVE button for every row (only visible on hover via CSS)
    const addAbove = createRowControl("top");
    addAbove.addEventListener("click", () => {
      layoutContainer.insertBefore(createRow(), rowWrapper);
      updateRowControls();
    });
    rowWrapper.appendChild(addAbove);

    // Add a BELOW button for every row (only visible on hover via CSS)
    const addBelow = createRowControl("bottom");
    addBelow.addEventListener("click", () => {
      // Insert after this row
      if (rowWrapper.nextSibling) {
        layoutContainer.insertBefore(createRow(), rowWrapper.nextSibling);
      } else {
        layoutContainer.appendChild(createRow());
      }
      updateRowControls();
    });
    rowWrapper.appendChild(addBelow);
  });
}

addRowBtn.addEventListener("click", () => {
  const newRow = createRow();
  layoutContainer.appendChild(newRow);
  updateRowControls();
});
