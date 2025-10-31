const layoutContainer = document.getElementById("layoutContainer");
const addRowBtn = document.getElementById("addRowBtn");
const columnOptions = [1, 2, 3, 4, 6, 8];

function createRowControl(position = "top") {
  const control = document.createElement("div");
  control.classList.add("row-control", position);
  const btn = document.createElement("div");
  btn.className = "btn";
  // Font Awesome icon for add
  const icon = document.createElement("i");
  icon.className = "fa fa-plus";
  icon.setAttribute("aria-hidden", "true");
  btn.appendChild(icon);
  const text = document.createElement("span");
  text.textContent = position === "top" ? "Add Row Above" : "Add Row Below";
  btn.appendChild(text);
  control.appendChild(btn);
  return control;
}

// Helper to animate row removal
function animateRowRemove(rowElem, callback) {
  rowElem.classList.add("row-animate-out");
  rowElem.addEventListener("animationend", function handler() {
    rowElem.removeEventListener("animationend", handler);
    if (typeof callback === "function") callback();
  });
}

function createRow() {
  const wrapper = document.createElement("div");
  wrapper.classList.add("row-wrapper");

  // Drag and drop for rows (handle visibility managed by updateRowControls)
  let rowDragHandle = null;
  function createRowDragHandle() {
    const handle = document.createElement("div");
    handle.className = "row-drag-handle";
    handle.title = "Drag to reorder row";
    handle.setAttribute("draggable", "true");
    handle.innerHTML = `<svg width="24" height="36" viewBox="0 0 24 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="7" cy="9" r="2" fill="#888"/>
      <circle cx="17" cy="9" r="2" fill="#888"/>
      <circle cx="7" cy="18" r="2" fill="#888"/>
      <circle cx="17" cy="18" r="2" fill="#888"/>
      <circle cx="7" cy="27" r="2" fill="#888"/>
      <circle cx="17" cy="27" r="2" fill="#888"/>
    </svg>`;
    handle.addEventListener("dragstart", (e) => {
      wrapper.classList.add("dragging-row");
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", "row");
      window._draggedRow = wrapper;
    });
    handle.addEventListener("dragend", () => {
      wrapper.classList.remove("dragging-row");
      window._draggedRow = null;
      document
        .querySelectorAll(".row-wrapper")
        .forEach((w) => w.classList.remove("row-drop-target"));
    });
    return handle;
  }
  rowDragHandle = createRowDragHandle();
  wrapper.addEventListener("dragover", (e) => {
    e.preventDefault();
    if (window._draggedRow && window._draggedRow !== wrapper) {
      wrapper.classList.add("row-drop-target");
      // Live reordering: move the dragged row before or after hovered row
      const rect = wrapper.getBoundingClientRect();
      const mouseY = e.clientY;
      const rowCenter = rect.top + rect.height / 2;
      const parent = wrapper.parentNode;
      if (mouseY > rowCenter) {
        // Dragging down: move after hovered row
        if (window._draggedRow !== wrapper.nextSibling) {
          parent.insertBefore(window._draggedRow, wrapper.nextSibling);
        }
      } else {
        // Dragging up: move before hovered row
        if (window._draggedRow !== wrapper) {
          parent.insertBefore(window._draggedRow, wrapper);
        }
      }
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
      // If dropping on the last row and dragging downward, append to end
      if (!wrapper.nextSibling) {
        parent.appendChild(window._draggedRow);
      } else {
        parent.insertBefore(window._draggedRow, wrapper);
      }
      updateRowControls();
    }
  });

  // Delete button (Font Awesome icon and text)
  const deleteBtn = document.createElement("button");
  deleteBtn.classList.add("delete-btn");
  const delIcon = document.createElement("i");
  delIcon.className = "fa fa-trash";
  delIcon.setAttribute("aria-hidden", "true");
  deleteBtn.appendChild(delIcon);
  const delText = document.createElement("span");
  delText.textContent = "Delete Row";
  deleteBtn.appendChild(delText);
  deleteBtn.addEventListener("click", () => {
    animateRowRemove(wrapper, () => {
      wrapper.remove();
      updateRowControls();
    });
  });

  const row = document.createElement("div");
  row.classList.add("row");

  function showColumnSelector() {
    row.innerHTML = "";
    // Only show row drag handle if more than one row exists
    if (layoutContainer.querySelectorAll(".row-wrapper").length > 1) {
      row.appendChild(rowDragHandle);
    }
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
    if (layoutContainer.querySelectorAll(".row-wrapper").length > 1) {
      row.appendChild(rowDragHandle);
    }
    row.appendChild(deleteBtn);
    const columns = [];
    for (let i = 0; i < count; i++) {
      const col = document.createElement("div");
      col.classList.add("column", `col-${count}`);
      // Show column number for testing drag
      col.textContent = (i + 1).toString();
      // Add column drag handle only if more than one column
      if (count > 1) {
        const colDragHandle = document.createElement("div");
        colDragHandle.className = "col-drag-handle";
        colDragHandle.title = "Drag to reorder column";
        colDragHandle.setAttribute("draggable", "true");
        colDragHandle.innerHTML = `<svg width="36" height="24" viewBox="0 0 36 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:block;margin:auto;">
          <circle cx="7" cy="8" r="2" fill="#888"/>
          <circle cx="18" cy="8" r="2" fill="#888"/>
          <circle cx="29" cy="8" r="2" fill="#888"/>
          <circle cx="7" cy="18" r="2" fill="#888"/>
          <circle cx="18" cy="18" r="2" fill="#888"/>
          <circle cx="29" cy="18" r="2" fill="#888"/>
        </svg>`;
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
            // Determine mouse position relative to the hovered column
            const rect = col.getBoundingClientRect();
            const mouseX = e.clientX;
            const colCenter = rect.left + rect.width / 2;
            if (mouseX > colCenter) {
              // Dragging right: move after hovered column
              if (row._draggedCol !== col.nextSibling) {
                row.insertBefore(row._draggedCol, col.nextSibling);
              }
            } else {
              // Dragging left: move before hovered column
              if (row._draggedCol !== col) {
                row.insertBefore(row._draggedCol, col);
              }
            }
          }
        });
        col.addEventListener("dragleave", () => {
          col.classList.remove("col-drop-target");
        });
        col.addEventListener("drop", (e) => {
          e.preventDefault();
          col.classList.remove("col-drop-target");
          if (row._draggedCol && row._draggedCol !== col) {
            // If dropping on the last column, insert after it (at the end)
            if (!col.nextSibling) {
              row.insertBefore(row._draggedCol, null);
            } else {
              row.insertBefore(row._draggedCol, col);
            }
          }
        });
        col.appendChild(colDragHandle);
      }
      columns.push(col);
    }
    columns.forEach((col) => row.appendChild(col));
    // Add change layout button (Font Awesome icon and text)
    const changeBtn = document.createElement("button");
    changeBtn.className = "change-layout-btn";
    const changeIcon = document.createElement("i");
    changeIcon.className = "fa fa-random";
    changeIcon.setAttribute("aria-hidden", "true");
    changeBtn.appendChild(changeIcon);
    const changeText = document.createElement("span");
    changeText.textContent = "Change layout";
    changeBtn.appendChild(changeText);
    changeBtn.addEventListener("mouseenter", () => {
      changeBtn.classList.add("change-layout-btn-hover");
    });
    changeBtn.addEventListener("mouseleave", () => {
      changeBtn.classList.remove("change-layout-btn-hover");
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

  // Remove all existing row drag handles
  rows.forEach((rowWrapper) => {
    const existingHandle = rowWrapper.querySelector(".row-drag-handle");
    if (existingHandle) existingHandle.remove();
  });

  // Add row drag handle to all rows if more than one row exists
  if (rows.length > 1) {
    rows.forEach((rowWrapper) => {
      // Only add if not present
      if (!rowWrapper.querySelector(".row-drag-handle")) {
        const handle = document.createElement("div");
        handle.className = "row-drag-handle";
        handle.title = "Drag to reorder row";
        handle.setAttribute("draggable", "true");
        handle.innerHTML = `<svg width="24" height="36" viewBox="0 0 24 36" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="7" cy="9" r="2" fill="#888"/>
          <circle cx="17" cy="9" r="2" fill="#888"/>
          <circle cx="7" cy="18" r="2" fill="#888"/>
          <circle cx="17" cy="18" r="2" fill="#888"/>
          <circle cx="7" cy="27" r="2" fill="#888"/>
          <circle cx="17" cy="27" r="2" fill="#888"/>
        </svg>`;
        handle.addEventListener("dragstart", (e) => {
          rowWrapper.classList.add("dragging-row");
          e.dataTransfer.effectAllowed = "move";
          e.dataTransfer.setData("text/plain", "row");
          window._draggedRow = rowWrapper;
        });
        handle.addEventListener("dragend", () => {
          rowWrapper.classList.remove("dragging-row");
          window._draggedRow = null;
          document
            .querySelectorAll(".row-wrapper")
            .forEach((w) => w.classList.remove("row-drop-target"));
        });
        // Insert as first child if not present
        rowWrapper.firstChild
          ? rowWrapper.insertBefore(handle, rowWrapper.firstChild)
          : rowWrapper.appendChild(handle);
      }
    });
  }

  rows.forEach((rowWrapper, index) => {
    // Add an ABOVE button for every row (only visible on hover via CSS)
    const addAbove = createRowControl("top");
    addAbove.addEventListener("click", () => {
      const newRow = createRow();
      newRow.classList.add("row-animate-in");
      layoutContainer.insertBefore(newRow, rowWrapper);
      updateRowControls();
      setTimeout(() => newRow.classList.remove("row-animate-in"), 400);
    });
    rowWrapper.appendChild(addAbove);

    // Add a BELOW button for every row (only visible on hover via CSS)
    const addBelow = createRowControl("bottom");
    addBelow.addEventListener("click", () => {
      const newRow = createRow();
      newRow.classList.add("row-animate-in");
      // Insert after this row
      if (rowWrapper.nextSibling) {
        layoutContainer.insertBefore(newRow, rowWrapper.nextSibling);
      } else {
        layoutContainer.appendChild(newRow);
      }
      updateRowControls();
      setTimeout(() => newRow.classList.remove("row-animate-in"), 400);
    });
    rowWrapper.appendChild(addBelow);
  });
}

addRowBtn.addEventListener("click", () => {
  const newRow = createRow();
  newRow.classList.add("row-animate-in");
  layoutContainer.appendChild(newRow);
  updateRowControls();
  setTimeout(() => newRow.classList.remove("row-animate-in"), 400);
});
